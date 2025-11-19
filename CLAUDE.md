# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrowserTest (internally "Sonar Quiz System") is an offline-first interactive quiz and analysis platform that progressively enhances DITA-published HTML training materials. The system operates entirely from `file://` URLs with no network dependencies, targeting air-gapped training environments.

**Current Phase**: Phase 1 Complete (Foundation Layer) → Starting Phase 2 (Components & Integration)

## Core Architecture

### Progressive Enhancement Pattern
The system enhances existing DITA HTML without modification through DOM upgrades:
- Detect tables with specific classes (`qd-quiz`, `qd-analysis`)
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
  - Database name: `BrowserTest` (defined in `src/services/storage/indexeddb.ts`)
  - Object stores: `students`, `backups`
- **sessionStorage**: Active session + R/A/G cache (expires 30 min)
- **No network**: All data remains local, no telemetry/CDN/remote config

### Component Layers
1. **DOM Enhancement** (`src/enhancers/`): Detect and upgrade DITA tables
2. **Service Layer** (`src/services/`): Business logic, state management, event coordination
3. **Component Layer** (`src/components/`): Lit 3 Web Components with Shadow DOM
4. **Storage Layer** (`src/services/storage/`): IndexedDB adapter with atomic transactions

### Component Architecture

#### **Login Component** (`<qd-login>`)
Compact login interface with modal for instructor access:
- **Default View**: Student login form (serviceId + name fields, Login + Instructor buttons)
- **Instructor Modal**: Password entry popup (opens on "Instructor" button click)
- **Release ID Extraction**: **CRITICAL** - Release ID comes from `.wh_publication_title .title` element in the document DOM, NOT from any form input
  - DOM selector: `document.querySelector('.wh_publication_title .title')`
  - Example HTML structure required:
    ```html
    <div class="wh_publication_title">
      <span class="title">TRV Connectors Autumn 2025</span>
    </div>
    ```
  - If missing, login will fail with error: "Release not found (missing .wh_publication_title .title element)"
- **Behavior**:
  - Student login: Validates, creates session, shows student status panel
  - Instructor login: Opens modal, validates password (SHA-256 + rate limiting), shows instructor status panel
- Integrates with SessionService and instructor password verification
- Emits `qd:login` event on successful authentication

#### **Status Panels** (Conditional Rendering)
After successful login, ONE of these panels is displayed:

**Student Status Panel** (`<qd-student-status>`):
- Quiz progress display (R/A/G badges, answered/correct counts, percentage)
- Logout button
- Updates in real-time via session cache

**Instructor Status Panel** (`<qd-instructor-status>`):
Consolidated control center with:
- **Toggle**: Show/hide student answers on current page
  - For quiz tables: Inserts `<div>` after each question's input control
  - Shows list of students (name + last 4 digits of serviceId)
  - Each student entry shows: answer + shortened timestamp
  - Red/green color coding for incorrect/correct answers
  - For analysis tables: Shows student entries in comparison format
- **Button**: "View All Scores" → Opens `<qd-scores-modal>`
- **Button**: "Export to CSV" → Downloads detailed answer data
- **Button**: "Erase All Data" → Clears all storage (with confirmation dialog)
- **Button**: "Logout"

#### **Scores Modal** (`<qd-scores-modal>`)
Modal overlay (Esc to close) showing:
- Student list with totals (attempted, correct, percentage)
- Per-student expandable breakdown showing per-page answers
- Close button

#### **Table Enhancement**
**Quiz Tables** (`qd-quiz` class):
- **SECURITY**: Immediately extract and remove answer column from DOM on load
- Correct answers stored in memory only (prevents view-source inspection)
- Render MCQ radio buttons or numeric input fields
- Submit answers, validate against in-memory answers
- Save to IndexedDB via storage adapter
- If instructor mode active: Show student answers after each question

**Analysis Tables** (`qd-analysis` class):
- Make cells with class="interactive" editable (contenteditable)
- Auto-save to IndexedDB with debouncing
- If instructor mode active: Show student entries

#### **Home Page Badges**
- R/A/G badges injected into navigation links (class `quizPageBtn`)
- Real-time updates from session cache
- Listen to `qd:answer-saved` events for immediate refresh

### Storage Monitor (Development Tool)
The `<qd-storage-monitor>` component provides real-time inspection of browser storage during development:
- **Auto-injected** when `DEBUG_MODE = true` in `src/index.ts`
- **Configuration**: Set `dbName` attribute to specify the IndexedDB database to monitor
  - Default: `'quiz-scores'` (generic default for reusability)
  - Sonar Quiz System: `'BrowserTest'` (automatically set when auto-injected)
- **Usage examples**:
  ```html
  <!-- Auto-injected by system (uses BrowserTest) -->
  <script defer src="sonar-quiz.iife.js"></script>

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
npm run test:e2e        # Playwright E2E tests (auto-starts/stops Storybook)
npm run chromatic       # Visual regression tests

# Building
npm run build           # Production build (IIFE + ESM)
npm run build:dita      # Build + copy bundle to DITA directories
npm run update-dita-demo # Sync dita/out/oxygen → dita-demo/ (for PR previews)
npm run lint            # TypeScript + ESLint checks
npm run format:check    # Prettier formatting verification

# Size verification
npm run size-check      # Verify bundle <35KB min+gzip
```

## GitHub Pages Deployment

### Deployment Method
**Branch-based**: Both workflows push to `gh-pages` branch, GitHub Pages serves from there.

### Production (Main Branch)
Live at: `https://DeepBlueCLtd.github.io/BrowserTest/main/`
- Deploys demo files to `main/` folder in `gh-pages` branch
- Auto-deploys on every push to `main`
- Workflow: `.github/workflows/pages.yml`
- Content: demo HTML files + dist/ bundle

### PR Preview Deployments
Each PR automatically gets a preview deployment:
- **DITA WebHelp**: `https://DeepBlueCLtd.github.io/BrowserTest/pr-{number}/`
- **Storybook**: `https://DeepBlueCLtd.github.io/BrowserTest/pr-{number}/storybook/`
- **Auto-posted**: PR comment includes live preview links
- **Auto-cleanup**: Preview deleted when PR closes/merges
- **Build policy**: Requires successful compilation, ignores test failures
- **Workflow**: `.github/workflows/pr-preview.yml`
- Content: DITA output + Storybook static build

**Prerequisites**:
- GitHub Pages enabled with "Deploy from a branch" → `gh-pages` branch (Settings → Pages)
- Workflow permissions: "Read and write" (Settings → Actions → General → Workflow permissions)
- `dita-demo/` directory populated (run `npm run update-dita-demo` after DITA builds)

**DITA Demo Sync**:
- `dita-demo/` is version-controlled and deployed by CI
- After building DITA output: `npm run update-dita-demo` to sync `dita/out/oxygen/` → `dita-demo/`
- Commit updated `dita-demo/` before pushing PR for preview deployment

**Path structure on gh-pages branch**:
```
gh-pages/
├── main/                    # Production demo (main branch)
│   ├── quiz-index.html
│   ├── dist/
│   └── ...
├── pr-123/                  # PR #123 preview
│   ├── oxygen-webhelp/      # DITA output (from dita-demo/)
│   └── storybook/           # Storybook static build
├── pr-124/                  # PR #124 preview
│   ├── oxygen-webhelp/
│   └── storybook/
...
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

All demo files load the built bundle from `dist/sonar-quiz.iife.js` with configuration provided via hidden `<span>` elements. Debug mode is controlled by `DEBUG_MODE` constant in `src/index.ts`. See **demo/README.md** for:
- Detailed test scenarios (login, quiz interaction, analysis tables, session management)
- Browser DevTools inspection tips (IndexedDB, sessionStorage, custom events)
- Configuration examples using hidden span elements
- Troubleshooting common issues
- E2E testing integration guidance

## Definition of Done

**CRITICAL**: Before marking ANY task as complete, ALL of the following must pass with ZERO errors:

```bash
# 1. TypeScript type checking (MUST pass)
npm run typecheck

# 2. Linter (zero errors required, warnings acceptable with justification)
npm run lint

# 3. Unit tests (all must pass, zero failures)
npm run test:unit

# 4. Integration tests (if applicable to the task)
npm run test:integration

# 5. Format check (code must be properly formatted)
npm run format:check

# 6. Build (final verification before commit)
npm run build
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
- [ ] Bundle size within limits (<35KB gzipped)
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
- Bundle: ≤35KB min+gzip IIFE
- Operations: <200ms save, <2s page load (50 questions)
- Shadow DOM for isolation, no global CSS pollution

### VI. Data Isolation & Privacy
- Composite keys: `qd/{release}/u{serviceId}`
- 30-minute session timeout
- Complete data erasure capability for cohort reset

### VII. Zero Configuration Deployment
- Single `<script defer src="sonar-quiz.iife.js"></script>` tag in DITA template (no attributes required)
- Auto-init on DOMContentLoaded (always runs when script loads)
- Configuration via hidden `<span>` elements injected by DITA/Oxygen transform:
  - `#qd-status-container`: CSS selector for status panel (default: `.wh_top_menu_and_indexterms_link`)
  - `#qd-title-selector`: CSS selector for publication title/Release ID (default: `.wh_publication_title .title`)
  - `#qd-db-name`: IndexedDB database name (default: `BrowserTest`)
  - `#qd-instructor-hash`: SHA-256 hash of instructor password (optional)
- Debug mode controlled by `DEBUG_MODE` constant in `src/index.ts` (single toggle point)
- No setup, no manual config, no network dependencies

**Example HTML Structure** (injected by DITA/Oxygen transform):
```html
<body>
  <!-- Configuration spans (hidden, injected by Oxygen XSL transform) -->
  <span id="qd-status-container" style="display:none;">.wh_top_menu_and_indexterms_link</span>
  <span id="qd-title-selector" style="display:none;">.wh_publication_title .title</span>
  <span id="qd-db-name" style="display:none;">BrowserTest</span>
  <span id="qd-instructor-hash" style="display:none;">5e884898da28...</span>

  <!-- Page content -->
  <div id="page-content">
    <nav class="wh_top_menu_and_indexterms_link">
      <div class="wh_publication_title">
        <span class="title">TRV Connectors Autumn 2025</span>
      </div>
    </nav>
    <!-- ... rest of content ... -->
  </div>

  <!-- Script tag (no attributes required) -->
  <script defer src="sonar-quiz.iife.js"></script>
</body>
```

### VIII. Answer Security
- **CRITICAL**: Quiz answers MUST be removed from DOM immediately on component load
- Correct answers extracted, stored in memory (JavaScript closure), never exposed in DOM
- This prevents students from viewing page source or using DevTools to see answers
- Implementation order: Parse → Store in memory → Remove from DOM → Render controls
- Validation performed against in-memory answers only

## Frozen Contracts (src/types/contracts.ts)

**DO NOT MODIFY** without version bump and migration strategy.

### Key Types
```typescript
// Identity
type ReleaseId = string;      // "MM-YYYY"
type ServiceId = string;      // e.g. "RN2344"
type PageId = string;         // e.g. "gram-1"
type TableId = string;        // 16-char hash from structure
type CellKey = string;        // "R{row}C{col}#f:{hash}" (8-char content hash)

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
- Class: `qd-quiz`
- MCQ: Use `<ol>` lists (1-indexed, first option = 1)
- Numeric: Tolerance in third column
- **Maximum ONE** quiz table per page

### Analysis Tables
- Class: `qd-analysis`
- Cells WITH class="interactive" = editable (in interactive mode)
- Cells WITHOUT 'interactive' class = read-only (always)
- **Maximum ONE** analysis table per page

### Home Page
- Status panel: Auto-injected as last child of configured navbar container
  - Default: `.wh_top_menu_and_indexterms_link` (Oxygen WebHelp)
  - Configure via hidden `<span id="qd-status-container">selector</span>` element
  - **Not logged in**: Shows login form within status panel
  - **Logged in**: Shows quiz progress (R/A/G state, counts, percentage)
  - **Logout**: Button at bottom-right clears sessionStorage and shows login form
- Navigation links: Add class `quizPageBtn` for R/A/G badges
- Publication title: Must have element matching selector in `<span id="qd-title-selector">` (default: `.wh_publication_title .title`) for Release ID extraction

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

### TableId Generation
Format: 16-character hash derived from table structure
- Based on: `{rows}x{cols}:{className}`
- Example: "8e2b4a1c9f3d7b6e"
- Used to uniquely identify analysis tables

### Cell Keys for Analysis
Format: `R{row}C{col}#f:{hash}`
- Hash: 8-character hash from normalized content (whitespace collapsed)
- Unique identifier for analysis table cells
- Example: "R2C4#f:abc123de"

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

1. ✅ **Type checking passes**: `npm run typecheck` (fast TypeScript type checking)
2. ✅ **Tests pass**: `npm run test:unit` (and `npm run test:integration` if applicable)
3. ✅ **Linting passes**: `npm run lint` (fix with `npm run lint:fix` if needed)
4. ✅ **Formatting passes**: `npm run format:check` (fix with `npm run format` if needed)
5. ✅ **Build succeeds**: `npm run build` (if modifying source files)
6. ✅ **Bundle size**: Under 35KB min+gzip (verify with `npm run size-check` if needed)

**Rationale**: CI will fail if any of these checks fail. Running them locally before committing prevents failed CI builds and reduces feedback cycles.

### Phase Exit Gates
- **Phase 0**: Contracts published, Storybook renders, CI green
- **Phase 1**: Chromatic interactions pass, parsing unit tests
- **Phase 2**: Visual baselines stable, cell mapping tests
- **Phase 3**: A11y checks pass, event emission verified
- **Phase 4**: Session switch tests, expiry unit tests
- **Phase 5**: E2E file:// saves/reloads, CSV validation
- **Phase 6**: Perf/a11y green, <35KB budget met

### E2E Testing Configuration
E2E tests run via Playwright against Storybook stories at `http://localhost:6006`.

**Key Configuration** (`playwright.config.ts`):
- **Auto-start/stop**: Playwright automatically starts Storybook before tests and kills it on completion
- **Storybook startup timeout**: 12 seconds (Storybook reliably starts within 10s)
- **Test timeout**: 2 seconds max per test (local SPA, no network delays)
- **Action/navigation timeout**: 2 seconds max (clicks, fills, page.goto)
- **Expect timeout**: 2 seconds max for assertions
- **Reuse existing server**: If Storybook already running locally, tests will use it instead of starting new instance

**Usage**:
```bash
npm run test:e2e        # Just run tests - Storybook auto-managed
npm run test:e2e:headed # Run with visible browser
npm run test:e2e:debug  # Debug mode with Playwright Inspector
```

**No manual Storybook management required** - the test runner handles lifecycle automatically.

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
- **ARCHITECTURE_FLOWS.md**: Event flows, login processes, DOM patterns, service interactions
- **Contracts.md**: Frozen types and interfaces
- **Delivery_Plan.md**: 8-phase plan with exit gates
- **demo/README.md**: Demo HTML files, testing workflows, troubleshooting guide
- **specs/001-sonar-quiz-system/**: Feature spec, plan, data model, contracts

## Common Patterns

### Release ID Extraction
**CRITICAL**: The `ReleaseId` is ALWAYS extracted from the DOM, never from user input.

```typescript
// CORRECT: Extract from DOM
const titleElement = document.querySelector('.wh_publication_title .title');
const release = titleElement?.textContent?.trim() || '';

// WRONG: There is NO release input field in forms
// const release = form.elements.release.value; // ❌ DOES NOT EXIST
```

**Required DOM Structure** (added by DITA publishing):
```html
<div class="wh_publication_title">
  <span class="title">TRV Connectors Autumn 2025</span>
</div>
```

**Testing/Storybook**: All stories MUST inject this element into the DOM before rendering login components.

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

## Build Output

- **IIFE**: `dist/sonar-quiz.iife.js` (global `window.SonarQuiz`, auto-init)
- **ESM**: `dist/sonar-quiz.esm.js` (for integrators)
- **Size limit**: ≤35KB min+gzip for IIFE
- **Source maps**: Generated for debugging
- **TypeScript definitions**: For ESM consumers

## Active Technologies
- TypeScript 5.x / JavaScript ES2020+ + Lit 3.0 (Web Components), Vite 5.x (build), Vitest (testing) (001-security-refactor)
- IndexedDB (primary), sessionStorage (active session) (001-security-refactor)

## Recent Changes
- 001-security-refactor: Added TypeScript 5.x / JavaScript ES2020+ + Lit 3.0 (Web Components), Vite 5.x (build), Vitest (testing)
