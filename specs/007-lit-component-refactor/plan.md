# Implementation Plan: Lit Component Refactor & Testability Improvements

**Branch**: `007-lit-component-refactor` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-lit-component-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor 59 `document.createElement()` calls in Lit components to use declarative templates, and extract embedded business logic into pure helper functions for improved testability. This is an internal refactoring feature with no user-facing changes—all existing functionality and E2E tests must continue to pass.

## Technical Context

**Language/Version**: TypeScript 5.x / ES2020+
**Primary Dependencies**: Lit 3.x (existing), Vitest 2.x (existing)
**Storage**: N/A (no data model changes—internal refactor only)
**Testing**: Vitest for unit tests, Playwright for E2E (existing)
**Target Platform**: Browser (Chrome/Edge ≥96, Firefox ≥102), file:// protocol
**Project Type**: Single project (Web Components library)
**Performance Goals**: Bundle size increase <2KB gzipped
**Constraints**: <35KB total bundle, <200ms operations, offline-capable
**Scale/Scope**: 59 createElement calls across 5 components, ~10 pure helper functions to extract

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Offline-First**: Feature works completely offline, no network dependencies
  - *Internal refactor only—no new network dependencies*
- [x] **Progressive Enhancement**: Enhances existing HTML without breaking functionality
  - *No changes to DOM enhancement behavior*
- [x] **Test-Driven Development**: Tests written first, Red-Green-Refactor cycle planned
  - *Helper functions: write tests first → implement → refactor callers*
  - *Components: write component tests → implement → verify E2E*
- [x] **Phase-Gated Delivery**: Clear exit criteria defined for each implementation phase
  - *Phase 0: Helpers with 100% coverage*
  - *Phase 1: Modal base component*
  - *Phase 2: Extracted modal components*
- [x] **Performance Constraints**: Within 35KB bundle limit, <200ms operations
  - *Target: <2KB increase; actual impact likely negative (deduplication)*
- [x] **Data Isolation**: Local storage only, proper key namespacing
  - *No storage changes—internal refactor*
- [x] **Zero Configuration**: No setup required beyond script inclusion
  - *No configuration changes*

## Project Structure

### Documentation (this feature)

```text
specs/007-lit-component-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal—internal refactor)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal TypeScript interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/          # Lit components (refactor targets)
│   ├── qd-login.ts           # 14 createElement → Lit templates
│   ├── qd-instructor-scores.ts # 22 createElement → <qd-scores-modal>
│   ├── qd-pin-reset-dialog.ts  # 21 createElement → <qd-confirm-dialog>
│   ├── qd-modal.ts           # NEW: Base modal component
│   ├── qd-scores-modal.ts    # NEW: Extracted from qd-instructor-scores
│   ├── qd-password-modal.ts  # NEW: Extracted from qd-login
│   └── qd-confirm-dialog.ts  # NEW: Extracted from qd-pin-reset-dialog
├── utils/               # NEW: Pure helper functions
│   ├── validation-helpers.ts  # Form validation, PIN sanitization
│   └── calculation-helpers.ts # Status indicators, percentages, totals
├── services/
│   ├── question-input.ts     # NEW: Question input spec generation
│   ├── answer-display.ts     # NEW: Student answer formatting
│   └── [existing services]
└── enhancers/           # May use new helpers (no direct refactoring)

tests/
├── unit/
│   ├── utils/               # NEW: Tests for helper modules
│   │   ├── validation-helpers.test.ts
│   │   └── calculation-helpers.test.ts
│   ├── services/            # NEW: Tests for extracted services
│   │   ├── question-input.test.ts
│   │   └── answer-display.test.ts
│   └── components/          # Tests for new modal components
│       ├── qd-modal.test.ts
│       ├── qd-scores-modal.test.ts
│       ├── qd-password-modal.test.ts
│       └── qd-confirm-dialog.test.ts
└── e2e/                 # Existing E2E tests (must pass unchanged)
```

**Structure Decision**: Single project with new `src/utils/` directory for pure helpers. New components added to existing `src/components/`. Test structure mirrors source.

## Complexity Tracking

> No constitution violations—this is an internal refactor improving code quality.
