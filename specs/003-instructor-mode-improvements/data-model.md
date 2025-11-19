# Data Model: Instructor Mode Improvements

**Feature**: Instructor Mode Improvements
**Date**: 2025-11-19
**Status**: Complete

## Overview

This feature primarily involves bug fixes to existing data structures. No new entities are introduced. The only data model change is clarifying re-submission behavior for student answers.

## Existing Entities (No Changes)

### StudentRecord
Already defined in `src/types/contracts.ts`:
```typescript
interface StudentRecord {
  schema: number;
  serviceId: ServiceId;
  name: string;
  release: ReleaseId;
  attempted: number;
  correct: number;
  pages: Record<PageId, PageData>;
}
```

### AnswerRecord
Already defined in `src/types/contracts.ts`:
```typescript
interface AnswerRecord {
  answer: string;      // User's answer
  success: boolean;    // Correctness
  timestamp: string;   // ISO 8601 (MANDATORY)
}
```

## Data Behavior Clarifications

### Re-submission Handling (FR-015)

**Current Behavior**: Undefined (might append or error)
**New Behavior**: Overwrite previous answer

When a student re-submits an answer to the same question:
1. The new `AnswerRecord` replaces the existing one at the same array index
2. The `timestamp` is updated to the new submission time
3. The `success` status is recalculated
4. No history of previous submissions is maintained

**Storage Key**: Remains unchanged - uses same composite key structure
```
qd/{release}/u{serviceId}
```

### Display Data (Not Persisted)

The following data structures are computed at runtime for display only:

#### StudentAnswerDisplay
Used in instructor view to show student answers:
```typescript
interface StudentAnswerDisplay {
  studentName: string;
  serviceId: string;        // Last 4 digits only
  answer: string;
  isCorrect: boolean;
  timestamp: string;        // Formatted for display
}
```

**Formatting Rules**:
- `serviceId`: Display only last 4 digits for privacy
- `timestamp`:
  - Display format: "Nov 19 14:23" or "11/19 14:23:45"
  - CSV export: Full ISO 8601

## State Management

### Session State (sessionStorage)

The following instructor-specific state is stored in sessionStorage:
- `qd/instructor/showAnswers`: Boolean toggle state
- `INSTRUCTOR`: "true" when in instructor mode

**Bug Fix**: These values must be cleared on logout to prevent state leakage.

### Component State (Memory Only)

The following state exists only in component memory:
- Loaded student answers (cached after first load)
- Expanded/collapsed state in scores modal
- Virtual scroll position for 100+ students

## Data Flow for Fixes

### FR-001: Clear Student UI State
```
Logout Event → Clear sessionStorage → Reset Component State → Clear DOM
```

### FR-004: Fresh Session Data Loading
```
Toggle Enable → Check Cache → Load from IndexedDB → Display
```

### FR-006: Export Button State
```
Component Mount → Query IndexedDB → Update Button State
Data Change Event → Re-query → Update Button State
```

## No New APIs or Contracts

This feature involves only bug fixes to existing functionality. No new REST endpoints, GraphQL schemas, or external contracts are needed.

## Migration

No data migration required. All changes are backward compatible with existing stored data.