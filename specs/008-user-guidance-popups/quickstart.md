# Quickstart: User Guidance Popups

**Feature**: 008-user-guidance-popups
**Date**: 2025-11-27

## Overview

Add contextual help popups to the login, student status, and instructor panels. Users click a "?" icon to see panel-specific guidance.

## Implementation Summary

### New Components

1. **qd-help-trigger** - Help icon button (? symbol)
2. **qd-help-popup** - Modal popup displaying help content

### Modified Files

1. **src/config/dom-config-reader.ts** - Add help content reader
2. **src/components/qd-login.ts** - Add help trigger/popup
3. **src/components/qd-status.ts** - Add help trigger/popup
4. **src/components/qd-instructor/qd-instructor.ts** - Add help trigger/popup

## Step-by-Step Implementation

### Step 1: Create qd-help-trigger Component

```typescript
// src/components/qd-help-trigger.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('qd-help-trigger')
export class QdHelpTrigger extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .help-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #0066cc;
      color: white;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      border: none;
    }
    .help-icon:hover { background: #0052a3; }
    .help-icon:focus { outline: 2px solid #0066cc; outline-offset: 2px; }
  `;

  @property() panelType: 'login' | 'status' | 'instructor' = 'login';

  private handleClick() {
    this.dispatchEvent(new CustomEvent('qd:help-open', {
      detail: { panelType: this.panelType },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <button class="help-icon"
              @click=${this.handleClick}
              aria-label="Help">?</button>
    `;
  }
}
```

### Step 2: Create qd-help-popup Component

```typescript
// src/components/qd-help-popup.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import './qd-modal.js';

@customElement('qd-help-popup')
export class QdHelpPopup extends LitElement {
  static styles = css`
    .help-content { max-width: 400px; }
    .help-content h3 { margin-top: 0; color: #333; }
    .help-content p { line-height: 1.6; color: #555; }
  `;

  @property({ type: Boolean }) open = false;
  @property() title = 'Help';
  @property() content = '';

  render() {
    return html`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleClose}>
        <div slot="header">${this.title}</div>
        <div class="help-content">${unsafeHTML(this.content)}</div>
      </qd-modal>
    `;
  }

  private handleClose() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('qd:modal-close', { bubbles: true, composed: true }));
  }
}
```

### Step 3: Add Configuration Reader

```typescript
// Add to src/config/dom-config-reader.ts
export const HELP_LOGIN_ID = 'qd-help-login';
export const HELP_STATUS_ID = 'qd-help-status';
export const HELP_INSTRUCTOR_ID = 'qd-help-instructor';

const HELP_DEFAULTS = {
  login: '<h3>Welcome to BrowserTest</h3><p>Enter your Service ID and name to log in as a student and track your quiz progress.</p><p>Instructors: Click the "Instructor" button to access admin features.</p>',
  status: '<h3>Understanding Your Score</h3><p>Your score reflects your progress on quiz pages you have visited.</p><p><strong>Green</strong> = All questions correct<br><strong>Amber</strong> = Some questions answered<br><strong>Red</strong> = No questions answered</p>',
  instructor: '<h3>Instructor Tools</h3><p><strong>View Scores</strong>: See all student results.</p><p><strong>Export CSV</strong>: Download detailed answer data.</p><p><strong>Erase Data</strong>: Clear database for new student cohort.</p>'
};

export function readHelpContent(panelType: 'login' | 'status' | 'instructor'): string {
  const ids = { login: HELP_LOGIN_ID, status: HELP_STATUS_ID, instructor: HELP_INSTRUCTOR_ID };
  const element = document.getElementById(ids[panelType]);
  return element?.innerHTML?.trim() || HELP_DEFAULTS[panelType];
}
```

### Step 4: Integrate into Panels

**qd-login.ts** - Add to header area:
```typescript
import './qd-help-trigger.js';
import './qd-help-popup.js';
import { readHelpContent } from '../config/dom-config-reader.js';

// In render():
<qd-help-trigger panelType="login" @qd:help-open=${this.showHelp}></qd-help-trigger>
<qd-help-popup .open=${this.helpOpen}
               title="Login Help"
               .content=${readHelpContent('login')}
               @qd:modal-close=${() => this.helpOpen = false}>
</qd-help-popup>
```

Similar pattern for qd-status.ts and qd-instructor.ts.

## Testing

### Unit Tests

```bash
npm run test:unit -- --grep "qd-help"
```

### E2E Tests

```bash
npm run test:e2e -- tests/e2e/help-popups.spec.ts
```

## Configuration

### DITA/Oxygen Setup

Add hidden spans to your DITA template:

```html
<span id="qd-help-login" style="display:none;">
  <h3>Welcome</h3>
  <p>Your custom login help content...</p>
</span>
<span id="qd-help-status" style="display:none;">
  <h3>Score Help</h3>
  <p>Your custom status help content...</p>
</span>
<span id="qd-help-instructor" style="display:none;">
  <h3>Instructor Guide</h3>
  <p>Your custom instructor help content...</p>
</span>
```

## Bundle Impact

Estimated addition: ~150 lines TypeScript → <1KB minified+gzipped

Well within 35KB budget.
