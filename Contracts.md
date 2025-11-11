# CONTRACTS.md

## 1. Core Types

```ts
export type ReleaseId  = string;  // e.g. "02-2025"
export type ServiceId  = string;  // e.g. "RN2344"
export type PageId     = string;  // e.g. "gram-1"
export type TableId    = string;  // e.g. "t:8e2b4"
export type CellKey    = string;  // e.g. "R2C4#f:abc123"
```

---

## 2. Enumerations

```ts
export type State = 'unstarted' | 'incomplete' | 'complete';
export type QuestionKind = 'mcq' | 'numeric';
```

---

## 3. Answer Encoding

Use structured objects instead of compact strings for clarity and versioning.

```ts
export interface AnswerRecord {
  answer: string;      // "a" or "12.2"
  success: boolean;    // true = correct
}
```

Example:

```json
{
  "answers": [
    { "answer": "a", "success": true },
    { "answer": "12.2", "success": false }
  ],
  "firstAttempted": "2025-11-11T10:00:00Z",
  "lastAttempted": "2025-11-11T10:03:00Z",
  "state": "incomplete"
}
```

---

## 4. Data Structures

```ts
export interface PageRecord {
  answers: AnswerRecord[];
  firstAttempted?: string;  // ISO
  lastAttempted?: string;   // ISO
  state?: State;            // cached R/A/G
  analysis?: {
    tableId: TableId;
    cells: Record<CellKey, string>;
    firstEdited?: string;
    lastEdited?: string;
  };
}

export interface UserReleaseRecord {
  schema: number;            // version, start = 3
  docId: string;             // document ID or title
  release: ReleaseId;
  serviceId: ServiceId;
  name: string;
  attempted: number;         // derived
  correct: number;           // derived
  updated: string;           // ISO
  pages: Record<PageId, PageRecord>;
}

export interface Session {
  release: ReleaseId;
  serviceId: ServiceId;
  name: string;
  started: string;           // ISO
  expires: number;           // epoch ms
}

export interface SessionCache {
  totals: { answered: number; correct: number };
  pages: Record<PageId, {
    state: State;
    answered: number;
    correct: number;
    last?: string;
  }>;
}
```

---

## 5. Storage Interface

```ts
export interface StorageAdapter {
  getUserRelease(release: ReleaseId, sid: ServiceId):
    Promise<UserReleaseRecord | null>;
  putUserRelease(record: UserReleaseRecord):
    Promise<void>;
  eraseAll(): Promise<void>;
}
```

- Phase 0: in-memory adapter for Storybook.
- Phase 5: IndexedDB adapter using same interface.

---

## 6. Events

All are `CustomEvent<T>` with `bubbles: true`, `composed: true`.

| Event | Payload |
|--------|----------|
| `qd:login` | `{ name: string; serviceId: ServiceId; release: ReleaseId }` |
| `qd:logout` | `{}` |
| `qd:answer-saved` | `{ pageId: PageId; answers: AnswerRecord[]; state: State }` |
| `qd:status-changed` | `{ pageId: PageId; state: State }` |
| `qd:analysis-cell-change` | `{ cell: CellKey; value: string }` |
| `qd:unlock` | `{ enabled: true }` |
| `qd:lock` | `{ enabled: false }` |
| `qd:show-all-responses` | `{ pageId: PageId; enabled: boolean }` |
| `qd:erase` | `{}` |
| `qd:error` | `{ code: string; message: string }` |

---

## 7. Constants and Keys

```ts
export const LOCAL_PREFIX = 'qd/';
export const SESSION_KEY  = 'qd/session';
export const STATE_KEY    = 'qd/state';
export const SCHEMA_VER   = 3;
```

---

## 8. Validation Rules

- One quiz or analysis table per page.
- MCQ lists use `<ol>` and are **1-indexed**.
- Numeric tolerance: single number (float), blank = zero.
- Editable analysis cells = `<td>` without inline `background-color`.
- `#qd-status` element required per quiz page.
- Violations trigger visible author error banner at runtime.
