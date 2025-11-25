# Feature Specification: Test Coverage Gap Analysis

**Feature Branch**: `006-test-coverage-gaps`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "I wish to look for areas of code (or features) that we do not cover in e2e, unit and integration testing. I don't think we can instrument the app to do this, certainly not for e2e - though maybe we can for unit and integration testing. Consider options for doing this. Once we've decided an option - identify the problem areas."

## Clarifications

### Session 2025-11-25

- Q: What approach for E2E gap analysis? → A: Feature/workflow inventory + E2E spec grep analysis (B+C)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Unit/Integration Coverage Report (Priority: P1)

The developer runs a coverage command and receives a detailed report showing which source files and lines are exercised by unit and integration tests.

**Why this priority**: Coverage reporting for unit/integration tests is the most actionable approach - Vitest already has v8 coverage configured but the dependency isn't installed. This provides immediate, precise line-by-line visibility.

**Independent Test**: Can be tested by running `npm run test:coverage` and verifying HTML/text reports are generated showing percentage coverage per file.

**Acceptance Scenarios**:

1. **Given** coverage dependency is installed, **When** developer runs `npm run test:coverage`, **Then** a coverage report is generated showing line/branch/function coverage per source file
2. **Given** coverage report exists, **When** developer examines the HTML report, **Then** uncovered lines are visually highlighted for each source file
3. **Given** coverage thresholds are set, **When** coverage falls below threshold, **Then** the test run fails with clear indication of which files are under-covered

---

### User Story 2 - Structural Gap Analysis (Priority: P2)

The developer receives a report identifying source files that have no corresponding test file, or test files that don't exist for key modules.

**Why this priority**: Structural analysis catches modules entirely missing from test suite without requiring instrumentation. Useful for both unit/integration and as a proxy for E2E gaps.

**Independent Test**: Can be tested by running a script that compares `src/` structure with `tests/` structure and outputs files without test coverage.

**Acceptance Scenarios**:

1. **Given** source files exist in `src/`, **When** developer runs gap analysis script, **Then** a list of source files without corresponding test files is produced
2. **Given** gap analysis report exists, **When** developer reviews it, **Then** they can prioritize which untested modules to address first

---

### User Story 3 - Combined Unit+Integration Coverage (Priority: P3)

The developer runs both unit and integration test suites with coverage enabled and receives a merged coverage report showing overall test coverage.

**Why this priority**: Integration tests exercise code paths that unit tests may miss. Combined coverage gives the most accurate picture of what's tested vs untested.

**Independent Test**: Can be tested by running both test suites with coverage and merging results into single report.

**Acceptance Scenarios**:

1. **Given** both unit and integration tests exist, **When** developer runs combined coverage, **Then** a single merged report shows total coverage across both test types
2. **Given** merged report exists, **When** a function is tested by integration but not unit tests, **Then** it shows as covered in the merged report

---

### User Story 4 - E2E Gap Analysis (Priority: P2)

The developer receives a one-off report identifying which application features and user workflows are covered by E2E tests vs which lack automated E2E testing.

**Why this priority**: E2E tests validate complete user workflows but cannot be instrumented for coverage. A feature inventory approach reveals gaps without instrumentation overhead.

**Independent Test**: Can be tested by running gap analysis and verifying all known app features appear in the report with coverage status.

**Acceptance Scenarios**:

1. **Given** application features are documented, **When** developer runs E2E gap analysis, **Then** a checklist mapping features to E2E test files is produced
2. **Given** E2E spec files exist, **When** developer runs automated spec grep analysis, **Then** a report of tested user actions/selectors is extracted
3. **Given** gap analysis report exists, **When** developer reviews it, **Then** untested workflows are clearly identified for prioritization

---

### Edge Cases

- What happens when a source file has no executable code (types only)? → Should be excluded from coverage
- What happens when coverage drops below threshold during CI? → Build should fail with clear error message
- How does the system handle test files that import but don't exercise a module? → Coverage shows imported-but-uncalled functions as uncovered
- What happens when an E2E test file covers multiple features? → Feature inventory should map test file to all covered features
- How does spec grep handle dynamic selectors? → Extract static selector patterns; note dynamic patterns require manual review

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enable Vitest v8 coverage reporting for unit tests
- **FR-002**: System MUST generate HTML coverage reports showing line-by-line coverage visualization
- **FR-003**: System MUST generate text/summary coverage reports for CI output
- **FR-004**: System MUST support coverage thresholds that fail the build when not met
- **FR-005**: System MUST provide a script or command to identify structural test gaps (source files without tests)
- **FR-006**: System MUST support merging coverage from unit and integration test runs
- **FR-007**: System MUST exclude type-only files from coverage calculations
- **FR-008**: System MUST provide a feature/workflow inventory mapping application features to E2E test files
- **FR-009**: System MUST provide automated E2E spec grep analysis extracting tested user actions and selectors

### Non-Requirements (Explicitly Out of Scope)

- **NR-001**: E2E (Playwright) coverage **instrumentation** is out of scope - this would require bundling instrumented code which conflicts with the offline/file:// architecture. However, one-off E2E **gap analysis** via feature inventory and spec grep is in scope.
- **NR-002**: Runtime code instrumentation in the production bundle is not permitted

### Key Entities

- **Coverage Report**: Contains per-file metrics (lines, branches, functions, statements) with covered/uncovered status
- **Coverage Threshold**: Configuration defining minimum acceptable coverage percentages
- **Gap Analysis Report**: List of source files without corresponding test files
- **E2E Gap Analysis Report**: Feature inventory with coverage status + extracted user actions/selectors from E2E specs

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can generate coverage report for unit tests in under 60 seconds
- **SC-002**: Coverage report identifies specific uncovered lines in each source file
- **SC-003**: CI build fails when coverage drops below configured thresholds
- **SC-004**: Gap analysis identifies 100% of source files lacking any test coverage
- **SC-005**: All coverage reports are accessible via standard file output (HTML, text, JSON)
- **SC-006**: E2E gap analysis identifies all application features and maps them to existing E2E test coverage

## Assumptions

- Vitest coverage configuration already exists in `vitest.config.ts` (confirmed)
- The `@vitest/coverage-v8` dependency needs to be installed (confirmed missing)
- Integration tests can share the same coverage provider
- Coverage thresholds of 80% are appropriate starting targets (as currently configured)

## Options Considered

### Option A: Vitest v8 Coverage (Recommended)

**Approach**: Install @vitest/coverage-v8, run tests with --coverage flag

**Pros**:
- Already configured in vitest.config.ts
- Works for both unit and integration tests
- No code instrumentation in build output
- Industry standard approach

**Cons**:
- Only covers code exercised by unit/integration tests
- E2E coverage not included

### Option B: Istanbul/NYC Instrumentation

**Approach**: Instrument source code at build time, collect coverage during E2E tests

**Pros**:
- Would include E2E coverage

**Cons**:
- Requires instrumented builds
- Conflicts with file:// protocol and offline-first architecture
- Increases bundle size
- Not appropriate for production or demo builds

### Option C: Manual Structural Analysis Only

**Approach**: Script to compare src/ files vs tests/ files

**Pros**:
- Simple to implement
- No dependencies

**Cons**:
- Doesn't show line/branch coverage
- Only identifies completely untested files

### Recommendation

**Option A (Vitest v8 Coverage)** combined with a lightweight structural gap analysis script. This provides:
- Precise line-level coverage for unit/integration tests
- No impact on build artifacts
- Works within offline-first constraints
- Structural analysis catches entirely missing test files
