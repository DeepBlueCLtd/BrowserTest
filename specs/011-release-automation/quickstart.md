# Quickstart: Release Automation

## Creating a Release

### Via Git Tag (Recommended)

```bash
# 1. Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# 2. Create and push a version tag
git tag v0.1.5
git push origin v0.1.5

# 3. Watch the release workflow
# GitHub Actions automatically triggers on tag push
# Release appears at Releases page in ~3-5 minutes
```

### Via GitHub CLI

```bash
# Create and push tag in one command
gh release create v0.1.5 --generate-notes
```

**Note**: The workflow triggers automatically when you push a `vX.Y.Z` tag. No manual workflow dispatch needed.

## Version Format

Tags MUST follow semantic versioning format: `vX.Y.Z`

| Valid | Invalid |
|-------|---------|
| `v0.1.5` | `0.1.5` (missing 'v') |
| `v1.0.0` | `v1.0` (missing patch) |
| `v10.20.30` | `release-1.0.0` (wrong prefix) |

## What Gets Released

- **sonar-quiz.iife.js** - Production bundle
- **sonar-quiz.iife.js.map** - Source map
- **Source code** - Auto-generated zip/tar.gz

## Workflow Diagram

```
tag push → lint → test → build → release
                           ↓
                    artifact upload
                           ↓
                    package.json sync
```

## Troubleshooting

### Tag pushed but no release created
- Check tag format matches `vX.Y.Z` pattern
- Verify tag was pushed to origin: `git ls-remote --tags origin`
- Check Actions tab for workflow failures

### CI checks failing
Release won't be created if lint, tests, or build fail. Fix the issues on main first, delete the tag, then re-tag.

```bash
# Delete remote tag
git push --delete origin v0.1.5

# Delete local tag
git tag -d v0.1.5

# Fix issues, then re-tag
git tag v0.1.5
git push origin v0.1.5
```

### Want to re-release same version
Delete the existing release and tag first:

```bash
# Delete release via CLI
gh release delete v0.1.5

# Delete remote tag
git push --delete origin v0.1.5
```
