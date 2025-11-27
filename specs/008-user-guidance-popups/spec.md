# Feature Specification: User Guidance Popups

**Feature Branch**: `008-user-guidance-popups`
**Created**: 2025-11-27
**Status**: Draft
**Input**: GitHub Issue #55 - Add user guidance popup to Login, Status Panel and Instructor Panel components

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New Student Orientation (Priority: P1)

A first-time student opens the quiz application and sees a help icon on the login panel. Clicking it reveals a popup explaining what the application does, how to log in as a student, and the basic workflow they can expect.

**Why this priority**: First-time users need immediate context to understand the application purpose and how to begin. Without this, users may abandon the application or make incorrect login choices.

**Independent Test**: Can be fully tested by loading the login panel, clicking the help icon, and verifying the popup displays orientation content. Delivers immediate value for new user onboarding.

**Acceptance Scenarios**:

1. **Given** a user views the login panel, **When** they click the help icon, **Then** a popup appears with application introduction and student login guidance
2. **Given** the guidance popup is open, **When** the user clicks outside the popup or presses Escape, **Then** the popup closes
3. **Given** the guidance popup is open, **When** the user reads the content, **Then** they see author contact details for support

---

### User Story 2 - Student Score Understanding (Priority: P2)

A logged-in student views their status panel and wants to understand what the score numbers mean and how the colored quiz buttons relate to their progress. They click a help icon to see explanations.

**Why this priority**: Students need to understand the scoring system to effectively track their progress. This directly impacts learning outcomes and user satisfaction.

**Independent Test**: Can be tested by logging in as a student, viewing the status panel, clicking the help icon, and verifying scoring mechanics are explained.

**Acceptance Scenarios**:

1. **Given** a student is logged in and viewing the status panel, **When** they click the help icon, **Then** a popup explains that scores reflect only pages visited
2. **Given** the status panel guidance popup is open, **When** the student reads the content, **Then** they understand the green/amber/red button shading meanings
3. **Given** the status panel guidance popup is open, **When** the student reads the content, **Then** they understand how scores are calculated and tracked

---

### User Story 3 - Instructor Feature Discovery (Priority: P2)

An instructor logs in and sees the instructor panel with various buttons. They click a help icon to learn what each feature does: viewing aggregate scores, reviewing current-page answers, exporting data, and clearing the database for new cohorts.

**Why this priority**: Instructors have more complex features that aren't immediately obvious. Understanding these capabilities enables effective class management.

**Independent Test**: Can be tested by logging in as instructor, viewing the instructor panel, clicking the help icon, and verifying all features are documented.

**Acceptance Scenarios**:

1. **Given** an instructor is logged in and viewing the instructor panel, **When** they click the help icon, **Then** a popup explains how to view aggregate student scores
2. **Given** the instructor guidance popup is open, **When** the instructor reads the content, **Then** they understand how to navigate and review answers on the current page
3. **Given** the instructor guidance popup is open, **When** the instructor reads the content, **Then** they understand how to export data to CSV
4. **Given** the instructor guidance popup is open, **When** the instructor reads the content, **Then** they understand how and when to clear the database for new student cohorts

---

### Edge Cases

- What happens when popup content exceeds visible viewport? (Should scroll within popup)
- How does the popup behave on very small screens? (Should remain readable and dismissible)
- What happens if user rapidly opens/closes popup? (Should handle gracefully without visual glitches)
- What happens when user has keyboard focus? (Help icon should be keyboard accessible)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a help icon on the login panel that triggers a guidance popup when activated
- **FR-002**: System MUST display a help icon on the student status panel that triggers a guidance popup when activated
- **FR-003**: System MUST display a help icon on the instructor status panel that triggers a guidance popup when activated
- **FR-004**: All guidance popups MUST include author contact details for support inquiries
- **FR-005**: Guidance popups MUST be dismissible by clicking outside, pressing Escape, or clicking a close button
- **FR-006**: Login panel guidance MUST explain the application purpose and distinguish between student and instructor login paths
- **FR-007**: Student status panel guidance MUST explain that scores reflect only visited pages
- **FR-008**: Student status panel guidance MUST explain the meaning of quiz button color shading (red/amber/green)
- **FR-009**: Student status panel guidance MUST explain how score tracking works
- **FR-010**: Instructor panel guidance MUST explain how to view aggregate student scores and responses
- **FR-011**: Instructor panel guidance MUST explain how to review answers on the current page
- **FR-012**: Instructor panel guidance MUST explain how to export data to CSV format
- **FR-013**: Instructor panel guidance MUST explain how to clear the database for new student cohorts
- **FR-014**: Help icons MUST be keyboard accessible (focusable and activatable via Enter/Space)
- **FR-015**: Guidance popup content MUST be configurable via DITA parameters and processed through XSL stylesheet
- **FR-016**: System MUST support custom help content injection without code changes

### Key Entities

- **GuidancePopup**: A modal overlay containing contextual help text, dismissible via multiple methods, positioned relative to triggering help icon
- **HelpContent**: Structured text content including title, body paragraphs, and optional contact details; sourced from DITA configuration
- **HelpTrigger**: An accessible button/icon that opens the associated guidance popup

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: First-time users can understand the application purpose and login process within 30 seconds of viewing the login panel guidance
- **SC-002**: 95% of students can correctly explain what their score represents after reading status panel guidance
- **SC-003**: Instructors can locate and understand all four instructor panel features (scores, answers, export, clear) within 60 seconds of reading guidance
- **SC-004**: All guidance popups open and close within 200ms of user action
- **SC-005**: Help icons are discoverable - users can locate and activate them without external instruction
- **SC-006**: Guidance content can be updated by authors without developer intervention (via DITA parameters)
- **SC-007**: All help interactions are accessible via keyboard navigation only

## Assumptions

- Help icons will use a universally recognized icon (e.g., question mark or "i" info symbol)
- Popup styling will match existing application theme (Shadow DOM isolation)
- Help content will be brief and scannable (not lengthy documentation)
- Contact details format will be a simple text field (email or support link)
- DITA parameter names and XSL processing follow existing project patterns
- Popups will not persist state between sessions (no "don't show again" option required)
