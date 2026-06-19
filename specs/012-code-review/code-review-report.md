# Code Review Report: Refactoring Hot-Spots

**Created**: 2026-06-17
**Branch**: `claude/speckit-code-review-8dd0zw`
**Scope**: `src/**` — identify modules/blocks where (a) UI and business logic are too tightly intertwined, (b) business logic is several layers deep, (c) child components could be refactored out, (d) UI elements could become Lit components, (e) files exceed 400 lines.

## How to read this report

Each hot-spot is rated **HIGH / MEDIUM / LOW** by refactoring payoff (size + complexity reduction, risk removed, duplication eliminated). Line references are point-in-time against the current `main`-derived branch and should be re-confirmed before editing. The report is descriptive; the companion `spec.md` turns the prioritized findings into requirements.

---

## 1. Files over 400 lines (size hot-spots)

| File | Lines | Severity | Primary problem |
|------|-------|----------|-----------------|
| `src/components/qd-login.ts` | 983 | HIGH | Component is also the entire auth/PIN/migration/instructor pipeline; ~100-line duplicated method |
| `src/enhancers/quiz-table.ts` | 807 | HIGH | Parsing + persistence + DOM + instructor overlay fused; `innerHTML` XSS risk |
| `src/services/storage/indexeddb.ts` | 759 | HIGH | One class doing connection, migration, encryption, backups, audit log; ~150 lines of callback boilerplate |
| `src/enhancers/analysis-table.ts` | 637 | HIGH | Same fusion as quiz-table; pure logic + inline-CSS rendering embedded |
| `src/components/qd-migration-dialog.ts` | 519 | MEDIUM | Duplicated password hashing; large inline styles |
| `src/init/bootstrap.ts` | 490 | HIGH | "God bootstrap": CSS literal + orchestration + duplicated instructor answer-reveal business rules |
| `src/services/session.ts` | 443 | MEDIUM | Two concerns glued together (session lifecycle + pure cache math) |
| `src/types/contracts.ts` | 411 | LOW | Frozen contracts file; size expected, leave as-is |

Files 400–340 lines that are *structurally healthy* (no split required): `qd-status.ts` (354), `qd-instructor.ts` (380), `qd-pin-reset-dialog.ts` (389), `qd-pin-create.ts` (364), `validation.ts` (364).

---

## 2. HIGH-severity hot-spots

### 2.1 `qd-login.ts` (983 lines) — UI fused with the entire auth pipeline

- **Tight intertwining**: `handleStudentLogin` (L542–694) is a ~150-line event handler that performs form validation, DOM release extraction, lockout checks, raw config reads, storage init, student lookup, migration detection, PIN hashing/setup/verification, rate-limit recording, session creation, and 4 `CustomEvent` dispatches. This is a service masquerading as a UI handler.
- **Duplication (largest in the file)**: `retryLoginAfterMigration` (L731–829) is a near-verbatim ~100-line copy of `handleStudentLogin`'s success path (compare L584–666 vs L746–821).
- **Deep nesting**: `handleStudentLogin` reaches 4–5 levels (`try` → `if existingStudent` → migration/PIN branches → lockout check); mirrored in the retry method.
- **Embedded crypto**: `hashPassword` (L905–915) + `getExpectedHash` (L920–923) embed SHA-256 + 12-char truncation in the component — duplicated verbatim in `qd-migration-dialog.ts` `validatePassword` (L319–339).
- **Config bypass**: inline `document.getElementById(...).textContent.trim()` for DB-name/release appears 3+ times (L529–537, L573–579, L674–675, L740–741), bypassing the existing `readDOMConfig()` / `CONFIG_IDS` service.

**Recommended extractions**
1. `AuthService.loginStudent(...)` returning a discriminated union (`success | lockout | bad-pin | needs-migration`). Collapses both login paths into one, removes the ~100-line duplicate, flattens nesting. The component becomes a thin view mapping results → state.
2. Shared `instructor-auth` helper for password hashing (also used by migration dialog).
3. Route all config reads through `readDOMConfig()`.
4. Optional `qd-lockout-banner` reusable component owning its own countdown interval (currently `lockoutInterval` / `startLockoutCountdown` L845–862).

**Expected outcome**: file drops well below 400 lines and becomes a presentational component.

### 2.2 `quiz-table.ts` (807 lines) — persistence + DOM + instructor overlay fused; XSS risk

- **Security — `innerHTML` injection (highest priority)**: the student-answer overlay (L771–788, esp. L779–783) builds markup via `innerHTML` with unescaped student-controlled `sa.name` / `sa.answer`. This is an XSS risk and contrary to the spirit of Constitution VIII. The analysis enhancer does the equivalent correctly with `textContent` — the quiz path regressed.
- **Tight intertwining**: `saveAnswer` (L465–558) is a ~90-line function doing session lookup, validation, record construction, IndexedDB load/mutate/save, cache rebuild + sessionStorage write, DOM cell selection + validation styling, and two event emissions.
- **Long/nested function**: `enhanceInteractive` (L188–364) is 176 lines interleaving cache bootstrap, row iteration + input injection, instructor-listener wiring, and login/logout UI-reset logic (with an inline `resetUIState` closure L313–335).

**Recommended extractions**
- `<qd-student-answers>` Lit component for the overlay (auto-escapes, removes XSS).
- `quiz-answer-persistence.ts` for `handleAnswerInput` + `saveAnswer` + validation styling.
- `quiz-table-columns.ts` for the pure column show/hide helpers (`removeColgroup`/`hideAnswerColumn`/`showAnswerColumn`/`hideDetailColumn`, L580–662).
- `quiz-input-factory.ts` for `createQuestionInput` (L378–420).
- `quiz-instructor-overlay.ts` for show/hide student answers (L719–806).

### 2.3 `analysis-table.ts` (637 lines) — same fusion + inline-CSS rendering

- **Tight intertwining**: `saveCellData` (L284–363) hand-rolls get-or-create + mutate persistence that has no `updateRecordWithAnalysis` equivalent on `storage-service` (the quiz path has `updateRecordWithAnswer`).
- **Pure logic in a DOM file**: `groupEntriesByCell` (L394–424) and `sortByTimestamp` (L432–438) are pure and already `export`ed — they belong in a `services/analysis-display.ts` (parallel to existing `services/answer-display.ts`).
- **Inline CSS strings (Shadow-DOM violation)**: `createStudentEntriesDisplay` (L446–490) sets `element.style.cssText = 'color:#9ca3af;…'` with hard-coded hex colors (L454, L466, L475, L479, L487), contrary to the "Shadow DOM for isolation, no global CSS pollution" constraint.

**Recommended extractions**
- `services/analysis-display.ts` (pure grouping/sorting).
- `analysis-persistence.ts` and/or add `updateRecordWithAnalysis` to `storage-service.ts`.
- `<qd-student-entries>` Lit component (styles in `static styles`), potentially shared with the quiz overlay.

### 2.4 `indexeddb.ts` (759 lines) — one class, five responsibilities

- **Mixed responsibilities**: connection lifecycle + schema migration (`init` L84–241), encryption/obfuscation (`decodeStoredValue` L314–355, encrypted scan L466–519 — the adapter knows about `ENCRYPT_STORAGE`/`deriveKey`), backups (`backup` L622–666), audit log (`saveAuditEvent` L673–699), and singleton management (L715–759).
- **Deep nesting / recursion**: `init` (157 lines) has two recursive "delete DB and retry" paths (timeout L108–136, corruption L161–191) of near-identical structure. `clearAll` (L526–612) hand-rolls a 3-way completion barrier (~86 lines).
- **Pervasive boilerplate**: every method repeats the `new Promise(... tx.transaction ... request.onsuccess/onerror ...)` scaffold — `getStudent`, `saveStudent`, `getStudentsByRelease`, `getStudentsByReleaseEncrypted`, `backup`, `saveAuditEvent`. A `promisifyRequest<T>` + `runTransaction(store, mode, fn)` helper removes >150 lines.

**Recommended extractions**
- `promisifyRequest` / `runTransaction` helpers.
- `connection/migration` opener module (owns `DB_VERSION`, `onupgradeneeded`, recovery).
- `codec` layer so the adapter is unaware of encryption policy.
- `BackupRepository` and `AuditLogRepository` sub-modules.
- Singleton factory module.

### 2.5 `bootstrap.ts` (490 lines) — god bootstrap with duplicated security logic

- **CSS literal in init code**: `injectGlobalStyles` (L26–132) is a ~106-line CSS string (21% of the file) — move to `init/global-styles.ts`.
- **Duplicated near-identical helpers**: `enhanceAllQuizTables` / `enhanceAllAnalysisTables` / `enhanceHomeBadgesIfPresent` (L236–306) collapse into one parameterized helper.
- **Embedded + DUPLICATED business rule (security-sensitive)**: `revealQuizAnswersForInstructor` (L313–376) is almost verbatim duplicated by `event-coordinator.ts` `upgradeTablesAfterLogin`'s instructor branch (L155–201). Both unhide columns 2/3 and re-inject `question.correctAnswer` into the DOM. This answer-reveal logic must live in **one** shared enhancer function.
- **pageId-from-URL parsing triplicated**: L314–317, L422–424 here + `event-coordinator.ts` L138–141 → extract `getPageIdFromUrl()` util.

---

## 3. MEDIUM-severity hot-spots

### 3.1 `event-coordinator.ts` (339 lines) — event router doing business logic
- `upgradeTablesAfterLogin` (L137–221, ~84 lines) parses URL, branches on instructor mode, performs the duplicated answer-reveal DOM manipulation (L155–200), and upgrades tables — far above the "just route events" altitude of the rest of the class.
- The inline login-handler body (`registerLoginHandlers` L80–132) does IndexedDB load/save + cache building. Extract to storage/session layer so the coordinator only dispatches.

### 3.2 `session.ts` (443 lines) — two modules glued together
- `SessionService` class (L25–254) = session lifecycle; free functions `buildCacheFromRecord` / `buildPageCache` / `registerPageQuestions` / `updateCacheWithAnswer` (L256–420) = pure cache math already consumed independently by `storage-service.ts`. Split the cache utilities into `session-cache.ts` (drops the file under 300 lines).
- Magic key `'qd/instructor/showAnswers'` (L125) is repeated in `bootstrap.ts` (L369) and `event-coordinator.ts` (L196) — promote to `STORAGE_KEYS`.

### 3.3 `qd-migration-dialog.ts` (519 lines)
- `validatePassword` (L319–339) duplicates `qd-login`'s SHA-256 check → shared `instructor-auth` helper.
- `runMigration` (L344–372) computes migration `direction` from `ENCRYPT_STORAGE` — that policy belongs in a `migrationService.run(...)`.
- ~165 lines are `static styles`; common button/input/error/spinner styles should move into the existing `shared-styles.ts`. Candidate `qd-spinner` reusable element.

### 3.4 `qd-instructor.ts` (380 lines) — duplicated load routine
- `loadStudents` logic is copy-pasted 4× (L149, L179, L221, L273): read session → `getStudentsByRelease` → set `this.students` → catch. Extract one `refreshStudents()`.

### 3.5 `qd-pin-reset-dialog.ts` (389 lines)
- `executeReset` (L243–299) embeds storage init + `resetPin` + `saveStudent` + audit-log construction (`crypto.randomUUID()` L260–267) in the dialog → `pinResetService.reset(student)`.
- The student-search-table (L318–360) + `filteredStudents` getter (L170–178) → reusable `qd-student-table` / `qd-student-picker` (also usable by scores/export).

---

## 4. LOW-severity / leave-as-is

- `home-badges.ts` (239): cleanest enhancer; converting badges to Lit would break progressive enhancement. Only worthwhile fix: a single `clearBadges(link)` helper (loop duplicated at L51–53, L101–105, L157–160).
- `qd-status.ts` (354): healthy; minor — move `calculatePercentage` into `calculation-helpers.ts`.
- `qd-pin-create.ts` (364): clean; adopt the shared `qd-modal` base instead of hand-rolled overlay; use shared `sanitizePinInput`.
- `validation.ts` (364): well-factored pure predicates; optional `validateQuestionRow` extraction only.
- `storage-service.ts` (283): thin coordinator; extract `createEmptyStudentRecord(session)` (duplicated at L74–84 and L91–101).
- `contracts.ts` (411): frozen contracts — do not modify without version bump/migration.

---

## 5. Cross-cutting themes (fix once, benefit everywhere)

1. **Persist-then-style-DOM-then-emit duplicated** in `saveAnswer` (quiz) and `saveCellData` (analysis) → shared `persistAndNotify(record, { onSavedDom, events })`.
2. **Instructor answer-reveal logic duplicated** across `bootstrap.ts` and `event-coordinator.ts` (security-sensitive) → one shared enhancer function.
3. **DOM config reads bypass `readDOMConfig()`** in `qd-login`, `qd-pin-reset-dialog`, `qd-migration-dialog` → route through `CONFIG_IDS`.
4. **Instructor-password SHA-256 hashing duplicated** in `qd-login` + `qd-migration-dialog` → shared `instructor-auth`.
5. **Magic strings** (`'qd/instructor/showAnswers'`) and **pageId-from-URL parsing** repeated 3× each → `STORAGE_KEYS` + `getPageIdFromUrl()`.
6. **Shared styles** (`button.primary`, `.error-message`, `.button-row`, spinner, modal overlay) copy-pasted across dialogs → consolidate into `shared-styles.ts`.
7. **Session-state checks** (`updateVisibility` reading session/instructor flags) re-implemented in `qd-login`, `qd-status`, `qd-instructor` → shared `isStudentLoggedIn()` / `isInstructor()`.

---

## 6. Recommended sequencing (lowest risk → highest payoff)

1. **Quick, safe wins**: shared constants (`STORAGE_KEYS`), `getPageIdFromUrl()`, `clearBadges()`, `createEmptyStudentRecord()`, consolidate styles. No behavior change.
2. **Fix the `innerHTML` XSS** in `quiz-table.ts` (security; small change).
3. **De-duplicate the instructor answer-reveal logic** into one shared enhancer (removes a security-sensitive fork).
4. **Extract pure logic & helpers**: `analysis-display.ts`, `promisifyRequest`/`runTransaction`, `instructor-auth`, route config through `readDOMConfig()`.
5. **Extract services**: `AuthService` (from `qd-login`), `pinResetService`, `updateRecordWithAnalysis`.
6. **Split large files**: decompose `indexeddb.ts`, `quiz-table.ts`, `analysis-table.ts`, `bootstrap.ts`, `session.ts` into the modules above.
7. **Extract reusable Lit components**: `<qd-student-answers>` / `<qd-student-entries>`, `qd-student-table`, `qd-spinner`, `qd-lockout-banner`; adopt `qd-modal` base in `qd-pin-create`.

Each step should keep tests green per the Definition of Done (typecheck, lint, unit/integration, format, build, <40KB bundle). Refactors must preserve behavior — TDD: characterize current behavior with tests before moving logic.

---

## 7. Resolution (post-refactor — final state)

All findings above have been implemented behavior-preservingly (the only sanctioned behavior change is the quiz instructor-overlay `innerHTML` → `textContent` XSS fix). Final line counts for the former hot-spots:

| File | Before | After | Outcome |
|------|-------:|------:|---------|
| `src/components/qd-login.ts` | 983 | 395 | Presentational view over `AuthService`; styles → `qd-login.styles.ts` |
| `src/enhancers/quiz-table.ts` | 807 | 399 | Split → `quiz-table-columns`, `quiz-input-factory`, `quiz-answer-persistence`, `quiz-instructor-overlay` |
| `src/services/storage/indexeddb.ts` | 759 | 308 | Thin coordinator → `idb-connection`, `idb-helpers`, `idb-codec`, `backup-repository`, `audit-log-repository` |
| `src/enhancers/analysis-table.ts` | 637 | 301 | Split → `analysis-display`, `analysis-persistence`, `analysis-instructor-overlay` |
| `src/components/qd-migration-dialog.ts` | 519 | 344 | Styles extracted; uses shared `instructor-auth` + `qd-spinner` |
| `src/init/bootstrap.ts` | 490 | 321 | CSS literal → `global-styles.ts`; parameterized table enhancement |
| `src/services/session.ts` | 443 | 269 | Cache math → `session-cache.ts` |
| `src/init/event-coordinator.ts` | 339 | 216 | Reduced to a pure event router |

**Success criteria**:
- **SC-002**: `find src -name '*.ts' | xargs wc -l | awk '$1>400'` returns only the frozen `src/types/contracts.ts` (411). ✅
- **SC-003**: no enhancer overlay renders student data via `innerHTML`; quiz/analysis overlays are backed by the auto-escaped `<qd-student-answers>` / `<qd-student-entries>` Lit components. ✅
- **SC-005**: full Definition of Done green (831 unit + 84 integration tests); IIFE bundle 37.6 KB gzip (≤40 KB limit, +0.9 KB vs the 36.7 KB baseline from the four new reusable Lit components). ✅

Reusable components added: `<qd-student-answers>`, `<qd-student-entries>`, `<qd-student-table>`, `<qd-spinner>`. New shared helpers: `session-state.ts`, `persist-and-notify.ts`, `auth-service.ts`, `instructor-auth.ts`, `pin-reset-service.ts`, `page-id.ts`.
