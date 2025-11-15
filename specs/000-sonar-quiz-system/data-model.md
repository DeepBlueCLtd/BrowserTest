# Data Model: Sonar Quiz System

**Date**: 2025-11-11
**Feature**: Sonar Quiz System
**Purpose**: Define entities, relationships, and validation rules

## Entity Definitions

### 1. StudentRecord

**Purpose**: Root entity for a student's complete training progress

```typescript
interface StudentRecord {
  // Identity
  serviceId: string;        // Unique identifier (e.g., "RN2344")
  name: string;            // Full name (e.g., "Smith, J")

  // Document context
  docId: string;           // Document identifier (e.g., "core-acs")
  release: string;         // Release version (e.g., "02-2025")

  // Metadata
  schema: number;          // Schema version for migrations
  created: string;         // ISO 8601 first access timestamp
  updated: string;         // ISO 8601 last modification timestamp

  // Aggregates
  attempted: number;       // Total questions attempted across all pages
  correct: number;         // Total correct answers across all pages

  // Page data
  pages: Record<string, PageData>;  // Keyed by pageId
}
```

**Validation Rules**:
- serviceId: Required, alphanumeric, 2-10 characters
- name: Required, 1-100 characters
- release: Required, format "MM-YYYY"
- schema: Required, positive integer
- attempted >= 0, correct >= 0, correct <= attempted

### 2. PageData

**Purpose**: Student's progress and answers for a specific page

```typescript
interface PageData {
  // Quiz data
  answers: AnswerRecord[];       // Array of quiz answers in order
  state: CompletionState;        // Calculated completion status
  firstAttempted?: string;       // ISO 8601 first answer timestamp
  lastAttempted?: string;        // ISO 8601 most recent answer timestamp

  // Analysis data (optional)
  analysis?: AnalysisData;       // Analysis table entries if present
}
```

**Validation Rules**:
- answers: Array, can be empty
- state: Must be valid CompletionState enum value
- timestamps: Valid ISO 8601 format if present
- analysis: Optional, only if page has analysis table

### 3. AnswerRecord

**Purpose**: Individual quiz answer with correctness

```typescript
interface AnswerRecord {
  answer: string;          // User's answer (e.g., "a", "12.5")
  success: boolean;        // Whether answer is correct
  timestamp: string;       // ISO 8601 when answer was submitted
}
```

**Validation Rules**:
- answer: Required, non-empty string
- success: Required boolean
- timestamp: Required, valid ISO 8601 format
- For MCQ: answer must be single letter a-z
- For numeric: answer must be valid number string

### 4. AnalysisData

**Purpose**: Student's entries in analysis tables

```typescript
interface AnalysisData {
  tableId: string;                    // Unique table identifier
  cells: Record<string, string>;      // Cell key to content mapping
  firstEdited?: string;               // ISO 8601 first edit timestamp
  lastEdited?: string;                // ISO 8601 last edit timestamp
}
```

**Validation Rules**:
- tableId: Required, generated from table content hash
- cells: Object with string keys and values
- Cell keys format: "R{row}C{col}#f:{hash}"
- Cell values: Max 500 characters

### 5. SessionData

**Purpose**: Active user session information

```typescript
interface SessionData {
  // User identity (duplicated for quick access without storage lookup)
  serviceId: string;
  name: string;
  release: string;

  // Session management
  loginTime: string;          // ISO 8601 login timestamp
  lastActivity: string;       // ISO 8601 last interaction
  expiresAt: string;         // ISO 8601 session expiry

  // Instructor mode
  instructorUnlocked: boolean;
  unlockTime?: string;       // ISO 8601 unlock timestamp
}
```

**Validation Rules**:
- serviceId, name, release: Duplicated from storage key for convenience
- Timestamps must be valid ISO 8601
- Session expires 30 minutes after lastActivity
- instructorUnlocked defaults to false

**Note**: The serviceId and release are indeed part of the storage key used to retrieve the StudentRecord from IndexedDB. They're duplicated here in SessionData for convenient access without requiring a storage lookup on every operation.

### 6. SessionCache

**Purpose**: Cached page states for performance

```typescript
interface SessionCache {
  // Aggregated totals
  totals: {
    answered: number;
    correct: number;
  };

  // Per-page cache
  pages: Record<string, PageCache>;
}

interface PageCache {
  state: CompletionState;
  answered: number;
  correct: number;
  last?: string;           // ISO 8601 last update
}
```

**Validation Rules**:
- Totals must match sum of page values
- State calculated from answered/correct ratio
- Cache rebuilt from IndexedDB on login

## Enumerations

### CompletionState

```typescript
type CompletionState = 'unstarted' | 'incomplete' | 'complete';
```

**Rules**:
- `unstarted`: No answers provided
- `incomplete`: Some answered OR any incorrect
- `complete`: All answered AND all correct

### QuestionKind

```typescript
type QuestionKind = 'mcq' | 'numeric';
```

**Rules**:
- Determined by parsing quiz table structure
- MCQ: Has `<ol>` in detail column
- Numeric: Has tolerance number in detail column

## Key Generation

### Storage Keys

```typescript
// Primary storage key for StudentRecord
function getStorageKey(release: string, serviceId: string): string {
  return `qd/${release}/u${serviceId}`;
}

// Session storage keys
const SESSION_KEY = 'qd/session';
const CACHE_KEY = 'qd/state';
```

### Cell Keys

```typescript
// Analysis table cell identifier
function getCellKey(row: number, col: number, content: string): string {
  const hash = hashContent(content);  // First 8 chars of SHA-256
  return `R${row}C${col}#f:${hash}`;
}
```

## Relationships

### Entity Relationships

```
StudentRecord (1) ─────> (*) PageData
                              │
                              ├─> (*) AnswerRecord
                              │
                              └─> (0..1) AnalysisData
                                         │
                                         └─> (*) Cell Entries

SessionData (1) ─────> (1) SessionCache
                            │
                            └─> (*) PageCache
```

### Data Flow

1. **Login Flow**:
   - Create SessionData in sessionStorage
   - Load/create StudentRecord from IndexedDB
   - Build SessionCache from StudentRecord

2. **Answer Save Flow**:
   - Update AnswerRecord in PageData
   - Recalculate PageData.state
   - Update SessionCache
   - Persist StudentRecord to IndexedDB

3. **Logout Flow**:
   - Clear SessionData from sessionStorage
   - Clear SessionCache from sessionStorage
   - StudentRecord remains in IndexedDB

## Storage Schema

### IndexedDB Structure

```typescript
// Database: 'SonarQuizDB'
// Version: 1
// Object Stores:

interface IDBSchema {
  students: {
    key: string;           // "qd/{release}/u{serviceId}"
    value: StudentRecord;
    indexes: {
      'by-release': string;
      'by-service-id': string;
      'by-updated': string;
    };
  };

  backups: {
    key: string;          // "backup_{timestamp}_{key}"
    value: StudentRecord;
    indexes: {
      'by-original-key': string;
      'by-timestamp': string;
    };
  };
}
```

### SessionStorage Structure

```typescript
// Key-value pairs in sessionStorage
{
  'qd/session': SessionData,      // Current user session
  'qd/state': SessionCache,       // Cached progress state
  'qd/instructor': string          // Hashed instructor password
}
```

## Validation & Constraints

### Business Rules

1. **Unique Student**: One StudentRecord per (release, serviceId) combination
2. **Answer Immutability**: Answers can be updated but history not tracked
3. **State Calculation**: State derived from answers, never set directly
4. **Session Timeout**: Auto-logout after 30 minutes inactivity
5. **Data Isolation**: No cross-release data access
6. **Cache Consistency**: Cache rebuilt if inconsistent with storage

### Data Integrity

1. **Atomic Saves**: All PageData updates in single transaction
2. **Backup on 5th Save**: Create backup before major changes
3. **Schema Migrations**: Handle version upgrades gracefully
4. **Validation on Load**: Verify data structure integrity
5. **Conflict Resolution**: Last-write-wins for concurrent updates

## Migration Strategy

### Schema Versioning

```typescript
async function migrateSchema(record: any): Promise<StudentRecord> {
  switch(record.schema) {
    case 1: // Current version
      return record as StudentRecord;

    case undefined: // Legacy format
      return migrateLegacyFormat(record);

    default:
      throw new Error(`Unknown schema version: ${record.schema}`);
  }
}
```

### Upgrade Paths

- **v0 → v1**: Convert flat answer strings to AnswerRecord objects
- **Future**: Add new fields with defaults, preserve backwards compatibility