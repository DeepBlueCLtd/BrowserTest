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
npm run size-check      # Verify bundle <25KB min+gzip
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
- [ ] Bundle size within limits (<25KB gzipped)
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
- Bundle: ≤25KB min+gzip IIFE
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

## Release Detection

**The release identifier is extracted from the DOM structure.**

The system looks for a specific DOM pattern in the published HTML:
```html
<div class="wh_publication_title">
  <a href="..."><span class="title">Document Title Text</span></a>
</div>
```

- **Container class**: Configurable via `titleContainerClass` option (default: `wh_publication_title`)
- **Title element**: The text content of `<span class="title">` within the container
- **No parsing**: The entire text content is used as the release ID
- **Warning displayed** on login if the structure is not found
- **Examples**:
  - `<span class="title">TRV Connectors Autumn 2025</span>` → Release ID: `"TRV Connectors Autumn 2025"`
  - `<span class="title">Core Skills 02-2025</span>` → Release ID: `"Core Skills 02-2025"`
  - `<span class="title">Field Manual Pub-10 Mar 2025</span>` → Release ID: `"Field Manual Pub-10 Mar 2025"`

**Author requirement**: Ensure each DITA map has a unique title that gets published into this DOM structure.

**Configuration**: Set `titleContainerClass` in init() or via `data-title-container-class` attribute on the script tag to match your publishing system's structure.

## Frozen Contracts (src/types/contracts.ts)

**DO NOT MODIFY** without version bump and migration strategy.

### Key Types
```typescript
// Identity
type ReleaseId = string;      // Full document title (e.g., "TRV Connectors Autumn 2025")
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
5. ✅ **Bundle size**: Under 25KB min+gzip (verify with `npm run size-check` if needed)

**Rationale**: CI will fail if any of these checks fail. Running them locally before committing prevents failed CI builds and reduces feedback cycles.

### Phase Exit Gates
- **Phase 0**: Contracts published, Storybook renders, CI green
- **Phase 1**: Chromatic interactions pass, parsing unit tests
- **Phase 2**: Visual baselines stable, cell mapping tests
- **Phase 3**: A11y checks pass, event emission verified
- **Phase 4**: Session switch tests, expiry unit tests
- **Phase 5**: E2E file:// saves/reloads, CSV validation
- **Phase 6**: Perf/a11y green, <25KB budget met

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

## Build Output

- **IIFE**: `dist/sonar-quiz.iife.js` (global `window.SonarQuiz`, auto-init)
- **ESM**: `dist/sonar-quiz.esm.js` (for integrators)
- **Size limit**: ≤25KB min+gzip for IIFE
- **Source maps**: Generated for debugging
- **TypeScript definitions**: For ESM consumers

## Active Technologies
- TypeScript 5.x / JavaScript ES2020+ + Lit 3.0 (Web Components), Vite 5.x (build), Vitest (testing) (001-security-refactor)
- IndexedDB (primary), sessionStorage (active session) (001-security-refactor)

## Recent Changes
- 001-security-refactor: Added TypeScript 5.x / JavaScript ES2020+ + Lit 3.0 (Web Components), Vite 5.x (build), Vitest (testing)
