# Feature Specification: Instructor Mode Improvements

**Feature Branch**: `001-instructor-mode-improvements`
**Created**: 2025-11-19
**Status**: Draft
**Input**: User description: "let's discuss some shortcomings of instructor mode"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Session Transition and UI Critical Fixes (Priority: P0)

As an instructor, I need the quiz interface to correctly clear student-specific UI state when transitioning from student to instructor login, and I need all instructor controls to be functional and readable, so I can effectively use the instructor features without visual or functional blockers.

**Why this priority**: Critical bugs blocking basic instructor functionality - persistent student UI state, non-functional modals, disabled buttons, and unreadable text prevent instructors from using the system at all.

**Independent Test**: Can be tested by logging in as student, answering questions, logging out, then logging in as instructor on same browser session. All instructor UI should work correctly.

**Acceptance Scenarios**:

1. **Given** user was logged in as student with color-coded answer feedback visible, **When** user logs out and logs in as instructor, **Then** quiz tables show only correct answers and choices/tolerance (no student-specific color-coding or personal answers)
2. **Given** instructor clicks "View All Scores" button, **When** modal opens, **Then** modal appears above all page content (proper z-index), can expand student details, and can close the modal via close button or overlay click
3. **Given** instructor logs into a fresh browser session (no prior student login), **When** instructor enables "Show student answers" toggle, **Then** student answers from all students in the cohort are displayed correctly on quiz pages
4. **Given** instructor is viewing the instructor panel, **When** looking at the "Show student answers" toggle label, **Then** text is clearly readable (sufficient contrast against background)
5. **Given** instructor has unlocked instructor mode and student answers exist in IndexedDB for current release, **When** viewing instructor panel, **Then** "Export to CSV" button is enabled and clickable
6. **Given** instructor views the "View All Scores" modal, **When** expanding a student's details, **Then** modal remains interactive and expansion works correctly

---

### User Story 2 - Answer Timestamp Visibility (Priority: P2)

As an instructor, I need to see timestamps showing month, date, and time in 24-hour format for when students submitted their answers, so I can track completion patterns and identify students who may need additional time or support.

**Why this priority**: Current implementation shows "shortened timestamps" which may not provide enough granularity for tracking student progress. 12-hour format with AM/PM wastes screen space.

**Independent Test**: Can be tested by submitting answers at known times and verifying the instructor view displays month/date/time information in 24-hour format.

**Acceptance Scenarios**:

1. **Given** students have submitted answers, **When** instructor views student answers, **Then** timestamps show month, date, and time in 24-hour format (e.g., "Nov 19 14:23" or "11/19 14:23:45")
2. **Given** instructor views timestamps in both in-page student answers and the scores modal, **When** comparing formats, **Then** all timestamps consistently use 24-hour format without AM/PM markers
3. **Given** answers were submitted in different timezones, **When** instructor views timestamps, **Then** all times are displayed in a consistent timezone (local to instructor's browser)

---

### User Story 3 - Export with Enhanced Metadata (Priority: P2)

As an instructor exporting quiz data to CSV, I need the export to include full timestamps, question text, and answer validation details, so I can perform offline analysis and track longitudinal student performance.

**Why this priority**: Current CSV export may lack sufficient metadata for detailed analysis. Instructors need comprehensive data exports for external analysis tools.

**Independent Test**: Can be tested by clicking "Export to CSV" and verifying the downloaded file contains all expected columns: student name, service ID, page ID, question number, question text, student answer, correct answer, success status, and full timestamp.

**Acceptance Scenarios**:

1. **Given** instructor has unlocked instructor mode with student data present, **When** clicking "Export to CSV", **Then** CSV file contains columns: Student Name, Service ID, Page ID, Question #, Question Text, Student Answer, Correct Answer, Is Correct, Timestamp (ISO 8601)
2. **Given** CSV export is downloaded, **When** opening in spreadsheet software, **Then** all timestamps are properly formatted and sortable
3. **Given** quiz contains special characters (quotes, commas) in questions or answers, **When** exporting to CSV, **Then** all values are properly escaped and parse correctly

---

### User Story 4 - Bulk Answer Review Toggle (Priority: P3)

As an instructor moving between pages during a live session, I need the "Show student answers" toggle state to persist across all quiz pages in the current session, so I don't have to re-enable it on every page navigation.

**Why this priority**: Currently the toggle state is stored in sessionStorage and retrieved on page load, but there may be edge cases where state doesn't persist correctly, causing frustration during rapid page navigation.

**Independent Test**: Can be tested by enabling "Show student answers" on page 1, navigating to pages 2-5, and verifying the toggle remains enabled on all pages without re-clicking.

**Acceptance Scenarios**:

1. **Given** instructor enables "Show student answers" on quiz page 1, **When** navigating to quiz pages 2, 3, 4, **Then** student answers are automatically visible on all pages without re-toggling
2. **Given** instructor disables "Show student answers" while viewing page 3, **When** navigating back to page 1, **Then** student answers remain hidden
3. **Given** instructor closes browser and returns within 30-minute session timeout, **When** instructor navigates to any quiz page, **Then** the toggle state from before browser close is restored

---

### User Story 5 - Analysis Table Student Entries Display (Priority: P3)

As an instructor reviewing analysis tables (free-form student work), I need to see student entries displayed in a readable comparison format with clear attribution and timestamps, so I can assess understanding across different student approaches.

**Why this priority**: The current documentation mentions "shows student entries in comparison format" for analysis tables, but lacks detail on formatting, sorting, or filtering capabilities.

**Independent Test**: Can be tested by having 3+ students enter different text in analysis table cells, then viewing as instructor to verify all entries are visible with student names and organized clearly.

**Acceptance Scenarios**:

1. **Given** 5 students have entered different answers in the same analysis table cell, **When** instructor enables "Show student answers", **Then** all 5 entries are displayed under that cell with student names and timestamps
2. **Given** analysis table has 10+ interactive cells with student data, **When** instructor views the table, **Then** student entries are visually grouped by cell and sorted by submission time (newest first)
3. **Given** an analysis cell has no student entries yet, **When** instructor views with "Show student answers" enabled, **Then** the cell shows a "(No entries yet)" placeholder

---

### Edge Cases

- What happens when user logs in as student, answers questions, logs out, then logs in as instructor in same browser session? (KNOWN BUG: student color-coding persists)
- What happens when instructor logs into fresh browser session with no prior student login? (KNOWN BUG: "Show student answers" toggle doesn't load student data)
- What happens when the scores modal is opened and page has high z-index elements? (KNOWN BUG: modal appears behind content)
- What happens when instructor mode has no student data in IndexedDB for current release? (KNOWN BUG: Export CSV incorrectly disabled)
- What happens when extremely long student answers (e.g., 1000+ characters in analysis tables) are displayed?
- How does the system handle performance when an instructor enables "Show answers" on a page with 100+ students?
- What happens when corrupted or invalid timestamp data is found in storage?
- What happens when a student submits the same answer multiple times (re-submission)? Do we show revision history?
- What happens when CSV export contains thousands of rows? Does the download succeed or fail?

## Requirements *(mandatory)*

### Functional Requirements

#### Critical Bug Fixes (P0)

- **FR-001**: System MUST clear all student-specific UI state (color-coded answers, personal feedback) from quiz tables when user logs out and logs in as instructor
- **FR-002**: Quiz tables in instructor mode MUST show only correct answers and choices/tolerance, never the instructor's personal answers from a previous student session
- **FR-003**: Scores modal MUST have z-index high enough to appear above all page content and remain fully interactive (expand/collapse students, close button)
- **FR-004**: "Show student answers" toggle MUST correctly load and display all student answers in a fresh browser session (no prior student login required)
- **FR-005**: "Show student answers" toggle label MUST have sufficient color contrast for readability (minimum WCAG AA contrast ratio 4.5:1)
- **FR-006**: "Export to CSV" button MUST be enabled when student data exists in IndexedDB for current release, regardless of whether user was previously logged in as student
- **FR-007**: System MUST use 24-hour time format (HH:mm:ss) for all displayed timestamps, not 12-hour format with AM/PM

#### Feature Enhancements

- **FR-008**: System MUST poll IndexedDB periodically (every 3-5 seconds) when "Show student answers" is enabled to detect new student submissions without page reload
- **FR-009**: System MUST display new student answers in the instructor view automatically within 5 seconds of submission without requiring manual refresh
- **FR-010**: Instructors MUST be able to filter displayed student answers by individual student selection (multi-select checkbox/dropdown)
- **FR-011**: System MUST persist student filter selections in sessionStorage for the duration of the instructor session
- **FR-012**: System MUST display full ISO 8601 timestamps for all student answer submissions
- **FR-013**: System MUST provide timestamp tooltips showing full date/time when hovering over shortened timestamp displays
- **FR-014**: CSV export MUST include columns: Student Name, Service ID, Page ID, Question Number, Question Text, Student Answer, Correct Answer, Is Correct (boolean), Timestamp (ISO 8601)
- **FR-015**: CSV export MUST properly escape special characters (quotes, commas, newlines) in question text and student answers
- **FR-016**: System MUST handle CSV export of datasets with 100+ students and 50+ questions without freezing the UI
- **FR-017**: "Show student answers" toggle state MUST persist across page navigation within the same instructor session
- **FR-018**: System MUST display analysis table student entries grouped by cell, sorted by submission timestamp (newest first)
- **FR-019**: System MUST show "(No entries yet)" placeholder for analysis cells with no student submissions
- **FR-020**: System MUST limit real-time polling to only when instructor is actively viewing a page (pause when tab is inactive)
- **FR-021**: System MUST provide visual feedback (loading indicator or badge) when new student answers are being loaded

### Key Entities

- **StudentAnswerDisplay**: Represents a rendered student answer in the instructor view, containing student name, service ID (last 4 digits), answer text, correctness indicator, and full timestamp
- **FilterCriteria**: Represents active filtering selections, containing array of selected student service IDs and persistence flag
- **PollingState**: Represents the real-time update mechanism state, including polling interval, active status, and last update timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of session transitions from student to instructor login correctly clear student-specific UI state (no color-coding or personal answers visible)
- **SC-002**: Scores modal is fully interactive with proper z-index in 100% of page contexts
- **SC-003**: "Show student answers" toggle works correctly in 100% of fresh browser sessions (no prior student login required)
- **SC-004**: All instructor UI labels meet WCAG AA contrast requirements (4.5:1 minimum)
- **SC-005**: "Export to CSV" button is enabled when student data exists for 100% of instructor sessions
- **SC-006**: All timestamps display in 24-hour format with no AM/PM markers
- **SC-007**: Instructors can see new student answers appear automatically within 5 seconds of submission without manual page refresh
- **SC-008**: Instructors can filter a page with 30 students down to 3 selected students in under 3 clicks
- **SC-009**: CSV export of 100 students × 50 questions completes and downloads within 10 seconds
- **SC-010**: "Show student answers" toggle state persists correctly across 100% of page navigations within a session
- **SC-011**: Real-time polling has no measurable performance impact on quiz interaction for students (no degradation in answer submission times)
- **SC-012**: 95% of instructors report improved ability to monitor student progress during live sessions (post-deployment survey)
- **SC-013**: Support requests related to instructor mode bugs are reduced by 90% (compared to baseline before P0 fixes)

## Assumptions

- Instructors typically monitor cohorts of 10-30 students during live sessions
- Quiz pages typically contain 5-15 questions
- Analysis tables typically have 3-10 interactive cells
- Instructor sessions typically last 30-120 minutes
- The system will remain offline-first with no network connectivity for the foreseeable future (real-time updates will be implemented via local storage polling, not WebSockets or SSE)
- IndexedDB polling every 3-5 seconds is acceptable from a performance perspective given the offline-first architecture
- CSV files will be opened primarily in Excel, LibreOffice Calc, or Google Sheets
- Timestamps should use browser local time (not UTC) for instructor convenience

## Out of Scope

- Network-based real-time synchronization (WebSockets, Server-Sent Events)
- Advanced analytics dashboard with charts/graphs (remains CSV export only)
- Student identity anonymization features
- Automated grading or feedback suggestions
- Integration with external LMS platforms
- Mobile-optimized instructor interface (desktop browser assumed)
- Instructor collaboration features (shared annotations, comments)
- Historical trend analysis across multiple releases/cohorts
