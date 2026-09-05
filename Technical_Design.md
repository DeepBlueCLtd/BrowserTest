# Technical Design Document (TDD) — Sonar Training Interactive Component

> **Re-baselined 2026-09-05** against the code as built. The November 2025 version of this
> document recorded design intent; 14 of its 20 checkable claims no longer matched `src/`
> (see `docs/PROJECT_STATE.md` §4). Section numbering is unchanged so existing references still
> resolve. Where something was designed but not built, this document says so.

## 1. Purpose and Scope
- Defines how the interactive quiz and analysis features are built, packaged, and integrated into DITA‑published HTML.
- Targets offline, `file://` deployments on constrained, air‑gapped machines.
- Out of scope: procurement, authoring workflows, detailed UX copy, server integration.

## 2. Architectural Overview
- **Runtime:** Single drop‑in JavaScript bundle (`sonar-quiz.iife.js`) that progressively enhances DITA HTML pages on `DOMContentLoaded`.
- **Pattern:** In‑place DOM upgrade of `table.qd-quiz` and `table.qd-analysis`; Lit 3 custom elements for every piece of UI chrome (login, status, instructor tools, dialogs).
- **Layers** (`src/`): `init/` (bootstrap, component injection, event and session coordination) → `enhancers/` (table upgrades, overlays, badges) → `services/` (parsing, state, auth, storage) → `services/storage/` (IndexedDB adapter, codec, migrations). `components/` sit alongside and talk to services directly.
- **Data:** IndexedDB for persistence; `sessionStorage` for the active session, instructor flag and R/A/G cache.
- **Isolation:** Shadow DOM for components; one injected global stylesheet (`#qd-global-styles`) for upgraded tables and the `.qd-hidden` utility.
- **No network:** No telemetry, no remote config, no CDNs, no dynamic imports.

## 3. UI Technology Decisions
- **Framework:** Lit 3 custom elements, all prefixed `qd-`. 22 elements are registered (`src/components/`): `qd-login`, `qd-status`, `qd-instructor` and its four sub‑panels (`-unlock`, `-scores`, `-export`, `-manage`), `qd-instructor-login`, `qd-modal`, `qd-password-modal`, `qd-confirm-dialog`, `qd-scores-modal`, `qd-student-table`, `qd-student-answers`, `qd-student-entries`, `qd-pin-reset-dialog`, `qd-lockout-banner`, `qd-migration-dialog`, `qd-help-trigger`, `qd-help-popup`, `qd-build-info`, `qd-spinner`.
- **Why Lit:** Small runtime, clean reactivity, strong encapsulation.
- **Injection:** `qd-login`, `qd-status` and `qd-instructor` are appended as children of the container matched by the `#qd-status-container` selector (default `.wh_top_menu_and_indexterms_link`). There is no `#qd-status` placeholder; if the selector matches nothing, nothing is injected and a warning is logged.
- **Styling:** Component styles live in Shadow DOM; a shared `sharedStyles` module covers the instructor sub‑panels. CSS variables are not used for theming.
- **Author‑visible contracts:** At most one `table.qd-quiz` and one `table.qd-analysis` per page. All matching tables are enhanced; the "one per page" rule is a documented authoring constraint, not enforced at runtime.

## 4. Packaging and Distribution
- **Bundles:** IIFE `dist/sonar-quiz.iife.js` (global `window.SonarQuiz`, auto‑init) and ESM `dist/sonar-quiz.esm.js` with `index.d.ts`.
- **Byte budget:** IIFE ≤ 40 KB min+gzip, enforced by `npm run size-check` in CI. Measured 37.6 KB at re‑baseline, so about 2.4 KB of headroom. The ESM build (~53 KB gzip) is **not budgeted**; it is for integrators who tree‑shake.
- **Assets:** No external CSS or fonts.
- **Release artifacts:** `release.yml` runs on a `v*` tag and attaches the built bundle to a GitHub Release (see `docs/RELEASE.md`). There is no CHANGELOG file; release notes are generated from commits.
- **Version stamp:** `VERSION` is injected from `package.json` at build time (`__APP_VERSION__`), alongside `BUILD_DATE`, and shown by `<qd-build-info>`.

## 5. Build Strategy
- **Tooling:** Vite (library mode) + Rollup; TypeScript 5; `vite-plugin-dts` for typings.
- **Build‑time defines:** `__BUILD_DATE__`, `__APP_VERSION__`, `__ENCRYPT_STORAGE__` (from the `ENCRYPT_STORAGE` env var).
- **CI (`.github/workflows/ci.yml`):** lint + format; unit and integration tests with coverage thresholds (a ratchet, raised as tests are added); test‑gap ratchet (`scripts/check-test-gaps.js --max-gaps N`); build + bundle size; Playwright E2E in default and encrypted modes; Storybook build.

## 6. Integration with DITA / Oxygen
- **Include:** Single `<script defer src="sonar-quiz.iife.js">` in the Oxygen template footer.
- **Configuration:** Hidden `<span>` elements injected by `dita/template/xslt/inc/customHeader.xsl`, read by `src/config/dom-config-reader.ts`:
  - `#qd-db-name` — IndexedDB name. **Required**; init aborts with a logged FATAL if missing.
  - `#qd-status-container` — selector for component injection (default above).
  - `#qd-title-selector` — selector for the publication title used as the Release ID (default `.wh_publication_title .title`).
  - `#qd-instructor-hash` — SHA‑256 of the instructor password truncated to 12 hex chars (optional; without it there is no instructor access).
- **No `data-qd-*` attributes are read.** Runtime configuration by attribute was designed but never implemented.
- **MCQ authoring:** Options are an `<ol>` in the Detail column, 1‑indexed. Numeric questions put the tolerance in the Detail column.
- **Runtime validation:** Authoring errors are reported to the console by the parsers (`quiz-parser.ts`, `analysis-parser.ts`). The on‑page validation banner from the original design was never built; the standalone `validation.ts` module that was meant to feed it was removed as dead code in September 2026.

## 7. Data and Session Model
- **Record key:** `qd/{release}/u{serviceId}` (`src/services/storage/adapter-utils.ts`).
- **Object stores:** `students`, `backups`, `auditLog`; `DB_VERSION = 3` (`src/services/storage/idb-connection.ts`). Missing stores trigger a delete‑and‑recreate recovery. `backups` is currently never written (`StorageService.backup()` has no callers).
- **Schema:** `SCHEMA_VERSION = 2`; v1 records are migrated lazily on read (`migration.ts`).
- **Page object:** `answers[]`, `firstAttempted`, `lastAttempted`, `state`, optional `analysis{tableId, cells, firstEdited, lastEdited}` (`src/types/contracts.ts`).
- **Persistence:** Atomic read‑modify‑write per save through `StorageService` → `IndexedDBStorageAdapter`.
- **Session (`sessionStorage`):** `qd/session` (active user), `qd/state` (R/A/G cache), `qd/instructor` (unlock flag), `qd:pin-attempts:*` (PIN rate limiting).
- **Cache policy:** Rebuilt from IndexedDB on login (`qd:cache-rebuild`), updated after each save, cleared on logout, expiry and erase.

## 8. Security and Privacy
See `docs/SECURITY.md` for the full description and known limitations. In brief:
- **Instructor unlock:** Password hashed client‑side (SHA‑256, truncated to 12 hex chars) and compared with `#qd-instructor-hash`. Two UI paths (the login‑modal and the toolbar button) share `src/services/auth/instructor-auth.ts`.
- **Student PIN:** 4‑digit PIN hashed with Web Crypto; 3 failed attempts → 30 s lockout.
- **Answer hiding:** On load the Answer column text is deleted from the DOM and the Detail column (options, tolerances) is stripped and held in memory; both are restored only on the instructor reveal path.
- **Storage obfuscation:** Optional, build‑time (`ENCRYPT_STORAGE=true`). XOR + base64 keyed by the release string only. This is obfuscation, not encryption; it deters casual DevTools inspection and nothing more.
- **Data residency:** All data stays in the browser profile.
- **PII:** Name and service ID only.

## 9. Performance
- **Parse once:** Each table is parsed on first enhancement and its metadata cached in a `WeakMap`; later upgrades (e.g. after login) reuse the parsed result.
- **Lazy overlays:** Per‑student views are computed only when the instructor toggles them.
- **Bundle:** Kept within budget; Lit is the only runtime dependency.

## 10. Accessibility
- **Keyboard:** Inputs and buttons are native elements inside Shadow DOM and tab‑navigable.
- **Announcements:** Status panel uses `role="status"`/`aria-live` where implemented in `qd-status`.
- **Colour + text:** R/A/G badges carry text labels.
- Formal WCAG 2.1 AA verification has not been performed; see `docs/PROJECT_STATE.md`.

## 11. Internationalisation and Formatting
- **Strings:** Inline in Lit templates. The "internal string dictionary" from the original design was not implemented; only help‑popup text is centralised (`src/config/help-content.ts`).
- **Dates:** Formatted with the `en-US` locale (`src/utils/date-helpers.ts`), not `en-GB` as originally specified.
- **Numbers:** Dot decimal for numeric answers and tolerances.

## 12. Error Handling
- **Author errors:** Logged to the console with the offending row; enhancement continues where possible. No on‑page banner.
- **Student errors:** Inline validation on inputs.
- **Storage faults:** Logged; the failing operation is skipped and reading content is unaffected. There is no retry prompt and the `qd:storage-error` event declared in `contracts.ts` is never dispatched.
- **Session expiry:** Silent — the session is cleared and the login form reappears; no `qd:session-expired` event is emitted.

## 13. Testing Strategy
- **Unit (Vitest, jsdom, fake‑indexeddb):** parsers, state calculation, services, components, init layer. `tests/unit/`.
- **Integration (Vitest, separate config):** DOM upgrade flows, storage round‑trips, instructor reveal. `tests/integration/`.
- **E2E (Playwright, Chromium):** Drives the committed DITA output under `dita-demo/` over `file://`; Storybook is started as the Playwright web server. Runs in default and `ENCRYPT_STORAGE=true` modes. `tests/e2e/`.
- **Visual regression:** none. Chromatic was removed in September 2026 when the account lapsed; CI proves every story still compiles (`npm run build-storybook`) but nothing compares rendered output. Playwright screenshot assertions are the obvious replacement if visual coverage is wanted again.
- **Coverage:** Thresholds in the two Vitest configs are enforced in CI and raised as coverage improves.

## 14. Browser and Platform Support
- **Minimum:** Chromium ≥ 96, Edge ≥ 96, Firefox ≥ 102.
- **File protocol:** No dynamic imports in the IIFE; all assets relative and self‑contained.
- **CSP:** No `eval`; works with default Oxygen output.

## 15. Release and Deployment
- **Distribution:** GitHub Release created by `release.yml` on a `vMAJOR.MINOR.PATCH` tag (`docs/RELEASE.md`).
- **Install:** Copy `sonar-quiz.iife.js` into the Oxygen template resources (`npm run copy-to-dita` does this for the checked‑in template and demo).
- **Roll‑back:** Keep the previous bundle alongside the new one; switch the template reference.

## 16. Diagnostics
- **Debug logging:** Off by default. Enable at runtime with `window.SonarQuiz.setDebugMode(true)` (`src/utils/logger.ts`). No `data-qd-debug` attribute is read.
- **Build info:** `<qd-build-info>` shows `VERSION` and `BUILD_DATE`.

## 17. Feature Flags
- **Build‑time only:** `ENCRYPT_STORAGE` (`src/config/feature-flags.ts`). There are no runtime flags; the `data-qd-*` mechanism in the original design was not implemented.

## 18. Instructor Operations
- **Unlock:** Via the "Instructor" button in `qd-login` (password modal) or the `qd-instructor` toolbar; both verify against `#qd-instructor-hash`. Unlock is session‑scoped (`qd/instructor`).
- **Reveal answers:** `src/enhancers/instructor-answer-reveal.ts` restores the Answer and Detail columns from in‑memory data. This is the only place correct answers are re‑injected into the DOM.
- **Per‑student views:** Toggle overlays on the current page for quiz answers and analysis cell entries (`quiz-instructor-overlay.ts`, `analysis-instructor-overlay.ts`).
- **Scores / export:** `qd-scores-modal` and CSV export (`qd-instructor-export`) read decoded records via `getStudentsByRelease()`, so they work with obfuscation on.
- **Erase all data:** Requires typing `DELETE ALL DATA`; clears the three IndexedDB stores and all `qd/*` and `qd:*` `sessionStorage` keys, then emits `qd:data-cleared`. There is no automatic CSV‑export prompt before erasing; export is a separate button.

## 19. Extensibility
- **Events:** All bus events are dispatched on `document` (not `window`), namespace `qd:`:
  - Session: `qd:login`, `qd:logout`, `qd:instructor-unlock`, `qd:instructor-lock`
  - Quiz/analysis activity: `qd:answer-saved`, `qd:state-changed`, `qd:analysis-saved`
  - Cache/UI coordination (emitted by `EventCoordinator`): `qd:cache-rebuild`, `qd:cache-update`, `qd:cache-clear`, `qd:badge-update`
  - Instructor: `qd:instructor-show-answers`, `qd:instructor-hide-answers`, `qd:data-cleared`
  - Component‑local (bubble from the element): `qd:pin-created`, `qd:pin-verified`, `qd:pin-reset`, `qd:lockout-expired`, `qd:help-open`, `qd:modal-close`, `qd:confirm`, `qd:cancel`, `qd:password-submit`, `qd:migration-complete`, `qd:migration-cancel`
  - Declared but never dispatched: `qd:session-expired`, `qd:storage-error`.
- **Public API (`window.SonarQuiz`, the IIFE namespace of `src/index.ts`):** `bootstrap(config)`, `cleanup()`, `isInitialized()`, `injectComponents()`, the enhancer functions, parsers, `migrateObfuscation()`, `setDebugMode()`, `VERSION`, `BUILD_DATE`, and the contract types. There is no `init()`; `bootstrap()` is guarded and is a no‑op if already initialised.
- **Add‑ons:** New UI islands can be added as Lit elements without touching the upgrade logic.

## 20. Risks and Mitigations
- **Legacy variance (Chromium 96):** ES2020 target; no syntax newer than the floor without transpilation.
- **Authoring drift:** Parser errors are logged, not surfaced on the page; authors need the console or the demo pages to notice.
- **Quota issues:** Rare offline; erase‑all and CSV export exist but are independent actions.
- **Multi‑tab conflicts:** No cross‑tab broadcast; the session cache is per tab and IndexedDB is last‑write‑wins.
- **Bundle headroom:** ~2.4 KB under the 40 KB ceiling; new features will need to trim before they add.

## 21. Acceptance Criteria (Technical)
- Bundle meets the byte budget and loads via `file://`.
- Enhancements are idempotent on re‑init (`bootstrap()` guard; per‑table `WeakMap` metadata).
- IndexedDB writes are atomic; the session cache reflects saved state.
- Instructor unlock, reveal and erase‑all work without leaving stale UI or stale data.
- Unit, integration and both E2E modes pass in CI; Storybook builds.
