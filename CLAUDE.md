# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrowserTest (internally "Sonar Quiz System") is an offline-first interactive quiz and analysis platform that progressively enhances DITA-published HTML training materials. The system operates entirely from `file://` URLs with no network dependencies, targeting air-gapped training environments.

**Current Phase**: Phase 0 - Bootstrap + Contracts (toolchain and frozen interfaces)

## Core Architecture

### Progressive Enhancement Pattern
The system enhances existing DITA HTML without modification through DOM upgrades:
- Detect tables with specific classes (`qd-quiz`, `qd-page`, `qd-analysis`)
- Upgrade in-place with interactive controls
- Inject Lit 3 custom elements for UI overlays (`<qd-login>`, `<qd-status>`, `<qd-instructor>`)
- Graceful degradation if JavaScript disabled

### Data Flow
```
User Input → DOM Handler → Service Layer → Storage Adapter
                ↓                              ↓
          Visual Update             IndexedDB/SessionStorage
```

**Storage Strategy**:
- **IndexedDB**: Primary persistence with composite keys `qd/{release}/u{serviceId}`
  - Database name: `SonarQuizDB` (defined in `src/services/storage/indexeddb.ts`)
  - Object stores: `students`, `backups`
- **sessionStorage**: Active session + R/A/G cache (expires 30 min)
- **No network**: All data remains local, no telemetry/CDN/remote config

### Component Layers
1. **DOM Enhancement** (`src/enhancers/`): Detect and upgrade DITA tables
2. **Service Layer** (`src/services/`): Business logic, state management, event coordination
3. **Component Layer** (`src/components/`): Lit 3 Web Components with Shadow DOM
4. **Storage Layer** (`src/services/storage/`): IndexedDB adapter with atomic transactions

### Storage Monitor (Development Tool)
The `<qd-storage-monitor>` component provides real-time inspection of browser storage during development:
- **Auto-injected** when `data-debug="true"` is set on the script tag
- **Configuration**: Set `dbName` attribute to specify the IndexedDB database to monitor
  - Default: `'quiz-scores'` (generic default for reusability)
  - Sonar Quiz System: `'SonarQuizDB'` (automatically set when auto-injected)
- **Usage examples**:
  ```html
  <!-- Auto-injected by system (uses SonarQuizDB) -->
  <script src="sonar-quiz.iife.js" data-sonar-quiz data-debug="true"></script>

  <!-- Manual usage with custom database -->
  <qd-storage-monitor dbName="MyCustomDB"></qd-storage-monitor>
  ```
- **Keyboard shortcut**: `Ctrl+Shift+D` to toggle visibility
- **Features**: Expand/collapse entries, view nested JSON, clear individual keys or all storage

## Development Commands

```bash
# Development
npm run dev              # Start dev server with HMR
npm run storybook       # Component development in isolation

# Testing (TDD mandatory)
npm test                # Run all tests
npm run test:unit       # Vitest unit tests
npm run test:integration # DOM upgrade integration tests
npm run test:e2e        # Playwright E2E tests (file:// protocol)
npm run chromatic       # Visual regression tests

# Building
npm run build           # Production build (IIFE + ESM)
npm run lint            # TypeScript + ESLint checks
npm run format:check    # Prettier formatting verification

# Size verification
npm run size-check      # Verify bundle <30KB min+gzip
```

## Demo & Manual Testing

The `demo/` directory contains standalone HTML files for manual testing and demonstration:

- **demo/quiz-index.html**: Index page with login UI, status panel, and navigation with R/A/G badges
- **demo/quiz-examples.html**: Interactive quiz tables (MCQ and numeric questions)
- **demo/analysis-examples.html**: Editable analysis tables for free-form student work

### Quick Test Workflow
```bash
# 1. Build the bundle
npm run build

# 2. Test via file:// protocol (recommended for offline testing)
open demo/quiz-index.html

# 3. Or serve via HTTP for full IndexedDB support
python3 -m http.server 8000
# Visit: http://localhost:8000/demo/quiz-index.html
```

All demo files load the built bundle from `dist/sonar-quiz.iife.js` and have debug mode enabled (`data-debug="true"`). See **demo/README.md** for:
- Detailed test scenarios (login, quiz interaction, analysis tables, session management)
- Browser DevTools inspection tips (IndexedDB, sessionStorage, custom events)
- Troubleshooting common issues
- E2E testing integration guidance

## Definition of Done

**CRITICAL**: Before marking ANY task as complete, ALL of the following must pass with ZERO errors:

```bash
# 1. TypeScript compilation (MUST pass)
npm run build

# 2. Linter (zero errors required, warnings acceptable with justification)
npm run lint

# 3. Unit tests (all must pass, zero failures)
npm run test:unit

# 4. Integration tests (if applicable to the task)
npm run test:integration

# 5. Format check (code must be properly formatted)
npm run format:check
```

**No Exceptions**:
- If ANY check fails, the task is NOT complete
- Fix all errors before committing
- Do not skip tests to achieve project goals (Constitution III)
- All code must be properly typed (no `any` without eslint-disable comment)
- All event handlers must use arrow functions or explicit `.bind()` to avoid unbound method errors

**Post-Implementation Checklist**:
- [ ] All tests passing (green)
- [ ] Linter clean (zero errors)
- [ ] Build successful
- [ ] Bundle size within limits (<30KB gzipped)
- [ ] Code committed with descriptive message

## Critical Constraints (Constitution)

### I. Offline-First Architecture
- MUST work completely offline from `file://` URLs
- No network dependencies, telemetry, CDN, or remote config
- All features functional on air-gapped systems

### II. Progressive Enhancement
- MUST enhance existing DITA HTML without breaking original functionality
- Zero impact to author workflow
- Graceful degradation without JavaScript

### III. Test-Driven Development
- TDD is MANDATORY: Tests → Review → Red → Green → Refactor
- Exit gates require: unit tests, integration tests, visual regression, E2E
- No skipping tests to achieve project goals

### IV. Phase-Gated Delivery
- 8-phase delivery with explicit exit criteria
- No phase starts until previous gate satisfied
- Each phase delivers independently testable value

### V. Performance Constraints
- Bundle: ≤30KB min+gzip IIFE
- Operations: <200ms save, <2s page load (50 questions)
- Shadow DOM for isolation, no global CSS pollution

### VI. Data Isolation & Privacy
- Composite keys: `qd/{release}/u{serviceId}`
- 30-minute session timeout
- Complete data erasure capability for cohort reset

### VII. Zero Configuration Deployment
- Single `<script>` tag in DITA template
- Auto-init on DOMContentLoaded
- No setup, no config, no dependencies

## Frozen Contracts (src/types/contracts.ts)

**DO NOT MODIFY** without version bump and migration strategy.

### Key Types
```typescript
// Identity
type ReleaseId = string;      // "MM-YYYY"
type ServiceId = string;      // e.g. "RN2344"
type PageId = string;         // e.g. "gram-1"
type CellKey = string;        // "R{row}C{col}#f:{hash}"

// States
type CompletionState = 'unstarted' | 'incomplete' | 'complete';
type QuestionKind = 'mcq' | 'numeric';

// Core entities
interface AnswerRecord {
  answer: string;     // User's answer
  success: boolean;   // Correctness
  timestamp: string;  // ISO 8601 (MANDATORY)
}

interface StudentRecord {
  schema: number;
  serviceId: ServiceId;
  name: string;
  release: ReleaseId;
  attempted: number;
  correct: number;
  pages: Record<PageId, PageData>;
}
```

## Author Constraints

Content authors must follow these rules (runtime validation enforces):

### Quiz Tables
- Exactly 3 columns: Question | Answer | Detail
- Class: `qd-quiz qd-page`
- MCQ: Use `<ol>` lists (1-indexed, first option = 1)
- Numeric: Tolerance in third column
- **Maximum ONE** quiz table per page

### Analysis Tables
- Class: `qd-analysis`
- Cells WITH `background-color` style = read-only
- Cells WITHOUT background-color = editable
- **Maximum ONE** analysis table per page

### Home Page
- Status panel: Auto-injected as last child of configured navbar container
  - Default: `.wh_top_menu_and_indexterms_link` (Oxygen WebHelp)
  - Configure via `statusPanelContainer` option in `init()` or `data-status-panel-container` attribute
  - **Not logged in**: Shows login form within status panel
  - **Logged in**: Shows quiz progress (R/A/G state, counts, percentage)
  - **Logout**: Button at bottom-right clears sessionStorage and shows login form
- Navigation links: Add class `quizPageBtn` for R/A/G badges

## Data Model Key Points

### State Calculation
```
unstarted → No answers provided
incomplete → Some answered OR any incorrect
complete → All answered AND all correct
```

### Session Management
- SessionData stored in sessionStorage with serviceId/release duplicated for quick access
- SessionCache rebuilt from IndexedDB on login
- Auto-logout after 30 minutes inactivity

### Cell Keys for Analysis
Format: `R{row}C{col}#f:{hash}`
- Hash: First 8 chars of SHA-256 of content
- Unique identifier for analysis table cells

## Testing Requirements

### TDD Workflow
1. Write test(s) covering new functionality
2. Review tests for correctness
3. Confirm tests FAIL (red)
4. Implement minimal code to pass (green)
5. Refactor while keeping tests green
6. **Before committing**: Run `npm run format:check` and `npm run lint` to verify code quality

### Definition of Done (Pre-Commit Checklist)
Before committing any code changes, ALL of the following MUST pass:

1. ✅ **Tests pass**: `npm run test:unit` (and `npm run test:integration` if applicable)
2. ✅ **Linting passes**: `npm run lint` (fix with `npm run lint:fix` if needed)
3. ✅ **Formatting passes**: `npm run format:check` (fix with `npm run format` if needed)
4. ✅ **Build succeeds**: `npm run build` (if modifying source files)
5. ✅ **Bundle size**: Under 30KB min+gzip (verify with `npm run size-check` if needed)

**Rationale**: CI will fail if any of these checks fail. Running them locally before committing prevents failed CI builds and reduces feedback cycles.

### Phase Exit Gates
- **Phase 0**: Contracts published, Storybook renders, CI green
- **Phase 1**: Chromatic interactions pass, parsing unit tests
- **Phase 2**: Visual baselines stable, cell mapping tests
- **Phase 3**: A11y checks pass, event emission verified
- **Phase 4**: Session switch tests, expiry unit tests
- **Phase 5**: E2E file:// saves/reloads, CSV validation
- **Phase 6**: Perf/a11y green, <30KB budget met

## Event System

Custom events use `qd:` namespace:
- `qd:login` - User logged in
- `qd:logout` - User logged out
- `qd:answer-saved` - Answer persisted
- `qd:state-changed` - Page completion state updated
- `qd:instructor-unlock` - Instructor mode activated
- `qd:data-cleared` - All data erased

## Browser Support

**Target**: Chrome/Edge ≥96, Firefox ≥102
**File Protocol**: Must work from `file://` URLs (no dynamic imports in IIFE)
**CSP**: Avoid `eval`, work with default Oxygen output
**Accessibility**: WCAG 2.1 Level AA required

## Debug Mode

Enable via `data-qd-debug` attribute on quiz/analysis tables:
- Console logs for state transitions
- On-page diagnostics (keys, page states)
- Production mode: silent, only validation banners

## Key Documentation

- **System_Requirements.md**: Functional requirements, data model, authoring rules
- **Technical_Design.md**: Architecture, packaging, integration patterns
- **Contracts.md**: Frozen types and interfaces
- **Delivery_Plan.md**: 8-phase plan with exit gates
- **demo/README.md**: Demo HTML files, testing workflows, troubleshooting guide
- **specs/001-sonar-quiz-system/**: Feature spec, plan, data model, contracts

## Common Patterns

### Storage Key Generation
```typescript
function getStorageKey(release: ReleaseId, serviceId: ServiceId): string {
  return `qd/${release}/u${serviceId}`;
}
```

### Answer Validation
- MCQ: Single letter a-z
- Numeric: Valid number string within tolerance
- Both: Non-empty answer required

### Session Timeout
30 minutes from lastActivity timestamp, checked on every user interaction

---

## Code Examples

### Using Utility Modules

#### Storage Helpers

```typescript
import { getSessionJSON, setSessionJSON, getLocalJSON } from './utils/storage-helpers';

// Get typed data from sessionStorage
const session = getSessionJSON<SessionData>('qd/session');
if (session) {
  console.log('Service ID:', session.serviceId);
}

// Save data to sessionStorage
setSessionJSON('qd/session', {
  serviceId: 'RN2344',
  name: 'John Doe',
  release: '02-2025',
  loginTime: new Date().toISOString(),
  // ...
});

// Get data from localStorage
const settings = getLocalJSON<UserSettings>('app/settings');
```

#### Debouncing

```typescript
import { Debouncer } from './utils/debouncer';

// Create debouncer instance
const debouncer = new Debouncer();

// Debounce auto-save (waits 200ms after last change)
input.addEventListener('input', () => {
  debouncer.debounce('auto-save', () => {
    saveDataToIndexedDB();
  }, 200);
});

// Functional approach for single-use
import { debounce } from './utils/debouncer';

const debouncedSave = debounce(() => {
  saveDataToIndexedDB();
}, 200);

input.addEventListener('input', debouncedSave);
```

#### DOM Helpers

```typescript
import {
  queryAll,
  createElementWithText,
  getTableRows,
  getCellText
} from './utils/dom-helpers';

// Get all quiz tables
const tables = queryAll<HTMLTableElement>('table.qd-quiz');

// Get table rows
tables.forEach(table => {
  const rows = getTableRows(table);
  rows.forEach(row => {
    const text = getCellText(row.cells[0]);
    console.log('Question:', text);
  });
});

// Create safe DOM elements (XSS-proof)
const header = createElementWithText('h2', 'Quiz Results', 'results-header');
const paragraph = createElementWithText('p', userInput); // Safe - no XSS
container.appendChild(header);
container.appendChild(paragraph);
```

#### Custom Events

```typescript
import {
  emitLogin,
  emitAnswerSaved,
  onEvent,
  QD_EVENTS
} from './utils/event-helpers';

// Emit login event
emitLogin({
  serviceId: 'RN2344',
  name: 'John Doe',
  release: '02-2025',
  timestamp: new Date().toISOString(),
});

// Listen for login events
const cleanup = onEvent<QdLoginEvent>(QD_EVENTS.LOGIN, (event) => {
  console.log('User logged in:', event.detail.serviceId);
  // Handle login...
});

// Later: cleanup(); to remove listener

// Emit answer saved event
emitAnswerSaved({
  questionIndex: 0,
  answer: { answer: 'A', success: true, timestamp: new Date().toISOString() },
  tableElement: table,
});
```

### Working with IndexedDB

```typescript
import { getStorageAdapter } from './services/storage/indexeddb';

// Get singleton instance
const storage = getStorageAdapter();

// Initialize database
await storage.init();

// Save student record
const record: StudentRecord = {
  schema: 1,
  docId: 'core-acs',
  serviceId: 'RN2344',
  name: 'John Doe',
  release: '02-2025',
  attempted: 5,
  correct: 4,
  updated: new Date().toISOString(),
  pages: {
    'gram-1': {
      answers: [
        { answer: 'A', success: true, timestamp: new Date().toISOString() },
        { answer: 'B', success: false, timestamp: new Date().toISOString() },
      ],
      state: 'incomplete',
    },
  },
};

await storage.saveStudent(record);

// Retrieve student record
const loaded = await storage.getStudent('02-2025', 'RN2344');
console.log('Loaded:', loaded);

// Get all students in a cohort
const cohort = await storage.getAllStudents('02-2025');
console.log('Cohort size:', cohort.length);

// Delete student data
await storage.deleteStudent('02-2025', 'RN2344');
```

### Creating Lit Components

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('my-component')
export class MyComponent extends LitElement {
  // Public property (attribute)
  @property({ type: String }) title = 'Default Title';

  // Private state
  @state() private _count = 0;

  // CRITICAL: Use arrow function for event handlers (avoids unbound method errors)
  private _handleClick = () => {
    this._count++;
    this.dispatchEvent(new CustomEvent('count-changed', {
      detail: { count: this._count },
      bubbles: true,
      composed: true,
    }));
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
      border: 1px solid #ccc;
    }

    button {
      background: #0066cc;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
  `;
}
```

### Security Patterns

#### XSS Prevention

```typescript
// ✅ SAFE: Always use createElement + textContent
const div = document.createElement('div');
const strong = document.createElement('strong');
strong.textContent = userInput; // Automatically escapes
div.appendChild(strong);

// ✅ SAFE: Use createElementWithText helper
import { createElementWithText } from './utils/dom-helpers';
const para = createElementWithText('p', userInput, 'user-content');

// ❌ DANGEROUS: Never use innerHTML with user data
div.innerHTML = `<strong>${userInput}</strong>`; // XSS VULNERABILITY!
```

#### Secure Logging

```typescript
import { debug, error } from './utils/logger';

// Automatically sanitizes PII (service IDs, names, passwords)
debug('User logged in:', {
  serviceId: 'RN2344',  // Logged as: RN****
  name: 'John Doe',     // Logged as: J***
  password: 'secret',   // Logged as: [REDACTED]
});

// Always log errors (even in production)
error('Failed to save:', err);
```

### Session Management

```typescript
import { getSessionService } from './services/session';

const sessionService = getSessionService();

// Create session on login
const session = sessionService.createSession('RN2344', 'John Doe', '02-2025');

// Get current session
const currentSession = sessionService.getSession();
if (currentSession) {
  console.log('Logged in as:', currentSession.name);
}

// Update activity (extends session timeout)
sessionService.updateActivity();

// Check if session expired
if (sessionService.isExpired()) {
  console.log('Session expired, please log in again');
  sessionService.clearSession();
}

// Instructor mode
sessionService.unlockInstructor();
if (sessionService.isInstructorUnlocked()) {
  console.log('Instructor mode active');
}
```

### Cache Management

```typescript
import { getSessionService } from './services/session';
import { buildCacheFromRecord } from './services/session';

const sessionService = getSessionService();

// Get cache
const cache = sessionService.getCache();
if (cache) {
  console.log('Total answered:', cache.totals.answered);
  console.log('Total correct:', cache.totals.correct);
  console.log('Page states:', cache.pages);
}

// Build cache from student record (after loading from IndexedDB)
const storage = getStorageAdapter();
const record = await storage.getStudent('02-2025', 'RN2344');
if (record) {
  const cache = buildCacheFromRecord(record);
  sessionService.saveCache(cache);
}

// Update cache manually
if (cache) {
  cache.totals.answered++;
  cache.totals.correct++;
  cache.pages['gram-1'] = {
    state: 'complete',
    answered: 10,
    correct: 10,
  };
  sessionService.saveCache(cache);
}
```

### Common Workflows

#### Complete Login-to-Answer Flow

```typescript
// 1. User submits login form (in qd-login component)
const sessionData: SessionData = {
  serviceId: inputServiceId.value,
  name: inputName.value,
  release: this.release,
  loginTime: new Date().toISOString(),
  lastActivity: new Date().toISOString(),
  expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString(),
  instructorUnlocked: false,
};

this.dispatchEvent(new CustomEvent('qd:login', {
  detail: sessionData,
  bubbles: true,
  composed: true,
}));

// 2. index.ts receives qd:login event
document.addEventListener('qd:login', async (e: Event) => {
  const session = (e as CustomEvent<SessionData>).detail;

  // Store session
  setSessionJSON('qd/session', session);

  // Initialize IndexedDB record
  const storage = getStorageAdapter();
  await storage.init();

  let record = await storage.getStudent(session.release, session.serviceId);
  if (!record) {
    record = {
      schema: 1,
      docId: 'core-acs',
      serviceId: session.serviceId,
      name: session.name,
      release: session.release,
      attempted: 0,
      correct: 0,
      updated: new Date().toISOString(),
      pages: {},
    };
    await storage.saveStudent(record);
  }

  // Build cache
  const cache = buildCacheFromRecord(record);
  sessionService.saveCache(cache);

  // Activate quiz tables
  activateAllQuizTables();
});

// 3. User answers question (quiz-table.ts emits event)
document.addEventListener('qd:answer-saved', async (e: Event) => {
  const detail = (e as CustomEvent<QdAnswerSavedEvent>).detail;

  // Update cache
  let cache = sessionService.getCache();
  // ... update cache logic ...
  sessionService.saveCache(cache);

  // Update IndexedDB
  const session = sessionService.getSession();
  if (session) {
    const record = await storage.getStudent(session.release, session.serviceId);
    if (record) {
      record.attempted = cache.totals.answered;
      record.correct = cache.totals.correct;
      await storage.saveStudent(record);
    }
  }

  // Emit state changed
  document.dispatchEvent(new CustomEvent('qd:state-changed', {
    detail: { pageId: 'gram-1', state: 'incomplete' },
  }));
});
```

## Build Output

- **IIFE**: `dist/sonar-quiz.iife.js` (global `window.SonarQuiz`, auto-init)
- **ESM**: `dist/sonar-quiz.esm.js` (for integrators)
- **Size limit**: ≤30KB min+gzip for IIFE
- **Source maps**: Generated for debugging
- **TypeScript definitions**: For ESM consumers