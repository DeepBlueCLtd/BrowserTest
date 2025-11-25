# Research: Lit Component Refactor & Testability Improvements

**Feature**: 007-lit-component-refactor
**Date**: 2025-11-25

## Research Questions

### 1. Where to place pure helper functions?

**Decision**: Create `src/utils/` directory for pure helper functions

**Rationale**:
- Distinguishes pure utilities from service classes with state/dependencies
- Aligns with existing patterns (services have instances, utils are stateless)
- Clear import path: `import { validateStudentForm } from '../utils/validation-helpers'`

**Alternatives Considered**:
- `src/helpers/` - Less conventional, implies framework-specific helpers
- `src/lib/` - Often used for external/shared libraries
- Inline in services - Would require mocking services to test pure logic

### 2. Modal component composition pattern

**Decision**: Use slot-based composition with `<qd-modal>` base component

**Rationale**:
- Lit's `<slot>` element enables clean content projection
- Base component handles common concerns: backdrop, focus trap, keyboard events
- Child components (`<qd-scores-modal>`, etc.) focus on content only
- Enables independent testing of modal behavior vs content

**Pattern**:
```typescript
// Base: handles modal mechanics
<qd-modal ?open=${this.open} @qd:modal-close=${this.handleClose}>
  <slot></slot>
</qd-modal>

// Usage: specific modal injects content
render() {
  return html`
    <qd-modal ?open=${this.open}>
      <h2>Scores</h2>
      <table>...</table>
    </qd-modal>
  `;
}
```

**Alternatives Considered**:
- Inheritance (`extends QdModal`) - Tight coupling, harder to test
- Render callbacks - Less declarative, breaks Lit's reactive model
- Separate overlay + dialog - More flexible but more complex

### 3. Focus trap implementation

**Decision**: Use Lit's `@lit/reactive-element` with manual focus management

**Rationale**:
- No external dependencies (bundle size constraint)
- Modal already tracks open state reactively
- Focus trap logic is simple: first focusable, last focusable, wrap on Tab

**Implementation Approach**:
```typescript
private trapFocus(e: KeyboardEvent) {
  if (e.key !== 'Tab') return;
  const focusable = this.shadowRoot!.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0] as HTMLElement;
  const last = focusable[focusable.length - 1] as HTMLElement;

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
```

**Alternatives Considered**:
- `focus-trap` npm package - Adds ~3KB, external dependency
- `inert` attribute on background - Good but browser support uneven
- Dialog element (`<dialog>`) - Native but polyfill needed for older browsers

### 4. Helper function extraction strategy

**Decision**: Extract in phases—utilities first, then services, then refactor callers

**Rationale**:
- Phase 0 utilities are zero-risk (additive, no caller changes)
- Tests written first ensure behavior is captured
- Callers refactored one at a time with test verification
- Rollback is easy at any stage

**Extraction Order**:
1. `validation-helpers.ts` - Form validation from qd-login.ts
2. `calculation-helpers.ts` - Status/percentage logic from multiple files
3. `question-input.ts` - Input spec generation from quiz-table.ts
4. `answer-display.ts` - Display formatting from quiz-table.ts
5. Refactor callers to use new helpers
6. Delete duplicated inline code

**Alternatives Considered**:
- Big-bang refactor - Higher risk, harder to review
- Extraction during component refactor - Muddies the scope of each change

### 5. Testing pure functions vs components

**Decision**: Separate test files by type, different coverage targets

**Rationale**:
- Pure functions: 100% coverage trivial to achieve, no mocks
- Components: >80% coverage realistic, some edge cases need integration

**Test Structure**:
```
tests/unit/
├── utils/                    # 100% coverage target
│   ├── validation-helpers.test.ts
│   └── calculation-helpers.test.ts
├── services/                 # 100% coverage target
│   ├── question-input.test.ts
│   └── answer-display.test.ts
└── components/               # >80% coverage target
    ├── qd-modal.test.ts
    └── ...
```

**Test Examples for Pure Functions**:
```typescript
describe('calculateStatusIndicator', () => {
  it('returns green when all correct', () => {
    expect(calculateStatusIndicator(10, 10)).toBe('green');
  });
  it('returns amber when some correct', () => {
    expect(calculateStatusIndicator(10, 5)).toBe('amber');
  });
  it('returns red when none correct', () => {
    expect(calculateStatusIndicator(10, 0)).toBe('red');
  });
  it('returns red when total is zero', () => {
    expect(calculateStatusIndicator(0, 0)).toBe('red');
  });
});
```

### 6. Bundle size impact

**Decision**: Expect net neutral or slight decrease

**Rationale**:
- Deduplication: Multiple files with similar modal code → one shared component
- Helper extraction: No new code, just reorganization
- New components: ~4 small components, but eliminate inline code

**Measurement Plan**:
1. Baseline: `npm run size-check` before changes
2. After helpers: Verify no increase (should be identical)
3. After components: Verify <2KB increase
4. Final: Verify <35KB total bundle

**Risk Mitigation**:
- If size increases unexpectedly, use `source-map-explorer` to identify cause
- Consider tree-shaking opportunities in Vite config

## Existing Patterns to Follow

### Lit Component Patterns (from existing codebase)

1. **Property declarations**:
```typescript
@property({ type: Boolean, reflect: true }) open = false;
@property({ type: String }) title = '';
```

2. **Event emission**:
```typescript
this.dispatchEvent(new CustomEvent('qd:modal-close', {
  bubbles: true,
  composed: true,
}));
```

3. **Styles**:
```typescript
static styles = css`
  :host { display: block; }
  :host([open]) .backdrop { display: flex; }
`;
```

### Service Patterns (from state-calculator.ts)

Good example of pure functions:
```typescript
export function calculateCompletionState(answers: AnswerRecord[]): CompletionState {
  if (answers.length === 0) return 'unstarted';
  const hasAnswers = answers.some(a => a.answer.trim() !== '');
  if (!hasAnswers) return 'unstarted';
  const allCorrect = answers.every(a => a.success);
  return allCorrect ? 'complete' : 'incomplete';
}
```

## Decisions Summary

| Question | Decision | Key Reason |
|----------|----------|------------|
| Helper location | `src/utils/` | Clear separation from stateful services |
| Modal pattern | Slot-based composition | Decouples mechanics from content |
| Focus trap | Manual implementation | No external dependencies |
| Extraction strategy | Phased approach | Lower risk, easier review |
| Test structure | Separate files, different targets | 100% for pure, >80% for components |
| Bundle impact | Net neutral expected | Deduplication offsets new code |
