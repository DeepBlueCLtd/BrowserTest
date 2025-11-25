# Data Model: Test Coverage Gap Analysis

**Feature**: 006-test-coverage-gaps
**Date**: 2025-11-25

## Overview

This feature produces developer tooling outputs, not runtime data structures. The "data model" describes the format of coverage reports and gap analysis outputs.

## Output Entities

### 1. Coverage Report (Vitest v8 Output)

**Source**: `coverage/` directory (gitignored)

**Formats Produced**:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI integration
- `coverage/coverage-summary.json` - JSON summary

**JSON Summary Structure**:
```json
{
  "total": {
    "lines": { "total": 1234, "covered": 987, "skipped": 0, "pct": 80.0 },
    "statements": { "total": 1500, "covered": 1200, "skipped": 0, "pct": 80.0 },
    "functions": { "total": 150, "covered": 120, "skipped": 0, "pct": 80.0 },
    "branches": { "total": 200, "covered": 160, "skipped": 0, "pct": 80.0 }
  },
  "src/components/qd-login.ts": {
    "lines": { "total": 100, "covered": 85, "skipped": 0, "pct": 85.0 },
    // ... per-file breakdown
  }
}
```

### 2. Structural Gap Report

**Source**: `scripts/check-test-gaps.js` output

**Output Format** (stdout):
```text
=== Source Files Without Tests ===

src/init/bootstrap.ts
  Expected: tests/unit/init/bootstrap.test.ts OR tests/integration/bootstrap.test.ts
  Status: MISSING

src/config/dom-config-reader.ts
  Expected: tests/unit/config/dom-config-reader.test.ts
  Status: MISSING

=== Summary ===
Total source files: 45
Files with tests: 38
Files without tests: 7
Coverage: 84.4%
```

**Structured Output** (JSON option):
```json
{
  "summary": {
    "totalFiles": 45,
    "filesWithTests": 38,
    "filesWithoutTests": 7,
    "coveragePercent": 84.4
  },
  "gaps": [
    {
      "sourceFile": "src/init/bootstrap.ts",
      "expectedTestPaths": [
        "tests/unit/init/bootstrap.test.ts",
        "tests/integration/bootstrap.test.ts"
      ],
      "status": "missing"
    }
  ]
}
```

### 3. E2E Gap Analysis Report

**Source**: Manual analysis + spec grep

**Output Format** (Markdown in `docs/test-coverage-report.md`):
```markdown
# E2E Test Coverage Report

Generated: 2025-11-25

## Feature Coverage Matrix

| Feature | E2E Spec File | Status |
|---------|---------------|--------|
| Student login | dita-student-flow.spec.ts | ✅ Covered |
| Instructor login | dita-instructor-flow.spec.ts | ✅ Covered |
| Quiz interaction | dita-student-flow.spec.ts | ✅ Covered |
| Analysis tables | analysis-capture.spec.ts | ✅ Covered |
| Progress tracking | progress-tracking.spec.ts | ✅ Covered |
| Session timeout | - | ❌ Gap |
| CSV export | - | ❌ Gap |

## Spec Grep Analysis

### Tested Selectors
- `qd-login` (5 specs)
- `qd-status` (4 specs)
- `qd-instructor` (3 specs)
- `[data-testid="..."]` patterns

### Tested Actions
- page.fill() - 15 occurrences
- page.click() - 42 occurrences
- page.waitForSelector() - 23 occurrences

## Gaps Requiring Attention

1. **Session timeout handling** - No E2E test verifies 30-minute timeout
2. **CSV export** - Export functionality not exercised in E2E
3. **Error state rendering** - Invalid input scenarios not covered
```

## Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     Coverage Gap Analysis                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │ Unit/Int     │     │ Structural   │     │ E2E Gap      │     │
│  │ Coverage     │     │ Gap Report   │     │ Report       │     │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │ coverage/    │     │ stdout/JSON  │     │ docs/*.md    │     │
│  │ (gitignored) │     │              │     │              │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Validation Rules

### Coverage Thresholds (from vitest.config.ts)
- Lines: ≥80%
- Functions: ≥80%
- Branches: ≥80%
- Statements: ≥80%

### Structural Gap Rules
- Type-only files (`src/types/**`) excluded
- Entry points (`src/index.ts`) excluded (tested via integration)
- Components should have unit tests
- Services should have unit tests
- Enhancers may have integration OR unit tests

### E2E Gap Rules
- Each documented feature should map to at least one E2E spec
- Critical user journeys must have E2E coverage
- Gap report is advisory, not a CI gate
