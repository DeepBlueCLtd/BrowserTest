# Quickstart: Executing the Hot-Spot Refactor

**Feature**: Refactor Architectural Hot-Spots for Maintainability
**Date**: 2026-06-17

This guide describes how to execute the refactor slice-by-slice. Read [code-review-report.md](./code-review-report.md) for the findings and [plan.md](./plan.md) for the module map.

## Golden rule

**Behavior-preserving, test-gated, one slice at a time.** The only sanctioned behavior change in the entire feature is the quiz instructor-overlay XSS fix (FR-004).

## Per-slice workflow (TDD)

For every extraction:

1. **Characterize**: write/confirm tests that capture the *current* behavior of the target code (return values, emitted `qd:*` events, IndexedDB/sessionStorage writes, DOM mutations). Run them — they pass against the old code.
2. **Extract**: move the logic into the new module/component per `contracts/module-boundaries.md`. Re-point callers.
3. **Green**: run tests — behavior unchanged. Re-verify the new unit has its own focused unit tests.
4. **Definition of Done** (all must pass with zero errors):
   ```bash
   npm run typecheck
   npm run lint
   npm run test:unit
   npm run test:integration   # if enhancers/storage touched
   npm run format:check
   npm run build
   npm run size-check         # ≤40KB min+gzip — REQUIRED gate for any Lit-component slice
   ```
5. **Commit** the slice with a descriptive message. Each slice is independently shippable.

## Recommended slice order (waves)

### Wave 1 — Safe consolidation (no behavior change)
- `STORAGE_KEYS.INSTRUCTOR_SHOW_ANSWERS` constant (replaces `'qd/instructor/showAnswers'` magic string ×3).
- `utils/page-id.ts` `getPageIdFromUrl()` (replaces 3 inline parses).
- `home-badges` `clearBadges(link)` helper (replaces 3 duplicated loops).
- `storage-service` `createEmptyStudentRecord(session)` (dedupe try/catch literals).
- Consolidate shared styles (`button.primary`, `.error-message`, `.button-row`, spinner, modal overlay) into `shared-styles.ts`.

### Wave 2 — Security & duplication (highest risk removed)
- **Fix the `innerHTML` XSS** in the quiz instructor overlay (FR-004) — render via `textContent`/component.
- Extract `enhancers/instructor-answer-reveal.ts` and call it from both `bootstrap.ts` and `event-coordinator.ts` (FR-005).
- Extract `services/auth/instructor-auth.ts`; route `qd-login` + `qd-migration-dialog` through it.

### Wave 3 — Pure logic & services
- `services/analysis-display.ts` (pure grouping/sorting).
- `services/session-cache.ts` (split from `session.ts`).
- `services/storage/idb-helpers.ts` (`promisifyRequest`/`runTransaction`).
- `services/auth/auth-service.ts` (collapses the duplicated login/retry paths — FR-006).
- `services/pin-reset-service.ts`; `storage-service.updateRecordWithAnalysis`.
- Route all DOM config reads through `config/dom-config-reader.ts` (`readDOMConfig`).

### Wave 4 — Large-file decomposition (target ≤400 lines each)
- `indexeddb.ts` → `idb-connection`, `idb-codec`, `backup-repository`, `audit-log-repository`.
- `quiz-table.ts` → `quiz-table-columns`, `quiz-input-factory`, `quiz-answer-persistence`, `quiz-instructor-overlay`.
- `analysis-table.ts` → `analysis-persistence`, `analysis-instructor-overlay`.
- `bootstrap.ts` → `init/global-styles.ts` + collapse `enhanceAll*` helpers; move business rules out.
- `event-coordinator.ts` → event routing only (login IO + table-upgrade moved out).
- `qd-login.ts` → thin view over `AuthService`.

### Wave 5 — Reusable Lit components
- `<qd-student-answers>`, `<qd-student-entries>` (back the overlays; remove inline `style.cssText`).
- `<qd-student-table>` (pin-reset/scores/export), `<qd-spinner>`, optional `<qd-lockout-banner>`.
- Adopt the shared `qd-modal` base in `qd-pin-create.ts`.

## Verifying success criteria

| Criterion | How to verify |
|-----------|---------------|
| SC-002 (files <400 lines) | `find src -name '*.ts' | xargs wc -l | awk '$1>400'` returns only `contracts.ts` |
| SC-003 (no student data via `innerHTML`) | grep enhancer overlays for `innerHTML`; none with student fields |
| SC-004 (single answer-reveal / login path) | one definition of `revealInstructorAnswers`; no `retryLoginAfterMigration` duplicate |
| SC-005 (tests green, bundle OK) | full DoD command block passes; `size-check` under 40KB |
| SC-006 (independently shippable) | each slice merges on its own with green CI |

## Out of scope (do not touch)
- `src/types/contracts.ts` (frozen).
- `home-badges` → Lit conversion (breaks progressive enhancement).
- Any persisted data shape, key scheme, or session-timeout change.
