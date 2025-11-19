# Contracts: Instructor Mode Improvements

**Feature**: Instructor Mode Improvements
**Date**: 2025-11-19

## Overview

This feature involves only bug fixes and improvements to existing functionality. No new APIs, REST endpoints, or external contracts are introduced.

## Existing Contracts (Unchanged)

All existing TypeScript interfaces in `src/types/contracts.ts` remain unchanged:
- `StudentRecord`
- `AnswerRecord`
- `SessionData`
- `PageData`

## Internal Behavioral Contracts

### Component Events

Existing events that must continue to work:
- `qd:logout` - Must clear instructor state
- `qd:instructor-unlock` - Validates instructor access
- `qd:instructor-show-answers` - Shows student answers
- `qd:instructor-hide-answers` - Hides student answers
- `qd:answer-saved` - Updates export button state

### Storage Keys

Existing storage keys that must be maintained:
- `qd/{release}/u{serviceId}` - Student data in IndexedDB
- `INSTRUCTOR` - Instructor mode flag in sessionStorage
- `qd/instructor/showAnswers` - Toggle state in sessionStorage

### Data Formats

#### Display Timestamp Format
- Display: `"Nov 19 14:23"` or `"11/19 14:23:45"`
- CSV Export: ISO 8601 (`"2025-11-19T14:23:45.000Z"`)

#### Service ID Display
- Storage: Full service ID (e.g., `"RN123456"`)
- Display: Last 4 digits only (e.g., `"3456"`)

## Testing Contracts

### Test Data Structure
For automated testing, use these patterns:
```typescript
const testStudent = {
  serviceId: 'TEST001',
  name: 'Test Student',
  release: 'TestRelease2025'
};

const testAnswer = {
  answer: 'A',
  success: true,
  timestamp: new Date().toISOString()
};
```

### Instructor Password
- Test password: `instructor123`
- SHA-256 hash: `c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5`

## No Breaking Changes

All improvements are backward compatible. Existing stored data will continue to work without migration.