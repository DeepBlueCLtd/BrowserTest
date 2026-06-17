# Implementation Plan: Refactor Architectural Hot-Spots for Maintainability

**Branch**: `claude/speckit-code-review-8dd0zw` (spec dir `012-code-review`) | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-code-review/spec.md`

## Summary

Decompose the codebase's largest, most entangled modules into single-responsibility units and remove duplicated/security-sensitive logic, **without changing observable behavior** (the one sanctioned exception being the quiz instructor-overlay `innerHTML` XSS fix). The companion [code-review-report.md](./code-review-report.md) is the primary deliverable and the source of all findings; this plan sequences the implied refactoring into independently shippable slices.

Technical approach: behavior-preserving extraction guided by characterization tests (write/confirm tests against current behavior → extract → keep green). Work proceeds in risk order: shared constants/helpers → security/duplication fixes → service extraction → file decomposition → reusable Lit components. Each slice independently satisfies the Definition of Done and keeps the IIFE bundle ≤40KB min+gzip.

## Technical Context

**Language/Version**: TypeScript 5.x / ES2020+
**Primary Dependencies**: Lit 3.x (Web Components), Vite 5.x (build), Vitest 2.x (unit/integration), Playwright 1.x (E2E)
**Storage**: IndexedDB (primary, via `IndexedDBStorageAdapter`), sessionStorage (active session + R/A/G cache) — no schema changes in this feature
**Testing**: Vitest (unit + integration), Playwright (E2E against Storybook), Chromatic (visual regression)
**Target Platform**: Chrome/Edge ≥96, Firefox ≥102, must run from `file://` URLs
**Project Type**: Single project (browser library, progressive enhancement of DITA HTML)
**Performance Goals**: <200ms save, <2s page load (50 questions); no regression introduced by refactor
**Constraints**: IIFE bundle ≤40KB min+gzip; no network/dynamic imports; Shadow DOM isolation (no global CSS); behavior-preserving (except the FR-004 XSS fix); `src/types/contracts.ts` is FROZEN and out of scope
**Scale/Scope**: ~14.4k LOC across `src/`; 8 modules in scope (6 oversized + `event-coordinator.ts` + cross-cutting helpers). No new persisted entities.

No NEEDS CLARIFICATION items remain — scope, constraints, and target modules are fully determined by the spec and report.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Offline-First**: Pure internal refactor; no network dependencies added. Verified by retained `file://` E2E.
- [x] **Progressive Enhancement**: Enhancers continue to upgrade existing DITA HTML; `home-badges` deliberately left as class-toggle enhancement (not converted to Lit) to preserve graceful degradation.
- [x] **Test-Driven Development**: Characterization tests written/confirmed before each extraction; new units get unit tests; Red-Green-Refactor enforced (FR-010).
- [x] **Phase-Gated Delivery**: This plan defines slices with explicit exit criteria; each slice is independently shippable (SC-006).
- [x] **Performance Constraints**: Each slice verifies ≤40KB min+gzip and Shadow-DOM isolation; new Lit components add styles via `static styles` (no global CSS). `size-check` is a per-slice gate.
- [x] **Data Isolation**: Composite key scheme and 30-min session timeout unchanged; no key/namespace changes. `contracts.ts` untouched.
- [x] **Zero Configuration**: No new config, script tags, or attributes; routing config reads through the existing `readDOMConfig()` actually *reduces* divergence.

**Result: PASS** — no violations; Complexity Tracking not required.

### Re-check after Phase 1 design

- [x] Module boundaries (contracts/) introduce no new runtime dependencies, no new persisted data, and no public-API/`contracts.ts` changes. Reusable Lit components keep styles encapsulated. **Still PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/012-code-review/
├── spec.md                  # Feature spec
├── code-review-report.md    # PRIMARY deliverable: prioritized findings
├── plan.md                  # This file
├── research.md              # Phase 0 output: refactoring strategy decisions
├── data-model.md            # Phase 1 output: entities (unchanged) + new module map
├── quickstart.md            # Phase 1 output: per-slice DoD workflow
├── contracts/
│   └── module-boundaries.md # Phase 1 output: target module interfaces
└── checklists/
    └── requirements.md      # Spec quality checklist
```

### Source Code (repository root)

Current (in-scope) layout and the modules this refactor introduces:

```text
src/
├── components/
│   ├── qd-login.ts                     # SHRINK → thin view; extract AuthService
│   ├── qd-migration-dialog.ts          # use instructor-auth + migrationService
│   ├── qd-pin-reset-dialog.ts          # extract pinResetService; use qd-student-table
│   ├── qd-instructor/qd-instructor.ts  # add refreshStudents()
│   ├── qd-student-table.ts             # NEW reusable component (pin-reset/scores/export)
│   ├── qd-spinner.ts                   # NEW reusable component
│   └── qd-lockout-banner.ts            # NEW (optional) reusable component
├── enhancers/
│   ├── quiz-table.ts                   # SPLIT (see below); fix innerHTML XSS
│   ├── quiz-table-columns.ts           # NEW (column show/hide)
│   ├── quiz-input-factory.ts           # NEW (createQuestionInput)
│   ├── quiz-answer-persistence.ts      # NEW (handleAnswerInput/saveAnswer)
│   ├── quiz-instructor-overlay.ts      # NEW (show/hide student answers)
│   ├── analysis-table.ts               # SPLIT (see below)
│   ├── analysis-persistence.ts         # NEW (saveCellData)
│   ├── analysis-instructor-overlay.ts  # NEW
│   ├── instructor-answer-reveal.ts     # NEW shared (dedupes bootstrap/event-coordinator)
│   └── home-badges.ts                  # minor: clearBadges() helper only
├── services/
│   ├── auth/
│   │   ├── auth-service.ts             # NEW (loginStudent/retryAfterMigration)
│   │   └── instructor-auth.ts          # NEW (shared SHA-256 hashing)
│   ├── pin-reset-service.ts            # NEW
│   ├── analysis-display.ts             # NEW (pure groupEntriesByCell/sortByTimestamp)
│   ├── session.ts                      # SPLIT → session-cache.ts
│   ├── session-cache.ts               # NEW (pure cache math)
│   ├── storage-service.ts              # add updateRecordWithAnalysis, createEmptyStudentRecord
│   └── storage/
│       ├── indexeddb.ts                # SPLIT (see below)
│       ├── idb-helpers.ts             # NEW (promisifyRequest/runTransaction)
│       ├── idb-connection.ts          # NEW (init/migration/recovery)
│       ├── idb-codec.ts               # NEW (encode/decode, encryption-aware)
│       ├── backup-repository.ts       # NEW
│       └── audit-log-repository.ts    # NEW
├── init/
│   ├── bootstrap.ts                    # SHRINK → thin sequencer
│   ├── global-styles.ts                # NEW (CSS literal moved out)
│   └── event-coordinator.ts            # SHRINK → event routing only
├── config/dom-config-reader.ts         # existing; become the single config-read path
└── utils/
    └── page-id.ts                      # NEW getPageIdFromUrl()

tests/
├── unit/        # new unit tests for each extracted module
└── integration/ # characterization tests for enhancers/storage behavior
```

**Structure Decision**: Single-project browser library. The refactor adds new files alongside existing directories (`services/auth/`, `services/storage/`, `enhancers/`) following patterns already present in the repo (e.g. `services/answer-display.ts`, the `qd-instructor/` component family). No directory reorganization of existing healthy files.

## Complexity Tracking

No constitution violations — section intentionally empty.
