# Technical Design Document (TDD) — Sonar Training Interactive Component

## 1. Purpose and Scope
- Defines how the interactive quiz and analysis features are built, packaged, and integrated into DITA‑published HTML.
- Targets offline, file:// deployments on constrained machines.
- Out of scope: procurement, authoring workflows, detailed UX copy, server integration.

## 2. Architectural Overview
- **Runtime:** Single drop‑in JavaScript bundle that progressively enhances DITA HTML pages.
- **Pattern:** DOM upgrades for quiz and analysis tables; small custom elements for UI overlays.
- **Data:** IndexedDB for persistence; sessionStorage for session + per‑session cache.
- **Isolation:** Shadow DOM for components; injected scoped CSS for upgraded tables.
- **No network:** No telemetry, no remote config, no CDNs.

## 3. UI Technology Decisions
- **Framework:** Lit 3 custom elements for UI islands (e.g., status, login).
- **Why Lit:** Small runtime, clean reactivity, strong encapsulation, good maintainability.
- **Components:** `<qd-login>`, `<qd-status>`; rest by DOM upgrade.
- **Styling:** CSS variables `--qd-*` for theming; avoid global CSS collisions.
- **Author-visible contracts:** Zero or one `table.qd-quiz.qd-page` and zero or one `table.qd-analysis` per page; `#qd-status` placeholder panel.

## 4. Packaging and Distribution
- **Bundles:**
  - IIFE: `sonar-quiz.iife.js` (global `window.SonarQuiz`, auto‑init on DOMContentLoaded).
  - ESM: `sonar-quiz.esm.js` for integrators.
- **Byte budget:** IIFE ≤ 40 KB min+gzip.
- **Assets:** No external CSS or fonts. Inline minimal styles where required.
- **Release artifacts:** GitHub Release ZIP including `/dist`, `/demo/index.html`, quick start, checksums.
- **SemVer:** Tag each release; maintain CHANGELOG.

## 5. Build Strategy
- **Tooling:** Vite (library mode) + Rollup outputs; tree‑shaken Lit imports.
- **Outputs:** IIFE + ESM + source maps; TypeScript definitions for ESM consumers.
- **CI:** Lint, unit tests, e2e tests, bundle size check, release packaging.

## 6. Integration with DITA / Oxygen
- **Include:** Single `<script>` in the Oxygen HTML template footer.
- **Auto‑init:** On page load, component validates and upgrades known tables, attaches overlays.
- **Zero author config:** Content authors copy/paste table patterns; optional `data-qd-*` attributes for page‑level toggles.
- **MCQ authoring:** Multiple choice questions use `<ol>` ordered lists that are **1-indexed** (first option = 1, not 0).
- **Runtime validation:** Clear banner if authoring constraints are violated (e.g., more than one quiz table per page).

## 7. Data and Session Model
- **Record key:** `qd/{release}/u{serviceId}`.
- **Page object:** `answers[]`, `firstAttempted`, `lastAttempted`, `state`, optional `analysis{cells, firstEdited, lastEdited}`.
- **Persistence:** IndexedDB atomic read‑modify‑write per save.
- **Session:** `sessionStorage` holds active user + instructor unlock + per‑session R/A/G cache (`qd/state`).
- **Cache policy:** Build from IndexedDB on login; update after each save; clear on logout/expiry.

## 8. Security and Privacy
- **Instructor unlock:** Local password gate; never persists plaintext; session‑scoped.
- **Data residency:** All data stays local; no network activity.
- **Future obfuscation:** Pluggable scheme keyed by `{release, serviceId}` if required.
- **PII minimization:** Store only name and service ID; no analytics.

## 9. Performance
- **Parse once:** Upgrade each table once per page.
- **Lazy overlays:** Per‑student views computed only when instructor unlocks.
- **DOM efficiency:** Batch changes; avoid layout thrash; prefer document fragments.
- **Bundle:** Keep within byte budget; avoid large dependencies.

## 10. Accessibility
- **Keyboard:** All inputs tab‑navigable; visible focus.
- **Announcements:** Status panel uses `role="status"` + `aria-live="polite"`.
- **Color + text:** R/A/G paired with text labels.
- **Fonts:** Use system UI font stack.

## 11. Internationalisation and Formatting
- **Default locale:** `en‑GB` for date labels.
- **Numbers:** Dot decimal only for numeric answers and tolerances.
- **Labels:** All UI strings in a small internal dictionary for future localisation, no remote files.

## 12. Error Handling
- **Author errors:** Prominent banner with counts and first few issues; page remains readable.
- **Student errors:** Inline validation; never blocks reading of instructional content.
- **Storage faults:** Graceful degradation with user prompt to retry; hard failures disable enhancement but leave content visible.

## 13. Testing Strategy
- **Unit:** Parsing, state transitions, migrations, R/A/G calculations.
- **E2E:** Playwright on `file://` demo: login, answer flows, status updates, instructor unlock, erase‑all.
- **Visual regression:** Screenshot checks for the status panel and quiz widgets.
- **Performance smoke:** Ensure initial enhancement completes within budget on reference laptop.

## 14. Browser and Platform Support
- **Minimum:** Chromium ≥ 96, Edge ≥ 96, Firefox ≥ 102.
- **File protocol:** No dynamic imports in IIFE; all assets relative and self‑contained.
- **CSP:** Avoid `eval` and similar; work with default Oxygen output.
- **Touch/Pointer:** Pointer events supported; inputs large enough for tablet targets.

## 15. Release and Deployment
- **Distribution:** GitHub Releases ZIP; optional npm package for ESM consumers.
- **Verification:** Checksums for `/dist` files; signed tags.
- **Install:** Copy `sonar-quiz.iife.js` to Oxygen output; update template once per release.
- **Roll‑back:** Keep previous bundle alongside new; quick template switch if needed.

## 16. Diagnostics
- **Debug mode:** `data-qd-debug` enables console logs and on‑page diagnostics (keys, page states).
- **Prod mode:** Silent; logs suppressed; only author validation banners when needed.

## 17. Feature Flags
- **Mechanism:** `data-qd-*` attributes read at init (e.g., show answers when unlocked, enable debug UI).
- **Policy:** No remote flags; deterministic offline behavior.

## 18. Instructor Operations
- **Reveal answers:** Password‑gated; hides again on lock.
- **Per‑student views:** Optional overlays on the current page for both quiz answers and analysis cell entries.
- **Erase all data:** Clears IndexedDB + sessionStorage; optional CSV export prompt before destructive action.

## 19. Extensibility
- **Events:** Custom events on `window` for integration hooks:
  - `qd:login`, `qd:logout` — session management
  - `qd:answer-saved`, `qd:status-changed` — quiz activity
  - `qd:analysis-cell-change` — analysis table edits
  - `qd:unlock`, `qd:lock` — instructor mode
  - `qd:show-all-responses` — student response display toggle
  - `qd:erase` — data deletion
  - `qd:error` — error notifications
- **Public API:** `window.SonarQuiz.init()` for manual re‑init; stable minor‑version contract.
- **Add‑ons:** Future UI islands can be added as Lit elements without touching core upgrade logic.

## 20. Risks and Mitigations
- **Legacy variance (Chromium 96):** Avoid modern syntax without transpilation; test on target builds.
- **Authoring drift:** Runtime validation and clear docs to keep tables compliant.
- **Quota issues:** Rare offline; provide erase‑all and CSV export before erase.
- **Multi‑tab conflicts:** Session‑scoped cache; last‑write‑wins in IDB; optional cross‑tab broadcast for UI refresh.

## 21. Acceptance Criteria (Technical)
- Bundle meets byte budget and loads via file://.
- Enhancements are idempotent and robust on re‑init.
- IndexedDB writes are atomic; session cache reflects saved state.
- Instructor unlock and erase‑all work without leaving stale UI.
- All tests pass on reference browsers; demo works from a ZIP without a server.
