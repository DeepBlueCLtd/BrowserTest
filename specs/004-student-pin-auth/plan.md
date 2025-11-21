# Implementation Plan: Student PIN Authentication

**Branch**: `004-student-pin-auth` | **Date**: 2025-11-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-student-pin-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement mandatory 4-digit PIN authentication for students to prevent impersonation on shared computers. Students create a PIN on first login, enter it on subsequent logins, and instructors can reset forgotten PINs. System will migrate existing student records to require PIN on next login while preserving all quiz data.

## Technical Context

**Language/Version**: TypeScript 5.x / JavaScript ES2020+
**Primary Dependencies**: Lit 3.0 (Web Components), Vite 5.x (build), Vitest (testing)
**Storage**: IndexedDB (primary), sessionStorage (rate limiting state)
**Testing**: Vitest (unit), Playwright (E2E), Chromatic (visual regression)
**Target Platform**: Chrome/Edge ≥96, Firefox ≥102, file:// URLs
**Project Type**: web - IIFE bundle for DITA HTML enhancement
**Performance Goals**: PIN validation <100ms, login flow <5s, bundle impact <2KB gzipped
**Constraints**: Must work offline, 35KB total bundle limit, no network dependencies
**Scale/Scope**: ~500 concurrent students per deployment, PIN reset for ~50 students/session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Offline-First**: PIN authentication uses only local IndexedDB and sessionStorage
- [x] **Progressive Enhancement**: Extends existing login component, gracefully degrades
- [x] **Test-Driven Development**: Tests planned for PIN validation, rate limiting, migration
- [x] **Phase-Gated Delivery**: P1 stories independently testable, clear migration path
- [x] **Performance Constraints**: PIN hashing <100ms, minimal bundle impact (~2KB)
- [x] **Data Isolation**: PIN hash stored with composite key `qd/{release}/u{serviceId}`
- [x] **Zero Configuration**: No config needed, PIN creation automatic on first login

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
├── components/
│   ├── qd-login.ts              # Extended with PIN input fields
│   ├── qd-pin-create.ts         # New: PIN creation modal
│   └── qd-instructor-status.ts  # Extended with PIN reset button
├── services/
│   ├── auth/
│   │   ├── pin-service.ts       # New: PIN hashing and validation
│   │   └── rate-limiter.ts      # New: Failed attempt tracking
│   ├── storage/
│   │   └── migration.ts         # Extended: Schema v1 → v2 migration
│   └── session-service.ts       # Extended: PIN verification flow
└── types/
    └── contracts.ts              # Extended: StudentRecord v2 with pinHash

tests/
├── unit/
│   ├── pin-service.test.ts      # PIN hashing and validation
│   ├── rate-limiter.test.ts     # Rate limiting logic
│   └── migration.test.ts        # Schema migration
├── integration/
│   ├── login-flow.test.ts       # Complete PIN login flow
│   └── instructor-reset.test.ts # PIN reset functionality
└── e2e/
    ├── pin-creation.spec.ts     # New student PIN creation
    └── pin-authentication.spec.ts # Returning student login
```

**Structure Decision**: Extending existing web application structure. PIN functionality integrates with existing components (qd-login, qd-instructor-status) while adding new specialized components (qd-pin-create) and services (pin-service, rate-limiter). Tests follow existing patterns with unit tests for services and E2E tests for user flows.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
