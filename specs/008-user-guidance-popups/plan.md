# Implementation Plan: User Guidance Popups

**Branch**: `008-user-guidance-popups` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-user-guidance-popups/spec.md`

## Summary

Add contextual help popups to the login panel, student status panel, and instructor status panel. Each panel gets a help icon (?) that opens a modal with panel-specific guidance content. Content is configurable via DITA parameters injected as hidden `<span>` elements, following the existing configuration pattern.

## Technical Context

**Language/Version**: TypeScript 5.x / ES2020+ with Lit 3.x
**Primary Dependencies**: Lit 3.0 (Web Components), existing qd-modal base component
**Storage**: N/A (no data persistence - content from DITA config only)
**Testing**: Vitest (unit), Playwright (E2E), Storybook (visual)
**Target Platform**: Chrome/Edge ≥96, Firefox ≥102, works from file:// URLs
**Project Type**: Single project (web components library)
**Performance Goals**: <200ms popup open/close, no measurable impact on bundle size
**Constraints**: ≤35KB bundle limit (current ~30KB), offline-capable, no external dependencies
**Scale/Scope**: 3 help icons, 3 popup content variations, ~200 lines new code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Offline-First**: Feature works completely offline - all content from local DOM, no network
- [x] **Progressive Enhancement**: Help icons added to existing panels without breaking functionality
- [x] **Test-Driven Development**: Unit tests for help trigger, E2E tests for popup interactions
- [x] **Phase-Gated Delivery**: P1 (login help) → P2 (status panels) → Integration complete
- [x] **Performance Constraints**: Modal reuses existing qd-modal patterns, minimal bundle impact
- [x] **Data Isolation**: No user data involved - static help content only
- [x] **Zero Configuration**: Content via DITA parameters, no script attributes needed

## Project Structure

### Documentation (this feature)

```text
specs/008-user-guidance-popups/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - no entities)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── events.md        # Custom events for help triggers
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── qd-help-trigger.ts     # NEW: Help icon button (? icon)
│   ├── qd-help-popup.ts       # NEW: Help popup (extends qd-modal pattern)
│   ├── qd-login.ts            # MODIFY: Add help trigger
│   ├── qd-status.ts           # MODIFY: Add help trigger
│   └── qd-instructor/
│       └── qd-instructor.ts   # MODIFY: Add help trigger
├── config/
│   └── dom-config-reader.ts   # MODIFY: Add help content config IDs
└── types/
    └── contracts.ts           # VERIFY: No changes needed (no new entities)

tests/
├── unit/
│   └── components/
│       ├── qd-help-trigger.test.ts   # NEW
│       └── qd-help-popup.test.ts     # NEW
└── e2e/
    └── help-popups.spec.ts           # NEW

stories/
└── components/
    ├── qd-help-trigger.stories.ts    # NEW
    └── qd-help-popup.stories.ts      # NEW

dita/
└── templates/
    └── ... (XSL changes for DITA parameter injection)
```

**Structure Decision**: Single project structure (web components). New components follow existing pattern: qd-help-trigger (simple button) + qd-help-popup (modal container). Integration into existing panels via slot/composition.

## Complexity Tracking

*No constitution violations. Design aligns with all principles.*

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Component reuse | Extend qd-modal pattern | Proven portal + accessibility pattern |
| Configuration | Hidden spans | Existing DITA config pattern (dom-config-reader.ts) |
| Content source | DOM injection | Zero-config deployment principle |

## Design Decisions

### Component Architecture

**Option A: Single qd-help-popup component** ✓ SELECTED
- One component handles all three contexts
- Content passed via property or slot
- Simpler, less bundle impact

**Option B: Three separate components** (Rejected)
- `qd-login-help`, `qd-status-help`, `qd-instructor-help`
- More code duplication, larger bundle

### Help Icon Placement

- **Login Panel**: Top-right corner of panel header, next to title
- **Student Status**: Inline with status text, after score display
- **Instructor Panel**: Top-right of panel, near existing buttons

### Content Configuration (DITA Parameters)

New hidden span elements for content injection:

```html
<!-- Login help content -->
<span id="qd-help-login" style="display:none;">
  <h3>Welcome to BrowserTest</h3>
  <p>Enter your Service ID and name to log in as a student...</p>
  <p>Contact: support@example.com</p>
</span>

<!-- Student status help content -->
<span id="qd-help-status" style="display:none;">
  <h3>Understanding Your Score</h3>
  <p>Your score shows progress on pages you've visited...</p>
</span>

<!-- Instructor help content -->
<span id="qd-help-instructor" style="display:none;">
  <h3>Instructor Tools</h3>
  <p>View aggregate scores, export data, manage cohorts...</p>
</span>
```

### Accessibility Requirements

- Help icon: `role="button"`, `aria-label="Help"`, keyboard focusable
- Popup: Inherits qd-modal accessibility (dialog role, focus trap, Escape close)
- Content: Semantic HTML (headings, paragraphs)
