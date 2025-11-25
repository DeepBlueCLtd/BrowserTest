# Tasks: Test Coverage Gap Analysis

**Input**: Design documents from `/specs/006-test-coverage-gaps/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested for tooling scripts. Focus is on tooling implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and prepare project for coverage tooling

- [ ] T001 Install @vitest/coverage-v8 dev dependency via `npm install -D @vitest/coverage-v8`
- [ ] T002 [P] Add `coverage/` directory to .gitignore in /.gitignore
- [ ] T003 [P] Create scripts/ directory at repository root for gap analysis scripts

**Checkpoint**: Coverage provider installed, project structure ready

---

## Phase 2: Foundational (Configuration)

**Purpose**: Configure coverage settings that support all user stories

- [ ] T004 Verify coverage configuration exists in /vitest.config.ts (provider, reporters, thresholds)
- [ ] T005 Add coverage configuration to /vitest.integration.config.ts for integration tests
- [ ] T006 [P] Add npm scripts to /package.json: `test:coverage`, `test:gaps`, `analyze:e2e-gaps`

**Checkpoint**: Configuration complete - coverage commands ready to use

---

## Phase 3: User Story 1 - Generate Unit/Integration Coverage Report (Priority: P1) 🎯 MVP

**Goal**: Developer can run `npm run test:coverage` and receive HTML/text coverage reports

**Independent Test**: Run `npm run test:coverage` and verify coverage/ directory contains index.html with per-file coverage percentages

### Implementation for User Story 1

- [ ] T007 [US1] Run `npm run test:coverage` to verify coverage report generation works
- [ ] T008 [US1] Verify HTML report at coverage/index.html shows line-by-line highlighting
- [ ] T009 [US1] Verify text summary outputs to console with coverage percentages
- [ ] T010 [US1] Test threshold enforcement - verify build fails when coverage drops below 80%
- [ ] T011 [US1] Document coverage commands in /specs/006-test-coverage-gaps/quickstart.md

**Checkpoint**: Unit test coverage report working independently. This is the MVP.

---

## Phase 4: User Story 2 - Structural Gap Analysis (Priority: P2)

**Goal**: Developer can identify source files without any test coverage via script

**Independent Test**: Run `npm run test:gaps` and verify list of source files without corresponding test files is output

### Implementation for User Story 2

- [ ] T012 [US2] Create structural gap analysis script at /scripts/check-test-gaps.js
- [ ] T013 [US2] Implement file enumeration: scan all files in src/**/*.ts
- [ ] T014 [US2] Implement test file matching: map src/x/y.ts to tests/unit/x/y.test.ts or tests/integration/y.test.ts
- [ ] T015 [US2] Add exclusion rules: skip src/types/**/*.ts (type-only files)
- [ ] T016 [US2] Implement text output format showing missing test files with expected paths
- [ ] T017 [US2] Add --json flag support for CI-friendly JSON output
- [ ] T018 [US2] Add --strict flag support that exits with code 1 when gaps found
- [ ] T019 [US2] Test script manually against current codebase to verify gap detection

**Checkpoint**: Structural gap analysis script working independently

---

## Phase 5: User Story 4 - E2E Gap Analysis (Priority: P2)

**Goal**: Developer receives one-off report mapping features to E2E test coverage

**Independent Test**: Run `npm run analyze:e2e-gaps` and verify docs/test-coverage-report.md is generated with feature coverage matrix

### Implementation for User Story 4

- [ ] T020 [US4] Create E2E gap analysis script at /scripts/analyze-e2e-gaps.js
- [ ] T021 [US4] Implement feature inventory: define list of application features from CLAUDE.md
- [ ] T022 [US4] Implement spec grep: scan tests/e2e/workflows/*.spec.ts for selectors and actions
- [ ] T023 [US4] Extract tested selectors: qd-login, qd-status, qd-instructor, data-testid patterns
- [ ] T024 [US4] Extract tested actions: page.click(), page.fill(), page.waitForSelector() counts
- [ ] T025 [US4] Map features to spec files based on file names and selector patterns
- [ ] T026 [US4] Generate markdown report at /docs/test-coverage-report.md
- [ ] T027 [US4] Include feature coverage matrix (covered/gap status)
- [ ] T028 [US4] Include spec grep analysis (selectors, actions, counts)
- [ ] T029 [US4] Include gaps section with prioritization suggestions

**Checkpoint**: E2E gap analysis report generated

---

## Phase 6: User Story 3 - Combined Unit+Integration Coverage (Priority: P3)

**Goal**: Developer can run both test suites and receive merged coverage report

**Independent Test**: Run `npm run test:coverage:all` and verify merged coverage report shows combined results

### Implementation for User Story 3

- [ ] T030 [US3] Update /vitest.integration.config.ts to output coverage to coverage/integration/
- [ ] T031 [US3] Update /vitest.config.ts to output coverage to coverage/unit/ when running separately
- [ ] T032 [US3] Add npm script `test:coverage:all` that runs both suites with coverage
- [ ] T033 [US3] Add npm script `test:coverage:merge` to combine LCOV files (if nyc needed)
- [ ] T034 [US3] Test merged coverage report shows code covered by either unit or integration tests
- [ ] T035 [US3] Verify functions tested by integration tests show as covered in merged report

**Checkpoint**: Combined coverage working - both test types contribute to coverage metrics

---

## Phase 7: Polish & Documentation

**Purpose**: Final documentation and validation

- [ ] T036 [P] Update /CLAUDE.md with new npm scripts (test:coverage, test:gaps, analyze:e2e-gaps)
- [ ] T037 [P] Update /specs/006-test-coverage-gaps/quickstart.md with all command examples
- [ ] T038 Run full validation: verify all coverage commands work from clean state
- [ ] T039 Document current coverage gaps found by running scripts
- [ ] T040 Review and commit all changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3-6)**: Depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - MVP
- **User Story 2 (P2)**: Can start after Foundational - Independent of US1
- **User Story 4 (P2)**: Can start after Foundational - Independent of US1, US2
- **User Story 3 (P3)**: Builds on US1 configuration - May run after US1

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# These can run in parallel:
T002: Add coverage/ to .gitignore
T003: Create scripts/ directory
```

**Phase 3-5 (User Stories)**:
```bash
# US1, US2, and US4 can be implemented in parallel by different developers
# They have no dependencies on each other
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Story 1 (T007-T011)
4. **STOP and VALIDATE**: Run `npm run test:coverage` to verify reports
5. Coverage report working - MVP complete!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Coverage reports working (MVP)
3. Add User Story 2 → Structural gap analysis available
4. Add User Story 4 → E2E gap report generated
5. Add User Story 3 → Combined coverage for complete picture

### Suggested Order

Given P1 > P2 > P3 priorities:
1. US1 first (MVP - immediate value)
2. US2 + US4 in parallel (both P2)
3. US3 last (enhances US1)

---

## Notes

- This feature is **development tooling** - no runtime impact
- Coverage reports are gitignored (generated on demand)
- E2E gap report (docs/test-coverage-report.md) is committed for reference
- No test tasks included since not explicitly requested for tooling scripts
- Scripts are Node.js (.js) since they're dev tooling, not part of src/
