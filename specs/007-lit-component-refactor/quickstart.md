# Quickstart: Lit Component Refactor & Testability Improvements

**Feature**: 007-lit-component-refactor
**Date**: 2025-11-25

## Overview

This feature is an internal refactor—no new user-facing functionality. After implementation:
- All existing tests pass unchanged
- Code is easier to unit test
- Modal components use declarative Lit patterns

## Verification Commands

### Before Starting (Baseline)

```bash
# Capture baseline metrics
npm run size-check                    # Record bundle size
npm run test:coverage -- --reporter=json > baseline-coverage.json

# Verify all tests pass
npm run test:unit
npm run test:integration
npm run test:e2e
```

### After Phase 0 (Helpers)

```bash
# Run new helper tests
npm run test:unit -- tests/unit/utils/
npm run test:unit -- tests/unit/services/question-input.test.ts
npm run test:unit -- tests/unit/services/answer-display.test.ts

# Verify 100% coverage on helpers
npm run test:coverage -- --reporter=text src/utils/
npm run test:coverage -- --reporter=text src/services/question-input.ts
npm run test:coverage -- --reporter=text src/services/answer-display.ts

# Verify no bundle size change (helpers are additive, not yet used)
npm run size-check
```

### After Phase 1 (Modal Base)

```bash
# Run modal component tests
npm run test:unit -- tests/unit/components/qd-modal.test.ts

# Verify in Storybook
npm run storybook
# Visit: http://localhost:6006/?path=/story/components-modal--default
```

### After Phase 2 (Modal Extraction)

```bash
# Run all component tests
npm run test:unit -- tests/unit/components/

# Verify E2E tests still pass (critical!)
npm run test:e2e

# Check bundle size increase is within limit
npm run size-check  # Should be <2KB increase from baseline

# Full coverage check
npm run test:coverage
```

## Usage Examples

### Helper Functions

```typescript
// validation-helpers.ts
import { validateStudentForm, sanitizePinInput } from '../utils/validation-helpers';

const errors = validateStudentForm('John', 'AB123', '1234');
if (errors.length > 0) {
  console.error('Validation failed:', errors);
}

const cleanPin = sanitizePinInput('12a3b4');  // Returns '1234'
```

```typescript
// calculation-helpers.ts
import {
  calculateStatusIndicator,
  calculatePercentage,
  isSessionExpired,
} from '../utils/calculation-helpers';

const status = calculateStatusIndicator(10, 7);  // 'amber'
const percent = calculatePercentage(7, 10);      // 70
const expired = isSessionExpired('2025-01-01T00:00:00Z');  // true/false
```

### Modal Components

```typescript
// Using <qd-modal> base component
import '../components/qd-modal';

render() {
  return html`
    <qd-modal
      ?open=${this.showModal}
      @qd:modal-close=${() => this.showModal = false}
    >
      <h2>Modal Title</h2>
      <p>Modal content goes here.</p>
      <button @click=${() => this.showModal = false}>Close</button>
    </qd-modal>
  `;
}
```

```typescript
// Using <qd-confirm-dialog>
import '../components/qd-confirm-dialog';

render() {
  return html`
    <qd-confirm-dialog
      ?open=${this.showConfirm}
      title="Delete Data"
      message="Are you sure you want to delete all data? This cannot be undone."
      confirmText="Delete"
      ?destructive=${true}
      @qd:confirm=${this.handleDelete}
      @qd:cancel=${() => this.showConfirm = false}
    ></qd-confirm-dialog>
  `;
}
```

## Test Examples

### Testing Pure Helpers

```typescript
// tests/unit/utils/validation-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { validateStudentForm, sanitizePinInput } from '../../src/utils/validation-helpers';

describe('validateStudentForm', () => {
  it('returns empty array for valid input', () => {
    expect(validateStudentForm('John', 'AB123', '1234')).toEqual([]);
  });

  it('returns error for empty name', () => {
    const errors = validateStudentForm('', 'AB123', '1234');
    expect(errors).toContain('Name required');
  });

  it('returns error for invalid service ID', () => {
    const errors = validateStudentForm('John', 'A', '1234');
    expect(errors).toContain('Service ID must be 2-10 alphanumeric');
  });

  it('returns error for short PIN', () => {
    const errors = validateStudentForm('John', 'AB123', '123');
    expect(errors).toContain('PIN must be 4 digits');
  });

  it('returns multiple errors for multiple issues', () => {
    const errors = validateStudentForm('', 'A', '12');
    expect(errors.length).toBe(3);
  });
});

describe('sanitizePinInput', () => {
  it('removes non-digit characters', () => {
    expect(sanitizePinInput('12a3b4')).toBe('1234');
  });

  it('returns empty string for all non-digits', () => {
    expect(sanitizePinInput('abcd')).toBe('');
  });

  it('preserves digits only', () => {
    expect(sanitizePinInput('1-2-3-4')).toBe('1234');
  });
});
```

### Testing Modal Components

```typescript
// tests/unit/components/qd-modal.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import '../../../src/components/qd-modal';

describe('qd-modal', () => {
  it('renders closed by default', async () => {
    const el = await fixture(html`<qd-modal></qd-modal>`);
    expect(el.shadowRoot?.querySelector('.backdrop')).toBeNull();
  });

  it('renders content when open', async () => {
    const el = await fixture(html`
      <qd-modal open>
        <p>Test content</p>
      </qd-modal>
    `);
    expect(el.shadowRoot?.querySelector('.backdrop')).toBeTruthy();
    expect(el.querySelector('p')?.textContent).toBe('Test content');
  });

  it('emits qd:modal-close on Escape key', async () => {
    const el = await fixture(html`<qd-modal open></qd-modal>`);
    const handler = vi.fn();
    el.addEventListener('qd:modal-close', handler);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(handler).toHaveBeenCalled();
  });

  it('emits qd:modal-close on backdrop click when closable', async () => {
    const el = await fixture(html`<qd-modal open closable></qd-modal>`);
    const handler = vi.fn();
    el.addEventListener('qd:modal-close', handler);

    const backdrop = el.shadowRoot?.querySelector('.backdrop');
    backdrop?.dispatchEvent(new MouseEvent('click'));

    expect(handler).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### "Cannot find module '../utils/validation-helpers'"

The `src/utils/` directory needs to be created first. Check that the directory structure matches:

```
src/
├── utils/
│   ├── validation-helpers.ts
│   └── calculation-helpers.ts
```

### Tests fail after refactoring callers

When refactoring a component to use new helpers:
1. Run E2E tests first to catch regressions
2. Check that event contracts are preserved
3. Verify the same validation logic applies

### Bundle size increased more than expected

Use source-map-explorer to identify the cause:

```bash
npm run build
npx source-map-explorer dist/sonar-quiz.iife.js
```

Common causes:
- Importing entire modules instead of specific functions
- Duplicate utility code not removed from original locations

### Modal focus trap not working

Ensure the modal content has focusable elements (buttons, inputs). The focus trap queries for:
- `button`
- `[href]`
- `input`
- `select`
- `textarea`
- `[tabindex]:not([tabindex="-1"])`
