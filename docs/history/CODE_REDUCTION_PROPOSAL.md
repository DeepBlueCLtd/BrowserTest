# Code Reduction Proposal

**Date**: 2025-11-24
**Status**: Proposed
**Target**: ~5% code reduction (~600 LOC, 2-3 KB gzipped)

## Executive Summary

Analysis identified unused code and consolidation opportunities in the Sonar Quiz System. Current bundle: 32.89 KB gzipped (within 35 KB budget). Proposed removals are safe deletions with zero functional impact.

---

## Candidates for Removal

### 1. EncryptedSessionStorage (~310 LOC)

**Location**: `src/services/storage/encrypted-session.ts`

**Issue**: Class defined but never instantiated. Symmetric encryption for sessionStorage was designed but abandoned. The related rate-limiter is used, but the encryption wrapper is not.

**Evidence**: Zero imports outside barrel export in `index.ts`

**Risk**: None - code path unreachable

**Action**: Delete file, remove export from `index.ts`

---

### 2. Virtual List Utility (~129 LOC)

**Location**: `src/utils/virtual-list.ts`

**Issue**: Pre-optimization for rendering 100+ item lists. Current usage never exceeds ~50 items (quiz questions per page). Not imported by any component.

**Evidence**: Zero imports in codebase

**Risk**: None - never executed

**Action**: Delete file, remove export from `index.ts`

---

### 3. Error Banner Component (~165 LOC)

**Location**: `src/components/qd-error-banner.ts`

**Issue**: Full-featured error display component (severity levels, auto-dismiss, animations) that is never rendered. All error handling uses inline messages within existing components.

**Evidence**: Component defined but never instantiated in DOM

**Risk**: None - alternative error patterns already in use

**Action**: Delete file, remove export from `index.ts`

---

### 4. Storage Monitor in Production (~371 LOC)

**Location**: `src/components/qd-storage-monitor.ts`

**Issue**: Development debugging tool that ships in production bundle. Currently `DEBUG_MODE = true` is hardcoded in `src/index.ts:23`, causing dev tools to always be bundled.

**Impact**: ~8 KB minified in production bundle

**Risk**: Low - component is useful for debugging, but shouldn't ship in prod

**Action**:
- Immediate: Set `DEBUG_MODE = false` in `src/index.ts`
- Future: Build-time substitution via Vite define

---

### 5. PIN Component Duplication (~200 LOC overlap)

**Location**:
- `src/components/qd-pin-reset-dialog.ts` (440 LOC)
- `src/components/qd-pin-create.ts` (364 LOC)
- PIN logic also in `qd-login.ts`

**Issue**: Three components implement identical modal patterns without code sharing. Modal creation, styling, and event handling duplicated across files.

**Risk**: Medium - refactor required, not simple deletion

**Action**: Extract shared modal builder utility, consolidate PIN validation logic

---

## Implementation Plan

### Phase 1: Safe Deletions (Items 1-3)
**Effort**: 1 hour
**Impact**: ~604 LOC removed

```bash
rm src/services/storage/encrypted-session.ts
rm src/utils/virtual-list.ts
rm src/components/qd-error-banner.ts
```

Update `src/index.ts` to remove exports. Run full test suite.

### Phase 2: Debug Mode Fix (Item 4)
**Effort**: 30 minutes
**Impact**: Dev tools excluded from prod

Change `src/index.ts:23` from `const DEBUG_MODE = true` to `false`.

### Phase 3: PIN Consolidation (Item 5)
**Effort**: 3-4 hours
**Impact**: ~200 LOC reduction, improved maintainability

Extract modal builder. Requires careful testing of PIN create/reset flows.

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Total LOC | ~12,773 | ~11,969 |
| Bundle (gzip) | 32.89 KB | ~30-31 KB |
| Unused exports | 3 | 0 |

## Risks & Mitigations

- **Test coverage**: All deletions are dead code, but run full E2E suite to confirm
- **PIN refactor**: More invasive; defer to Phase 3 with focused testing
- **External consumers**: If ESM exports are used externally, communicate breaking changes

---

## Approval Required

- [ ] Architecture review
- [ ] Test suite passes after Phase 1
- [ ] Bundle size verification
