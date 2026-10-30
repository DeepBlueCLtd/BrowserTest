# Security

What the Sonar Quiz System (BrowserTest) actually does today, with the file that does it.
This page replaces the five generic `SECURITY_*.md` files from November 2025, which are
archived unchanged under `docs/history/` for reference only; they describe proposals, not
the code.

Everything below was checked against the source on the date of writing. Where the code falls
short of what a name or comment promises, that is stated.

## 1. Threat model

The bundle runs from `file://` URLs on air-gapped classroom machines. There is no server, no
network I/O, and no telemetry. All state lives in the student's browser (IndexedDB +
sessionStorage) on a machine the student physically controls.

Consequences:

- **Nothing in this system is secret from a determined user of the same machine.** Every
  control is client-side and can be bypassed by anyone willing to open DevTools, edit the HTML,
  or read the bundle. The controls exist to stop _casual_ cheating and _accidental_ disclosure.
- **The assets to protect**, in order: correct quiz answers (visible to instructors only),
  other students' answers and names, and the instructor role (which unlocks all of the above,
  CSV export, PIN reset, and erase-all).
- **Realistic attackers**: a curious student on a shared machine; a student who has seen the
  instructor password typed; a student who reads the published HTML from disk. Nation-state,
  supply-chain, and network attackers are out of scope by construction.

## 2. Configuration surface

Runtime configuration is read from hidden `<span>` elements that the Oxygen WebHelp transform
emits into every page (`dita/template/xslt/inc/customHeader.xsl`, lines 22–40). The reader is
`src/config/dom-config-reader.ts` (`CONFIG_IDS`):

| Span id                | Purpose                            | Security relevance                                                                |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| `#qd-instructor-hash`  | Instructor password hash           | The only credential in the system; visible in page source                         |
| `#qd-db-name`          | IndexedDB database name (required) | Namespaces all stored data                                                        |
| `#qd-title-selector`   | Selector for the publication title | The title is the Release ID, which keys storage _and_ derives the obfuscation key |
| `#qd-status-container` | Where to mount the UI              | none                                                                              |

## 3. Instructor password

Live path: `src/components/qd-instructor-login.ts` → `src/services/auth/instructor-auth.ts`.

- The plaintext is hashed with `crypto.subtle.digest('SHA-256')`, hex-encoded, and **truncated
  to the first 12 hex characters** (48 bits) so authors can paste it into an Oxygen dialog
  (`hashPassword`). Since SRD 013 (SEC-11) a publication may instead configure the full
  64-hex digest (`hashPasswordFull`), which `verifyInstructorPassword` then compares in full.
- The expected value is the text of `#qd-instructor-hash`, read at login time
  (`getExpectedInstructorHash`). If the span is missing or empty, instructor login is refused.
- Comparison uses the HMAC-based `constantTimeCompare` from `src/utils/security.ts`
  (`verifyInstructorPassword`), so verification time does not leak where the hashes differ.
- Failed attempts are rate limited. Both instructor paths use a `RateLimiter` with the same
  allowance as the student PIN (`PIN_CONSTANTS.MAX_ATTEMPTS`): two wrong passwords are free, the
  third starts an exponential lockout of 2/4/8/16/30 s. A correct password resets the counter.
- On success it creates a session with `serviceId: 'INSTRUCTOR'` and stores **the password the
  instructor typed** in `sessionStorage['qd/instructor']` (`startInstructorSession` in
  `src/services/auth/instructor-session.ts`). On every page load, bootstrap calls
  `restoreInstructorSession()`, which re-hashes the stored value and compares it with
  `#qd-instructor-hash` before any component asks `isInstructor()`. A value that does not verify
  is removed, along with any instructor `qd/session` (SRD 013 SEC-01, SEC-02).
- Until October 2026 the stored value was the string `'true'`, and a logged-out student could set
  it from DevTools, get the toolbar and answer key, and erase every student record. The review
  reproduced this; `tests/unit/services/auth/instructor-session.test.ts` and
  `tests/unit/init/bootstrap.test.ts` now start from that reproduction.
- **Trade-off:** while an instructor is logged in, their password sits in that tab's
  sessionStorage, readable in DevTools by anyone at the keyboard. It is cleared on logout, on the
  10-minute idle timeout and when the tab closes. Instructors should log out before leaving the
  machine. Forging the value without the password needs a preimage of the configured hash.
- **Destructive actions ask again** (SEC-03). "Erase All Data" and "Reset PIN" each need the
  instructor password typed at that moment, checked against `#qd-instructor-hash` (not against
  the stored value) and rate limited with the same policy (`confirmInstructorPassword`). Export
  CSV deliberately does not ask again (owner decision, SRD 013 Q3).

A second entry point exists: `src/components/qd-instructor/qd-instructor-unlock.ts`, the
toolbar unlock form. It now verifies through the same `instructor-auth.ts` helpers and the same
rate-limiting policy, so the two paths cannot disagree. It is in practice unreachable in DITA
output (`<qd-instructor>` renders the unlock form only while `unlocked` is false, but the element
is shown only when `isInstructor()` is already true), so the login modal is the path that matters.
Two defects here were fixed during the September 2026 consolidation: the component read a
different span, `#instructor.password.hash`, that the XSL never emitted (its reader,
`src/config/instructor-password.ts`, has been deleted), and it never recorded failed attempts,
so its rate limiter never engaged.

## 4. Student PIN

Spec: `specs/004-student-pin-auth/spec.md`. Code: `src/services/auth/auth-service.ts`,
`src/services/auth/pin-service.ts`, `src/services/auth/rate-limiter.ts`,
`src/types/contracts.ts` (`PIN_CONSTANTS`).

- PIN is exactly 4 digits (`PIN_LENGTH: 4`, `validatePinFormat`).
- Stored (since SRD 013 SEC-06) as PBKDF2-SHA-256 with a random 16-byte salt per student and
  600,000 iterations (`createPinCredential`), in `StudentRecord.pinHash` with `pinSalt`,
  `pinIterations` and `pinKdf: 'pbkdf2-sha256'`. One derivation takes roughly 130 ms in
  Chromium on a fast machine, so trying all 10,000 PINs for one student takes on the order of
  20 minutes rather than milliseconds, and the salt prevents one table covering every student.
  **This raises the effort; it does not make a 4-digit PIN secret** from someone holding the
  database.
- Records written before SRD 013 hold an unsalted SHA-256 digest. They still verify
  (`verifyStoredPin`), and the first successful login replaces the digest with a salted one and
  stamps the record schema 3 (SEC-07). `needsMigration()` compares with `PIN_SCHEMA_VERSION`
  (2), so the schema bump never sends PIN-bearing records back through PIN setup.
- Verification uses a constant-time XOR compare over the two hex strings
  (`pin-service.ts` `constantTimeCompare`).
- Lockout (`rate-limiter.ts`): `MAX_ATTEMPTS: 3`, then `LOCKOUT_MS: 30 * 1000` (30 s). Attempt
  state is stored in `sessionStorage` under `qd:pin-attempts:{serviceId}`, so it is per tab and
  disappears when the tab closes or sessionStorage is cleared. Successful login clears it.
- Identity is **claimed, not verified**: the first login for an unknown `serviceId` creates the
  record and sets the PIN (`auth-service.ts`, "New student" branch). Anyone who knows a service
  ID before its owner logs in owns that record.
- Instructor PIN reset (`src/services/pin-reset-service.ts`, `resetPin` in
  `src/services/storage/migration.ts`) sets `pinHash: ''` and appends a `PinResetEvent` to the
  `auditLog` object store. The next login for that ID, by whoever presents it, sets a new PIN
  (`!hasPinSet(existingStudent)` branch). Records from schema versions before PINs behave the
  same way on first login after upgrade.

## 5. Quiz answer hiding

Constitution VIII in `CLAUDE.md`; spec `specs/010-css-answer-hiding/spec.md`. Three layers, of
unequal strength:

1. **CSS, before JavaScript runs** (`dita/template/f13ldman.css` lines 583–600): columns 2
   and 3 of `.qd-quiz` (`td` and `th`) get `visibility: hidden`, with `.qd-quiz-interactive`
   and `.qd-quiz-instructor` overrides. This is purely cosmetic: the text is in the page and in
   view-source.
2. **DOM blanking of the Answer column (column index 1)** — `hideAnswerColumn` in
   `src/enhancers/quiz-table-columns.ts`. Order in `src/enhancers/quiz-table.ts`
   `enhanceQuizTable`: `parseQuizTable` (`src/services/quiz-parser.ts` reads
   `cells[1].textContent` into `correctAnswer`) → store in a module-level `WeakMap` → set each
   `tbody td[1].textContent = ''` and add `qd-hidden` (`display:none !important`, defined in
   `src/init/global-styles.ts`). After this the correct answer exists only in JS memory.
3. **DOM blanking of the Detail column (index 2)** — `hideDetailColumn` in the same module.
   Since September 2026 it also removes the cell content (MCQ option list or numeric tolerance),
   holding the original markup in a `WeakMap` keyed by cell so
   `restoreDetailColumn` can put it back on the instructor reveal path. Before that it only
   added a CSS class, so the tolerance was readable in DevTools.

Instructor reveal (`src/enhancers/instructor-answer-reveal.ts`) is the single place that writes
`correctAnswer` back into the DOM; it runs on `qd:login` with `role: 'instructor'` and on page
load when `qd/instructor` is `'true'`.

What the blanking does **not** do: the published `.html` files on disk contain every answer in
plain text. A student who opens the file in a text editor, disables JavaScript, or breaks on
`parseQuizTable` in the debugger reads them. Layer 2 defeats "inspect element after load" only.

## 6. Stored-data obfuscation

Spec: `specs/009-encrypt-stored-data/spec.md`. Code: `src/services/storage/obfuscation.ts`,
`src/services/storage/idb-codec.ts`, `src/config/feature-flags.ts`,
`src/services/storage/obfuscation-migration.ts`.

**This is obfuscation, not encryption.** The names `ENCRYPT_STORAGE`, `build:encrypted`, and
`isEncryptionEnabled()` are misleading and should be read as "obfuscate".

- Scheme (`encode`): `JSON.stringify` → UTF-8 bytes → XOR with a repeating key → base64 →
  prefix `OBF:`. `decode` reverses it and throws on bad base64/UTF-8/JSON.
- Key (`deriveKey`): the Release ID (the publication title text from the page) with each
  character replaced by its decimal char code, concatenated. The key is therefore derived from
  **public text on every page** and from nothing else. Anyone with the page and the bundle can
  decode every record in one line of JavaScript.
- Switch: `ENCRYPT_STORAGE` is a **build-time** constant injected by Vite
  (`vite.config.ts` `define: { __ENCRYPT_STORAGE__ }` from the `ENCRYPT_STORAGE=true` env var;
  `npm run build:encrypted`). The source default is `false`, but since SRD 013 (SEC-08) the
  builds that ship are obfuscated: `npm run build:dita` (the bundle copied into the Oxygen
  template) and the `release.yml` asset. `npm run build:dita:plain` is for development and the
  plain-storage E2E job. It cannot be changed per deployment without rebuilding.
- Scope: only values in the `students` object store go through `encodeForStore` /
  `decodeStoredValue`. `auditLog` entries (service ID, timestamps) are always stored plain.
  The `backups` store would also be plain, but `StorageService.backup()` has no callers, so it
  is empty in practice. sessionStorage (session, R/A/G cache including per-page answers,
  instructor flag) is never obfuscated.
- Format mismatch is fatal by design (FR-009): reading a plain record with the flag on, or
  vice versa, throws `StorageFormatError`; the login flow surfaces this as `needs-migration`
  and offers `qd-migration-dialog`, which runs `migrateObfuscation` in place.

What it buys: a student opening DevTools → Application → IndexedDB sees `OBF:...` strings
instead of names and answers. What it does not buy: confidentiality against anyone who reads
this page.

## 7. Data isolation, sessions, erase

- **Keys**: `qd/{release}/u{serviceId}` (`getStorageKey` in
  `src/services/storage/adapter-utils.ts`). Stores: `students`, `backups`, `auditLog`
  (`src/services/storage/idb-connection.ts`, `DB_VERSION = 3`). The database name comes from
  `#qd-db-name` and is required. Isolation between releases is by key prefix inside one
  database, not by browser origin; any script that can open the database sees all releases.
- **Session**: `SESSION_TIMEOUT_MS = 10 * 60 * 1000` (`src/types/contracts.ts`; 30 minutes
  until SRD 013 SEC-09, shortened because students share one machine), extended on activity by
  `SessionService.updateActivity` (`src/services/session.ts`). The timer now also starts for a
  login made on the current page. Expiry writes `qd:session-expired`, fires a
  `qd:session-expired` event and logs out; the login form then says the session ended (SEC-10).
  Logout removes `qd/session`, `qd/state`, `qd/instructor`, and `qd/instructor/showAnswers` from
  sessionStorage.
- **Erase all**: `src/components/qd-instructor/qd-instructor-manage.ts` requires the
  instructor to type `DELETE ALL DATA` and to re-enter the instructor password (SEC-03), then calls `StorageService.clearAll()` →
  `IndexedDBStorageAdapter.clearAll` (`src/services/storage/indexeddb.ts` line 215), which
  clears all three object stores in one read-write transaction, and then `clearQuizData()`
  (`src/utils/storage-helpers.ts`), which removes every sessionStorage key beginning with
  `qd/` or `qd:` — the latter covers PIN lockout entries (`qd:pin-attempts:*`), which were
  previously left behind. It does not delete the database itself or touch other open tabs.
- **Logging**: `src/utils/logger.ts` masks service IDs (`maskServiceId`: `RN2344` → `RN****`)
  in log output. PINs and passwords are never logged.

## 8. XSS surface

Lit templates auto-escape bindings, and `src/utils/dom-helpers.ts` plus
`src/enhancers/quiz-instructor-overlay.ts` use `textContent` for student-supplied text. The
exceptions, verified by grep:

- `src/components/qd-help-popup.ts` line 158 assigns `innerHTML` from
  `src/config/help-content.ts`, which is static author-controlled markup — acceptable.
- `src/components/qd-confirm-dialog.ts` renders `.message` with `unsafeHTML`, and
  `src/components/qd-pin-reset-dialog.ts` builds that message from the student's own name and
  service ID. Name validation (`src/utils/validation-helpers.ts`) checks only that the name is
  non-empty, so a student could register with markup and have it execute in the instructor's
  browser — stored XSS, same origin, able to read the database and set `qd/instructor`. Fixed in
  September 2026: both values now pass through `escapeHtml` (`src/utils/dom-helpers.ts`, unit
  tested in `tests/unit/utils/dom-helpers.test.ts`). `unsafeHTML` remains in the dialog, so any
  new caller must escape its own interpolations.
- CSV export (`src/components/qd-instructor/qd-instructor-export.ts` `escapeCSVField`) quotes
  fields containing `,`, `"`, or newline, and since September 2026 also prefixes a single quote
  to any field starting with `=`, `+`, `-`, `@`, tab or CR so a student name or free-text answer
  cannot become a live formula when the instructor opens the CSV in Excel or Sheets.

### Account enumeration

The login form asks storage whether a service ID already has an account, so it
can offer "Create" rather than a "Login" that cannot succeed
(`AuthService.isRegistered`). That answer is visible to anyone at the keyboard:
typing a service ID reveals whether it is registered for the current release.

This is accepted. The tool is an offline, single-machine classroom aid with no
accounts worth enumerating remotely, and the alternative — leaving a first-time
user staring at a disabled button — was a real usability failure. Anyone who can
type a service ID into the form can already open DevTools and read the whole
IndexedDB database, so the lookup discloses nothing that was otherwise protected.

## 9. Explicitly out of scope

- No network, no server, no accounts: nothing here authenticates a person, only a tab.
- No real cryptography at rest: SHA-256 is used for the instructor hash and PBKDF2 for PIN
  verifiers; there is no encryption and no key management.
- No integrity protection: IndexedDB and sessionStorage values can be edited freely; the only
  check is that obfuscated JSON still parses.
- No cross-tab messaging, no BroadcastChannel, no `.env` files, no build-time secrets. The
  instructor hash is deliberately in the published HTML so authors can change it per
  publication without a rebuild (Constitution VII).

## 10. Known limitations

1. The instructor session stores the instructor's password in that tab's sessionStorage while
   they are logged in (§3). Anyone at the keyboard of an unattended instructor tab can read it.
2. Instructor password: by default a 48-bit truncated hash, printed in page source. Comparison
   is constant-time and attempts are rate limited, but a 48-bit hash in public HTML is
   brute-forcible offline; treat the password as a speed bump, not a secret. A publication can
   configure the full 64-hex hash instead.
3. Student PINs are 4 digits. PBKDF2 with a per-student salt slows an offline guess to minutes
   per student, but cannot prevent it. Legacy unsalted hashes remain until each student next
   logs in. Lockout state is per tab and resets on reload of sessionStorage.
4. Service IDs are self-asserted; the first person to log in with an ID owns it, including
   after an instructor reset.
5. All answers are in the published HTML on disk (§5); DOM blanking only defeats
   "inspect element after load", not a text editor or a disabled-JavaScript reader.
6. Storage "encryption" is XOR with a key derived from the visible page title (§6). It is on in
   shipped builds since SRD 013 but off in plain development builds. Audit-log entries are never
   obfuscated.
7. `qd-confirm-dialog` still renders its message with `unsafeHTML`; the two known callers now
   escape their inputs, but the component itself is unsafe by default for future callers.
8. `ENCRYPT_STORAGE` is fixed at build time; a deployment cannot switch it without a rebuild
   and a migration of existing data.

## 11. Tests that cover this page

`tests/unit/instructor-auth.test.ts`, `tests/unit/services/auth/instructor-session.test.ts`,
`tests/unit/components/qd-pin-reset-dialog.test.ts`,
`tests/unit/components/qd-instructor/qd-instructor-manage.test.ts`,
`tests/unit/services/auth/pin-service.test.ts`, `tests/unit/services/storage/migration.test.ts`,
`tests/unit/services/auth/rate-limiter.test.ts`, `tests/unit/auth-service.test.ts`,
`tests/unit/services/storage/obfuscation.test.ts`,
`tests/unit/services/storage/obfuscation-migration.test.ts`,
`tests/integration/storage/encrypted-storage.test.ts`,
`tests/integration/instructor-answer-reveal.test.ts`, `tests/unit/enhancers/` (quiz table
column hiding), and the E2E flows `tests/e2e/workflows/pin-authentication.spec.ts` (four cases
skipped unless `ENCRYPT_STORAGE=true`) and `tests/e2e/encrypted-storage.spec.ts` (all skipped
unless `ENCRYPT_STORAGE=true`). `tests/unit/utils/security.test.ts` tests the unreachable path
in §3.

---

_Archived originals (Nov 2025, generic guidance, not project-specific):
`docs/history/SECURITY_BEST_PRACTICES.md`, `SECURITY_IMPLEMENTATION_GUIDE.md`,
`SECURITY_TEST_EXAMPLES.md`, `SECURITY_README.md`, `SECURITY_QUICK_REFERENCE.md`._
