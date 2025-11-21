# Implementation Plan: Instructor Mode Improvements

**Branch**: `003-instructor-mode-improvements` | **Date**: 2025-11-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-instructor-mode-improvements/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This plan addresses critical bugs and enhancements to the instructor mode in BrowserTest. The primary focus is fixing P0 bugs that block basic instructor functionality (persistent student UI state, non-functional modals, disabled buttons) while adding improvements for timestamp visibility, CSV export metadata, and analysis table display. All changes must maintain offline-first operation using IndexedDB with no network dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x / JavaScript ES2020+
**Primary Dependencies**: Lit 3.0 (Web Components), Vite 5.x (build), IndexedDB API
**Storage**: IndexedDB (primary), sessionStorage (active session cache)
**Testing**: Vitest (unit), Playwright (E2E), Storybook (component isolation)
**Target Platform**: Modern browsers (Chrome/Edge ≥96, Firefox ≥102) via file:// URLs
**Project Type**: Web application (offline-first IIFE bundle)
**Performance Goals**: <200ms save operations, <2s page load with 50 questions, 100+ students displayable
**Constraints**: Bundle ≤35KB min+gzip, offline-only operation, no network dependencies
**Scale/Scope**: 10-30 students typical, 100+ students supported, 5-15 questions per page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Offline-First**: All fixes and features use only IndexedDB/sessionStorage, no network calls
- [x] **Progressive Enhancement**: Bug fixes restore proper enhancement behavior, no breaking changes
- [x] **Test-Driven Development**: TDD approach planned for all 15 requirements
- [x] **Phase-Gated Delivery**: Clear P0→P2→P3 priority phases with specific acceptance criteria
- [x] **Performance Constraints**: Performance requirement FR-014 ensures 100+ student display works
- [x] **Data Isolation**: All data remains in browser with proper qd/{release}/u{serviceId} keys
- [x] **Zero Configuration**: No configuration changes required, fixes existing functionality

## Project Structure

### Documentation (this feature)

```text
specs/003-instructor-mode-improvements/
├── plan.md              # This file (implementation planning)
├── research.md          # Phase 0: UI state management research
├── data-model.md        # Phase 1: No new entities (bug fixes only)
├── quickstart.md        # Phase 1: Testing guide for instructor mode
├── contracts/           # Phase 1: No new APIs (internal fixes)
├── checklists/          # Quality validation
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Phase 2: Implementation tasks (TBD)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── qd-instructor/           # Instructor mode components (P0 fixes)
│   │   ├── qd-instructor.ts     # Main orchestrator (fix toggle state)
│   │   ├── qd-instructor-scores.ts  # Scores modal (fix z-index)
│   │   └── qd-instructor-export.ts  # CSV export (fix button state)
│   └── qd-login.ts              # Login component (clear state on logout)
├── enhancers/
│   ├── quiz-table.ts            # Quiz table enhancer (fix state persistence)
│   └── analysis-table.ts        # Analysis table enhancer (student entries)
├── services/
│   ├── session.js               # Session management (fix state clearing)
│   └── storage-service.js       # Storage operations (support re-submission)
├── utils/
│   └── date-helpers.ts          # Timestamp formatting (24-hour format)
└── types/
    └── contracts.ts             # Type definitions (no changes)

tests/
├── unit/
│   ├── components/              # Component unit tests
│   └── services/                # Service unit tests
├── integration/
│   └── instructor-mode.test.ts # Integration tests for fixes
└── e2e/
    └── workflows/
        └── instructor-review.spec.ts # E2E tests for instructor workflows
```

**Structure Decision**: Web application with Lit components and service layer. All instructor mode fixes will be made to existing files, no new architectural patterns needed.

## Complexity Tracking

> No constitution violations - all checks pass. Feature improvements align with existing architecture.

## Phase 1 Completion Summary

All planning artifacts have been generated:

1. **research.md** - Technical decisions for all bug fixes documented
2. **data-model.md** - Clarified re-submission behavior, no new entities
3. **quickstart.md** - Comprehensive testing guide for all 15 requirements
4. **contracts/** - Documented that no new APIs are needed

### Re-evaluated Constitution Check (Post-Design)

- [x] **Offline-First**: All solutions use only local storage
- [x] **Progressive Enhancement**: Bug fixes restore proper behavior
- [x] **Test-Driven Development**: Test scenarios documented in quickstart
- [x] **Phase-Gated Delivery**: P0→P2→P3 implementation order clear
- [x] **Performance Constraints**: Virtual scrolling for 100+ students
- [x] **Data Isolation**: Proper cleanup prevents state leakage
- [x] **Zero Configuration**: No new configuration needed

## Next Steps

The planning phase is complete. Ready for `/speckit.tasks` command to generate implementation tasks based on:
- 7 P0 bug fixes (FR-001 to FR-007)
- 6 P2 enhancements (FR-008 to FR-010)
- 2 P3 improvements (FR-011 to FR-013)

All fixes target existing files with minimal architectural changes.
