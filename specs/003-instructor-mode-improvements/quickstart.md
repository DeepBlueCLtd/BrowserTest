# Quickstart Guide: Testing Instructor Mode Improvements

**Feature**: Instructor Mode Improvements
**Date**: 2025-11-19

## Overview

This guide helps developers and QA testers verify the instructor mode bug fixes and improvements. All testing can be done locally using the demo files.

## Prerequisites

1. Build the project:
```bash
npm run build
```

2. Have two browser windows ready (one for student, one for instructor)

## Testing P0 Bug Fixes

### Test 1: Session State Clearing (FR-001, FR-002)

**Setup**: Use same browser/tab throughout

1. Open `demo/quiz-index.html` in browser
2. Login as student:
   - Service ID: `TEST001`
   - Name: `Student One`
3. Navigate to `demo/quiz-examples.html`
4. Answer some questions (note the color-coded feedback)
5. Return to index and click Logout
6. Click "Instructor" button
7. Enter instructor password: `instructor123`
8. Navigate back to `demo/quiz-examples.html`

**Expected**:
- ✅ No color-coded student answers visible
- ✅ Only correct answers and choices shown
- ✅ No "Student One" data in instructor view

**Bug Behavior**:
- ❌ Student's color-coded answers persist
- ❌ Personal answers shown instead of correct ones

### Test 2: Scores Modal Z-Index (FR-003)

1. Login as instructor (fresh session)
2. Click "View All Scores" button

**Expected**:
- ✅ Modal appears above all content
- ✅ Can click expand arrows
- ✅ Can click close button

**Bug Behavior**:
- ❌ Modal appears behind page content
- ❌ Cannot interact with modal

### Test 3: Fresh Session Toggle (FR-004)

**Setup**: New incognito/private window

1. Create student data first (different browser):
   - Login as student, answer questions
2. In fresh browser, login directly as instructor
3. Navigate to quiz page
4. Enable "Show student answers" toggle

**Expected**:
- ✅ Student answers load and display

**Bug Behavior**:
- ❌ No student answers shown despite toggle

### Test 4: Text Contrast (FR-005)

1. Login as instructor
2. Look at "Show student answers" label

**Expected**:
- ✅ Text clearly readable against background

**Bug Behavior**:
- ❌ Poor contrast, hard to read

### Test 5: Export Button State (FR-006)

1. Login as instructor (fresh session)
2. Check "Export to CSV" button

**Expected**:
- ✅ Button enabled if student data exists

**Bug Behavior**:
- ❌ Button disabled despite data in IndexedDB

## Testing P2 Enhancements

### Test 6: Timestamp Format (FR-007, FR-008)

1. Login as instructor
2. Enable "Show student answers"
3. Check timestamp displays

**Expected**:
- ✅ Format: "Nov 19 14:23" (24-hour, no AM/PM)
- ✅ Consistent across all displays

### Test 7: Enhanced CSV Export (FR-008, FR-009)

1. Click "Export to CSV"
2. Open in spreadsheet application

**Expected Columns**:
- ✅ Student Name
- ✅ Service ID
- ✅ Page ID
- ✅ Question Number
- ✅ Question Text
- ✅ Student Answer
- ✅ Correct Answer
- ✅ Is Correct
- ✅ Timestamp (ISO 8601)

**Special Characters Test**:
- Create question with quotes/commas
- Export and verify proper escaping

### Test 8: Performance with 100+ Students (FR-014)

**Setup**: Use script to generate test data

```javascript
// Run in console after login
async function generate100Students() {
  const db = await openDB('BrowserTest');
  for(let i = 1; i <= 100; i++) {
    // Generate student records
    const student = {
      serviceId: `TEST${i.toString().padStart(3, '0')}`,
      name: `Student ${i}`,
      // ... add answer data
    };
    // Save to IndexedDB
  }
}
```

1. Generate 100+ student records
2. Login as instructor
3. Enable "Show student answers"

**Expected**:
- ✅ Page remains responsive
- ✅ Smooth scrolling
- ✅ No UI freezing

### Test 9: Re-submission Handling (FR-015)

1. Login as student
2. Answer question 1 with "A"
3. Re-answer question 1 with "B"
4. Login as instructor
5. Check student's answer

**Expected**:
- ✅ Only shows "B" (latest answer)
- ✅ Timestamp reflects second submission

## Testing P3 Improvements

### Test 10: Toggle Persistence (FR-011)

1. Login as instructor
2. Enable "Show student answers" on page 1
3. Navigate to pages 2, 3, 4
4. Return to page 1

**Expected**:
- ✅ Toggle remains enabled on all pages
- ✅ Answers visible without re-toggling

### Test 11: Analysis Table Display (FR-012, FR-013)

1. Have students enter text in analysis tables
2. Login as instructor
3. Enable "Show student answers"

**Expected**:
- ✅ All entries grouped by cell
- ✅ Sorted newest first
- ✅ "(No entries yet)" for empty cells

## Automated Testing

Run the test suites:

```bash
# Unit tests for components
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (will use Storybook)
npm run test:e2e
```

## Debugging Tips

### Check IndexedDB
1. Open DevTools → Application → IndexedDB
2. Look for `BrowserTest` database
3. Verify `students` object store has data

### Check sessionStorage
1. Open DevTools → Application → Session Storage
2. Verify instructor-specific keys:
   - `INSTRUCTOR`: should be "true"
   - `qd/instructor/showAnswers`: toggle state

### Monitor Events
```javascript
// Add to console to see events
document.addEventListener('qd:instructor-unlock', e => console.log('Unlock:', e));
document.addEventListener('qd:logout', e => console.log('Logout:', e));
```

## Common Issues

| Issue | Solution |
|-------|----------|
| No instructor button | Check for instructor password hash in HTML |
| Can't see student answers | Verify data exists for current release |
| Modal won't close | Check z-index in DevTools computed styles |
| Export fails | Check console for errors, verify data structure |

## Success Criteria

All tests pass when:
- Zero console errors during testing
- All expected behaviors match
- No bug behaviors occur
- Performance remains smooth with 100+ students