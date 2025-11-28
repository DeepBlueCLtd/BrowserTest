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
- Works seamlessly with tag-triggered workflows
- Alternative: manual `gh release create` commands would work but require more scripting

**Alternatives Considered**:
- `ncipollo/release-action`: Similar features, slightly less popular
- Manual `gh` CLI: More flexible but requires more maintenance
- `release-drafter/release-drafter`: Better for draft-based workflows, overkill here

### 2. Workflow Trigger Mechanism

**Decision**: Use tag push trigger with pattern matching for `v*` tags

**Rationale**:
- User preference: pushing a tag like `v0.1.5` triggers the release
- Simple and intuitive - version is explicit in the tag
- No need for version inference from commits
- Matches common open-source project patterns

**Implementation**:
```yaml
on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'
```

This pattern matches:
- `v0.1.5` ✓
- `v1.0.0` ✓
- `v10.20.30` ✓
- `v1.0` ✗ (invalid - must have 3 parts)
- `release-1.0.0` ✗ (must start with 'v')

### 3. Version Extraction from Tag

**Decision**: Extract version from `GITHUB_REF_NAME` environment variable

**Rationale**:
- GitHub Actions provides the tag name directly
- Strip leading 'v' for package.json update: `${GITHUB_REF_NAME#v}`
- No complex parsing needed

**Example**:
```bash
# Tag: v0.1.5
VERSION=${GITHUB_REF_NAME#v}  # Results in: 0.1.5
```

### 4. CI Check Enforcement

**Decision**: Run full CI suite within release workflow before creating release

**Rationale**:
- Ensures all tests pass before any release artifacts are created
- Prevents invalid releases if tests fail
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

**Decision**: Update package.json to match tag version and commit back to main

**Rationale**:
- Keeps package.json in sync with git tags (tag is source of truth)
- Standard practice for JS projects
- Commit message: `chore(release): v{version}`
- Pushed to main branch after successful release

**Workflow sequence**:
1. Tag triggers workflow
2. Run CI checks (lint, test, build)
3. Update package.json version to match tag
4. Commit version update to main
5. Create GitHub Release with assets

### 7. Release Notes Generation

**Decision**: Auto-generate from commits using `softprops/action-gh-release` with `generate_release_notes: true`

**Rationale**:
- GitHub's built-in release notes are sufficient
- Groups commits by type automatically
- No need for CHANGELOG.md maintenance
- Can be customized via `.github/release.yml` if needed later

## No Further Clarifications Needed

All technical decisions resolved. Ready for implementation.
