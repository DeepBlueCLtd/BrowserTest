# Quickstart: CSS-Based Quiz Answer Hiding

**Branch**: `010-css-answer-hiding` | **Date**: 2025-11-28

## What This Feature Does

Hides quiz answer/detail columns using CSS (loaded before JavaScript), preventing students from seeing answers by:
- Viewing page source before JS executes
- Disabling JavaScript
- Pausing page load mid-execution

## Implementation Overview

### 1. Base CSS Hiding
```css
/* In f13ldman.css */
.qd-quiz td:nth-child(2), .qd-quiz td:nth-child(3),
.qd-quiz th:nth-child(2), .qd-quiz th:nth-child(3) {
  visibility: hidden;
}
```

### 2. Student Mode Override
When student logs in, `qd-quiz-interactive` class is added to table:
```css
.qd-quiz-interactive td:nth-child(2),
.qd-quiz-interactive th:nth-child(2) {
  visibility: visible;
}
```

### 3. Instructor Mode Override
When instructor logs in, `qd-quiz-instructor` class is added to table:
```css
.qd-quiz-instructor td:nth-child(2), .qd-quiz-instructor td:nth-child(3),
.qd-quiz-instructor th:nth-child(2), .qd-quiz-instructor th:nth-child(3) {
  visibility: visible;
}
```

### 4. Author Mode Indicators
In Oxygen Author mode, colored backgrounds show which cells are hidden/interactive:
```css
/* In f13ldman_author_mode.css */
[outputclass~='qd-quiz'] entry:nth-child(2),
[outputclass~='qd-quiz'] entry:nth-child(3) {
  background-color: rgba(255, 200, 200, 0.5);  /* Light red */
}

[outputclass~='interactive'] {
  background-color: rgba(200, 255, 200, 0.5);  /* Light green */
}
```

## Testing

```bash
# Run all tests
npm test

# Run integration tests specifically
npm run test:integration

# Run E2E tests
npm run test:e2e

# Manual verification
npm run build && open demo/quiz-examples.html
```

## Files Modified

| File | Purpose |
|------|---------|
| `dita/template/f13ldman.css` | Base hiding + overrides |
| `dita/template/f13ldman_author_mode.css` | Author visual indicators |
| `dita-demo/oxygen-webhelp/template/f13ldman.css` | Demo sync |
| `src/init/bootstrap.ts` | Add instructor class |
