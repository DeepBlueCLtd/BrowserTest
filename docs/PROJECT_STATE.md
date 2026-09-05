# Project State — Consolidation Report (2026-09-05)

Audit of the dormant BrowserTest ("Sonar Quiz System") codebase ahead of a formal restart.
Written for an incoming maintainer. Every number below comes from commands run on
2026-09-05 against `main` at `5383ca2` (last commit 2026-06-19), on Node 22.22 / npm 10.9.
Existing documents were audited, not rewritten.

## 1. Summary

- **The code is healthy; the project's picture of itself is not.** Type-check, lint, format,
  build, size budget, 831 unit tests, 84 integration tests and 105 Playwright E2E tests all pass.
  The documentation, CI signals and version stamps say otherwise or say nothing.
- **Chromatic visual regression has been silently broken since the June 2026 refactor.**
  `storybook build` fails on an orphan story (`stories/components/qd-error-banner.stories.ts`
  imports a component deleted in spec 012). CI shows green because the job has
  `continue-on-error: true`. PR-preview Storybook deploys skip for the same reason.
- **Two quality gates are decorative.** The 80% coverage thresholds in `vitest.config.ts` are
  never evaluated in CI (CI runs `test:unit`, not `test:coverage`), and would fail if they were
  (62% unit lines, 40% integration lines). The E2E job in `ci.yml` is commented out.
- **"Erase All Data" does not erase IndexedDB.** It clears sessionStorage only; the adapter's
  `clearAll()` has no callers. The E2E test documents this in a comment rather than failing.
  This contradicts Constitution VI and the CLAUDE.md description of the button.
- **`Technical_Design.md` describes a system that was never built as written.** Of 20 checked
  claims, 6 match, 8 have drifted and 6 are not implemented (Section 4). Event names, the
  component model, `data-qd-*` flags, the public `init()` API and cross-tab sync are all wrong.
- **Two of the largest root docs are actively misleading** (they cite files deleted in June),
  five `SECURITY_*.md` files (125 KB) overlap heavily, and README/CLAUDE.md link to two
  documents that do not exist. There is no maintainer guide; `CLAUDE.md` is the de facto one.
- **Loose ends are few and specific:** spec 009 has three open tasks for an E2E file that was
  never written; four modules (`validation.ts`, `csv-export.ts`, `runtime-config.ts`,
  `qd-pin-create.ts`) are fully built but unwired; the toolbar unlock path reads a config span
  the DITA template never emits.

## 2. Repository snapshot

| Item | Value |
|---|---|
| Last commit | `5383ca2` 2026-06-19, merge of PR #94 (spec 012 complete) |
| Working tree at audit start | clean; no WIP, no open PRs, no tags |
| `package.json` version | 0.2.0 |
| `src/index.ts` `VERSION` | `'0.1.0-phase3.1'` (stale; surfaced in `<qd-build-info>`) |
| Source | 91 files, ~14,840 LOC under `src/` |
| Tests | 52 unit, 12 integration, 16 E2E spec files (~20,400 LOC) |
| TODO/FIXME in `src/` | 0 |
| CI on `main` | green (lint, unit+integration, build+size); E2E disabled; Chromatic masked |
| Releases | `release.yml` triggers on `v*` tags; no tag has ever been pushed, so it is unexercised |

Activity came in two bursts: Nov 2025 (all design/security docs, phases 0–7) and June 2026
(specs 005–012, a large refactor). Only `CLAUDE.md` was updated during the second burst.

## 3. Verification results

| Command | Result | Headline |
|---|---|---|
| `npm run typecheck` | pass | |
| `npm run lint` | pass | 0 errors |
| `npm run format:check` | pass | |
| `npm run test:coverage:unit` | tests pass, **thresholds fail** | 52 files / 831 tests; lines 62.4%, branches 86.8%, functions 71.6% vs 80% |
| `npm run test:coverage:integration` | tests pass, **thresholds fail** | 12 files / 84 tests; lines 39.6%, branches 71.0%, functions 43.5% |
| `npm run test:gaps` | ran | 39 of 86 source files reported without a test (see caveat below) |
| `npm run build` | pass | IIFE 148 KB raw, ESM 239 KB raw |
| `npm run size-check` | pass | IIFE 37.61 KB gzipped, limit 40 KB (2.39 KB headroom) |
| `npm run build-storybook` | **fail** | `Could not resolve "../../src/components/qd-error-banner.js"` |
| `npm run test:e2e` | pass | 105 passed in 1.6 min (Storybook dev server started manually, see note) |
| `npm run test:e2e:encrypted` | pass | 104 passed, 1 skipped (Storybook started with `ENCRYPT_STORAGE=true`) |
| `npm run analyze:e2e-gaps` | ran | regenerated `docs/test-coverage-report.md` (was dated 2025-11-26) |
| Chromatic | not runnable locally | needs `CHROMATIC_PROJECT_TOKEN`; CI log inspected instead |

Notes:
- Unit and integration coverage are separate runs with separate reports; there is no merged
  figure. Per-directory unit line coverage: `services/auth` 98%, `utils` 82%, `components` 74%,
  `config` 72%, `services` 71%, `enhancers` 17%, `init` 0%, `index.ts` 0%. Integration covers
  `enhancers` 71% and `init` 60% but `components` 10%. Neither suite alone represents the code.
- `test:gaps` is structural and path-mirrored. 7 of its 39 "missing" files have a test at a
  flat path it does not look for (e.g. `tests/unit/auth-service.test.ts`). Real gaps remain in
  `src/init/` (all four modules), `src/services/storage/` (codec, connection, repositories),
  `src/enhancers/` persistence modules and `src/services/state-calculator.ts`.
- `analyze:e2e-gaps` scans `tests/e2e/workflows/` only; `tests/e2e/help-popups.spec.ts` is
  invisible to it. Its feature inventory is hard-coded, so "11/11 covered" is a floor, not proof.
- E2E: in this sandbox Playwright's `webServer` (`npm run storybook`) failed to spawn a browser
  opener (`spawn none ENOENT`). Starting Storybook with `--ci --no-open` and letting Playwright
  reuse it worked. Storybook **dev** mode tolerates the orphan story; **build** mode does not.

## 4. Architecture drift vs `Technical_Design.md`

The design doc (7 KB, last edited 2025-11-28) predates the PIN, help, migration, obfuscation,
audit-log and build-info features and the June 2026 refactor. Checked claim by claim:

| § | Claim | Verdict | Evidence |
|---|---|---|---|
| 3 | Components are `<qd-login>` and `<qd-status>`; rest by DOM upgrade | Drifted | 23 custom elements registered under `src/components/` |
| 3 | `#qd-status` placeholder panel | Not implemented | Components appended into the `#qd-status-container` selector by `src/init/component-injector.ts`; `#qd-status` never queried |
| 3 | Zero or one `table.qd-quiz.qd-page` per page | Drifted | `.qd-page` appears nowhere; all `table.qd-quiz` matches are enhanced in a loop, no cardinality check (`src/init/bootstrap.ts`) |
| 7 | Page object fields; `qd/state` cache key; `qd/{release}/u{serviceId}` record key | Matches | `src/types/contracts.ts`, `src/services/storage/adapter-utils.ts` |
| 8 | Obfuscation is "future", keyed by `{release, serviceId}` | Drifted | Shipped behind build-time `ENCRYPT_STORAGE`; key derived from release only (`src/services/storage/obfuscation.ts`) |
| 11 | UI strings in an internal dictionary; `en-GB` dates | Not implemented / Drifted | Strings inline in Lit templates; `src/utils/date-helpers.ts` uses `en-US` |
| 12 | Author-error banner; storage-fault retry prompt | Not implemented | `src/services/validation.ts` (364 lines) has no importer; `qd:storage-error` is declared but never dispatched |
| 16 | `data-qd-debug` attribute enables debug | Not implemented | No `data-qd-debug` read; `setDebugMode()` in `src/utils/logger.ts` has no callers, so debug is permanently off. CLAUDE.md's "`DEBUG_MODE` constant in `src/index.ts`" does not exist either |
| 17 | Feature flags via `data-qd-*` attributes | Not implemented | Only flag is build-time `ENCRYPT_STORAGE`; `src/config/runtime-config.ts` defines a full runtime config with zero importers |
| 18 | CSV export prompt before erase | Not implemented | `qd-instructor-manage.ts` goes from typed confirmation straight to clear |
| 18 | Erase clears IndexedDB + sessionStorage | **Drifted (defect)** | `clearQuizData()` in `src/utils/storage-helpers.ts` iterates sessionStorage only; `StorageService.clearAll()` has no callers |
| 19 | Events dispatched on `window` | Drifted | All bus events dispatch on `document` (`src/utils/event-helpers.ts`) |
| 19 | Event names `qd:status-changed`, `qd:unlock`, `qd:lock`, `qd:analysis-cell-change`, `qd:show-all-responses`, `qd:erase`, `qd:error` | Drifted | Actual: `qd:state-changed`, `qd:instructor-unlock/-lock`, `qd:analysis-saved`, `qd:instructor-show-answers/-hide-answers`, `qd:data-cleared`; no error event. ~14 further events undocumented; `qd:analysis-saved`, `qd:cache-*`, `qd:badge-update`, `qd:pin-*` have no listeners |
| 19 | `window.SonarQuiz.init()` re-init API | Not implemented | Global is Rollup's IIFE namespace; export is `bootstrap()` (guarded, no re-init) plus `cleanup()` |
| 20 | Cross-tab broadcast | Not implemented | No `BroadcastChannel` or `storage` listener |
| 7 | 30-minute session timeout | Matches | `src/init/session-coordinator.ts`; expiry is silent (no event, no UI notice) |
| 5 | CI runs e2e and size check | Half true | size-check yes; E2E commented out |
| VIII | Answers removed from DOM on load | Matches, with a gap | `hideAnswerColumn()` blanks the answer cell; `hideDetailColumn()` only adds a CSS class, so the Detail column (MCQ `<ol>` options, numeric tolerances) stays in the DOM; the leak is the tolerance value, since options are shown to students anyway (`src/enhancers/quiz-table-columns.ts`) |

Undocumented in the design doc but present in code: PIN authentication (service, rate limiter,
three components), help popups, obfuscation migration dialog, audit-log and backup object stores
(DB version 3, three stores; CLAUDE.md says two), schema v1→v2 migration, scores modal, build-info
stamp, CSS answer hiding.

Two further code-level findings a maintainer should know:
- **Duplicate instructor-hash config.** `src/services/auth/instructor-auth.ts` reads
  `#qd-instructor-hash` (emitted by `dita/template/xslt/inc/customHeader.xsl`).
  `src/config/instructor-password.ts` reads `#instructor.password.hash`, which the template never
  emits; it is used only by the toolbar `<qd-instructor-unlock>` button, so that path always fails
  in DITA output. Stories and unit tests provide the second id, which is why nothing catches it.
- **Dead modules:** `src/services/validation.ts`, `src/services/csv-export.ts`,
  `src/config/runtime-config.ts`, `src/components/qd-pin-create.ts` have no importers. Their
  presence inflates the untested-file count and the reader's mental model.

`ARCHITECTURE_FLOWS.md` and `CLAUDE.md` are broadly consistent with the code at the level of
flows and file paths. CLAUDE.md is wrong on: `DEBUG_MODE` constant, object-store count, and
the erase-all description. It also says "Phase 1 Complete → Starting Phase 2", which is false.

## 5. Documentation audit

Status key: **Current** = safe to trust; **Historical** = accurate for its time, clearly dated;
**Stale** = will mislead; **Generated** = tool output. Disposition is a recommendation only.

| File | KB | Last commit | Status | Reason | Suggested disposition |
|---|---|---|---|---|---|
| `CLAUDE.md` | 23 | 2026-06-17 | Current (minor errors) | Only doc updated in 2026; see §4 | Keep; fix the three errors; it is the maintainer guide until a real one exists |
| `README.md` | 6 | 2025-11-29 | Stale | "Status: In active development", "Phase 0 ← current", links `Delivery_Plan.md` and `Storybook_Plan.md` which do not exist | Rewrite the status/phase section; fix links |
| `Technical_Design.md` | 7 | 2025-11-28 | Stale | See §4: 14 of 20 claims wrong | Either re-baseline against code or mark "original design intent, not as-built" |
| `ARCHITECTURE_FLOWS.md` | 11 | 2025-11-18 | Current-ish | Flows still hold; event names partially outdated | Keep; update event names |
| `System_Requirements.md` | 8 | 2025-11-18 | Historical | Requirements baseline; predates PIN/help/encryption features | Keep as baseline; note additions from specs 003–010 |
| `Contracts.md` | 3 | 2025-11-18 | Current | Summary of `src/types/contracts.ts` | Keep |
| `CODE_REVIEW_REFACTORING_HOTSPOTS.md` | 22 | 2025-11-19 | Historical (banner added today) | Seeded spec 012; cites deleted files | Archive under `docs/history/` |
| `POST_PHASE_7_REVIEW.md` | 31 | 2025-11-18 | Stale | Cites `src/utils/attributes.ts`, `src/utils/events.ts` (gone); pre-refactor structure | Archive |
| `SECURITY_BEST_PRACTICES.md` | 54 | 2025-11-15 | Historical | Generic guidance from one commit; largest doc in repo | Merge the five SECURITY files into one project-specific page; archive the rest |
| `SECURITY_IMPLEMENTATION_GUIDE.md` | 19 | 2025-11-15 | Historical | Remediation plan, largely executed by spec 001 | Merge/archive |
| `SECURITY_TEST_EXAMPLES.md` | 30 | 2025-11-15 | Historical | Sample tests, some now real tests | Merge/archive |
| `SECURITY_README.md` | 12 | 2025-11-15 | Historical | Index for the above | Merge/archive |
| `SECURITY_QUICK_REFERENCE.md` | 10 | 2025-11-15 | Historical | Cheat-sheet | Merge/archive |
| `docs/COMPONENT_SPEC.md` | 14 | 2025-11-18 | Stale | Component list predates the qd-instructor split and PIN/help components | Re-baseline or archive |
| `docs/INSTRUCTOR_PASSWORD_IMPLEMENTATION.md` | 35 | 2025-11-18 | Historical | Design notes; does not mention the duplicate hash id | Archive |
| `docs/CODE_REDUCTION_PROPOSAL.md` | 3 | 2025-11-24 | Historical | Executed as spec 005 | Archive |
| `docs/RELEASE.md` | 3 | 2025-11-29 | Current (untested) | Process never exercised; no tags exist | Keep; exercise once |
| `docs/CHROMATIC_SETUP.md` | 2 | 2025-11-15 | Stale | Says "Chromatic is configured"; build is broken and token status unknown | Update after fix |
| `docs/test-coverage-report.md` | 2 | regenerated today | Generated | See §3 caveat on scope | Keep regenerating; do not hand-edit |

Specs (`specs/`): 12 folders. 005–012 have spec/plan/tasks; all tasks closed except
**009-encrypt-stored-data** (T034, T035, T038 open: `tests/e2e/encrypted-storage.spec.ts` never
written). 000/001 predate the tasks convention. **003** and **004** have a spec and research but
no plan or tasks, yet their features (instructor improvements, PIN auth) are in the code, so
their implementation record is missing. Folder 002 does not exist.

## 6. Test, coverage, E2E and visual-regression status

**Unit (Vitest, jsdom, fake-indexeddb):** 831 tests, all green, ~20 s. Strong on
`services/auth`, `utils`, `components`; near-zero on `init/` and `enhancers/`. Console is noisy
with intentional `[ERROR]` logs from negative-path tests, which will hide a real error.

**Integration (Vitest, separate config):** 84 tests, green. Covers `enhancers` and `init`
reasonably; almost nothing in `components`.

**Coverage thresholds:** 80% on all four metrics in `vitest.config.ts`. Not evaluated in CI
(`ci.yml` runs `test:unit`/`test:integration`, uploads `coverage/lcov.info` to Codecov with
`if: always()`; the upload step succeeded on the last run but a Codecov token is not visible in
the workflow, so whether reports land is unknown). Both suites fail the thresholds locally.
Effective coverage gate: none.

**E2E (Playwright, Chromium, against Storybook stories on :6006):** 105 tests, all green,
1.6 min. Per-test timeout is 2 s. Not run in CI ("temporarily disabled" comment in `ci.yml`,
job body still present). 4 tests in `pin-authentication.spec.ts` are `test.skip` unless
`ENCRYPT_STORAGE=true`. The encrypted variant requires Storybook to be started with the flag.
Run here with Storybook started under `ENCRYPT_STORAGE=true`: 104 passed, 1 skipped, 0 failed,
1.5 min. So both storage modes pass end-to-end today; neither is exercised in CI.

**Visual regression (Chromatic):** configured in `ci.yml` (push to `main` only,
`continue-on-error: true`, `onlyChanged: true`) and in `.storybook/`. On the last `main` run
(2026-06-19, run 27829306417) the step reported success after 8 s; its log shows the Storybook
build failing on the orphan `qd-error-banner` story. So: no visual baseline has been captured
since before the June refactor, and whether `CHROMATIC_PROJECT_TOKEN` is even set cannot be
determined from the repo. `docs/CHROMATIC_SETUP.md` claims it works.

**PR previews:** `pr-preview.yml` builds Storybook with a warn-and-skip on failure, so the
Storybook half of each PR preview has been silently absent since June.

**Bundle:** 37.61 KB gzipped IIFE against a 40 KB budget, enforced in CI. 2.4 KB of headroom
is thin for a restart that adds features; the ESM build is 52.9 KB gzipped and unbudgeted.

## 7. Maintainer-documentation gap

What an incoming maintainer needs, and where it is today:

| Need | State | Where |
|---|---|---|
| Purpose, constraints, constitution | Exists | `CLAUDE.md`, `System_Requirements.md` |
| Repo map (what lives where, what is dead) | Partial | `CLAUDE.md` layers section; dead modules and duplicate config not mentioned anywhere |
| Setup, build, test, lint commands | Exists | `CLAUDE.md` Development Commands; Definition of Done |
| How to run E2E locally, incl. Storybook quirks | Partial | `CLAUDE.md` says auto-managed; sandbox needed `--ci --no-open`; encrypted variant undocumented |
| Config contract (hidden spans, DITA XSL) | Exists, with a hole | `CLAUDE.md` Constitution VII; second hash id undocumented |
| Data model and storage layout | Partial | `Contracts.md`, `CLAUDE.md`; object-store count wrong; obfuscation key derivation only in code |
| Event catalogue | Wrong | `Technical_Design.md` §19 and `ARCHITECTURE_FLOWS.md` disagree with code; no single list |
| CI, deploy, PR preview, release | Exists | `CLAUDE.md` GitHub Pages section; `docs/RELEASE.md` (never exercised) |
| Chromatic / visual testing | Wrong | `docs/CHROMATIC_SETUP.md` |
| Known issues / deferred work | Missing | No list anywhere; this report is the first |
| Which documents to trust | Missing | 13 root docs, no index; this report's §5 is the first classification |
| Decision log (why Lit, why obfuscation not encryption, why PIN) | Partial | Scattered across `specs/*/research.md` and `plan.md`; not linked from anywhere |
| Authoring guide for DITA content authors | Partial | `CLAUDE.md` Author Constraints; the runtime validator that would enforce them is unwired |

Verdict: the raw material for a maintainer guide exists, mostly in `CLAUDE.md` and `specs/`,
but it is written for an AI agent, has factual errors, and there is no known-issues list or
document index. A restart should produce a short `docs/MAINTAINERS.md` from this table rather
than another design document.

## 8. Recommended restart backlog

Ranked by risk. Effort: S (< half a day), M (1–2 days), L (more).

| # | Item | Why it matters | Risk | Effort |
|---|---|---|---|---|
| 1 | Delete or rewrite `stories/components/qd-error-banner.stories.ts`; remove `continue-on-error` from the Chromatic job | Restores Storybook build, PR-preview Storybook and visual regression; ends a false-green signal | H | S |
| 2 | Decide what "Erase All Data" must do, then wire `StorageService.clearAll()` (or document the current behaviour and rename the button) | Constitution VI promises complete erasure; instructors will believe cohort data is gone when it is not | H | S–M |
| 3 | Re-enable the E2E job in `ci.yml` (body is already written; add `--ci` to the Storybook command) | 105 passing tests currently guard nothing on PRs | H | S |
| 4 | Make coverage a real gate or delete the thresholds: run `test:coverage:*` in CI with thresholds set to today's numbers, ratchet up | Thresholds that never run and would fail are worse than none | M | S |
| 5 | Resolve the duplicate instructor-hash id (`#instructor.password.hash` vs `#qd-instructor-hash`) to one reader | Toolbar unlock cannot work in DITA output; two code paths for one secret | M | S |
| 6 | Confirm `CHROMATIC_PROJECT_TOKEN` exists; capture a fresh baseline after #1 | Visual regression has had no baseline since before the refactor | M | S |
| 7 | Close spec 009: write `tests/e2e/encrypted-storage.spec.ts` or formally drop T034/T035/T038 | Only open tasks in the repo; encrypted mode is otherwise untested end-to-end in CI | M | M |
| 8 | Re-baseline `Technical_Design.md` against §4, or retitle it "original design intent" and point readers to an as-built doc | 14 of 20 claims wrong; a formal review will read it as truth | M | M |
| 9 | Remove or wire the dead modules (`validation.ts`, `csv-export.ts`, `runtime-config.ts`, `qd-pin-create.ts`) | 900+ lines that mislead readers and skew coverage; `validation.ts` is the only path to author-error banners | M | S–M |
| 10 | Fix `CLAUDE.md` errors (phase status, `DEBUG_MODE`, store count, erase-all) and add a Known Issues section | It is the document agents and people actually read | M | S |
| 11 | Fix README status/phase text and the two dead links; align `VERSION` in `src/index.ts` with `package.json` | First thing a reviewer sees | M | S |
| 12 | Archive `POST_PHASE_7_REVIEW.md`, `CODE_REVIEW_REFACTORING_HOTSPOTS.md`, `docs/CODE_REDUCTION_PROPOSAL.md`, `docs/INSTRUCTOR_PASSWORD_IMPLEMENTATION.md` under `docs/history/`; merge the five `SECURITY_*.md` into one | Halves the root doc set; removes files that cite deleted code | L | S |
| 13 | Strip the numeric tolerance from the Detail column in `quiz-table-columns.ts` as the answer column is, or accept that it is visible in view-source | Constitution VIII is only partly honoured; low impact (tolerance, not the answer) | L | S |
| 14 | Add unit tests for `src/init/*` and `src/services/state-calculator.ts`; make `test:gaps` path-aware or move the 7 flat tests, then run it `--strict` in CI | Bootstrap and state calculation are the two least-covered critical paths | M | M |
| 15 | Write `docs/MAINTAINERS.md` from §7 and a document index from §5 | No maintainer-facing entry point exists | M | S |
| 16 | Backfill plan/tasks for specs 003 and 004, or mark them "implemented without plan" | Two shipped features have no implementation record | L | S |
| 17 | Exercise the release workflow once with a `v0.2.0` tag | Release automation has never run | L | S |
| 18 | Budget the ESM bundle or state it is unbudgeted; note IIFE headroom is 2.4 KB | Any new feature will hit the limit | L | S |

Trivial fixes applied in this consolidation PR: regenerated `docs/test-coverage-report.md`,
deleted the stray `temp-e2e/` folder, added a "superseded" banner to
`CODE_REVIEW_REFACTORING_HOTSPOTS.md`, and linked this report from `CLAUDE.md`.
