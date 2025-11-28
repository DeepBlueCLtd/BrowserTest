# Feature Specification: Release Automation

**Feature Branch**: `011-release-automation`
**Created**: 2025-11-28
**Status**: Draft
**Input**: GitHub Issue #88 - Release policy / mechanism

## Overview

Establish a formal release process with CI/CD automation for consistent semantic versioning (vX.Y.Z) releases. Releases are triggered by pushing a version tag (e.g., `v0.1.5`) to the main branch. Modeled after sister project (GramFrame) release documentation and workflows.

## Clarifications

### Session 2025-11-28

- Q: How should releases be triggered? → A: Tag-triggered - pushing a `vX.Y.Z` tag to main branch triggers the release workflow

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trigger a New Release (Priority: P1)

A maintainer wants to create a new versioned release of the project. They push a version tag (e.g., `v0.1.5`) to the main branch, and the system automatically builds, validates, and publishes a GitHub Release with artifacts.

**Why this priority**: Core value of the feature - automated releases reduce human error and friction.

**Independent Test**: Can be tested by pushing a `vX.Y.Z` tag to main and verifying a new GitHub Release is created with correct version and artifacts.

**Acceptance Scenarios**:

1. **Given** the main branch has commits, **When** a maintainer pushes a tag `v0.1.5`, **Then** a new GitHub Release `v0.1.5` is created
2. **Given** a release is triggered by tag, **When** the workflow completes, **Then** the release includes the built bundle artifact (sonar-quiz.iife.js)
3. **Given** a release is triggered by tag, **When** the workflow completes, **Then** the release notes summarize changes since the previous tag

---

### User Story 2 - View Release Documentation (Priority: P2)

A contributor or maintainer wants to understand the release process, versioning strategy, and how to create releases. They can find clear documentation that explains the policy.

**Why this priority**: Documentation enables self-service and reduces onboarding friction.

**Independent Test**: Can be tested by reviewing that RELEASE.md exists and contains complete instructions.

**Acceptance Scenarios**:

1. **Given** a new contributor, **When** they read RELEASE.md, **Then** they understand how versioning works
2. **Given** a maintainer, **When** they read RELEASE.md, **Then** they know how to create a release via tagging

---

### User Story 3 - Package.json Version Sync (Priority: P3)

The system keeps package.json version in sync with the git tag used for the release.

**Why this priority**: Version consistency is important but the git tag is the source of truth.

**Independent Test**: Can be tested by checking that package.json version matches the release tag after workflow completes.

**Acceptance Scenarios**:

1. **Given** a tag `v0.1.5` is pushed, **When** release workflow runs, **Then** package.json version is updated to `0.1.5`
2. **Given** package.json has version `0.1.0`, **When** tag `v0.2.0` triggers release, **Then** package.json is updated and committed

---

### Edge Cases

- What happens when tag format is invalid (not vX.Y.Z)? (Workflow ignores non-matching tags)
- What happens when CI checks fail after tag push? (Release is not created, tag remains, error reported)
- What happens when package.json update fails? (Release continues, warning issued - tag is source of truth)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a GitHub Actions workflow triggered by `vX.Y.Z` tags on main branch
- **FR-002**: System MUST generate release artifacts including the production bundle (dist/sonar-quiz.iife.js)
- **FR-003**: System MUST create GitHub Release with the same version as the pushed tag
- **FR-004**: System MUST update package.json version to match the tag version
- **FR-005**: System MUST generate release notes from commit history since previous tag
- **FR-006**: System MUST validate that all CI checks pass before creating a release
- **FR-007**: System MUST document the release process in RELEASE.md
- **FR-008**: Releases MUST include source code archives (zip, tar.gz - GitHub default)
- **FR-009**: System MUST attach the built bundle as a downloadable release asset
- **FR-010**: System MUST ignore tags that don't match the `vX.Y.Z` pattern

### Key Entities

- **Release**: A versioned snapshot with version tag, changelog, and artifacts
- **Version Tag**: Git tag in format `vX.Y.Z` that triggers the release workflow
- **Release Asset**: Built bundle file attached to GitHub Release for download

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new release is created within 5 minutes of pushing a valid version tag
- **SC-002**: 100% of releases include the production bundle artifact
- **SC-003**: Release documentation is comprehensive enough for any maintainer to create a release without external guidance
- **SC-004**: Package.json version matches git tag version after release
- **SC-005**: All releases pass CI validation before publishing

## Assumptions

- Maintainers will push tags in valid `vX.Y.Z` format
- GitHub Actions is the CI/CD platform (already in use for PR previews and pages deployment)
- The existing npm build process produces valid production bundles
- Maintainers have appropriate GitHub permissions to push tags and create releases

## Out of Scope

- NPM package publishing (project is not an npm package for distribution)
- CDN deployment (offline-first architecture)
- Automatic version inference from commits (version is explicit in tag)
- Pre-release/beta versioning (can be added later if needed)
