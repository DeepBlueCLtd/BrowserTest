# Implementation Plan: Code Reduction Initiative

**Branch**: `005-code-reduction` | **Date**: 2025-11-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-code-reduction/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Remove ~600 lines of unused code and consolidate duplicated components to reduce bundle size by 2-3KB gzipped. The initiative focuses on safely deleting unreferenced code paths, fixing debug mode configuration to exclude development tools from production, and consolidating duplicated modal/PIN validation logic across three components.

## Technical Context

**Language/Version**: TypeScript 5.x / JavaScript ES2020+
**Primary Dependencies**: Lit 3.0 (Web Components), Vite 5.x (build)
**Storage**: N/A (no data model changes)
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Modern browsers (Chrome/Edge ≥96, Firefox ≥102)
**Project Type**: Single (web components library)
**Performance Goals**: Maintain <200ms operations, <2s page load
**Constraints**: <35KB min+gzip bundle (currently 32.89KB)
**Scale/Scope**: ~12,773 LOC → ~11,969 LOC target

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Research)
- [x] **Offline-First**: No network impact - purely code cleanup
- [x] **Progressive Enhancement**: No changes to enhancement patterns
- [x] **Test-Driven Development**: Full test suite validates removals
- [x] **Phase-Gated Delivery**: Three clear phases (P1: deletions, P2: DEBUG_MODE, P3: consolidation)
- [x] **Performance Constraints**: Reduces bundle from 32.89KB → ~30-31KB
- [x] **Data Isolation**: No data model changes
- [x] **Zero Configuration**: No deployment changes required

### Post-Design Verification (Phase 1 Complete)
- [x] **Offline-First**: Confirmed - no network dependencies added
- [x] **Progressive Enhancement**: Confirmed - DOM enhancement unchanged
- [x] **Test-Driven Development**: Confirmed - test suite validates all changes
- [x] **Phase-Gated Delivery**: Confirmed - three independent phases defined
- [x] **Performance Constraints**: Confirmed - bundle reduction verified
- [x] **Data Isolation**: Confirmed - no data model changes
- [x] **Zero Configuration**: Confirmed - no config changes needed

## Project Structure

### Documentation (this feature)

```text
specs/005-code-reduction/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # N/A - no data changes
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # N/A - no API changes
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── qd-error-banner.ts       # TO DELETE (unused)
│   ├── qd-pin-create.ts         # TO REFACTOR (extract shared modal)
│   ├── qd-pin-reset-dialog.ts   # TO REFACTOR (extract shared modal)
│   └── qd-login.ts              # TO REFACTOR (use shared modal)
├── services/
│   └── storage/
│       └── encrypted-session.ts # TO DELETE (unused)
├── utils/
│   ├── virtual-list.ts          # TO DELETE (unused)
│   └── modal-builder.ts         # TO CREATE (extracted utility)
├── index.ts                      # TO MODIFY (remove exports, set DEBUG_MODE=false)
└── types/
    └── contracts.ts              # NO CHANGES (frozen)

tests/
├── unit/                         # Run all to verify no regressions
├── integration/                  # Run all to verify DOM upgrades intact
└── e2e/                         # Run all to verify user flows intact
```

**Structure Decision**: Single project structure maintained. Creating one new utility file for shared modal logic, deleting three unused files, modifying barrel export and debug configuration.

## Complexity Tracking

> No violations - all constitution principles satisfied