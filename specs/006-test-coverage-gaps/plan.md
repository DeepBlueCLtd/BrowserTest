# Implementation Plan: Test Coverage Gap Analysis

**Branch**: `006-test-coverage-gaps` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-test-coverage-gaps/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable comprehensive test coverage visibility by installing Vitest v8 coverage, creating structural gap analysis scripts, and performing one-off E2E gap analysis via feature inventory and spec grep. This provides precise line-level coverage for unit/integration tests plus identification of untested modules and E2E workflow gaps.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+
**Primary Dependencies**: @vitest/coverage-v8 (to install), Vitest 2.x, Playwright 1.x (existing)
**Storage**: N/A (development tooling - outputs to coverage/ directory and markdown reports)
**Testing**: Vitest (unit/integration with v8 coverage), Playwright (E2E - gap analysis only)
**Target Platform**: Node.js development environment (macOS/Linux)
**Project Type**: Single project (existing BrowserTest structure)
**Performance Goals**: Coverage report generation in <60 seconds
**Constraints**: 80% coverage thresholds (lines/functions/branches/statements)
**Scale/Scope**: ~45 source files in src/, 9 E2E spec files, ~35 unit/integration test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: This feature is **development tooling** that does not affect runtime behavior or the production bundle. Constitution principles are evaluated for applicability.

- [x] **Offline-First**: N/A - Development tooling runs in Node.js, not browser runtime
- [x] **Progressive Enhancement**: N/A - No DOM enhancement involved
- [x] **Test-Driven Development**: ✅ This feature ENABLES TDD by providing coverage visibility
- [x] **Phase-Gated Delivery**: ✅ Clear exit criteria: coverage report generation, gap analysis output
- [x] **Performance Constraints**: N/A - Does not affect 35KB bundle (dev dependency only)
- [x] **Data Isolation**: N/A - No user data involved
- [x] **Zero Configuration**: ✅ Coverage runs via npm scripts, no additional config needed

## Project Structure

### Documentation (this feature)

```text
specs/006-test-coverage-gaps/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Existing structure - this feature adds tooling, not source code
src/
├── components/          # Lit 3 web components
├── config/              # Runtime configuration
├── enhancers/           # DOM enhancement modules
├── init/                # Bootstrap and coordination
├── services/            # Business logic services
├── types/               # TypeScript type definitions
└── utils/               # Utility functions

tests/
├── unit/                # Vitest unit tests
├── integration/         # Vitest integration tests
└── e2e/workflows/       # Playwright E2E tests

# New artifacts created by this feature
scripts/
└── check-test-gaps.js   # Structural gap analysis script (new)

coverage/                # Vitest coverage output (gitignored)
├── index.html           # HTML coverage report
├── lcov.info            # LCOV format for CI
└── coverage-summary.json # JSON summary

docs/
└── test-coverage-report.md  # E2E gap analysis report (one-off)
```

**Structure Decision**: Existing single-project structure maintained. This feature adds development tooling (scripts/, coverage outputs, docs/) without modifying src/ structure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations - this is development tooling that operates outside runtime constraints.
