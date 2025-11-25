# Quickstart: Test Coverage Gap Analysis

**Feature**: 006-test-coverage-gaps
**Date**: 2025-11-25

## Prerequisites

Coverage dependency already installed: `@vitest/coverage-v8@2.1.9`

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
# Run integration tests with coverage (outputs to coverage/integration/)
npm run test:coverage:integration
```

### 3. Generate Combined Coverage

```bash
# Run both unit and integration coverage sequentially
npm run test:coverage:all
```

**Output**:
- Unit coverage: `coverage/` directory
- Integration coverage: `coverage/integration/` directory

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

## Available NPM Scripts

```bash
# Coverage commands
npm run test:coverage           # Unit tests with coverage
npm run test:coverage:unit      # Unit tests with coverage (explicit)
npm run test:coverage:integration # Integration tests with coverage
npm run test:coverage:all       # Both unit + integration coverage

# Gap analysis
npm run test:gaps               # Structural gap analysis
npm run test:gaps -- --json     # JSON output for CI
npm run test:gaps -- --strict   # Exit code 1 if gaps found
npm run analyze:e2e-gaps        # E2E feature coverage report
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
Ensure `scripts/check-test-gaps.js` exists. Run `npm run test:gaps` to verify.

### E2E gaps report not generated
Run `npm run analyze:e2e-gaps` to create `docs/test-coverage-report.md`.
