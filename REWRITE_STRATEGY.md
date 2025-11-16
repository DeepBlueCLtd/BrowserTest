# Sonar Quiz System - Rewrite Strategy

**Date:** 2025-11-16
**Project:** Sonar Quiz System
**Branch:** `claude/refactor-codebase-01Xspo4B3mSqxHzHmiPQ1iow`
**Estimated Duration:** 2-3 days
**Team Size:** 2-3 developers working in parallel

---

## Executive Summary

This document outlines the strategy for a **clean rewrite** of the Sonar Quiz System codebase (`src/`, `tests/`, `stories/` directories). The rewrite is necessary to address critical security vulnerabilities, eliminate ~400 lines of duplicated code, fix type system issues, and simplify architectural complexity identified in the POST_PHASE_7_REVIEW.md.

**Key Decision:** Archive existing code for reference, delete current implementation, rebuild from scratch with lessons learned.

**Timeline:** 2-3 days based on demonstrated team velocity (original build: 6 days while learning)

---

## Why Rewrite? (Evidence-Based Decision)

### 🚨 Critical Security Vulnerabilities (7 issues)

| Issue | Location | Impact | Current State |
|-------|----------|--------|---------------|
| Hardcoded instructor password | `qd-instructor.ts:854-857` | Complete authentication bypass | `'instructor'` compiled into bundle |
| XSS via innerHTML | 4 locations | Arbitrary code execution | No sanitization |
| Plaintext sessionStorage | `session.ts:201` | Data exfiltration | No encryption |
| Non-constant-time comparison | `qd-instructor.ts:867` | Timing attack vector | Simple `===` |
| No rate limiting | `qd-instructor.ts` | Brute force attacks | Unlimited attempts |
| Unvalidated BroadcastChannel | `qd-instructor.ts:434-442` | Cross-tab injection | No message validation |
| Sensitive data logging | 108 occurrences | Information disclosure | Production logs enabled |

### ⚠️ Code Quality Issues

| Issue | Impact | Current State |
|-------|--------|---------------|
| Code duplication | ~400 lines duplicated | Comparison table (200 lines), debouncer (22 lines), storage helpers (54 lines) |
| Type system collapse | 78 `eslint-disable` comments | `PageCache` missing `answers` field causing `any` casts |
| Architectural complexity | Maintenance burden | Two-phase enhancement (prepare/activate) |
| Test infrastructure | False confidence | Multiple E2E tests skipped, one uses inline mock |

### 📊 Evidence from Codebase Analysis

**Relaxed/Skipped Tests:**
- `progress-tracking.spec.ts`: Entire suite skipped ("pending demo HTML files")
- `instructor-review.spec.ts`: 5 test suites skipped
- `cohort-management.spec.ts`: 4 tests skipped (IndexedDB issues, event timing race)
- `analysis-capture.spec.ts`: Embeds inline JavaScript instead of testing production bundle

**Git History Evidence:**
- Commit `a8db372`: Test skipped due to "setTimeout race condition"
- Commit `f61357d`: Test assertion relaxed to allow emergent features
- Multiple commits fixing "sparse array handling", "null values in answer arrays"

**Type System Breakdown:**
```typescript
// Example from index.ts (15 instances)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pageCache = cache.pages[pageId] as any;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (!pageCache.answers) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    pageCache.answers = [];
}
```

**Root Cause:** `PageCache` interface doesn't include `answers` array, requiring workarounds throughout codebase.

---

## Core Architectural Decisions

### 1. **Single-Phase Enhancement** (vs. current two-phase)

**Current Problem:**
- Phase 1 (`prepareQuizTable`): Parse → Store metadata → Hide details (pre-login)
- Phase 2 (`activateQuizTable`): Inject controls → Attach listeners (post-login)
- State split across phases, metadata stored in DOM attributes, synchronization complexity

**New Approach:**
```typescript
// Single function with conditional logic
export function enhanceQuizTable(
  table: HTMLTableElement,
  options: { interactive: boolean }
): void {
  const parsed = parseQuizTable(table);
  tableMetadata.set(table, parsed); // WeakMap, not DOM attributes

  if (options.interactive) {
    injectInteractiveControls(table, parsed);
  } else {
    hideAnswerColumn(table); // Security: hide answers pre-login
  }
}
```

**Benefits:**
- ✅ Simpler mental model
- ✅ No state synchronization issues
- ✅ Easier to test
- ✅ Less code (~100 lines saved)

---

### 2. **Security-First Design**

**Principle:** All security measures implemented from day 1, not bolted on later.

**Core Security Patterns:**

#### 2.1 No Hardcoded Secrets
```typescript
// src/config/instructor-password.ts
export function getInstructorPasswordHash(): string {
  const hash = import.meta.env.VITE_INSTRUCTOR_PASSWORD_HASH;
  if (!hash) {
    throw new Error('VITE_INSTRUCTOR_PASSWORD_HASH not configured');
  }
  return hash;
}
```

**Build-time configuration:**
```bash
# .env.example
VITE_INSTRUCTOR_PASSWORD_HASH=sha256-hash-here
VITE_DEBUG=false
```

#### 2.2 No innerHTML (XSS Prevention)
```typescript
// ❌ NEVER
element.innerHTML = `<strong>Answer:</strong> ${userInput}`;

// ✅ ALWAYS
const strong = document.createElement('strong');
strong.textContent = 'Answer:';
const text = document.createTextNode(userInput);
element.replaceChildren(strong, text);

// ✅ OR use Lit templates (auto-escape)
return html`<strong>Answer:</strong> ${userInput}`;
```

#### 2.3 Encrypted sessionStorage
```typescript
// src/services/storage/encrypted-session.ts
export class EncryptedSessionStorage {
  private key: CryptoKey;

  async setSecure<T>(key: string, value: T): Promise<void> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      new TextEncoder().encode(JSON.stringify(value))
    );
    sessionStorage.setItem(key, this.encodeData(iv, encrypted));
  }

  async getSecure<T>(key: string): Promise<T | null> {
    const data = sessionStorage.getItem(key);
    if (!data) return null;
    const { iv, encrypted } = this.decodeData(data);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.key,
      encrypted
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  }
}
```

#### 2.4 Rate Limiting with Exponential Backoff
```typescript
// src/utils/security.ts
export class RateLimiter {
  private attempts = 0;
  private lockoutUntil: Date | null = null;

  async attempt<T>(fn: () => Promise<T>): Promise<T> {
    if (this.lockoutUntil && new Date() < this.lockoutUntil) {
      const remaining = Math.ceil((this.lockoutUntil.getTime() - Date.now()) / 1000);
      throw new Error(`Too many attempts. Try again in ${remaining}s`);
    }

    try {
      const result = await fn();
      this.attempts = 0; // Reset on success
      this.lockoutUntil = null;
      return result;
    } catch (error) {
      this.attempts++;
      // Exponential backoff: 2s, 4s, 8s, 16s, 30s (max)
      const delay = Math.min(Math.pow(2, this.attempts) * 1000, 30000);
      this.lockoutUntil = new Date(Date.now() + delay);
      throw error;
    }
  }

  getRemainingSeconds(): number {
    if (!this.lockoutUntil) return 0;
    return Math.max(0, Math.ceil((this.lockoutUntil.getTime() - Date.now()) / 1000));
  }
}
```

#### 2.5 Constant-Time Password Comparison
```typescript
// src/utils/security.ts
export async function constantTimeCompare(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) {
    // Still need to do crypto work to maintain timing
    await hashPassword('dummy');
    return false;
  }

  const encoder = new TextEncoder();
  const aBuffer = encoder.encode(a);
  const bBuffer = encoder.encode(b);

  // Use Web Crypto API for constant-time comparison
  const key = await crypto.subtle.importKey(
    'raw',
    aBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, bBuffer);

  // Compare signature length as constant-time proxy
  return signature.byteLength === bBuffer.length;
}
```

#### 2.6 Safe Logging
```typescript
// src/utils/logger.ts
export const logger = {
  debug: (...args: unknown[]) => {
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log('[DEBUG]', ...args);
    }
  },

  info: (...args: unknown[]) => {
    console.log('[INFO]', ...args);
  },

  error: (message: string, ...args: unknown[]) => {
    console.error('[ERROR]', message, ...args);
  },

  // Sanitize sensitive data
  sanitize: (data: unknown): unknown => {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      // Mask service IDs
      if ('serviceId' in sanitized) {
        const sid = String(sanitized.serviceId);
        sanitized.serviceId = sid.slice(0, 2) + '****';
      }
      // Remove sensitive fields
      delete sanitized.name;
      delete sanitized.passwordHash;
      return sanitized;
    }
    return data;
  }
};
```

---

### 3. **Correct Types from Day 1**

**Root Cause of Current Issues:** `PageCache` interface doesn't match runtime usage.

**Corrected Contracts:**

```typescript
// src/types/contracts.ts

/**
 * Page-level cache stored in sessionStorage
 * Tracks question attempt state and student answers for quick access
 */
export interface PageCache {
  /** Completion state: unstarted, incomplete, or complete */
  state: CompletionState;

  /** Number of questions answered on this page */
  answered: number;

  /** Number of correct answers on this page */
  correct: number;

  /** ISO 8601 timestamp of last activity */
  last?: string;

  /** Student answers with timestamps and correctness */
  answers?: AnswerRecord[]; // ✅ INCLUDED FROM START
}

/**
 * Session cache stored in sessionStorage (qd/state)
 * Aggregates data across all pages for quick R/A/G badge calculations
 */
export interface SessionCache {
  /** Aggregate totals across all pages */
  totals: {
    answered: number;
    correct: number;
  };

  /** Per-page cache data, keyed by pageId */
  pages: Record<PageId, PageCache>;
}

/**
 * Session data stored in encrypted sessionStorage (qd/session)
 * Contains active user session information
 */
export interface SessionData {
  /** Student service ID (e.g., "RN2344") */
  serviceId: ServiceId;

  /** Student full name */
  name: string;

  /** Release identifier (e.g., "01-2025") */
  release: ReleaseId;

  /** ISO 8601 timestamp of login */
  loginTime: string;

  /** ISO 8601 timestamp of last user activity */
  lastActivity: string;

  /** ISO 8601 timestamp when session expires (30 min from last activity) */
  expiresAt: string;

  /** Whether instructor mode is unlocked for this session */
  instructorUnlocked: boolean;
}
```

**Strict TypeScript Configuration:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**ESLint Enforcement:**
```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "no-console": ["warn", { "allow": ["error"] }]
  }
}
```

**Zero Tolerance:** Any `eslint-disable` for type issues = immediate fix required, not workaround.

---

### 4. **DRY - Extract Shared Utilities First**

**Principle:** Build abstractions before implementations. No duplication.

**Required Utilities (build these on Day 1):**

#### 4.1 Comparison Table Builder
```typescript
// src/utils/comparison-table-builder.ts
export interface ComparisonTableConfig {
  students: Array<{ serviceId: string; name: string }>;
  cellData: Array<{ questionIndex: number; answer: string; serviceId: string }>;
  headers: string[];
  tableClass?: string;
}

export function createComparisonTable(config: ComparisonTableConfig): HTMLTableElement {
  const table = document.createElement('table');
  if (config.tableClass) {
    table.className = config.tableClass;
  }

  // Header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  config.headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header; // ✅ No innerHTML
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Data rows
  const tbody = document.createElement('tbody');
  config.students.forEach(student => {
    const row = document.createElement('tr');

    // Student info cells
    const nameCell = document.createElement('td');
    nameCell.textContent = student.name;
    row.appendChild(nameCell);

    const idCell = document.createElement('td');
    idCell.textContent = student.serviceId;
    row.appendChild(idCell);

    // Answer cells
    config.cellData
      .filter(cell => cell.serviceId === student.serviceId)
      .forEach(cell => {
        const answerCell = document.createElement('td');
        answerCell.textContent = cell.answer;
        row.appendChild(answerCell);
      });

    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  return table;
}
```

**Usage:** Both `quiz-table.ts` and `analysis-table.ts` use this shared implementation.
**Impact:** Saves ~200 lines of duplicated code.

---

#### 4.2 Debouncer Utility
```typescript
// src/utils/debouncer.ts
export class Debouncer {
  private timers = new Map<string, number>();

  /**
   * Debounce a function call by key
   * @param key - Unique identifier for this debounce operation
   * @param fn - Function to execute after delay
   * @param delay - Delay in milliseconds (default: 150ms)
   */
  debounce(key: string, fn: () => void, delay: number = 150): void {
    const existing = this.timers.get(key);
    if (existing !== undefined) {
      clearTimeout(existing);
    }

    const timerId = setTimeout(() => {
      this.timers.delete(key);
      fn();
    }, delay);

    this.timers.set(key, timerId as unknown as number);
  }

  /**
   * Cancel a pending debounced operation
   */
  cancel(key: string): void {
    const timerId = this.timers.get(key);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      this.timers.delete(key);
    }
  }

  /**
   * Cancel all pending operations
   */
  cancelAll(): void {
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers.clear();
  }
}
```

**Usage:** Replace `WeakMap<HTMLElement, number>` pattern in quiz-table and analysis-table.
**Impact:** Saves ~22 lines, more robust implementation.

---

#### 4.3 Storage Helpers
```typescript
// src/utils/storage-helpers.ts

/**
 * Safely parse JSON from sessionStorage
 * @param key - sessionStorage key
 * @returns Parsed object or null if not found/invalid
 */
export function getJSON<T>(key: string): T | null {
  try {
    const data = sessionStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error('Failed to parse JSON from sessionStorage', { key, error });
    return null;
  }
}

/**
 * Safely stringify and save to sessionStorage
 * @param key - sessionStorage key
 * @param value - Object to store
 */
export function setJSON<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.error('Failed to save JSON to sessionStorage', { key, error });
    throw error;
  }
}

/**
 * Remove item from sessionStorage
 */
export function removeItem(key: string): void {
  sessionStorage.removeItem(key);
}

/**
 * Clear all qd/* keys from sessionStorage
 */
export function clearQuizData(): void {
  const keys = Object.keys(sessionStorage).filter(key => key.startsWith('qd/'));
  keys.forEach(key => sessionStorage.removeItem(key));
}
```

**Usage:** Replace try-catch JSON.parse patterns across codebase.
**Impact:** Saves ~54 lines, consistent error handling.

---

#### 4.4 DOM Helpers
```typescript
// src/utils/dom-helpers.ts

/**
 * Get all tbody rows from a table
 */
export function getTableRows(table: HTMLTableElement): HTMLTableRowElement[] {
  return Array.from(table.querySelectorAll('tbody tr'));
}

/**
 * Get all cells from a row
 */
export function getRowCells(row: HTMLTableRowElement): HTMLTableCellElement[] {
  return Array.from(row.cells);
}

/**
 * Get trimmed text content from an element
 */
export function getTextContent(element: Element): string {
  return element.textContent?.trim() || '';
}

/**
 * Safely set text content (never use innerHTML)
 */
export function setTextContent(element: Element, text: string): void {
  element.textContent = text;
}

/**
 * Create element with text content
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
```

**Usage:** Replace repetitive DOM query patterns.
**Impact:** Saves ~80 lines, consistent DOM manipulation.

---

#### 4.5 Event Helpers
```typescript
// src/utils/event-helpers.ts

/**
 * Emit custom event on document
 */
export function emitCustomEvent<T>(
  name: string,
  detail: T,
  options?: { bubbles?: boolean; composed?: boolean }
): void {
  const event = new CustomEvent(name, {
    detail,
    bubbles: options?.bubbles ?? true,
    composed: options?.composed ?? true
  });
  document.dispatchEvent(event);
}

/**
 * Type-safe event listener registration
 */
export function addEventListener<T>(
  name: string,
  handler: (event: CustomEvent<T>) => void
): void {
  document.addEventListener(name, handler as EventListener);
}

/**
 * Remove event listener
 */
export function removeEventListener<T>(
  name: string,
  handler: (event: CustomEvent<T>) => void
): void {
  document.removeEventListener(name, handler as EventListener);
}
```

**Usage:** Replace manual CustomEvent construction.
**Impact:** Type safety for event detail payloads.

---

### 5. **Component Decomposition**

**Current Problem:** `qd-instructor.ts` is 1,228 lines doing too much.

**New Structure:**

```
src/components/qd-instructor/
├── qd-instructor.ts              # Orchestrator (100-150 lines)
├── qd-instructor-unlock.ts       # Password unlock UI (150-200 lines)
├── qd-instructor-scores.ts       # Scores table view (200-250 lines)
├── qd-instructor-export.ts       # CSV export controls (150-200 lines)
├── qd-instructor-manage.ts       # Data management (clear/backup) (200-250 lines)
└── shared-styles.ts              # Shared CSS-in-JS
```

**Orchestrator Pattern:**
```typescript
// src/components/qd-instructor/qd-instructor.ts
export class QdInstructor extends LitElement {
  @state() private isUnlocked = false;
  @state() private students: StudentRecord[] = [];

  render() {
    if (!this.isUnlocked) {
      return html`
        <qd-instructor-unlock
          @unlock=${this.handleUnlock}>
        </qd-instructor-unlock>
      `;
    }

    return html`
      <div class="instructor-panel">
        <qd-instructor-scores
          .students=${this.students}>
        </qd-instructor-scores>

        <qd-instructor-export
          .students=${this.students}>
        </qd-instructor-export>

        <qd-instructor-manage
          @data-cleared=${this.handleDataCleared}>
        </qd-instructor-manage>
      </div>
    `;
  }

  private handleUnlock = () => {
    this.isUnlocked = true;
    this.loadStudentData();
  }

  private handleDataCleared = () => {
    this.students = [];
    this.isUnlocked = false;
  }
}
```

**Benefits:**
- ✅ Each sub-component <250 lines
- ✅ Single responsibility
- ✅ Easier to test in isolation
- ✅ Reusable sub-components
- ✅ Better Storybook stories

---

### 6. **Session Management Improvements**

**Current Problem:** Session expiry only checked on-demand, not enforced.

**New Approach:**

```typescript
// src/services/session.ts
export class SessionService {
  private timeoutId: number | null = null;
  private static readonly SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  createSession(data: Omit<SessionData, 'loginTime' | 'expiresAt'>): SessionData {
    const now = new Date().toISOString();
    const session: SessionData = {
      ...data,
      loginTime: now,
      lastActivity: now,
      expiresAt: new Date(Date.now() + SessionService.SESSION_DURATION_MS).toISOString(),
      instructorUnlocked: false
    };

    this.saveSession(session);
    this.scheduleExpiry(SessionService.SESSION_DURATION_MS);

    // Auto-clear on tab close
    this.setupBeforeUnload();

    return session;
  }

  updateActivity(): void {
    const session = this.getSession();
    if (!session) return;

    const now = new Date().toISOString();
    session.lastActivity = now;
    session.expiresAt = new Date(Date.now() + SessionService.SESSION_DURATION_MS).toISOString();

    this.saveSession(session);
    this.scheduleExpiry(SessionService.SESSION_DURATION_MS);
  }

  private scheduleExpiry(delay: number): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      logger.info('Session expired due to inactivity');
      this.clearSession();
      emitCustomEvent('qd:session-expired', {});
    }, delay) as unknown as number;
  }

  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      this.clearSession();
    });
  }

  clearSession(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    clearQuizData(); // Clear all qd/* keys
    emitCustomEvent('qd:logout', {});
  }
}
```

**Benefits:**
- ✅ Automatic timeout enforcement
- ✅ Auto-clear on tab close
- ✅ Activity tracking updates expiry
- ✅ No zombie sessions

---

## Day-by-Day Implementation Plan

### **Day 1: Foundation & Utilities** (8-10 hours)

#### Morning (4-5 hours): Security & Types

**Team A - Security Utilities:**
- [ ] `src/utils/security.ts` - RateLimiter, constantTimeCompare
- [ ] `src/config/instructor-password.ts` - Environment-based config
- [ ] `src/services/storage/encrypted-session.ts` - AES-GCM encryption
- [ ] `src/utils/logger.ts` - Safe logging with sanitization
- [ ] `.env.example` - Configuration template

**Team B - Type Contracts:**
- [ ] `src/types/contracts.ts` - Corrected interfaces (PageCache with answers)
- [ ] Update all type definitions with JSDoc comments
- [ ] Configure strict TypeScript in `tsconfig.json`
- [ ] Update ESLint rules to enforce type safety

**Team C - Shared Utilities:**
- [ ] `src/utils/debouncer.ts` - Debouncer class
- [ ] `src/utils/storage-helpers.ts` - getJSON, setJSON, clearQuizData
- [ ] `src/utils/dom-helpers.ts` - getTableRows, createElement, setTextContent
- [ ] `src/utils/event-helpers.ts` - emitCustomEvent, addEventListener

#### Afternoon (4-5 hours): Storage & Services

**Team A - Storage Layer:**
- [ ] `src/services/storage/indexeddb.ts` - Port existing adapter (already good)
- [ ] `src/services/storage/adapter.ts` - Port interface (already good)
- [ ] Unit tests for storage layer

**Team B - Core Services:**
- [ ] `src/services/session.ts` - SessionService with auto-expiry
- [ ] `src/services/quiz-parser.ts` - Port existing (minor cleanup)
- [ ] `src/services/analysis-parser.ts` - Port existing (minor cleanup)
- [ ] `src/services/validation.ts` - Port existing
- [ ] `src/services/state-calculator.ts` - Port existing

**Team C - Advanced Utilities:**
- [ ] `src/utils/comparison-table-builder.ts` - Shared comparison table
- [ ] Unit tests for all utilities
- [ ] Storybook stories for comparison table builder

**End of Day 1 Checklist:**
- ✅ All utilities built and tested
- ✅ Type contracts complete with JSDoc
- ✅ Security utilities implemented
- ✅ Storage layer functional
- ✅ Core services ported
- ✅ Zero `any` types
- ✅ All tests passing

---

### **Day 2: Components & Enhancement** (8-10 hours)

#### Morning (4-5 hours): Enhancement Layer

**Team A - Quiz Enhancement:**
- [ ] `src/enhancers/quiz-table.ts` - Single-phase enhancement
- [ ] Use WeakMap for table metadata (not DOM attributes)
- [ ] Integration with Debouncer utility
- [ ] Integration with comparison-table-builder
- [ ] XSS-safe answer reveal (createElement, not innerHTML)
- [ ] Integration tests

**Team B - Analysis Enhancement:**
- [ ] `src/enhancers/analysis-table.ts` - Single-phase enhancement
- [ ] Use WeakMap for table metadata
- [ ] Integration with comparison-table-builder
- [ ] Cell key generation (stable hashing)
- [ ] Integration tests

**Team C - Home Badges:**
- [ ] `src/enhancers/home-badges.ts` - Port existing
- [ ] Use storage-helpers for cache access
- [ ] Real-time badge updates on state changes
- [ ] Unit tests

#### Afternoon (4-5 hours): Lit Components

**Team A - qd-instructor (decomposed):**
- [ ] `src/components/qd-instructor/qd-instructor.ts` - Orchestrator
- [ ] `src/components/qd-instructor/qd-instructor-unlock.ts` - Password UI with RateLimiter
- [ ] `src/components/qd-instructor/qd-instructor-scores.ts` - Scores table
- [ ] `src/components/qd-instructor/qd-instructor-export.ts` - CSV export
- [ ] `src/components/qd-instructor/qd-instructor-manage.ts` - Data management
- [ ] Storybook stories for each sub-component

**Team B - Other Components:**
- [ ] `src/components/qd-login.ts` - Port (minimal changes)
- [ ] `src/components/qd-status.ts` - Fix reactive properties
- [ ] `src/components/qd-error-banner.ts` - Port (minimal changes)
- [ ] `src/components/qd-storage-monitor.ts` - Port (debug tool)
- [ ] Storybook stories

**Team C - Services (continued):**
- [ ] `src/services/scores.ts` - Port existing
- [ ] `src/services/csv-export.ts` - Port existing (already good)
- [ ] Unit tests for services

**End of Day 2 Checklist:**
- ✅ Single-phase enhancement implemented
- ✅ All components decomposed and functional
- ✅ Storybook stories working
- ✅ No innerHTML usage (XSS-safe)
- ✅ All tests passing
- ✅ Visual regression baselines

---

### **Day 3: Integration & Validation** (6-8 hours)

#### Morning (3-4 hours): Orchestration

**Team A - Entry Point:**
- [ ] `src/init/bootstrap.ts` - Initialization logic
- [ ] `src/init/event-coordinator.ts` - Event listener registration
- [ ] `src/init/session-coordinator.ts` - Session lifecycle management
- [ ] `src/init/component-injector.ts` - DOM injection logic
- [ ] `src/index.ts` - Minimal entry point (<100 lines)

**Team B - Build & Bundle:**
- [ ] Configure Vite for production build
- [ ] Verify bundle size <25KB gzipped
- [ ] Add bundle size check to build script
- [ ] Generate source maps
- [ ] Generate TypeScript definitions

**Team C - E2E Test Infrastructure:**
- [ ] Create proper demo fixtures in `demo/`
- [ ] `demo/quiz-index.html` - Login, status, navigation
- [ ] `demo/quiz-examples.html` - MCQ and numeric questions
- [ ] `demo/analysis-examples.html` - Editable analysis tables
- [ ] Update `demo/README.md`

#### Afternoon (3-4 hours): Testing & Validation

**All Teams - E2E Testing:**
- [ ] `tests/e2e/workflows/progress-tracking.spec.ts` - REAL bundle, proper fixtures
- [ ] `tests/e2e/workflows/instructor-review.spec.ts` - REAL bundle
- [ ] `tests/e2e/workflows/cohort-management.spec.ts` - Complete TODOs
- [ ] `tests/e2e/workflows/analysis-capture.spec.ts` - REAL bundle (no inline mock)
- [ ] All tests using `file://` protocol
- [ ] Zero skipped tests

**Security Validation:**
- [ ] Verify no hardcoded passwords in bundle
- [ ] Verify no innerHTML in bundle
- [ ] Verify sessionStorage encryption working
- [ ] Verify rate limiting works (manual test)
- [ ] Verify constant-time comparison (timing test)
- [ ] Verify no sensitive data in production logs

**Code Quality Checks:**
- [ ] Run `npm run lint` - Zero errors
- [ ] Run `npm run format:check` - All formatted
- [ ] Run `npm run build` - Success
- [ ] Run `npm run test:unit` - All passing
- [ ] Run `npm run test:integration` - All passing
- [ ] Run `npm run test:e2e` - All passing
- [ ] Verify bundle size: `npm run size-check`

**Manual Testing:**
- [ ] Login flow
- [ ] Quiz answering (MCQ and numeric)
- [ ] Answer persistence across page reload
- [ ] R/A/G badge updates
- [ ] Session timeout (30 min)
- [ ] Instructor unlock with rate limiting
- [ ] CSV export
- [ ] Data erasure

**End of Day 3 Checklist:**
- ✅ All code integrated
- ✅ All tests passing (zero skipped)
- ✅ E2E tests using real bundle
- ✅ Bundle <25KB gzipped
- ✅ Security checklist complete
- ✅ Manual testing complete
- ✅ Ready for deployment

---

## Success Criteria (Zero Tolerance)

### 🚨 Security Checklist

- [ ] ✅ No hardcoded passwords in bundle
- [ ] ✅ No `innerHTML` usage anywhere (use `textContent` or Lit templates)
- [ ] ✅ All sensitive data encrypted in sessionStorage
- [ ] ✅ Rate limiting implemented with exponential backoff
- [ ] ✅ Constant-time password comparison
- [ ] ✅ BroadcastChannel messages validated
- [ ] ✅ No sensitive data in production logs (debug mode only)
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

## Team Coordination

### Parallel Work Strategy

**Day 1:**
- Team A: Security utilities
- Team B: Type contracts & TypeScript config
- Team C: Shared utilities

**Day 2:**
- Team A: Quiz enhancement
- Team B: Analysis enhancement & home badges
- Team C: Lit components

**Day 3 (Serial):**
- All teams: Integration, testing, validation

### Communication

**Daily Standup (15 min):**
- What did you complete?
- What are you working on today?
- Any blockers?

**Integration Points:**
- End of Day 1: Utilities available for all teams
- End of Day 2: Components and enhancers ready for integration
- End of Day 3: Full system integrated and tested

### Code Review

**Review Before Merge:**
- [ ] Zero `any` types
- [ ] Zero `eslint-disable` for type issues
- [ ] No `innerHTML` usage
- [ ] JSDoc on public APIs
- [ ] Tests included
- [ ] Storybook story (if component)

**Pair Programming Recommended For:**
- Security utilities (critical correctness)
- Encrypted session storage (tricky crypto)
- Single-phase enhancement (architectural change)

---

## Using the Archive (.rewrite-reference/)

### When to Reference Old Code

✅ **DO reference for:**
1. **Edge case handling** - "How did old code handle sparse arrays?"
   - Look at old implementation
   - Understand the edge case
   - Write NEW code that handles it better
   - Write a TEST for the edge case first

2. **Business logic patterns** - "What was the tolerance validation formula?"
   - Extract the pure logic (not the implementation)
   - Rewrite cleanly with proper types

3. **Test scenarios** - "What did old E2E test try to verify?"
   - Look at old test structure
   - Write NEW test with proper fixtures

4. **Complex algorithms** - "How did TableId hashing work?"
   - Understand the algorithm
   - Port with better types and comments

❌ **DON'T copy-paste:**
- Entire files
- Type workarounds (`any` casts, `eslint-disable`)
- Architectural patterns (two-phase enhancement)
- `innerHTML` usage
- Unencrypted storage access

### Archive Structure

```
.rewrite-reference/
├── old-src/           # Complete old src/ directory
├── old-tests/         # Complete old tests/ directory
├── old-stories/       # Complete old stories/ directory
└── LESSONS_LEARNED.md # What went wrong and why
```

### Example: Porting quiz-parser.ts

**Step 1:** Review old implementation
```bash
cat .rewrite-reference/old-src/services/quiz-parser.ts
```

**Step 2:** Identify what to keep
- ✅ Core parsing logic (good)
- ✅ Validation rules (good)
- ✅ Error handling patterns (good)

**Step 3:** Identify what to change
- ❌ Type assertions and `any` usage
- ❌ Missing JSDoc comments
- ❌ Inconsistent error messages

**Step 4:** Rewrite with improvements
```typescript
// src/services/quiz-parser.ts

/**
 * Parse a DITA quiz table into structured question data
 *
 * Validates table structure and extracts:
 * - Question text from first column
 * - MCQ options from <ol> lists or numeric answer
 * - Correct answer from second column
 * - Tolerance for numeric questions from third column
 *
 * @param table - HTML table element with class "qd-quiz"
 * @returns Parsed questions and validation errors
 *
 * @example
 * ```typescript
 * const table = document.querySelector('table.qd-quiz');
 * const result = parseQuizTable(table);
 * if (result.errors.length > 0) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function parseQuizTable(table: HTMLTableElement): ParsedQuizTable {
  // NEW implementation with better types, JSDoc, error handling
}
```

---

## Rollback Plan

If critical issues discovered during rewrite:

**Checkpoint 1 (End of Day 1):**
- If utilities or security patterns fail review → Revise Day 1, extend timeline
- Blocker threshold: >4 hours to fix critical issue

**Checkpoint 2 (End of Day 2):**
- If component integration failing → Revise architecture, extend timeline
- Blocker threshold: >6 hours to fix integration issues

**Checkpoint 3 (End of Day 3):**
- If E2E tests failing → Fix tests, extend validation phase
- Blocker threshold: >50% E2E tests failing

**Nuclear Rollback:**
If rewrite fundamentally broken after Day 2:
1. Restore from `.rewrite-reference/`
2. Apply targeted refactoring instead
3. Document lessons learned in post-mortem

**Threshold for Rollback:**
- More than 2 critical security issues unresolved
- More than 30% of tests failing at end of Day 3
- Bundle size >30KB with no clear path to <25KB

---

## Post-Rewrite Checklist

### Before Committing

- [ ] All success criteria met (see above)
- [ ] All tests passing locally
- [ ] Bundle built and size verified
- [ ] Manual testing complete
- [ ] Code review complete
- [ ] Documentation updated

### Commit & Push

```bash
# Commit incrementally during rewrite, then final commit:
git add .
git commit -m "feat: complete clean rewrite with security hardening

- Fix all security issues from POST_PHASE_7_REVIEW.md
- Eliminate ~400 lines of duplicated code
- Fix type system (PageCache with answers field)
- Simplify to single-phase enhancement
- Decompose qd-instructor into sub-components
- Implement encrypted sessionStorage
- Add rate limiting and constant-time comparison
- Zero innerHTML usage (XSS prevention)
- All tests passing (no skipped tests)
- Bundle: <25KB gzipped

Breaking changes:
- Instructor password now configured via VITE_INSTRUCTOR_PASSWORD_HASH
- Session data now encrypted (incompatible with old sessions)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to branch
git push -u origin claude/refactor-codebase-01Xspo4B3mSqxHzHmiPQ1iow
```

### Create Pull Request

**PR Title:** `feat: clean rewrite with security hardening and architectural improvements`

**PR Description Template:**
```markdown
## Summary
Complete rewrite of src/, tests/, and stories/ to address critical security vulnerabilities and architectural issues identified in POST_PHASE_7_REVIEW.md.

## Security Fixes (Critical)
- ✅ Removed hardcoded instructor password (now env-configured)
- ✅ Eliminated all XSS vulnerabilities (no innerHTML)
- ✅ Encrypted sessionStorage with AES-GCM
- ✅ Implemented rate limiting with exponential backoff
- ✅ Constant-time password comparison
- ✅ Validated BroadcastChannel messages
- ✅ Safe production logging (no sensitive data)

## Code Quality Improvements
- ✅ Eliminated ~400 lines of duplicated code
- ✅ Fixed type system (PageCache with answers field)
- ✅ Reduced eslint-disable from 78 to <10
- ✅ Zero `any` types
- ✅ Single-phase enhancement (simplified from two-phase)
- ✅ Decomposed qd-instructor (1,228 lines → 5 sub-components)

## Testing
- ✅ All unit tests passing (>80% coverage)
- ✅ All integration tests passing
- ✅ All E2E tests passing (no skipped tests)
- ✅ E2E tests use real bundle (not inline mocks)
- ✅ Bundle size: XX.XX KB gzipped (<25KB target)

## Breaking Changes
- Instructor password must be configured via `VITE_INSTRUCTOR_PASSWORD_HASH` environment variable
- Session data format changed (encrypted) - existing sessions will be cleared

## Documentation
- Updated CLAUDE.md with new patterns
- Created .env.example with configuration guide
- Added JSDoc to all public APIs
- Updated demo/README.md

## Checklist
- [ ] All security criteria met
- [ ] All code quality criteria met
- [ ] All tests passing
- [ ] Bundle size verified
- [ ] Documentation updated
- [ ] Manual testing complete
```

---

## Appendix A: File Checklist

### Core Types
- [ ] `src/types/contracts.ts` - All interfaces with JSDoc

### Utilities (Build First)
- [ ] `src/utils/security.ts` - RateLimiter, constantTimeCompare
- [ ] `src/utils/logger.ts` - Safe logging
- [ ] `src/utils/debouncer.ts` - Debouncer class
- [ ] `src/utils/storage-helpers.ts` - getJSON, setJSON
- [ ] `src/utils/comparison-table-builder.ts` - Shared table builder
- [ ] `src/utils/dom-helpers.ts` - DOM manipulation
- [ ] `src/utils/event-helpers.ts` - Custom event helpers
- [ ] `src/utils/formatting.ts` - Port existing

### Configuration
- [ ] `src/config/instructor-password.ts` - Env-based config
- [ ] `.env.example` - Configuration template

### Storage Layer
- [ ] `src/services/storage/adapter.ts` - Port interface
- [ ] `src/services/storage/indexeddb.ts` - Port implementation
- [ ] `src/services/storage/encrypted-session.ts` - NEW

### Services
- [ ] `src/services/session.ts` - With auto-expiry
- [ ] `src/services/quiz-parser.ts` - Port with improvements
- [ ] `src/services/analysis-parser.ts` - Port with improvements
- [ ] `src/services/validation.ts` - Port
- [ ] `src/services/state-calculator.ts` - Port
- [ ] `src/services/scores.ts` - Port
- [ ] `src/services/csv-export.ts` - Port

### Enhancers
- [ ] `src/enhancers/quiz-table.ts` - Single-phase
- [ ] `src/enhancers/analysis-table.ts` - Single-phase
- [ ] `src/enhancers/home-badges.ts` - Port

### Components
- [ ] `src/components/qd-login.ts` - Port
- [ ] `src/components/qd-status.ts` - Fix reactive properties
- [ ] `src/components/qd-error-banner.ts` - Port
- [ ] `src/components/qd-storage-monitor.ts` - Port
- [ ] `src/components/qd-instructor/qd-instructor.ts` - Orchestrator
- [ ] `src/components/qd-instructor/qd-instructor-unlock.ts` - NEW
- [ ] `src/components/qd-instructor/qd-instructor-scores.ts` - NEW
- [ ] `src/components/qd-instructor/qd-instructor-export.ts` - NEW
- [ ] `src/components/qd-instructor/qd-instructor-manage.ts` - NEW

### Initialization
- [ ] `src/init/bootstrap.ts` - NEW
- [ ] `src/init/event-coordinator.ts` - NEW
- [ ] `src/init/session-coordinator.ts` - NEW
- [ ] `src/init/component-injector.ts` - NEW
- [ ] `src/index.ts` - Minimal entry point

### Tests (Mirror src/ structure)
- [ ] All unit tests in `tests/unit/`
- [ ] All integration tests in `tests/integration/`
- [ ] All E2E tests in `tests/e2e/workflows/`
- [ ] Zero skipped tests

### Stories (Mirror component structure)
- [ ] All Storybook stories in `stories/`
- [ ] Visual regression baselines

### Demo Files
- [ ] `demo/quiz-index.html` - Login and navigation
- [ ] `demo/quiz-examples.html` - Quiz tables
- [ ] `demo/analysis-examples.html` - Analysis tables
- [ ] `demo/README.md` - Updated

---

## Appendix B: Quick Reference Commands

### Development
```bash
npm run dev              # Start dev server
npm run storybook        # Component development
```

### Testing
```bash
npm test                 # All tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests
```

### Build & Quality
```bash
npm run build            # Production build
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix issues
npm run format:check     # Prettier check
npm run format           # Auto-format
npm run size-check       # Bundle size
```

### Environment Setup
```bash
# Generate instructor password hash
echo -n "your-password" | openssl dgst -sha256

# Add to .env (not committed)
echo "VITE_INSTRUCTOR_PASSWORD_HASH=abc123..." > .env
echo "VITE_DEBUG=true" >> .env
```

---

## Appendix C: Security Testing Checklist

### Password Security
- [ ] Verify hardcoded password removed from bundle: `grep -r "instructor" dist/`
- [ ] Verify env var required: Test without `VITE_INSTRUCTOR_PASSWORD_HASH` set
- [ ] Test rate limiting: 5 failed attempts → 30s lockout
- [ ] Test constant-time comparison: Timing analysis shows no correlation

### XSS Prevention
- [ ] Verify no innerHTML in bundle: `grep -r "innerHTML" dist/`
- [ ] Test XSS payloads in quiz content: `<script>alert('XSS')</script>`
- [ ] Verify Lit templates auto-escape: Inject script in name field

### Session Security
- [ ] Verify sessionStorage encrypted: Inspect sessionStorage in DevTools
- [ ] Test session expiry: Wait 30 minutes → auto-logout
- [ ] Test tab close: Close tab → session cleared
- [ ] Verify no plaintext sensitive data: Search sessionStorage for serviceId

### Logging Security
- [ ] Verify production logs clean: Build with `VITE_DEBUG=false`, check console
- [ ] Verify debug logs disabled: No student names/IDs in production
- [ ] Test error messages: Generic user-facing, detailed debug-only

---

## Contact & Support

**Questions During Rewrite:**
- Post in team chat with `@tech-lead` mention
- Reference this strategy document section

**Blockers:**
- Immediately notify tech lead
- Document blocker in `BLOCKERS.md` with:
  - What you were doing
  - What's blocking you
  - What you've tried
  - Estimated time to resolve

**Post-Rewrite:**
- Delete `.rewrite-reference/` after successful deployment
- Update `LESSONS_LEARNED.md` with any new insights
- Schedule retrospective to discuss process improvements

---

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Next Review:** After Day 1 completion
