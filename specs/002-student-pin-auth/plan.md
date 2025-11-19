# Implementation Plan: Student PIN Authentication

**Feature**: 002-student-pin-auth
**Branch**: `002-student-pin-auth`
**Estimated Duration**: 2-3 weeks
**Dependencies**: 001-security-refactor (constant-time comparison utilities)

## Phase Overview

### Phase 1: Core PIN Infrastructure (Days 1-3)
- Update contracts with schema v2
- Implement PIN hashing and validation
- Write unit tests for crypto operations

### Phase 2: Login Flow Integration (Days 4-6)
- Add PIN prompts to login component
- Implement rate limiting
- Integration tests for authentication

### Phase 3: Migration & Instructor Tools (Days 7-9)
- Schema migration logic
- Instructor PIN reset interface
- Migration testing with demo data

### Phase 4: Testing & Hardening (Days 10-12)
- E2E test coverage
- Security audit
- Performance optimization
- Documentation

---

## Detailed Task Breakdown

### Phase 1: Core PIN Infrastructure

#### Task 1.1: Update Type Contracts
**File**: `src/types/contracts.ts`
**Effort**: 1 hour

**Changes**:
```typescript
// Bump schema version
export const CURRENT_SCHEMA_VERSION = 2;

// Update StudentRecord interface
export interface StudentRecord {
  schema: number;  // Must be 2 for PIN auth
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

// New interface for PIN attempt tracking
export interface PinAttemptState {
  serviceId: ServiceId;
  attempts: number;
  lockoutUntil: string | null;
  lastAttempt: string;
}

// New storage key
export const STORAGE_KEYS = {
  SESSION: 'qd:session',
  CACHE: 'qd:cache',
  PIN_ATTEMPTS: 'qd:pin-attempts', // NEW
} as const;
```

**Tests**:
- TypeScript compilation succeeds
- No breaking changes to existing types

#### Task 1.2: Implement PIN Utilities
**File**: `src/utils/pin.ts` (new)
**Effort**: 4 hours

**Functions**:
```typescript
// Hash a PIN using simple 4-digit hash (convenience, not crypto)
export function hashPin(pin: string): string;

// Validate PIN format (4 digits, numeric only)
export function validatePinFormat(pin: string): ValidationResult;

// Validate PIN confirmation (match + format)
export function validatePinConfirmation(pin1: string, pin2: string): ValidationResult;

// Verify PIN using simple comparison
export function verifyPin(enteredPin: string, storedHash: string): boolean;
```

**Unit Tests** (`tests/unit/utils/pin.test.ts`):
- ✅ hashPin produces consistent 4-digit output
- ✅ hashPin("1234") produces valid 4-digit hash
- ✅ hashPin is deterministic (same input → same output)
- ✅ validatePinFormat rejects non-4-digit inputs
- ✅ validatePinFormat rejects non-numeric inputs
- ✅ validatePinFormat accepts "0000" through "9999"
- ✅ validatePinConfirmation detects mismatches
- ✅ verifyPin returns true for correct PIN
- ✅ verifyPin returns false for incorrect PIN
- ✅ verifyPin completes in <0.1ms (performance test)

**Acceptance**: All unit tests green, coverage ≥95%

#### Task 1.3: Implement Rate Limiting Service
**File**: `src/services/pin-rate-limiter.ts` (new)
**Effort**: 3 hours

**Class**:
```typescript
export class PinRateLimiter {
  // Check if service ID is currently locked
  isLocked(serviceId: ServiceId): boolean;

  // Get remaining lockout time in seconds
  getRemainingLockout(serviceId: ServiceId): number;

  // Record a failed PIN attempt
  recordFailure(serviceId: ServiceId): void;

  // Reset attempts on successful login
  reset(serviceId: ServiceId): void;

  // Get current attempt state
  getAttemptState(serviceId: ServiceId): PinAttemptState | null;
}
```

**Unit Tests** (`tests/unit/services/pin-rate-limiter.test.ts`):
- ✅ isLocked returns false initially
- ✅ 3 failures trigger 30-second lockout
- ✅ isLocked returns true during lockout
- ✅ getRemainingLockout counts down correctly
- ✅ Lockout expires after 30 seconds
- ✅ reset() clears attempt counter
- ✅ State persists in sessionStorage
- ✅ Multiple service IDs tracked independently

**Acceptance**: All unit tests green, coverage ≥90%

---

### Phase 2: Login Flow Integration

#### Task 2.1: Update SessionService for PIN
**File**: `src/services/session.ts`
**Effort**: 2 hours

**Changes**:
```typescript
export class SessionService {
  // NEW: Verify PIN before creating session
  async authenticateStudent(
    serviceId: ServiceId,
    name: string,
    pin: string,
    release: ReleaseId
  ): Promise<{ success: boolean; session?: SessionData; error?: string }>;

  // Existing: createSession (now called after PIN verification)
  createSession(serviceId: ServiceId, name: string, release: ReleaseId): SessionData;
}
```

**Integration Tests** (`tests/integration/services/session-pin.test.ts`):
- ✅ authenticateStudent succeeds with correct PIN
- ✅ authenticateStudent fails with incorrect PIN
- ✅ authenticateStudent respects rate limiting
- ✅ Session created only after PIN verification

**Acceptance**: Integration tests green

#### Task 2.2: Update Login Component - PIN Entry
**Files**:
- `src/components/qd-login.ts` (update existing)
- `src/components/qd-pin-prompt.ts` (new subcomponent)

**Effort**: 6 hours

**UI Flow**:
```
1. Student enters serviceId + name → Submit
2. System checks IndexedDB:
   - No record → Show PIN creation form
   - Record exists, no pinHash → Show PIN creation form (migration)
   - Record exists, has pinHash → Show PIN entry form
3. PIN creation form:
   - Input: Enter PIN (4 digits)
   - Input: Confirm PIN (4 digits)
   - Button: Create PIN
   - Validation: Format + match
4. PIN entry form:
   - Input: Enter PIN (4 digits)
   - Button: Login
   - Link: "Forgot PIN? Contact instructor"
   - Error: Show attempts remaining
   - Lockout: Show countdown timer
```

**Lit Component** (`qd-pin-prompt`):
```typescript
@customElement('qd-pin-prompt')
export class PinPromptElement extends LitElement {
  @property() mode: 'create' | 'verify' = 'verify';
  @property() serviceId: ServiceId = '';
  @property() attemptsRemaining: number = 3;
  @property() lockoutSeconds: number = 0;

  private handlePinSubmit(pin: string): void;
  private handlePinCreate(pin: string, confirm: string): void;
}
```

**Component Tests** (`tests/unit/components/qd-pin-prompt.test.ts`):
- ✅ Renders create mode with two input fields
- ✅ Renders verify mode with one input field
- ✅ Validates PIN format on input
- ✅ Shows error for non-numeric input
- ✅ Shows error for mismatched confirmation
- ✅ Disables submit during lockout
- ✅ Displays countdown timer during lockout
- ✅ Emits qd:pin-created event on successful creation
- ✅ Emits qd:pin-verified event on successful verification

**Acceptance**: Component tests green, visual regression in Storybook

#### Task 2.3: Integrate PIN Flow into Login
**File**: `src/components/qd-login.ts`
**Effort**: 4 hours

**Updated Workflow**:
```typescript
class QdLoginElement extends LitElement {
  private async handleStudentLogin(serviceId: string, name: string) {
    // 1. Load student record
    const record = await storage.loadStudent(serviceId, release);

    // 2. Determine flow
    if (!record || !record.pinHash) {
      this.showPinCreation(serviceId, name);
    } else {
      this.showPinVerification(serviceId, name, record);
    }
  }

  private async handlePinCreation(serviceId: string, name: string, pin: string) {
    // Hash PIN, create record, emit event
  }

  private async handlePinVerification(serviceId: string, pin: string, record: StudentRecord) {
    // Verify PIN, handle rate limiting, create session
  }
}
```

**Integration Tests** (`tests/integration/components/login-pin.test.ts`):
- ✅ New student → PIN creation → login
- ✅ Existing student (v1) → PIN creation (migration) → login
- ✅ Existing student (v2) → PIN entry → login
- ✅ Wrong PIN → error + attempts counter
- ✅ 3 wrong PINs → lockout + timer
- ✅ Lockout expires → retry allowed

**Acceptance**: Integration tests green, no regressions in existing login tests

---

### Phase 3: Migration & Instructor Tools

#### Task 3.1: Schema Migration Logic
**File**: `src/services/storage/indexeddb.ts`
**Effort**: 3 hours

**Functions**:
```typescript
export class IndexedDBAdapter {
  // Auto-detect and migrate old records
  async loadStudentRecord(
    serviceId: ServiceId,
    release: ReleaseId
  ): Promise<StudentRecord | null> {
    const record = await this.db.get('students', key);
    if (!record) return null;

    // Migrate if needed
    if (record.schema < 2) {
      return this.migrateToSchemaV2(record);
    }

    return record;
  }

  // Migration helper
  private migrateToSchemaV2(oldRecord: any): StudentRecord {
    return {
      ...oldRecord,
      schema: 2,
      pinHash: '', // Empty - triggers PIN creation flow
    };
  }
}
```

**Migration Tests** (`tests/integration/storage/migration.test.ts`):
- ✅ Schema v1 record migrated to v2 on load
- ✅ All quiz data preserved during migration
- ✅ pinHash empty after migration
- ✅ Migrated record triggers PIN creation flow
- ✅ Multiple students migrate independently

**Acceptance**: Migration tests green, demo data migrates successfully

#### Task 3.2: Instructor PIN Reset Interface
**File**: `src/components/qd-instructor-status.ts`
**Effort**: 6 hours

**UI Addition**:
```html
<!-- Add to instructor status panel (single button) -->
<button @click="${this.togglePinResetPanel}">
  Reset PIN ${this.pinResetExpanded ? '▼' : '▶'}
</button>

<!-- Collapsible panel (inline, not modal) -->
<div class="pin-reset-panel" ?hidden="${!this.pinResetExpanded}">
  <!-- Student List Section -->
  <section class="students-section">
    <h3>Students</h3>
    <input type="text" placeholder="Search by name or service ID"
           @input="${this.filterStudents}" />
    <ul class="student-list">
      ${filteredStudents.map(s => html`
        <li>
          <span>${s.name} (${s.serviceId.slice(-4)})</span>
          <button @click="${() => this.resetPin(s.serviceId)}"
                  class="reset-btn-small">
            Reset PIN
          </button>
        </li>
      `)}
    </ul>
  </section>

  <!-- Audit Log Section -->
  <section class="audit-log-section">
    <h3>PIN Reset Audit Log</h3>
    <div class="audit-log-scroll">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Student Name</th>
            <th>Service ID</th>
          </tr>
        </thead>
        <tbody>
          ${resetLog.map(r => html`
            <tr>
              <td>${formatTimestamp(r.timestamp)}</td>
              <td>${r.studentName}</td>
              <td>${r.serviceId.slice(-4)}</td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  </section>
</div>
```

**CSS Styling**:
```css
.pin-reset-panel {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-top: 0.5rem;
  background: #f9f9f9;
}

.students-section, .audit-log-section {
  margin-bottom: 1rem;
}

.student-list {
  max-height: 200px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
}

.student-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.reset-btn-small {
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
}

.audit-log-scroll {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #ddd;
}

.audit-log-scroll table {
  width: 100%;
  font-size: 0.9rem;
}

.audit-log-scroll th {
  position: sticky;
  top: 0;
  background: #f0f0f0;
}
```

**Implementation**:
```typescript
class QdInstructorStatusElement extends LitElement {
  private async resetPin(serviceId: ServiceId): Promise<void> {
    // 1. Load student record
    const record = await storage.loadStudent(serviceId, release);
    if (!record) return;

    // 2. Clear PIN hash
    record.pinHash = '';
    record.updated = new Date().toISOString();

    // 3. Save updated record
    await storage.saveStudent(record);

    // 4. Log reset to audit trail
    const auditEntry: PinResetAudit = {
      id: crypto.randomUUID(),
      serviceId,
      studentName: record.name,
      release,
      resetBy: 'instructor',
      timestamp: new Date().toISOString(),
    };
    await storage.savePinResetAudit(auditEntry);

    // 5. Clear rate limit state
    rateLimiter.reset(serviceId);

    // 6. Emit event
    this.dispatchEvent(new CustomEvent('qd:pin-reset', {
      detail: { serviceId, timestamp: new Date().toISOString() }
    }));

    // 7. Show confirmation
    alert('PIN reset successful. Student will create new PIN on next login.');
  }
}
```

**Component Tests** (`tests/unit/components/qd-instructor-status.test.ts`):
- ✅ Reset PIN button visible only in instructor mode
- ✅ Panel collapses/expands on button click
- ✅ Panel hidden by default
- ✅ Student list populated from IndexedDB
- ✅ Search filter works (name + serviceId)
- ✅ Student list scrollable when >10 students
- ✅ Reset clears pinHash and saves record
- ✅ Reset creates audit log entry
- ✅ Reset clears rate limit state
- ✅ Confirmation message displayed
- ✅ qd:pin-reset event emitted
- ✅ Audit log displays reset history in scrollable table
- ✅ Audit log cleared when "Erase All Data" clicked
- ✅ Panel takes minimal space when collapsed

**E2E Test** (`tests/e2e/workflows/instructor-pin-reset.spec.ts`):
- ✅ Full workflow: unlock instructor → expand panel → search → reset → verify next login
- ✅ Panel collapse/expand functionality
- ✅ Audit log updates immediately after reset

**Acceptance**: Component tests + E2E test green

---

### Phase 4: Testing & Hardening

#### Task 4.1: E2E Test Coverage
**Files**: `tests/e2e/workflows/student-pin-auth.spec.ts`
**Effort**: 6 hours

**Test Scenarios**:
```typescript
describe('Student PIN Authentication', () => {
  test('New student: serviceId → name → create PIN → login', async () => {
    // 1. Navigate to demo page
    // 2. Enter serviceId + name
    // 3. Verify PIN creation prompt appears
    // 4. Enter PIN twice
    // 5. Verify login success
    // 6. Verify status panel shows quiz progress
  });

  test('Returning student: serviceId → name → enter PIN → login', async () => {
    // 1. Create student with PIN (setup)
    // 2. Navigate to demo page
    // 3. Enter serviceId + name
    // 4. Verify PIN entry prompt appears
    // 5. Enter correct PIN
    // 6. Verify login success
  });

  test('Wrong PIN: 3 failures → lockout → countdown → retry', async () => {
    // 1. Enter serviceId + name
    // 2. Enter wrong PIN 3 times
    // 3. Verify lockout message
    // 4. Verify countdown timer visible
    // 5. Wait for lockout expiry
    // 6. Verify retry allowed
  });

  test('PIN migration: old record → create PIN → login with data preserved', async () => {
    // 1. Seed IndexedDB with schema v1 record
    // 2. Navigate to demo page
    // 3. Enter serviceId + name
    // 4. Verify PIN creation prompt (migration)
    // 5. Create PIN
    // 6. Verify all quiz data intact
  });

  test('Instructor reset: unlock → reset PIN → student creates new PIN', async () => {
    // 1. Login as student with PIN
    // 2. Logout
    // 3. Login as instructor
    // 4. Reset student PIN
    // 5. Logout instructor
    // 6. Login as student (verify PIN creation flow)
  });
});
```

**Acceptance**: All E2E tests green, <2s per test

#### Task 4.2: Security Audit
**Effort**: 3 hours

**Checklist**:
- [ ] No plaintext PINs in logs, console, storage
- [ ] Simple hash verification (performance < 0.1ms)
- [ ] Rate limiting enforced (cannot bypass)
- [ ] Hashing produces 4-digit output consistently
- [ ] Migration preserves data integrity
- [ ] Instructor reset requires valid instructor session
- [ ] PIN validation prevents injection attacks
- [ ] Error messages don't leak information (e.g., "user not found")

**Tools**:
- Manual code review
- Browser DevTools inspection (Application tab)
- Performance testing (measure verifyPin execution time)
- Attempt bypass via direct sessionStorage manipulation

**Deliverable**: Security audit report (Markdown)

**Note**: Simplified hash (not crypto) acceptable per requirements - security relies on rate limiting.

#### Task 4.3: Performance Testing
**Effort**: 2 hours

**Metrics**:
- PIN hashing time: <0.1ms (simple hash, no crypto)
- Login with PIN: <2s total (hash overhead negligible)
- Migration: <100ms per record
- Rate limit check: <1ms
- Bundle size impact: <1KB increase (simple hash, no crypto API)

**Tests**:
```typescript
describe('Performance', () => {
  test('hashPin completes in <0.1ms', () => {
    const start = performance.now();
    hashPin('1234');
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(0.1);
  });

  test('verifyPin completes in <0.1ms', () => {
    const hash = hashPin('1234');
    const start = performance.now();
    verifyPin('1234', hash);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(0.1);
  });

  test('Login flow completes in <2000ms', async () => {
    // E2E timing test
  });
});
```

**Acceptance**: All performance targets met

#### Task 4.4: Documentation Updates
**Files**:
- `CLAUDE.md` (update architecture)
- `System_Requirements.md` (add PIN requirement)
- `demo/README.md` (update test scenarios)
- `specs/002-student-pin-auth/README.md` (new)

**Effort**: 3 hours

**Content**:
- Update login flow diagrams
- Document PIN reset procedure
- Add migration notes
- Update demo test scenarios with PIN steps
- Create troubleshooting guide (forgot PIN, lockout, etc.)

**Acceptance**: Documentation reviewed and approved

---

## Definition of Done (DoD) Checklist

Before marking feature complete, ALL must pass:

### Code Quality
- [ ] TypeScript compilation: `npm run typecheck` ✅
- [ ] Linting: `npm run lint` (zero errors) ✅
- [ ] Formatting: `npm run format:check` ✅
- [ ] Build: `npm run build` ✅
- [ ] Bundle size: <35KB min+gzip ✅

### Testing
- [ ] Unit tests: `npm run test:unit` ✅ (coverage ≥90%)
- [ ] Integration tests: `npm run test:integration` ✅
- [ ] E2E tests: `npm run test:e2e` ✅
- [ ] Visual regression: Storybook updated, Chromatic green ✅

### Security
- [ ] No plaintext PINs in storage or logs ✅
- [ ] Constant-time verification confirmed ✅
- [ ] Rate limiting functional ✅
- [ ] Security audit passed ✅

### Functionality
- [ ] New student PIN creation works ✅
- [ ] Returning student PIN login works ✅
- [ ] Rate limiting triggers at 3 attempts ✅
- [ ] Lockout countdown visible ✅
- [ ] Instructor PIN reset works ✅
- [ ] Migration preserves all data ✅

### Documentation
- [ ] CLAUDE.md updated ✅
- [ ] System_Requirements.md updated ✅
- [ ] demo/README.md updated ✅
- [ ] Feature spec complete ✅

### Performance
- [ ] Login <2s with PIN ✅
- [ ] PIN hash <2ms ✅
- [ ] No UI lag during PIN entry ✅

---

## Risk Mitigation

### Risk 1: Bundle Size Increase
**Mitigation**: crypto.subtle is native API (0 bytes), only adding logic (~1-2KB)
**Fallback**: Remove optional audit logging if needed

### Risk 2: Migration Data Loss
**Mitigation**: Extensive migration tests, backup/restore in demo
**Fallback**: Revert to schema v1, make PIN optional (v2.1 patch)

### Risk 3: Students Forget PINs
**Mitigation**: Instructor reset tool, clear "forgot PIN" messaging
**Fallback**: Allow instructor to view all student PINs (hash dictionary attack prevention needed)

### Risk 4: Hash Collisions (Multiple PINs → Same Hash)
**Mitigation**: Rate limiting prevents brute-force exploitation of collisions
**Fallback**: Acceptable for convenience-level auth (not high-security target)

---

## Deployment Plan

### Pre-Deployment
1. Merge 001-security-refactor (dependency)
2. Create branch `002-student-pin-auth`
3. Run full test suite on `main` (baseline)

### Development
1. Phase 1 → Commit + push daily
2. Phase 2 → Commit + push daily
3. Phase 3 → Commit + push daily
4. Phase 4 → Final commit

### Testing
1. Local testing: All DoD items ✅
2. PR preview: Deploy to GitHub Pages
3. Manual testing: Demo flows with real data
4. Peer review: Security + code review

### Merge
1. PR approval required
2. CI must be green
3. No merge conflicts with `main`
4. Squash commits (clean history)

### Post-Deployment
1. Monitor for bug reports
2. Update demo data with PINs
3. Create instructor guide (PDF)

---

## Open Questions for Product Owner

~~1. **PIN Length**: 4 digits OK, or prefer 6 for stronger security?~~ **ANSWERED**: 4 digits confirmed
~~2. **Lockout Duration**: 30 seconds appropriate, or too short/long?~~ **ANSWERED**: 30 seconds confirmed
~~3. **Audit Trail**: Should we log PIN reset events to IndexedDB?~~ **ANSWERED**: Yes, log resets, viewable in instructor panel, cleared with database
4. **Migration UX**: Force PIN creation or allow "skip" (weaker security)?
5. **Forgot PIN Flow**: Instructor-only reset, or add security questions?

---

**Total Estimated Effort**: 50-60 hours (10-12 days @ 5hr/day)
**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 (sequential)
**Parallelization**: None (each phase depends on previous)
**Buffer**: +20% (12-15 days total) for unexpected issues

---

**Plan Approved By**: _______________ (Date: ________)
**Implementation Start**: _______________ (Target)
**Target Completion**: _______________ (Target)
