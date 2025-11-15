# Feature Specification: Sonar Quiz System

**Feature Branch**: `001-sonar-quiz-system`
**Created**: 2025-11-11
**Status**: Draft
**Input**: User description: "Interactive self-test and analysis capture system for offline DITA-published training materials with student progress tracking and instructor review capabilities"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student Takes Interactive Quiz (Priority: P1)

A sonar operator student opens the training document from their local DVD/file system, logs in with their service ID and name, navigates through instructional content, and completes quiz questions on each page. Their answers are automatically saved locally and they can see immediate visual feedback on their progress through color-coded status indicators.

**Why this priority**: Core functionality that delivers immediate value to students for self-assessment and learning reinforcement. This is the primary use case that justifies the entire system.

**Independent Test**: Can be fully tested by opening a local HTML file with quiz tables, entering answers, and verifying that responses are saved and status indicators update correctly.

**Acceptance Scenarios**:

1. **Given** a student opens a training document for the first time, **When** they access any page with quiz content, **Then** they are prompted to log in with their name and service ID
2. **Given** a logged-in student viewing a quiz page, **When** they select an answer from a multiple-choice dropdown, **Then** the answer is immediately saved and the page status updates
3. **Given** a student has answered some questions on a page, **When** they navigate away and return, **Then** their previous answers are still visible and editable
4. **Given** a student completes all questions correctly on a page, **When** the last answer is saved, **Then** the status panel shows "Complete" with green coloring

---

### User Story 2 - Student Reviews Overall Progress (Priority: P2)

A student wants to track their learning progress across the entire training document. From the home page, they can see color-coded badges on each section link showing whether they haven't started (red), are in progress (amber), or have completed (green) each section.

**Why this priority**: Provides essential progress tracking that motivates continued learning and helps students identify areas needing more work.

**Independent Test**: Can be tested by completing various quiz pages to different states and verifying the home page badges reflect the correct status for each linked section.

**Acceptance Scenarios**:

1. **Given** a student on the home page, **When** they view links with class "quizPageBtn", **Then** each link displays a colored badge indicating quiz completion status
2. **Given** a student has completed some quiz pages, **When** they return to the home page after 5 minutes of activity, **Then** the badges accurately reflect current completion states
3. **Given** a student's session expires after 30 minutes, **When** they log back in, **Then** the progress badges are rebuilt from stored data

---

### User Story 3 - Instructor Reviews Student Answers (Priority: P3)

An instructor needs to review how students performed on quizzes to identify knowledge gaps. After entering an instructor password, they can see the correct answers alongside each student's submitted answers with color coding to indicate correct (green) or incorrect (red) responses.

**Why this priority**: Critical for instructors to assess class understanding and provide targeted remediation, but not required for basic student self-assessment functionality.

**Independent Test**: Can be tested by entering instructor password and verifying that correct answers become visible with student answer comparisons displayed.

**Acceptance Scenarios**:

1. **Given** an instructor viewing a quiz page, **When** they enter the correct unlock password, **Then** correct answers are revealed next to each question
2. **Given** an unlocked instructor view with student data present, **When** viewing a quiz question, **Then** a compact table shows each student's answer with color coding for correctness
3. **Given** an instructor in unlock mode, **When** viewing the scores page, **Then** they see all students listed with attempt counts, correct counts, and percentages

---

### User Story 4 - Student Captures Analysis Notes (Priority: P4)

A student working through analysis exercises needs to record their observations and calculations in structured tables. They can enter text in designated cells of analysis tables, with their entries automatically saved and persisting between sessions.

**Why this priority**: Extends system beyond quiz functionality to support open-ended analysis work, valuable but not essential for core self-assessment.

**Independent Test**: Can be tested by entering text in analysis table cells and verifying data persists after page reload.

**Acceptance Scenarios**:

1. **Given** a student viewing a page with an analysis table, **When** they type text in an editable cell, **Then** the entry is automatically saved to local storage
2. **Given** a student has entered analysis data, **When** they log out and log back in, **Then** their previous entries are restored in the table
3. **Given** an instructor in unlock mode viewing analysis tables, **When** they review a cell with student entries, **Then** they see a compact view of all student inputs for that cell

---

### User Story 5 - Instructor Manages Class Cohorts (Priority: P5)

An instructor needs to prepare the system for a new class cohort by exporting previous class results and completely clearing all stored student data to provide a clean environment for the next group.

**Why this priority**: Essential for classroom management but only needed between cohorts, not for day-to-day usage.

**Independent Test**: Can be tested by exporting data to CSV, erasing all data with confirmation, and verifying the system returns to initial empty state.

**Acceptance Scenarios**:

1. **Given** an instructor on the scores page, **When** they click "Export CSV", **Then** a downloadable file is generated with all student quiz results
2. **Given** an instructor wants to clear data, **When** they click "Erase all data" and type "DELETE ALL" confirmation, **Then** all student records are permanently removed
3. **Given** data has been erased, **When** any open browser tabs refresh, **Then** they show the blank initial state with no student data

---

### Edge Cases

- What happens when a student's session expires while actively answering questions?
- How does the system handle concurrent access from the same service ID in multiple browser tabs?
- What occurs if browser storage quota is exceeded?
- How are malformed quiz tables handled during runtime validation?
- What happens if an instructor password is entered incorrectly multiple times?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST operate completely offline from local file:// URLs without any network connectivity
- **FR-002**: System MUST prompt users to log in with name and service ID on first access
- **FR-003**: System MUST maintain user sessions for 30 minutes of inactivity using browser session storage
- **FR-004**: System MUST automatically save quiz answers immediately upon selection/input without requiring explicit save action
- **FR-005**: System MUST display visual progress indicators using red/amber/green color coding for unstarted/incomplete/complete states
- **FR-006**: System MUST support both multiple-choice questions (with 1-indexed ordered lists) and numeric questions (with tolerance values)
- **FR-007**: System MUST validate quiz table structure at runtime and display clear error messages for authoring violations
- **FR-008**: System MUST persist all student data in browser local storage that survives browser restarts
- **FR-009**: System MUST allow instructors to unlock correct answers using a password
- **FR-010**: System MUST display all student answers alongside correct answers in instructor mode with success/failure color coding
- **FR-011**: System MUST support editable analysis tables where cells without background colors become text input fields
- **FR-012**: System MUST generate unique keys for analysis cells using row/column position and content hash
- **FR-013**: System MUST allow instructors to export quiz results in CSV format
- **FR-014**: System MUST provide complete data erasure capability with typed confirmation ("DELETE ALL")
- **FR-015**: System MUST rebuild session cache from persistent storage upon user login
- **FR-016**: System MUST display color-coded badges on home page links reflecting quiz completion status
- **FR-017**: System MUST enforce maximum one quiz table and one analysis table per page
- **FR-018**: System MUST store data using composite keys in format "qd/{release}/u{serviceId}"
- **FR-019**: System MUST calculate page state as complete only when all questions are answered correctly
- **FR-020**: System MUST clear session data and cache upon logout or session expiry

### Key Entities *(include if feature involves data)*

- **Student Record**: Represents a learner's complete progress including service ID, name, and all page attempts with answers and timestamps
- **Page Data**: Contains quiz answers array, analysis cell values, attempt timestamps, and calculated completion state for a specific page
- **Quiz Answer**: Individual response to a question including the answer value and success boolean indicating correctness
- **Analysis Entry**: Text input captured in a specific analysis table cell, identified by unique cell key
- **Session Cache**: Temporary storage of page states and progress totals, rebuilt from persistent storage on login

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can complete login and start answering quiz questions within 30 seconds of opening the document
- **SC-002**: All quiz answers are saved to local storage within 200 milliseconds of user input
- **SC-003**: System loads and displays quiz pages with up to 50 questions in under 2 seconds on reference hardware
- **SC-004**: Color-coded progress indicators update immediately (under 100ms) after answer submission
- **SC-005**: 95% of students successfully complete self-assessment without technical support
- **SC-006**: Instructor can review a class of 30 students' quiz results within 5 minutes
- **SC-007**: CSV export of 1000 quiz responses completes in under 3 seconds
- **SC-008**: System maintains full functionality when offline for 90 days between uses
- **SC-009**: Data erasure for cohort reset completes within 10 seconds with confirmation
- **SC-010**: Browser storage usage remains under 10MB for typical student with 100 completed quizzes

## Scope & Constraints *(mandatory)*

### In Scope
- Interactive quiz functionality with multiple-choice and numeric questions
- Student progress tracking with visual indicators
- Instructor review and answer reveal capabilities
- Analysis table data capture
- CSV export of quiz results
- Complete data management including erasure
- Offline operation from local file system

### Out of Scope
- Network connectivity or server synchronization
- User authentication beyond local name/service ID
- Automated grading or scoring algorithms
- Content authoring tools or DITA integration
- Analysis table validation or correctness checking
- Multimedia content (audio/video) in quizzes
- Multi-language support
- Accessibility features beyond basic keyboard navigation

### Constraints
- Must work entirely offline from file:// URLs
- Must integrate with existing DITA-published HTML without modifying publishing workflow
- Cannot require installation or browser plugins
- Must support quarterly document releases with data isolation
- Limited to browsers supporting IndexedDB and sessionStorage
- Must maintain under 25KB compressed bundle size

## Assumptions *(mandatory)*

### Technical Assumptions
- Users have modern browsers (Chrome/Edge/Firefox) with JavaScript enabled
- Local file system access is permitted by browser security policies
- IndexedDB storage quota of at least 50MB is available
- Browsers retain local storage between sessions
- System clock is reasonably accurate for timestamps

### User Assumptions
- Students have basic computer literacy and can navigate web documents
- Service IDs are unique within a training cohort
- Instructors have access to unlock password through secure channels
- Users will close/refresh browser to trigger session timeout
- One student uses one device for the duration of training

### Document Assumptions
- DITA publishing consistently produces expected HTML structure
- Quiz tables follow strict 3-column format
- MCQ options are provided as ordered lists
- Page IDs remain stable across document versions
- Maximum one quiz and one analysis table per page

## Dependencies *(include when applicable)*

### External Dependencies
- Oxygen XML Editor for DITA content authoring
- DITA-OT publishing pipeline for HTML generation
- Modern web browser with ES6+ JavaScript support
- Local file system access permissions

### Document Structure Dependencies
- Consistent use of CSS classes (qd-quiz, qd-page, qd-analysis)
- Presence of element with id="qd-status" for status panel
- Links with class="quizPageBtn" for progress badges
- Stable page IDs for data association