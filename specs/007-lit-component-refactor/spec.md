# Feature Specification: Lit Component Refactor & Testability Improvements

**Feature Branch**: `007-lit-component-refactor`
**Created**: 2025-11-25
**Status**: Draft
**Input**: Refactor createElement calls to Lit templates + extract business logic into testable helpers

## Problem Statement

### Issue 1: Imperative DOM in Declarative Components

The codebase contains 59 `document.createElement()` calls inside Lit components, mixing imperative DOM manipulation with Lit's declarative template system:

| File | createElement calls | Creates |
|------|---------------------|---------|
| `qd-instructor-scores.ts` | 22 | Modal overlay, scores table, row expansion |
| `qd-pin-reset-dialog.ts` | 21 | Reset dialog, form, confirmation |
| `qd-login.ts` | 14 | Instructor password modal |
| `qd-instructor-manage.ts` | 1 | Minor element |
| `qd-instructor-export.ts` | 1 | Minor element |

This causes: testing difficulties, bypassed reactivity, memory leak risk, and inconsistent architecture.

### Issue 2: Business Logic Embedded in Components

Business logic is currently mixed with Lit lifecycle and DOM manipulation, making unit testing difficult:

| File | Logic Type | Location | Extraction Potential |
|------|-----------|----------|---------------------|
| `qd-login.ts` | Form validation | Lines 704-719 | **HIGH** |
| `qd-login.ts` | PIN sanitization | Lines 694-699 | **HIGH** |
| `qd-status.ts` | R/A/G indicator | Lines 244-248 | **HIGH** |
| `storage-service.ts` | Totals recalc | Lines 115-126 | **HIGH** |
| `session.ts` | Expiry check | Lines 105-115 | **HIGH** |
| `scores-service.ts` | Percentage calc | Multiple | **HIGH** |
| `quiz-table.ts` | Answer display | Lines 725-795 | **MEDIUM** |

Extracting these into pure helper functions enables comprehensive unit testing without DOM or Lit dependencies.

## User Scenarios & Testing

### User Story 0a - Validation & Calculation Helpers (Priority: P0)

Extract core validation and calculation logic into pure helper functions for easy unit testing.

**Why this priority**: Foundation work. Pure functions can be tested immediately, improving coverage before component refactoring begins.

**Independent Test**: Create helper modules with 100% unit test coverage. No component changes required initially.

**New Files**:
- `src/utils/validation-helpers.ts` - Form validation, input sanitization
- `src/utils/calculation-helpers.ts` - Totals, percentages, session expiry

**Functions to Extract**:

```typescript
// validation-helpers.ts
validateStudentForm(name: string, serviceId: string, pin: string): string[]
sanitizePinInput(input: string): string
validatePinMatch(pin: string, confirmPin: string): boolean

// calculation-helpers.ts
calculateStatusIndicator(total: number, correct: number): 'red' | 'amber' | 'green'
calculatePercentage(correct: number, attempted: number): number
recalculateTotalsFromPages(pages: Record<PageId, PageData>): { attempted: number; correct: number }
isSessionExpired(expiresAt: string, now?: Date): boolean
maskServiceId(serviceId: string, visibleDigits?: number): string
```

**Acceptance Scenarios**:

1. **Given** `validateStudentForm('', 'AB12', '1234')`, **When** called, **Then** returns `['Name required']`
2. **Given** `calculateStatusIndicator(10, 10)`, **When** called, **Then** returns `'green'`
3. **Given** `calculateStatusIndicator(10, 5)`, **When** called, **Then** returns `'amber'`
4. **Given** `calculateStatusIndicator(10, 0)`, **When** called, **Then** returns `'red'`
5. **Given** `isSessionExpired('2025-01-01T00:00:00Z', new Date('2025-01-02'))`, **When** called, **Then** returns `true`
6. **Given** `calculatePercentage(5, 0)`, **When** called, **Then** returns `0` (not NaN/Infinity)

---

### User Story 0b - Enhancer Logic Extraction (Priority: P0)

Extract display formatting and input specification logic from enhancers into testable services.

**Why this priority**: Enables testing complex quiz/analysis table logic without DOM setup.

**Independent Test**: Create service modules with unit tests. Integrate with enhancers after tests pass.

**New Files**:
- `src/services/question-input.ts` - Question input spec generation
- `src/services/answer-display.ts` - Student answer formatting

**Functions to Extract**:

```typescript
// question-input.ts
interface QuestionInputSpec {
  type: 'select' | 'text';
  value: string;
  options?: string[];
  placeholder?: string;
}
getQuestionInputSpec(question: QuizQuestion, existingAnswer?: AnswerRecord): QuestionInputSpec

// answer-display.ts
interface StudentAnswerDisplay {
  name: string;
  serviceIdLast4: string;
  answer: string;
  success: boolean;
  formattedTimestamp: string;
}
formatStudentAnswersForDisplay(students: StudentRecord[], pageId: string, questionIndex: number): StudentAnswerDisplay[]
```

**Acceptance Scenarios**:

1. **Given** MCQ question with options ['A','B','C'], **When** `getQuestionInputSpec()` called, **Then** returns `{type: 'select', options: ['A','B','C']}`
2. **Given** numeric question, **When** `getQuestionInputSpec()` called, **Then** returns `{type: 'text', placeholder: 'Enter number'}`
3. **Given** student with answer on page, **When** `formatStudentAnswersForDisplay()` called, **Then** returns formatted display object

---

### User Story 1 - Reusable Modal Base Component (Priority: P1)

Developers need a consistent modal pattern. Currently, each component creates its own modal overlay with duplicated code for backdrop, positioning, close handling, and keyboard events.

**Why this priority**: Foundation for all other modal components. Eliminates ~50% of createElement calls.

**Independent Test**: Create `<qd-modal>` component with tests. Can be demonstrated in Storybook independently before integrating into existing components.

**Acceptance Scenarios**:

1. **Given** a parent component, **When** it renders `<qd-modal open>`, **Then** a centered overlay with backdrop appears
2. **Given** an open modal, **When** user presses Escape, **Then** `qd:modal-close` event fires and modal closes
3. **Given** an open modal, **When** user clicks backdrop, **Then** modal closes (if `closable` prop is true)
4. **Given** an open modal, **When** focus moves, **Then** focus stays trapped within modal content

---

### User Story 2 - Scores Modal Extraction (Priority: P2)

The instructor scores display (`qd-instructor-scores.ts`) has 22 createElement calls building a complex table with expandable rows. This should be a proper Lit component.

**Why this priority**: Largest concentration of createElement calls. High-value target.

**Independent Test**: Replace scores modal rendering with `<qd-scores-modal>`. Verify via existing E2E test `instructor-review.spec.ts` that "View All Scores" functionality works.

**Acceptance Scenarios**:

1. **Given** instructor is logged in, **When** they click "View All Scores", **Then** `<qd-scores-modal>` renders with student data
2. **Given** scores modal is open, **When** user clicks a student row, **Then** row expands to show per-page breakdown
3. **Given** scores modal is open, **When** user presses Escape, **Then** modal closes

---

### User Story 3 - Password Modal Extraction (Priority: P2)

The instructor password modal in `qd-login.ts` (14 createElement calls) should use `<qd-modal>` base.

**Why this priority**: Medium complexity, good test case for modal reuse.

**Independent Test**: Replace password modal with `<qd-password-modal>`. Verify via E2E test `dita-instructor-flow.spec.ts`.

**Acceptance Scenarios**:

1. **Given** login form displayed, **When** user clicks "Instructor", **Then** `<qd-password-modal>` opens
2. **Given** password modal open, **When** user enters password and submits, **Then** `qd:password-submit` event fires
3. **Given** password modal open, **When** user presses Escape, **Then** modal closes

---

### User Story 4 - Confirmation Dialog (Priority: P3)

The PIN reset dialog (`qd-pin-reset-dialog.ts`, 21 calls) and data erase confirmation need a reusable confirm/cancel pattern.

**Why this priority**: Lower urgency but completes the modal extraction.

**Independent Test**: Create `<qd-confirm-dialog>`. Replace PIN reset confirmation with it.

**Acceptance Scenarios**:

1. **Given** destructive action requested, **When** `<qd-confirm-dialog>` shown, **Then** user sees confirm/cancel buttons
2. **Given** confirm dialog open, **When** user clicks Confirm, **Then** `qd:confirm` event fires
3. **Given** confirm dialog open, **When** user clicks Cancel, **Then** `qd:cancel` event fires and dialog closes

---

### Edge Cases

- What happens when modal opens while another is already open? (Should stack or replace?)
- How does system handle rapid open/close? (Debounce animations)
- What if modal content exceeds viewport height? (Scroll within modal)

## Requirements

### Functional Requirements

**Helper Extraction (US0a, US0b)**:
- **FR-001**: System MUST provide `validation-helpers.ts` with pure form validation functions
- **FR-002**: System MUST provide `calculation-helpers.ts` with pure calculation functions
- **FR-003**: All helper functions MUST be pure (no side effects, no DOM access)
- **FR-004**: Helper functions MUST have 100% unit test coverage
- **FR-005**: Components/services MUST be refactored to use extracted helpers (no duplication)

**Modal Components (US1-US4)**:
- **FR-006**: System MUST provide a `<qd-modal>` base component with open/close state management
- **FR-007**: All modals MUST trap keyboard focus while open
- **FR-008**: All modals MUST close on Escape key press (when closable)
- **FR-009**: Backdrop click MUST close modal when `closable` prop is true
- **FR-010**: System MUST maintain zero `document.createElement()` calls in component render methods
- **FR-011**: New components MUST use Lit `html` tagged templates exclusively
- **FR-012**: System MUST preserve existing custom event contracts (`qd:*` events)

### Key Entities

**Helper Modules**:
- **validation-helpers**: Form validation, input sanitization, PIN validation
- **calculation-helpers**: Status indicators, percentages, totals, session expiry
- **question-input**: Question input specification generation
- **answer-display**: Student answer formatting for display

**Modal Components**:
- **Modal**: Overlay container with backdrop, manages open state and focus
- **ScoresModal**: Displays student scores in expandable table format
- **PasswordModal**: Single input for instructor password
- **ConfirmDialog**: Binary confirm/cancel prompt

## Success Criteria

### Measurable Outcomes

**Helper Extraction (Phase 0)**:
- **SC-001**: Helper modules have 100% unit test coverage (lines, branches)
- **SC-002**: Zero code duplication - all instances use shared helpers
- **SC-003**: All helper functions are pure (verified by tests with no mocks)

**Modal Components (Phase 1-2)**:
- **SC-004**: Zero `document.createElement()` calls in `src/components/**/*.ts`
- **SC-005**: All existing E2E tests pass without modification
- **SC-006**: New components have >80% unit test coverage
- **SC-007**: Bundle size increase < 2KB gzipped
- **SC-008**: No visual regressions (Chromatic baseline maintained)

**Overall**:
- **SC-009**: Unit test coverage increases by ≥15% for affected files
- **SC-010**: No new lint errors or type errors introduced

## Scope

### In Scope

**Phase 0 - Helper Extraction**:
- Create `src/utils/validation-helpers.ts` with form validation functions
- Create `src/utils/calculation-helpers.ts` with calculation functions
- Create `src/services/question-input.ts` with input spec generation
- Create `src/services/answer-display.ts` with display formatting
- Unit tests for all helper modules (100% coverage target)
- Refactor components/services to use new helpers

**Phase 1-2 - Modal Components**:
- Create `<qd-modal>` base component
- Extract `<qd-scores-modal>` from qd-instructor-scores.ts
- Extract `<qd-password-modal>` from qd-login.ts
- Extract `<qd-confirm-dialog>` from qd-pin-reset-dialog.ts
- Unit tests for all new components
- Storybook stories for new components

### Out of Scope
- Refactoring enhancers beyond extracting pure logic (quiz-table.ts DOM code stays)
- Changing visual design or styling
- Adding new user-facing features
- Modifying existing event contracts

## Dependencies

- Lit 3.x (existing)
- Existing component test patterns
- Storybook for development

## Risks

| Risk | Mitigation |
|------|------------|
| Breaking existing flows | Run E2E suite after each component extraction |
| Event contract changes | Audit events before/after, maintain signatures |
| CSS scoping issues | Keep all styles in Shadow DOM |
| Focus management bugs | Test with keyboard-only navigation |
