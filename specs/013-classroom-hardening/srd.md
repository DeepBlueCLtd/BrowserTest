# SRD 013 — Classroom Hardening and Review Remediation

| | |
|---|---|
| Status | Implemented 2026-10-30 (WP1–WP5, one PR); see §10 for deviations. WP3 output awaits an Oxygen rebuild |
| Date | 2026-10-30 |
| Baseline | `main` at `85a7203` (bundle 39.77 KB gz, schema v2, DB v3) |
| Parent requirements | [`System_Requirements.md`](../../System_Requirements.md) |
| Source | Hands-on product review of the DITA demo, 2026-10-30 (student and instructor journeys, axe-core scan) |

## 1. Purpose and scope

This document sets the requirements for a package of changes to the Sonar Quiz System. The changes
come from the October 2026 product review and three owner decisions recorded in §2.2.

The package has five work packages, delivered in this order:

| WP | Title | Why |
|---|---|---|
| WP1 | Shared-machine security | Any student can gain instructor powers and erase the class's data |
| WP2 | Usability and accessibility | Quiz controls fail the stated WCAG 2.1 AA target; several screens confuse |
| WP3 | Answer exposure | Answers are in the published HTML and were visible through full-text search |
| WP4 | Analysis capture | Free-text analysis work never reaches the CSV, the scores view or page badges |
| WP5 | Scoring | Scores keep only the final answer after unlimited retries and have no stable denominator |

Each work package is expected to become its own `plan.md` / `tasks.md` and pull request. This SRD is
the shared requirements baseline for all five.

**Out of scope:** a server or network component; cross-tab sync; making cheating impossible on a
machine the student controls (see §2.3); per-student machines with CSV merging.

## 2. Context

### 2.1 Deployment

- Content is authored in DITA, published by Oxygen XML (WebHelp Responsive) with the
  `dita/template/f13ldMan-CSA.opt` publishing template, and run from local disk over `file://`.
- The runtime is the `sonar-quiz.iife.js` bundle, configured by hidden `<span>` elements that
  `dita/template/xslt/inc/customHeader.xsl` emits.
- All data lives in one browser profile: IndexedDB (`students`, `backups`, `auditLog`) and
  sessionStorage.

### 2.2 Owner decisions (2026-10-30)

| # | Decision | Consequence for this SRD |
|---|---|---|
| D1 | **Students share the instructor's machine.** | Every student record is in one browser. Instructor views see the whole class, so no CSV merging is needed. Protecting students and instructor from one another becomes the top priority (WP1). |
| D2 | **Bundle size is not a concern**, because content runs from local disk. | The 40 KB gzip ceiling (Constitution V) is raised (NFR-01). No requirement here is traded off against size. |
| D3 | **Full-text search is turned off.** Testing content does not need it. | ANS-01. Search was the easiest route to the answers. |

### 2.3 Threat model

The model in [`docs/SECURITY.md`](../../docs/SECURITY.md) §1 stands. The realistic attacker is a
curious student at the shared machine, possibly with DevTools open. Every control here is
client-side and can be defeated by someone determined enough. The aim is to raise the effort
required and to prevent accidental or casual damage. Requirements that cannot reach a stronger
guarantee say so.

### 2.4 Evidence behind the requirements

Each item was reproduced in headless Chromium against `dita-demo/` built from the baseline.

| Ref | Observed |
|---|---|
| R0 | A logged-out student ran `sessionStorage.setItem('qd/instructor','true')` and reloaded. The instructor toolbar and the answer key appeared without a password. "Erase All Data" then deleted every student record. The login form also rendered on top of the instructor toolbar. |
| R0b | `pinHash` is plain SHA-256 of the 4-digit PIN (the stored hash for `1111` equals `sha256("1111")`). Release builds store data unobfuscated. A session left open is inherited by the next student for up to 30 minutes. |
| R1 | Answers turn red or green as soon as they are chosen and can then be changed. A scripted student reached 5/5 in 8 guesses. The record keeps only the last answer. |
| R2 | The student panel read 3/11, then 3/13, then 3/11 for the same data, depending on the page. The instructor score divides by answered questions, so one correct answer shows as 100%. |
| R3 | Analysis entries are missing from the CSV and the scores view. A page with analysis entries keeps a red ("not started") badge. |
| R4 | axe-core reports a critical `select-name` violation on every quiz control. Correctness is shown by colour alone. Analysis cells are `contenteditable` with no role or label. |
| R5 | Dialogs built on `qd-confirm-dialog` render unstyled, because `qd-modal` moves itself to `document.body` and leaves the parent's shadow styles behind. "PIN Stored" shows an empty, unlabelled button. |
| R6 | Numeric inputs accept and save "abc" and "-5" as wrong attempts. The input column keeps the author's header ("Correct Value"). |
| R7 | At 768 px wide, the status panel runs off-screen and hides Logout. |
| R8 | Logged-out quiz pages show only questions, with no prompt to log in. |
| R9 | The WebHelp search snippet for "beam width" shows "…sonar? 15 2", which is the answer and its tolerance. With JavaScript off, CSS hides the answers on screen, but they remain in view-source. |
| R10 | The "Erase All Data" dialog ignores Escape. The help text gives red two meanings. Login validation shows one error at a time and does not mark the faulty field. |

## 3. Conventions

- **Priority:** MUST = required for the work package to close. SHOULD = expected unless the plan
  records a reason. COULD = do if cheap.
- **Verification:** T = automated test (unit, integration or Playwright E2E). I = inspection of
  code or output. D = demonstration in the DITA demo.
- Requirement IDs are stable. Withdrawn requirements keep their ID and are marked withdrawn.

## 4. Requirements

### WP1 — Shared-machine security

| ID | Requirement | Pri | Ver | Ref |
|---|---|---|---|---|
| SEC-01 | Instructor mode MUST be granted only after the runtime has checked, in the current page load, a secret that hashes to the configured `#qd-instructor-hash`. A value that can be written without knowing the password, such as a constant flag in sessionStorage, MUST NOT grant instructor mode. | MUST | T | R0 |
| SEC-02 | If stored instructor state fails the SEC-01 check on page load, the runtime MUST clear it and show the student login form. | MUST | T | R0 |
| SEC-03 | "Erase All Data" and "Reset PIN" MUST ask for the instructor password at the moment of the action, checked against `#qd-instructor-hash` and subject to the existing instructor rate limiter. The typed "DELETE ALL DATA" confirmation stays. | MUST | T | R0 |
| SEC-04 | *Withdrawn (owner, Q3).* Export CSV does not ask for the password again. It relies on SEC-01 to keep students out of instructor mode. | — | — | R0 |
| SEC-05 | The login form and the instructor panel MUST never render at the same time. | MUST | T | R0 |
| SEC-06 | Student PINs MUST be stored as PBKDF2-SHA-256 (WebCrypto) with a random 16-byte salt per student. The iteration count MUST make one derivation take at least 100 ms on the reference classroom machine, and MUST be stored with the hash. | MUST | T | R0b |
| SEC-07 | Records with a legacy unsalted `pinHash` MUST still verify. On the next successful login the PIN MUST be re-derived under SEC-06 and the legacy hash removed. | MUST | T | R0b |
| SEC-08 | Release builds (`release.yml`, `build:dita`) MUST enable storage obfuscation (`ENCRYPT_STORAGE=true`). Existing plain data MUST migrate through the existing migration dialog on first load. | MUST | T, I | R0b |
| SEC-09 | The student idle timeout MUST be reduced from 30 minutes to 10 minutes (owner, Q1). | MUST | T | R0b |
| SEC-10 | When a session ends through the idle timeout, the UI MUST say so ("Your session ended after 10 minutes without activity. Log in again to continue.") rather than silently showing the login form. | MUST | T | R0b |
| SEC-11 | The runtime SHOULD accept a full-length (64-hex) instructor hash as well as the 12-hex form, so publications can opt into a stronger hash. | SHOULD | T | §2.3 |
| SEC-12 | `docs/SECURITY.md` §3 (instructor password), §4 (student PIN), §6 (obfuscation), §7 (sessions and erase) and §10 (known limitations) MUST be updated to describe the new behaviour and its remaining limits. | MUST | I | — |

**Accepted limit.** A 4-digit PIN has 10,000 values. Anyone holding the database can still brute-force
it. SEC-06 raises this from milliseconds to tens of minutes per PIN, and SEC-08 keeps the hash out of
plain view. It does not make PINs secret.

**Design note (non-binding).** One way to meet SEC-01 is to keep the instructor password in
sessionStorage for the tab and re-hash it on each page load. Forging it then needs a preimage of the
configured hash. The plan must weigh this against prompting for the password on every page.

### WP2 — Usability and accessibility

| ID | Requirement | Pri | Ver | Ref |
|---|---|---|---|---|
| A11Y-01 | Every quiz input (`select`, numeric `input`) MUST have an accessible name equal to its question text, for example via `aria-labelledby` pointing at the question cell. | MUST | T | R4 |
| A11Y-02 | Correct and incorrect answers MUST be shown by a non-colour cue (an icon plus visually hidden text "Correct" or "Incorrect"). The result MUST be announced through a polite live region. | MUST | T | R4 |
| A11Y-03 | Interactive analysis cells MUST have `role="textbox"`, `aria-multiline="true"` and an accessible name taken from the row header cell. | MUST | T | R4 |
| A11Y-04 | An automated axe-core check in the E2E suite MUST report zero critical and zero serious WCAG 2.1 A/AA violations on the quiz, numeric, analysis and index pages, logged out, as a student and as an instructor. axe-core is a dev dependency only. | MUST | T | R4 |
| UX-01 | All dialogs MUST render with their intended styles when `qd-modal` is moved to `document.body`. A dialog MUST NOT render a button with an empty label. | MUST | T | R5 |
| UX-02 | The "PIN Stored" dialog MUST be removed. The PIN confirmation step and the status panel already tell the student the PIN was accepted (owner, Q4). | MUST | T | R5 |
| UX-03 | Numeric answers MUST be validated before saving: an optional sign, digits and an optional decimal point. Invalid input MUST NOT be saved or counted, and MUST show an inline message ("Enter a number, for example 1500"). The input SHOULD use `inputmode="decimal"`. | MUST | T | R6 |
| UX-04 | When a quiz table becomes interactive, the student input column header MUST read "Your answer", whatever the author's header says. The author's header MUST be restored in instructor reveal. | MUST | T | R6 |
| UX-05 | When no one is logged in, each `qd-quiz` table MUST be preceded by a notice: "Log in at the top of the page to answer these questions." | MUST | T | R8 |
| UX-06 | The status panel MUST be fully visible and usable, Logout included, at viewport widths from 768 px upward. | MUST | T | R7 |
| UX-07 | The "Erase All Data" dialog MUST close on Escape, like the other dialogs. | MUST | T | R10 |
| UX-08 | In the instructor toolbar, destructive actions (Reset PINs, Erase All Data) SHOULD be grouped apart from routine actions and styled as secondary until confirmed. | SHOULD | D | R10 |
| UX-09 | Help text MUST give each status colour one meaning. Red, amber and green for page state MUST be described exactly as the state calculator defines them. | MUST | I | R10 |
| UX-10 | Login validation MUST report every invalid field at once and mark each with `aria-invalid="true"` and a visible error style. | MUST | T | R10 |
| UX-11 | The header height SHOULD stay stable across the logged-out, PIN-confirm and logged-in states. | SHOULD | D | R10 |

### WP3 — Answer exposure

| ID | Requirement | Pri | Ver | Ref |
|---|---|---|---|---|
| ANS-01 | The publishing template MUST NOT render a search box. Remove `<whc:webhelp_search_input>` from `page-templates/header.xml`. | MUST | I, D | D3, R9 |
| ANS-02 | The search page MUST NOT list results. Remove `<whc:webhelp_search_results>` from `page-templates/wt_search.html`, or replace it with a notice that search is turned off. | MUST | I, D | D3, R9 |
| ANS-03 | The published output SHOULD NOT contain the WebHelp search index (`oxygen-webhelp/app/search/index/`). If Oxygen offers no setting to stop it being built, the packaging step SHOULD delete it. | SHOULD | I | R9 |
| ANS-04 | At publish time, the Answer cell of every `qd-quiz` table MUST be encoded. So MUST a Detail cell that holds a numeric tolerance. MCQ option lists in the Detail cell MUST stay plain, because students see them anyway. Encoding runs in `xslt/customTopicPage.xsl` at the existing `com.oxygenxml.webhelp.xsl.dita2webhelp` extension point. | MUST | T, I | R9 |
| ANS-05 | The encoding MUST be a keyed substitution that maps every character of the answer alphabet (digits, `-`, `+`, `.`) to a letter, so that encoded values do not read as numbers. ROT13 MUST NOT be used, because it leaves digits unchanged. | MUST | T | R9 |
| ANS-06 | The key MUST be a publishing-template parameter (`qd.answer.key`) and MUST reach the runtime through a new hidden config span, `#qd-answer-key`. | MUST | T, I | — |
| ANS-07 | An answer containing characters outside the alphabet SHOULD stop the build with an `xsl:message` naming the topic, rather than publishing it partly in plain text. | SHOULD | I | — |
| ANS-08 | Encoded values MUST be marked. *As built: each value carries a `qd1:` prefix rather than the table a `data-qd-enc` attribute (see §10).* The runtime MUST decode marked values before parsing and MUST parse unmarked tables as today, so older publications keep working. | MUST | T | — |
| ANS-09 | If a table is marked encoded but no key is present, or the version is unknown, the runtime MUST leave that table un-enhanced and log an error. It MUST NOT display undecoded values as answers. | MUST | T | — |
| ANS-10 | A repo script SHOULD check a published output folder and fail if any plaintext answer from the source DITA appears in an HTML or JS file. | SHOULD | T | R9 |
| ANS-11 | `CLAUDE.md` (Constitution VIII and the Quiz Tables section) MUST stop claiming that answer removal "prevents view-source inspection". It and `docs/SECURITY.md` §5 MUST describe the encoding and its limit: obfuscation with the key in the page. | MUST | I | R9 |

**Dependency.** ANS-01 to ANS-07 change the Oxygen template. The owner rebuilds in Oxygen (Q7), so the WP3 pull request MUST include a rebuild checklist. `dita-demo/` must then be regenerated
in Oxygen and committed (`npm run update-dita-demo`). This cannot be done in CI.

### WP4 — Analysis capture

| ID | Requirement | Pri | Ver | Ref |
|---|---|---|---|---|
| ANA-01 | The CSV export MUST include one row per non-empty analysis cell. It uses the existing columns. Question Index holds the row label, or the cell key if no label is stored. Answer holds the cell text, Success is empty, and Timestamp is the table's `lastEdited`. | MUST | T | R3 |
| ANA-02 | The CSV MUST gain a final column, `Kind`, with the value `quiz` or `analysis`. Existing columns MUST keep their order and position, so current consumers keep working. | MUST | T | R3 |
| ANA-03 | When a cell is saved, its row label (the row header text) SHOULD be stored alongside its content, so exports and instructor views can name it. This is an optional field on `AnalysisData`. | SHOULD | T | R3 |
| ANA-04 | A page with at least one non-empty analysis cell MUST NOT have the state `unstarted`. It is `complete` when every interactive cell is non-empty and any quiz on the page is complete. Otherwise it is `incomplete` (owner, Q5). | MUST | T | R3 |
| ANA-05 | The instructor scores view MUST show, per student and page, how many analysis cells are filled out of how many exist (for example "2 of 6 cells"). | MUST | T | R3 |
| ANA-06 | Analysis cells MUST NOT count as quiz questions in any answered, correct or total figure. | MUST | T | R2 |

### WP5 — Scoring

Retries stay allowed. The original spec frames quizzes as self-assessment (`specs/000` user story 1),
and the owner confirmed it (Q2). The change is to what gets recorded and shown.

| ID | Requirement | Pri | Ver | Ref |
|---|---|---|---|---|
| SCO-01 | Each quiz answer MUST record the number of attempts and whether the first attempt was correct, as optional fields on `AnswerRecord`. | MUST | T | R1 |
| SCO-02 | The student status panel MUST show "answered" and "correct" as separate figures. Both MUST be computed from the stored record, so they do not change with the page being viewed. | MUST | T | R2 |
| SCO-03 | If the publication's total question count is known (SCO-05), the panel MUST also show it, for example "12 of 40 answered · 9 correct". If unknown, it MUST NOT show a total. | MUST | T | R2 |
| SCO-04 | The instructor scores view and the CSV MUST show, per student, the number answered, correct, and correct at first attempt. Any percentage MUST state its base ("75% of answered"). | MUST | T | R1, R2 |
| SCO-05 | The publishing template SHOULD emit the publication's total quiz-question count in a new hidden config span, `#qd-question-total`. The plan MUST choose a mechanism that works within the Oxygen pipeline. | SHOULD | I, T | R2 |
| SCO-06 | The CSV MUST gain the final columns `Attempts` and `First Attempt Correct`, after `Kind` (ANA-02). | MUST | T | R1 |
| SCO-07 | Records written before SCO-01 MUST display "–" for attempts and first-attempt correctness, not a guessed value. | MUST | T | — |

## 5. Non-functional requirements

| ID | Requirement | Pri | Ver |
|---|---|---|---|
| NFR-01 | The IIFE bundle ceiling in `scripts/check-bundle-size.js` and CI MUST be raised from 40 KB to 100 KB gzip, and Constitution V in `CLAUDE.md` amended to match. A ceiling stays in place to catch an accidentally bundled dependency. | MUST | I, T |
| NFR-02 | All features MUST keep working offline from `file://` in Chrome/Edge 96+ and Firefox 102+, with no network access (Constitution I). | MUST | T |
| NFR-03 | A save MUST still complete in under 200 ms, excluding the PBKDF2 derivation at login (SEC-06). | MUST | T |
| NFR-04 | Pages MUST still work with JavaScript disabled: content is readable and answers are not shown (Constitution II). | MUST | D |
| NFR-05 | Each work package MUST meet the Definition of Done in `CLAUDE.md` (typecheck, lint, unit, integration, format, build, E2E) and follow its TDD workflow. | MUST | T |
| NFR-06 | The coverage and test-gap ratchets in CI MUST NOT be lowered. | MUST | T |

## 6. Data and contract changes

`src/types/contracts.ts` is frozen without a version bump and migration (`CLAUDE.md`). This package
needs one bump, from `SCHEMA_VERSION` 2 to 3, shared by WP1, WP4 and WP5.

| Contract | Change | Req |
|---|---|---|
| `StudentRecord` | Add `pinSalt?: string`, `pinIterations?: number`, `pinKdf?: 'pbkdf2-sha256'`. `pinHash` keeps its name and holds the derived key once upgraded. | SEC-06, SEC-07 |
| `AnswerRecord` | Add `attempts?: number`, `firstSuccess?: boolean` | SCO-01 |
| `AnalysisData` | Add `labels?: Record<CellKey, string>` | ANA-03 |
| `SESSION_TIMEOUT_MS` | 30 → 10 minutes | SEC-09 |
| Config spans | Add `#qd-answer-key` (required when tables are encoded) and `#qd-question-total` (optional) | ANS-06, SCO-05 |
| CSV columns | Append `Kind`, `Attempts`, `First Attempt Correct` | ANA-02, SCO-06 |
| Instructor session | Replace the `qd/instructor` boolean with state that passes SEC-01 | SEC-01 |

**Migration.** Every new field is optional, so v2 records stay valid. The v2→v3 migration only
stamps `schema: 3`. PIN upgrade happens lazily under SEC-07. No IndexedDB store or index changes, so
`DB_VERSION` stays at 3.

## 7. Verification

- Each MUST and SHOULD requirement marked T gets at least one automated test. Where the review
  reproduced a defect (§2.4), the test starts from that reproduction and must fail before the fix.
- E2E tests run in both storage modes (the existing default and encrypted matrix). After SEC-08, the
  encrypted mode is the release configuration.
- WP3 adds a manual step: rebuild in Oxygen, run the ANS-10 leak check on the output, and commit the
  regenerated `dita-demo/`.

## 8. Owner answers (2026-10-30)

| # | Question | Answer | Effect |
|---|---|---|---|
| Q1 | What idle timeout suits a class sharing one machine? | 10 minutes | SEC-09 fixed at 10 minutes |
| Q2 | Unlimited retries, lock after first answer, or hidden feedback? | Unlimited retries, with attempts and first-attempt correctness recorded | WP5 as written |
| Q3 | Should Export CSV need the password again? | No, export freely | SEC-04 withdrawn |
| Q4 | Can the "PIN Stored" dialog go? | Remove it | UX-02 raised to MUST |
| Q5 | When is an analysis page complete? | When every interactive cell is filled and any quiz on the page is complete | ANA-04 as written |
| Q6 | Does anything downstream read the CSV? | Nothing automated; people open it in a spreadsheet | ANA-02 and SCO-06 append safely |
| Q7 | Who rebuilds `dita-demo/` in Oxygen? | The owner | WP3 ships a rebuild checklist |

## 9. Traceability

| Review finding | Requirements |
|---|---|
| 00 Instructor escalation, PIN hashes, session carry-over | SEC-01 – SEC-12 |
| 01 Retries hide in scores | SCO-01, SCO-04, SCO-06, SCO-07 |
| 02 Unstable denominators | SCO-02, SCO-03, SCO-05, ANA-06 |
| 03 Analysis work not exported | ANA-01 – ANA-05 |
| 04 Accessibility | A11Y-01 – A11Y-04 |
| 05 Unstyled dialogs | UX-01, UX-02 |
| 06 Numeric input | UX-03, UX-04 |
| 07 Status panel at 768 px | UX-06 |
| 08 Logged-out quiz pages | UX-05 |
| 09 Polish items | UX-07 – UX-11, ANS-11 |
| Search leak and answers in HTML | ANS-01 – ANS-10 |
| Bundle ceiling | NFR-01 |

## 10. Implementation notes (2026-10-30)

All five work packages were implemented in one pull request on the session's single branch, one
commit per work package, rather than one PR each. Deviations and additions:

| Item | As built | Why |
|---|---|---|
| ANS-08 marker | A `qd1:` prefix on each encoded value, not a `data-qd-enc` table attribute | The XSL only rewrites text nodes, so DITA-OT's own table rendering is untouched. The prefix also versions the encoding. |
| ANS-03 | `npm run update-dita-demo` and `npm run finalise:output` delete the search index; the leak check fails if one remains | WebHelp has no documented switch to stop building it |
| SCO-05 | `customHeader.xsl` emits `#qd-question-total` empty; `npm run finalise:output -- <output>` counts quiz rows across all pages and stamps the total after publishing | A per-topic XSL pass cannot see the whole publication. The script also runs the leak check, so it is one step in `dita/README.md`'s rebuild checklist |
| SCO-01 commit rule | MCQ choices commit; numeric values commit when the field loses focus. Typing saves without counting | Otherwise typing "1500" slowly counted four attempts, the first wrong |
| Contract additions beyond §6 | `PageData.totalQuestions` and `AnalysisData.totalCells` (optional) | Needed to judge page completeness for ANA-04 |
| SEC-08 | `build:dita` is now the obfuscated build; `build:dita:plain` added for development and the plain E2E job | `build:dita` is the path into the Oxygen template |
| UX-01 | Confirm-dialog body styled inline | `qd-modal` moves itself to `<body>`, which strips shadow-scoped styles from slotted content |
| A11Y-04 finding | Primary toolbar button darkened to `#0062cc` | axe found 3.98:1 contrast on `#007bff` |
| Known gap (ANA-04) | A page whose quiz is complete but whose analysis table has never been touched shows green | No analysis data exists until the first entry, so the cell count is unknown |
| Verification without Oxygen | The encoding XSL was run with the xslt3 processor against a DITA quiz topic; runtime decoding is covered by integration tests on encoded tables | Oxygen is not available in CI or the build session; the owner's rebuild (Q7) is the real check |

