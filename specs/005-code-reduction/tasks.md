---

description: "Task list for code reduction implementation"
---

# Tasks: Code Reduction Initiative

**Input**: Design documents from `/specs/005-code-reduction/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Test validation tasks included to ensure no regressions after code removal.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- All paths shown are relative to repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparation and verification before code removal

- [ ] T001 Verify all tests are passing with `npm test`
- [ ] T002 Run TypeScript compilation check with `npm run typecheck`
- [ ] T003 [P] Document current bundle size with `npm run size-check`
- [ ] T004 [P] Create backup branch for rollback safety

---

## Phase 2: User Story 1 - Remove Unused Code (Priority: P1) 🎯 MVP

**Goal**: Safely remove dead code that is never executed or imported to reduce bundle size

**Independent Test**: Verify all existing functionality remains intact and bundle size decreases

### Implementation for User Story 1

- [ ] T005 [P] [US1] Delete unused file `src/services/storage/encrypted-session.ts`
- [ ] T006 [P] [US1] Delete unused file `src/utils/virtual-list.ts`
- [ ] T007 [P] [US1] Delete unused file `src/components/qd-error-banner.ts`
- [ ] T008 [US1] Remove EncryptedSessionStorage export from `src/index.ts`
- [ ] T009 [US1] Remove virtual-list export from `src/index.ts`
- [ ] T010 [US1] Remove qd-error-banner export from `src/index.ts`

### Validation for User Story 1

- [ ] T011 [US1] Verify TypeScript compilation succeeds with `npm run typecheck`
- [ ] T012 [US1] Run unit tests and verify all pass with `npm run test:unit`
- [ ] T013 [US1] Run integration tests and verify all pass with `npm run test:integration`
- [ ] T014 [US1] Run E2E tests and verify all pass with `npm run test:e2e`
- [ ] T015 [US1] Build project and verify bundle size reduced with `npm run build && npm run size-check`
- [ ] T016 [US1] Commit changes with descriptive message

**Checkpoint**: At this point, all unused code is removed and bundle is smaller

---

## Phase 3: User Story 2 - Fix Debug Mode Configuration (Priority: P2)

**Goal**: Exclude storage monitor debug tool from production builds

**Independent Test**: Build in production mode and verify storage monitor component is not included in bundle

### Implementation for User Story 2

- [ ] T017 [US2] Set DEBUG_MODE to false on line 23 of `src/index.ts`

### Validation for User Story 2

- [ ] T018 [US2] Build production bundle with `npm run build`
- [ ] T019 [US2] Verify qd-storage-monitor not in bundle with `grep -c "qd-storage-monitor" dist/sonar-quiz.iife.js`
- [ ] T020 [US2] Test Ctrl+Shift+D shortcut doesn't show debug panel in `demo/quiz-index.html`
- [ ] T021 [US2] Verify bundle size further reduced with `npm run size-check`
- [ ] T022 [US2] Commit changes with descriptive message

**Checkpoint**: At this point, debug tools are excluded from production

---

## Phase 4: User Story 3 - Consolidate PIN Component Duplication (Priority: P3)

**Goal**: Extract duplicated modal and PIN validation logic into shared utilities

**Independent Test**: Verify all three PIN-related components continue to function identically after consolidation

### Implementation for User Story 3

- [ ] T023 [US3] Create modal builder utility in `src/utils/modal-builder.ts`
- [ ] T024 [US3] Extract common modal creation logic from PIN components into modal builder
- [ ] T025 [US3] Refactor `src/components/qd-pin-create.ts` to use modal builder utility
- [ ] T026 [US3] Refactor `src/components/qd-pin-reset-dialog.ts` to use modal builder utility
- [ ] T027 [US3] Refactor `src/components/qd-login.ts` instructor modal to use modal builder utility

### Validation for User Story 3

- [ ] T028 [US3] Verify TypeScript compilation succeeds with `npm run typecheck`
- [ ] T029 [US3] Run PIN-specific unit tests with `npm run test:unit -- pin`
- [ ] T030 [US3] Run PIN-specific E2E tests with `npm run test:e2e -- pin`
- [ ] T031 [US3] Manually test PIN creation flow in demo
- [ ] T032 [US3] Manually test PIN reset flow in demo
- [ ] T033 [US3] Manually test instructor login modal in demo
- [ ] T034 [US3] Verify final bundle size meets target with `npm run size-check`
- [ ] T035 [US3] Commit changes with descriptive message

**Checkpoint**: All PIN components now use shared modal logic, reducing duplication

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T036 [P] Update changelog with all removed exports and breaking changes
- [ ] T037 Verify final bundle size is ~30-31KB (from 32.89KB)
- [ ] T038 Verify total LOC reduction of ~800 lines
- [ ] T039 [P] Update documentation if any public APIs changed
- [ ] T040 Create pull request with comprehensive description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **User Story 2 (Phase 3)**: Can start after Setup, independent of US1
- **User Story 3 (Phase 4)**: Can start after Setup, independent of US1/US2
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - pure deletion
- **User Story 2 (P2)**: No dependencies on other stories - configuration change
- **User Story 3 (P3)**: No dependencies on other stories - refactoring only

### Within Each User Story

- Deletions before export updates
- Implementation before validation
- All validation must pass before committing

### Parallel Opportunities

- Setup tasks T003 and T004 can run in parallel
- User Story 1 deletion tasks T005, T006, T007 can run in parallel
- All three user stories can theoretically run in parallel after Setup
- Polish tasks T036 and T039 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all file deletions together:
Task: "Delete unused file src/services/storage/encrypted-session.ts"
Task: "Delete unused file src/utils/virtual-list.ts"
Task: "Delete unused file src/components/qd-error-banner.ts"

# After deletions, update exports sequentially:
Task: "Remove EncryptedSessionStorage export from src/index.ts"
Task: "Remove virtual-list export from src/index.ts"
Task: "Remove qd-error-banner export from src/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: User Story 1 (Remove Unused Code)
3. **STOP and VALIDATE**: Test thoroughly, verify bundle reduction
4. Can deliver immediate value with ~1-1.5KB reduction

### Incremental Delivery

1. Complete Setup → Ready to implement
2. Add User Story 1 → Bundle reduced by ~1-1.5KB (MVP!)
3. Add User Story 2 → Debug tools removed, additional reduction
4. Add User Story 3 → Code duplication removed, final target reached
5. Each story adds value without breaking previous work

### Risk Mitigation

- Each phase can be independently reverted via git
- Comprehensive test validation after each story
- Manual testing for PIN components before final commit
- Backup branch created in Setup for emergency rollback

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each user story completes successfully
- Total estimated time: ~5 hours (1h US1, 0.5h US2, 3.5h US3)
- Primary risk in User Story 3 (PIN consolidation) - defer if issues arise