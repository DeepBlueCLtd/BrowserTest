# Research: CSS-Based Quiz Answer Hiding

**Branch**: `010-css-answer-hiding` | **Date**: 2025-11-28

## Summary

No significant research required. This is a straightforward CSS feature with well-understood patterns.

## Decisions

### D1: CSS Hiding Method
**Decision**: Use `visibility: hidden` (not `display: none`)
**Rationale**: Preserves table layout, prevents layout shift when columns are revealed
**Alternatives Considered**:
- `display: none` - Rejected: causes layout shift, changes table column widths
- `opacity: 0` - Rejected: element still receives clicks, less secure

### D2: CSS Override Approach
**Decision**: Use class-based specificity overrides
**Rationale**:
- `.qd-quiz-interactive` already exists for student mode
- Adding `.qd-quiz-instructor` follows same pattern
- Higher specificity selector naturally overrides base hiding

### D3: Author Mode CSS Location
**Decision**: Add to `f13ldman_author_mode.css`
**Rationale**:
- File already exists for Oxygen Author mode styling
- Separate from production CSS
- Uses `[outputclass~='...']` selectors matching DITA attributes

### D4: Header Cell Handling
**Decision**: Hide `th` cells in addition to `td` cells
**Rationale**: Column headers should also be hidden for complete security

## No Clarifications Needed

All technical decisions are straightforward based on:
- Existing CSS patterns in the codebase
- Standard CSS specificity rules
- User's explicit requirements (visibility: hidden, author mode colors)
