# Tasks: CSS-Based Quiz Answer Hiding

**Input**: Design documents from `/specs/010-css-answer-hiding/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not explicitly requested - test verification via existing test suite (SC-002: 100% existing tests must pass)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- CSS files: `dita/template/`, `dita-demo/oxygen-webhelp/template/`
- JS files: `src/init/`
- Tests: `tests/integration/`, `tests/e2e/workflows/`

---

## Phase 1: Setup (Verification)

**Purpose**: Verify current state and existing tests pass

- [x] T001 Run existing test suite to establish baseline in terminal
- [x] T002 Verify current CSS hiding exists at `dita/template/f13ldman.css` lines 584-586

**Checkpoint**: Baseline established - all existing tests passing

---

## Phase 2: User Story 1 - Student Cannot See Answers Before Login (Priority: P1) 🎯 MVP

**Goal**: Hide answer/detail columns via CSS before JavaScript executes

**Independent Test**: Open quiz page with JS disabled → answer columns invisible

### Implementation for User Story 1

- [x] T003 [US1] Update base CSS hiding to include th elements in `dita/template/f13ldman.css`
- [x] T004 [US1] Run tests to verify no regressions in terminal

**Checkpoint**: US1 complete - answers hidden by CSS before JS executes

---

## Phase 3: User Story 2 - Student Sees Input Controls After Login (Priority: P1)

**Goal**: Student interactive mode overrides CSS hiding to reveal answer column

**Independent Test**: Login as student → input controls visible in answer column

### Implementation for User Story 2

- [x] T005 [US2] Add student mode override CSS (.qd-quiz-interactive) in `dita/template/f13ldman.css`
- [x] T006 [US2] Run tests to verify student inputs visible after login in terminal

**Checkpoint**: US2 complete - students can see and use input controls

---

## Phase 4: User Story 3 - Instructor Sees All Columns (Priority: P2)

**Goal**: Instructor mode overrides CSS hiding to reveal both answer and detail columns

**Independent Test**: Login as instructor → all columns visible

### Implementation for User Story 3

- [x] T007 [US3] Add instructor mode override CSS (.qd-quiz-instructor) in `dita/template/f13ldman.css`
- [x] T008 [US3] Add qd-quiz-instructor class in revealQuizAnswersForInstructor() at `src/init/bootstrap.ts`
- [x] T009 [US3] Run tests to verify instructor sees all columns in terminal

**Checkpoint**: US3 complete - instructors can see all columns

---

## Phase 5: User Story 4 - Author Visual Indicators (Priority: P3)

**Goal**: Content authors see colored backgrounds on hidden/interactive cells in Oxygen

**Independent Test**: Open quiz/analysis table in Oxygen Author mode → colored backgrounds visible

### Implementation for User Story 4

- [x] T010 [US4] Add quiz hidden cell indicators (light red) to `dita/template/f13ldman_author_mode.css`
- [x] T011 [P] [US4] Add analysis interactive cell indicator (light green) to `dita/template/f13ldman_author_mode.css`

**Checkpoint**: US4 complete - authors see visual indicators when editing

---

## Phase 6: Polish & Sync

**Purpose**: Sync files and final verification

- [x] T012 Sync CSS changes to `dita-demo/oxygen-webhelp/template/f13ldman.css`
- [x] T013 Run full test suite (unit, integration, E2E) in terminal
- [x] T014 Run npm build and verify bundle size in terminal
- [x] T015 Manual verification in demo: open `demo/quiz-examples.html` and test all modes

**Checkpoint**: All user stories complete, tests passing, ready for PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify baseline
- **US1 (Phase 2)**: Depends on Setup - base hiding
- **US2 (Phase 3)**: Depends on US1 - student override
- **US3 (Phase 4)**: Can run parallel to US2 (different mode)
- **US4 (Phase 5)**: Independent - different file (author mode CSS)
- **Polish (Phase 6)**: Depends on all stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundational - base CSS hiding
- **User Story 2 (P1)**: Requires US1 complete (overrides base hiding)
- **User Story 3 (P2)**: Requires US1 complete (overrides base hiding), can run parallel to US2
- **User Story 4 (P3)**: Independent - author mode CSS is separate file

### Parallel Opportunities

- T010 and T011 can run in parallel (same file, different selectors)
- US3 and US4 can run in parallel (different files, no dependencies)

---

## Parallel Example: User Story 4

```bash
# Launch both author mode CSS tasks together:
Task: "Add quiz hidden cell indicators to dita/template/f13ldman_author_mode.css"
Task: "Add analysis interactive cell indicator to dita/template/f13ldman_author_mode.css"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete T001-T002: Verify baseline
2. Complete T003-T004: Base CSS hiding (US1)
3. Complete T005-T006: Student override (US2)
4. **STOP and VALIDATE**: Test student flow end-to-end
5. Proceed with US3, US4 if MVP validated

### Files Modified Summary

| File | Tasks | Purpose |
|------|-------|---------|
| `dita/template/f13ldman.css` | T003, T005, T007 | Base hiding + overrides |
| `dita/template/f13ldman_author_mode.css` | T010, T011 | Author indicators |
| `src/init/bootstrap.ts` | T008 | Add instructor class |
| `dita-demo/oxygen-webhelp/template/f13ldman.css` | T012 | Demo sync |

---

## Notes

- [P] tasks = can run in parallel (different files/selectors)
- [Story] label maps task to specific user story
- CSS changes are additive - existing JS security layer unaffected
- Run tests after each phase to catch regressions early
- `visibility: hidden` preserves layout - no shift expected
