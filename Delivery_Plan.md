# DELIVERY_PLAN.md

## Phase 0 — Bootstrap + Contracts
Goal: Toolchain and frozen interfaces.
- Build/CI: Vite, TS, Vitest, Playwright, Storybook, Chromatic, GitHub Pages deploy.
- **Contracts v1.0**: data-types, events, keys, enums, answer encoding, cell-key scheme, storage adapter interface.
- Demo fixtures for quizzes and analysis.
Exit gate: contracts published in `src/types/contracts.ts`; Storybook renders base components; CI green.

## Phase 1 — Quiz Core (no login, no IDB)
Goal: Interactive quizzes via DOM upgrade.
- Parse/upgrade `table.qd-quiz` (MCQ + numeric + tolerance).
- `<qd-status>` with R/A/G logic.
- Storybook stories: Small/Large/Mixed.
Exit gate: Chromatic interactions pass; unit tests for parsing + state.

## Phase 2 — Analysis Workbook (no login, no IDB)
Goal: Editable analysis sheet.
- Parse/upgrade `table.qd-analysis`; editable iff cell has `class="interactive"`.
- Cell keys `R{row}C{col}#f:{hash}` and `tableId`.
- Storybook: Worksheet `Blank/Few/Dense`.
Exit gate: visual baselines stable; unit tests for cell mapping.

## Phase 3 — Instructor Unlock (applies to Quiz + Analysis)
Goal: Supervisor mode across both features.
- Unlock/lock flow; password gate mocked.
- Per-question student answers panel (from fixtures).
- Per-cell student grids for analysis.
- Instructor toolbar (mock erase/export).
Exit gate: stories show supervisor toggles; a11y checks pass; events `qd:unlock/qd:lock` emitted.

## Phase 4 — Login + Session Cache
Goal: Session UX before persistence.
- `<qd-login>`; session in `sessionStorage` (30-min).
- Build `qd/state` from fixtures in stories; later from IDB.
Exit gate: session switch updates status/badges in stories; unit tests for session expiry.

## Phase 5 — Persistent Storage + Scores
Goal: Durable data and cohort view.
- IndexedDB adapter behind `StorageAdapter`.
- Real save/load for quiz + analysis.
- Scores page + CSV export; erase-all.
Exit gate: E2E `file://` saves reload correctly; CSV content validated; erase requires confirmation.

## Phase 6 — Validation, Accessibility, Performance
Goal: Production readiness.
- Author error banners; keyboard flows; aria-live status.
- Bundle ≤ 25 KB min+gzip IIFE; perf smoke on reference laptop.
- Docs: Authoring Guide + Dev Guide updates.
Exit gate: perf and a11y checks green; size budget met.

## Phase 7 — Beta Deployment & Feedback
Goal: Field trial.
- Release ZIP; Oxygen template include; GitHub Pages demo.
- Feedback capture; change log.
Exit gate: instructor sign-off on core workflows.

## Phase 8 — Security/Enhancements (optional)
Goal: Hardening and polish.
- Obfuscation keyed by `{release,serviceId}`; CSV refinements; minor UX.
Exit gate: regression suite clean.

---

## Parallel Workstreams

| Stream | Scope | Phases | Dependencies |
|---------|--------|---------|---------------|
| Core Infra | Toolchain, CI, contracts | P0 ongoing | none |
| Quiz UI | Quiz DOM upgrade + status | P1→P3 | P0 |
| Analysis UI | Analysis table upgrade | P2→P3 | P0 |
| Instructor UX | Unlock, overlays, erase/export | P3 | P1, P2 |
| Session/Identity | Login, session cache | P4 | P0 |
| Storage/Reports | IndexedDB, CSV, scores | P5 | P4, P0 |
| Build/QA | Storybook, Chromatic, Pages, tests | P0→P7 | all |

---

## Testing by Phase

| Phase | Test Scope | Tools |
|-------|-------------|-------|
| 0 | Toolchain smoke, Chromatic publish | Vitest, Chromatic CI |
| 1 | Parsing, R/A/G state, interactions | Vitest, Playwright, Chromatic |
| 2 | Cell mapping, visual regression | Vitest, Chromatic |
| 3 | Supervisor toggles, overlays | Playwright, Chromatic |
| 4 | Session expiry, state updates | Vitest, Playwright |
| 5 | IDB round-trip, CSV export, erase | Playwright, Vitest |
| 6 | Accessibility, perf, bundle size | axe, Lighthouse, gzip-size |
| 7 | Manual validation, feedback | human review |
| 8 | Regression only | full suite |

---

## Locked Contract Elements (Phase 0)

- **Keys:** Storage key format and cell key format defined in `Contracts.md`.
- **Encodings:** answers stored as { answer: string, success: boolean } objects.
- **Events:** `qd:login/logout`, `qd:answer-saved`, `qd:status-changed`, `qd:unlock/lock`, `qd:show-all-responses`, `qd:erase`, `qd:error`.
- **Enums:** `State = 'unstarted'|'incomplete'|'complete'`.
- **Interfaces:** `UserReleaseRecord`, `PageRecord`, `Session`, `SessionCache`, `StorageAdapter`.
