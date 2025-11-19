# Feature Specification: Mandatory Student PIN Authentication

**Feature Branch**: `002-student-pin-auth`
**Created**: 2025-11-19
**Status**: Draft
**Parent Feature**: 001-security-refactor
**Input**: "Students must authenticate with mandatory PIN to prevent impersonation on shared laptops. Instructors can reset PINs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Time Student Registration with PIN (Priority: P0)

As a student using the quiz system for the first time, I need to create a secure 4-digit PIN when I first log in so that only I can access my quiz progress on shared computers.

**Why this priority**: Critical security - prevents student impersonation on shared laptops where service IDs are easily discoverable.

**Independent Test**: Can be fully tested by creating new student accounts and verifying PIN creation, storage, and validation.

**Acceptance Scenarios**:

1. **Given** I am a new student, **When** I enter my serviceId and name, **Then** I am prompted to create a 4-digit PIN
2. **Given** I enter a PIN with non-numeric characters, **When** I submit, **Then** I see an error "PIN must be exactly 4 digits"
3. **Given** I enter a valid 4-digit PIN, **When** I confirm it matches, **Then** my account is created and I am logged in
4. **Given** I enter mismatched PINs, **When** I submit, **Then** I see an error "PINs do not match" and must re-enter

---

### User Story 2 - Returning Student Login with PIN (Priority: P0)

As a returning student, I need to authenticate with my PIN every time I log in so that other students cannot access my quiz data by entering my service ID.

**Why this priority**: Core security requirement - without this, PIN protection is meaningless.

**Independent Test**: Can be tested by creating an account with PIN, logging out, then verifying only correct PIN grants access.

**Acceptance Scenarios**:

1. **Given** I have an existing account with PIN, **When** I enter my serviceId and name, **Then** I am prompted for my PIN
2. **Given** I enter the correct PIN, **When** I submit, **Then** I am logged in and see my quiz progress
3. **Given** I enter an incorrect PIN, **When** I submit, **Then** I see an error "Incorrect PIN" and login fails
4. **Given** I enter incorrect PIN 3 times, **When** I try again, **Then** I see "Too many attempts. Contact your instructor to reset."

---

### User Story 3 - Instructor PIN Reset (Priority: P0)

As an instructor, I need to reset a student's PIN when they forget it so that they can regain access to their quiz data without creating a new account.

**Why this priority**: Essential operational requirement - students will forget PINs, system must not lock them out permanently.

**Independent Test**: Can be tested by accessing instructor mode and verifying PIN reset functionality for existing student accounts.

**Acceptance Scenarios**:

1. **Given** I am in instructor mode, **When** I click "Reset PIN", **Then** I see a collapsible panel with student list and audit log
2. **Given** I select a student, **When** I confirm the reset, **Then** that student's PIN is cleared and they can create a new one
3. **Given** I reset a student's PIN, **When** that student logs in next, **Then** they are prompted to create a new PIN (as if first login)
4. **Given** I attempt to reset a PIN, **When** I am not in instructor mode, **Then** the option is not visible

---

### User Story 4 - Rate Limiting on PIN Attempts (Priority: P1)

As a system administrator, I need PIN authentication to be rate-limited so that brute-force attacks against student PINs are prevented.

**Why this priority**: Security hardening - 4-digit PIN has only 10,000 combinations, must prevent rapid guessing.

**Independent Test**: Can be tested by attempting multiple incorrect PINs and verifying lockout behavior and timing.

**Acceptance Scenarios**:

1. **Given** I enter incorrect PIN 3 times, **When** I try again, **Then** I am locked out for 30 seconds
2. **Given** I am locked out, **When** the lockout expires, **Then** I can attempt PIN entry again (with reset attempt counter)
3. **Given** I enter correct PIN after 2 failed attempts, **When** I log in successfully, **Then** the attempt counter is reset
4. **Given** lockout is active, **When** I check the login form, **Then** I see a countdown timer showing remaining lockout time

---

### User Story 5 - Migration for Existing Students (Priority: P1)

As an existing student with quiz data but no PIN, I need to create a PIN on my next login so that my existing progress is protected without losing any data.

**Why this priority**: Backward compatibility - cannot break existing student records when deploying PIN authentication.

**Independent Test**: Can be tested by migrating old-schema student records and verifying PIN creation flow on next login.

**Acceptance Scenarios**:

1. **Given** I have existing quiz data from before PIN feature, **When** I log in with serviceId + name, **Then** I am prompted to create a PIN
2. **Given** I create a PIN during migration, **When** I complete the process, **Then** all my existing quiz progress is retained
3. **Given** migration is in progress, **When** I cancel PIN creation, **Then** I cannot access the system (PIN is mandatory)
4. **Given** multiple students need migration, **When** instructor views student list, **Then** students without PINs are flagged for attention

---

### Edge Cases

- What happens when student closes browser during PIN creation (before confirmation)?
- How does system handle corrupted pinHash in IndexedDB?
- What happens when instructor resets PIN while student is logged in?
- How does system behave with multiple tabs attempting PIN entry simultaneously?
- What happens when browser crypto API is unavailable for hashing?
- What happens if student attempts to create PIN with leading zeros (e.g., "0042")?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require 4-digit numeric PIN for all student logins (mandatory, no opt-out)
- **FR-002**: System MUST hash PINs using simple 4-digit hash before storage (never store plaintext PINs)
- **FR-003**: System MUST use simple comparison for PIN validation (constant-time not required for convenience auth)
- **FR-004**: System MUST prompt new students to create PIN immediately after entering serviceId + name
- **FR-005**: System MUST require PIN confirmation (enter twice) during creation to prevent typos
- **FR-006**: System MUST validate PIN is exactly 4 numeric digits (reject letters, symbols, wrong length)
- **FR-007**: System MUST rate-limit PIN attempts: 3 failures = 30-second lockout
- **FR-008**: System MUST reset attempt counter on successful PIN authentication
- **FR-009**: System MUST provide instructor interface to reset student PINs via instructor mode
- **FR-010**: System MUST migrate existing student records (schema 1 → schema 2) on first login
- **FR-011**: System MUST preserve all quiz progress during PIN migration
- **FR-012**: System MUST display lockout countdown timer during rate-limit period
- **FR-013**: System MUST log PIN authentication events (without logging actual PIN values)
- **FR-014**: System MUST handle concurrent PIN attempts across multiple tabs gracefully
- **FR-015**: System MUST clear rate-limit state on instructor-initiated PIN reset

### Key Entities *(include if feature involves data)*

**Updated StudentRecord** (Schema v2):
```typescript
interface StudentRecord {
  schema: 2;  // Bumped from 1
  docId: string;
  release: ReleaseId;
  serviceId: ServiceId;
  name: string;
  pinHash: string;  // NEW: 4-digit hash of 4-digit PIN (convenience, not crypto)
  attempted: number;
  correct: number;
  updated: string;
  pages: Record<PageId, PageData>;
}
```

**PIN Authentication State** (sessionStorage):
```typescript
interface PinAttemptState {
  serviceId: ServiceId;
  attempts: number;  // Failed PIN attempts
  lockoutUntil: string | null;  // ISO timestamp or null
}
```

**Instructor PIN Reset Event**:
```typescript
interface PinResetEvent {
  serviceId: ServiceId;
  resetBy: 'instructor';  // Future: could add student self-reset
  timestamp: string;  // ISO 8601
}
```

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero successful student logins without valid PIN authentication
- **SC-002**: Zero plaintext PINs stored in IndexedDB or sessionStorage (4-digit hash only)
- **SC-003**: All PIN validations complete in <0.1ms (simple hash + comparison)
- **SC-004**: Rate limiting activates after exactly 3 failed attempts with 30-second lockout
- **SC-005**: 100% of existing student records successfully migrate to schema v2 with PIN prompt
- **SC-006**: Instructor PIN reset clears student's pinHash and allows new PIN creation
- **SC-007**: PIN creation rejects all non-numeric or non-4-digit inputs with clear error messages
- **SC-008**: All security events logged without exposing sensitive data (PINs, hashes)
- **SC-009**: Unit test coverage ≥90% for PIN authentication logic
- **SC-010**: E2E tests cover: new student signup, returning login, failed attempts, rate limiting, instructor reset

### User Experience Targets

- **UX-001**: PIN entry completes in <5 seconds for returning students
- **UX-002**: Error messages are clear and actionable ("PIN must be 4 digits" not "Invalid input")
- **UX-003**: Lockout countdown updates in real-time (no page refresh required)
- **UX-004**: Instructor PIN reset requires ≤3 clicks (expand panel → find student → reset)
- **UX-005**: Migration from schema v1 to v2 is transparent (no data loss, clear prompts)

## Technical Design Notes

### PIN Hashing Strategy
```typescript
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### Constant-Time PIN Verification
```typescript
async function verifyPin(enteredPin: string, storedHash: string): Promise<boolean> {
  const enteredHash = await hashPin(enteredPin);

  // Use crypto.subtle.timingSafeEqual equivalent
  // Fall back to byte-by-byte comparison with full iteration
  if (enteredHash.length !== storedHash.length) {
    // Still compute hash to maintain timing
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < enteredHash.length; i++) {
    mismatch |= enteredHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }

  return mismatch === 0;
}
```

### Schema Migration Path
```typescript
// Migration from schema 1 → 2
async function migrateStudentRecord(oldRecord: StudentRecordV1): Promise<StudentRecordV2> {
  // Prompt user for PIN creation via login flow
  // Do NOT auto-generate PIN - must be student-chosen

  return {
    ...oldRecord,
    schema: 2,
    pinHash: '', // Empty until student sets PIN on next login
    // Mark for PIN creation on next login
  };
}
```

### Rate Limiting Storage
- **Location**: sessionStorage (per-tab, cleared on tab close)
- **Key**: `qd:pin-attempts:{serviceId}`
- **Auto-cleanup**: Cleared on successful login or instructor reset

### Instructor Reset Interface
Add to `<qd-instructor-status>` component:
- Button: "Reset Student PIN"
- Modal: Student list with search/filter
- Action: Clear `pinHash` field in student record
- Confirmation: "PIN reset successful. Student will create new PIN on next login."

## Dependencies

- **Depends on**: 001-security-refactor (constant-time comparison, rate limiting utilities)
- **Blocks**: N/A (independent security enhancement)
- **Conflicts with**: N/A

## Out of Scope

- PIN recovery via email/SMS (offline system, no network)
- Biometric authentication (requires hardware support)
- Multi-factor authentication (complexity not justified for this use case)
- PIN history (preventing PIN reuse)
- Admin-configurable PIN length (fixed at 4 digits)
- Student-initiated PIN change (must contact instructor)

## Testing Strategy

### Unit Tests
- PIN hashing produces consistent SHA-256 output
- Constant-time comparison timing analysis
- Rate limiting state machine (attempts, lockout, reset)
- Schema migration preserves all quiz data
- PIN validation rejects invalid formats

### Integration Tests
- New student: serviceId → name → PIN creation → login
- Returning student: serviceId → name → PIN → login
- Failed attempts: 3 failures → lockout → countdown → retry
- Instructor reset: unlock → list students → reset → verify next login

### E2E Tests (Playwright)
- Full new student signup flow with PIN
- Login with correct/incorrect PIN
- Rate limiting visual feedback (lockout timer)
- Instructor PIN reset workflow
- Multi-tab PIN attempt coordination

## Rollout Plan

### Phase 1: Core PIN Authentication (Week 1)
- Update StudentRecord schema to v2 with `pinHash` field
- Implement PIN hashing and constant-time verification
- Add PIN input to login component
- Write unit tests for PIN logic

### Phase 2: Rate Limiting & UX (Week 1-2)
- Implement rate limiting with lockout countdown
- Add PIN confirmation during creation
- Enhance error messages and validation feedback
- Integration tests for rate limiting

### Phase 3: Migration & Instructor Tools (Week 2)
- Implement schema migration (v1 → v2)
- Add PIN reset to instructor status panel
- Test migration with existing demo data
- E2E tests for full workflows

### Phase 4: Security Audit & Hardening (Week 3)
- Security review of PIN handling
- Timing attack testing for constant-time verification
- Bundle size verification (<35KB limit)
- Performance testing (PIN hashing overhead)

## Open Questions

1. Should we allow instructor to view/audit student login attempts?
2. Should PIN lockout be per-serviceId globally or per-browser-tab?
3. Should we log PIN reset events for audit trail?
4. What happens if student forgets PIN AND instructor is unavailable?
5. Should we display "last successful login" timestamp for students?

---

**Approval Required From**: Product Owner, Security Lead, UX Lead
**Estimated Effort**: 2-3 weeks (1 developer)
**Risk Level**: Medium (schema migration, backward compatibility)
