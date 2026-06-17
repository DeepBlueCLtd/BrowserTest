# Feature Specification: Refactor Architectural Hot-Spots for Maintainability

**Feature Branch**: `claude/speckit-code-review-8dd0zw`
**Created**: 2026-06-17
**Status**: Draft
**Input**: User description: "We have some quite large modules. I suspect we also have some quite complex blocks of logic. Do a code review, to consider `hot-spots` where: UI and business logic are too tightly intertwined; business logic is several layers deep; child components could be refactored out; UI elements could be refactored to `Lit` components; files are very large (over 400 lines). Produce a report of recommendations."

## Overview

The codebase has accumulated several large, multi-responsibility modules where presentation, business logic, persistence, and security-sensitive behavior are intertwined. A code review was performed against five hot-spot criteria (tight UI/logic coupling, deeply nested logic, extractable child components, UI suitable for Lit components, files over 400 lines). The findings are captured in `code-review-report.md` in this directory.

This specification turns those findings into a prioritized, independently shippable refactoring effort. The goal is improved maintainability and reduced risk **without changing observable behavior** and while honoring all existing constitutional constraints (offline-first, progressive enhancement, TDD, answer security, ≤40KB bundle).

The companion **`code-review-report.md` is the primary deliverable requested** ("produce a report of recommendations"); this spec defines the work the report implies so it can flow into `/speckit.plan` and `/speckit.tasks`.

## Clarifications

### Session 2026-06-17

- Q: Should the deliverable be only a report, or a report plus the refactoring it recommends? → A: The report is the immediate deliverable; the refactoring is scoped here as prioritized, independently shippable slices so it can be planned and executed incrementally.
- Q: Is any behavior change acceptable? → A: No. All refactoring must be behavior-preserving; one observable bug (the quiz instructor-overlay `innerHTML` XSS) is the single sanctioned behavior fix because it is a security defect.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Maintainer receives a prioritized hot-spot report (Priority: P1)

A maintainer wants to understand where the codebase is hardest to change and why, with concrete, actionable recommendations ranked by payoff so they can plan refactoring work.

**Why this priority**: This is exactly what the user asked for ("produce a report of recommendations"). It delivers value on its own — even with zero code changes, the team gains a shared, evidence-based map of technical debt.

**Independent Test**: Open `code-review-report.md`; verify every file over 400 lines is listed with a severity and a concrete split recommendation, and that each of the five hot-spot criteria is addressed with file/line references.

**Acceptance Scenarios**:

1. **Given** the report, **When** a maintainer looks for large files, **Then** every `src/**` file over 400 lines is listed with line count, severity, and a concrete extraction plan.
2. **Given** the report, **When** a maintainer looks for tightly coupled UI/logic, **Then** specific methods are named with line references and a recommended service/component extraction.
3. **Given** the report, **When** a maintainer wants to start work, **Then** a recommended sequencing (lowest-risk → highest-payoff) is provided.

---

### User Story 2 - Eliminate duplicated and security-sensitive logic (Priority: P1)

A maintainer wants the highest-risk findings resolved first: the quiz instructor-overlay XSS, the duplicated instructor answer-reveal logic, and the duplicated authentication/PIN paths.

**Why this priority**: These items carry security and correctness risk (unescaped student input rendered via `innerHTML`; security-sensitive answer-reveal logic maintained in two places that can drift). Fixing them reduces real risk with small, contained changes.

**Independent Test**: Student-supplied names/answers containing markup render as inert text in the instructor overlay; instructor answer-reveal behaves identically whether reached via initial bootstrap or post-login, driven by a single shared function.

**Acceptance Scenarios**:

1. **Given** a student answer containing `<script>` or HTML, **When** an instructor reveals answers on a quiz page, **Then** the content is displayed as literal text and not interpreted as markup.
2. **Given** an instructor logs in, **When** answers are revealed on page load and after login, **Then** both paths invoke one shared answer-reveal function with identical results.
3. **Given** the consolidated authentication path, **When** a student logs in normally and after a storage migration, **Then** both flows share one code path with no duplicated success logic.

---

### User Story 3 - Decompose oversized modules into focused units (Priority: P2)

A maintainer wants the largest modules split into single-responsibility files so each is easier to read, test, and change, with no file in scope exceeding ~400 lines after the split (except frozen contracts).

**Why this priority**: Size and mixed responsibility are the root causes of slow, error-prone changes, but splitting is lower-risk to defer than the security/duplication fixes in P1.

**Independent Test**: After refactoring, the targeted files (`qd-login.ts`, `quiz-table.ts`, `indexeddb.ts`, `analysis-table.ts`, `bootstrap.ts`, `session.ts`) are each under ~400 lines, with extracted modules covered by unit tests, and all existing tests pass unchanged.

**Acceptance Scenarios**:

1. **Given** `indexeddb.ts`, **When** decomposed, **Then** connection/migration, encryption codec, backups, and audit log live in separate units and shared transaction boilerplate is replaced by a reusable helper.
2. **Given** `qd-login.ts`, **When** authentication is extracted into a service, **Then** the component contains only presentation/state-mapping logic and the duplicated retry-after-migration path is removed.
3. **Given** `bootstrap.ts`, **When** decomposed, **Then** the CSS literal, the table-enhancement loops, and the instructor answer-reveal rule no longer live in the bootstrap sequencer.

---

### User Story 4 - Extract reusable UI into Lit components (Priority: P3)

A maintainer wants repeated, raw-DOM UI blocks converted into reusable, Shadow-DOM-isolated Lit components to remove inline styling and string-built markup.

**Why this priority**: Improves consistency and removes a class of styling/escaping bugs, but is the least urgent and depends on the structural extractions in P2/P3 landing first.

**Independent Test**: The instructor answer/entry overlays, the student-search table, and the shared spinner render via Lit components with styles in `static styles`; no hard-coded inline hex colors remain in enhancer code.

**Acceptance Scenarios**:

1. **Given** the instructor overlays, **When** rendered, **Then** they use Lit components (`<qd-student-answers>` / `<qd-student-entries>`) with auto-escaped bindings and no inline `style.cssText`.
2. **Given** dialogs needing password entry, a spinner, or a student table, **When** rendered, **Then** they reuse shared components/styles rather than re-implementing them.

---

### Edge Cases

- **Behavior drift during extraction**: a moved function changes a default or ordering. Mitigated by characterization tests written before moving logic (TDD).
- **Bundle size regression**: adding new Lit components could grow the bundle. Each slice must verify ≤40KB min+gzip.
- **Offline/`file://` constraint**: no extraction may introduce dynamic imports or network dependencies in the IIFE build.
- **Frozen contracts**: `contracts.ts` must not be modified by this work.
- **Singleton/init ordering**: extracting storage/session init must preserve the existing initialization order and the lenient singleton-by-dbName semantics relied upon by callers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The review report MUST list every `src/**` file over 400 lines with its line count, a severity rating, and a concrete decomposition recommendation.
- **FR-002**: The report MUST address all five requested hot-spot criteria (UI/logic coupling, deep nesting, extractable child components, Lit-candidate UI, oversized files) with specific file and line references.
- **FR-003**: The report MUST provide a recommended execution order ranked from lowest-risk to highest-payoff.
- **FR-004**: The instructor quiz-answer overlay MUST render student-supplied content as inert text (no `innerHTML` interpolation of student data).
- **FR-005**: Security-sensitive instructor answer-reveal logic MUST exist in exactly one shared location used by both the initial-load and post-login paths.
- **FR-006**: Authentication, PIN, and migration-retry logic MUST be consolidated so the normal and post-migration login flows share a single code path with no duplicated success logic.
- **FR-007**: After decomposition, each targeted module MUST have a single primary responsibility, and no in-scope file (excluding frozen `contracts.ts`) SHOULD exceed ~400 lines.
- **FR-008**: Duplicated cross-cutting logic (DOM config reads, instructor-password hashing, pageId-from-URL parsing, persist-then-notify, magic key strings) MUST be replaced by shared helpers/constants.
- **FR-009**: Repeated raw-DOM UI blocks identified in the report SHOULD be reusable Lit components with styles in `static styles` and no inline hex-color styling in enhancer code.
- **FR-010**: All refactoring MUST be behavior-preserving except the sanctioned XSS fix (FR-004); existing tests MUST pass without modification beyond relocation, and new units MUST be covered by tests.
- **FR-011**: Every change MUST satisfy the Definition of Done (typecheck, lint, unit + integration tests, format, build) and keep the IIFE bundle ≤40KB min+gzip with no new network/dynamic-import dependencies.

### Key Entities

- **Hot-spot finding**: a recommendation with location (file + line range), category (one of the five criteria), severity, and a proposed extraction.
- **Extracted unit**: a new service, helper module, or Lit component carved from an oversized module, with a single responsibility and its own tests.
- **Cross-cutting helper**: a shared constant/function replacing logic duplicated across modules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of `src/**` files over 400 lines appear in the report with severity and a decomposition plan.
- **SC-002**: After P1–P3 work, the six targeted oversized modules are each under ~400 lines (frozen `contracts.ts` excluded).
- **SC-003**: Zero instances remain of student-supplied data rendered via `innerHTML` in enhancer overlays.
- **SC-004**: The instructor answer-reveal logic and the student-login success path each exist in exactly one location (no duplicated copies).
- **SC-005**: All existing automated tests continue to pass and newly extracted units have test coverage; the build remains green and the bundle stays ≤40KB min+gzip.
- **SC-006**: Each refactoring slice is independently shippable — it can be merged on its own without requiring later slices to be useful.

## Assumptions

- The report (`code-review-report.md`) is the immediate, primary deliverable; the implied refactoring is scoped here for later planning/execution and need not all land at once.
- "Over 400 lines" is the user's stated threshold for "very large"; `contracts.ts` (411, frozen) is explicitly out of scope for splitting.
- Behavior preservation is required; the one exception is the quiz-overlay XSS, treated as a security defect fix rather than a behavior change.
- Line references in the report are point-in-time and must be re-verified before editing.
- No constitutional constraint may be relaxed by this work (offline-first, progressive enhancement, TDD, answer security, performance budget).
