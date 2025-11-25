# CLI Interface Contracts

**Feature**: 006-test-coverage-gaps
**Date**: 2025-11-25

## Overview

This feature adds development CLI tooling. No REST/GraphQL APIs - all interfaces are npm scripts and Node.js CLI tools.

## NPM Script Interface

### test:coverage

**Command**: `npm run test:coverage`

**Behavior**: Runs Vitest with coverage enabled

**Exit Codes**:
- `0` - All tests pass, coverage meets thresholds
- `1` - Tests fail OR coverage below thresholds

**Environment Variables**:
- None required

**Output**:
- stdout: Test results + coverage summary
- Files: `coverage/` directory

### test:gaps

**Command**: `npm run test:gaps [options]`

**Options**:
| Flag | Description | Default |
|------|-------------|---------|
| `--json` | Output JSON instead of text | false |
| `--strict` | Exit 1 if any gaps found | false |

**Exit Codes**:
- `0` - Analysis complete (gaps reported but not failures)
- `0` - No gaps found
- `1` - (with --strict) Gaps detected

**Output Formats**:

Text (default):
```
=== Source Files Without Tests ===
src/file.ts
  Expected: tests/unit/file.test.ts
  Status: MISSING

=== Summary ===
Total: 45, Covered: 38, Gaps: 7
```

JSON (with --json):
```json
{
  "summary": { "total": 45, "covered": 38, "gaps": 7 },
  "gaps": [{ "sourceFile": "src/file.ts", "expected": "...", "status": "missing" }]
}
```

### analyze:e2e-gaps

**Command**: `npm run analyze:e2e-gaps`

**Behavior**: Generates one-off E2E gap analysis report

**Exit Codes**:
- `0` - Report generated successfully

**Output**:
- File: `docs/test-coverage-report.md`

## Script Arguments Contract

### check-test-gaps.js

```typescript
interface CLIArgs {
  json?: boolean;    // Output JSON format
  strict?: boolean;  // Fail if gaps detected
  help?: boolean;    // Show usage
}

interface GapReport {
  summary: {
    totalFiles: number;
    filesWithTests: number;
    filesWithoutTests: number;
    coveragePercent: number;
  };
  gaps: Array<{
    sourceFile: string;
    expectedTestPaths: string[];
    status: 'missing';
  }>;
}
```

### analyze-e2e-gaps.js

```typescript
interface E2EGapReport {
  generated: string;  // ISO date
  features: Array<{
    name: string;
    specFile: string | null;
    status: 'covered' | 'gap';
  }>;
  selectors: Array<{
    selector: string;
    occurrences: number;
  }>;
  actions: Array<{
    action: string;
    count: number;
  }>;
  gaps: string[];  // Feature names without coverage
}
```

## Vitest Coverage Configuration Contract

From `vitest.config.ts`:

```typescript
interface CoverageConfig {
  provider: 'v8';
  reporter: ['text', 'json', 'html', 'lcov'];
  include: ['src/**/*.ts'];
  exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/types/**'];
  thresholds: {
    lines: 80;
    functions: 80;
    branches: 80;
    statements: 80;
  };
}
```

## File Output Contracts

### coverage/coverage-summary.json

```typescript
interface CoverageSummary {
  total: CoverageMetrics;
  [filePath: string]: CoverageMetrics;
}

interface CoverageMetrics {
  lines: MetricDetail;
  statements: MetricDetail;
  functions: MetricDetail;
  branches: MetricDetail;
}

interface MetricDetail {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}
```

### coverage/lcov.info

Standard LCOV format - compatible with:
- Codecov
- Coveralls
- SonarQube
- GitHub Actions coverage annotations
