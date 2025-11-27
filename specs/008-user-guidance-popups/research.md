# Research: User Guidance Popups

**Feature**: 008-user-guidance-popups
**Date**: 2025-11-27

## Research Summary

All technical decisions resolved. Feature uses existing patterns from the codebase.

## Decisions

### 1. Modal Implementation Pattern

**Decision**: Use existing `qd-modal` portal pattern via composition

**Rationale**:
- qd-modal.ts provides proven portal rendering to document.body
- Handles z-index stacking, backdrop, focus trap, Escape/click dismiss
- CSS styles already injected once (efficient)
- Accessibility (ARIA dialog role, focus management) built-in

**Alternatives Considered**:
- Tooltip pattern (like qd-build-info.ts): Rejected - hover-based, not modal, no focus trap
- New modal from scratch: Rejected - duplicates existing code, increases bundle size
- CSS-only popover: Rejected - limited browser support, poor accessibility

### 2. Help Icon Component Strategy

**Decision**: Create simple `<qd-help-trigger>` component that emits events

**Rationale**:
- Follows qd-build-info.ts pattern for consistent icon styling
- Decouples trigger from content (content handled by parent)
- Enables flexible placement in different panels
- Minimal bundle impact (~50 lines)

**Alternatives Considered**:
- Inline icon in each panel: Rejected - code duplication, inconsistent styling
- Slot-based in qd-modal: Rejected - overcomplicates modal API

### 3. Content Configuration Method

**Decision**: Hidden `<span>` elements with IDs, read by dom-config-reader.ts

**Rationale**:
- Follows existing pattern for qd-status-container, qd-title-selector, etc.
- Zero JavaScript configuration required (Constitution VII)
- Content fully customizable by DITA/Oxygen XSL transform
- Supports HTML content (headings, paragraphs, links)

**Alternatives Considered**:
- data-* attributes on script tag: Rejected - text-only, limited formatting
- External JSON file: Rejected - requires network fetch, violates offline-first
- Hardcoded defaults with optional override: Rejected - forces code changes for content updates

### 4. Content Structure

**Decision**: innerHTML from config span, supports arbitrary HTML

**Rationale**:
- Authors need formatting (headings, paragraphs, lists)
- Contact details may include mailto: links
- Semantic HTML improves accessibility
- XSS risk mitigated: content is server-injected by trusted DITA transform

**Alternatives Considered**:
- Markdown with runtime parser: Rejected - adds dependencies, bundle size
- Structured JSON object: Rejected - limits formatting flexibility
- Plain text only: Rejected - insufficient for user guidance

### 5. Help Content IDs

**Decision**: Three config element IDs:
- `qd-help-login` - Login panel content
- `qd-help-status` - Student status panel content
- `qd-help-instructor` - Instructor panel content

**Rationale**:
- Clear naming convention matching existing qd-* pattern
- One-to-one mapping with panels
- Optional - graceful fallback if not provided

### 6. Default Content Fallback

**Decision**: Provide hardcoded default content if config span not found

**Rationale**:
- System should work without DITA configuration (development, demos)
- Better UX than empty popup or error
- Defaults can guide authors on expected content structure

**Defaults**:
```
Login: "Welcome to BrowserTest. Enter your Service ID and name to track quiz progress. Instructors: Click 'Instructor' for admin features."

Status: "Your score shows progress on visited quiz pages. Green = complete (all correct), Amber = incomplete, Red = unanswered."

Instructor: "View Scores: See all student results. Export CSV: Download detailed data. Erase Data: Clear for new cohort."
```

## Integration Points

### Files to Modify

1. **src/config/dom-config-reader.ts**
   - Add three new config ID constants
   - Add `readHelpContent(panelType)` function

2. **src/components/qd-login.ts**
   - Import and render qd-help-trigger
   - Add help popup with login content

3. **src/components/qd-status.ts**
   - Import and render qd-help-trigger
   - Add help popup with status content

4. **src/components/qd-instructor/qd-instructor.ts**
   - Import and render qd-help-trigger
   - Add help popup with instructor content

### New Files

1. **src/components/qd-help-trigger.ts** (~50 lines)
   - ? icon button with accessible attributes
   - Emits `qd:help-open` event on click

2. **src/components/qd-help-popup.ts** (~100 lines)
   - Wrapper around qd-modal
   - Title + content slots
   - Standard close behavior

3. **tests/unit/components/qd-help-trigger.test.ts**
4. **tests/unit/components/qd-help-popup.test.ts**
5. **tests/e2e/help-popups.spec.ts**
6. **stories/components/qd-help-trigger.stories.ts**
7. **stories/components/qd-help-popup.stories.ts**

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bundle size increase | Low | Medium | Reuse qd-modal, estimate <1KB addition |
| Missing config content | Medium | Low | Provide sensible defaults |
| Accessibility gaps | Low | High | Follow qd-modal patterns, add unit tests |
| XSL integration issues | Medium | Low | Document config spans clearly, provide examples |

## Open Questions

None - all decisions resolved.
