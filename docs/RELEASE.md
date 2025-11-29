# Release Process

This document describes how to create releases for the BrowserTest (Sonar Quiz System) project.

## Overview

Releases are automated via GitHub Actions. When you push a version tag to the main branch, a workflow automatically:

1. Runs all CI checks (lint, tests, build)
2. Builds the production bundle
3. Creates a GitHub Release with release notes
4. Attaches the bundle artifacts

## Versioning

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** (`X.0.0`): Breaking changes
- **MINOR** (`0.X.0`): New features (backward-compatible)
- **PATCH** (`0.0.X`): Bug fixes (backward-compatible)

## How to Create a Release

### Prerequisites

- You must have push access to the repository
- The main branch must be in a passing CI state

### Steps

1. **Ensure you're on the latest main branch:**

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create and push a version tag:**

   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```

3. **Monitor the release workflow:**
   - Go to the [Actions tab](../../actions)
   - Watch the "Release" workflow complete (~3-5 minutes)

4. **Verify the release:**
   - Go to the [Releases page](../../releases)
   - Confirm the new release exists with:
     - Correct version number
     - Auto-generated release notes
     - Attached `sonar-quiz.iife.js` bundle
     - Attached `sonar-quiz.iife.js.map` source map

### Using GitHub CLI

```bash
# Create tag and release in one command
gh release create v0.2.0 --generate-notes
```

## Version Tag Format

Tags **must** follow semantic versioning format: `vX.Y.Z`

| Valid Tags | Invalid Tags |
|------------|--------------|
| `v0.1.0` | `0.1.0` (missing 'v' prefix) |
| `v1.0.0` | `v1.0` (missing patch number) |
| `v10.20.30` | `release-1.0.0` (wrong prefix) |
| `v2.0.0-beta.1` | N/A (pre-release not currently supported) |

## What's Included in a Release

Each release includes:

- **sonar-quiz.iife.js** - The production bundle (IIFE format)
- **sonar-quiz.iife.js.map** - Source map for debugging
- **Source code** - Automatically generated zip and tar.gz archives

## Troubleshooting

### Tag pushed but no release created

1. **Check tag format** - Must match `vX.Y.Z` pattern exactly
2. **Verify tag was pushed:**
   ```bash
   git ls-remote --tags origin | grep v0.2.0
   ```
3. **Check Actions tab** - Look for workflow failures
4. **Review CI status** - Release won't be created if lint/tests/build fail

### CI checks failing after tag push

The release workflow runs the full CI suite. If it fails:

1. Fix the issues on main branch
2. Delete the failed tag:
   ```bash
   git push --delete origin v0.2.0
   git tag -d v0.2.0
   ```
3. Create the tag again after fixes are merged

### Re-releasing the same version

If you need to re-release (e.g., release was incomplete):

```bash
# Delete the existing release
gh release delete v0.2.0 --yes

# Delete the remote tag
git push --delete origin v0.2.0

# Delete local tag
git tag -d v0.2.0

# Create new tag and push
git tag v0.2.0
git push origin v0.2.0
```

### Package.json version mismatch

The release workflow automatically updates `package.json` to match the tag version. If there's a mismatch, the tag version is the source of truth.

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Development guidelines and project architecture
- [README.md](../README.md) - Project overview and quick start
