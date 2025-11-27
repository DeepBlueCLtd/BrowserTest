# Event Contracts: User Guidance Popups

**Feature**: 008-user-guidance-popups
**Date**: 2025-11-27

## Custom Events

All events use the `qd:` namespace and are emitted with `{ bubbles: true, composed: true }` for Shadow DOM traversal.

### qd:help-open

**Emitted by**: `<qd-help-trigger>`
**When**: User clicks help icon or activates via keyboard (Enter/Space)

```typescript
interface HelpOpenEvent extends CustomEvent {
  type: 'qd:help-open';
  detail: {
    panelType: 'login' | 'status' | 'instructor';
  };
}
```

**Usage**:
```typescript
helpTrigger.addEventListener('qd:help-open', (e: HelpOpenEvent) => {
  this.showHelpPopup(e.detail.panelType);
});
```

### qd:modal-close (Existing)

**Emitted by**: `<qd-modal>` (base component)
**When**: Modal closes via Escape, backdrop click, or close button

```typescript
interface ModalCloseEvent extends CustomEvent {
  type: 'qd:modal-close';
  detail: void;
}
```

**Usage**: Help popup listens for this to sync internal state.

## Component Interfaces

### qd-help-trigger

**Element**: `<qd-help-trigger>`

**Properties**:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| panelType | `string` | `'login'` | Which panel this trigger belongs to |
| disabled | `boolean` | `false` | Whether trigger is disabled |

**Events Emitted**:
- `qd:help-open` - When activated

**Accessibility**:
- `role="button"`
- `tabindex="0"`
- `aria-label="Help"`
- Activates on Enter/Space

### qd-help-popup

**Element**: `<qd-help-popup>`

**Properties**:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| open | `boolean` | `false` | Whether popup is visible |
| title | `string` | `'Help'` | Popup header text |
| content | `string` | `''` | HTML content to display |

**Events Emitted**:
- `qd:modal-close` - When popup closes (bubbles from inner qd-modal)

**Slots**:
- Default slot for content (alternative to content property)

## Configuration Reader API

### New Exports from dom-config-reader.ts

```typescript
// Config element IDs
export const HELP_LOGIN_ID = 'qd-help-login';
export const HELP_STATUS_ID = 'qd-help-status';
export const HELP_INSTRUCTOR_ID = 'qd-help-instructor';

// Read help content with fallback
export function readHelpContent(
  panelType: 'login' | 'status' | 'instructor'
): string;
```

**Behavior**:
- Returns innerHTML of config span if found
- Returns default content if span missing or empty
- Never throws - always returns valid content
