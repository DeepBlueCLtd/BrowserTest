# Implementation Plan: Security Remediation and Code Quality Improvements

**Branch**: `001-security-refactor` | **Date**: 2025-11-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-security-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Comprehensive security hardening and code quality improvements for the Sonar Quiz System based on Phase 7 code review findings. Primary focus on eliminating critical security vulnerabilities (hardcoded passwords, XSS vectors, plaintext PII storage) while improving maintainability through code deduplication and performance optimization. All changes must maintain offline-first operation and stay within the 25KB bundle constraint.

## Technical Context

**Language/Version**: TypeScript 5.x / JavaScript ES2020+
**Primary Dependencies**: Lit 3.0 (Web Components), Vite 5.x (build), Vitest (testing)
**Storage**: IndexedDB (primary), sessionStorage (active session)
**Testing**: Vitest (unit), Playwright (E2E), Chromatic (visual regression)
**Target Platform**: Modern browsers (Chrome/Edge ≥96, Firefox ≥102) via file:// protocol
**Project Type**: Single-page offline-first web application (IIFE bundle)
**Performance Goals**: <100ms debounce response, <2s page load (50 questions), <200ms save operations
**Constraints**: ≤25KB min+gzip bundle, offline-only, file:// protocol, no network dependencies
**Scale/Scope**: ~6,300 LOC to refactor, 400 lines duplication to reduce, 15 security fixes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Offline-First**: All security improvements maintain offline operation, no network dependencies added
- [x] **Progressive Enhancement**: Security fixes preserve DOM enhancement pattern, no breaking changes
- [x] **Test-Driven Development**: Security tests will be written first to verify vulnerabilities before fixes
- [x] **Phase-Gated Delivery**: Implementation phases align with security priority levels (P1→P2→P3)
- [x] **Performance Constraints**: Refactoring reduces bundle size, performance improvements included
- [x] **Data Isolation**: Encryption enhances privacy, maintains local-only storage with proper keys
- [x] **Zero Configuration**: Environment variable configuration at build time, no runtime config needed

## Project Structure

### Documentation (this feature)

```text
specs/001-security-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── utils/               # NEW: Extracted utilities
│   ├── comparison-table-builder.ts
│   ├── debouncer.ts
│   ├── storage-helpers.ts
│   ├── dom-helpers.ts
│   ├── events.ts
│   ├── attributes.ts
│   ├── logger.ts
│   ├── crypto.ts       # NEW: Encryption utilities
│   └── security.ts     # NEW: Security utilities
├── enhancers/
│   ├── quiz-table.ts    # MODIFY: Remove innerHTML, use utilities
│   ├── analysis-table.ts # MODIFY: Remove duplication
│   └── home-badges.ts   # MODIFY: Use storage helpers
├── components/
│   └── qd-instructor.ts # MODIFY: Remove hardcoded password
├── services/
│   ├── session.ts       # MODIFY: Add encryption
│   └── storage/
│       └── indexeddb.ts # MODIFY: Handle encrypted data
└── index.ts             # MODIFY: Remove innerHTML, add security config

tests/
├── security/            # NEW: Security-focused tests
│   ├── xss.test.ts
│   ├── authentication.test.ts
│   └── encryption.test.ts
├── unit/
│   └── utils/          # NEW: Utility tests
├── integration/
└── e2e/
```

**Structure Decision**: Single project structure maintained with new `utils/` directory for extracted common functionality and `tests/security/` for security-specific test coverage. This minimizes disruption while improving organization.

## Complexity Tracking

> No violations - all changes align with constitution principles.