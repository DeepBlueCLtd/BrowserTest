# Research: Encrypt Stored Data

**Feature**: 009-encrypt-stored-data
**Date**: 2025-11-27

## Research Questions

### 1. Obfuscation Algorithm Selection

**Context**: Need deterrence-level obfuscation (not cryptographic security) that works offline, adds minimal bundle size, and performs under 50ms.

**Decision**: XOR cipher with base64 encoding

**Rationale**:
- **Lightweight**: XOR is a single bitwise operation; base64 is built into browsers (`btoa`/`atob`)
- **Zero dependencies**: No crypto libraries needed, keeps bundle small
- **Reversible**: Symmetric operation - same function encodes and decodes
- **Sufficient deterrence**: Data appears as random base64 string in DevTools; decoding requires knowing the key and algorithm
- **Fast**: Sub-millisecond for typical StudentRecord sizes (~1-5KB)

**Alternatives considered**:
- **AES/crypto.subtle**: Overkill for deterrence; adds complexity; async API complicates storage layer
- **ROT13**: Too recognizable; easily reversed by inspection
- **Simple base64 only**: Not deterrence - too easily recognized and decoded
- **LZString compression + base64**: More obscure but compression adds overhead and complexity

**Implementation approach**:
```typescript
// Key derivation: simple hash of Release ID
function deriveKey(releaseId: string): string {
  // Use repeating key pattern for XOR
  return releaseId.split('').map(c => c.charCodeAt(0)).join('');
}

// Encode: JSON → XOR with key → base64
function encode(data: object, key: string): string {
  const json = JSON.stringify(data);
  const xored = xorString(json, key);
  return btoa(xored);
}

// Decode: base64 → XOR with key → JSON
function decode(encoded: string, key: string): object {
  const xored = atob(encoded);
  const json = xorString(xored, key); // XOR is symmetric
  return JSON.parse(json);
}
```

---

### 2. Format Detection for Fail-Fast Behavior

**Context**: FR-009 requires fail-fast with clear error if format mismatch detected (obfuscated data read with obfuscation off, or vice versa).

**Decision**: Magic prefix marker

**Rationale**:
- **Reliable detection**: Obfuscated data starts with a unique prefix (e.g., `"OBF:"`)
- **Fast**: Single string prefix check, O(1)
- **Unambiguous**: Plain JSON never starts with `OBF:`; obfuscated always does
- **Error-friendly**: Can generate specific error messages

**Alternatives considered**:
- **Try JSON.parse, catch error**: Unreliable - some obfuscated strings might accidentally parse as valid JSON
- **Check for valid JSON structure**: Still unreliable; complex to implement
- **Schema version field**: Requires parsing before detection; adds overhead

**Implementation approach**:
```typescript
const OBFUSCATION_PREFIX = 'OBF:';

function isObfuscated(stored: unknown): boolean {
  return typeof stored === 'string' && stored.startsWith(OBFUSCATION_PREFIX);
}

// On read:
if (ENCRYPT_STORAGE && !isObfuscated(stored)) {
  throw new StorageFormatError('Unobfuscated data found with ENCRYPT_STORAGE enabled');
}
if (!ENCRYPT_STORAGE && isObfuscated(stored)) {
  throw new StorageFormatError('Obfuscated data found with ENCRYPT_STORAGE disabled');
}
```

---

### 3. Migration Utility Design

**Context**: FR-007 requires one-time migration utility to convert existing unobfuscated data before enabling obfuscation.

**Decision**: Console-based migration function with dry-run support

**Rationale**:
- **Manual trigger**: Migration is explicit, not automatic - aligns with fail-fast philosophy
- **Reversible**: Can migrate in either direction (encrypt or decrypt all records)
- **Safe**: Dry-run mode shows what would change without modifying data
- **Debuggable**: Console output shows progress and any errors

**Alternatives considered**:
- **Automatic migration on first read**: Rejected per clarification - fail-fast is preferred
- **UI-based migration**: Overkill for one-time operation; adds UI complexity
- **External script**: Would require separate tooling; in-browser is simpler

**Implementation approach**:
```typescript
// Called from browser console or test setup
async function migrateStorage(
  adapter: IndexedDBStorageAdapter,
  direction: 'encrypt' | 'decrypt',
  options: { dryRun?: boolean; releaseId: string }
): Promise<MigrationResult> {
  const students = await adapter.getAllStudents();
  const key = deriveKey(options.releaseId);
  const results = { migrated: 0, skipped: 0, errors: [] };

  for (const student of students) {
    const isCurrentlyObfuscated = isObfuscated(/* raw stored value */);

    if (direction === 'encrypt' && !isCurrentlyObfuscated) {
      if (!options.dryRun) {
        // Re-save with obfuscation
      }
      results.migrated++;
    } else if (direction === 'decrypt' && isCurrentlyObfuscated) {
      if (!options.dryRun) {
        // Re-save without obfuscation
      }
      results.migrated++;
    } else {
      results.skipped++;
    }
  }

  return results;
}
```

---

### 4. Storage Adapter Integration

**Context**: Need to integrate obfuscation into existing IndexedDBStorageAdapter without breaking API.

**Decision**: Wrapper adapter pattern

**Rationale**:
- **Non-invasive**: Existing adapter unchanged; new wrapper adds obfuscation layer
- **Testable**: Can test obfuscation logic independently of IndexedDB
- **Configurable**: ENCRYPT_STORAGE flag checked once at adapter creation
- **Transparent**: Same StorageAdapter interface; callers unaware of obfuscation

**Implementation approach**:
```typescript
// New file: src/services/storage/encrypted-adapter.ts
export class EncryptedStorageAdapter implements StorageAdapter {
  constructor(
    private inner: IndexedDBStorageAdapter,
    private releaseId: string,
    private encryptionEnabled: boolean
  ) {}

  async getStudent(release: ReleaseId, serviceId: ServiceId): Promise<StudentRecord | null> {
    const raw = await this.inner.getStudent(release, serviceId);
    if (!raw) return null;

    // Format check + decode if needed
    return this.decode(raw);
  }

  async saveStudent(record: StudentRecord): Promise<void> {
    const toStore = this.encryptionEnabled
      ? this.encode(record)
      : record;
    await this.inner.saveStudent(toStore);
  }
}
```

---

## Summary

| Topic | Decision | Key Benefit |
|-------|----------|-------------|
| Algorithm | XOR + base64 | Zero dependencies, fast, sufficient deterrence |
| Format detection | Magic prefix `OBF:` | Reliable, O(1) check, clear errors |
| Migration | Console function with dry-run | Explicit, safe, debuggable |
| Integration | Wrapper adapter pattern | Non-invasive, testable, transparent |

All technical unknowns resolved. Ready for Phase 1 design.
