# Plan: E2E Test Coverage Replacement

Replace Storybook-based E2E tests with DITA-demo-based tests.

## Task 1: Fix Analysis Capture Tests

### Objectives
- Unskip all tests in `analysis-capture.spec.ts`
- Update selectors to match current component structure
- Verify analysis table cell editability and auto-save

### Testing Required
- Run `npm run test:e2e -- --grep "Analysis Capture"`
- All tests must pass

### Files to Modify
- `tests/e2e/workflows/analysis-capture.spec.ts`

### Validation
```bash
npm run test:e2e -- --grep "Analysis Capture"
# Expected: 0 failures, all tests passing
```

---

## Task 2: Create Data Coexistence Test Suite

### Objectives
- Create new test file for critical data coexistence scenarios
- Test that quiz saves don't wipe analysis data
- Test that analysis saves don't wipe quiz data
- Test both data types persist across page reload
- Use dita-demo page containing both table types

### Testing Required
- Use `dita-demo/Pages/analysis-contact.html` (has both `qd-quiz` and `qd-analysis` tables)
- Alternative: `dita-demo/Pages/analysis-tactical.html`
- Write tests that verify IndexedDB contains both `answers` and `analysis.cells`
- Test data integrity after interleaved saves

### Files to Modify
- Create: `tests/e2e/workflows/data-coexistence.spec.ts`

### Validation
```bash
npm run test:e2e -- --grep "Data Coexistence"
# Expected: All critical coexistence tests pass
# Verify IndexedDB structure in test assertions
```

---

## Task 3: Add Quiz Table Structure Tests

### Objectives
- Verify detail column is hidden (security)
- Verify answer column is hidden (security)
- Verify MCQ questions render as `<select>` elements
- Verify numeric questions render as `<input type="text">`

### Testing Required
- Add tests to existing student flow file
- Check for `qd-hidden` class on columns
- Verify input element types match question types

### Files to Modify
- `tests/e2e/workflows/dita-student-flow.spec.ts`

### Validation
```bash
npm run test:e2e -- --grep "DITA Student Flow"
# Expected: New structure tests pass
# Columns with qd-hidden class verified
# Input types match question types
```

---

## Task 4: Verify Full E2E Suite

### Objectives
- Run complete E2E test suite
- Ensure no regressions from removed Storybook tests
- Verify all DITA-based tests pass

### Testing Required
- Full E2E suite execution
- Check test count matches expectations

### Files to Modify
- None (verification only)

### Validation
```bash
npm run test:e2e
# Expected: All tests pass
# No Storybook-related failures (those tests removed)
```

---

## Dependencies

- Task 2 depends on identifying which dita-demo page has both table types
- Tasks 1-3 can be done in parallel
- Task 4 runs after all others complete

## Notes

- All tests use `file://` protocol with dita-demo pages
- Tests verify IndexedDB storage (not sessionStorage like Storybook tests)
- Max test timeout: 2 seconds per test (per CLAUDE.md constraints)
