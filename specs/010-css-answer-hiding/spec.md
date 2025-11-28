# Feature Specification: CSS-Based Quiz Answer Hiding

**Feature Branch**: `010-css-answer-hiding`
**Created**: 2025-11-28
**Status**: Draft
**Input**: GitHub Issue #66 - Hide answers/details in CSS, highlight in author mode
**Related**: https://github.com/DeepBlueCLtd/BrowserTest/issues/66

## Problem Statement

Quiz table answers are briefly visible during page load (before JavaScript executes) and remain visible if JavaScript is disabled. This allows students to cheat by:
1. Viewing page source before JS hides the answers
2. Disabling JavaScript entirely to see all answers
3. Pausing page load mid-execution

The solution uses CSS (which loads before content renders) to hide answer/detail columns by default, then JavaScript overrides this when appropriate (student interactive mode or instructor view).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student Cannot See Answers Before Login (Priority: P1)

A student opens a quiz page. The answer and detail columns are hidden by CSS before any JavaScript executes, preventing the student from seeing correct answers via view-source, JS-disabled mode, or brief page load timing.

**Why this priority**: Core security requirement - the entire feature exists to prevent answer exposure

**Independent Test**: Open a quiz page with JavaScript disabled → answer columns must be invisible

**Acceptance Scenarios**:

1. **Given** a quiz page with `table.qd-quiz`, **When** JavaScript is disabled, **Then** answer column (2nd) and detail column (3rd) are not visible
2. **Given** a quiz page loading, **When** the page is mid-render before JS executes, **Then** answer/detail columns are hidden by CSS
3. **Given** a student viewing page source, **When** they inspect the raw HTML, **Then** answer text is present but visually hidden by CSS (JS will later remove from DOM for extra security)

---

### User Story 2 - Student Sees Input Controls After Login (Priority: P1)

After a student logs in, the answer column transforms to show input controls (radio buttons for MCQ, text fields for numeric). The CSS hiding must not interfere with these interactive elements.

**Why this priority**: Without this, students cannot answer questions - core functionality

**Independent Test**: Login as student → input controls visible and functional in answer column

**Acceptance Scenarios**:

1. **Given** a logged-in student on a quiz page, **When** viewing a quiz table, **Then** input controls in the answer column are visible
2. **Given** a logged-in student, **When** they submit an answer, **Then** the validation coloring (green/red) displays correctly
3. **Given** CSS-based column hiding active, **When** student mode activates, **Then** JavaScript overrides CSS to reveal input controls

---

### User Story 3 - Instructor Sees All Columns (Priority: P2)

When an instructor logs in, both answer and detail columns become visible, showing correct answers and any additional details (MCQ options, tolerances).

**Why this priority**: Instructors need full visibility for review and support

**Independent Test**: Login as instructor → all three columns visible with correct answers displayed

**Acceptance Scenarios**:

1. **Given** an instructor logged in, **When** viewing a quiz table, **Then** answer column shows correct answers (not input controls)
2. **Given** an instructor logged in, **When** viewing a quiz table, **Then** detail column (MCQ options, tolerances) is visible
3. **Given** CSS hiding answer/detail columns, **When** instructor mode activates, **Then** JavaScript overrides CSS to reveal both columns

---

### User Story 4 - Author Sees Visual Indicators When Editing (Priority: P3)

Content authors editing DITA source in Oxygen see colored backgrounds on cells that will be hidden (quiz answer/detail) or interactive (analysis cells), helping them understand which content areas have special behavior.

**Why this priority**: Development experience improvement, not end-user facing

**Independent Test**: Open quiz/analysis table in Oxygen author mode → colored backgrounds visible on appropriate cells

**Acceptance Scenarios**:

1. **Given** a quiz table in Oxygen author mode, **When** viewing in preview, **Then** answer and detail column cells have distinct colored backgrounds
2. **Given** an analysis table in Oxygen author mode, **When** viewing in preview, **Then** cells marked as interactive have distinct colored backgrounds

---

### Edge Cases

- What happens if CSS fails to load? Answers would be briefly visible, but JS will still hide them (graceful degradation)
- What happens if custom CSS conflicts with quiz CSS? The quiz CSS should use specific selectors to minimize conflicts
- How does this affect print mode? CSS hiding should apply to print unless explicitly overridden

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST hide quiz table answer column (2nd column) via CSS before JavaScript executes
- **FR-002**: System MUST hide quiz table detail column (3rd column) via CSS before JavaScript executes
- **FR-003**: System MUST use `visibility: hidden` (not `display: none`) to preserve table layout and prevent layout shift
- **FR-004**: CSS hiding MUST apply only to `table.qd-quiz` elements (not affect other tables)
- **FR-005**: System MUST provide CSS override capability for student interactive mode to reveal answer column inputs
- **FR-006**: System MUST provide CSS override capability for instructor mode to reveal both columns
- **FR-007**: System MUST NOT break existing JavaScript-based answer security (DOM removal)
- **FR-008**: Existing tests MUST continue to pass (may require test updates to account for CSS)
- **FR-009**: Author mode CSS MUST provide colored background indicators for hidden quiz table cells (answer/detail columns) and interactive analysis table cells to aid content authoring

### Non-Functional Requirements

- **NFR-001**: CSS rules MUST be included in the DITA template CSS file (`f13ldman.css`)
- **NFR-002**: Author mode indicators MUST be in `f13ldman_author_mode.css` (separate from production CSS)
- **NFR-003**: Override classes MUST use standard CSS specificity (no `!important` if avoidable)
- **NFR-004**: Solution MUST work across supported browsers (Chrome/Edge 96+, Firefox 102+)

### Key Entities

- **Quiz Table**: HTML table with class `qd-quiz`, three columns: Question, Answer, Detail
- **CSS Override Classes**: Classes applied by JavaScript to reveal hidden columns
  - `qd-quiz-interactive` - applied when student is logged in (reveals answer column for inputs)
  - Instructor mode styling - reveals both answer and detail columns

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quiz answer columns are invisible when page loads with JavaScript disabled
- **SC-002**: 100% of existing unit, integration, and E2E tests pass after implementation
- **SC-003**: Student input controls function correctly after login
- **SC-004**: Instructor can see all columns after login
- **SC-005**: No visible layout shift when columns are revealed (visibility: hidden maintains space)

## Clarifications

### Session 2025-11-28

- Q: Should author mode have visual indicators for hidden/interactive cells? → A: Yes, modify `f13ldman_author_mode.css` to add colored backgrounds for hidden cells in quiz tables and interactive cells in analysis tables

## Assumptions

1. The DITA template CSS file (`f13ldman.css`) is the appropriate location for base hiding CSS
2. The existing `qd-quiz-interactive` class can be leveraged for student mode overrides
3. JavaScript will continue to add/remove `qd-hidden` class as secondary security layer
4. The `visibility: hidden` approach (vs `display: none`) is acceptable despite columns taking space when hidden
5. The `f13ldman_author_mode.css` file will be modified to provide visual indicators (colored backgrounds) for content authors editing DITA source
