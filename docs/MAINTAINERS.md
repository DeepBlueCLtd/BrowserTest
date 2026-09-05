# Maintainer Guide

For whoever picks this project up. It assumes you know TypeScript and have read the
one-paragraph overview in [../README.md](../README.md). Everything here was verified against
the code on 2026-09-05; if a statement and the code disagree, the code wins and this file
needs a fix.

## 1. Setup

```bash
node -v      # >= 18 (CI uses 22)
npm ci
npm run build             # dist/sonar-quiz.iife.js + esm + typings
npm test                  # unit + integration (~30 s)
```

Then open `demo/quiz-index.html` from `file://`, or `python3 -m http.server` and browse to it.
The demo pages load `dist/sonar-quiz.iife.js` and provide the hidden config spans themselves.

## 2. Repository map

| Path | What lives there | Notes |
|---|---|---|
| `src/index.ts` | Public exports and auto-init | Everything exported here is `window.SonarQuiz.*` |
| `src/init/` | `bootstrap.ts` (startup sequence), `component-injector.ts`, `event-coordinator.ts`, `session-coordinator.ts` (30-min expiry), `global-styles.ts` | Read `bootstrap.ts` first |
| `src/enhancers/` | Table upgrades (`quiz-table.ts`, `analysis-table.ts`), persistence tails, instructor overlays, `home-badges.ts` | `quiz-table-columns.ts` is where answers are stripped from the DOM |
| `src/components/` | 22 Lit elements, all `qd-*` | `qd-instructor/` holds the instructor toolbar and its sub-panels |
| `src/services/` | Parsers, state calculation, scores, session, `storage-service.ts` | `auth/` = instructor password + student PIN + rate limiter |
| `src/services/storage/` | IndexedDB adapter, connection/schema (`DB_VERSION = 3`), codec, obfuscation, migrations | Key format `qd/{release}/u{serviceId}` |
| `src/config/` | Hidden-span config reader, feature flags, help text | `dom-config-reader.ts` is the config contract |
| `src/types/contracts.ts` | Frozen types, event names, storage keys | Do not change without a schema bump |
| `tests/unit`, `tests/integration`, `tests/e2e` | Vitest, Vitest (separate config), Playwright | E2E drives `dita-demo/` pages over `file://` |
| `stories/` | Storybook stories; also the Playwright web server | A story importing a deleted module breaks the Storybook build and PR previews |
| `dita/` | Oxygen template + XSL that injects the config spans | `customHeader.xsl` is the real config source in production |
| `dita-demo/` | Committed DITA output used by E2E and PR previews | Refresh with `npm run update-dita-demo` after a DITA build |
| `scripts/` | Bundle size check, test-gap check, E2E gap report | All wired into CI or `npm run` |
| `specs/` | Feature folders 000–012 | The implementation history; 003/004 have a `STATUS.md` explaining their missing plan/tasks |
| `docs/history/` | Archived documents | Not maintained; paths inside are stale |

## 3. Where the truth lives

- **Config contract:** `src/config/dom-config-reader.ts` and `dita/template/xslt/inc/customHeader.xsl`. Four spans: `#qd-db-name` (required), `#qd-status-container`, `#qd-title-selector`, `#qd-instructor-hash`.
- **Events:** `Technical_Design.md` §19 lists every `qd:*` event and who emits it. All bus events go on `document`.
- **Data model:** `src/types/contracts.ts`; stores and versions in `src/services/storage/idb-connection.ts`.
- **Security behaviour:** `docs/SECURITY.md`.
- **Working conventions and definition of done:** `CLAUDE.md`.

## 4. Build, test, release

| Task | Command | Gate |
|---|---|---|
| Type-check | `npm run typecheck` | CI |
| Lint / format | `npm run lint`, `npm run format:check` | CI |
| Unit + coverage | `npm run test:coverage:unit` | CI enforces thresholds in `vitest.config.ts` |
| Integration + coverage | `npm run test:coverage:integration` | CI enforces thresholds in `vitest.integration.config.ts` |
| Untested-file ratchet | `npm run test:gaps -- --max-gaps N` | CI (`N` set in `ci.yml`) |
| Bundle size | `npm run build && npm run size-check` | CI, 40 KB gzip on the IIFE |
| E2E | `npm run test:e2e` and `npm run test:e2e:encrypted` | CI matrix |
| Storybook build | `npm run build-storybook` | CI, on every push and PR |
| Release | Tag `vX.Y.Z` on `main` | `release.yml` builds and publishes; see `docs/RELEASE.md` |

**Raising the ratchets.** The coverage thresholds and `--max-gaps` value are set to the measured
level. When you add tests, raise them in the same PR so the improvement is locked in.

**E2E locally.** Playwright starts Storybook as its web server. In some sandboxes the spawn
fails with `spawn none ENOENT`; start Storybook yourself with
`npx storybook dev -p 6006 --ci --no-open` and Playwright will reuse it. The encrypted variant
needs Storybook started with `ENCRYPT_STORAGE=true` and the bundle built with
`npm run build:dita:encrypted`; restore `dita-demo/` and `dita/template/` afterwards
(`git checkout -- dita-demo dita/template`) so an encrypted bundle is not committed.

**Version stamp.** `VERSION` in the bundle comes from `package.json` at build time. Bump
`package.json`, commit, tag; do not edit `src/index.ts`.

## 5. Things that will surprise you

- **`window.SonarQuiz` has no `init()`.** Use `bootstrap(config)`; it is a guarded no-op after the first call. `cleanup()` tears down.
- **Answers are removed from the DOM at load**, not just hidden. Instructor reveal restores them from in-memory metadata. If a parser change moves the Detail column, fix `quiz-table-columns.ts` in the same change.
- **Obfuscation is not encryption.** The key is the release string, which is visible on the page. Say "obfuscation" in any user-facing text.
- **Erase All Data** clears IndexedDB (three stores) and all `qd/*` and `qd:*` session keys. It does not prompt to export first.
- **Two instructor unlock paths** (login-modal and toolbar) share one verifier. Both read `#qd-instructor-hash`.
- **Session expiry is silent.** No event, no message; the login form simply returns.
- **Coverage is per suite.** Unit and integration produce separate reports; there is no merged figure.
- **`analyze:e2e-gaps` only scans `tests/e2e/workflows/`** and uses a hard-coded feature list. Treat its "100% covered" as a floor.
- **Instructor password lockout.** Two wrong passwords are free; the third starts a 2/4/8/16/30 s backoff, reset by a correct password. Tests that retry immediately after a deliberate failure must account for this.
- **`qd-confirm-dialog` renders its message with `unsafeHTML`.** Escape anything user-supplied with `escapeHtml()` before passing it in.
- **Bundle headroom is 0.90 KB.** Run `npm run size-check` early, not at the end of a feature.

## 6. Known issues and deferred work

Tracked in `docs/PROJECT_STATE.md` §8. At the time of writing the open items are: **no visual
regression testing** (Chromatic was dropped in September 2026; CI proves stories compile but
nothing compares rendered output — Playwright screenshot assertions would be the replacement);
no runtime validation banner for authoring errors; no `qd:storage-error` / `qd:session-expired`
events; no cross-tab sync; `backups` store never written; formal WCAG audit not done; ESM bundle
unbudgeted; under 1 KB of IIFE headroom.

## 7. Adding a feature

1. Create `specs/0NN-name/` with `spec.md`, `plan.md`, `tasks.md` (the Spec Kit skills in `.claude/` generate these).
2. Tests first (`CLAUDE.md` → TDD workflow). Put unit tests at `tests/unit/<same path as src>/<name>.test.ts` so the gap check finds them.
3. Keep the IIFE under budget; run `npm run size-check` before pushing.
4. If you add or rename a `qd:*` event, update `Technical_Design.md` §19 and `src/types/contracts.ts` together.
5. If you add a component, add a story; CI builds Storybook.
6. Run the full definition-of-done list in `CLAUDE.md` before opening a PR.
