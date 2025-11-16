# Sonar Quiz System - Rewrite Implementation Plan

**Date:** 2025-11-16
**Project:** Sonar Quiz System
**Branch:** `claude/translate-rewrite-strategy-01FoiPtu7XWFPRkSRiTZaDuu`
**Source:** [REWRITE_STRATEGY.md](./REWRITE_STRATEGY.md)
**Timeline:** 3 days (24 hours development time)

---

## Document Purpose

This plan translates the rewrite strategy into **discrete, testable, achievable goals** with clear acceptance criteria. Each task includes:
- **Description**: What needs to be done
- **Acceptance Criteria**: How we know it's complete
- **Testing Requirements**: What tests must pass
- **Dependencies**: What must be done first
- **Estimated Time**: How long it should take

---

## Phase 0: Preparation (2 hours)

### Goal 0.1: Archive Existing Code
**Description:** Create `.rewrite-reference/` directory with complete backup of current implementation.

**Tasks:**
- [ ] Create `.rewrite-reference/` directory
- [ ] Copy `src/` → `.rewrite-reference/old-src/`
- [ ] Copy `tests/` → `.rewrite-reference/old-tests/`
- [ ] Copy `stories/` → `.rewrite-reference/old-stories/`
- [ ] Create `.rewrite-reference/LESSONS_LEARNED.md` documenting issues from POST_PHASE_7_REVIEW.md

**Acceptance Criteria:**
- ✅ All source code backed up and accessible
- ✅ Archive directory excluded from build (`.gitignore` updated)
- ✅ LESSONS_LEARNED.md documents 7 security issues + 4 code quality issues

**Testing:** Manual verification of file copies
**Dependencies:** None
**Time:** 30 minutes

---

### Goal 0.2: Environment Configuration
**Description:** Set up security configuration and build environment.

**Tasks:**
- [ ] Create `.env.example` with all required variables
- [ ] Generate sample instructor password hash
- [ ] Document hash generation process
- [ ] Create local `.env` file (not committed)
- [ ] Verify build tools ready

**Acceptance Criteria:**
- ✅ `.env.example` contains `VITE_INSTRUCTOR_PASSWORD_HASH` and `VITE_DEBUG`
- ✅ Hash generation documented with example command
- ✅ Local `.env` file created and working
- ✅ `npm run build` succeeds with env vars

**Testing:**
```bash
# Verify env var loading
npm run build
# Should require VITE_INSTRUCTOR_PASSWORD_HASH
```

**Dependencies:** None
**Time:** 30 minutes

---

### Goal 0.3: Clean Workspace
**Description:** Delete existing implementation to start fresh.

**Tasks:**
- [ ] Delete `src/` directory (backed up in `.rewrite-reference/`)
- [ ] Delete `tests/` directory (backed up)
- [ ] Delete `stories/` directory (backed up)
- [ ] Recreate empty directory structure
- [ ] Commit deletion with clear message

**Acceptance Criteria:**
- ✅ Old code deleted from workspace
- ✅ Empty directories recreated: `src/`, `tests/`, `stories/`
- ✅ Archive verified intact
- ✅ Git commit documents clean slate

**Testing:** Verify build fails (no source files)
**Dependencies:** Goal 0.1 complete
**Time:** 15 minutes

---

### Goal 0.4: TypeScript Configuration
**Description:** Configure strict TypeScript and ESLint for zero tolerance on type issues.

**Tasks:**
- [ ] Update `tsconfig.json` with strict mode flags
- [ ] Update `.eslintrc.json` to error on `any` types
- [ ] Add ESLint rules for unsafe type operations
- [ ] Document zero tolerance policy

**Acceptance Criteria:**
- ✅ `strict: true` enabled
- ✅ `noUncheckedIndexedAccess: true` enabled
- ✅ `@typescript-eslint/no-explicit-any: "error"` configured
- ✅ `@typescript-eslint/no-unsafe-assignment: "error"` configured
- ✅ Configuration committed

**Testing:**
```bash
npm run lint
# Should pass on empty codebase
```

**Dependencies:** Goal 0.3 complete
**Time:** 45 minutes

---

## Phase 1: Foundation - Day 1 (8-10 hours)

### Goal 1.1: Type Contracts
**Description:** Define all interfaces with corrected `PageCache` including `answers` field.

**Location:** `src/types/contracts.ts`

**Tasks:**
- [ ] Define `ReleaseId`, `ServiceId`, `PageId`, `TableId`, `CellKey` types
- [ ] Define `CompletionState`, `QuestionKind` enums
- [ ] Define `AnswerRecord` interface with timestamp
- [ ] Define `PageCache` interface **with `answers?: AnswerRecord[]` field**
- [ ] Define `SessionCache` interface
- [ ] Define `SessionData` interface
- [ ] Define `StudentRecord` interface
- [ ] Define `ParsedQuizTable`, `ParsedAnalysisTable` interfaces
- [ ] Add JSDoc comments to all types

**Acceptance Criteria:**
- ✅ All 8+ interfaces defined with JSDoc
- ✅ `PageCache.answers` field present (fixes root cause of 78 eslint-disable comments)
- ✅ Zero `any` types used
- ✅ TypeScript compilation succeeds
- ✅ ESLint passes with zero errors

**Testing:**
```bash
npm run build
npm run lint
```

**Dependencies:** Goal 0.4 complete
**Time:** 1 hour

---

### Goal 1.2: Security Utilities
**Description:** Implement core security primitives (rate limiting, constant-time comparison, safe logging).

**Location:** `src/utils/security.ts`, `src/utils/logger.ts`, `src/config/instructor-password.ts`

**Tasks:**
- [ ] Implement `RateLimiter` class with exponential backoff
- [ ] Implement `constantTimeCompare()` using Web Crypto API
- [ ] Implement `logger` with debug/info/error levels
- [ ] Implement `sanitize()` to mask sensitive data
- [ ] Implement `getInstructorPasswordHash()` from env var
- [ ] Write unit tests for all security functions

**Acceptance Criteria:**
- ✅ RateLimiter enforces delays: 2s, 4s, 8s, 16s, 30s (max)
- ✅ `constantTimeCompare()` uses crypto primitives (not `===`)
- ✅ Logger respects `VITE_DEBUG` flag
- ✅ `sanitize()` masks serviceId and removes name/passwordHash
- ✅ `getInstructorPasswordHash()` throws if env var missing
- ✅ All tests pass

**Testing:**
```bash
npm run test:unit -- security.test.ts
npm run test:unit -- logger.test.ts
npm run test:unit -- instructor-password.test.ts
```

**Unit Tests Required:**
- `RateLimiter.attempt()` enforces delays after failures
- `RateLimiter.getRemainingSeconds()` returns correct countdown
- `constantTimeCompare()` timing analysis shows no correlation
- `logger.debug()` silent when `VITE_DEBUG=false`
- `logger.sanitize()` removes sensitive fields
- `getInstructorPasswordHash()` throws when env var missing

**Dependencies:** Goal 1.1 complete
**Time:** 2 hours

---

### Goal 1.3: Encrypted Session Storage
**Description:** Implement AES-GCM encrypted sessionStorage wrapper.

**Location:** `src/services/storage/encrypted-session.ts`

**Tasks:**
- [ ] Implement `EncryptedSessionStorage` class
- [ ] `setSecure<T>()` method with AES-GCM encryption
- [ ] `getSecure<T>()` method with decryption
- [ ] Key derivation from session-specific entropy
- [ ] Write unit tests for encryption/decryption

**Acceptance Criteria:**
- ✅ Uses `crypto.subtle.encrypt()` with AES-GCM
- ✅ Random IV generated per encryption
- ✅ Data base64-encoded for sessionStorage
- ✅ Decryption returns original typed object
- ✅ Returns `null` for missing/corrupted data
- ✅ All tests pass

**Testing:**
```bash
npm run test:unit -- encrypted-session.test.ts
```

**Unit Tests Required:**
- Round-trip encryption/decryption preserves data
- Different IVs used for same data
- Corrupted data returns `null` without throwing
- Missing keys return `null`
- Type safety preserved through generics

**Dependencies:** Goal 1.1 complete
**Time:** 2 hours

---

### Goal 1.4: Shared Utilities
**Description:** Build DRY utilities to eliminate 400+ lines of duplication.

**Location:** `src/utils/debouncer.ts`, `src/utils/storage-helpers.ts`, `src/utils/dom-helpers.ts`, `src/utils/event-helpers.ts`

**Tasks:**
- [ ] Implement `Debouncer` class with `debounce()`, `cancel()`, `cancelAll()`
- [ ] Implement `getJSON<T>()`, `setJSON<T>()`, `removeItem()`, `clearQuizData()`
- [ ] Implement `getTableRows()`, `getRowCells()`, `getTextContent()`, `setTextContent()`, `createElement()`
- [ ] Implement `emitCustomEvent()`, `addEventListener()`, `removeEventListener()`
- [ ] Write unit tests for all utilities

**Acceptance Criteria:**
- ✅ Debouncer replaces WeakMap pattern (saves 22 lines)
- ✅ Storage helpers replace try-catch JSON.parse (saves 54 lines)
- ✅ DOM helpers eliminate repetitive queries (saves 80 lines)
- ✅ Event helpers provide type-safe custom events
- ✅ Zero `innerHTML` usage
- ✅ All tests pass

**Testing:**
```bash
npm run test:unit -- debouncer.test.ts
npm run test:unit -- storage-helpers.test.ts
npm run test:unit -- dom-helpers.test.ts
npm run test:unit -- event-helpers.test.ts
```

**Unit Tests Required:**
- Debouncer cancels previous timer on new call
- `getJSON()` returns `null` for invalid JSON
- `setJSON()` round-trips complex objects
- `clearQuizData()` only removes `qd/*` keys
- `createElement()` sets text and class correctly
- `emitCustomEvent()` dispatches with correct detail

**Dependencies:** Goal 1.1 complete
**Time:** 2 hours

---

### Goal 1.5: Comparison Table Builder
**Description:** Extract shared comparison table logic (200 lines saved).

**Location:** `src/utils/comparison-table-builder.ts`

**Tasks:**
- [ ] Define `ComparisonTableConfig` interface
- [ ] Implement `createComparisonTable()` function
- [ ] Use DOM helpers (no `innerHTML`)
- [ ] Write unit tests
- [ ] Create Storybook story

**Acceptance Criteria:**
- ✅ Accepts students array and cell data
- ✅ Builds table with header row
- ✅ Populates student rows with answers
- ✅ Uses `textContent` only (no XSS risk)
- ✅ Handles empty data gracefully
- ✅ All tests pass
- ✅ Storybook story renders correctly

**Testing:**
```bash
npm run test:unit -- comparison-table-builder.test.ts
npm run storybook  # Manual verification
```

**Unit Tests Required:**
- Creates table with correct structure
- Handles empty students array
- Handles missing answers
- Sets table class correctly
- All cells use `textContent`

**Storybook Story:** Visual verification of table rendering

**Dependencies:** Goal 1.4 complete
**Time:** 1.5 hours

---

### Goal 1.6: Storage Layer
**Description:** Port existing IndexedDB adapter with minimal changes.

**Location:** `src/services/storage/adapter.ts`, `src/services/storage/indexeddb.ts`

**Tasks:**
- [ ] Port `StorageAdapter` interface
- [ ] Port `IndexedDBAdapter` implementation
- [ ] Update composite key format: `qd/{release}/u{serviceId}`
- [ ] Verify atomic transactions
- [ ] Write unit tests

**Acceptance Criteria:**
- ✅ Interface matches existing contract
- ✅ IndexedDB database: `SonarQuizDB`
- ✅ Object stores: `students`, `backups`
- ✅ Composite keys working correctly
- ✅ All tests pass
- ✅ No regressions from original

**Testing:**
```bash
npm run test:unit -- indexeddb.test.ts
```

**Unit Tests Required:**
- `saveStudent()` creates/updates record
- `getStudent()` retrieves by composite key
- `getAllStudents()` returns all for release
- `deleteStudent()` removes record
- Transaction rollback on error

**Dependencies:** Goal 1.1 complete
**Time:** 1 hour

---

### Goal 1.7: Core Services
**Description:** Port quiz parser, validation, state calculator with type fixes.

**Location:** `src/services/quiz-parser.ts`, `src/services/analysis-parser.ts`, `src/services/validation.ts`, `src/services/state-calculator.ts`

**Tasks:**
- [ ] Port `parseQuizTable()` with corrected return types
- [ ] Port `parseAnalysisTable()` with stable cell key generation
- [ ] Port `validateAnswer()` for MCQ and numeric
- [ ] Port `calculateState()` for completion status
- [ ] Add JSDoc to all public functions
- [ ] Write unit tests

**Acceptance Criteria:**
- ✅ Zero `any` types or `eslint-disable` comments
- ✅ All functions have JSDoc
- ✅ MCQ validation: single letter a-z
- ✅ Numeric validation: tolerance from third column
- ✅ State calculation: unstarted/incomplete/complete logic correct
- ✅ All edge cases handled (sparse arrays, null values)
- ✅ All tests pass

**Testing:**
```bash
npm run test:unit -- quiz-parser.test.ts
npm run test:unit -- analysis-parser.test.ts
npm run test:unit -- validation.test.ts
npm run test:unit -- state-calculator.test.ts
```

**Unit Tests Required:**
- Parse valid quiz table with MCQ questions
- Parse valid quiz table with numeric questions
- Detect invalid table structure (wrong columns)
- Validate MCQ answer within options
- Validate numeric answer within tolerance
- Calculate state: unstarted, incomplete, complete
- Handle sparse answer arrays
- Handle null values in data

**Dependencies:** Goal 1.1, 1.4 complete
**Time:** 2 hours

---

### Goal 1.8: Session Service
**Description:** Implement session management with auto-expiry and activity tracking.

**Location:** `src/services/session.ts`

**Tasks:**
- [ ] Implement `SessionService` class
- [ ] `createSession()` with 30-minute expiry
- [ ] `updateActivity()` refreshes expiry
- [ ] `scheduleExpiry()` sets timeout
- [ ] `clearSession()` clears all `qd/*` keys
- [ ] `setupBeforeUnload()` auto-clear on tab close
- [ ] Emit `qd:session-expired` event
- [ ] Write unit tests

**Acceptance Criteria:**
- ✅ Session expires after 30 minutes inactivity
- ✅ Activity updates extend expiry
- ✅ Auto-clear on tab close
- ✅ Emits custom events: `qd:logout`, `qd:session-expired`
- ✅ Uses encrypted session storage
- ✅ All tests pass

**Testing:**
```bash
npm run test:unit -- session.test.ts
```

**Unit Tests Required:**
- `createSession()` sets correct expiry time
- `updateActivity()` extends expiry by 30 minutes
- `scheduleExpiry()` calls `clearSession()` after delay
- `clearSession()` removes all `qd/*` keys
- Event emitted on expiry

**Dependencies:** Goal 1.1, 1.3, 1.4 complete
**Time:** 1.5 hours

---

### Day 1 Checkpoint: Foundation Complete

**Verification Commands:**
```bash
npm run build          # TypeScript compilation
npm run lint           # Zero errors required
npm run test:unit      # All unit tests passing
npm run format:check   # Code formatting
```

**Success Criteria:**
- ✅ All Goal 1.1-1.8 complete
- ✅ Zero `any` types in codebase
- ✅ Zero `eslint-disable` for type issues
- ✅ All utilities tested and working
- ✅ Security primitives implemented
- ✅ Type contracts correct (PageCache with `answers`)
- ✅ ~400 lines of duplication eliminated

**Deliverables:**
- `src/types/` - Complete type definitions
- `src/utils/` - All shared utilities
- `src/config/` - Environment configuration
- `src/services/storage/` - Storage layer
- `src/services/` - Core business logic
- `tests/unit/` - Comprehensive unit tests

**Estimated Time:** 8-10 hours

---

## Phase 2: Components & Enhancement - Day 2 (8-10 hours)

### Goal 2.1: Quiz Table Enhancement (Single-Phase)
**Description:** Replace two-phase enhancement with single-phase conditional logic.

**Location:** `src/enhancers/quiz-table.ts`

**Tasks:**
- [ ] Implement `enhanceQuizTable(table, { interactive })` function
- [ ] Parse table using `parseQuizTable()`
- [ ] Store metadata in WeakMap (not DOM attributes)
- [ ] If `interactive: false` → hide answer column only
- [ ] If `interactive: true` → inject interactive controls
- [ ] Use Debouncer for auto-save
- [ ] Use DOM helpers (no `innerHTML`)
- [ ] Use comparison-table-builder for answer reveal
- [ ] Write integration tests

**Acceptance Criteria:**
- ✅ Single function replaces prepare + activate pattern
- ✅ WeakMap used for metadata storage
- ✅ Answer column hidden pre-login (security)
- ✅ Interactive controls injected post-login
- ✅ No `innerHTML` usage (XSS-safe)
- ✅ Debouncer prevents excessive saves
- ✅ All tests pass

**Testing:**
```bash
npm run test:integration -- quiz-table.test.ts
```

**Integration Tests Required:**
- Enhance table in non-interactive mode (answer column hidden)
- Enhance table in interactive mode (controls injected)
- User answer triggers save after debounce
- Answer validation works for MCQ
- Answer validation works for numeric
- State updates to complete when all correct

**Dependencies:** Goal 1.4, 1.5, 1.7 complete
**Time:** 2.5 hours

---

### Goal 2.2: Analysis Table Enhancement (Single-Phase)
**Description:** Implement single-phase analysis table enhancement with stable cell keys.

**Location:** `src/enhancers/analysis-table.ts`

**Tasks:**
- [ ] Implement `enhanceAnalysisTable(table, { interactive })` function
- [ ] Parse table using `parseAnalysisTable()`
- [ ] Generate stable cell keys: `R{row}C{col}#f:{hash}`
- [ ] Store metadata in WeakMap
- [ ] If `interactive: false` → read-only display
- [ ] If `interactive: true` → enable editing (cells without background-color)
- [ ] Use Debouncer for auto-save
- [ ] Use comparison-table-builder for instructor view
- [ ] Write integration tests

**Acceptance Criteria:**
- ✅ Single function replaces two-phase pattern
- ✅ Cell keys stable across page reloads
- ✅ Cells with `background-color` always read-only
- ✅ Editable cells save to IndexedDB
- ✅ Debouncer prevents excessive saves
- ✅ All tests pass

**Testing:**
```bash
npm run test:integration -- analysis-table.test.ts
```

**Integration Tests Required:**
- Enhance table in non-interactive mode
- Enhance table in interactive mode (editing enabled)
- Cell keys consistent across enhancement
- Read-only cells not editable
- User edits trigger save after debounce
- Data persists across page reload

**Dependencies:** Goal 1.4, 1.5, 1.7 complete
**Time:** 2.5 hours

---

### Goal 2.3: Home Page Badges
**Description:** Port R/A/G badge enhancement with real-time updates.

**Location:** `src/enhancers/home-badges.ts`

**Tasks:**
- [ ] Implement `enhanceHomeBadges()` function
- [ ] Query `.quizPageBtn` links
- [ ] Calculate state from SessionCache
- [ ] Apply badge CSS classes: `qd-badge-red`, `qd-badge-amber`, `qd-badge-green`
- [ ] Listen for `qd:state-changed` events
- [ ] Update badges in real-time
- [ ] Write integration tests

**Acceptance Criteria:**
- ✅ Badges applied to all `.quizPageBtn` links
- ✅ Red: unstarted, Amber: incomplete, Green: complete
- ✅ Real-time updates on state changes
- ✅ Uses storage-helpers for cache access
- ✅ All tests pass

**Testing:**
```bash
npm run test:integration -- home-badges.test.ts
```

**Integration Tests Required:**
- Badges applied on initial load
- Badge updates when state changes
- Handles missing pageId gracefully
- Handles empty cache

**Dependencies:** Goal 1.4, 1.7 complete
**Time:** 1 hour

---

### Goal 2.4: Login Component
**Description:** Port `<qd-login>` component with minimal changes.

**Location:** `src/components/qd-login.ts`

**Tasks:**
- [ ] Port existing Lit component
- [ ] Fix reactive properties (`@state()` decorators)
- [ ] Use event-helpers for custom events
- [ ] Emit `qd:login` event on submit
- [ ] Write unit tests
- [ ] Create Storybook story

**Acceptance Criteria:**
- ✅ Component renders form correctly
- ✅ Validates serviceId format
- ✅ Validates release format (MM-YYYY)
- ✅ Emits `qd:login` with correct detail
- ✅ All tests pass
- ✅ Storybook story works

**Testing:**
```bash
npm run test:unit -- qd-login.test.ts
npm run storybook
```

**Unit Tests Required:**
- Renders login form
- Validates invalid serviceId
- Validates invalid release format
- Emits event on valid submit

**Dependencies:** Goal 1.1, 1.4 complete
**Time:** 1 hour

---

### Goal 2.5: Status Component
**Description:** Port `<qd-status>` with fixed reactive properties.

**Location:** `src/components/qd-status.ts`

**Tasks:**
- [ ] Port existing Lit component
- [ ] Fix reactive properties causing re-render issues
- [ ] Display session info (serviceId, name, release)
- [ ] Display progress (R/A/G counts, percentage)
- [ ] Logout button emits `qd:logout`
- [ ] Write unit tests
- [ ] Create Storybook story

**Acceptance Criteria:**
- ✅ Reactive updates on session changes
- ✅ Progress updates on state changes
- ✅ Logout button clears session
- ✅ All tests pass
- ✅ Storybook story works

**Testing:**
```bash
npm run test:unit -- qd-status.test.ts
npm run storybook
```

**Unit Tests Required:**
- Renders session info correctly
- Updates progress on state changes
- Logout button emits event

**Dependencies:** Goal 1.1, 1.4 complete
**Time:** 1 hour

---

### Goal 2.6: Instructor Component (Decomposed)
**Description:** Decompose 1,228-line component into 5 sub-components.

**Location:** `src/components/qd-instructor/`

**Tasks:**
- [ ] `qd-instructor.ts` - Orchestrator (100-150 lines)
- [ ] `qd-instructor-unlock.ts` - Password UI with RateLimiter (150-200 lines)
- [ ] `qd-instructor-scores.ts` - Scores table view (200-250 lines)
- [ ] `qd-instructor-export.ts` - CSV export controls (150-200 lines)
- [ ] `qd-instructor-manage.ts` - Data management (200-250 lines)
- [ ] `shared-styles.ts` - CSS-in-JS shared across sub-components
- [ ] Write unit tests for each sub-component
- [ ] Create Storybook stories for each

**Acceptance Criteria:**
- ✅ Each sub-component <250 lines
- ✅ Orchestrator delegates to sub-components
- ✅ Unlock component uses RateLimiter
- ✅ Scores component uses comparison-table-builder
- ✅ Export component generates CSV
- ✅ Manage component clears/backs up data
- ✅ All tests pass
- ✅ All Storybook stories work

**Testing:**
```bash
npm run test:unit -- qd-instructor*.test.ts
npm run storybook
```

**Unit Tests Required:**
- Orchestrator renders unlock when locked
- Orchestrator renders sub-components when unlocked
- Unlock enforces rate limiting on failures
- Scores table displays all students
- Export generates valid CSV
- Manage clears all data on confirmation

**Dependencies:** Goal 1.2, 1.5, 1.6 complete
**Time:** 4 hours

---

### Goal 2.7: Supporting Components
**Description:** Port error banner and storage monitor components.

**Location:** `src/components/qd-error-banner.ts`, `src/components/qd-storage-monitor.ts`

**Tasks:**
- [ ] Port `<qd-error-banner>` component
- [ ] Port `<qd-storage-monitor>` component
- [ ] Write unit tests
- [ ] Create Storybook stories

**Acceptance Criteria:**
- ✅ Error banner displays validation errors
- ✅ Storage monitor shows IndexedDB/sessionStorage contents
- ✅ Storage monitor respects `data-debug` flag
- ✅ All tests pass
- ✅ Storybook stories work

**Testing:**
```bash
npm run test:unit -- qd-error-banner.test.ts
npm run test:unit -- qd-storage-monitor.test.ts
npm run storybook
```

**Dependencies:** Goal 1.1, 1.4 complete
**Time:** 1.5 hours

---

### Goal 2.8: Scores & CSV Services
**Description:** Port scores aggregation and CSV export services.

**Location:** `src/services/scores.ts`, `src/services/csv-export.ts`

**Tasks:**
- [ ] Port `ScoresService` class
- [ ] Port `generateCSV()` function
- [ ] Write unit tests

**Acceptance Criteria:**
- ✅ Scores service aggregates student data
- ✅ CSV export generates valid RFC 4180 format
- ✅ All tests pass

**Testing:**
```bash
npm run test:unit -- scores.test.ts
npm run test:unit -- csv-export.test.ts
```

**Unit Tests Required:**
- Scores aggregates data correctly
- CSV escapes special characters
- CSV handles empty data

**Dependencies:** Goal 1.1 complete
**Time:** 1 hour

---

### Day 2 Checkpoint: Components Complete

**Verification Commands:**
```bash
npm run build
npm run lint
npm run test:unit
npm run test:integration
npm run storybook  # Manual verification
npm run chromatic  # Visual regression
```

**Success Criteria:**
- ✅ All Goal 2.1-2.8 complete
- ✅ Single-phase enhancement working
- ✅ All components decomposed and functional
- ✅ No `innerHTML` usage (XSS-safe)
- ✅ Storybook stories rendering correctly
- ✅ Visual regression baselines established
- ✅ All tests passing

**Deliverables:**
- `src/enhancers/` - Single-phase table enhancement
- `src/components/` - All Lit components
- `tests/integration/` - DOM upgrade tests
- `stories/` - Storybook stories

**Estimated Time:** 8-10 hours

---

## Phase 3: Integration & Validation - Day 3 (6-8 hours)

### Goal 3.1: Bootstrap & Initialization
**Description:** Create initialization layer with event coordination.

**Location:** `src/init/bootstrap.ts`, `src/init/event-coordinator.ts`, `src/init/session-coordinator.ts`, `src/init/component-injector.ts`

**Tasks:**
- [ ] `bootstrap.ts` - Main initialization logic
- [ ] `event-coordinator.ts` - Register all event listeners
- [ ] `session-coordinator.ts` - Session lifecycle management
- [ ] `component-injector.ts` - Inject login/status/instructor components
- [ ] Write integration tests

**Acceptance Criteria:**
- ✅ Auto-init on DOMContentLoaded
- ✅ Components injected into DOM
- ✅ Event listeners registered
- ✅ Session loaded from storage on init
- ✅ All tests pass

**Testing:**
```bash
npm run test:integration -- bootstrap.test.ts
```

**Integration Tests Required:**
- Init detects quiz tables and enhances them
- Init injects login component when not logged in
- Init injects status component when logged in
- Event coordination works across components

**Dependencies:** All Phase 2 goals complete
**Time:** 2 hours

---

### Goal 3.2: Entry Point
**Description:** Minimal `index.ts` entry point (<100 lines).

**Location:** `src/index.ts`

**Tasks:**
- [ ] Import bootstrap logic
- [ ] Export init function
- [ ] Auto-init on DOMContentLoaded
- [ ] Export version info
- [ ] Verify bundle size

**Acceptance Criteria:**
- ✅ File <100 lines
- ✅ Auto-init works from `<script>` tag
- ✅ ESM export available for integrators
- ✅ IIFE bundle auto-runs

**Testing:**
```bash
npm run build
npm run size-check
```

**Dependencies:** Goal 3.1 complete
**Time:** 30 minutes

---

### Goal 3.3: Demo Fixtures
**Description:** Create proper demo HTML files for E2E testing.

**Location:** `demo/quiz-index.html`, `demo/quiz-examples.html`, `demo/analysis-examples.html`

**Tasks:**
- [ ] Create `quiz-index.html` with login, status, navigation
- [ ] Create `quiz-examples.html` with MCQ and numeric questions
- [ ] Create `analysis-examples.html` with editable analysis tables
- [ ] Add realistic DITA-like structure
- [ ] Load built bundle from `dist/sonar-quiz.iife.js`
- [ ] Enable debug mode: `data-debug="true"`
- [ ] Update `demo/README.md` with test scenarios

**Acceptance Criteria:**
- ✅ All demo files load bundle correctly
- ✅ Index page has login and status panel
- ✅ Quiz page has MCQ and numeric questions (3-column tables)
- ✅ Analysis page has editable cells
- ✅ All tables have correct classes
- ✅ README documents test workflows

**Testing:** Manual testing via `file://` protocol

**Dependencies:** Goal 3.2 complete
**Time:** 1.5 hours

---

### Goal 3.4: E2E Test Suite (Real Bundle)
**Description:** Rewrite all E2E tests to use real bundle and proper fixtures.

**Location:** `tests/e2e/workflows/`

**Tasks:**
- [ ] `progress-tracking.spec.ts` - REAL bundle, no skipped tests
- [ ] `instructor-review.spec.ts` - REAL bundle, all 5 suites enabled
- [ ] `cohort-management.spec.ts` - Complete TODOs, no skipped tests
- [ ] `analysis-capture.spec.ts` - REAL bundle (remove inline mock)
- [ ] All tests use `file://` protocol
- [ ] Verify zero skipped tests

**Acceptance Criteria:**
- ✅ All tests use `demo/*.html` fixtures
- ✅ All tests load `dist/sonar-quiz.iife.js`
- ✅ Zero skipped tests
- ✅ Zero inline JavaScript mocks
- ✅ All tests pass with `file://` URLs
- ✅ Tests cover login, quiz, analysis, instructor, logout

**Testing:**
```bash
npm run test:e2e
# All tests must pass, zero skipped
```

**E2E Tests Required:**
- Login flow with valid credentials
- Quiz answering (MCQ and numeric)
- Answer persistence across page reload
- R/A/G badge updates
- Session timeout (30 min)
- Instructor unlock with rate limiting
- CSV export
- Data erasure

**Dependencies:** Goal 3.3 complete
**Time:** 3 hours

---

### Goal 3.5: Security Validation
**Description:** Verify all 7 security issues resolved.

**Tasks:**
- [ ] Verify no hardcoded passwords in bundle: `grep -r "instructor" dist/`
- [ ] Verify no `innerHTML` in bundle: `grep -r "innerHTML" dist/`
- [ ] Verify sessionStorage encrypted (manual DevTools inspection)
- [ ] Test rate limiting (manual: 5 failed attempts → 30s lockout)
- [ ] Verify constant-time comparison (timing analysis)
- [ ] Verify no sensitive data in production logs (build with `VITE_DEBUG=false`)
- [ ] Test BroadcastChannel message validation

**Acceptance Criteria:**
- ✅ No hardcoded passwords in bundle
- ✅ No `innerHTML` in bundle
- ✅ SessionStorage contains encrypted data only
- ✅ Rate limiting enforces exponential backoff
- ✅ Constant-time comparison timing consistent
- ✅ Production logs contain no serviceId/name
- ✅ BroadcastChannel rejects invalid messages

**Testing:** Manual security testing + automated checks

**Dependencies:** Goal 3.2 complete
**Time:** 1.5 hours

---

### Goal 3.6: Bundle Validation
**Description:** Verify bundle meets all performance constraints.

**Tasks:**
- [ ] Build production bundle: `npm run build`
- [ ] Check bundle size: `npm run size-check`
- [ ] Verify <25KB min+gzip for IIFE
- [ ] Verify source maps generated
- [ ] Verify TypeScript definitions generated
- [ ] Verify no `console.log` in production bundle

**Acceptance Criteria:**
- ✅ IIFE bundle <25KB min+gzip
- ✅ Source maps present: `dist/*.map`
- ✅ TypeScript definitions present: `dist/*.d.ts`
- ✅ Tree-shaking effective
- ✅ No debug logs in production build

**Testing:**
```bash
npm run build
npm run size-check
ls -lh dist/
zcat dist/sonar-quiz.iife.js.gz | wc -c  # Should be <25600 bytes
```

**Dependencies:** Goal 3.2 complete
**Time:** 30 minutes

---

### Goal 3.7: Code Quality Final Check
**Description:** Verify all code quality metrics met.

**Tasks:**
- [ ] Run `npm run lint` → Zero errors
- [ ] Run `npm run format:check` → All formatted
- [ ] Count `eslint-disable` comments → <50 (down from 78)
- [ ] Verify zero `any` types → `grep -r ": any" src/`
- [ ] Verify all public APIs have JSDoc
- [ ] Run all tests: unit, integration, E2E

**Acceptance Criteria:**
- ✅ Linter passes with zero errors
- ✅ Code properly formatted
- ✅ <50 eslint-disable comments (ideally <10)
- ✅ Zero `any` types in source code
- ✅ All public functions/classes have JSDoc
- ✅ All tests passing (unit + integration + E2E)

**Testing:**
```bash
npm run lint
npm run format:check
npm test
grep -c "eslint-disable" src/**/*.ts  # Should be <50
grep -c ": any" src/**/*.ts  # Should be 0
```

**Dependencies:** All previous goals complete
**Time:** 1 hour

---

### Goal 3.8: Manual Testing
**Description:** Comprehensive manual testing of all workflows.

**Tasks:**
- [ ] Login flow (valid and invalid credentials)
- [ ] Quiz answering (MCQ: select option, numeric: enter value)
- [ ] Answer persistence (answer question, reload page, verify data)
- [ ] R/A/G badge updates (complete page, verify badge turns green)
- [ ] Session timeout (wait 30 minutes, verify auto-logout)
- [ ] Instructor unlock (test rate limiting, 5 failed attempts)
- [ ] CSV export (download, verify format)
- [ ] Data erasure (clear all data, verify IndexedDB empty)

**Acceptance Criteria:**
- ✅ All workflows complete successfully
- ✅ No console errors in browser DevTools
- ✅ Data persists correctly
- ✅ Security features work (rate limiting, encryption, timeout)
- ✅ UI responsive and accessible

**Testing:** Manual testing via `file:///path/to/demo/quiz-index.html`

**Dependencies:** Goal 3.3, 3.6 complete
**Time:** 1.5 hours

---

### Day 3 Checkpoint: Integration Complete

**Verification Commands:**
```bash
npm run build
npm run lint
npm run format:check
npm test
npm run size-check
```

**Success Criteria:**
- ✅ All Goal 3.1-3.8 complete
- ✅ All tests passing (zero skipped)
- ✅ E2E tests use real bundle
- ✅ Bundle <25KB gzipped
- ✅ Security checklist complete
- ✅ Manual testing complete
- ✅ Ready for deployment

**Deliverables:**
- `src/init/` - Bootstrap logic
- `src/index.ts` - Entry point
- `demo/` - E2E test fixtures
- `tests/e2e/` - Complete E2E suite
- `dist/` - Production bundle

**Estimated Time:** 6-8 hours

---

## Phase 4: Documentation & Deployment (2 hours)

### Goal 4.1: Documentation Updates
**Description:** Update all documentation to reflect new architecture.

**Tasks:**
- [ ] Update `CLAUDE.md` with new patterns (single-phase, security utilities)
- [ ] Create `LESSONS_LEARNED.md` in `.rewrite-reference/`
- [ ] Update `demo/README.md` with test scenarios
- [ ] Verify all JSDoc comments complete
- [ ] Update `ARCHITECTURE_FLOWS.md` if needed

**Acceptance Criteria:**
- ✅ CLAUDE.md documents new patterns
- ✅ LESSONS_LEARNED.md explains what went wrong
- ✅ demo/README.md has comprehensive test guide
- ✅ All public APIs documented

**Dependencies:** All Phase 3 goals complete
**Time:** 1 hour

---

### Goal 4.2: Commit & Push
**Description:** Commit all changes and push to branch.

**Tasks:**
- [ ] Commit with descriptive message
- [ ] List all security fixes in commit body
- [ ] List all code quality improvements
- [ ] List breaking changes
- [ ] Push to branch with retry logic

**Acceptance Criteria:**
- ✅ Commit message follows conventional commits format
- ✅ All changes committed
- ✅ Pushed to `claude/translate-rewrite-strategy-01FoiPtu7XWFPRkSRiTZaDuu`

**Commit Message Template:**
```
feat: complete clean rewrite with security hardening

- Fix all 7 security issues from POST_PHASE_7_REVIEW.md
- Eliminate ~400 lines of duplicated code
- Fix type system (PageCache with answers field)
- Simplify to single-phase enhancement
- Decompose qd-instructor into 5 sub-components
- Implement encrypted sessionStorage (AES-GCM)
- Add rate limiting with exponential backoff
- Use constant-time password comparison
- Zero innerHTML usage (XSS prevention)
- All tests passing (no skipped tests)
- Bundle: <25KB gzipped

Breaking changes:
- Instructor password now configured via VITE_INSTRUCTOR_PASSWORD_HASH
- Session data now encrypted (incompatible with old sessions)
```

**Dependencies:** Goal 4.1 complete
**Time:** 30 minutes

---

### Goal 4.3: Create Pull Request
**Description:** Create PR with comprehensive summary.

**Tasks:**
- [ ] Create PR using template from REWRITE_STRATEGY.md
- [ ] Document all security fixes
- [ ] Document all code quality improvements
- [ ] Document breaking changes
- [ ] Link to POST_PHASE_7_REVIEW.md

**Acceptance Criteria:**
- ✅ PR created with detailed description
- ✅ All checkboxes in PR template completed
- ✅ Bundle size documented
- ✅ Breaking changes highlighted

**Dependencies:** Goal 4.2 complete
**Time:** 30 minutes

---

## Success Criteria (Zero Tolerance)

### 🚨 Security Checklist
- [ ] ✅ No hardcoded passwords in bundle
- [ ] ✅ No `innerHTML` usage anywhere
- [ ] ✅ All sensitive data encrypted in sessionStorage
- [ ] ✅ Rate limiting with exponential backoff implemented
- [ ] ✅ Constant-time password comparison
- [ ] ✅ BroadcastChannel messages validated
- [ ] ✅ No sensitive data in production logs
- [ ] ✅ CSP headers configured in demo HTML

### ✅ Code Quality Checklist
- [ ] ✅ Zero `any` types in codebase
- [ ] ✅ Zero `eslint-disable` for type issues
- [ ] ✅ PageCache includes `answers` field
- [ ] ✅ <50 total eslint-disable comments (down from 78)
- [ ] ✅ <200 lines of duplicated code (down from ~400)
- [ ] ✅ All public APIs have JSDoc comments
- [ ] ✅ TypeScript strict mode enabled
- [ ] ✅ All tests passing (unit, integration, E2E)

### 📦 Bundle Checklist
- [ ] ✅ Production bundle <25KB min+gzip
- [ ] ✅ Source maps generated
- [ ] ✅ TypeScript definitions generated
- [ ] ✅ Tree-shaking effective
- [ ] ✅ No console.log in production bundle

### 🧪 Testing Checklist
- [ ] ✅ Zero skipped tests
- [ ] ✅ E2E tests use real bundle (not inline mocks)
- [ ] ✅ E2E tests work with `file://` protocol
- [ ] ✅ Unit test coverage >80%
- [ ] ✅ Integration tests for DOM upgrades
- [ ] ✅ Storybook stories for all components
- [ ] ✅ Visual regression baselines

### 📚 Documentation Checklist
- [ ] ✅ All public APIs have JSDoc
- [ ] ✅ `.env.example` created with all config options
- [ ] ✅ `LESSONS_LEARNED.md` documents what went wrong
- [ ] ✅ `demo/README.md` updated
- [ ] ✅ `CLAUDE.md` updated with new patterns

---

## Rollback Plan

**Checkpoint 1 (End of Day 1):**
- **Trigger:** >4 hours to fix critical issues in utilities/security
- **Action:** Revise architecture, extend Day 1 timeline

**Checkpoint 2 (End of Day 2):**
- **Trigger:** >6 hours to fix component integration issues
- **Action:** Revise component structure, extend Day 2 timeline

**Checkpoint 3 (End of Day 3):**
- **Trigger:** >50% E2E tests failing
- **Action:** Fix tests, extend validation phase

**Nuclear Rollback:**
- **Trigger:**
  - More than 2 critical security issues unresolved
  - More than 30% tests failing at end of Day 3
  - Bundle size >30KB with no clear path to <25KB
- **Action:**
  1. Restore from `.rewrite-reference/`
  2. Apply targeted refactoring instead
  3. Document lessons learned in post-mortem

---

## Appendix: Quick Reference

### Development Commands
```bash
npm run dev              # Start dev server
npm run storybook        # Component development
npm test                 # All tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests
npm run build            # Production build
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix issues
npm run format:check     # Prettier check
npm run format           # Auto-format
npm run size-check       # Bundle size verification
```

### Environment Setup
```bash
# Generate instructor password hash
echo -n "your-password" | openssl dgst -sha256

# Add to .env (not committed)
echo "VITE_INSTRUCTOR_PASSWORD_HASH=abc123..." > .env
echo "VITE_DEBUG=true" >> .env
```

### Security Testing
```bash
# Verify no hardcoded passwords
grep -r "instructor" dist/

# Verify no innerHTML
grep -r "innerHTML" dist/

# Check bundle size
zcat dist/sonar-quiz.iife.js.gz | wc -c

# Count eslint-disable comments
grep -rc "eslint-disable" src/

# Verify no any types
grep -r ": any" src/
```

---

## Summary

**Total Estimated Time:** 24 hours (3 days)

**Phase Breakdown:**
- Phase 0: Preparation - 2 hours
- Phase 1: Foundation (Day 1) - 8-10 hours
- Phase 2: Components (Day 2) - 8-10 hours
- Phase 3: Integration (Day 3) - 6-8 hours
- Phase 4: Documentation - 2 hours

**Key Deliverables:**
- ✅ Security vulnerabilities eliminated (7 issues fixed)
- ✅ Code duplication reduced from ~400 to <50 lines
- ✅ Type system corrected (PageCache with `answers`)
- ✅ Single-phase enhancement (architectural simplification)
- ✅ Component decomposition (qd-instructor: 1,228 → 5 sub-components)
- ✅ All tests passing (zero skipped)
- ✅ Bundle <25KB gzipped
- ✅ Production-ready with comprehensive documentation

---

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Status:** Ready for implementation
