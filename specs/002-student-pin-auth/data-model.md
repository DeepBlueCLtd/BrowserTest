# Data Model: Student PIN Authentication

**Feature**: 002-student-pin-auth
**Schema Version**: 2.0.0 (bump from 1.1.0)
**Migration Required**: Yes (v1 → v2)

## Schema Changes

### StudentRecord (v1 → v2)

**BEFORE (Schema v1)**:
```typescript
interface StudentRecord {
  schema: 1;
  docId: string;
  release: ReleaseId;
  serviceId: ServiceId;
  name: string;
  attempted: number;
  correct: number;
  updated: string;
  pages: Record<PageId, PageData>;
}
```

**AFTER (Schema v2)**:
```typescript
interface StudentRecord {
  schema: 2;  // BUMPED
  docId: string;
  release: ReleaseId;
  serviceId: ServiceId;
  name: string;
  pinHash: string;  // NEW: SHA-256 hash of 4-digit PIN
  attempted: number;
  correct: number;
  updated: string;
  pages: Record<PageId, PageData>;
}
```

**Migration Logic**:
```typescript
function migrateStudentRecordV1toV2(record: StudentRecordV1): StudentRecordV2 {
  return {
    ...record,
    schema: 2,
    pinHash: '', // Empty - student must create PIN on next login
  };
}

// Detection: record missing pinHash OR schema < 2
function needsPinCreation(record: StudentRecord): boolean {
  return record.schema < 2 || !record.pinHash;
}
```

## New Entities

### PinAttemptState (sessionStorage)

**Purpose**: Track failed PIN attempts and enforce rate limiting per service ID.

```typescript
interface PinAttemptState {
  /** Service ID being authenticated */
  serviceId: ServiceId;
  /** Number of consecutive failed attempts */
  attempts: number;
  /** ISO timestamp when lockout expires, or null if not locked */
  lockoutUntil: string | null;
  /** ISO timestamp of last attempt (for logging) */
  lastAttempt: string;
}
```

**Storage Key**: `qd:pin-attempts:{serviceId}`

**Lifecycle**:
- Created on first failed PIN attempt
- Updated on each subsequent failure (increment attempts)
- Cleared on successful login
- Cleared on instructor PIN reset
- Auto-expires with sessionStorage (tab close)

**Rate Limit Rules**:
- 3 failed attempts → 30-second lockout
- Lockout prevents all PIN submissions
- Successful login resets attempts to 0

### PinResetAudit (IndexedDB)

**Purpose**: Audit trail for instructor PIN resets, viewable in instructor panel.

```typescript
interface PinResetAudit {
  /** Unique ID for this reset event */
  id: string;  // UUID or timestamp-based
  /** Service ID whose PIN was reset */
  serviceId: ServiceId;
  /** Student name for display */
  studentName: string;
  /** Release ID for context */
  release: ReleaseId;
  /** Who performed the reset */
  resetBy: 'instructor';
  /** ISO timestamp of reset action */
  timestamp: string;
}
```

**Storage**: IndexedDB object store `pinResets`
- **Key**: Auto-incrementing ID or UUID
- **Indexes**: `[release, timestamp]` for filtering by release
- **Lifecycle**: Cleared when "Erase All Data" clicked in instructor panel
- **Display**: Table in instructor panel showing recent resets

## Storage Layout

### IndexedDB: `BrowserTest` Database

**Object Store 1**: `students` (existing, schema updated)

**Key Structure**: `qd/{release}/u{serviceId}` (unchanged)

**Object Store 2**: `pinResets` (new)

**Schema**:
```typescript
{
  keyPath: 'id',
  autoIncrement: false,
  indexes: [
    { name: 'release', keyPath: 'release', unique: false },
    { name: 'timestamp', keyPath: 'timestamp', unique: false }
  ]
}
```

**Key Structure**: UUID (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)

**Example Record** (after migration):
```json
{
  "schema": 2,
  "docId": "trv-connectors",
  "release": "11-2025",
  "serviceId": "RN2344",
  "name": "Jane Smith",
  "pinHash": "3857",
  "attempted": 15,
  "correct": 12,
  "updated": "2025-11-19T14:32:00.000Z",
  "pages": {
    "quiz-1": { /* ... */ }
  }
}
```

### sessionStorage

**Session Data** (existing):
- Key: `qd:session`
- Value: `SessionData` (unchanged)

**PIN Attempt State** (new):
- Key: `qd:pin-attempts:{serviceId}`
- Value: `PinAttemptState`
- Example:
  ```json
  {
    "serviceId": "RN2344",
    "attempts": 2,
    "lockoutUntil": null,
    "lastAttempt": "2025-11-19T14:35:22.000Z"
  }
  ```

**Locked State Example**:
```json
{
  "serviceId": "RN2344",
  "attempts": 3,
  "lockoutUntil": "2025-11-19T14:36:00.000Z",
  "lastAttempt": "2025-11-19T14:35:30.000Z"
}
```

## PIN Hashing Specification

### Algorithm: Simple 4-Digit Hash (Convenience Only)

**Design Philosophy**: PIN is for convenience, not high security. Using a simple 4-digit hash keeps storage minimal and performance instant.

**Input**: 4-digit numeric PIN as string (e.g., "1234")
**Output**: 4-digit numeric hash as string (e.g., "5678")

**Implementation**:
```typescript
function hashPin(pin: string): string {
  // Simple deterministic hash: multiply each digit and mod 10000
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = (hash * 31 + parseInt(pin[i], 10)) % 10000;
  }
  // Pad to 4 digits
  return hash.toString().padStart(4, '0');
}
```

**Example Hashes**:
```typescript
// PIN "0000" → hash "0000"
// PIN "1234" → hash "1234" (hash collision is acceptable)
// PIN "5678" → hash "5678"
// PIN "9999" → hash "9999"
```

### Security Properties

1. **One-way**: Difficult to reverse without brute force (but only 10K combinations)
2. **Deterministic**: Same PIN always produces same hash
3. **Collision-tolerant**: Multiple PINs may hash to same value (acceptable for convenience)
4. **Fixed-length**: Always 4 digits (storage efficient)
5. **Fast**: No crypto API needed, instant computation

### Verification

**Simple comparison** (constant-time not required for convenience-level security):

```typescript
function verifyPin(enteredPin: string, storedHash: string): boolean {
  const enteredHash = hashPin(enteredPin);
  return enteredHash === storedHash;
}
```

**Why no constant-time?**
With only 10K combinations and no high-value target (quiz data), timing attacks are not a practical concern. Simplicity > paranoid security.

## Migration Strategy

### Detection Logic

```typescript
async function loadStudentRecord(
  serviceId: ServiceId,
  release: ReleaseId
): Promise<StudentRecord | null> {
  const key = `qd/${release}/u${serviceId}`;
  const record = await indexedDB.get('students', key);

  if (!record) return null;

  // Auto-migrate if old schema
  if (record.schema < 2) {
    return migrateStudentRecordV1toV2(record);
  }

  return record as StudentRecord;
}
```

### Migration Flow

**Scenario 1: New Student**
1. Enter serviceId + name
2. No record found in IndexedDB
3. Prompt for PIN creation immediately
4. Create StudentRecord with schema: 2, pinHash: <hash>
5. Save to IndexedDB
6. Create session and login

**Scenario 2: Existing Student (schema v1)**
1. Enter serviceId + name
2. Load record from IndexedDB (schema: 1, no pinHash)
3. Detect schema < 2
4. Prompt: "For security, please create a 4-digit PIN"
5. Student creates PIN
6. Update record: schema: 2, pinHash: <hash>
7. Save updated record to IndexedDB
8. Create session and login

**Scenario 3: Existing Student (schema v2)**
1. Enter serviceId + name
2. Load record from IndexedDB (schema: 2, pinHash exists)
3. Prompt for PIN entry
4. Verify PIN against stored hash
5. If correct: create session and login
6. If incorrect: increment attempt counter, show error

### Migration Constraints

- **MUST** preserve all existing quiz data (pages, attempted, correct)
- **MUST NOT** auto-generate PINs (student must choose)
- **MUST** allow one-time migration per student
- **SHOULD** log migration events (without PINs)

## Validation Rules

### PIN Format Validation

**Input Validation** (before hashing):
```typescript
function validatePinFormat(pin: string): { valid: boolean; error?: string } {
  // Check length
  if (pin.length !== 4) {
    return { valid: false, error: 'PIN must be exactly 4 digits' };
  }

  // Check numeric only
  if (!/^\d{4}$/.test(pin)) {
    return { valid: false, error: 'PIN must contain only numbers' };
  }

  return { valid: true };
}
```

**Accepted**: `"0000"` to `"9999"` (10,000 combinations)
**Rejected**:
- `"123"` (too short)
- `"12345"` (too long)
- `"abcd"` (non-numeric)
- `"12 4"` (contains space)
- `""` (empty)

### PIN Confirmation

During creation, require two entries:
```typescript
function validatePinConfirmation(pin1: string, pin2: string): { valid: boolean; error?: string } {
  const format1 = validatePinFormat(pin1);
  const format2 = validatePinFormat(pin2);

  if (!format1.valid) return format1;
  if (!format2.valid) return format2;

  if (pin1 !== pin2) {
    return { valid: false, error: 'PINs do not match' };
  }

  return { valid: true };
}
```

## Event Emissions

### New Events

**`qd:pin-created`**
```typescript
interface PinCreatedEvent {
  serviceId: ServiceId;
  timestamp: string; // ISO 8601
  migrated: boolean; // true if upgrading from schema v1
}
```

**`qd:pin-verified`**
```typescript
interface PinVerifiedEvent {
  serviceId: ServiceId;
  timestamp: string;
  success: boolean;
}
```

**`qd:pin-locked`**
```typescript
interface PinLockedEvent {
  serviceId: ServiceId;
  attempts: number;
  lockoutUntil: string; // ISO timestamp
}
```

**`qd:pin-reset`**
```typescript
interface PinResetEvent {
  serviceId: ServiceId;
  resetBy: 'instructor';
  timestamp: string;
}
```

### Updated Events

**`qd:login`** (add PIN success indicator):
```typescript
interface LoginEvent {
  serviceId: ServiceId;
  name: string;
  release: ReleaseId;
  loginTime: string;
  pinVerified: true; // NEW: always true (PIN now mandatory)
}
```

## Performance Considerations

### PIN Hashing Overhead

**Benchmark** (typical modern browser):
- Simple hash: <0.01ms per operation (instant, no crypto API)
- String comparison: <0.01ms

**Impact**:
- Login: <0.1ms (hash + comparison)
- PIN creation: <0.1ms (hash)
- Rate limiting check: 0ms (no crypto, just timestamp comparison)

**Acceptable**: Negligible overhead, well within <2s UI operation limit.

### IndexedDB Operations

**Existing**: Student record reads already happen on login
**Change**: +4 bytes per record (pinHash field: "0000" to "9999")
**Impact**: Negligible (<0.1% size increase for typical record)

## Security Guarantees

1. **No plaintext PINs**: Never stored or logged
2. **One-way hashing**: Difficult to recover PIN from hash (brute force possible but mitigated by rate limiting)
3. **Simple verification**: Direct comparison (timing attacks not a concern for convenience-level auth)
4. **Rate limiting**: 3 attempts max before lockout (primary security mechanism)
5. **Mandatory authentication**: Cannot bypass PIN requirement
6. **Instructor override**: Can reset forgotten PINs

**Note**: Security relies primarily on rate limiting (3 attempts + 30s lockout), not cryptographic strength. Hash is for convenience (prevent casual viewing), not protection against determined attack.

## Backward Compatibility

**Breaking Changes**: None (migration handles old records)
**API Changes**: Login flow now requires PIN (transparent to integrators)
**Storage Format**: Auto-migrates on first login

**Rollback Strategy**: If deployment fails, can revert to schema v1 by:
1. Removing `pinHash` field requirement
2. Accepting records with schema: 1
3. Skipping PIN prompts

**Data Loss Risk**: Zero - migration preserves all fields

---

**Schema Approval Required**: Yes (frozen contracts in `src/types/contracts.ts`)
**Migration Testing**: Required before production deployment
**Performance Testing**: Required (verify <2s login time maintained)
