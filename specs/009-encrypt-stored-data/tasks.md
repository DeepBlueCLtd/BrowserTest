# Tasks: Encrypt Stored Data

**Input**: Design documents from `/specs/009-encrypt-stored-data/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: TDD is MANDATORY per constitution (Principle III). Tests written first, verified to fail, then implementation.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Feature flag and module scaffolding

- [ ] T001 Create feature flags module at src/config/feature-flags.ts with ENCRYPT_STORAGE constant (default: false)
- [ ] T002 [P] Create obfuscation module skeleton at src/services/storage/obfuscation.ts with type exports
- [ ] T003 [P] Create StorageFormatError class in src/services/storage/adapter-utils.ts

---

## Phase 2: Foundational (Obfuscation Core)

**Purpose**: Core encode/decode utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests (TDD - write first, verify fail)

- [ ] T004 [P] Unit test for deriveKey() in tests/unit/services/storage/obfuscation.test.ts
- [ ] T005 [P] Unit test for xorString() in tests/unit/services/storage/obfuscation.test.ts
- [ ] T006 [P] Unit test for encode() in tests/unit/services/storage/obfuscation.test.ts
- [ ] T007 [P] Unit test for decode() in tests/unit/services/storage/obfuscation.test.ts
- [ ] T008 [P] Unit test for isObfuscated() in tests/unit/services/storage/obfuscation.test.ts
- [ ] T009 Unit test for decode() with corrupted data (tamper detection) in tests/unit/services/storage/obfuscation.test.ts

### Implementation

- [ ] T010 Implement deriveKey(releaseId: string): string in src/services/storage/obfuscation.ts
- [ ] T011 Implement xorString(input: string, key: string): string in src/services/storage/obfuscation.ts
- [ ] T012 Implement encode<T>(data: T, key: string): ObfuscatedString in src/services/storage/obfuscation.ts
- [ ] T013 Implement decode<T>(encoded: ObfuscatedString, key: string): T in src/services/storage/obfuscation.ts
- [ ] T014 Implement isObfuscated(value: unknown): value is ObfuscatedString in src/services/storage/obfuscation.ts
- [ ] T015 Export OBFUSCATION_PREFIX constant from src/services/storage/obfuscation.ts
- [ ] T016 Verify all T004-T009 tests pass (green)

**Checkpoint**: Obfuscation utilities complete - encode/decode round-trip works

---

## Phase 3: User Story 1 - Protected Student Data in Production (Priority: P1) 🎯 MVP

**Goal**: When ENCRYPT_STORAGE=true, all StudentRecord values stored in IndexedDB are obfuscated

**Independent Test**: Set ENCRYPT_STORAGE=true, submit quiz answer, inspect IndexedDB - data shows as "OBF:..." string

### Tests (TDD - write first, verify fail)

- [ ] T017 [P] [US1] Integration test: saveStudent with ENCRYPT_STORAGE=true stores OBF: prefixed string in tests/integration/storage/encrypted-storage.test.ts
- [ ] T018 [P] [US1] Integration test: getStudent with ENCRYPT_STORAGE=true decodes OBF: data correctly in tests/integration/storage/encrypted-storage.test.ts
- [ ] T019 [P] [US1] Integration test: format mismatch throws StorageFormatError when ENCRYPT_STORAGE=true but data is plain in tests/integration/storage/encrypted-storage.test.ts
- [ ] T020 [P] [US1] Integration test: tampered OBF: data is detected and handled gracefully in tests/integration/storage/encrypted-storage.test.ts

### Implementation

- [ ] T021 [US1] Modify getStudent() in src/services/storage/indexeddb.ts to check ENCRYPT_STORAGE flag and decode if needed
- [ ] T022 [US1] Modify saveStudent() in src/services/storage/indexeddb.ts to check ENCRYPT_STORAGE flag and encode if needed
- [ ] T023 [US1] Add format mismatch detection in getStudent() - throw StorageFormatError if format doesn't match flag
- [ ] T024 [US1] Add try-catch wrapper for decode failures (tamper detection) in getStudent()
- [ ] T025 [US1] Verify all T017-T020 tests pass (green)

**Checkpoint**: US1 complete - production obfuscation works, data protected in DevTools

---

## Phase 4: User Story 2 - Readable Data in Development Mode (Priority: P2)

**Goal**: When ENCRYPT_STORAGE=false, data remains readable JSON for debugging

**Independent Test**: Set ENCRYPT_STORAGE=false, submit quiz answer, inspect IndexedDB - data shows as plain JSON object

### Tests (TDD - write first, verify fail)

- [ ] T026 [P] [US2] Integration test: saveStudent with ENCRYPT_STORAGE=false stores plain object in tests/integration/storage/encrypted-storage.test.ts
- [ ] T027 [P] [US2] Integration test: getStudent with ENCRYPT_STORAGE=false returns plain object in tests/integration/storage/encrypted-storage.test.ts
- [ ] T028 [P] [US2] Integration test: format mismatch throws StorageFormatError when ENCRYPT_STORAGE=false but data is OBF: in tests/integration/storage/encrypted-storage.test.ts

### Implementation

- [ ] T029 [US2] Ensure saveStudent() passthrough when ENCRYPT_STORAGE=false in src/services/storage/indexeddb.ts
- [ ] T030 [US2] Ensure getStudent() passthrough when ENCRYPT_STORAGE=false in src/services/storage/indexeddb.ts
- [ ] T031 [US2] Add format mismatch detection for OBF: data when flag is false
- [ ] T032 [US2] Verify all T026-T028 tests pass (green)

**Checkpoint**: US2 complete - development mode keeps data readable

---

## Phase 5: User Story 3 - Instructor Access to Obfuscated Data (Priority: P3)

**Goal**: Instructor features (scores modal, CSV export) work transparently regardless of obfuscation

**Independent Test**: Enable obfuscation, log in as instructor, view scores and export CSV - all data displays correctly

### Tests (TDD - write first, verify fail)

- [ ] T033 [P] [US3] Integration test: getStudentsByRelease() returns decoded records when ENCRYPT_STORAGE=true in tests/integration/storage/encrypted-storage.test.ts
- [ ] T034 [P] [US3] E2E test: instructor can view scores with obfuscation enabled in tests/e2e/encrypted-storage.spec.ts
- [ ] T035 [P] [US3] E2E test: CSV export contains readable data with obfuscation enabled in tests/e2e/encrypted-storage.spec.ts

### Implementation

- [ ] T036 [US3] Modify getStudentsByRelease() in src/services/storage/indexeddb.ts to decode all records when ENCRYPT_STORAGE=true
- [ ] T037 [US3] Verify CSV export service uses decoded data (should work via existing getStudentsByRelease)
- [ ] T038 [US3] Verify all T033-T035 tests pass (green)

**Checkpoint**: US3 complete - instructor features unaffected by obfuscation

---

## Phase 6: Migration Utility

**Purpose**: One-time migration tool for converting existing data

### Tests (TDD - write first, verify fail)

- [ ] T039 [P] Unit test: migrateStorage('encrypt') converts plain records to OBF: format in tests/unit/services/storage/migration.test.ts
- [ ] T040 [P] Unit test: migrateStorage('decrypt') converts OBF: records to plain format in tests/unit/services/storage/migration.test.ts
- [ ] T041 [P] Unit test: migrateStorage with dryRun:true reports changes without modifying data in tests/unit/services/storage/migration.test.ts
- [ ] T042 Unit test: migrateStorage handles errors gracefully and reports them in tests/unit/services/storage/migration.test.ts

### Implementation

- [ ] T043 Add migrateStorage() function signature to src/services/storage/migration.ts
- [ ] T044 Implement getAllStudentsRaw() helper in src/services/storage/indexeddb.ts (returns raw stored values without decode)
- [ ] T045 Implement migrateStorage() logic: iterate records, encode/decode, save in src/services/storage/migration.ts
- [ ] T046 Add MigrationResult type and return progress information
- [ ] T047 Export migrateStorage to window.SonarQuiz for console access in src/index.ts
- [ ] T048 Verify all T039-T042 tests pass (green)

**Checkpoint**: Migration utility complete - can convert data in either direction

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation, quality checks

- [ ] T049 Run full test suite: npm run test:unit && npm run test:integration
- [ ] T050 Run E2E tests: npm run test:e2e
- [ ] T051 Verify bundle size still under 35KB: npm run size-check
- [ ] T052 Run linter and fix any issues: npm run lint:fix
- [ ] T053 Run format check: npm run format:check
- [ ] T054 [P] Update quickstart.md with actual usage examples after implementation
- [ ] T055 Manual verification: test with ENCRYPT_STORAGE=true in demo pages

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────────────────┐
                                                          │
Phase 2: Foundational (Core obfuscation) ◄───────────────┘
                    │
                    ▼ BLOCKS ALL USER STORIES
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
Phase 3: US1    Phase 4: US2    Phase 5: US3
(P1 - MVP)      (P2)            (P3)
    │               │               │
    └───────────────┼───────────────┘
                    │
                    ▼
           Phase 6: Migration
                    │
                    ▼
           Phase 7: Polish
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 (Foundational). Core MVP.
- **User Story 2 (P2)**: Depends on Phase 2. Can run parallel with US1.
- **User Story 3 (P3)**: Depends on Phase 2. Can run parallel with US1/US2.
- **Migration (Phase 6)**: Depends on US1 (obfuscation logic must work first)

### Within Each Phase

- Tests MUST be written first and FAIL before implementation
- Implementation tasks in listed order (dependencies within phase)
- Verify tests pass before moving to next phase

### Parallel Opportunities

Within **Phase 2 (Foundational)**:
```
T004, T005, T006, T007, T008 can all run in parallel (different test cases)
```

Within **Phase 3 (US1)**:
```
T017, T018, T019, T020 can all run in parallel (different test files/cases)
```

**Cross-Story Parallelism** (after Phase 2):
```
US1, US2, US3 can be developed in parallel by different developers
```

---

## Parallel Example: Phase 2 Tests

```bash
# Launch all foundational tests together:
Task: "Unit test for deriveKey() in tests/unit/services/storage/obfuscation.test.ts"
Task: "Unit test for xorString() in tests/unit/services/storage/obfuscation.test.ts"
Task: "Unit test for encode() in tests/unit/services/storage/obfuscation.test.ts"
Task: "Unit test for decode() in tests/unit/services/storage/obfuscation.test.ts"
Task: "Unit test for isObfuscated() in tests/unit/services/storage/obfuscation.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T016) ← **CRITICAL GATE**
3. Complete Phase 3: User Story 1 (T017-T025)
4. **STOP and VALIDATE**: Test with ENCRYPT_STORAGE=true
5. Data is now protected in DevTools → MVP shipped!

### Incremental Delivery

1. Setup + Foundational → Core utilities ready
2. Add US1 → Production protection works → **MVP!**
3. Add US2 → Development debugging preserved
4. Add US3 → Instructor features verified
5. Add Migration → Existing data can be converted
6. Polish → Quality verified, docs updated

### Parallel Team Strategy

With multiple developers after Phase 2:
- Developer A: US1 (T017-T025)
- Developer B: US2 (T026-T032)
- Developer C: US3 (T033-T038)

All stories integrate via shared obfuscation.ts module.

---

## Notes

- All tasks include exact file paths
- TDD mandatory: tests first, verify fail, then implement
- [P] = different files, safe to parallelize
- [USn] = maps to user story for traceability
- Stop at any checkpoint to validate independently
- ENCRYPT_STORAGE default is false (safe default)
- Migration is manual/explicit per clarification (no auto-migration)
