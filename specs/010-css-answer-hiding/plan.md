# Implementation Plan: CSS-Based Quiz Answer Hiding

**Branch**: `010-css-answer-hiding` | **Date**: 2025-11-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-css-answer-hiding/spec.md`

## Summary

Hide quiz answer/detail columns via CSS before JavaScript executes, preventing answer visibility when JS is disabled or during page load. CSS already partially implemented in `f13ldman.css`. Need to add override rules for student/instructor modes and author mode visual indicators.

## Technical Context

**Language/Version**: CSS3 + TypeScript 5.x (for JS integration)
**Primary Dependencies**: Existing DITA template CSS (`f13ldman.css`), Lit 3.x components
**Storage**: N/A (CSS-only feature)
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Chrome/Edge 96+, Firefox 102+ (offline, file:// protocol)
**Project Type**: Single project (browser extension pattern)
**Performance Goals**: No layout shift on column reveal
**Constraints**: Bundle size ≤40KB, works offline from file:// URLs
**Scale/Scope**: Single page quiz tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Offline-First**: CSS loaded from local template file, no network required
- [x] **Progressive Enhancement**: CSS hides by default, JS reveals when appropriate
- [x] **Test-Driven Development**: Tests will verify CSS visibility behavior
- [x] **Phase-Gated Delivery**: Single-phase implementation with test verification
- [x] **Performance Constraints**: CSS-only, no bundle impact
- [x] **Data Isolation**: N/A (no data storage)
- [x] **Zero Configuration**: CSS in template file, no setup required

## Project Structure

### Documentation (this feature)

```text
specs/010-css-answer-hiding/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # N/A - CSS-only feature
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A - no API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
dita/template/
├── f13ldman.css              # Production CSS (hiding + overrides)
└── f13ldman_author_mode.css  # Author visual indicators

dita-demo/oxygen-webhelp/template/
└── f13ldman.css              # Demo copy (synced from dita/template)

src/init/
└── bootstrap.ts              # May need qd-quiz-instructor class

tests/
├── integration/
│   └── quiz-table.test.ts    # Verify CSS visibility behavior
└── e2e/
    └── workflows/
        ├── dita-student-flow.spec.ts
        └── instructor-dynamic-reveal.spec.ts
```

**Structure Decision**: CSS-only changes in DITA template, minimal JS changes in bootstrap.ts if needed for instructor class.

## Current State Analysis

**Already Implemented** (in `dita/template/f13ldman.css` lines 584-586):
```css
/* hide the answer and details cells */
.qd-quiz td:nth-child(2), .qd-quiz td:nth-child(3) {
  visibility: hidden;  /* avoids layout shift */
}
```

**Missing**:
1. Header cells not hidden (th elements)
2. Override rules for student interactive mode
3. Override rules for instructor mode
4. Author mode visual indicators in `f13ldman_author_mode.css`
5. Sync to `dita-demo/oxygen-webhelp/template/f13ldman.css`

## Implementation Approach

### CSS Rules to Add

**1. Complete Base Hiding** (update existing in `f13ldman.css`):
```css
/* Hide answer and detail columns in quiz tables */
.qd-quiz td:nth-child(2), .qd-quiz td:nth-child(3),
.qd-quiz th:nth-child(2), .qd-quiz th:nth-child(3) {
  visibility: hidden;
}
```

**2. Student Interactive Mode Override** (add to `f13ldman.css`):
```css
/* Student mode: reveal answer column for input controls */
.qd-quiz-interactive td:nth-child(2),
.qd-quiz-interactive th:nth-child(2) {
  visibility: visible;
}
```

**3. Instructor Mode Override** (add to `f13ldman.css`):
```css
/* Instructor mode: reveal both answer and detail columns */
.qd-quiz-instructor td:nth-child(2), .qd-quiz-instructor td:nth-child(3),
.qd-quiz-instructor th:nth-child(2), .qd-quiz-instructor th:nth-child(3) {
  visibility: visible;
}
```

**4. Author Mode Indicators** (add to `f13ldman_author_mode.css`):
```css
/* Visual indicators for hidden quiz cells (answer column) */
[outputclass~='qd-quiz'] entry:nth-child(2) {
  background-color: rgba(255, 200, 200, 0.5);  /* Light red - hidden in prod */
}

/* Visual indicators for hidden quiz cells (detail column) */
[outputclass~='qd-quiz'] entry:nth-child(3) {
  background-color: rgba(255, 200, 200, 0.5);  /* Light red - hidden in prod */
}

/* Visual indicators for interactive analysis cells */
[outputclass~='interactive'] {
  background-color: rgba(200, 255, 200, 0.5);  /* Light green - interactive */
}
```

### JavaScript Changes

**bootstrap.ts** - Add `qd-quiz-instructor` class when instructor logs in:

Check if `revealQuizAnswersForInstructor()` function already adds this class. If not, add:
```typescript
quizTables.forEach((table) => {
  table.classList.add('qd-quiz-instructor');
  // ... existing code
});
```

### Test Verification

1. Run existing tests - should pass with CSS overrides
2. Verify student inputs visible after login
3. Verify instructor sees all columns
4. Visual check in demo for no layout shift

## Complexity Tracking

No constitution violations. Simple CSS-only feature with minimal JS integration.

## Files to Modify

| File | Change |
|------|--------|
| `dita/template/f13ldman.css` | Add th hiding, student/instructor overrides |
| `dita/template/f13ldman_author_mode.css` | Add author visual indicators |
| `dita-demo/oxygen-webhelp/template/f13ldman.css` | Sync from dita/template |
| `src/init/bootstrap.ts` | Add `qd-quiz-instructor` class (if needed) |

## Risk Assessment

- **Low**: CSS changes are additive, existing JS hiding continues to work
- **Low**: `visibility: hidden` preserves layout, no shift concerns
- **Low**: Tests check class presence, CSS is transparent to them
