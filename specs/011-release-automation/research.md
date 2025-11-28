# Research: Release Automation

**Feature**: 011-release-automation
**Date**: 2025-11-28

## Research Questions

### 1. GitHub Actions Release Strategy

**Decision**: Use `softprops/action-gh-release` for GitHub Release creation

**Rationale**:
- Most popular and well-maintained action for GitHub releases (17k+ stars)
- Supports automatic changelog generation from git commits
- Handles asset uploads (bundle artifacts)
- Provides tag creation and version management
- Alternative: manual `gh release create` commands would work but require more scripting

**Alternatives Considered**:
- `ncipollo/release-action`: Similar features, slightly less popular
- Manual `gh` CLI: More flexible but requires more maintenance
- `release-drafter/release-drafter`: Better for draft-based workflows, overkill here

### 2. Version Inference from Commits

**Decision**: Use simple shell script to parse conventional commits

**Rationale**:
- Project already uses conventional commit format (verified: `feat:`, `fix:` prefixes in git log)
- Shell-based parsing is lightweight and doesn't add npm dependencies
- Logic: Any `feat:` since last tag → minor bump; only `fix:` → patch; `BREAKING CHANGE:` or `!:` → major
- Falls back to patch for unrecognized prefixes

**Alternatives Considered**:
- `conventional-changelog/standard-version`: Full npm package, overkill for our needs
- `semantic-release`: Too complex, adds many dependencies
- `release-please`: Google's solution, good but heavyweight

### 3. Workflow Trigger Mechanism

**Decision**: Use `workflow_dispatch` with optional version input

**Rationale**:
- Manual trigger gives control over release timing
- Input field allows version override when automatic inference isn't desired
- No accidental releases from push events
- Matches existing workflow patterns in project

**Example**:
```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version (leave blank for auto-detect from commits)'
        required: false
        type: string
```

### 4. CI Check Enforcement

**Decision**: Run full CI suite within release workflow before creating release

**Rationale**:
- Ensures all tests pass before any release artifacts are created
- Prevents partial releases if tests fail
- Uses same jobs as ci.yml (lint, test, build) as reusable steps
- Only proceeds to release creation if all checks pass

**Implementation**:
- Release job has `needs: [lint, test, build]` dependency
- Build job uploads artifacts; release job downloads and attaches them

### 5. Artifact Handling

**Decision**: Build bundle in workflow, attach as release asset

**Rationale**:
- Uses existing `npm run build` which produces `dist/sonar-quiz.iife.js`
- Bundle is the primary deliverable for integrators
- Source code archives are automatically created by GitHub

**Assets to attach**:
- `sonar-quiz.iife.js` (main bundle)
- `sonar-quiz.iife.js.map` (source map for debugging)

### 6. Package.json Version Update

**Decision**: Update package.json version and commit during release

**Rationale**:
- Keeps package.json in sync with git tags
- Standard practice for JS projects
- Commit message: `chore(release): v{version}`
- Pushed to main branch after successful release

**Workflow sequence**:
1. Calculate new version
2. Update package.json
3. Commit version bump
4. Create git tag
5. Build with new version
6. Create GitHub Release with assets
7. Push commit and tag

### 7. Release Notes Generation

**Decision**: Auto-generate from commits using `softprops/action-gh-release` with `generate_release_notes: true`

**Rationale**:
- GitHub's built-in release notes are sufficient
- Groups commits by type automatically
- No need for CHANGELOG.md maintenance
- Can be customized via `.github/release.yml` if needed later

## No Further Clarifications Needed

All technical decisions resolved. Ready for Phase 1 artifacts.
