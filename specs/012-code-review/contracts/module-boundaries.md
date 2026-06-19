# Phase 1 Contracts: Module Boundaries

**Feature**: Refactor Architectural Hot-Spots for Maintainability
**Date**: 2026-06-17

This feature exposes no HTTP/GraphQL API and adds no public package API. The relevant "contracts" are the **internal module interfaces** of the extracted units. These are the seams the refactor must honor; they double as the unit-test surface. All types reference existing frozen types in `src/types/contracts.ts` (unchanged). Signatures below are indicative TypeScript and may be adjusted during implementation as long as the responsibility and behavior are preserved.

## Auth

```ts
// services/auth/auth-service.ts
type LoginResult =
  | { kind: 'success'; session: SessionData }
  | { kind: 'new-student-created'; session: SessionData }
  | { kind: 'lockout'; untilMs: number }
  | { kind: 'bad-pin'; remaining: number }
  | { kind: 'needs-migration'; error: string };

interface StudentLoginInput { serviceId: ServiceId; name: string; pin?: string; }

class AuthService {
  loginStudent(input: StudentLoginInput): Promise<LoginResult>;
  retryAfterMigration(input: StudentLoginInput): Promise<LoginResult>;
}
```
**Contract**: All authentication, lockout, PIN, and migration-detection logic lives here; the component performs no storage/crypto/rate-limit calls. `loginStudent` and `retryAfterMigration` share one internal success path (no duplication).

```ts
// services/auth/instructor-auth.ts
function hashPassword(plain: string): Promise<string>;            // SHA-256, 12-char truncation
function verifyInstructorPassword(plain: string): Promise<boolean>; // compares against configured hash
```
**Contract**: The single source of instructor-password hashing; `qd-login` and `qd-migration-dialog` both consume it (no duplicated crypto).

## PIN reset

```ts
// services/pin-reset-service.ts
interface PinResetResult { ok: boolean; error?: string; }
function resetStudentPin(student: StudentRecord): Promise<PinResetResult>; // resets PIN + writes audit event
```
**Contract**: Storage init, `resetPin`, `saveStudent`, and audit-event construction are encapsulated; the dialog only renders the result.

## Storage

```ts
// services/storage/idb-helpers.ts
function promisifyRequest<T>(req: IDBRequest<T>, op: string): Promise<T>;
function runTransaction<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode,
                          fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T>;

// services/storage/idb-codec.ts  (encryption-aware; adapter is NOT)
function encodeForStore(value: unknown): Promise<unknown>;
function decodeStoredValue(raw: unknown): Promise<unknown>; // throws StorageFormatError on mismatch

// services/storage/idb-connection.ts
function openDatabase(dbName: string): Promise<IDBDatabase>;  // owns DB_VERSION, onupgradeneeded, recovery

// services/storage/backup-repository.ts
function createBackup(db: IDBDatabase, payload: BackupRecord): Promise<void>;

// services/storage/audit-log-repository.ts
function saveAuditEvent(db: IDBDatabase, event: AuditEvent): Promise<void>;
```
**Contract**: `IndexedDBStorageAdapter` becomes a thin coordinator delegating to these units. No method re-implements transaction scaffolding. Encryption policy is confined to `idb-codec`. Singleton-by-dbName semantics are preserved.

```ts
// services/storage-service.ts  (additions)
function updateRecordWithAnalysis(record: StudentRecord, /* cell args */): StudentRecord; // mirror of updateRecordWithAnswer
function createEmptyStudentRecord(session: SessionData): StudentRecord;                    // dedupe try/catch literals
```

## Session

```ts
// services/session-cache.ts  (pure functions moved from session.ts)
function buildCacheFromRecord(record: StudentRecord): SessionCache;
function buildPageCache(/* ... */): PageCache;
function registerPageQuestions(/* ... */): void;
function updateCacheWithAnswer(cache: SessionCache, /* ... */): SessionCache;
```
**Contract**: `SessionService` retains only session lifecycle; cache math is import-only and DOM-free (already consumed independently by `storage-service.ts`).

## Enhancers

```ts
// enhancers/instructor-answer-reveal.ts  (single shared, security-sensitive)
function revealInstructorAnswers(table: HTMLTableElement, metadata: QuizTableMetadata): void;
function hideInstructorAnswers(table: HTMLTableElement): void;

// enhancers/quiz-answer-persistence.ts
function saveAnswer(/* ... */): Promise<void>;          // storage + cache + events
function applyValidationStyling(cell: HTMLElement, success: boolean): void; // DOM-only

// enhancers/quiz-input-factory.ts
function createQuestionInput(spec: QuestionInputSpec): HTMLElement;

// enhancers/quiz-table-columns.ts
function hideAnswerColumn(table: HTMLTableElement): void;
function showAnswerColumn(table: HTMLTableElement): void;
function hideDetailColumn(table: HTMLTableElement): void;
function removeColgroup(table: HTMLTableElement): void;

// services/analysis-display.ts  (pure)
function groupEntriesByCell(/* ... */): GroupedEntries;
function sortByTimestamp(/* ... */): StudentEntry[];

// utils/page-id.ts
function getPageIdFromUrl(url?: string): PageId;
```
**Contract**: `revealInstructorAnswers` is the only place correct answers are re-injected into the DOM; both `bootstrap.ts` and `event-coordinator.ts` call it. Persistence and DOM-styling are separated so each is independently testable.

## Reusable Lit components (attributes/events)

```text
<qd-student-answers .answers=${StudentAnswerDisplay[]}>      // auto-escaped; replaces innerHTML overlay
<qd-student-entries .entries=${StudentEntryDisplay[]}>       // styles in static styles; no inline cssText
<qd-student-table .students=${StudentRecord[]} @select=${e}> // searchable; emits per-row action
<qd-spinner>                                                  // shared loading indicator
<qd-lockout-banner .untilMs=${number} @expired=${e}>        // optional; owns its countdown
```
**Contract**: All bindings auto-escape; all styles live in `static styles` (Shadow DOM, no global CSS). Shared visual styles come from `shared-styles.ts`. Adding these must keep the IIFE bundle ≤40KB min+gzip (per-slice `size-check`).

## Invariants across all contracts

1. No new network calls or dynamic imports (offline-first / IIFE-safe).
2. No changes to `src/types/contracts.ts` or persisted data shapes.
3. Every extracted unit is covered by tests; existing tests pass unchanged except relocation.
4. Behavior is preserved everywhere except the quiz-overlay XSS fix (FR-004).
