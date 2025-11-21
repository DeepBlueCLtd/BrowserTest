# Tasks: Student PIN Authentication

**Input**: Design documents from `/specs/004-student-pin-auth/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included as per TDD methodology specified in Constitution and plan.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below follow the web application structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type extensions

- [X] T001 Extend StudentRecord interface in src/types/contracts.ts with v2 schema and PIN fields
- [X] T002 [P] Create PinAttemptState interface in src/types/contracts.ts for rate limiting
- [X] T003 [P] Create PinResetEvent interface in src/types/contracts.ts for audit logging
- [X] T004 Update IndexedDB schema version in src/services/storage/indexeddb.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create PIN service class skeleton in src/services/auth/pin-service.ts
- [X] T006 Implement hashPin method using Web Crypto API in src/services/auth/pin-service.ts
- [X] T007 Implement verifyPin with constant-time comparison in src/services/auth/pin-service.ts
- [X] T008 [P] Create rate limiter service in src/services/auth/rate-limiter.ts
- [X] T009 [P] Implement sessionStorage methods for rate limiting in src/services/auth/rate-limiter.ts
- [X] T010 Extend migration service for schema v1→v2 in src/services/storage/migration.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - First-Time Student Registration with PIN (Priority: P1) 🎯 MVP

**Goal**: New students must create a 4-digit PIN on first login

**Independent Test**: Clear all data, attempt login → must prompt for PIN creation → can login with new PIN

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [P] [US1] Unit test for PIN format validation in tests/unit/pin-service.test.ts
- [X] T012 [P] [US1] Unit test for PIN hashing in tests/unit/pin-service.test.ts
- [X] T013 [P] [US1] Unit test for PIN confirmation matching in tests/unit/pin-service.test.ts
- [X] T014 [US1] Integration test for PIN creation flow in tests/integration/login-flow.test.ts
- [X] T015 [P] [US1] E2E test for new student PIN creation in tests/e2e/workflows/pin-authentication.spec.ts

### Implementation for User Story 1

- [X] T016 [US1] Create qd-pin-create component skeleton in src/components/qd-pin-create.ts
- [X] T017 [US1] Implement PIN input fields with confirmation in src/components/qd-pin-create.ts
- [X] T018 [US1] Add PIN format validation (4 digits only) in src/components/qd-pin-create.ts
- [X] T019 [US1] Implement PIN mismatch error handling in src/components/qd-pin-create.ts
- [X] T020 [US1] Extend qd-login to detect missing PIN in src/components/qd-login.ts
- [X] T021 [US1] Integrate PIN creation modal trigger in src/components/qd-login.ts
- [X] T022 [US1] Update session service to store PIN hash in src/services/session-service.ts
- [X] T023 [US1] Emit qd:pin-created event after successful creation

**Checkpoint**: User Story 1 complete - new students can create PINs

---

## Phase 4: User Story 2 - Returning Student Login with PIN (Priority: P1)

**Goal**: Returning students must enter their PIN to access quiz data

**Independent Test**: Create student with PIN, logout → login with correct PIN succeeds, wrong PIN fails

### Tests for User Story 2 ⚠️

- [X] T024 [P] [US2] Unit test for PIN verification in tests/unit/pin-service.test.ts
- [X] T025 [P] [US2] Unit test for rate limiting logic in tests/unit/rate-limiter.test.ts
- [X] T026 [US2] Integration test for PIN authentication in tests/integration/login-flow.test.ts
- [X] T027 [P] [US2] E2E test for returning student login in tests/e2e/workflows/pin-authentication.spec.ts

### Implementation for User Story 2

- [X] T028 [US2] Add PIN input field to login form in src/components/qd-login.ts
- [X] T029 [US2] Implement PIN verification on login in src/components/qd-login.ts
- [X] T030 [US2] Integrate rate limiter for failed attempts in src/components/qd-login.ts
- [X] T031 [US2] Display lockout countdown timer in src/components/qd-login.ts
- [X] T032 [US2] Show appropriate error messages for wrong PIN in src/components/qd-login.ts
- [X] T033 [US2] Clear rate limit state on successful login in src/services/session-service.ts
- [X] T034 [US2] Emit qd:pin-verified event after authentication

**Checkpoint**: User Story 2 complete - returning students authenticate with PIN

---

## Phase 5: User Story 3 - Instructor PIN Reset (Priority: P2)

**Goal**: Instructors can reset student PINs when forgotten

**Independent Test**: Login as instructor → reset student PIN → student can create new PIN

### Tests for User Story 3 ⚠️

- [X] T035 [P] [US3] Unit test for PIN reset logic in tests/unit/services/auth/pin-service.test.ts
- [X] T036 [US3] Integration test for instructor reset in tests/integration/login-flow.test.ts
- [ ] T037 [P] [US3] E2E test for PIN reset workflow in tests/e2e/workflows/pin-authentication.spec.ts (skipped)

### Implementation for User Story 3

- [X] T038 [US3] Create qd-pin-reset-dialog component in src/components/qd-pin-reset-dialog.ts
- [X] T039 [US3] Add student list with search in src/components/qd-pin-reset-dialog.ts
- [X] T040 [US3] Implement PIN reset confirmation in src/components/qd-pin-reset-dialog.ts
- [X] T041 [US3] Extend instructor status panel with reset button in src/components/qd-instructor-status.ts
- [X] T042 [US3] Add Reset PIN button to scores modal in src/components/qd-instructor-scores.ts
- [X] T043 [US3] Implement PIN reset in storage service in src/services/storage/indexeddb.ts
- [X] T044 [US3] Create audit log entry for reset events in src/services/storage/indexeddb.ts
- [X] T045 [US3] Emit qd:pin-reset event after reset

**Checkpoint**: User Story 3 complete - instructors can reset forgotten PINs

---

## Phase 6: User Story 4 - Migration for Existing Students (Priority: P3)

**Goal**: Existing students without PINs create one on next login

**Independent Test**: Load v1 schema student data → login prompts for PIN → data preserved after PIN creation

### Tests for User Story 4 ⚠️

- [X] T046 [P] [US4] Unit test for schema detection in tests/unit/migration.test.ts
- [X] T047 [P] [US4] Unit test for v1→v2 migration in tests/unit/migration.test.ts
- [X] T048 [US4] Integration test for migration flow in tests/integration/login-flow.test.ts
- [X] T049 [P] [US4] E2E test for existing student migration in tests/e2e/workflows/pin-authentication.spec.ts

### Implementation for User Story 4

- [X] T050 [US4] Implement needsMigration check in src/services/storage/migration.ts
- [X] T051 [US4] Create migrateToV2 method in src/services/storage/migration.ts
- [X] T052 [US4] Detect v1 schema on login in src/components/qd-login.ts
- [X] T053 [US4] Trigger PIN creation for v1 students in src/components/qd-login.ts
- [X] T054 [US4] Complete migration after PIN creation in src/services/session-service.ts
- [X] T055 [US4] Preserve all quiz data during migration in src/services/storage/indexeddb.ts
- [X] T056 [US4] Update schema version after successful migration

**Checkpoint**: User Story 4 complete - existing students seamlessly migrate

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T057 [P] Add accessibility attributes to PIN inputs in src/components/qd-pin-create.ts
- [X] T058 [P] Add accessibility to lockout countdown in src/components/qd-login.ts
- [X] T059 Performance optimization for PIN verification
- [X] T060 [P] Add comprehensive logging for security events
- [X] T061 Clear PIN fields from memory after use
- [X] T062 [P] Add autocomplete="off" to all PIN input fields
- [X] T063 Bundle size check - ensure <2KB impact
- [ ] T064 Run quickstart.md manual test scenarios (manual)
- [X] T065 [P] Security review of PIN handling

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 & US2 are both P1 priority and can run in parallel
  - US3 (P2) can start after Foundational
  - US4 (P3) can start after Foundational
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Builds on US1 components but independently testable
- **User Story 3 (P2)**: Can start after Foundational - Independent of US1/US2
- **User Story 4 (P3)**: Can start after Foundational - Independent but integrates with US1 flow

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Services before components
- Core logic before UI integration
- Story complete before moving to next

### Parallel Opportunities

- Setup tasks T002-T003 can run in parallel
- Foundational services T008-T009 can run in parallel
- All test files for a story can be written in parallel
- US1 and US2 can be developed in parallel by different developers
- US3 and US4 can start any time after Foundational phase
- Polish tasks are mostly parallel

---

## Parallel Example: User Story 1

```bash
# Launch all unit tests for US1 together:
Task T011: "Unit test for PIN format validation in tests/unit/pin-service.test.ts"
Task T012: "Unit test for PIN hashing in tests/unit/pin-service.test.ts"
Task T013: "Unit test for PIN confirmation matching in tests/unit/pin-service.test.ts"
Task T015: "E2E test for new student PIN creation in tests/e2e/pin-creation.spec.ts"

# After core services ready, implement component in parallel:
# (T016-T023 must be sequential as they build on each other)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (4 tasks)
2. Complete Phase 2: Foundational (6 tasks)
3. Complete Phase 3: User Story 1 (13 tasks)
4. Complete Phase 4: User Story 2 (11 tasks)
5. **STOP and VALIDATE**: Test PIN creation and authentication
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add User Story 1 → New students can create PINs
3. Add User Story 2 → Full authentication working (MVP!)
4. Add User Story 3 → Instructor controls added
5. Add User Story 4 → Migration complete
6. Polish → Production ready

### Parallel Team Strategy

With 3 developers after Foundational phase:
- Developer A: User Story 1 (PIN creation)
- Developer B: User Story 2 (PIN authentication)
- Developer C: User Story 3 (Instructor reset)
- All merge to main, then tackle US4 and Polish together

---

## Summary

- **Total Tasks**: 65
- **Setup**: 4 tasks
- **Foundational**: 6 tasks (blocking)
- **User Story 1**: 13 tasks (5 tests, 8 implementation)
- **User Story 2**: 11 tasks (4 tests, 7 implementation)
- **User Story 3**: 11 tasks (3 tests, 8 implementation)
- **User Story 4**: 11 tasks (4 tests, 7 implementation)
- **Polish**: 9 tasks
- **Parallel Opportunities**: High - stories can develop independently
- **MVP Scope**: US1 + US2 (24 story tasks after foundation)