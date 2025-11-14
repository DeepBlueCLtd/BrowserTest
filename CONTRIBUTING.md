# Contributing to Sonar Quiz System

Thank you for your interest in contributing to the Sonar Quiz System! This document provides guidelines and best practices for developers working on this project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Style & Conventions](#code-style--conventions)
4. [Testing Requirements](#testing-requirements)
5. [Definition of Done](#definition-of-done)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Git**: Latest version
- **Browser**: Chrome/Edge ≥96 or Firefox ≥102

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/DeepBlueCLtd/BrowserTest.git
cd BrowserTest

# Install dependencies
npm install

# Run tests to verify setup
npm test

# Start development server
npm run dev
```

### Project Structure

```
BrowserTest/
├── src/
│   ├── components/      # Lit 3 Web Components
│   ├── enhancers/       # DOM enhancement logic
│   ├── services/        # Business logic layer
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Main entry point
├── demo/                # Demo HTML files for manual testing
├── tests/               # Test files (unit, integration, E2E)
├── docs/                # Documentation
├── specs/               # Feature specifications
└── tools/               # Development tools
```

---

## Development Workflow

### Test-Driven Development (TDD)

**TDD is MANDATORY for all features.** Follow the Red-Green-Refactor cycle:

#### 1. Write Tests First (Red)

```typescript
// tests/services/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { myNewFeature } from '../src/services/my-feature';

describe('myNewFeature', () => {
  it('should return correct value when input is valid', () => {
    const result = myNewFeature('valid-input');
    expect(result).toBe('expected-output');
  });

  it('should throw error when input is invalid', () => {
    expect(() => myNewFeature(null)).toThrow();
  });
});
```

#### 2. Run Tests (Confirm Red)

```bash
npm run test:unit
# Tests should FAIL initially
```

#### 3. Implement Code (Green)

```typescript
// src/services/my-feature.ts
export function myNewFeature(input: string): string {
  if (!input) {
    throw new Error('Input required');
  }
  return `processed-${input}`;
}
```

#### 4. Verify Tests Pass

```bash
npm run test:unit
# All tests should PASS
```

#### 5. Refactor

- Improve code quality
- Add JSDoc comments
- Eliminate duplication
- Keep tests green

### Development Commands

```bash
# Development server with HMR
npm run dev              # Serves demo/ files with hot reload

# Component development
npm run storybook       # Isolated component development

# Testing
npm test                # Run all tests
npm run test:unit       # Vitest unit tests only
npm run test:integration # Integration tests only
npm run test:e2e        # Playwright E2E tests (file:// protocol)
npm run test:watch      # Watch mode for TDD

# Code Quality
npm run lint            # ESLint + TypeScript checks
npm run lint:fix        # Auto-fix linting issues
npm run format          # Format code with Prettier
npm run format:check    # Check formatting without modifying

# Building
npm run build           # Production build (IIFE + ESM + types)
npm run size-check      # Verify bundle ≤25KB gzipped
```

---

## Code Style & Conventions

### TypeScript

- **Strict mode**: Enabled (no `any` without `eslint-disable` comment)
- **Explicit types**: All function parameters and return types must be typed
- **Generics**: Use generics for reusable utilities (see `src/utils/`)

```typescript
// ✅ GOOD: Explicit types
export function processAnswer(answer: string, correct: string): boolean {
  return answer.trim().toLowerCase() === correct.toLowerCase();
}

// ❌ BAD: Missing types
export function processAnswer(answer, correct) {
  return answer.trim().toLowerCase() === correct.toLowerCase();
}
```

### Naming Conventions

- **Functions**: camelCase (`getUserData`, `validateAnswer`)
- **Classes**: PascalCase (`SessionService`, `AnalysisTable`)
- **Constants**: UPPER_SNAKE_CASE (`SESSION_TIMEOUT_MS`, `MAX_ATTEMPTS`)
- **Private methods**: Prefix with `_` (`_validatePassword`, `_hashInput`)
- **Type aliases**: PascalCase (`ServiceId`, `SessionData`)
- **Interfaces**: PascalCase (`StudentRecord`, `AnswerRecord`)

### Event Handlers

**CRITICAL**: Always use arrow functions or explicit `.bind()` to avoid unbound method errors.

```typescript
// ✅ GOOD: Arrow function
private _handleClick = () => {
  this.performAction();
};

// ✅ GOOD: Explicit binding in constructor
constructor() {
  super();
  this.handleClick = this.handleClick.bind(this);
}

// ❌ BAD: Unbound method (will cause errors)
private handleClick() {
  this.performAction(); // 'this' is undefined!
}
```

### Custom Events

Use the `qd:*` namespace for all custom events:

```typescript
import { emitEvent, QD_EVENTS } from './utils/event-helpers';

// Emit event
emitEvent(QD_EVENTS.ANSWER_SAVED, {
  questionIndex: 0,
  answer: { answer: 'A', success: true, timestamp: new Date().toISOString() },
  tableElement: table,
});

// Listen for event
import { onEvent } from './utils/event-helpers';

onEvent<QdLoginEvent>(QD_EVENTS.LOGIN, (event) => {
  console.log('User logged in:', event.detail.serviceId);
});
```

### Security Best Practices

#### XSS Prevention

**NEVER** use `innerHTML` with user-controlled data. Always use `createElement()` + `textContent`:

```typescript
// ✅ GOOD: Safe from XSS
const div = document.createElement('div');
const strong = document.createElement('strong');
strong.textContent = userInput; // Safe
div.appendChild(strong);

// ❌ BAD: XSS vulnerability
div.innerHTML = `<strong>${userInput}</strong>`; // DANGEROUS!
```

#### Sensitive Data Logging

Use the secure logger to prevent PII leakage:

```typescript
import { debug, error } from './utils/logger';

// Automatically sanitizes service IDs, names, passwords
debug('User logged in:', { serviceId: 'RN2344', name: 'John Doe' });
// Output: User logged in: { serviceId: 'RN****', name: 'J***' }
```

---

## Testing Requirements

### Test Coverage

- **Unit tests**: Required for all service functions
- **Integration tests**: Required for enhancers and complex workflows
- **E2E tests**: Required for user-facing features
- **Coverage target**: ≥80% for all new code

### Test File Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should handle valid input correctly', () => {
      // Arrange
      const input = 'test-data';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should throw error for invalid input', () => {
      expect(() => myFunction(null)).toThrow('Expected error message');
    });
  });
});
```

### E2E Testing with Playwright

```typescript
import { test, expect } from '@playwright/test';

test.describe('Quiz interaction', () => {
  test('should save answer when user selects MCQ option', async ({ page }) => {
    // Navigate to quiz page
    await page.goto('file://' + path.resolve('demo/quiz-examples.html'));

    // Wait for initialization
    await page.waitForSelector('table.qd-quiz');

    // Select answer
    await page.selectOption('select[data-question="0"]', 'b');

    // Verify visual feedback
    await expect(page.locator('td.qd-answer-correct')).toBeVisible();
  });
});
```

---

## Definition of Done

Before marking ANY task as complete, ALL of the following must pass:

```bash
# 1. TypeScript compilation
npm run build           # MUST succeed with zero errors

# 2. Linter (zero errors, warnings acceptable with justification)
npm run lint            # MUST pass

# 3. Unit tests
npm run test:unit       # ALL tests MUST pass

# 4. Integration tests (if applicable)
npm run test:integration # ALL tests MUST pass

# 5. Format check
npm run format:check    # MUST pass

# 6. Bundle size (if modifying source)
npm run size-check      # MUST be <25KB gzipped
```

**No Exceptions**: If ANY check fails, the task is NOT complete.

### Pre-Commit Checklist

- [ ] All tests passing (zero failures)
- [ ] Linter clean (zero errors)
- [ ] Build successful
- [ ] Bundle size within limits
- [ ] JSDoc comments added to public APIs
- [ ] Manual testing completed (if UI changes)
- [ ] No console errors in browser DevTools

---

## Commit Guidelines

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvement
- `security`: Security fix

#### Examples

```bash
# Feature
git commit -m "feat(quiz): add support for multiple choice questions with images"

# Bug fix
git commit -m "fix(session): prevent session timeout during active quiz taking"

# Security fix
git commit -m "security(xss): replace innerHTML with createElement in validation banner"

# Refactoring
git commit -m "refactor(utils): extract debouncer class to eliminate duplication"
```

### Using HEREDOC for Multi-line Messages

```bash
git commit -m "$(cat <<'EOF'
feat(instructor): add password-based authentication

- Implement 16-character base64url hash strategy
- Remove hardcoded password vulnerability
- Add password generator tool for authors
- Integrate with Oxygen WebHelp parameters

Closes #42
EOF
)"
```

---

## Pull Request Process

### 1. Create Feature Branch

```bash
# Branch naming: type/short-description
git checkout -b feat/add-mcq-images
git checkout -b fix/session-timeout
git checkout -b refactor/extract-storage-helpers
```

### 2. Develop with TDD

- Write tests first
- Implement feature
- Keep commits atomic and well-described

### 3. Run Pre-Push Checks

```bash
# Run all checks
npm test && npm run lint && npm run build

# If all pass, you're ready to push
```

### 4. Push and Create PR

```bash
git push -u origin feat/add-mcq-images

# Create PR using GitHub CLI or web interface
gh pr create --title "feat: add support for MCQ images" --body "..."
```

### 5. PR Requirements

- [ ] All CI checks passing
- [ ] Code reviewed by at least one other developer
- [ ] All reviewer comments addressed
- [ ] No merge conflicts
- [ ] Definition of Done checklist completed

---

## Common Patterns

### Using Utility Modules

The codebase provides several utility modules to eliminate duplication:

#### Storage Helpers

```typescript
import { getSessionJSON, setSessionJSON } from './utils/storage-helpers';

// Get typed data from sessionStorage
const session = getSessionJSON<SessionData>('qd/session');

// Save data to sessionStorage
setSessionJSON('qd/session', sessionData);
```

#### Debouncing

```typescript
import { Debouncer } from './utils/debouncer';

const debouncer = new Debouncer();

input.addEventListener('input', () => {
  debouncer.debounce('auto-save', () => {
    saveData();
  }, 200);
});
```

#### DOM Queries

```typescript
import { queryAll, createElementWithText } from './utils/dom-helpers';

// Get all quiz tables
const tables = queryAll<HTMLTableElement>('table.qd-quiz');

// Create safe DOM elements
const header = createElementWithText('h2', 'Results', 'quiz-header');
```

#### Custom Events

```typescript
import { emitLogin, onEvent, QD_EVENTS } from './utils/event-helpers';

// Emit login event
emitLogin({
  serviceId: 'RN2344',
  name: 'John Doe',
  release: '02-2025',
  timestamp: new Date().toISOString(),
});

// Listen for events
const cleanup = onEvent<QdLoginEvent>(QD_EVENTS.LOGIN, (event) => {
  console.log('Logged in:', event.detail);
});
```

### Working with IndexedDB

```typescript
import { getStorageAdapter } from './services/storage/indexeddb';

const storage = getStorageAdapter();

// Initialize database
await storage.init();

// Save student record
await storage.saveStudent(studentRecord);

// Retrieve student record
const record = await storage.getStudent(release, serviceId);
```

### Lit Component Patterns

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('my-component')
export class MyComponent extends LitElement {
  @property({ type: String }) title = 'Default Title';
  @state() private _count = 0;

  // Use arrow function for event handlers
  private _handleClick = () => {
    this._count++;
  };

  render() {
    return html`
      <h2>${this.title}</h2>
      <p>Count: ${this._count}</p>
      <button @click=${this._handleClick}>Increment</button>
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }
  `;
}
```

---

## Troubleshooting

### Build Errors

#### "Cannot find module 'vitest'"

```bash
# Ensure dependencies are installed
npm install

# Check tests/tsconfig.json exists
ls tests/tsconfig.json
```

#### "Property 'X' does not exist on type 'Y'"

- Check TypeScript types in `src/types/contracts.ts`
- Ensure type imports are correct
- Run `npm run build` to see detailed errors

### Test Failures

#### "Cannot read property of undefined"

- Common cause: Unbound methods in event handlers
- Fix: Use arrow functions or explicit `.bind()`

#### "Test timeout"

- Increase timeout in test file:
  ```typescript
  it('should load data', async () => {
    // Test code
  }, { timeout: 10000 }); // 10 seconds
  ```

### E2E Test Issues

#### "Page not found" (file:// protocol)

```typescript
// ✅ Use absolute path
const filePath = path.resolve('demo/quiz-examples.html');
await page.goto(`file://${filePath}`);

// ❌ Don't use relative
await page.goto('demo/quiz-examples.html');
```

#### "Element not visible"

```typescript
// Wait for element before interacting
await page.waitForSelector('table.qd-quiz', { state: 'visible' });
await page.click('button#login');
```

### Bundle Size Exceeded

```bash
# Check what's taking up space
npm run build
npm run size-check

# Analyze bundle
npx vite-bundle-visualizer
```

**Common causes**:
- Unused imports (remove them)
- Large dependencies (consider alternatives)
- Duplicate code (extract to utilities)

### Debug Mode Issues

#### Storage monitor not appearing

```html
<!-- Ensure debug attribute is set -->
<script src="sonar-quiz.iife.js" data-sonar-quiz data-debug="true"></script>
```

```typescript
// Or enable programmatically
SonarQuiz.init({ debug: true });
```

#### No console logs

- Check `config.debug` is true
- Use secure logger: `import { debug } from './utils/logger'`
- Check browser console filters

---

## Getting Help

- **Documentation**: See `docs/` and `specs/` directories
- **Code examples**: Check `demo/` files
- **Architecture**: See `ARCHITECTURE.md`
- **Project overview**: See `CLAUDE.md`
- **Issues**: Search existing GitHub issues before creating new ones

## License

This project is proprietary. All contributions become property of DeepBlueCLtd.
