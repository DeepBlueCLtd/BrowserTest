# Phase 1 Data Model: Refactor Architectural Hot-Spots

**Feature**: Refactor Architectural Hot-Spots for Maintainability
**Date**: 2026-06-17

## Persisted data: NO CHANGES

This is an internal, behavior-preserving refactor. **No persisted entities are added, removed, or modified.** The frozen contracts in `src/types/contracts.ts` (`AnswerRecord`, `StudentRecord`, `PageData`, `SessionData`, `SessionCache`, identity types) remain untouched. IndexedDB stores (`students`, `backups`, audit log), the composite key scheme `qd/{release}/u{serviceId}`, and the 30-minute session timeout are unchanged.

The "data model" for this feature is therefore the **module/responsibility map** — the units being created and the contracts they expose — not new domain data.

## Refactor entities (engineering artifacts)

### Hot-spot finding
A reviewed location flagged for refactoring.
- **Fields**: file path, line range, category (one of: tight-coupling, deep-nesting, extractable-component, lit-candidate, oversized-file), severity (HIGH/MEDIUM/LOW), recommended extraction.
- **Source**: enumerated in `code-review-report.md`.
- **Lifecycle**: open → addressed (by a slice) → verified (tests green, file under threshold).

### Extracted unit
A new module/component carved from an oversized file.
- **Fields**: name, kind (service | helper | repository | Lit component | pure-logic module), source module(s), public interface, owning test file.
- **Invariant**: single primary responsibility; covered by unit tests; introduces no new runtime/network dependency.

### Cross-cutting helper
A shared constant/function replacing duplicated logic.
- **Fields**: name, replaces (list of duplicate sites), location.
- **Examples**: `getPageIdFromUrl()`, `instructor-auth.hashPassword()`, `STORAGE_KEYS.INSTRUCTOR_SHOW_ANSWERS`, `idb-helpers.promisifyRequest()`, `clearBadges()`, `createEmptyStudentRecord()`, `persistAndNotify()`.

## Module responsibility map (target state)

| New/changed unit | Kind | Carved from | Single responsibility |
|------------------|------|-------------|-----------------------|
| `services/auth/auth-service.ts` | service | `qd-login.ts` | Student login + retry-after-migration; returns result union |
| `services/auth/instructor-auth.ts` | helper | `qd-login.ts`, `qd-migration-dialog.ts` | SHA-256 instructor-password hashing/verification |
| `services/pin-reset-service.ts` | service | `qd-pin-reset-dialog.ts` | Reset PIN + write audit event |
| `services/analysis-display.ts` | pure-logic | `analysis-table.ts` | `groupEntriesByCell`, `sortByTimestamp` |
| `services/session-cache.ts` | pure-logic | `session.ts` | `buildCacheFromRecord` & related cache math |
| `services/storage/idb-helpers.ts` | helper | `indexeddb.ts` | `promisifyRequest`, `runTransaction` |
| `services/storage/idb-connection.ts` | module | `indexeddb.ts` | Open/upgrade/recover the DB |
| `services/storage/idb-codec.ts` | module | `indexeddb.ts` | Encryption-aware encode/decode |
| `services/storage/backup-repository.ts` | repository | `indexeddb.ts` | Backups |
| `services/storage/audit-log-repository.ts` | repository | `indexeddb.ts` | Audit log |
| `enhancers/quiz-answer-persistence.ts` | module | `quiz-table.ts` | Save quiz answer + validation styling |
| `enhancers/quiz-table-columns.ts` | helper | `quiz-table.ts` | Column show/hide |
| `enhancers/quiz-input-factory.ts` | helper | `quiz-table.ts` | Build MCQ/numeric inputs |
| `enhancers/quiz-instructor-overlay.ts` | module | `quiz-table.ts` | Show/hide student answers |
| `enhancers/analysis-persistence.ts` | module | `analysis-table.ts` | Save analysis cell |
| `enhancers/analysis-instructor-overlay.ts` | module | `analysis-table.ts` | Show/hide student entries |
| `enhancers/instructor-answer-reveal.ts` | module | `bootstrap.ts`, `event-coordinator.ts` | Single shared answer-reveal routine |
| `init/global-styles.ts` | asset | `bootstrap.ts` | Global CSS literal |
| `utils/page-id.ts` | helper | `bootstrap.ts`, `event-coordinator.ts` | `getPageIdFromUrl()` |
| `components/qd-student-answers.ts` | Lit component | `quiz-table.ts` | Render student answers (escaped) |
| `components/qd-student-entries.ts` | Lit component | `analysis-table.ts` | Render student entries (encapsulated styles) |
| `components/qd-student-table.ts` | Lit component | `qd-pin-reset-dialog.ts` | Searchable student table |
| `components/qd-spinner.ts` | Lit component | `qd-migration-dialog.ts` | Loading spinner |
| `components/qd-lockout-banner.ts` | Lit component (optional) | `qd-login.ts` | Lockout countdown |

## State transitions

No runtime state machines change. The only "state" here is the refactor workflow per finding: **open → addressed → verified**, with `verified` requiring (a) characterization/unit tests green, (b) the source file under the ~400-line threshold where applicable, and (c) Definition of Done passing.
