# Phase 0 Research: Refactoring Strategy

**Feature**: Refactor Architectural Hot-Spots for Maintainability
**Date**: 2026-06-17

There are no unknown technologies to research — the stack (TypeScript 5.x, Lit 3.x, Vite, Vitest, Playwright, IndexedDB) is established. The open questions for this feature are *strategy* decisions about how to refactor safely. Each is resolved below.

## D1: How to guarantee behavior preservation during extraction

- **Decision**: Use characterization tests. Before moving any logic, write/confirm tests that capture current observable behavior of the target function (inputs → outputs/DOM/events/storage). Extract the logic, re-point callers, keep tests green. Only then refactor internals.
- **Rationale**: The codebase mandates TDD (Constitution III) and most target modules lack unit isolation today. Characterization tests turn "behavior-preserving" (FR-010) into a verifiable gate rather than an aspiration.
- **Alternatives considered**: Pure manual verification (rejected — not repeatable, violates TDD); snapshot-only tests (rejected — too brittle for DOM-heavy enhancers, prefer explicit assertions on events/storage).

## D2: Sequencing of slices (risk vs. payoff)

- **Decision**: Five waves — (1) shared constants/helpers (no behavior change), (2) security + duplication fixes (XSS, answer-reveal dedup, login-path dedup), (3) pure-logic & service extraction, (4) large-file decomposition, (5) reusable Lit components.
- **Rationale**: Front-loads zero-risk consolidation that *reduces* duplication the later waves would otherwise have to move twice; isolates the one sanctioned behavior change (XSS) early where it's easy to review; defers UI componentization (highest churn, bundle-size sensitive) until structure is clean.
- **Alternatives considered**: File-by-file top-down (rejected — would re-do shared-helper extraction repeatedly); big-bang rewrite of `qd-login`/`indexeddb` (rejected — not independently shippable, high regression risk).

## D3: Boundary for the `AuthService` extraction from `qd-login.ts`

- **Decision**: `AuthService.loginStudent(input)` returns a discriminated union (`{kind:'success'} | {kind:'lockout', untilMs} | {kind:'bad-pin', remaining} | {kind:'needs-migration', error} | {kind:'new-student-created'}`). The component maps results → state only. `retryAfterMigration(...)` shares the same internal success path.
- **Rationale**: Removes the ~100-line duplicated `retryLoginAfterMigration`, flattens 4–5-level nesting, and makes auth unit-testable without a DOM. Discriminated unions keep the component's render logic exhaustive and type-safe.
- **Alternatives considered**: Throwing typed errors for each outcome (rejected — control-flow via exceptions is harder to test exhaustively); boolean flags (rejected — recreates the nesting we're removing).

## D4: Encryption awareness in the IndexedDB split

- **Decision**: Introduce an `idb-codec` layer (`read`/`write`) that owns `ENCRYPT_STORAGE`, `deriveKey`, encode/decode, and format-mismatch detection. The adapter and repositories call `codec.read/write` and remain unaware of encryption policy. A shared `promisifyRequest`/`runTransaction` helper replaces the repeated `new Promise(...)` scaffold.
- **Rationale**: Encryption is currently leaking into the persistence layer (`indexeddb.ts`); isolating it shrinks the adapter, removes ~150 lines of boilerplate, and keeps the obfuscation feature (009) cohesive. Connection/migration moves to `idb-connection`; backups and audit log become small repositories.
- **Alternatives considered**: Leaving codec inline (rejected — keeps the file >700 lines and the worst nesting); a full repository/ORM abstraction (rejected — over-engineering for two stores; violates "simpler alternative" preference).

## D5: Which UI to convert to Lit (and which NOT to)

- **Decision**: Convert the instructor overlays (`<qd-student-answers>`, `<qd-student-entries>`), the student-search table (`<qd-student-table>`), and small shared elements (`<qd-spinner>`, optional `<qd-lockout-banner>`). **Do NOT** convert `home-badges` — it stays a CSS-class enhancement on existing DITA nav links.
- **Rationale**: The overlays currently build markup via `innerHTML`/`style.cssText`, which is the source of the XSS (quiz) and the Shadow-DOM-violating inline colors (analysis); Lit auto-escapes and encapsulates styles. Badges, by contrast, are progressive enhancement of existing markup — converting them to Lit would break graceful degradation (Constitution II).
- **Alternatives considered**: Convert everything to Lit (rejected — breaks PE for badges, grows bundle); keep raw DOM but manually escape (rejected — leaves duplicated rendering and inline styles, doesn't address Constitution V isolation).

## D6: Where the shared instructor answer-reveal logic lives

- **Decision**: One exported function in `enhancers/instructor-answer-reveal.ts` (e.g. `revealInstructorAnswers(table, metadata)`), called by both `bootstrap.ts` (initial load) and `event-coordinator.ts` (post-login).
- **Rationale**: This security-sensitive logic (re-injecting `correctAnswer` into the DOM and unhiding columns) is currently copy-pasted in two places that can drift (FR-005). Co-locating it with the quiz enhancer keeps answer handling in the layer responsible for Constitution VIII.
- **Alternatives considered**: Keep two copies with a shared test (rejected — still two maintenance points); push into `qd-instructor` component (rejected — it operates on enhancer-owned table DOM, wrong layer).

## D7: Bundle-size safety for new Lit components

- **Decision**: Treat `npm run size-check` (≤40KB min+gzip) as a per-slice exit gate, measured after each Lit component is added. Share styles via `shared-styles.ts` to avoid duplicating CSS across new components.
- **Rationale**: Lit components are the only wave that can grow the bundle (Constitution V). Measuring per-slice catches regressions at the responsible change rather than at the end.
- **Alternatives considered**: Measure only at the end (rejected — hard to attribute a regression); skip new components if near budget (deferred — revisit only if a measured slice breaches budget).

## Summary of resolved decisions

| ID | Decision |
|----|----------|
| D1 | Characterization tests gate every extraction |
| D2 | Five risk-ordered waves; constants → security → services → decomposition → Lit |
| D3 | `AuthService` returns a discriminated union; component is a thin view |
| D4 | `idb-codec` + `promisifyRequest`/`runTransaction`; adapter unaware of encryption |
| D5 | Lit-ify overlays/table/spinner; keep `home-badges` as PE class toggles |
| D6 | Single shared `revealInstructorAnswers` used by bootstrap + event-coordinator |
| D7 | `size-check` is a per-slice gate; share styles to protect the 40KB budget |

All NEEDS CLARIFICATION resolved. Ready for Phase 1.
