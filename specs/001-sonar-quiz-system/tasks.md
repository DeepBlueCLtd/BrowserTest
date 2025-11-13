# Tasks: Sonar Quiz System

**Input**: Design documents from `/specs/001-sonar-quiz-system/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

Single project structure:
- `src/` - Source code
- `tests/` - All test files
- `stories/` - Storybook stories

---

## Current Status Summary (Updated 2025-11-13)

**Overall Progress**: ~70% complete (84/129 tasks completed)

### Phase Completion Status

- ✅ **Phase 0 (Bootstrap)**: 13/13 tasks complete (100%)
- ✅ **Phase 1 (Foundation)**: 12/12 tasks complete (100%)
- ✅ **Phase 2 (User Story 1 - Student Quiz)**: 21/22 tasks complete (95%)
  - Missing: T046 (E2E test for complete workflow)
- ✅ **Phase 3 (User Story 2 - Progress Tracking)**: 9/9 tasks complete (100%)
- ✅ **Phase 4 (User Story 4 - Analysis Capture)**: 11/11 tasks complete (100%)
- ✅ **Phase 5 (User Story 3 - Instructor Review)**: 17/17 tasks complete (100%)
- ⚠️ **Phase 6 (User Story 5 - Cohort Management)**: 3/11 tasks complete (27%)
  - Complete: Data erasure UI with "DELETE ALL" confirmation
  - Missing: CSV export service, cross-tab sync, E2E tests
- ⚠️ **Phase 7 (Validation/A11y/Performance)**: 4/24 tasks complete (17%)
  - Complete: Bundle size optimization, debouncing, basic validation tests
  - Missing: Runtime validation enforcement, accessibility tests, performance tests, documentation
- ❌ **Phase 8 (Beta Deployment)**: 0/11 tasks complete (0%)

### Key Deliverables Achieved

- ✅ Core student quiz workflow (login, answer, save, status tracking)
- ✅ Home page progress badges (R/A/G indicators)
- ✅ Analysis table data capture
- ✅ Instructor unlock and review features
- ✅ Scores aggregation page
- ✅ Data erasure capability
- ✅ Bundle size under 25KB limit (13.57 KB gzipped)
- ✅ 308 unit tests + 40 integration tests passing

### Critical Missing Features

- ❌ CSV export for instructor data download
- ❌ Accessibility testing and WCAG compliance verification
- ❌ Performance smoke tests
- ❌ Author documentation and integration guides
- ❌ Production deployment artifacts

---

## Phase 0: Bootstrap + Contracts

**Purpose**: Establish toolchain and frozen interfaces per Delivery Plan Phase 0

- [X] T001 Create package.json with TypeScript 5.x, Lit 3, Vite dependencies
- [X] T002 [P] Configure Vite for library mode with IIFE + ESM outputs in vite.config.ts
- [X] T003 [P] Setup TypeScript configuration for ES2022 target in tsconfig.json
- [X] T004 [P] Configure Vitest for unit testing in vitest.config.ts
- [X] T005 [P] Configure Playwright for E2E testing with file:// protocol support in playwright.config.ts
- [X] T006 [P] Setup Storybook with Lit framework in .storybook/main.js
- [X] T007 [P] Configure Chromatic for visual regression testing
- [X] T008 [P] Setup ESLint and Prettier for code quality
- [X] T009 [P] Create CI workflow for lint, test, build, bundle size check in .github/workflows/ci.yml
- [X] T010 Create frozen contracts file from spec at src/types/contracts.ts
- [X] T011 [P] Create demo HTML fixtures for quiz tables in demo/quiz-examples.html
- [X] T012 [P] Create demo HTML fixtures for analysis tables in demo/analysis-examples.html
- [X] T013 Verify Phase 0 exit gate: contracts published, Storybook renders, CI green

---

## Phase 1: Foundational Infrastructure

**Purpose**: Blocking prerequisites that multiple user stories depend on

### Storage Layer

- [X] T014 [P] Write tests for Storage Adapter interface in tests/unit/services/storage/adapter.test.ts
- [X] T015 Create Storage Adapter interface in src/services/storage/adapter.ts
- [X] T016 [P] Write tests for IndexedDB implementation in tests/unit/services/storage/indexeddb.test.ts
- [X] T017 Implement IndexedDB storage adapter with atomic transactions in src/services/storage/indexeddb.ts

### Session Management

- [X] T018 [P] Write tests for session management in tests/unit/services/session.test.ts
- [X] T019 Implement session service with 30-minute timeout in src/services/session.ts
- [X] T020 [P] Write tests for session cache rebuilding in tests/unit/services/session-cache.test.ts
- [X] T021 Implement session cache logic in src/services/session.ts

### Validation & Utilities

- [X] T022 [P] Write tests for table validation rules in tests/unit/services/validation.test.ts
- [X] T023 Implement table validation service in src/services/validation.ts
- [X] T024 [P] Write tests for state calculation logic in tests/unit/services/state-calculator.test.ts
- [X] T025 Implement completion state calculator in src/services/state-calculator.ts

---

## Phase 2: User Story 1 - Student Takes Interactive Quiz (P1)

**Goal**: Enable students to answer quiz questions with auto-save and visual feedback

**Independent Test**: Open local HTML file with quiz table, enter answers, verify persistence and status updates

### Parsing & Detection

- [X] T026 [P] [US1] Write tests for quiz table parser (MCQ detection) in tests/unit/services/quiz-parser.test.ts
- [X] T027 [P] [US1] Write tests for quiz table parser (numeric detection) in tests/unit/services/quiz-parser.test.ts
- [X] T028 [US1] Implement quiz table DOM parser in src/services/quiz-parser.ts
- [X] T029 [P] [US1] Write tests for answer correctness checking in tests/unit/services/quiz-parser.test.ts
- [X] T030 [US1] Implement answer validation logic in src/services/quiz-parser.ts

### Login Component

- [X] T031 [P] [US1] Write tests for login component in tests/unit/components/qd-login.test.ts
- [X] T032 [US1] Create login web component with service ID + name inputs in src/components/qd-login.ts
- [X] T033 [P] [US1] Create Storybook story for login component in stories/components/qd-login.stories.ts
- [X] T034 [US1] Style login component with Shadow DOM in src/components/qd-login.ts

### Quiz Table Enhancement

- [X] T035 [P] [US1] Write tests for quiz table DOM upgrades in tests/integration/dom-upgrades/quiz-table.test.ts
- [X] T036 [US1] Implement quiz table enhancer to inject dropdowns/inputs in src/enhancers/quiz-table.ts
- [X] T037 [US1] Add event handlers for answer changes in src/enhancers/quiz-table.ts
- [X] T038 [US1] Implement auto-save on answer change (<200ms) in src/enhancers/quiz-table.ts

### Status Panel Component

- [X] T039 [P] [US1] Write tests for status panel component in tests/unit/components/qd-status.test.ts
- [X] T040 [US1] Create status panel web component in src/components/qd-status.ts
- [X] T041 [US1] Implement R/A/G color coding logic in src/components/qd-status.ts
- [X] T042 [US1] Add ARIA live regions for accessibility in src/components/qd-status.ts
- [X] T043 [P] [US1] Create Storybook stories for status panel states in stories/components/qd-status.stories.ts

### Integration & Entry Point

- [X] T044 [US1] Implement main entry point with auto-init in src/index.ts
- [X] T045 [US1] Wire up DOMContentLoaded detection and table scanning in src/index.ts
- [ ] T046 [P] [US1] Write E2E test for complete login → answer → save flow in tests/e2e/workflows/student-quiz.spec.ts
- [X] T047 [US1] Verify Phase 1 exit gate: Chromatic interactions pass, parsing unit tests green

---

## Phase 3: User Story 2 - Student Reviews Overall Progress (P2)

**Goal**: Display color-coded progress badges on home page links

**Independent Test**: Complete quiz pages to various states, verify home page badges update correctly

### Home Page Badge Enhancement

- [X] T048 [P] [US2] Write tests for home page badge detection in tests/unit/enhancers/home-badges.test.ts
- [X] T049 [US2] Implement badge injector for links with qd-test-link class in src/enhancers/home-badges.ts
- [X] T050 [US2] Calculate badge color from session cache in src/enhancers/home-badges.ts
- [X] T051 [US2] Handle cache rebuild after session expiry in src/enhancers/home-badges.ts

### Cache Management

- [X] T052 [P] [US2] Write tests for cache update after quiz completion in tests/unit/services/session-cache.test.ts
- [X] T053 [US2] Implement cache synchronization on answer save in src/services/session.ts
- [X] T054 [P] [US2] Create Storybook story for home page with various badge states in stories/tables/home-badges.stories.ts

### Integration

- [X] T055 [P] [US2] Write E2E test for home page badge updates in tests/e2e/workflows/progress-tracking.spec.ts
- [X] T056 [US2] Verify independent test: badges reflect quiz completion accurately

---

## Phase 4: User Story 4 - Student Captures Analysis Notes (P4)

**Goal**: Enable students to enter analysis data in editable table cells

**Independent Test**: Enter text in analysis cells, verify persistence after reload

**Note**: Implemented before US3 as it doesn't depend on instructor features

### Parsing & Detection

- [X] T057 [P] [US4] Write tests for analysis table parser in tests/unit/services/analysis-parser.test.ts
- [X] T058 [US4] Implement analysis table DOM parser in src/services/analysis-parser.ts
- [X] T059 [US4] Implement editable cell detection (no background-color) in src/services/analysis-parser.ts
- [X] T060 [US4] Implement cell key generation (R{row}C{col}#f:{hash}) in src/services/analysis-parser.ts

### Table Enhancement

- [X] T061 [P] [US4] Write tests for analysis table DOM upgrades in tests/integration/dom-upgrades/analysis-table.test.ts
- [X] T062 [US4] Implement analysis table enhancer to inject text inputs in src/enhancers/analysis-table.ts
- [X] T063 [US4] Add event handlers for cell value changes in src/enhancers/analysis-table.ts
- [X] T064 [US4] Implement auto-save on cell edit in src/enhancers/analysis-table.ts
- [X] T065 [P] [US4] Create Storybook stories for analysis tables in stories/tables/analysis.stories.ts

### Integration

- [X] T066 [P] [US4] Write E2E test for analysis data persistence in tests/e2e/workflows/analysis-capture.spec.ts
- [X] T067 [US4] Verify Phase 2 exit gate: visual baselines stable, cell mapping tests pass

---

## Phase 5: User Story 3 - Instructor Reviews Student Answers (P3)

**Goal**: Allow instructors to unlock and view correct answers with student comparisons

**Independent Test**: Enter instructor password, verify answer reveal and student data display

### Instructor Component

- [X] T068 [P] [US3] Write tests for instructor component in tests/unit/components/qd-instructor.test.ts
- [X] T069 [US3] Create instructor unlock component in src/components/qd-instructor.ts
- [X] T070 [US3] Implement password validation (hashed storage) in src/components/qd-instructor.ts
- [X] T071 [US3] Add unlock/lock state management in src/services/session.ts

### Answer Reveal Logic

- [X] T072 [P] [US3] Write tests for answer reveal in quiz tables in tests/unit/enhancers/quiz-table.test.ts
- [X] T073 [US3] Implement correct answer display in quiz enhancer in src/enhancers/quiz-table.ts
- [X] T074 [US3] Implement student answer comparison tables in src/enhancers/quiz-table.ts
- [X] T075 [US3] Add success/failure color coding for student answers in src/enhancers/quiz-table.ts

### Analysis Review

- [X] T076 [P] [US3] Write tests for analysis cell review in tests/unit/enhancers/analysis-table.test.ts
- [X] T077 [US3] Implement student entry display for analysis cells in src/enhancers/analysis-table.ts
- [X] T078 [US3] Add 4-char username prefix display in src/enhancers/analysis-table.ts

### Scores Page

- [X] T079 [P] [US3] Write tests for scores page data aggregation in tests/unit/services/scores.test.ts
- [X] T080 [US3] Create scores service to aggregate student data in src/services/scores.ts
- [X] T081 [US3] Implement scores page rendering logic in src/components/qd-instructor.ts
- [X] T082 [P] [US3] Create Storybook story for instructor view in stories/components/qd-instructor.stories.ts

### Integration

- [X] T083 [P] [US3] Write E2E test for instructor unlock flow in tests/e2e/workflows/instructor-review.spec.ts
- [X] T084 [US3] Verify Phase 3 exit gate: A11y checks pass, events qd:unlock/qd:lock emitted

---

## Phase 6: User Story 5 - Instructor Manages Class Cohorts (P5)

**Goal**: Enable CSV export and complete data erasure for new cohorts

**Independent Test**: Export CSV, erase all data with confirmation, verify clean state

### CSV Export

- [ ] T085 [P] [US5] Write tests for CSV generation in tests/unit/services/csv-export.test.ts
- [ ] T086 [US5] Implement CSV export service (RFC 4180 with BOM) in src/services/csv-export.ts
- [ ] T087 [US5] Add per-question and per-page export options in src/services/csv-export.ts
- [ ] T088 [US5] Implement file download trigger in src/components/qd-instructor.ts

### Data Erasure

- [X] T089 [P] [US5] Write tests for data erasure with confirmation in tests/unit/services/storage/indexeddb.test.ts
- [X] T090 [US5] Implement clearAll method in IndexedDB adapter in src/services/storage/indexeddb.ts
- [X] T091 [US5] Add "DELETE ALL" typed confirmation UI in src/components/qd-instructor.ts
- [ ] T092 [US5] Implement cross-tab sync for data erasure in src/services/session.ts

### Integration

- [ ] T093 [P] [US5] Write E2E test for CSV export in tests/e2e/workflows/cohort-management.spec.ts
- [ ] T094 [P] [US5] Write E2E test for data erasure flow in tests/e2e/workflows/cohort-management.spec.ts
- [ ] T095 [US5] Verify independent test: system returns to blank state after erasure

---

## Phase 7: Validation, Accessibility, Performance

**Purpose**: Production readiness (Delivery Plan Phase 6)

### Author Validation

- [X] T096 [P] Write tests for authoring constraint validation in tests/unit/services/validation.test.ts
- [ ] T097 Implement one-quiz-per-page validation in src/services/validation.ts
- [ ] T098 Implement one-analysis-per-page validation in src/services/validation.ts
- [ ] T099 Implement MCQ 1-indexed validation in src/services/validation.ts
- [ ] T100 Create error banner component for validation failures in src/components/qd-error-banner.ts

### Accessibility

- [ ] T101 [P] Write tests for keyboard navigation in tests/unit/components/qd-login.test.ts
- [ ] T102 Add keyboard focus management to all components in src/components/
- [ ] T103 Implement screen reader announcements for status changes in src/components/qd-status.ts
- [ ] T104 Add WCAG 2.1 AA color contrast verification in stories/
- [ ] T105 [P] Run accessibility audit with axe-core in tests/e2e/a11y.spec.ts

### Performance

- [X] T106 [P] Implement bundle size check (<25KB gzipped) in package.json scripts
- [X] T107 Optimize Lit imports with tree-shaking in src/index.ts
- [X] T108 Add debouncing to auto-save operations (200ms) in src/enhancers/
- [ ] T109 Implement batch IndexedDB writes in src/services/storage/indexeddb.ts
- [ ] T110 [P] Write performance smoke tests for page load (<2s) in tests/e2e/performance.spec.ts

### Documentation

- [ ] T111 [P] Create authoring guide for content authors
- [ ] T112 [P] Create integration guide for DITA template updates
- [ ] T113 [P] Update README with installation instructions

### Exit Gate Verification

- [ ] T114 Run full test suite and verify all tests pass
- [ ] T115 Run Chromatic visual regression tests
- [X] T116 Verify bundle size <25KB min+gzip
- [ ] T117 Verify performance goals: <200ms saves, <2s page loads
- [ ] T118 Verify Phase 6 exit gate: perf and a11y green, size budget met

---

## Phase 8: Beta Deployment & Feedback (Delivery Plan Phase 7)

**Purpose**: Field trial preparation

### Release Packaging

- [ ] T119 Create GitHub Release ZIP with dist/ and demo/ in package.json
- [ ] T120 Generate checksums for dist files
- [ ] T121 [P] Create GitHub Pages demo deployment in .github/workflows/deploy-demo.yml
- [ ] T122 [P] Write CHANGELOG.md with release notes

### Integration Testing

- [ ] T123 [P] Test integration with Oxygen DITA template
- [ ] T124 Verify single script tag integration pattern
- [ ] T125 Test on reference hardware (older training machines)
- [ ] T126 [P] Test in all target browsers (Chrome 96+, Firefox 102+)

### Feedback Collection

- [ ] T127 Create feedback form for instructor sign-off
- [ ] T128 Document known issues and workarounds
- [ ] T129 Verify Phase 7 exit gate: instructor sign-off on core workflows

---

## Dependencies & Execution Strategy

### Story Dependency Graph

```
Phase 0 (Bootstrap) → Phase 1 (Foundation)
                           ↓
        ┌─────────────────────────────────┐
        ↓                                 ↓
    US1 (Quiz Core)                 US4 (Analysis)
        ↓                                 ↓
    US2 (Progress)                       ↓
        ↓                                 ↓
        └──────────→ US3 (Instructor) ←──┘
                           ↓
                    US5 (Cohort Mgmt)
                           ↓
                  Phase 7 (Polish)
                           ↓
                  Phase 8 (Deploy)
```

### Parallel Execution Opportunities

**Phase 0**: All tasks T002-T012 can run in parallel after T001

**Phase 1**:
- T014-T017 (Storage) can run in parallel
- T018-T021 (Session) can run in parallel
- T022-T025 (Validation) can run in parallel

**US1**:
- T026-T027 (Parser tests) can run in parallel
- T031-T034 (Login component) independent from T026-T030
- T039-T043 (Status component) independent from quiz parser

**US2**: Minimal dependencies, mostly serial on US1 completion

**US4**: Independent from US1-US3, can start after Phase 1

**US3**: Depends on US1 + US4 completion

**US5**: Depends on US3 completion

### Independent Test Criteria Per Story

- **US1**: Open HTML, login, answer questions, verify save and status update
- **US2**: Complete quizzes, check home page badges reflect states
- **US3**: Unlock instructor mode, verify answer reveal and student data
- **US4**: Enter analysis data, reload page, verify persistence
- **US5**: Export CSV, erase data with confirmation, verify clean state

### MVP Recommendation

**Minimum Viable Product**: User Story 1 only (T001-T047)
- Delivers core value: students can take quizzes with auto-save
- Independently testable and deployable
- Establishes foundation for remaining stories

---

## Task Summary

**Total Tasks**: 129
- Phase 0 (Bootstrap): 13 tasks
- Phase 1 (Foundation): 12 tasks
- US1 (Quiz Core): 22 tasks
- US2 (Progress): 9 tasks
- US4 (Analysis): 11 tasks
- US3 (Instructor): 17 tasks
- US5 (Cohort Mgmt): 11 tasks
- Phase 7 (Polish): 24 tasks
- Phase 8 (Deploy): 11 tasks

**Parallel Opportunities**: 45 tasks marked with [P]

**TDD Tasks**: All implementation tasks preceded by test tasks (following Red-Green-Refactor cycle)