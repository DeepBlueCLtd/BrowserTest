# Sonar Quiz System - Code Review: Refactoring Hotspots

## Executive Summary

This code review identifies 18 high-priority refactoring opportunities across the largest files. The primary issues are:
- **Large files**: 5 files exceed 400 lines (max: 819 lines)
- **UI/Business coupling**: Heavy DOM manipulation in components, business logic in UI layers
- **Deep nesting**: Methods exceeding 100 lines with 4+ nesting levels
- **Missing component abstractions**: Complex UI patterns built with manual DOM manipulation

**Status Update (2025-11-21)**: None of the suggested refactorings have been implemented yet. The files have grown slightly due to new features (username display, build info tooltip, improved error handling). All refactoring opportunities remain valid and actionable.

---

## 1. Large Files (>400 Lines)

### 1.1 qd-login.ts (819 lines) ⬆️
**Location**: `/home/user/BrowserTest/src/components/qd-login.ts`
**Size**: 819 lines (205% over threshold) - *increased from 791*
**Priority**: HIGH
**Status**: Not yet refactored

**Issues**:
- Massive `renderInstructorModalToBody()` method (~173 lines)
- Manual DOM creation with inline styles instead of Lit templates
- Business logic mixed with rendering logic
- Password hashing duplicated here instead of using `utils/security.ts` (line 719)

**Suggested Refactoring**:
1. Extract `<qd-instructor-login-modal>` component
2. Import and use `hashPassword` from `utils/security.ts` (already exported there)
3. Centralize release ID extraction to `ConfigService`
4. Target: Reduce to ~300 lines

### 1.2 quiz-table.ts (806 lines) ⬆️
**Location**: `/home/user/BrowserTest/src/enhancers/quiz-table.ts`
**Size**: 806 lines (202% over threshold) - *increased from 749*
**Priority**: HIGH
**Status**: Not yet refactored

**Issues**:
- Complex `showStudentAnswersForTable()` with nested loops (~100 lines)
- `saveAnswer()` mixes storage and UI logic (~94 lines)
- `enhanceInteractive()` is doing too much (~131 lines)
- Manual DOM manipulation throughout

**Suggested Refactoring**:
1. Extract `<qd-student-answers-list>` component for instructor view
2. Move save logic to `QuizStorageService`
3. Extract input creation to factory methods
4. Target: Reduce to ~400 lines

### 1.3 analysis-table.ts (637 lines) 🆕
**Location**: `/home/user/BrowserTest/src/enhancers/analysis-table.ts`
**Size**: 637 lines (159% over threshold)
**Priority**: MEDIUM
**Status**: Not yet refactored

**Issues**:
- Similar patterns to quiz-table.ts (storage logic in enhancer)
- Manual DOM manipulation for instructor views
- Deep nesting in complex methods

**Suggested Refactoring**:
1. Apply same component extraction patterns as quiz-table.ts
2. Share common instructor view components with quiz-table.ts
3. Target: Reduce to ~400 lines

### 1.4 indexeddb.ts (501 lines)
**Location**: `/home/user/BrowserTest/src/services/storage/indexeddb.ts`
**Size**: 501 lines (125% over threshold)
**Priority**: MEDIUM
**Status**: Not yet refactored

**Issues**:
- Multiple responsibility violations (database management, error handling, singleton pattern)
- Long methods with complex promise handling
- Error handling could be centralized

**Suggested Refactoring**:
1. Extract error handling to `IndexedDBErrorHandler` class
2. Extract singleton pattern to separate file
3. Split into `IndexedDBCore` and `IndexedDBAdapter`
4. Target: Reduce to ~350 lines

### 1.5 session.ts (445 lines)
**Location**: `/home/user/BrowserTest/src/services/session.ts`
**Size**: 445 lines (111% over threshold) - *slightly increased from 442*
**Priority**: MEDIUM
**Status**: Not yet refactored

**Issues**:
- Mixed concerns: session management, cache building, storage operations
- Cache utilities could be separate module
- Large file but generally well-structured

**Suggested Refactoring**:
1. Extract cache utilities to `services/cache-builder.ts`
2. Create `CacheService` class for cache-specific operations
3. Target: Reduce to ~280 lines

### 1.6 bootstrap.ts (442 lines)
**Location**: `/home/user/BrowserTest/src/init/bootstrap.ts`
**Size**: 442 lines (110% over threshold)
**Priority**: MEDIUM
**Status**: Not yet refactored

**Issues**:
- Global styles injection (91 lines of CSS in JavaScript)
- `checkExistingSessionAndUpgradeTables()` method with multiple responsibilities
- Mixed initialization and runtime logic

**Suggested Refactoring**:
1. Move global styles to `src/styles/global.css`
2. Extract session handling helpers
3. Target: Reduce to ~300 lines

---

## 2. UI/Business Logic Coupling

### 2.1 Manual DOM Creation in qd-login.ts
**Location**: `/home/user/BrowserTest/src/components/qd-login.ts:401-574`
**Priority**: HIGH

**Issue**:
```typescript
// Lines 401-574: 173 lines of manual DOM creation
private renderInstructorModalToBody(): void {
  const overlay = document.createElement('div');
  overlay.className = 'qd-instructor-modal-overlay';
  overlay.style.cssText = `...`; // 17 lines of inline CSS

  const modal = document.createElement('div');
  modal.style.cssText = `...`; // More inline CSS

  // ... 150+ more lines of manual DOM building
}
```

**Problems**:
- No use of Lit's templating system
- Inline CSS strings are unmaintainable
- Hard to test in isolation
- No reactive state management
- Violates component architecture pattern

**Refactoring Approach**:
1. Create new component: `src/components/qd-instructor-login-modal.ts`
2. Use Lit templates with reactive properties
3. Move CSS to component styles
4. Emit events for form submission
5. ~150 lines reduction in qd-login.ts

**Example**:
```typescript
// NEW: qd-instructor-login-modal.ts
@customElement('qd-instructor-login-modal')
export class QdInstructorLoginModal extends LitElement {
  @property({ type: Boolean }) open = false;
  @state() private password = '';
  @state() private error = '';

  render() {
    return this.open ? html`
      <div class="modal-overlay" @click=${this.handleOverlayClick}>
        <div class="modal">
          <h3>Instructor Login</h3>
          <form @submit=${this.handleSubmit}>
            <input type="password" .value=${this.password} @input=${...} />
            ${this.error ? html`<div class="error">${this.error}</div>` : ''}
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    ` : '';
  }
}
```

### 2.2 Business Logic in quiz-table.ts
**Location**: `/home/user/BrowserTest/src/enhancers/quiz-table.ts:416-509`
**Priority**: HIGH

**Issue**:
```typescript
// Lines 416-509: Storage logic in enhancer
async function saveAnswer(...): Promise<void> {
  // Get session
  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);

  // Validate answer
  const success = validateAnswer(question, answer);

  // Load from IndexedDB
  const storageService = getStorageService();
  let studentRecord = await storageService.loadStudentRecord(session);

  // Update record
  const updatedRecord = storageService.updateRecordWithAnswer(...);

  // Save to IndexedDB
  await storageService.saveStudentRecord(updatedRecord);

  // Build cache
  const cache = storageService.buildCache(updatedRecord);

  // Apply UI styling
  applyValidationStyling(cell, success);

  // Emit events
  emitCustomEvent('qd:answer-saved', {...});
}
```

**Problems**:
- Enhancer doing storage orchestration (should delegate to service)
- UI updates mixed with storage operations
- Hard to test storage logic independently
- Violates separation of concerns

**Refactoring Approach**:
1. Create `QuizAnswerService` in `services/quiz-answer-service.ts`
2. Move all storage orchestration to service
3. Enhancer only handles UI updates and service calls
4. Service returns result object with success/cache data

**Example**:
```typescript
// NEW: services/quiz-answer-service.ts
export class QuizAnswerService {
  async saveAnswer(session: SessionData, pageId: string, questionIndex: number,
                   answer: string, question: QuizQuestion): Promise<SaveResult> {
    const success = validateAnswer(question, answer);
    const answerRecord = { answer, success, timestamp: new Date().toISOString() };

    const studentRecord = await this.storage.loadStudentRecord(session);
    const updatedRecord = this.storage.updateRecordWithAnswer(...);
    await this.storage.saveStudentRecord(updatedRecord);

    return { success, cache: this.storage.buildCache(updatedRecord) };
  }
}

// IN: quiz-table.ts (simplified)
async function saveAnswer(table, metadata, questionIndex, answer) {
  const result = await quizAnswerService.saveAnswer(session, pageId, questionIndex, answer, question);
  applyValidationStyling(cell, result.success);
  emitCustomEvent('qd:answer-saved', {...});
}
```

### 2.3 Password Hashing in UI Component
**Location**: `/home/user/BrowserTest/src/components/qd-login.ts:706-716`
**Priority**: MEDIUM

**Issue**:
```typescript
// Lines 706-716: Crypto logic in UI component
private async hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 12);
}
```

**Problems**:
- Security logic in presentation layer
- Duplicated in multiple components (if needed elsewhere)
- Hard to change hashing algorithm globally
- Not easily testable

**Refactoring Approach**:
Move to existing `utils/security.ts` (already exists at 205 lines):
```typescript
// IN: utils/security.ts
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 12);
}

// IN: qd-login.ts (use utility)
import { hashPassword } from '../utils/security.js';

private async handleInstructorLogin(e: Event) {
  const passwordHash = await hashPassword(this.instructorPassword);
  // ...
}
```

---

## 3. Deep Business Logic Nesting

### 3.1 showStudentAnswersForTable() - 100 lines, 4+ nesting levels
**Location**: `/home/user/BrowserTest/src/enhancers/quiz-table.ts:639-738`
**Priority**: HIGH

**Issue**:
```typescript
// Lines 639-738: Complex nested loops and DOM manipulation
async function showStudentAnswersForTable(table, metadata): Promise<void> {
  // Level 1: Function body
  const students = await storageService.getStudentsByRelease(session.release);
  const rows = Array.from(tbody.querySelectorAll('tr'));

  // Level 2: Loop over questions
  parsed.questions.forEach((_question, questionIndex) => {
    const row = rows[questionIndex];
    const answerCell = cells[1];

    const studentAnswers: Array<{...}> = [];

    // Level 3: Loop over students
    students.forEach((student) => {
      const pageData = student.pages[pageId];
      // Level 4: Conditional checks
      if (!pageData || !pageData.answers) return;
      const answerRecord = pageData.answers[questionIndex];
      if (!answerRecord) return;

      studentAnswers.push({...});
    });

    // Level 3: Create display
    if (studentAnswers.length > 0) {
      const display = document.createElement('div');
      // Level 4: Loop over answers
      studentAnswers.forEach((sa) => {
        const answerDiv = document.createElement('div');
        answerDiv.innerHTML = `...`; // Template string
        display.appendChild(answerDiv);
      });
      answerCell.appendChild(display);
    }
  });
}
```

**Problems**:
- 100 lines in single function
- 4+ nesting levels make it hard to follow
- Manual DOM creation instead of components
- Mixed data transformation and rendering
- No separation between data gathering and display

**Refactoring Approach**:
1. Extract data gathering: `getStudentAnswersForPage()`
2. Extract rendering: Create `<qd-student-answers-list>` component
3. Reduce nesting with early returns and helper functions

**Example**:
```typescript
// Step 1: Extract data gathering
function getStudentAnswersForPage(students: StudentRecord[], pageId: string,
                                   questionIndex: number): StudentAnswer[] {
  return students
    .map(student => extractStudentAnswer(student, pageId, questionIndex))
    .filter(answer => answer !== null);
}

function extractStudentAnswer(student: StudentRecord, pageId: string,
                               questionIndex: number): StudentAnswer | null {
  const pageData = student.pages[pageId];
  if (!pageData?.answers) return null;

  const answerRecord = pageData.answers[questionIndex];
  if (!answerRecord) return null;

  return {
    name: student.name,
    serviceId: student.serviceId,
    answer: answerRecord.answer,
    success: answerRecord.success,
    timestamp: answerRecord.timestamp,
  };
}

// Step 2: Simplified enhancer
async function showStudentAnswersForTable(table, metadata): Promise<void> {
  const students = await loadStudentsForRelease(session.release);
  const rows = getTableRows(table);

  parsed.questions.forEach((_, questionIndex) => {
    const answers = getStudentAnswersForPage(students, pageId, questionIndex);
    if (answers.length === 0) return;

    const answerCell = getAnswerCell(rows, questionIndex);
    if (!answerCell) return;

    // Use new component instead of manual DOM
    const answersList = document.createElement('qd-student-answers-list');
    answersList.answers = answers;
    answerCell.appendChild(answersList);
  });
}

// Step 3: NEW component
@customElement('qd-student-answers-list')
export class QdStudentAnswersList extends LitElement {
  @property({ type: Array }) answers: StudentAnswer[] = [];

  render() {
    return html`
      <div class="qd-student-answers">
        ${this.answers.map(answer => html`
          <qd-student-answer-item .answer=${answer}></qd-student-answer-item>
        `)}
      </div>
    `;
  }
}
```

### 3.2 enhanceInteractive() - 131 lines
**Location**: `/home/user/BrowserTest/src/enhancers/quiz-table.ts:182-313`
**Priority**: HIGH

**Issue**:
131-line method doing table enhancement, storage loading, input creation, and event setup.

**Refactoring Approach**:
1. Extract `loadQuizPageData()` helper (lines 198-228)
2. Extract `createQuizInputControls()` helper (lines 240-283)
3. Extract `setupInstructorListeners()` helper (lines 286-307)
4. Target: Main method ~40 lines, 3 helpers ~30 lines each

### 3.3 checkExistingSessionAndUpgradeTables() - 77 lines
**Location**: `/home/user/BrowserTest/src/init/bootstrap.ts:278-354`
**Priority**: MEDIUM

**Issue**:
77-line method with multiple responsibilities: session check, instructor handling, cache rebuilding, table upgrading.

**Refactoring Approach**:
1. Extract `handleInstructorTableReveal()` (lines 288-301)
2. Extract `rebuildCacheFromStorage()` (lines 310-325)
3. Extract `upgradeTablesForSession()` (lines 337-353)
4. Target: Main method ~25 lines, 3 helpers ~20 lines each

---

## 4. Component Refactoring Opportunities

### 4.1 Extract Instructor Login Modal
**Location**: `/home/user/BrowserTest/src/components/qd-login.ts:401-574`
**Priority**: HIGH
**Lines to Extract**: 173

**Current**: 173 lines of manual DOM creation in `renderInstructorModalToBody()`

**Proposed**: New component `<qd-instructor-login-modal>`

**Benefits**:
- Testable in isolation via Storybook
- Reusable for other instructor authentication flows
- Proper reactive state management
- CSS in component styles, not inline
- Standard Lit event handling

**Files to Create**:
- `src/components/qd-instructor-login-modal.ts` (~120 lines)
- `src/components/qd-instructor-login-modal.test.ts` (~80 lines)
- `stories/qd-instructor-login-modal.stories.ts` (~50 lines)

### 4.2 Extract Student Answers Display
**Location**: `/home/user/BrowserTest/src/enhancers/quiz-table.ts:639-738`
**Priority**: HIGH
**Lines to Extract**: 100

**Current**: Manual DOM creation for instructor view of student answers

**Proposed**: Two new components:
1. `<qd-student-answers-list>` - Container component
2. `<qd-student-answer-item>` - Individual answer display

**Benefits**:
- Proper styling with Shadow DOM
- Testable rendering logic
- Reusable for analysis tables
- Easier to add features (sorting, filtering)

**Files to Create**:
- `src/components/qd-student-answers-list.ts` (~80 lines)
- `src/components/qd-student-answer-item.ts` (~60 lines)

### 4.3 Extract Quiz Input Components
**Location**: `/home/user/BrowserTest/src/enhancers/quiz-table.ts:325-371`
**Priority**: MEDIUM
**Lines to Extract**: 46

**Current**: Factory function `createQuestionInput()` returns `HTMLInputElement | HTMLSelectElement`

**Proposed**: Two new components:
1. `<qd-mcq-input>` - Multiple choice question input (select dropdown)
2. `<qd-numeric-input>` - Numeric answer input with validation

**Benefits**:
- Consistent validation across question types
- Better accessibility (ARIA labels, keyboard nav)
- Testable input behavior
- Easier to add features (hints, autocomplete)

**Files to Create**:
- `src/components/quiz-inputs/qd-mcq-input.ts` (~70 lines)
- `src/components/quiz-inputs/qd-numeric-input.ts` (~60 lines)

---

## 5. Non-Component UI (Manual DOM) That Should Be Lit Components

### 5.1 Instructor Modal (qd-login.ts)
**Location**: `/home/user/BrowserTest/src/components/qd-login.ts:401-574`
**Priority**: HIGH

**Current Implementation**:
```typescript
private renderInstructorModalToBody(): void {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position: fixed; top: 0; ...`; // 12 CSS properties

  const modal = document.createElement('div');
  modal.style.cssText = `background: white; border-radius: 8px; ...`; // 8 CSS properties

  const header = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = 'Instructor Login';

  const closeBtn = document.createElement('button');
  closeBtn.onclick = () => this.closeInstructorModal();

  // ... 150+ more lines

  document.body.appendChild(overlay);
}
```

**Should Be**:
```typescript
// Component with proper Lit template
@customElement('qd-instructor-login-modal')
export class QdInstructorLoginModal extends LitElement {
  static styles = css`
    .overlay { position: fixed; top: 0; ... }
    .modal { background: white; border-radius: 8px; ... }
  `;

  @property({ type: Boolean }) open = false;

  render() {
    if (!this.open) return html``;

    return html`
      <div class="overlay" @click=${this.handleOverlayClick}>
        <div class="modal">
          <div class="header">
            <h3>Instructor Login</h3>
            <button @click=${this.close}>×</button>
          </div>
          <form @submit=${this.handleSubmit}>
            <!-- ... -->
          </form>
        </div>
      </div>
    `;
  }
}
```

### 5.2 Student Answers List (quiz-table.ts)
**Location**: `/home/user/BrowserTest/src/enhancers/quiz-table.ts:704-730`
**Priority**: HIGH

**Current Implementation**:
```typescript
studentAnswers.forEach((sa) => {
  const answerDiv = document.createElement('div');
  answerDiv.className = `qd-student-answer ${sa.success ? 'qd-correct' : 'qd-incorrect'}`;

  const last4 = sa.serviceId.slice(-4);
  const timestamp = new Date(sa.timestamp).toLocaleString('en-US', {...});

  answerDiv.innerHTML = `
    <span class="qd-student-name">${sa.name} (${last4})</span>:
    <span class="qd-student-answer-text">${sa.answer}</span>
    <span class="qd-timestamp">${timestamp}</span>
  `;

  display.appendChild(answerDiv);
});
```

**Should Be**:
```typescript
// Component with proper templating
@customElement('qd-student-answer-item')
export class QdStudentAnswerItem extends LitElement {
  @property({ type: Object }) answer!: StudentAnswer;

  render() {
    const last4 = this.answer.serviceId.slice(-4);
    const timestamp = new Date(this.answer.timestamp).toLocaleString();
    const statusClass = this.answer.success ? 'correct' : 'incorrect';

    return html`
      <div class="answer-item ${statusClass}">
        <span class="student-name">${this.answer.name} (${last4})</span>:
        <span class="answer-text">${this.answer.answer}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
    `;
  }
}
```

### 5.3 Global Styles Injection (bootstrap.ts)
**Location**: `/home/user/BrowserTest/src/init/bootstrap.ts:21-111`
**Priority**: LOW

**Current**: 91 lines of CSS injected as string in JavaScript

**Suggested**: Move to `src/styles/global.css` and import in entry point

---

## 6. Services Needing Refactoring

### 6.1 Create QuizAnswerService
**Priority**: HIGH
**Estimated Size**: ~200 lines

**Responsibilities**:
- Orchestrate quiz answer saving
- Coordinate between storage, validation, and cache
- Return structured results to enhancers

**Current**: Logic scattered in `quiz-table.ts:416-509`

**Proposed API**:
```typescript
export class QuizAnswerService {
  async saveAnswer(params: SaveAnswerParams): Promise<SaveAnswerResult>;
  async loadAnswersForPage(pageId: string): Promise<AnswerRecord[]>;
  async validateAndSave(questionIndex: number, answer: string): Promise<ValidationResult>;
}
```

### 6.2 Create CacheService
**Priority**: MEDIUM
**Estimated Size**: ~180 lines

**Responsibilities**:
- Build cache from student records
- Update cache incrementally
- Validate cache integrity

**Current**: Utility functions in `session.ts:256-419`

**Proposed API**:
```typescript
export class CacheService {
  buildFromRecord(record: StudentRecord): SessionCache;
  updateWithAnswer(cache: SessionCache, pageId: string, isCorrect: boolean): SessionCache;
  registerPageQuestions(cache: SessionCache, pageId: string, total: number): SessionCache;
}
```

### 6.3 Split IndexedDBStorageAdapter
**Priority**: LOW
**Estimated Size**: 2 files ~250 lines each

**Split into**:
1. `IndexedDBCore` - Low-level database operations
2. `IndexedDBAdapter` - High-level storage interface implementation

---

## 7. Priority Refactoring Roadmap

### Phase 1: Critical Path (Week 1-2)
1. **Extract Instructor Login Modal** (qd-login.ts) - 173 lines reduction
2. **Extract Student Answers Components** (quiz-table.ts) - 100 lines reduction
3. **Create QuizAnswerService** - Move storage orchestration from enhancer

**Impact**: ~400 lines moved/reduced, improved testability

### Phase 2: Service Layer (Week 3)
4. **Create CacheService** - Extract from session.ts
5. **Move password hashing** to security.ts
6. **Refactor saveAnswer()** - Split into smaller functions

**Impact**: Better separation of concerns, easier testing

### Phase 3: Deep Nesting (Week 4)
7. **Refactor enhanceInteractive()** - Split into 3 helpers
8. **Refactor showStudentAnswersForTable()** - Extract data/rendering
9. **Refactor checkExistingSessionAndUpgradeTables()** - Split into 3 helpers

**Impact**: Reduced complexity, easier to maintain

### Phase 4: Component Extraction (Week 5)
10. **Extract Quiz Input Components** - `<qd-mcq-input>`, `<qd-numeric-input>`
11. **Refactor analysis-table.ts** - Apply same patterns as quiz-table
12. **Split IndexedDBStorageAdapter** - If needed

**Impact**: Reusable components, consistent UX

---

## 8. Metrics Summary

| Category | Count | Total Lines | Avg Lines |
|----------|-------|-------------|-----------|
| Files >400 lines | 6 | 3,650 | 608 |
| High-priority refactors | 8 | ~800 | 100 |
| Medium-priority refactors | 6 | ~500 | 83 |
| Low-priority refactors | 3 | ~200 | 67 |

**Current Large Files** (updated 2025-11-21):
- qd-login.ts: 819 lines ⬆️
- quiz-table.ts: 806 lines ⬆️
- analysis-table.ts: 637 lines 🆕
- indexeddb.ts: 501 lines
- session.ts: 445 lines
- bootstrap.ts: 442 lines

**Refactoring Status**: 0/18 completed
**Potential Line Reduction**: ~1,400 lines (38% of large files)
**New Components Needed**: 7 (instructor-modal, student-answers-list, student-answer-item, mcq-input, numeric-input, etc.)
**New Services Needed**: 2 (QuizAnswerService, CacheService)

---

## 9. Testing Impact

Each refactoring should include:
- Unit tests for extracted services (Vitest)
- Component tests for new Lit components (Storybook)
- Integration tests for table enhancers (Playwright)

**Estimated Test Coverage Improvement**: +15% (from extracting untestable manual DOM to components)

---

## 10. Recommendations

1. **Start with qd-login.ts**: Biggest win, clear component extraction
2. **Use existing patterns**: qd-instructor.ts is well-decomposed, use as template
3. **Avoid breaking changes**: Maintain same external API during refactoring
4. **Test-first approach**: Write tests for new components/services before moving code
5. **Incremental commits**: Each extraction should be independently testable
6. **Update Storybook**: Add stories for each new component
7. **Update CLAUDE.md**: Document new architecture patterns

---

**Generated**: 2025-11-19
**Last Updated**: 2025-11-21
**Reviewer**: Claude Code Agent
**Codebase**: Sonar Quiz System (BrowserTest)

## Changelog

- **2025-11-21**: Updated line counts, added analysis-table.ts and bootstrap.ts to large files list, noted that no refactorings have been implemented yet, updated metrics summary
