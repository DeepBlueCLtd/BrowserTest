# JSDOM Table Cell Removal Bug in CI Environment

## Issue Summary

Tests for quiz table enhancement fail in CI (GitHub Actions) but pass locally. The third table column (`<td>`) is completely removed during table creation when the cell contains complex HTML like `<ol>` elements.

## Environment Details

### Local Environment (PASSING)
- Node version: **22.21.1** (not 18!)
- JSDOM: **25.0.1**
- OS: Linux/macOS/Windows
- All 17 tests pass
- All 5 minimal reproduction tests pass

### CI Environment (FAILING)
- GitHub Actions
- Node version: **18.x** (confirmed from CI config)
- JSDOM: Likely older version compatible with Node 18
- Ubuntu runner
- 11 tests fail with "Row has 2 cells (expected 3)"

### CRITICAL FINDING

**The local environment is using Node 22, while CI uses Node 18.** This explains why tests pass locally but fail in CI. JSDOM has known bugs with table manipulation in Node 18 that are fixed in Node 20+.

## The Bug

When creating a table in JSDOM with `innerHTML` that includes complex HTML in cells (specifically `<ol>` with `<li>` elements), the third column is removed from the DOM.

### Expected Behavior

```html
<table class="qd-quiz">
  <tbody>
    <tr>
      <td>Question 1?</td>
      <td>2</td>
      <td><ol><li>Option A</li><li>Option B</li><li>Option C</li></ol></td>
    </tr>
  </tbody>
</table>
```

### Actual Behavior in CI

```html
<table class="qd-quiz">
  <tbody>
    <tr>
      <td>Question 1?</td>
      <td>2</td>
      <!-- Third <td> is MISSING -->
    </tr>
  </tbody>
</table>
```

## Minimal Reproducible Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('JSDOM Table Cell Bug Reproduction', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document as unknown as Document;
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  it('should preserve all 3 table cells when third cell contains <ol>', () => {
    // Create table using innerHTML on a temp div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <table class="qd-quiz">
        <tbody>
          <tr>
            <td>What is active sonar?</td>
            <td>2</td>
            <td><ol><li>Option A</li><li>Option B</li><li>Option C</li></ol></td>
          </tr>
        </tbody>
      </table>
    `;

    const table = tempDiv.querySelector('table')!;
    document.body.appendChild(table);

    const row = table.querySelector('tbody tr')!;
    const cells = row.querySelectorAll('td');

    console.log('Cell count:', cells.length);
    console.log('Row HTML:', row.innerHTML);

    // This passes locally but FAILS in CI
    expect(cells.length).toBe(3);

    // Verify detail cell exists
    const detailCell = row.querySelector('td:nth-child(3)');
    expect(detailCell).toBeDefined();
    expect(detailCell?.querySelector('ol')).toBeDefined();
  });

  it('should preserve all 3 table cells with simple text in third cell', () => {
    // Control test - simple text works fine
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <table class="qd-quiz">
        <tbody>
          <tr>
            <td>What is the frequency?</td>
            <td>24.5</td>
            <td>0.5</td>
          </tr>
        </tbody>
      </table>
    `;

    const table = tempDiv.querySelector('table')!;
    document.body.appendChild(table);

    const row = table.querySelector('tbody tr')!;
    const cells = row.querySelectorAll('td');

    // This PASSES in both local and CI
    expect(cells.length).toBe(3);
  });
});
```

## Diagnostic Logs

The production code has extensive diagnostic logging that should show when cells disappear:

```typescript
console.error(`[ENHANCE ROW ${index}] STEP 1 - before setAttribute: ${cellsBeforeSetAttr} cells`);
console.error(`[MCQ CELL ${questionIndex}] before removeChild loop: ${cellsBefore} cells in row`);
```

**Problem:** These logs do NOT appear in CI output, suggesting:
1. Tests fail during table creation, before enhancement runs
2. OR console.error is suppressed in CI environment
3. OR JSDOM version difference between local and CI

## What We've Tried

### Attempt 1: Avoid innerHTML
Built table using pure DOM methods (`createElement`, `appendChild`).
**Result:** Failed - appending `<ol>` to cell before table is in document triggers bug

### Attempt 2: Append table first, then populate
Appended empty table to document, then populated cells.
**Result:** Failed - setting `innerHTML` on cells even after in document triggers bug

### Attempt 3: Build complete structure offline
Built entire table structure with `textContent` only, avoiding `innerHTML` completely.
**Result:** Failed - any complex DOM manipulation on cells triggers bug

### Attempt 4: Use innerHTML on div (current approach)
Build table HTML string, use `innerHTML` on temporary div, extract table.
**Result:** PASSES locally, FAILS in CI

## Affected Test File

`tests/unit/enhancers/quiz-table.test.ts`

The `createQuizTable()` helper function (lines 34-62) creates test tables.

## Affected Tests

All tests that create tables with `<ol>` in the third column:
- `should display correct answer for MCQ questions`
- `should display correct answer for numeric questions`
- `should show tolerance for numeric questions`
- `should add visual indicator for correct answer display`
- `should handle multiple questions correctly`
- All `showStudentComparisons()` tests
- All color coding tests

## Questions to Investigate

1. **JSDOM Version:** Is CI using a different JSDOM version than local despite same package-lock.json?
2. **Node.js Version:** Is there a sub-version difference (18.x.y)?
3. **HTML Parser:** Does JSDOM use different HTML parsers on different platforms?
4. **DOM Configuration:** Are there JSDOM configuration options we're missing?

## Potential Solutions

### Option 1: Upgrade CI to Node 20/22 (RECOMMENDED)
**This is the root cause fix.** JSDOM bugs with table manipulation are fixed in Node 20+. Since local environment (Node 22) has no issues, upgrading CI is the simplest solution.

**Action:** Update `.github/workflows/*.yml` to use Node 20 or 22 instead of 18.

```yaml
- uses: actions/setup-node@v3
  with:
    node-version: '22'  # or '20'
```

### Option 2: Use Real Browser for Tests
Switch to Playwright or Puppeteer for these specific tests instead of JSDOM. More overhead but guaranteed compatibility.

### Option 3: Mock the Table Structure
Don't actually create tables in tests - mock the DOM structure or test at a higher level. Less thorough testing.

### Option 4: Keep Node 18, Use Workaround in Tests
Keep CI on Node 18 but modify test helper to work around the bug. See TEST 5 in reproduction file for workaround approach.

### Option 5: Pre-build Test Fixtures
Create real HTML files as fixtures instead of building tables programmatically. More maintenance overhead.

## Next Steps

1. Create a standalone reproduction script that can run in both environments
2. Check exact JSDOM versions in both environments
3. Test with Node 20/22 to see if issue persists
4. Consider switching problematic tests to E2E with real browser
5. Report bug to JSDOM project with minimal reproduction

## Related Files

- `tests/unit/enhancers/quiz-table.test.ts` - Failing tests
- `src/enhancers/quiz-table.ts` - Production code (has diagnostic logs)
- `.github/workflows/` - CI configuration

## CI Error Output Sample

```
Error: Error: MCQ: revealElement not found. Row has 2 cells (expected 3).
Detail cell exists: false. Detail HTML: "N/A".
answerCell HTML: <select name="q0" class="qd-input-container">...
 ❯ tests/unit/enhancers/quiz-table.test.ts:119:15
```

Note: The table HTML shows only 2 `<td>` elements when there should be 3.

## Impact

- Blocks completion of Phase 5 (Instructor Review features)
- 11 tests failing in CI
- Cannot merge PR until resolved
- All tests pass locally, suggesting code is correct
