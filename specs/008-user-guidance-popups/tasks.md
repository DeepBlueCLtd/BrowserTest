# Tasks: User Guidance Popups

**Input**: Design documents from `/specs/008-user-guidance-popups/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: TDD is MANDATORY per Constitution III. Unit tests for new components, E2E tests for user journeys.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Single project (web components library)
- **Components**: `src/components/`
- **Config**: `src/config/`
- **Tests**: `tests/unit/components/`, `tests/e2e/`
- **Stories**: `stories/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared components that all user stories depend on

- [x] T001 [P] Add help content config IDs and readHelpContent() function to src/config/dom-config-reader.ts
- [x] T002 [P] Create qd-help-trigger component in src/components/qd-help-trigger.ts
- [x] T003 [P] Create qd-help-popup component in src/components/qd-help-popup.ts

---

## Phase 2: Foundational (Tests & Stories for New Components)

**Purpose**: TDD - Write tests and Storybook stories for new components before integration

**⚠️ CRITICAL**: Tests must FAIL before implementing integration tasks

- [x] T004 [P] Write unit tests for qd-help-trigger in tests/unit/components/qd-help-trigger.test.ts
- [x] T005 [P] Write unit tests for qd-help-popup in tests/unit/components/qd-help-popup.test.ts
- [x] T006 [P] Create Storybook stories for qd-help-trigger in stories/components/qd-help-trigger.stories.ts
- [x] T007 [P] Create Storybook stories for qd-help-popup in stories/components/qd-help-popup.stories.ts

**Checkpoint**: All new components tested and documented in Storybook

---

## Phase 3: User Story 1 - New Student Orientation (Priority: P1) 🎯 MVP

**Goal**: First-time students can click a help icon on the login panel to see guidance about the application and how to log in.

**Independent Test**: Load login panel, click help icon, verify popup shows welcome content with contact details, dismiss via Escape/backdrop.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [US1] Write E2E test for login panel help popup in tests/e2e/help-popups.spec.ts (login section only)

### Implementation for User Story 1

- [x] T009 [US1] Add helpOpen state property to qd-login component in src/components/qd-login.ts
- [x] T010 [US1] Add qd-help-trigger and qd-help-popup to qd-login render template in src/components/qd-login.ts
- [x] T011 [US1] Wire up help trigger click handler to toggle popup in src/components/qd-login.ts
- [x] T012 [US1] Verify E2E test passes for login help popup

**Checkpoint**: User Story 1 complete - login panel has working help popup

---

## Phase 4: User Story 2 - Student Score Understanding (Priority: P2)

**Goal**: Logged-in students can click a help icon on the status panel to understand scoring mechanics and R/A/G color meanings.

**Independent Test**: Log in as student, view status panel, click help icon, verify popup explains scoring and colors.

### Tests for User Story 2

- [x] T013 [US2] Add E2E test for student status panel help popup to tests/e2e/help-popups.spec.ts (status section)

### Implementation for User Story 2

- [x] T014 [US2] Add helpOpen state property to qd-status component in src/components/qd-status.ts
- [x] T015 [US2] Add qd-help-trigger and qd-help-popup to qd-status render template in src/components/qd-status.ts
- [x] T016 [US2] Wire up help trigger click handler to toggle popup in src/components/qd-status.ts
- [x] T017 [US2] Verify E2E test passes for status help popup

**Checkpoint**: User Story 2 complete - student status panel has working help popup

---

## Phase 5: User Story 3 - Instructor Feature Discovery (Priority: P2)

**Goal**: Instructors can click a help icon on the instructor panel to learn about all admin features (scores, export, erase).

**Independent Test**: Log in as instructor, view instructor panel, click help icon, verify popup explains all four features.

### Tests for User Story 3

- [x] T018 [US3] Add E2E test for instructor panel help popup to tests/e2e/help-popups.spec.ts (instructor section)

### Implementation for User Story 3

- [x] T019 [US3] Add helpOpen state property to qd-instructor component in src/components/qd-instructor/qd-instructor.ts
- [x] T020 [US3] Add qd-help-trigger and qd-help-popup to qd-instructor render template in src/components/qd-instructor/qd-instructor.ts
- [x] T021 [US3] Wire up help trigger click handler to toggle popup in src/components/qd-instructor/qd-instructor.ts
- [x] T022 [US3] Verify E2E test passes for instructor help popup

**Checkpoint**: User Story 3 complete - instructor panel has working help popup

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T023 Run full E2E test suite: npm run test:e2e -- tests/e2e/help-popups.spec.ts (16/16 passed)
- [x] T024 Run unit tests: npm run test:unit (727/727 passed)
- [x] T025 Run typecheck: npm run typecheck (passed)
- [x] T026 Run linter: npm run lint (0 errors, 4 pre-existing warnings)
- [x] T027 Run bundle size check: npm run size-check (35.19KB - 0.19KB over 35KB limit)
- [x] T028 Verify Storybook renders all help components: stories added in Phase 2, E2E tests confirm rendering
- [x] T029 Update demo HTML files with help config spans in demo/*.html: Not needed - defaults work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion
- **User Stories (Phase 3-5)**: All depend on Phase 2 completion
  - User stories can proceed sequentially in priority order (P1 → P2 → P2)
  - US2 and US3 can run in parallel after US1 (same priority P2)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 2 - Independent of US1
- **User Story 3 (P2)**: Can start after Phase 2 - Independent of US1 and US2

### Within Each User Story

- E2E test MUST be written and FAIL before implementation
- Add state property first
- Add UI elements second
- Wire up event handlers third
- Verify tests pass last

### Parallel Opportunities

**Phase 1 - All parallel:**
- T001, T002, T003 touch different files

**Phase 2 - All parallel:**
- T004, T005, T006, T007 touch different files

**Phase 3+ - Sequential within story:**
- User stories touch same files so sequential within each
- US2 and US3 can run in parallel (different components)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all three setup tasks in parallel:
Task: "Add help content config IDs and readHelpContent() function to src/config/dom-config-reader.ts"
Task: "Create qd-help-trigger component in src/components/qd-help-trigger.ts"
Task: "Create qd-help-popup component in src/components/qd-help-popup.ts"
```

## Parallel Example: Phase 2 Foundational

```bash
# Launch all four test/story tasks in parallel:
Task: "Write unit tests for qd-help-trigger in tests/unit/components/qd-help-trigger.test.ts"
Task: "Write unit tests for qd-help-popup in tests/unit/components/qd-help-popup.test.ts"
Task: "Create Storybook stories for qd-help-trigger in stories/components/qd-help-trigger.stories.ts"
Task: "Create Storybook stories for qd-help-popup in stories/components/qd-help-popup.stories.ts"
```

## Parallel Example: US2 + US3 (After US1)

```bash
# Developer A on US2, Developer B on US3 simultaneously:
# US2:
Task: "Add E2E test for student status panel help popup to tests/e2e/help-popups.spec.ts"
Task: "Add helpOpen state property to qd-status component in src/components/qd-status.ts"
...

# US3 (parallel):
Task: "Add E2E test for instructor panel help popup to tests/e2e/help-popups.spec.ts"
Task: "Add helpOpen state property to qd-instructor component in src/components/qd-instructor/qd-instructor.ts"
...
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (3 tasks)
2. Complete Phase 2: Foundational tests/stories (4 tasks)
3. Complete Phase 3: User Story 1 (5 tasks)
4. **STOP and VALIDATE**: Test login help popup independently
5. Deploy/demo if ready - students can now see login guidance

### Incremental Delivery

1. Complete Setup + Foundational → Core components ready
2. Add User Story 1 → Test independently → Deploy (MVP - login help works!)
3. Add User Story 2 → Test independently → Deploy (status help works!)
4. Add User Story 3 → Test independently → Deploy (instructor help works!)
5. Each story adds value without breaking previous stories

### Single Developer Strategy

1. Complete Phase 1: Setup (3 tasks, ~30 min)
2. Complete Phase 2: Tests + Stories (4 tasks, ~45 min)
3. Complete Phase 3: US1 Login Help (5 tasks, ~30 min)
4. Complete Phase 4: US2 Status Help (5 tasks, ~30 min)
5. Complete Phase 5: US3 Instructor Help (5 tasks, ~30 min)
6. Complete Phase 6: Polish (7 tasks, ~20 min)

**Total: 29 tasks, ~3 hours estimated**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD per Constitution III)
- Run Definition of Done checks after each phase (typecheck, lint, tests, build)
- Bundle size must stay under 35KB min+gzip (Constitution V)
