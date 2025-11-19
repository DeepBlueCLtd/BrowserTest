# Architecture Flows and Patterns

This document captures the deep architectural patterns, event flows, and DOM manipulation strategies used in the Sonar Quiz System.

## Table of Contents
1. [Event System Architecture](#event-system-architecture)
2. [Login Process Flows](#login-process-flows)
3. [DOM Class Identification Strategy](#dom-class-identification-strategy)
4. [Data Flow Sequences](#data-flow-sequences)
5. [Service Layer Interactions](#service-layer-interactions)

---

## 1. Event System Architecture

### Event Namespace
All custom events use the `qd:` namespace for isolation and clarity.

### Event Producers and Consumers

```mermaid
graph LR
    subgraph Producers
        A[qd-login component]
        B[qd-status component]
        C[qd-instructor component]
        D[quiz-table enhancer]
        E[index.ts orchestrator]
    end

    subgraph Events
        F[qd:login]
        G[qd:logout]
        H[qd:answer-saved]
        I[qd:state-changed]
        J[qd:instructor-unlock]
        K[qd:data-cleared]
    end

    subgraph Consumers
        L[index.ts handlers]
        M[home-badges enhancer]
        N[qd-storage-monitor]
        O[session service]
    end

    A --> F
    B --> G
    C --> J & K
    D --> H
    E --> I

    F --> L & M & N
    G --> L & M & N
    H --> L & N
    I --> M & N
    J --> N
    K --> N
```

### Event Details

| Event | Producer | Consumers | Payload | Purpose |
|-------|----------|-----------|---------|---------|
| `qd:login` | qd-login | index.ts, home-badges, storage-monitor | SessionData | User authentication |
| `qd:logout` | qd-status | index.ts, home-badges, storage-monitor | {serviceId} | Session termination |
| `qd:answer-saved` | quiz-table enhancer | index.ts, storage-monitor | {pageId, answer} | Quiz progress |
| `qd:state-changed` | index.ts | home-badges, storage-monitor | {pageId, state} | Page completion state |
| `qd:instructor-unlock` | qd-instructor | storage-monitor, quiz tables | {timestamp} | Reveal answers |
| `qd:instructor-login` | qd-login, qd-status | index.ts | {password} | Instructor auth |
| `qd:data-cleared` | qd-instructor | storage-monitor | {timestamp} | Data erasure |

---

## 2. Login Process Flows

### Release ID Extraction
**CRITICAL**: Before any login can succeed, the system must extract the Release ID from the DOM structure created by DITA publishing.

```typescript
// Release ID is ALWAYS extracted from DOM, NEVER from user input
const titleElement = document.querySelector('.wh_publication_title .title');
const release = titleElement?.textContent?.trim() || '';

// Required HTML structure (added by DITA):
// <div class="wh_publication_title">
//   <span class="title">TRV Connectors Autumn 2025</span>
// </div>
```

**Common Mistake**: Attempting to read `release` from a form input field. This field does NOT exist - release comes from the publication title element only.

### Three Login Paths

```mermaid
sequenceDiagram
    participant User
    participant DOM
    participant qd-login
    participant EventBus
    participant index.ts
    participant SessionService
    participant Storage

    alt Path 1: Initial Login (No Session)
        User->>DOM: Visit page
        DOM->>qd-login: Render login form
        qd-login->>DOM: Extract release from .wh_publication_title .title
        User->>qd-login: Enter name + serviceId
        qd-login->>EventBus: Dispatch qd:login (with release)
        EventBus->>index.ts: Handle login
        index.ts->>SessionService: Create session
        SessionService->>Storage: Save to sessionStorage
        index.ts->>DOM: Rebuild cache from IndexedDB
    else Path 2: Instructor Login
        User->>qd-status: Click instructor button
        qd-status->>EventBus: Dispatch qd:instructor-login
        EventBus->>index.ts: Show instructor modal
        User->>qd-instructor: Enter password
        qd-instructor->>EventBus: Dispatch qd:instructor-unlock
        EventBus->>DOM: Reveal correct answers
    else Path 3: Session Resume
        User->>DOM: Return to page
        DOM->>SessionService: Check sessionStorage
        SessionService-->>DOM: Valid session exists
        DOM->>index.ts: Load existing session
        index.ts->>DOM: Apply cached state
    end
```

### Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> NoSession: Page Load
    NoSession --> LoginForm: No session found
    LoginForm --> ActiveSession: qd:login event

    ActiveSession --> ActiveSession: User activity (30 min timeout)
    ActiveSession --> Expiring: 25 minutes idle
    Expiring --> ActiveSession: User activity
    Expiring --> Expired: 30 minutes reached

    ActiveSession --> InstructorMode: qd:instructor-unlock
    InstructorMode --> ActiveSession: qd:instructor-lock

    ActiveSession --> LoggedOut: qd:logout
    Expired --> NoSession: Auto-logout
    LoggedOut --> NoSession: Clear storage

    [*] --> ActiveSession: Valid session in storage
```

---

## 3. DOM Class Identification Strategy

### CSS Class Hierarchy

```
Document Root
├── Publication Title (.wh_publication_title)
│   └── Title Text (.title) [RELEASE ID SOURCE]
│
├── Navigation (.wh_top_menu_and_indexterms_link)
│   └── Status Panel (#qd-status) [INJECTED]
│
├── Content Area
│   ├── Quiz Tables (table.qd-quiz)
│   │   ├── Question Rows
│   │   └── Answer Controls [ENHANCED]
│   │
│   └── Analysis Tables (table.qd-analysis)
│       ├── Static Cells (with background-color)
│       └── Editable Cells [ENHANCED]
│
└── Home Page
    └── Navigation Links (.quizPageBtn)
        └── Status Badges (.qd-badge) [INJECTED]
```

### Class Detection and Enhancement

| CSS Class | Purpose | Detection Method | Enhancement |
|-----------|---------|------------------|-------------|
| `.qd-quiz` | Quiz table marker | `querySelectorAll('table.qd-quiz')` | Convert to interactive quiz |
| `.qd-analysis` | Analysis table marker | `querySelectorAll('table.qd-analysis')` | Add editable inputs |
| `.quizPageBtn` | Navigation links | `querySelectorAll('.quizPageBtn')` | Inject R/A/G badges |
| `.wh_top_menu_and_indexterms_link` | Status panel container | `querySelector(config.statusPanelContainer)` | Append qd-status |
| `#qd-status` | Status panel anchor | `getElementById('qd-status')` | Replace with component |

### DOM Enhancement Flow

```mermaid
graph TD
    A[DOMContentLoaded] --> B{Page Type?}

    B -->|Quiz Page| C[Find table.qd-quiz]
    C --> D[Parse Questions]
    D --> E[Replace cells with controls]
    E --> F[Attach event listeners]

    B -->|Analysis Page| G[Find table.qd-analysis]
    G --> H[Identify editable cells]
    H --> I[Insert input elements]
    I --> J[Bind to storage]

    B -->|Home Page| K[Find .quizPageBtn links]
    K --> L[Extract page IDs]
    L --> M[Load session cache]
    M --> N[Inject colored badges]

    B -->|All Pages| O[Find status container]
    O --> P{Session exists?}
    P -->|Yes| Q[Show qd-status]
    P -->|No| R[Show qd-login]
```

---

## 4. Data Flow Sequences

### Quiz Answer Save Flow

```mermaid
sequenceDiagram
    participant User
    participant Select/Input
    participant QuizEnhancer
    participant EventBus
    participant IndexHandler
    participant ScoresService
    participant Storage
    participant StateCalc
    participant Cache

    User->>Select/Input: Change answer
    Select/Input->>QuizEnhancer: onChange event
    QuizEnhancer->>QuizEnhancer: Validate answer
    QuizEnhancer->>EventBus: qd:answer-saved
    EventBus->>IndexHandler: Handle event
    IndexHandler->>ScoresService: Save answer
    ScoresService->>Storage: Update IndexedDB
    Storage-->>ScoresService: Confirm
    ScoresService->>StateCalc: Calculate new state
    StateCalc-->>ScoresService: Return state
    ScoresService->>Cache: Update sessionStorage
    IndexHandler->>EventBus: qd:state-changed
    EventBus->>DOM: Update UI elements
```

### Analysis Cell Edit Flow

```mermaid
sequenceDiagram
    participant User
    participant Input
    participant AnalysisEnhancer
    participant AnalysisService
    participant Storage
    participant Cache

    User->>Input: Type in cell
    Input->>AnalysisEnhancer: onInput (debounced)
    AnalysisEnhancer->>AnalysisService: Update cell value
    AnalysisService->>Storage: Save to IndexedDB
    Storage-->>AnalysisService: Confirm
    AnalysisService->>Cache: Update timestamps
    Cache-->>DOM: Reflect saved state
```

---

## 5. Service Layer Interactions

### Service Dependencies

```mermaid
graph TD
    subgraph Presentation Layer
        A[Components<br/>qd-login, qd-status]
        B[Enhancers<br/>quiz-table, analysis-table]
    end

    subgraph Orchestration
        C[index.ts<br/>Main Controller]
    end

    subgraph Service Layer
        D[SessionService]
        E[ScoresService]
        F[ValidationService]
        G[CSVExportService]
        H[StateCalculator]
    end

    subgraph Storage Layer
        I[IndexedDBAdapter]
        J[SessionStorage<br/>Cache]
    end

    A --> C
    B --> C
    C --> D & E & F
    D --> J
    E --> I & H
    F --> A & B
    G --> E
    H --> J
```

### Service Responsibilities

| Service | Purpose | Dependencies | Events |
|---------|---------|--------------|--------|
| SessionService | Manage user sessions | SessionStorage | qd:login, qd:logout |
| ScoresService | Save/load quiz answers | IndexedDBAdapter, StateCalculator | qd:answer-saved |
| ValidationService | Validate author content | None | Error banners |
| StateCalculator | Compute R/A/G states | None | qd:state-changed |
| CSVExportService | Export quiz results | ScoresService | Download trigger |
| IndexedDBAdapter | Persistent storage | None | Storage events |

### Critical Service Interactions

1. **Session Creation**:
   ```
   qd-login → SessionService.create() → sessionStorage → Rebuild cache from IndexedDB
   ```

2. **Answer Save**:
   ```
   Quiz input → ScoresService.saveAnswer() → IndexedDB → StateCalculator → Cache update → Event dispatch
   ```

3. **Instructor Unlock**:
   ```
   Password verify → Session.instructorUnlocked = true → Broadcast to all tables → Reveal overlays
   ```

4. **Cache Rebuild**:
   ```
   Login/Logout → Clear cache → Iterate IndexedDB records → Calculate states → Write to sessionStorage
   ```

---

## Architectural Decisions

### Why Custom Events?
- **Decoupling**: Components don't need direct references
- **Debugging**: All events visible in DevTools
- **Extensibility**: New consumers can listen without modifying producers
- **Cross-frame**: Events can bubble through Shadow DOM boundaries

### Why SessionStorage for Cache?
- **Performance**: Faster than IndexedDB for frequent reads
- **Automatic cleanup**: Clears on tab close
- **Synchronous API**: No async overhead for UI updates
- **Session-scoped**: Natural session boundary

### Why CSS Classes for Detection?
- **Author-friendly**: Content creators understand CSS
- **Stable contracts**: Classes unlikely to change
- **Progressive enhancement**: Works without JavaScript
- **Tooling support**: Oxygen editor shows classes

### Why Shadow DOM for Components?
- **Style isolation**: No CSS leakage
- **Encapsulation**: Protected internal state
- **Standard API**: Native browser feature
- **Event bubbling**: Still participates in document events