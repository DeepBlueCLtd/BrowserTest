# Component Specification

This document provides detailed specifications for all Lit 3 Web Components in the Sonar Quiz System.

## Overview

The system uses a **role-based UI** where the login component determines which interface the user sees:
- **Student Mode**: Quiz interaction interface with progress tracking
- **Instructor Mode**: Control center for viewing student data and managing the system

---

## 1. Login Component (`<qd-login>`)

**Purpose**: Unified authentication for both students and instructors

### UI Structure

```
┌─────────────────────────────────────┐
│  Sonar Quiz System                  │
│                                     │
│  Login Mode:                        │
│  ( ) Student  (•) Instructor        │ ← Radio buttons
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [Password Field]              │  │ ← Instructor mode
│  └──────────────────────────────┘  │
│                                     │
│  Or:                                │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Service ID: [________]        │  │
│  │ Name: [________________]      │  │ ← Student mode
│  └──────────────────────────────┘  │
│                                     │
│         [Login Button]              │
└─────────────────────────────────────┘
```

### Properties
- `mode: 'student' | 'instructor'` - Current login mode (default: 'student')

### Behavior
1. **Radio button selection** switches between student/instructor forms
2. **Student validation**:
   - serviceId: 2-10 alphanumeric characters
   - name: Non-empty string
3. **Instructor validation**:
   - Password hashed with SHA-256
   - Compared against hash from `#instructor.password.hash` element
   - Rate-limited to prevent brute force (5 attempts per 60 seconds)
4. **On successful login**:
   - Creates session via `SessionService.createSession()`
   - If instructor: Also calls `SessionService.unlockInstructor()`
   - Emits `qd:login` custom event
   - Component removes itself from DOM

### Events Emitted
- `qd:login` - Fired on successful authentication
  - `detail: { serviceId, name, release, role: 'student' | 'instructor' }`

### Styling
- Shadow DOM with CSS variables for theming
- Responsive design (mobile-friendly)
- Focus states for accessibility
- Error messages inline below fields

---

## 2. Student Status Panel (`<qd-student-status>`)

**Purpose**: Display quiz progress for logged-in students

### UI Structure

```
┌─────────────────────────────────────┐
│  Welcome, Alice (RN2344)            │
│                                     │
│  Progress: 12/20 (60%)              │
│  Correct: 10/12 (83%)               │
│                                     │
│  Red: 5  Amber: 3  Green: 2         │
│                                     │
│                    [Logout]         │
└─────────────────────────────────────┘
```

### Properties
- `session: SessionData` - Current session information
- `cache: SessionCache` - Quiz progress cache

### Behavior
1. Displays student name and masked serviceId (last 4 digits)
2. Shows aggregate progress (questions attempted/total)
3. Shows accuracy (correct/attempted)
4. Displays R/A/G state counts from navigation
5. **Logout button**:
   - Calls `SessionService.clearSession()`
   - Emits `qd:logout` event
   - Shows login component again

### Events Listened To
- `qd:answer-saved` - Updates progress counts
- `qd:state-changed` - Updates R/A/G counts

### Events Emitted
- `qd:logout` - Fired when user logs out

---

## 3. Instructor Status Panel (`<qd-instructor-status>`)

**Purpose**: Consolidated control center for instructors

### UI Structure

```
┌─────────────────────────────────────┐
│  Instructor Mode                    │
│                                     │
│  [x] Show student answers on page   │ ← Toggle
│                                     │
│  [View All Scores]                  │ ← Opens modal
│  [Export to CSV]                    │
│  [Erase All Data]                   │
│                       [Logout]      │
└─────────────────────────────────────┘
```

### Properties
- `showAnswers: boolean` - Whether to display student answers (default: false)

### Behavior

#### Toggle: Show Student Answers
When **enabled**:
1. Emits `qd:instructor-show-answers` event
2. Quiz/analysis enhancers listen and inject student answer displays
3. Toggle state persists in sessionStorage (key: `qd/instructor/showAnswers`)

When **disabled**:
1. Emits `qd:instructor-hide-answers` event
2. Enhancers remove student answer displays

#### Button: View All Scores
1. Queries IndexedDB for all student records (current release)
2. Opens `<qd-scores-modal>` component
3. Passes student data via property

#### Button: Export to CSV
1. Queries IndexedDB for all student records
2. Calls CSV export service
3. Triggers browser download of `sonar-quiz-export.csv`

#### Button: Erase All Data
1. Shows confirmation dialog: "Are you sure? This will permanently delete all student data."
2. If confirmed:
   - Clears IndexedDB (`SonarQuizDB`)
   - Clears sessionStorage
   - Clears localStorage
   - Emits `qd:data-cleared` event
   - Reloads page

#### Button: Logout
1. Calls `SessionService.clearSession()`
2. Emits `qd:logout` event
3. Shows login component again

### Events Emitted
- `qd:instructor-show-answers` - Toggle answers ON
- `qd:instructor-hide-answers` - Toggle answers OFF
- `qd:data-cleared` - All data erased
- `qd:logout` - User logged out

---

## 4. Scores Modal (`<qd-scores-modal>`)

**Purpose**: Display all student scores with expandable per-page breakdown

### UI Structure

```
┌─────────────────────────────────────────────────┐
│  All Student Scores                    [X]      │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ▶ Alice (2344)    15/20 (75%)             │ │
│  ├───────────────────────────────────────────┤ │
│  │ ▼ Bob (5678)      18/20 (90%)             │ │
│  │   ├─ gram-1: 3/3 (100%) ✓                 │ │
│  │   ├─ gram-2: 2/3 (67%)  ✗                 │ │
│  │   └─ vocab-1: 3/3 (100%) ✓                │ │
│  ├───────────────────────────────────────────┤ │
│  │ ▶ Charlie (9999)   8/15 (53%)             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│                             [Close]             │
└─────────────────────────────────────────────────┘
```

### Properties
- `students: StudentSummary[]` - Array of student data
- `open: boolean` - Modal visibility

### Behavior
1. **Modal overlay**: Click outside or press `Esc` to close
2. **Student rows**: Click to expand/collapse per-page breakdown
3. **Per-page breakdown**:
   - PageId: answered/total (percentage)
   - ✓ if complete (all correct), ✗ if incomplete
4. **Sorting**: Students sorted by serviceId (ascending)

### Events Emitted
- `qd:modal-closed` - Modal was closed

### Accessibility
- Focus trap when open
- Escape key closes modal
- ARIA attributes (role="dialog", aria-modal="true")

---

## 5. Quiz Table Enhancement

**Purpose**: Add interactive controls to DITA quiz tables

### Student Mode

For each question row:
1. **MCQ**: Render radio buttons for each option
2. **Numeric**: Render number input field
3. **Submit button** (or auto-submit on change)
4. Display feedback (correct/incorrect) after submission
5. Save answer to IndexedDB

### Instructor Mode (showAnswers = true)

After each question's input control, inject a `<div class="qd-student-answers">`:

```html
<div class="qd-student-answers">
  <div class="qd-student-answer qd-correct">
    Alice (2344): A <span class="qd-timestamp">Nov 16, 10:30</span>
  </div>
  <div class="qd-student-answer qd-incorrect">
    Bob (5678): C <span class="qd-timestamp">Nov 16, 11:15</span>
  </div>
</div>
```

**Styling**:
- `.qd-correct`: Green text (#28a745)
- `.qd-incorrect`: Red text (#dc3545)
- `.qd-timestamp`: Gray, smaller font

---

## 6. Analysis Table Enhancement

**Purpose**: Make analysis tables editable

### Student Mode

1. Cells **without** `background-color` style → `contenteditable="true"`
2. Cells **with** `background-color` → read-only
3. Auto-save on `blur` event (debounced 500ms)
4. Save to IndexedDB with cell key format: `R{row}C{col}#f:{hash}`

### Instructor Mode (showAnswers = true)

Show comparison table below the original table with all student entries.

---

## 7. Home Page Badges

**Purpose**: R/A/G state indicators on navigation links

### Behavior
1. Find all links with class `quizPageBtn`
2. Extract `pageId` from `href` or `data-page-id` attribute
3. Query session cache for page state
4. Inject badge element:

```html
<a href="page.html" class="quizPageBtn">
  Grammar Quiz 1
  <span class="qd-badge qd-badge-green">G</span>
</a>
```

**Badge Colors**:
- Red (unstarted): `background: #dc3545`
- Amber (incomplete): `background: #ffc107`
- Green (complete): `background: #28a745`

**Updates**:
- Listen to `qd:answer-saved` events
- Recalculate state and update badge

---

## Event Flow Diagram

```
Login
  ├─> qd:login (role=student) ─> Show <qd-student-status>
  └─> qd:login (role=instructor) ─> Show <qd-instructor-status>

Instructor Toggle
  ├─> qd:instructor-show-answers ─> Inject student answer divs
  └─> qd:instructor-hide-answers ─> Remove student answer divs

Quiz Interaction
  └─> Answer submitted ─> qd:answer-saved ─> Update badges & status panel

Logout
  └─> qd:logout ─> Clear session ─> Show <qd-login>
```

---

## CSS Architecture

### CSS Variables (Defined in Shadow DOM)

```css
:host {
  --qd-color-red: #dc3545;
  --qd-color-amber: #ffc107;
  --qd-color-green: #28a745;
  --qd-color-primary: #007bff;
  --qd-color-text: #212529;
  --qd-color-border: #dee2e6;
  --qd-spacing-sm: 0.5rem;
  --qd-spacing-md: 1rem;
  --qd-spacing-lg: 1.5rem;
  --qd-font-family: system-ui, -apple-system, sans-serif;
}
```

### Global Styles (Injected into Light DOM)

Only for elements that cannot use Shadow DOM (badges, answer divs):

```css
.qd-badge { /* R/A/G badges */ }
.qd-student-answers { /* Answer container */ }
.qd-student-answer { /* Individual answer */ }
.qd-correct { color: var(--qd-color-green); }
.qd-incorrect { color: var(--qd-color-red); }
```

---

## Testing Strategy

### Unit Tests (Vitest)
- Component rendering with different props
- Event emission verification
- State management (toggle, expansion)

### Storybook Stories
- Login component (student/instructor modes)
- Status panels with mock data
- Scores modal with expandable students
- Isolated component development

### E2E Tests (Playwright)
- Full login → quiz → logout flow
- Instructor mode: toggle answers, view scores
- Data erasure confirmation

---

## Accessibility Requirements

All components must meet **WCAG 2.1 Level AA**:

1. **Keyboard Navigation**: All interactive elements reachable via Tab
2. **Focus Indicators**: Visible focus states
3. **ARIA Labels**: Proper labeling for screen readers
4. **Color Contrast**: Minimum 4.5:1 for text
5. **Error Messages**: Associated with form fields via `aria-describedby`
6. **Modal Focus Trap**: Focus stays within modal when open
7. **Live Regions**: Status updates announced to screen readers
