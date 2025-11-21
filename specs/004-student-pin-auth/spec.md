# Feature Specification: Student PIN Authentication

**Feature Branch**: `004-student-pin-auth`
**Created**: 2025-11-21
**Status**: Draft
**Input**: GitHub Issue #63 - "Students login with PIN to prevent impersonation on shared laptops"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Time Student Registration with PIN (Priority: P1)

A student using the quiz system for the first time must create a 4-digit PIN during their initial login. This PIN will be required for all future logins to prevent other students from impersonating them on shared computers.

**Why this priority**: Core security requirement - the PIN is the primary defense against student impersonation. Without this, the entire feature has no value.

**Independent Test**: Create a new student account, verify PIN creation flow is mandatory, and confirm the student can log in with the new PIN.

**Acceptance Scenarios**:

1. **Given** I am a new student (no existing record), **When** I enter my serviceId and name, **Then** I am prompted to create a 4-digit PIN
2. **Given** I am creating a PIN, **When** I enter a PIN with non-numeric characters, **Then** I see an error "PIN must be exactly 4 digits"
3. **Given** I am creating a PIN, **When** I enter a valid 4-digit PIN and confirm it, **Then** my account is created and I am logged in
4. **Given** I am creating a PIN, **When** my confirmation PIN doesn't match, **Then** I see an error "PINs do not match" and must re-enter

---

### User Story 2 - Returning Student Login with PIN (Priority: P1)

A returning student must enter their PIN along with serviceId and name to access their quiz progress. This prevents other students from viewing or modifying their data.

**Why this priority**: Essential for the feature to work - PIN creation without verification is pointless.

**Independent Test**: Create a student with PIN, log out, then verify correct PIN grants access and incorrect PIN is rejected.

**Acceptance Scenarios**:

1. **Given** I have an existing account with a PIN, **When** I enter my serviceId and name, **Then** I am prompted for my PIN
2. **Given** I enter the correct PIN, **When** I submit, **Then** I am logged in and see my quiz progress
3. **Given** I enter an incorrect PIN, **When** I submit, **Then** I see an error "Incorrect PIN" and login fails
4. **Given** I enter incorrect PIN 3 times, **When** I try again, **Then** I see "Too many attempts. Contact your instructor to reset PIN."

---

### User Story 3 - Instructor PIN Reset (Priority: P2)

An instructor can reset a student's PIN when they forget it, allowing the student to create a new PIN on their next login without losing any quiz data.

**Why this priority**: Operational necessity - students will forget PINs, and without reset capability, data would be permanently inaccessible.

**Independent Test**: Access instructor mode, reset a student's PIN, then verify the student can create a new PIN on next login.

**Acceptance Scenarios**:

1. **Given** I am in instructor mode viewing "View All Scores", **When** I see a student entry, **Then** I see a "Reset PIN" button next to their name
2. **Given** I click "Reset PIN" for a student, **When** I confirm the action, **Then** that student's PIN is cleared
3. **Given** a student's PIN was reset, **When** they log in next, **Then** they are prompted to create a new PIN
4. **Given** I reset a PIN, **When** the student creates their new PIN, **Then** all their previous quiz progress remains intact

---

### User Story 4 - Migration for Existing Students (Priority: P3)

Existing students who have quiz data but no PIN (from before this feature) must create a PIN on their next login to continue using the system.

**Why this priority**: Backward compatibility - cannot break existing student records when deploying PIN authentication.

**Independent Test**: Migrate an old-schema student record and verify PIN creation is required on next login while preserving all quiz data.

**Acceptance Scenarios**:

1. **Given** I have existing quiz data from before PIN feature, **When** I log in with serviceId + name, **Then** I am prompted to create a PIN
2. **Given** I create a PIN during migration, **When** I complete the process, **Then** all my existing quiz progress is retained
3. **Given** migration is in progress, **When** I cancel PIN creation, **Then** I cannot access the system (PIN is mandatory)

---

### Edge Cases

- What happens when student closes browser during PIN creation (before confirmation)?
- What happens when student enters PIN with leading zeros (e.g., "0042")?
- How does system handle corrupted PIN data in storage?
- What happens when instructor resets PIN while student is logged in?
- What happens after 3 failed PIN attempts - how long is lockout?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require a 4-digit numeric PIN for all student logins (mandatory, no opt-out)
- **FR-002**: System MUST hash PINs before storage (never store plaintext PINs)
- **FR-003**: System MUST prompt new students to create a PIN immediately after entering serviceId and name
- **FR-004**: System MUST require PIN confirmation (enter twice) during creation to prevent typos
- **FR-005**: System MUST validate PIN is exactly 4 numeric digits (reject letters, symbols, wrong length)
- **FR-006**: System MUST limit failed PIN attempts to prevent guessing attacks
- **FR-007**: System MUST reset attempt counter on successful PIN authentication
- **FR-008**: System MUST provide instructor interface to reset student PINs
- **FR-009**: System MUST migrate existing student records to require PIN on first login after deployment
- **FR-010**: System MUST preserve all quiz progress during PIN migration
- **FR-011**: System MUST display clear error messages for PIN validation failures
- **FR-012**: System MUST display the "Reset PIN" button in the "View All Scores" panel next to each student name

### Key Entities

- **Student**: Extended with PIN hash field to store hashed PIN for authentication
- **PIN Attempt State**: Tracks failed login attempts per student to enable rate limiting
- **PIN Reset Event**: Records when instructor resets a student's PIN for audit purposes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero successful student logins without valid PIN authentication after feature deployment
- **SC-002**: Students can complete PIN creation in under 30 seconds
- **SC-003**: Students can complete PIN entry and login in under 10 seconds
- **SC-004**: Instructor can reset a student's PIN in 3 clicks or fewer
- **SC-005**: 100% of existing student records successfully migrate to require PIN on next login
- **SC-006**: All student quiz data preserved during migration (zero data loss)
- **SC-007**: Failed PIN attempts are limited to prevent brute-force attacks
- **SC-008**: PIN validation errors display clear, actionable messages (e.g., "PIN must be 4 digits" not "Invalid input")

## Assumptions

- Students will remember their 4-digit PINs between sessions (reasonable for short training courses)
- Instructors will be available to reset forgotten PINs during training sessions
- Leading zeros in PINs are valid (e.g., "0001" is a valid PIN)
- Rate limiting lockout duration of 30 seconds is appropriate to deter brute-force without frustrating legitimate users
- 3 failed attempts before lockout balances security and usability

## Out of Scope

- PIN recovery via email/SMS (offline system, no network)
- Biometric authentication
- Multi-factor authentication
- PIN history/preventing PIN reuse
- Student-initiated PIN change (must contact instructor)
- Admin-configurable PIN length (fixed at 4 digits)
