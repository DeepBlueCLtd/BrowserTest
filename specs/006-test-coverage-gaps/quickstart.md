# Quickstart: Test Coverage Gap Analysis

**Feature**: 006-test-coverage-gaps
**Date**: 2025-11-25

## Prerequisites

```bash
# Install coverage dependency (one-time)
npm install -D @vitest/coverage-v8
```

## Commands

### 1. Generate Unit Test Coverage

```bash
# Run unit tests with coverage
npm run test:coverage

# Or with verbose output
npm run test:unit -- --coverage
```

**Output**: `coverage/` directory with HTML report at `coverage/index.html`

### 2. Generate Integration Test Coverage

```bash
# Run integration tests with coverage
npm run test:integration -- --coverage
```

### 3. Generate Combined Coverage

```bash
# Run both suites and merge
npm run test:coverage:all
```

### 4. Structural Gap Analysis

```bash
# Check for source files without tests
npm run test:gaps

# JSON output for CI
npm run test:gaps -- --json
```

### 5. E2E Gap Analysis (One-Off)

```bash
# Generate E2E coverage report
npm run analyze:e2e-gaps
```

**Output**: `docs/test-coverage-report.md`

## NPM Scripts to Add

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:coverage:all": "npm run test:unit -- --coverage && npm run test:integration -- --coverage",
    "test:gaps": "node scripts/check-test-gaps.js",
    "analyze:e2e-gaps": "node scripts/analyze-e2e-gaps.js"
  }
}
```

## Viewing Reports

### HTML Coverage Report
```bash
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html
```

### CI Integration
The `coverage/lcov.info` file can be uploaded to coverage services like Codecov or Coveralls.

## Thresholds

Current thresholds (from `vitest.config.ts`):
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

If coverage drops below thresholds, the test command will fail.

## Troubleshooting

### "Cannot find dependency '@vitest/coverage-v8'"
```bash
npm install -D @vitest/coverage-v8
```

### Coverage report missing files
Ensure files are in `src/**/*.ts` and not excluded in `vitest.config.ts`.

### Structural gaps script not found
The `scripts/check-test-gaps.js` file needs to be created as part of this feature implementation.
