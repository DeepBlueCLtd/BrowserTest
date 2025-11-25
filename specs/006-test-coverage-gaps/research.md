# Research: Test Coverage Gap Analysis

**Feature**: 006-test-coverage-gaps
**Date**: 2025-11-25

## Research Topics

### 1. Vitest v8 Coverage Provider

**Decision**: Use `@vitest/coverage-v8` as the coverage provider

**Rationale**:
- Already configured in `vitest.config.ts` (provider: 'v8')
- v8 coverage is faster than Istanbul for TypeScript projects
- Native integration with Vitest - no separate instrumentation step
- Outputs multiple formats: text, html, json, lcov (for CI integration)

**Alternatives Considered**:
- Istanbul (@vitest/coverage-istanbul): More mature but slower, requires code transformation
- c8: Lower-level v8 coverage, less integration with Vitest

**Configuration Found** (vitest.config.ts):
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: ['src/**/*.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/types/**'],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

**Missing**: `@vitest/coverage-v8` package not installed (confirmed via npm run test:unit -- --coverage)

### 2. Coverage Merging Strategy

**Decision**: Run unit and integration tests with coverage separately, merge using nyc merge

**Rationale**:
- Vitest doesn't natively support merging coverage from multiple configs
- Each test type has its own config file (vitest.config.ts, vitest.integration.config.ts)
- LCOV format allows merging via standard tooling

**Implementation Approach**:
1. Run unit tests: `npm run test:unit -- --coverage --coverage-directory coverage/unit`
2. Run integration tests: `npm run test:integration -- --coverage --coverage-directory coverage/integration`
3. Merge LCOV files: `npx nyc merge coverage/unit coverage/integration coverage/merged`
4. Generate combined report: `npx nyc report --reporter=html --reporter=text -t coverage/merged`

**Alternative Considered**:
- Single vitest config with all tests: Would lose separation between test types
- c8 merge: Requires separate tooling, nyc is more commonly used

### 3. Structural Gap Analysis

**Decision**: Create Node.js script comparing src/ files to tests/ files

**Rationale**:
- Simple file system comparison
- No external dependencies beyond Node.js
- Can run in CI to detect missing test files

**Pattern Matching Rules**:
- `src/components/foo.ts` → expects `tests/unit/components/foo.test.ts`
- `src/services/bar.ts` → expects `tests/unit/services/bar.test.ts`
- `src/enhancers/baz.ts` → expects `tests/integration/baz.test.ts` OR `tests/unit/enhancers/baz.test.ts`

**Exclusions**:
- `src/types/**` - Type-only files with no runtime code
- `src/index.ts` - Entry point (tested via integration)
- Files already at 100% coverage in unit tests

### 4. E2E Gap Analysis via Spec Grep

**Decision**: Parse Playwright spec files to extract tested user actions and selectors

**Rationale**:
- E2E instrumentation conflicts with offline-first architecture
- Static analysis reveals what workflows are tested
- One-off analysis, not automated CI gate

**Extraction Patterns**:
```javascript
// User actions
page.click(), page.fill(), page.check(), page.selectOption()
page.goto(), page.waitForSelector()

// Assertions
expect(page.locator()).toBeVisible()
expect(page.locator()).toHaveText()

// Selectors
'qd-login', 'qd-status', 'qd-instructor'
'[data-testid="..."]', '.class-selector', '#id-selector'
```

**Output Format**: Markdown report listing:
- Features/components tested (from selector patterns)
- User actions exercised per spec file
- Gap identification (features without E2E coverage)

### 5. Feature Inventory for E2E

**Decision**: Manual inventory of application features mapped to E2E spec files

**Rationale**:
- Application has ~10 distinct features/workflows
- Existing E2E specs organized by workflow name
- Manual mapping provides clearest gap identification

**Feature List** (from CLAUDE.md and spec analysis):
1. Student login (qd-login component)
2. Instructor login (password modal)
3. Quiz interaction (MCQ + numeric)
4. Analysis table editing
5. Progress tracking (R/A/G badges)
6. Session management (timeout, logout)
7. Data export (CSV)
8. Cohort management (data erasure)
9. Storage monitor (debug mode)
10. Build info display

**Existing E2E Spec Files** (tests/e2e/workflows/):
- analysis-capture.spec.ts
- cohort-management.spec.ts
- data-coexistence.spec.ts
- dita-instructor-flow.spec.ts
- dita-student-flow.spec.ts
- instructor-mode-improvements.spec.ts
- instructor-review.spec.ts
- pin-authentication.spec.ts
- progress-tracking.spec.ts

## Summary

All research topics resolved. No NEEDS CLARIFICATION items remain.

| Topic | Decision | Confidence |
|-------|----------|------------|
| Coverage provider | @vitest/coverage-v8 | High (existing config) |
| Coverage merging | LCOV merge via nyc | Medium (standard approach) |
| Structural gaps | Node.js fs comparison | High (simple implementation) |
| E2E spec grep | Regex pattern extraction | Medium (manual verification needed) |
| Feature inventory | Manual mapping | High (one-off analysis) |
