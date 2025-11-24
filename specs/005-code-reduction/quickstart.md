# Quick Start: Code Reduction Implementation

## Overview

This guide walks through implementing the code reduction initiative to remove ~600 LOC and reduce bundle size by 2-3KB.

## Prerequisites

- All tests passing: `npm test`
- Clean git status: `git status`
- On feature branch: `git checkout 005-code-reduction`

## Phase 1: Remove Unused Code (1 hour)

### Step 1: Delete Unused Files

```bash
# Remove the three identified unused files
rm src/services/storage/encrypted-session.ts
rm src/utils/virtual-list.ts
rm src/components/qd-error-banner.ts
```

### Step 2: Update Barrel Export

Edit `src/index.ts`:
1. Remove export for `EncryptedSessionStorage`
2. Remove export for `virtual-list` utility
3. Remove export for `qd-error-banner` component

### Step 3: Verify TypeScript Compilation

```bash
npm run typecheck
```

Expected: No errors

### Step 4: Run Tests

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

Expected: All tests pass

### Step 5: Check Bundle Size

```bash
npm run build
npm run size-check
```

Expected: Bundle size reduced by ~1-1.5KB

## Phase 2: Fix Debug Mode (30 minutes)

### Step 1: Update Debug Flag

Edit `src/index.ts` line 23:
```typescript
// Change from:
const DEBUG_MODE = true;

// To:
const DEBUG_MODE = false;
```

### Step 2: Build and Verify

```bash
npm run build
```

Check that `qd-storage-monitor` is not included in the production bundle:
```bash
grep -c "qd-storage-monitor" dist/sonar-quiz.iife.js
```

Expected: 0 (component excluded)

### Step 3: Test Debug Shortcut

1. Open `demo/quiz-index.html` in browser
2. Press `Ctrl+Shift+D`
3. Verify no debug panel appears

## Phase 3: Consolidate PIN Components (3-4 hours)

### Step 1: Create Modal Builder Utility

Create `src/utils/modal-builder.ts`:
```typescript
// Extract common modal creation logic from:
// - qd-pin-create.ts
// - qd-pin-reset-dialog.ts
// - qd-login.ts (instructor modal)
```

### Step 2: Refactor PIN Create Component

Update `src/components/qd-pin-create.ts`:
- Import modal builder utility
- Replace duplicated modal logic with utility calls
- Keep PIN-specific validation logic

### Step 3: Refactor PIN Reset Component

Update `src/components/qd-pin-reset-dialog.ts`:
- Import modal builder utility
- Replace duplicated modal logic
- Maintain reset-specific behavior

### Step 4: Refactor Login Component

Update `src/components/qd-login.ts`:
- Use modal builder for instructor password modal
- Remove duplicated modal creation code

### Step 5: Test All PIN Flows

```bash
# Run PIN-specific tests
npm run test:unit -- pin
npm run test:e2e -- pin
```

Manual testing:
1. Test PIN creation flow
2. Test PIN reset flow
3. Test instructor login modal

## Verification Checklist

- [ ] All TypeScript compilation succeeds
- [ ] All tests pass (unit, integration, E2E)
- [ ] Bundle size reduced to ~30-31KB
- [ ] No debug tools in production build
- [ ] All PIN flows work identically
- [ ] No console errors in browser

## Rollback Instructions

If issues occur at any phase:

```bash
# Revert to last known good state
git reset --hard HEAD

# Or revert specific files
git checkout -- src/index.ts
git checkout -- src/components/
```

## Commit Strategy

Commit after each successful phase:

```bash
# After Phase 1
git add -A
git commit -m "feat(cleanup): remove unused components and utilities

- Delete EncryptedSessionStorage (~310 LOC)
- Delete virtual-list utility (~129 LOC)
- Delete qd-error-banner component (~165 LOC)
- Update barrel exports"

# After Phase 2
git add src/index.ts
git commit -m "fix(debug): exclude storage monitor from production builds

- Set DEBUG_MODE=false for production
- Reduces bundle by ~8KB minified"

# After Phase 3
git add src/utils/modal-builder.ts src/components/
git commit -m "refactor(modals): consolidate duplicated PIN modal logic

- Extract shared modal builder utility
- Refactor three PIN components to use shared logic
- Reduces duplication by ~200 LOC"
```

## Success Metrics

✅ Phase 1 Complete:
- 3 files deleted
- ~604 LOC removed
- TypeScript compiles
- All tests pass

✅ Phase 2 Complete:
- DEBUG_MODE = false
- Storage monitor excluded
- Additional size reduction

✅ Phase 3 Complete:
- Modal utility created
- 3 components refactored
- ~200 LOC net reduction
- Identical functionality

**Final Target**:
- Bundle: 30-31KB (from 32.89KB)
- Total LOC: ~11,969 (from ~12,773)
- Zero functional regressions