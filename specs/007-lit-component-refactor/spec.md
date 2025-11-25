# Feature Specification: Lit Component Refactor

**Feature Branch**: `007-lit-component-refactor`
**Created**: 2025-11-25
**Status**: Draft
**Input**: Refactor 59 `document.createElement()` calls in Lit components to use proper Lit declarative templates

## Problem Statement

The codebase contains 59 `document.createElement()` calls inside Lit components, mixing imperative DOM manipulation with Lit's declarative template system:

| File | createElement calls | Creates |
|------|---------------------|---------|
| `qd-instructor-scores.ts` | 22 | Modal overlay, scores table, row expansion |
| `qd-pin-reset-dialog.ts` | 21 | Reset dialog, form, confirmation |
| `qd-login.ts` | 14 | Instructor password modal |
| `qd-instructor-manage.ts` | 1 | Minor element |
| `qd-instructor-export.ts` | 1 | Minor element |

This causes: testing difficulties, bypassed reactivity, memory leak risk, and inconsistent architecture.

## User Scenarios & Testing

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

- **FR-001**: System MUST provide a `<qd-modal>` base component with open/close state management
- **FR-002**: All modals MUST trap keyboard focus while open
- **FR-003**: All modals MUST close on Escape key press (when closable)
- **FR-004**: Backdrop click MUST close modal when `closable` prop is true
- **FR-005**: System MUST maintain zero `document.createElement()` calls in component render methods
- **FR-006**: New components MUST use Lit `html` tagged templates exclusively
- **FR-007**: System MUST preserve existing custom event contracts (`qd:*` events)

### Key Entities

- **Modal**: Overlay container with backdrop, manages open state and focus
- **ScoresModal**: Displays student scores in expandable table format
- **PasswordModal**: Single input for instructor password
- **ConfirmDialog**: Binary confirm/cancel prompt

## Success Criteria

### Measurable Outcomes

- **SC-001**: Zero `document.createElement()` calls in `src/components/**/*.ts`
- **SC-002**: All existing E2E tests pass without modification
- **SC-003**: New components have >80% unit test coverage
- **SC-004**: Bundle size increase < 2KB gzipped
- **SC-005**: No visual regressions (Chromatic baseline maintained)

## Scope

### In Scope
- Create `<qd-modal>` base component
- Extract `<qd-scores-modal>` from qd-instructor-scores.ts
- Extract `<qd-password-modal>` from qd-login.ts
- Extract `<qd-confirm-dialog>` from qd-pin-reset-dialog.ts
- Unit tests for all new components
- Storybook stories for new components

### Out of Scope
- Refactoring enhancers (quiz-table.ts, analysis-table.ts)
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
