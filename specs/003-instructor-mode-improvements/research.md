# Phase 0: Research & Technical Decisions

**Feature**: Instructor Mode Improvements
**Date**: 2025-11-19
**Status**: Complete

## Research Topics Identified

Based on the Technical Context review, all technologies are already established in the BrowserTest codebase:
- TypeScript/Lit 3.0 patterns are in use
- IndexedDB/sessionStorage patterns are established
- Testing infrastructure (Vitest/Playwright) is configured

However, specific implementation approaches need research for the bug fixes:

### 1. UI State Management Between Sessions

**Decision**: Clear component state in logout handler
**Rationale**: Student-specific UI state persists because components aren't properly cleaning up on logout
**Alternatives considered**:
- Force page reload on logout - Rejected: Poor UX, breaks SPA pattern
- Clear all sessionStorage - Rejected: Too broad, might affect other features
- Component-level cleanup - Chosen: Targeted fix, maintains other state

**Implementation approach**:
- Add cleanup method to quiz-table enhancer to reset color-coded feedback
- Clear student-specific data from components on `qd:logout` event
- Reset instructor toggle state to match fresh session behavior

### 2. Modal Z-Index Issues

**Decision**: Use CSS custom property for z-index management
**Rationale**: Scores modal appears behind page content due to stacking context issues
**Alternatives considered**:
- Fixed high z-index (9999) - Rejected: Brittle, can still conflict
- Portal pattern - Rejected: Requires DOM restructuring
- CSS custom property - Chosen: Configurable, follows existing patterns

**Implementation approach**:
- Define `--qd-modal-z-index: 10000` in shared styles
- Apply to modal overlay with `z-index: var(--qd-modal-z-index)`
- Ensure modal is appended to document.body, not nested in other elements

### 3. Fresh Session Data Loading

**Decision**: Load IndexedDB data on toggle change, not just on mount
**Rationale**: Toggle assumes data is already loaded from previous student session
**Alternatives considered**:
- Always preload all data - Rejected: Performance impact
- Load on instructor login - Rejected: Might not have toggled yet
- Load on toggle enable - Chosen: Just-in-time loading

**Implementation approach**:
- In toggle change handler, check if data is loaded
- If not loaded and toggle enabled, fetch from IndexedDB
- Cache loaded data in component for subsequent toggles

### 4. CSV Export Button State

**Decision**: Check IndexedDB directly for data, not sessionStorage
**Rationale**: Button state relies on cached data that might not exist in fresh session
**Alternatives considered**:
- Always enable button - Rejected: Poor UX if no data exists
- Check on every render - Rejected: Performance impact
- Check on mount and data changes - Chosen: Balance of correctness and performance

**Implementation approach**:
- Query IndexedDB for current release data on component mount
- Update button state based on actual data presence
- Listen for `qd:answer-saved` events to enable if first data saved

### 5. Timestamp Formatting

**Decision**: Create centralized date formatting utility
**Rationale**: Timestamps need consistent 24-hour format across all components
**Alternatives considered**:
- Inline formatting - Rejected: Code duplication
- Third-party library (date-fns) - Rejected: Bundle size constraint
- Utility function - Chosen: Reusable, testable, lightweight

**Implementation approach**:
- Create `formatTimestamp(date: Date, format: 'display' | 'csv')` utility
- Display format: "Nov 19 14:23" or "11/19 14:23:45"
- CSV format: ISO 8601 for spreadsheet compatibility
- Replace all existing timestamp formatting with utility calls

### 6. Re-submission Handling

**Decision**: Overwrite existing answer in storage
**Rationale**: Only most recent answer should be stored per requirement FR-015
**Alternatives considered**:
- Keep history with versions - Rejected: Not required, adds complexity
- Append to array - Rejected: Conflicts with requirement
- Simple overwrite - Chosen: Meets requirement, simpler

**Implementation approach**:
- In storage service, use same key for question answers
- New submission overwrites previous value
- Timestamp always reflects latest submission

### 7. Performance with 100+ Students

**Decision**: Virtual scrolling for student answer display
**Rationale**: DOM nodes for 100+ students could impact performance
**Alternatives considered**:
- Pagination - Rejected: Instructors want to see all at once
- Lazy rendering - Rejected: Complex for marginal benefit
- Virtual scrolling - Chosen: Best performance, maintains UX

**Implementation approach**:
- Implement simple virtual list for student answers
- Render only visible items plus buffer
- Reuse DOM nodes as user scrolls

## Phase 0 Completion

All technical decisions have been researched and documented. No external dependencies or new patterns required. All fixes use existing BrowserTest patterns and architecture.

**Next Step**: Phase 1 - Design & Contracts (minimal new design needed for bug fixes)