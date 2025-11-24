# Research: Code Reduction Initiative

**Date**: 2025-11-24
**Feature**: Code Reduction Initiative
**Status**: Complete

## Executive Summary

All technical context is already known for this code reduction initiative. The existing codebase uses TypeScript 5.x with Lit 3.0 web components, built with Vite 5.x. No external research required as this is purely internal code cleanup.

## Dependency Analysis

### Files to Delete (Verified Unused)

**Decision**: Delete the following files
**Rationale**: Static analysis confirms zero imports or instantiations
**Alternatives considered**: Keeping as "future use" - rejected due to bundle size constraints

1. **EncryptedSessionStorage** (`src/services/storage/encrypted-session.ts`)
   - ~310 LOC
   - Only exported from barrel, never imported
   - Symmetric encryption wrapper abandoned in favor of simpler approach

2. **Virtual List Utility** (`src/utils/virtual-list.ts`)
   - ~129 LOC
   - Pre-optimization for large lists never needed
   - Current max is ~50 quiz items per page

3. **Error Banner Component** (`src/components/qd-error-banner.ts`)
   - ~165 LOC
   - Never instantiated in DOM
   - All errors use inline messages within existing components

### Debug Mode Configuration

**Decision**: Set DEBUG_MODE to false
**Rationale**: Currently hardcoded to true, shipping debug tools in production
**Alternatives considered**:
- Build-time substitution via Vite define - deferred to future enhancement
- Environment variable - requires configuration complexity

### PIN Component Consolidation

**Decision**: Extract shared modal builder utility
**Rationale**: ~200 LOC duplication across three components
**Alternatives considered**:
- Leave as-is - rejected due to maintenance burden
- Full component inheritance - over-engineering for simple modal pattern

## Bundle Impact Analysis

### Current State
- Bundle size: 32.89 KB gzipped
- Total LOC: ~12,773

### Expected After Changes
- Bundle size: ~30-31 KB gzipped (2-3KB reduction)
- Total LOC: ~11,969 (-804 LOC)
- Breakdown:
  - Deletions: -604 LOC
  - Modal extraction: ~+100 LOC new utility, -300 LOC from components = -200 LOC net

### Risk Assessment

**ESM Export Compatibility**
- Risk: External consumers might import deleted exports
- Mitigation: Document in changelog, semantic version bump

**Debug Tool Accessibility**
- Risk: Support team loses debug capability
- Mitigation: Document how to temporarily enable for troubleshooting

**Modal Behavior Consistency**
- Risk: Subtle differences after consolidation
- Mitigation: Comprehensive E2E testing of all three PIN flows

## Implementation Order

1. **Phase 1**: Safe deletions (lowest risk)
   - Delete three unused files
   - Remove exports from index.ts
   - Run full test suite

2. **Phase 2**: Debug mode fix (quick win)
   - Change DEBUG_MODE constant
   - Verify storage monitor excluded from production bundle

3. **Phase 3**: PIN consolidation (highest complexity)
   - Extract modal builder first
   - Refactor one component at a time
   - Test each component individually

## Validation Strategy

### Static Analysis
- TypeScript compilation must succeed
- No unresolved imports
- Bundle analyzer to verify size reduction

### Dynamic Testing
- Full unit test suite (all must pass)
- Integration tests for DOM upgrades
- E2E tests for all user flows
- Manual testing of PIN flows

### Rollback Plan
- Git revert if issues discovered
- Feature branch allows safe experimentation
- Each phase independently revertible

## Conclusions

All technical decisions are straightforward with minimal risk. The code identified for removal is verifiably unused. The consolidation opportunity is clear with measurable benefits. No external dependencies or clarifications needed - ready to proceed with implementation.