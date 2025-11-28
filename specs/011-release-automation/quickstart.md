# Quickstart: Release Automation

## Creating a Release

### Via GitHub UI (Recommended)

1. Go to **Actions** → **Release** workflow
2. Click **Run workflow**
3. Optional: Enter specific version (e.g., `1.2.0`) or leave blank for auto-detect
4. Click **Run workflow** button
5. Wait for workflow to complete (~3-5 minutes)
6. New release appears at **Releases** with attached bundle

### Via GitHub CLI

```bash
# Auto-detect version from commits
gh workflow run release.yml

# Specify version explicitly
gh workflow run release.yml -f version=1.2.0
```

## Version Bumping Rules

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | Minor (0.X.0) | `feat: add new quiz type` |
| `fix:` | Patch (0.0.X) | `fix: correct score calculation` |
| `BREAKING CHANGE:` | Major (X.0.0) | `feat!: change API` |
| Other | Patch | `docs: update readme` |

## What Gets Released

- **sonar-quiz.iife.js** - Production bundle
- **sonar-quiz.iife.js.map** - Source map
- **Source code** - Auto-generated zip/tar.gz

## Workflow Diagram

```
trigger → lint → test → build → version-bump → tag → release
                           ↓
                    artifact upload
```

## Troubleshooting

### "No commits since last release"
Release is blocked. Make some changes first.

### Workflow fails mid-way
No partial release created. Fix the issue and re-run.

### Want to re-release same version
Delete the tag first: `git push --delete origin v1.2.0`
