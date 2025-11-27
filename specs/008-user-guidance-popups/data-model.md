# Data Model: User Guidance Popups

**Feature**: 008-user-guidance-popups
**Date**: 2025-11-27

## Overview

This feature introduces no new persisted entities. Help content is read-only, sourced from DOM configuration at runtime.

## Entities

### HelpContent (Runtime Only)

**Description**: Contextual help text displayed in popups. Not stored - read from DOM on demand.

**Source**: Hidden `<span>` elements injected by DITA/Oxygen XSL transform

**Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| panelType | `'login' \| 'status' \| 'instructor'` | Which panel this content belongs to |
| htmlContent | `string` | Raw HTML content from config span |

**Lifecycle**:
1. Page loads with hidden config spans
2. Component mounts, reads content from DOM
3. Content displayed when help popup opens
4. No persistence - ephemeral display only

### HelpPopupState (Component State)

**Description**: Internal state for help popup components. Not persisted.

**Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| open | `boolean` | Whether popup is currently visible |
| content | `string` | HTML content to display |
| title | `string` | Popup header title |

## Configuration Schema

### DOM Configuration Elements

Three new hidden span elements (optional, with defaults):

```html
<span id="qd-help-login" style="display:none;">HTML content for login help</span>
<span id="qd-help-status" style="display:none;">HTML content for status help</span>
<span id="qd-help-instructor" style="display:none;">HTML content for instructor help</span>
```

### Content Structure Guidelines

Recommended HTML structure for authors:

```html
<span id="qd-help-login" style="display:none;">
  <h3>Panel Title</h3>
  <p>Main explanation paragraph.</p>
  <p>Additional details or instructions.</p>
  <p><strong>Contact:</strong> <a href="mailto:support@example.com">support@example.com</a></p>
</span>
```

## State Transitions

### Help Popup Lifecycle

```
closed → open → closed
   ↑       ↓
   └───────┘
```

**Triggers**:
- `closed → open`: User clicks/activates help icon
- `open → closed`: Escape key, backdrop click, or close button

## No Database Changes

This feature does not modify:
- IndexedDB schema
- sessionStorage keys
- Any persisted state

All data is read-only from DOM configuration.
