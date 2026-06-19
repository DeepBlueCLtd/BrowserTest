---
description: "Task list for hot-spot refactoring feature"
---

# Tasks: Refactor Architectural Hot-Spots for Maintainability

**Input**: Design documents from `/specs/012-code-review/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/module-boundaries.md, quickstart.md

**Tests**: INCLUDED. The spec mandates TDD (FR-010, Constitution III). Every behavior-changing extraction is preceded by a **characterization test** that captures current behavior, must pass against the old code, and must still pass after the move.

**Organization**: Tasks are grouped by the four user stories from spec.md. US1 (P1) is the report, US2 (P1) is security/duplication, US3 (P2) is decomposition, US4 (P3) is reusable Lit components.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 / US3 / US4 (omitted for Setup, Foundational, Polish)

## Path Conventions

Single-project browser library: source under `src/`, tests under `tests/unit/` and `tests/integration/`.

## Golden rule

Behavior-preserving, test-gated, one slice at a time. The **only** sanctioned behavior change is the quiz instructor-overlay XSS fix (T020/T021, FR-004). After every task: run the Definition of Done (`typecheck`, `lint`, `test:unit`, `test:integration`, `format:check`, `build`, and `size-check` for any Lit slice) and commit.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline is green so every later slice can be verified against it.

- [X] T001 Run the full Definition of Done baseline (`npm run typecheck && npm run lint && npm run test:unit && npm run test:integration && npm run format:check && npm run build && npm run size-check`) and record the current bundle size as the regression budget in `specs/012-code-review/quickstart.md` notes
- [X] T002 [P] Capture current file line counts for all in-scope modules (`wc -l` for the 8 target files) as the before/after baseline for SC-002

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wave 1 — zero-behavior-change consolidation that later dedup/decomposition slices depend on. These remove duplication the later waves would otherwise have to move twice.

**⚠️ CRITICAL**: Complete before US2/US3/US4 extraction work begins.

- [X] T003 [P] Add `INSTRUCTOR_SHOW_ANSWERS` constant to `STORAGE_KEYS` in `src/utils/storage-helpers.ts` (or the existing keys module) and replace the `'qd/instructor/showAnswers'` magic string in `src/services/session.ts`, `src/init/bootstrap.ts`, and `src/init/event-coordinator.ts`
- [X] T004 [P] Create `src/utils/page-id.ts` exporting `getPageIdFromUrl(url?)` and replace the inline pathname→filename→strip-`.html` parses in `src/init/bootstrap.ts` (×2) and `src/init/event-coordinator.ts`
- [X] T005 [P] Add unit test `tests/unit/page-id.test.ts` for `getPageIdFromUrl` (root, nested, query string, hash, missing `.html`)
- [X] T006 [P] Add `clearBadges(link)` helper in `src/enhancers/home-badges.ts` and replace the three duplicated badge-stripping loops
- [X] T007 [P] Add `createEmptyStudentRecord(session)` to `src/services/storage-service.ts` and replace the two duplicated new-record literals in `loadStudentRecord`
- [X] T008 Consolidate shared styles (`button.primary`, `.error-message`, `.button-row`, spinner, modal-overlay) into `src/components/qd-instructor/shared-styles.ts` and import them in `qd-migration-dialog.ts`, `qd-pin-create.ts`, and `qd-login.ts`

**Checkpoint**: Shared helpers/constants/styles in place; no observable behavior change; all tests green.

---

## Phase 3: User Story 1 - Maintainer receives a prioritized hot-spot report (Priority: P1) 🎯 MVP

**Goal**: Deliver an evidence-based, prioritized report of refactoring recommendations covering all five hot-spot criteria.

**Independent Test**: Open `specs/012-code-review/code-review-report.md`; confirm every `src/**` file over 400 lines is listed with severity and a concrete split, each of the five criteria is addressed with file/line references, and a lowest-risk→highest-payoff sequence is present.

> This story is the primary deliverable and is already produced. Tasks below verify it against the spec's acceptance criteria.

- [X] T009 [US1] Verify `specs/012-code-review/code-review-report.md` lists every `src/**` file >400 lines with line count, severity, and a decomposition recommendation (FR-001 / SC-001), reconciling against the T002 baseline
- [X] T010 [P] [US1] Verify the report addresses all five hot-spot criteria (UI/logic coupling, deep nesting, extractable components, Lit candidates, oversized files) each with specific file/line references (FR-002)
- [X] T011 [P] [US1] Verify the report includes a recommended execution order ranked lowest-risk → highest-payoff (FR-003)

**Checkpoint**: Report validated; MVP deliverable complete.

---

## Phase 4: User Story 2 - Eliminate duplicated and security-sensitive logic (Priority: P1)

**Goal**: Resolve the highest-risk findings: the quiz-overlay XSS, the duplicated instructor answer-reveal logic, the duplicated authentication/PIN/login paths, and duplicated instructor-password hashing and config reads.

**Independent Test**: Student-supplied markup renders as inert text in the instructor overlay; instructor answer-reveal behaves identically via bootstrap and post-login from one shared function; normal and post-migration login share one code path; one `instructor-auth` implementation; config reads go through `readDOMConfig()`.

### Tests for User Story 2 (write FIRST, confirm red/green) ⚠️

- [X] T012 [P] [US2] Characterization test `tests/integration/quiz-instructor-overlay.test.ts` asserting current rendered student-answer overlay content and structure (baseline before XSS fix)
- [X] T013 [P] [US2] Add XSS regression test in `tests/integration/quiz-instructor-overlay.test.ts`: a student answer/name containing `<script>`/HTML must render as literal text, not markup (FR-004, SC-003)
- [X] T014 [P] [US2] Characterization test `tests/integration/instructor-answer-reveal.test.ts` capturing the current reveal behavior (columns unhidden, correct answers re-injected) for both initial-load and post-login paths (FR-005)
- [X] T015 [P] [US2] Characterization test `tests/unit/auth-service.test.ts` covering the current student login outcomes: success, new student, lockout, bad PIN, needs-migration, and retry-after-migration (FR-006)
- [X] T016 [P] [US2] Unit test `tests/unit/instructor-auth.test.ts` for SHA-256 + 12-char-truncation hashing/verification (FR-008)

### Implementation for User Story 2

- [X] T017 [P] [US2] Create `src/services/auth/instructor-auth.ts` (`hashPassword`, `verifyInstructorPassword`) per contracts; route `src/components/qd-login.ts` and `src/components/qd-migration-dialog.ts` through it, deleting the duplicated crypto
- [X] T018 [US2] Route all DOM config reads (DB name, title, hash) in `src/components/qd-login.ts`, `src/components/qd-pin-reset-dialog.ts`, and `src/components/qd-migration-dialog.ts` through `src/config/dom-config-reader.ts` (`readDOMConfig`/`CONFIG_IDS`), removing inline `document.getElementById(...)` reads (FR-008)
- [X] T019 [US2] Create `src/enhancers/instructor-answer-reveal.ts` exporting `revealInstructorAnswers`/`hideInstructorAnswers`; replace the duplicated instructor branches in `src/init/bootstrap.ts` (`revealQuizAnswersForInstructor`) and `src/init/event-coordinator.ts` (`upgradeTablesAfterLogin`) with calls to it (FR-005, SC-004)
- [X] T020 [US2] Fix the `innerHTML` XSS in the quiz instructor overlay in `src/enhancers/quiz-table.ts` by rendering student-supplied fields via `textContent`/element construction (FR-004, SC-003) — make T013 pass
- [X] T021 [US2] Create `src/services/auth/auth-service.ts` with `loginStudent`/`retryAfterMigration` returning the result union per contracts; consolidate the duplicated success path so `handleStudentLogin` and `retryLoginAfterMigration` in `src/components/qd-login.ts` both delegate, deleting the ~100-line duplicate (FR-006, SC-004) — make T015 pass

**Checkpoint**: No student data rendered via `innerHTML`; answer-reveal and login-success logic each exist in exactly one place; instructor-auth and config reads de-duplicated.

---

## Phase 5: User Story 3 - Decompose oversized modules into focused units (Priority: P2)

**Goal**: Split the six oversized modules into single-responsibility units so no in-scope file (except frozen `contracts.ts`) exceeds ~400 lines.

**Independent Test**: After this phase, `find src -name '*.ts' | xargs wc -l | awk '$1>400'` returns only `contracts.ts`; extracted units have unit tests; all existing tests pass unchanged.

### Tests for User Story 3 (write FIRST) ⚠️

- [X] T022 [P] [US3] Characterization tests `tests/integration/indexeddb-adapter.test.ts` covering get/save student, getByRelease, backup, audit-event, clearAll, and DB open/upgrade/recovery (baseline before split)
- [ ] T023 [P] [US3] Characterization tests `tests/integration/quiz-table-enhance.test.ts` covering interactive enhancement, answer save + validation styling, and column show/hide
- [ ] T024 [P] [US3] Characterization tests `tests/integration/analysis-table-enhance.test.ts` covering interactive enhancement, cell save, and student-entry display
- [X] T025 [P] [US3] Characterization tests `tests/unit/session-cache.test.ts` for `buildCacheFromRecord` and related cache math
- [ ] T026 [P] [US3] Characterization tests `tests/integration/bootstrap.test.ts` for global-style injection, table enhancement loops, and existing-session table upgrade

### Implementation — storage (`indexeddb.ts`, 759 lines)

- [X] T027 [P] [US3] Create `src/services/storage/idb-helpers.ts` (`promisifyRequest`, `runTransaction`) per contracts and add `tests/unit/idb-helpers.test.ts`
- [X] T028 [US3] Extract `src/services/storage/idb-codec.ts` (encryption-aware `encodeForStore`/`decodeStoredValue`, format-mismatch detection) from `indexeddb.ts`; adapter no longer references `ENCRYPT_STORAGE`/`deriveKey`
- [X] T029 [US3] Extract `src/services/storage/idb-connection.ts` (`openDatabase` owning `DB_VERSION`, `onupgradeneeded`, timeout/corruption recovery) from `indexeddb.ts`
- [X] T030 [P] [US3] Extract `src/services/storage/backup-repository.ts` and `src/services/storage/audit-log-repository.ts` from `indexeddb.ts`
- [X] T031 [US3] Refactor `src/services/storage/indexeddb.ts` into a thin coordinator delegating to T027–T030 (use `runTransaction` everywhere; remove hand-rolled `clearAll` barrier); verify <400 lines

### Implementation — session (`session.ts`, 443 lines)

- [X] T032 [US3] Extract `src/services/session-cache.ts` (`buildCacheFromRecord`, `buildPageCache`, `registerPageQuestions`, `updateCacheWithAnswer`) from `src/services/session.ts`; re-point `storage-service.ts` import; verify `session.ts` <300 lines — make T025 pass

### Implementation — enhancers (`quiz-table.ts` 807, `analysis-table.ts` 637)

- [ ] T033 [P] [US3] Extract `src/enhancers/quiz-table-columns.ts` (column show/hide + `removeColgroup`) from `quiz-table.ts`
- [ ] T034 [P] [US3] Extract `src/enhancers/quiz-input-factory.ts` (`createQuestionInput`) from `quiz-table.ts`
- [ ] T035 [US3] Extract `src/enhancers/quiz-answer-persistence.ts` (`handleAnswerInput`, `saveAnswer`, `applyValidationStyling`) from `quiz-table.ts`
- [ ] T036 [US3] Extract `src/enhancers/quiz-instructor-overlay.ts` (show/hide student answers) from `quiz-table.ts`; reduce `quiz-table.ts` to lifecycle/orchestration and verify <400 lines
- [ ] T037 [P] [US3] Create `src/services/analysis-display.ts` (pure `groupEntriesByCell`, `sortByTimestamp`) moved from `analysis-table.ts`, with `tests/unit/analysis-display.test.ts`
- [ ] T038 [US3] Add `updateRecordWithAnalysis` to `src/services/storage-service.ts` and extract `src/enhancers/analysis-persistence.ts` (`saveCellData`) from `analysis-table.ts` using it
- [ ] T039 [US3] Extract `src/enhancers/analysis-instructor-overlay.ts` (`createStudentEntriesDisplay`, show/hide entries) from `analysis-table.ts`; reduce `analysis-table.ts` to lifecycle and verify <400 lines

### Implementation — init (`bootstrap.ts` 490, `event-coordinator.ts` 339)

- [ ] T040 [P] [US3] Extract the global CSS literal into `src/init/global-styles.ts` and import it from `src/init/bootstrap.ts`
- [ ] T041 [US3] Collapse the three near-identical `enhanceAll*`/`enhanceHomeBadgesIfPresent` helpers in `src/init/bootstrap.ts` into one parameterized helper; relocate `checkExistingSessionAndUpgradeTables` business logic so `bootstrap.ts` is a thin sequencer and verify <400 lines
- [ ] T042 [US3] Move the inline login-handler IO block and `upgradeTablesAfterLogin` business logic out of `src/init/event-coordinator.ts` (into storage/session and the shared reveal from T019) so the coordinator only routes events

### Implementation — login component (`qd-login.ts` 983)

- [ ] T043 [US3] Reduce `src/components/qd-login.ts` to a presentational view that maps `AuthService` (T021) result unions → state; verify <400 lines — extract the optional `src/components/qd-lockout-banner.ts` if needed to meet the threshold

**Checkpoint**: All six oversized modules under ~400 lines; extracted units tested; all existing tests green.

---

## Phase 6: User Story 4 - Extract reusable UI into Lit components (Priority: P3)

**Goal**: Convert repeated raw-DOM UI into reusable, Shadow-DOM-isolated Lit components; remove inline styling and string-built markup.

**Independent Test**: Overlays/table/spinner render via Lit components with `static styles` and auto-escaped bindings; no hard-coded inline hex colors remain in enhancer code; bundle stays ≤40KB.

### Tests for User Story 4 (write FIRST) ⚠️

- [ ] T044 [P] [US4] Component tests `tests/unit/qd-student-answers.test.ts` and `tests/unit/qd-student-entries.test.ts` asserting escaped rendering and encapsulated styles
- [ ] T045 [P] [US4] Component test `tests/unit/qd-student-table.test.ts` covering search filter and per-row select event

### Implementation for User Story 4

- [ ] T046 [P] [US4] Create `src/components/qd-spinner.ts` and adopt it in `src/components/qd-migration-dialog.ts`
- [ ] T047 [US4] Create `src/components/qd-student-answers.ts` and back the quiz instructor overlay (T036) with it (auto-escaped; removes remaining string markup)
- [ ] T048 [US4] Create `src/components/qd-student-entries.ts` and back the analysis instructor overlay (T039) with it, removing inline `style.cssText` hex colors (Constitution V)
- [ ] T049 [US4] Create `src/components/qd-student-table.ts` (searchable, emits per-row action) and adopt it in `src/components/qd-pin-reset-dialog.ts`; extract `src/services/pin-reset-service.ts` (reset PIN + audit event) so the dialog only renders results
- [ ] T050 [P] [US4] Adopt the shared `qd-modal` base in `src/components/qd-pin-create.ts` (add a non-dismissable option to `qd-modal`) and dedupe the `loadStudents` routine in `src/components/qd-instructor/qd-instructor.ts` into one `refreshStudents()`

**Checkpoint**: Reusable components in place; no inline-hex styling or student-data `innerHTML` in enhancers; bundle within budget.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T051 [P] Add a shared session-state helper (`isStudentLoggedIn()`, `isInstructor()`) and dedupe the three `updateVisibility` implementations across `qd-login.ts`, `qd-status.ts`, `qd-instructor.ts`
- [ ] T052 [P] Add a shared `persistAndNotify(record, { onSavedDom, events })` helper and use it in `quiz-answer-persistence.ts` and `analysis-persistence.ts`
- [ ] T053 Move `calculatePercentage` from `qd-status.ts` into `calculation-helpers.ts`; use `sanitizePinInput` in `qd-pin-create.ts`
- [ ] T054 Verify SC-002 (`find src -name '*.ts' | xargs wc -l | awk '$1>400'` returns only `contracts.ts`) and SC-003 (no enhancer overlay renders student data via `innerHTML`)
- [ ] T055 Run the full Definition of Done + `size-check`; confirm bundle ≤40KB min+gzip and no regression vs the T001 baseline (SC-005)
- [ ] T056 Run `specs/012-code-review/quickstart.md` validation end-to-end and update `code-review-report.md` line references to final state

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Blocks US2/US3/US4 extraction (they consume the shared helpers/constants/styles).
- **US1 (Phase 3)**: Independent — the report already exists; verification only. Can run anytime.
- **US2 (Phase 4)**: After Foundational. Independently testable.
- **US3 (Phase 5)**: After Foundational. Strongly benefits from US2 (T021 `AuthService` is reused by T043; T019 shared reveal is reused by T042). Sequence US2 → US3.
- **US4 (Phase 6)**: After US3 (overlays T036/T039 and pin-reset dialog must exist before they're backed by Lit components).
- **Polish (Phase 7)**: After all desired stories complete.

### Within Each User Story

- Characterization/unit tests written and passing against old code BEFORE the matching extraction.
- Pure-logic/helper extraction before the module refactor that consumes it.
- Each oversized-file task verifies the <400-line threshold at completion.

### Parallel Opportunities

- Foundational T003–T007 are all `[P]` (different files).
- US2 tests T012–T016 are `[P]`; impl T017 is `[P]` with T018/T019.
- US3 tests T022–T026 are `[P]`; within storage, T027 and T030 are `[P]`; the quiz (T033/T034) and analysis-pure (T037) extractions are `[P]` across files.
- US4 tests T044/T045 are `[P]`; T046 and T050 are `[P]`.

---

## Parallel Example: User Story 2

```bash
# Write all US2 tests first (parallel):
Task: "Characterization test for quiz instructor overlay (tests/integration/quiz-instructor-overlay.test.ts)"
Task: "XSS regression test for student-supplied markup (same file)"
Task: "Characterization test for instructor-answer-reveal (tests/integration/instructor-answer-reveal.test.ts)"
Task: "Characterization test for AuthService outcomes (tests/unit/auth-service.test.ts)"
Task: "Unit test for instructor-auth hashing (tests/unit/instructor-auth.test.ts)"

# Then parallel-safe implementation kickoff:
Task: "Create src/services/auth/instructor-auth.ts and route components through it"
```

---

## Implementation Strategy

### MVP First (User Story 1)

The report (US1) is the MVP and is already delivered. Validate via T009–T011, then proceed to risk-reduction.

### Incremental Delivery

1. Setup + Foundational → shared helpers landed (no behavior change).
2. US2 → ship security/duplication fixes (highest risk removed). **Independently mergeable.**
3. US3 → ship file decomposition module-by-module (each slice independently mergeable, verifying <400 lines).
4. US4 → ship reusable Lit components.
5. Polish → cross-cutting dedup + final SC verification.

### Notes

- Each task is behavior-preserving except T020 (the sanctioned XSS fix).
- Commit after each task or logical group; every commit must pass the Definition of Done (and `size-check` for any Lit-component slice).
- Do NOT modify `src/types/contracts.ts` (frozen) or convert `home-badges` to Lit (breaks progressive enhancement).
