# Sonar Quiz System - Architecture Documentation

This document provides a comprehensive overview of the Sonar Quiz System architecture, design patterns, and technical decisions.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Component Layers](#component-layers)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Design Patterns](#design-patterns)
7. [Storage Architecture](#storage-architecture)
8. [Security Model](#security-model)
9. [Performance Optimizations](#performance-optimizations)
10. [Deployment Model](#deployment-model)

---

## System Overview

The Sonar Quiz System is an **offline-first interactive quiz platform** that progressively enhances DITA-published HTML training materials. The system operates entirely from `file://` URLs with zero network dependencies, targeting air-gapped training environments.

### Key Characteristics

- **Progressive Enhancement**: Enhances existing DITA HTML without modification
- **Offline-First**: No network dependencies (CDN, telemetry, remote config)
- **Zero Configuration**: Single `<script>` tag deployment
- **Type-Safe**: Built with TypeScript in strict mode
- **Test-Driven**: Comprehensive unit, integration, and E2E test coverage
- **Bundle Size**: ≤25KB min+gzip (IIFE)

---

## Architecture Diagrams

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DITA HTML Page                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  <script src="sonar-quiz.iife.js" data-sonar-quiz />     │  │
│  │  <table class="qd-quiz qd-page">...</table>              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ Auto-init on DOMContentLoaded
┌─────────────────────────────────────────────────────────────────┐
│                    Sonar Quiz System                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   Components     │  │    Services      │  │   Storage     │  │
│  │   (Lit 3)        │→ │  (Business Logic)│→ │  (IndexedDB)  │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
│           ↑                      ↑                               │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │   Enhancers      │  │     Utils        │                     │
│  │  (DOM Upgrade)   │  │   (Helpers)      │                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### Component Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Web Components (Lit 3)                      │
├──────────────────────┬──────────────────────┬───────────────────┤
│   <qd-login>         │   <qd-status>        │  <qd-instructor>  │
│                      │                      │                   │
│  • Service ID input  │  • R/A/G display     │  • Password auth  │
│  • Name input        │  • Progress %        │  • Cohort scores  │
│  • Emits qd:login    │  • Login/Logout UI   │  • CSV export     │
│                      │  • Listens events    │  • Data erasure   │
└──────────────────────┴──────────────────────┴───────────────────┘
         ↓                       ↓                       ↓
┌─────────────────────────────────────────────────────────────────┐
│               Shadow DOM (Encapsulated Styles)                   │
│  • No CSS pollution           • Scoped selectors                 │
│  • Component isolation        • Theme-independent                │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌──────────────┐     Event (qd:login)     ┌──────────────┐
│  qd-login    │─────────────────────────→│   index.ts   │
│  Component   │                           │  (Main App)  │
└──────────────┘                           └──────────────┘
                                                   ↓
                                           Store SessionData
                                                   ↓
                           ┌────────────────────────────────────┐
                           │      sessionStorage                │
                           │  • qd/session: SessionData         │
                           │  • qd/state: SessionCache          │
                           └────────────────────────────────────┘
                                           ↓
                           ┌────────────────────────────────────┐
User Answers Question →    │   quiz-table.ts (Enhancer)         │
                           │   • Validates answer                │
                           │   • Applies visual feedback         │
                           │   • Emits qd:answer-saved           │
                           └────────────────────────────────────┘
                                           ↓
                           ┌────────────────────────────────────┐
                           │   index.ts (handleAnswerSaved)     │
                           │   • Updates SessionCache            │
                           │   • Persists to IndexedDB           │
                           │   • Emits qd:state-changed          │
                           └────────────────────────────────────┘
                                           ↓
               ┌───────────────────────────┴────────────────────────┐
               ↓                                                    ↓
┌──────────────────────────┐                      ┌─────────────────────────┐
│     IndexedDB            │                      │   qd-status Component   │
│  SonarQuizDB             │                      │  • Updates progress     │
│  • students object store │                      │  • Updates R/A/G state  │
│  • Composite key:        │                      │  • Shows percentage     │
│    qd/{release}/u{svcId} │                      └─────────────────────────┘
└──────────────────────────┘
```

### Event System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Custom Event System (qd:* namespace)           │
├──────────────────────┬──────────────────────┬───────────────────┤
│   qd:login           │   qd:answer-saved    │  qd:state-changed │
│  • serviceId         │  • questionIndex     │  • pageId         │
│  • name              │  • answer record     │  • state (R/A/G)  │
│  • release           │  • tableElement      │                   │
│  • timestamp         │                      │                   │
├──────────────────────┼──────────────────────┼───────────────────┤
│   qd:logout          │   qd:instructor-     │  qd:data-cleared  │
│  • timestamp         │     unlock/lock      │  • timestamp      │
│                      │  • timestamp         │                   │
└──────────────────────┴──────────────────────┴───────────────────┘
                            ↓
        All events bubble: true, composed: true
        Dispatched on document or component
```

---

## Component Layers

### Layer 1: Entry Point (`src/index.ts`)

**Responsibilities**:
- Auto-initialization on DOMContentLoaded
- Configuration management
- Component injection (login, status panel)
- Event listener setup
- Table preparation and activation

**Key Functions**:
```typescript
init(config?: SonarQuizConfig): void
enhanceTables(selector?: string): void
setupEventListeners(): void
injectLoginComponent(): void
injectStatusPanel(): void
```

### Layer 2: Enhancers (`src/enhancers/`)

**Purpose**: Progressive enhancement of DITA HTML tables

#### `quiz-table.ts`

- Detects `table.qd-quiz.qd-page` elements
- Hides metadata column (3rd column)
- Injects interactive controls (select, input, checkboxes)
- Handles answer validation
- Auto-saves with debouncing (200ms)
- Emits `qd:answer-saved` events

#### `analysis-table.ts`

- Detects `table.qd-analysis` elements
- Makes cells editable based on background-color
- Persists cell data with unique keys: `R{row}C{col}#f:{hash}`
- Auto-saves with debouncing (200ms)

#### `home-badges.ts`

- Injects R/A/G badges on navigation links
- Updates badges based on page completion state
- Listens for `qd:state-changed` events

### Layer 3: Services (`src/services/`)

**Purpose**: Business logic and data management

#### `session.ts` - SessionService

```typescript
class SessionService {
  createSession(serviceId, name, release): SessionData
  getSession(): SessionData | null
  updateActivity(): void
  isExpired(): boolean
  clearSession(): void
  unlockInstructor(): void
  isInstructorUnlocked(): boolean
  getCache(): SessionCache | null
  saveCache(cache: SessionCache): void
}
```

#### `storage/indexeddb.ts` - IndexedDBStorageAdapter

```typescript
class IndexedDBStorageAdapter {
  init(): Promise<void>
  saveStudent(record: StudentRecord): Promise<void>
  getStudent(release, serviceId): Promise<StudentRecord | null>
  getAllStudents(release): Promise<StudentRecord[]>
  deleteStudent(release, serviceId): Promise<void>
  deleteAllStudents(release): Promise<void>
}
```

#### `quiz-parser.ts`

- Parses quiz tables from DOM
- Validates table structure
- Extracts questions, answers, tolerances
- Detects MCQ vs numeric questions

#### `validation.ts`

- Validates quiz table structure
- Validates answer formats (MCQ: a-z, Numeric: float)
- Checks tolerance values

#### `state-calculator.ts`

- Calculates page completion state
- Rules:
  - `unstarted`: No answers provided
  - `incomplete`: Some answered OR any incorrect
  - `complete`: All answered AND all correct

#### `csv-export.ts`

- Exports cohort scores to CSV format
- Columns: Service ID, Name, Attempted, Correct, Score (%)

### Layer 4: Components (`src/components/`)

**Purpose**: Reusable UI elements with Shadow DOM

All components built with **Lit 3** framework:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('qd-login')
export class QdLogin extends LitElement {
  @property({ type: String }) release = '';
  @state() private _isSubmitting = false;

  render() {
    return html`<form>...</form>`;
  }

  static styles = css`:host { display: block; }`;
}
```

### Layer 5: Utilities (`src/utils/`)

**Purpose**: Shared helper functions to eliminate duplication

- **storage-helpers.ts**: JSON parse/stringify wrappers for sessionStorage/localStorage
- **debouncer.ts**: Debouncer class and functional debounce/throttle
- **dom-helpers.ts**: DOM query and manipulation utilities
- **event-helpers.ts**: Type-safe custom event utilities
- **logger.ts**: Secure logging with PII sanitization
- **formatting.ts**: Date and number formatting

---

## Data Flow

### Login Flow

```
1. User enters Service ID + Name in <qd-login>
2. Component validates inputs (required, max length)
3. Emit qd:login event with SessionData
4. index.ts receives event
   ├─ Store SessionData in sessionStorage
   ├─ Initialize or load StudentRecord from IndexedDB
   ├─ Activate quiz tables (inject controls)
   ├─ Restore previous answers from cache
   └─ Update qd-status component (show progress)
```

### Answer Submission Flow

```
1. User selects answer in quiz table
2. quiz-table.ts validates answer against correct value
3. Apply visual feedback (green/red border)
4. Debounce auto-save (200ms)
5. Emit qd:answer-saved event
6. index.ts handles event:
   ├─ Update SessionCache in sessionStorage
   ├─ Recalculate page state (unstarted/incomplete/complete)
   ├─ Persist StudentRecord to IndexedDB
   ├─ Update qd-status component totals
   └─ Emit qd:state-changed event
7. home-badges.ts updates navigation badges (R/A/G)
```

### Session Timeout Flow

```
1. User logs in → expiresAt = now + 30 minutes
2. Each user interaction → updateActivity() → extend expiresAt
3. SessionService.isExpired() checks current time vs expiresAt
4. If expired → Clear session → Show login UI
```

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | 5.x | Type-safe development |
| **Lit** | 3.1.0 | Web Components framework |
| **Vite** | 5.x | Build tool and dev server |
| **Vitest** | 1.x | Unit testing framework |
| **Playwright** | 1.x | E2E testing framework |
| **IndexedDB** | Native | Client-side persistence |

### Build Output

```
dist/
├── sonar-quiz.iife.js      # Global window.SonarQuiz (auto-init)
├── sonar-quiz.esm.js       # ES module for integrators
├── sonar-quiz.d.ts         # TypeScript definitions
└── *.map                   # Source maps for debugging
```

### Browser APIs Used

- **Web Components**: Custom Elements, Shadow DOM
- **Storage**: IndexedDB, sessionStorage
- **Crypto**: Web Crypto API (SHA-256 hashing)
- **DOM**: MutationObserver, CustomEvent, querySelector

---

## Design Patterns

### 1. Progressive Enhancement

**Problem**: Don't want to break existing DITA HTML if JavaScript disabled.

**Solution**: Enhance tables in-place, gracefully degrade.

```typescript
// Before enhancement: Static DITA table
<table class="qd-quiz qd-page">
  <tr><td>Question</td><td>Answer</td><td>Detail</td></tr>
  <tr><td>What is 2+2?</td><td>4</td><td>0.1</td></tr>
</table>

// After enhancement: Interactive quiz
<table class="qd-quiz qd-page qd-enhanced">
  <tr><td>Question</td><td>Answer</td><td style="display:none">Detail</td></tr>
  <tr>
    <td>What is 2+2?</td>
    <td>
      <input type="number" data-correct="4" data-tolerance="0.1">
      <div class="qd-reveal" style="display:none">Correct Answer: 4 (±0.1)</div>
    </td>
    <td style="display:none">0.1</td>
  </tr>
</table>
```

### 2. Singleton Pattern

**Problem**: Need single shared instance of services across the app.

**Solution**: Singleton factory functions.

```typescript
let sessionInstance: SessionService | null = null;

export function getSessionService(): SessionService {
  if (!sessionInstance) {
    sessionInstance = new SessionService();
  }
  return sessionInstance;
}

export function resetSessionService(): void {
  sessionInstance = null; // For testing
}
```

### 3. Observer Pattern (Custom Events)

**Problem**: Loosely coupled components need to communicate.

**Solution**: Custom events with standardized `qd:*` namespace.

```typescript
// Emitter (qd-login)
this.dispatchEvent(new CustomEvent('qd:login', {
  detail: sessionData,
  bubbles: true,
  composed: true,
}));

// Listener (index.ts)
document.addEventListener('qd:login', (e) => {
  const session = e.detail;
  // Handle login
});
```

### 4. Debounce Pattern

**Problem**: Auto-save triggered on every keystroke is expensive.

**Solution**: Debouncer utility to batch saves.

```typescript
import { Debouncer } from './utils/debouncer';

const debouncer = new Debouncer();

input.addEventListener('input', () => {
  debouncer.debounce('auto-save', () => {
    saveDataToIndexedDB();
  }, 200); // Wait 200ms of inactivity
});
```

### 5. Composite Key Pattern

**Problem**: Need unique storage keys per release and student.

**Solution**: Composite keys: `qd/{release}/u{serviceId}`

```typescript
function getStorageKey(release: ReleaseId, serviceId: ServiceId): string {
  return `qd/${release}/u${serviceId}`;
}

// Example: "qd/02-2025/uRN2344"
```

### 6. Cache-Aside Pattern

**Problem**: Querying IndexedDB on every answer is slow.

**Solution**: SessionCache in sessionStorage for fast reads.

```
┌─────────────────┐  read    ┌──────────────────┐
│  Application    │─────────→│  SessionCache    │
│                 │          │  (sessionStorage)│
└─────────────────┘          └──────────────────┘
        ↓ write                      ↓ sync
┌─────────────────────────────────────────────────┐
│          IndexedDB (SonarQuizDB)                │
│  • Persistent                                   │
│  • Atomic transactions                          │
│  • Survives page refresh                        │
└─────────────────────────────────────────────────┘
```

---

## Storage Architecture

### Storage Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                   Storage Hierarchy                          │
├──────────────────────┬───────────────────────────────────────┤
│  sessionStorage      │  IndexedDB (SonarQuizDB)              │
│  (Temporary)         │  (Persistent)                         │
├──────────────────────┼───────────────────────────────────────┤
│  qd/session          │  Object Store: students               │
│  • ServiceId         │  • Key: qd/{release}/u{serviceId}     │
│  • Name              │  • Value: StudentRecord               │
│  • Release           │                                       │
│  • Login time        │  Object Store: backups                │
│  • Expires at        │  • Key: timestamp                     │
│  • Instructor mode   │  • Value: Backup snapshot             │
├──────────────────────┼───────────────────────────────────────┤
│  qd/state            │  Indexes:                             │
│  • SessionCache      │  • by_release (for cohort queries)    │
│  • Page states       │  • by_serviceId (for student lookup)  │
│  • Totals (R/A/G)    │                                       │
└──────────────────────┴───────────────────────────────────────┘
```

### IndexedDB Schema

```typescript
Database: SonarQuizDB
Version: 1

ObjectStore: students
├─ keyPath: null (use out-of-line keys)
├─ key: "qd/{release}/u{serviceId}" (e.g., "qd/02-2025/uRN2344")
└─ value: StudentRecord {
     schema: 1,
     docId: "core-acs",
     serviceId: "RN2344",
     name: "John Doe",
     release: "02-2025",
     attempted: 15,
     correct: 12,
     updated: "2025-02-14T10:30:00Z",
     pages: {
       "gram-1": {
         answers: [
           { answer: "A", success: true, timestamp: "..." },
           { answer: "B", success: false, timestamp: "..." }
         ],
         state: "incomplete",
         lastAttempted: "2025-02-14T10:29:00Z"
       }
     }
   }

ObjectStore: backups
├─ keyPath: "timestamp"
└─ value: BackupSnapshot {
     timestamp: "2025-02-14T10:00:00Z",
     students: StudentRecord[]
   }
```

### SessionCache Structure

```typescript
interface SessionCache {
  totals: {
    answered: number;  // Total questions answered across all pages
    correct: number;   // Total correct answers across all pages
  };
  pages: {
    [pageId: string]: {
      state: 'unstarted' | 'incomplete' | 'complete';
      answered: number;  // Questions answered on this page
      correct: number;   // Correct answers on this page
      last?: string;     // ISO 8601 timestamp of last attempt
    };
  };
}
```

---

## Security Model

### Threat Model

**Assumptions**:
- Air-gapped environment (no network access)
- Physical access to training machines possible
- Users may attempt to:
  - View quiz answers before attempting
  - Modify scores in browser storage
  - Access instructor mode without password

**Out of Scope**:
- Server-side attacks (no server)
- Network-based attacks (offline system)
- Advanced persistent threats (APTs)

### Security Controls

#### 1. XSS Prevention

**Control**: Never use `innerHTML` with user-controlled data.

```typescript
// ✅ SAFE
const div = document.createElement('div');
div.textContent = userInput; // Automatically escapes

// ❌ DANGEROUS
div.innerHTML = `<strong>${userInput}</strong>`; // XSS risk!
```

**Enforcement**:
- Code review checklist
- ESLint rules (future)
- Grep search before PRs: `rg "innerHTML"`

#### 2. Instructor Password Protection

**Control**: 16-character base64url hash (96-bit security).

```
Password: "instructor123"
         ↓ SHA-256
Hash (256-bit): a1b2c3d4e5f6...
         ↓ Take first 12 bytes (96 bits)
Bytes: [161, 178, 195, 212, ...]
         ↓ Base64url encode
16-char hash: "obLT1OX2Y3p4q5r6"
```

**Brute-force resistance**: 2^96 = 79,228,162,514,264,337,593,543,950,336 combinations

**Implementation**:
- Hash stored in hidden `<span id="instructor-password-hash">` (injected by Oxygen XSL)
- Password entered by user → hashed client-side → compared
- No plaintext password in JavaScript bundle

#### 3. PII Sanitization

**Control**: Secure logger masks sensitive data.

```typescript
import { debug } from './utils/logger';

debug('User logged in:', { serviceId: 'RN2344', name: 'John Doe' });
// Console: User logged in: { serviceId: 'RN****', name: 'J***' }
```

**Patterns**:
- Service ID: `RN2344` → `RN****`
- Name: `John Doe` → `J***`
- Password/Hash: Always `[REDACTED]`

#### 4. Content Security Policy (CSP)

**Control**: CSP headers prevent script injection.

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';
               connect-src 'none';">
```

**Effect**:
- Block inline scripts (`<script>alert('xss')</script>`)
- Block external scripts (no CDN hijacking)
- Block network requests (offline-first enforcement)

---

## Performance Optimizations

### Bundle Size

**Target**: ≤25KB min+gzip

**Techniques**:
1. **Tree-shaking**: Vite removes unused code
2. **Minification**: Terser minifies JavaScript
3. **Compression**: Gzip compression (~70% reduction)
4. **No large dependencies**: Lit 3 is only 15KB

**Monitoring**:
```bash
npm run build        # Build bundle
npm run size-check   # Verify ≤25KB gzipped
```

### Debouncing

**Target**: Reduce auto-save frequency

```typescript
// Instead of saving on EVERY keystroke:
input.addEventListener('input', saveData); // BAD: 100+ saves per second

// Save once after 200ms of inactivity:
debouncer.debounce('auto-save', saveData, 200); // GOOD: ~5 saves per second max
```

### IndexedDB Batching

**Target**: Atomic transactions for consistency

```typescript
// Open transaction once
const tx = db.transaction(['students'], 'readwrite');
const store = tx.objectStore('students');

// Batch multiple operations
await store.put(student1, key1);
await store.put(student2, key2);
await store.put(student3, key3);

// Commit all at once
await tx.complete;
```

### Shadow DOM Isolation

**Benefit**: CSS doesn't leak across components

```
Traditional CSS:
  .button { ... } → Applies GLOBALLY (slow selector matching)

Shadow DOM:
  :host .button { ... } → Scoped to component (fast, isolated)
```

---

## Deployment Model

### Zero-Configuration Deployment

**Goal**: Authors just add one `<script>` tag to DITA template.

#### Step 1: Author adds script tag to WebHelp template

```xml
<!-- Oxygen WebHelp Responsive template -->
<xsl:template match="*[contains(@class, ' topic/body ')]">
  <div class="body">
    <script src="sonar-quiz.iife.js" data-sonar-quiz data-debug="false"></script>
    <xsl:apply-templates/>
  </div>
</xsl:template>
```

#### Step 2: System auto-initializes

```javascript
// Runs automatically on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init(); // Already loaded
}
```

#### Step 3: Tables auto-enhance

```
1. Detect: Find all table.qd-quiz.qd-page
2. Validate: Check structure (3 columns, valid data)
3. Prepare: Hide metadata column
4. Wait: Don't inject controls until user logs in
5. Activate: Inject select/input on qd:login event
```

### File Distribution

```
training-package/
├── index.html                 # Home page
├── topic-1.html               # Quiz page 1
├── topic-2.html               # Quiz page 2
├── sonar-quiz.iife.js         # Quiz system bundle
├── css/
│   └── webhelp.css            # DITA WebHelp styles
└── images/
    └── ...
```

**Delivery**: ZIP file or USB drive (air-gapped)

### Versioning Strategy

**Semantic Versioning**: MAJOR.MINOR.PATCH (e.g., 1.2.3)

- **MAJOR**: Breaking changes (schema migrations required)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes only

**Schema Versioning**:
```typescript
interface StudentRecord {
  schema: 1;  // Version field for future migrations
  // ...
}
```

**Migration Path** (future):
```typescript
if (record.schema === 1) {
  record = migrateV1toV2(record);
}
```

---

## Key Design Decisions

### Why Lit 3?

**Alternatives considered**: React, Vue, Vanilla JS

**Decision**: Lit 3

**Rationale**:
- **Small bundle**: 15KB (React is 40KB+)
- **Native Web Components**: Future-proof, framework-agnostic
- **Shadow DOM**: True CSS isolation
- **TypeScript-first**: Excellent type safety

### Why IndexedDB?

**Alternatives considered**: localStorage, WebSQL

**Decision**: IndexedDB

**Rationale**:
- **Capacity**: 50MB+ (localStorage is 5MB)
- **Structured data**: Store objects directly (no JSON.stringify)
- **Atomic transactions**: Prevent data corruption
- **Asynchronous**: Non-blocking operations

### Why No Backend?

**Alternative considered**: Node.js server with SQLite

**Decision**: Client-only

**Rationale**:
- **Air-gapped deployment**: No network = no server
- **Zero setup**: Authors can't configure servers
- **File protocol**: Must work from `file://` URLs
- **Privacy**: Data never leaves student's machine

### Why SessionStorage + IndexedDB?

**Alternative considered**: IndexedDB only

**Decision**: Hybrid approach

**Rationale**:
- **sessionStorage**: Fast reads for R/A/G state (sync API)
- **IndexedDB**: Persistent storage (survives page refresh)
- **Cache-aside pattern**: Best of both worlds

### Why 30-Minute Session Timeout?

**Alternatives considered**: No timeout, 60-minute timeout

**Decision**: 30 minutes

**Rationale**:
- **Security**: Prevents shoulder surfing after student leaves
- **Usability**: Long enough for typical quiz session
- **Auto-extend**: Each interaction extends timeout
- **Constitution requirement**: Specified in contracts

---

## Extension Points

### For Future Features

#### 1. New Question Types

```typescript
// Add to quiz-parser.ts
export type QuestionKind = 'mcq' | 'numeric' | 'essay'; // NEW

// Add to quiz-table.ts
function enhanceCell(cell: HTMLTableCellElement, questionType: QuestionKind) {
  if (questionType === 'essay') {
    // Inject textarea
  }
}
```

#### 2. New Event Handlers

```typescript
// Add to event-helpers.ts
export const QD_EVENTS = {
  // Existing...
  HINT_REQUESTED: 'qd:hint-requested', // NEW
};

export function emitHintRequested(questionIndex: number): void {
  emitEvent(QD_EVENTS.HINT_REQUESTED, { questionIndex });
}
```

#### 3. New Components

```typescript
// src/components/qd-hints.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('qd-hints')
export class QdHints extends LitElement {
  @property({ type: Array }) hints: string[] = [];

  render() {
    return html`
      <div class="hints">
        ${this.hints.map((hint) => html`<p>${hint}</p>`)}
      </div>
    `;
  }
}
```

---

## Glossary

- **DITA**: Darwin Information Typing Architecture (XML documentation standard)
- **R/A/G**: Red/Amber/Green (completion state indicators)
- **Service ID**: Student identifier (e.g., "RN2344")
- **Release ID**: Training cohort/version (e.g., "02-2025")
- **Page ID**: Unique page identifier (e.g., "gram-1")
- **TDD**: Test-Driven Development
- **XSS**: Cross-Site Scripting
- **CSP**: Content Security Policy
- **IIFE**: Immediately Invoked Function Expression
- **ESM**: ECMAScript Module

---

## References

- **Lit Documentation**: https://lit.dev/
- **IndexedDB API**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Web Components**: https://developer.mozilla.org/en-US/docs/Web/Web_Components
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
- **CLAUDE.md**: Project-specific instructions
- **CONTRIBUTING.md**: Developer workflow guide
