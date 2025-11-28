# Tasks: Release Automation

**Input**: Design documents from `/specs/011-release-automation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: Not applicable - CI/CD infrastructure is validated through tag push and release verification

**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup required - project already has GitHub Actions infrastructure

- [ ] T001 Verify existing CI workflow structure in .github/workflows/ci.yml

**Checkpoint**: Existing infrastructure confirmed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational work needed - this feature adds new workflow, doesn't modify existing

**⚠️ Note**: This feature is additive - no blocking prerequisites

**Checkpoint**: Ready to begin user stories

---

## Phase 3: User Story 1 - Trigger a New Release (Priority: P1) 🎯 MVP

**Goal**: Pushing a `vX.Y.Z` tag to main triggers workflow that creates GitHub Release with bundle artifacts

**Independent Test**: Push tag `v0.1.5` to main, verify GitHub Release created with correct version and attached sonar-quiz.iife.js

### Implementation for User Story 1

- [ ] T002 [US1] Create release workflow file with tag push trigger (v[0-9]+.[0-9]+.[0-9]+) in .github/workflows/release.yml
- [ ] T003 [US1] Add CI validation jobs (lint, test, build) reusing patterns from ci.yml in .github/workflows/release.yml
- [ ] T004 [US1] Add version extraction step from GITHUB_REF_NAME in .github/workflows/release.yml
- [ ] T005 [US1] Add GitHub Release creation using softprops/action-gh-release in .github/workflows/release.yml
- [ ] T006 [US1] Configure release notes auto-generation from commits in .github/workflows/release.yml
- [ ] T007 [US1] Configure artifact upload (sonar-quiz.iife.js, source map) as release assets in .github/workflows/release.yml
- [ ] T008 [US1] Add permissions block for contents:write in .github/workflows/release.yml

**Checkpoint**: Release workflow functional - tag push creates release with artifacts

---

## Phase 4: User Story 2 - View Release Documentation (Priority: P2)

**Goal**: Contributors can find clear documentation explaining release process via tagging

**Independent Test**: Read docs/RELEASE.md and verify it contains complete tagging instructions

### Implementation for User Story 2

- [ ] T009 [P] [US2] Create RELEASE.md with overview section explaining semantic versioning in docs/RELEASE.md
- [ ] T010 [P] [US2] Add "How to Create a Release" section with git tag commands in docs/RELEASE.md
- [ ] T011 [US2] Add version format requirements (vX.Y.Z pattern) in docs/RELEASE.md
- [ ] T012 [US2] Add troubleshooting section for common issues in docs/RELEASE.md

**Checkpoint**: Documentation complete - any maintainer can self-service release process

---

## Phase 5: User Story 3 - Package.json Version Sync (Priority: P3)

**Goal**: Package.json version is updated to match the git tag after release

**Independent Test**: Push tag v0.2.0, verify package.json version updated to 0.2.0 on main branch

### Implementation for User Story 3

- [ ] T013 [US3] Add package.json version update step extracting version from tag in .github/workflows/release.yml
- [ ] T014 [US3] Add git commit for version update with message "chore(release): vX.Y.Z" in .github/workflows/release.yml
- [ ] T015 [US3] Add git push to main branch for version commit in .github/workflows/release.yml
- [ ] T016 [US3] Handle edge case: skip version commit if package.json already matches tag in .github/workflows/release.yml

**Checkpoint**: Package.json stays in sync with release tags

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases and final validation

- [ ] T017 Update README.md with release process reference and link to docs/RELEASE.md
- [ ] T018 Test by pushing test tag on feature branch to validate workflow syntax before merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Verification only - no changes
- **Foundational (Phase 2)**: N/A - additive feature
- **User Story 1 (Phase 3)**: Core workflow - MVP
- **User Story 2 (Phase 4)**: Documentation - independent of US1
- **User Story 3 (Phase 5)**: Enhances US1 - depends on workflow existing
- **Polish (Phase 6)**: Depends on US1 complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - can start immediately
- **User Story 2 (P2)**: No dependencies - can start in parallel with US1
- **User Story 3 (P3)**: Depends on US1 (workflow must exist to add version sync)

### Parallel Opportunities

- US1 and US2 can be implemented in parallel (different files)
- T009 and T010 within US2 can run in parallel

---

## Parallel Example: User Stories 1 & 2

```bash
# These can run simultaneously:
Agent A: "Create release workflow in .github/workflows/release.yml" (US1)
Agent B: "Create RELEASE.md documentation in docs/RELEASE.md" (US2)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 (verify existing)
2. Complete T002-T008 (core workflow)
3. **STOP and VALIDATE**: Push test tag, verify release created
4. Merge and test on main branch

### Incremental Delivery

1. US1 → Working tag-triggered releases
2. US2 → Documentation for team self-service
3. US3 → Package.json version sync

### Suggested Execution Order

Single developer:
1. T001 → T002-T008 (MVP workflow)
2. T009-T012 (documentation in parallel-friendly commits)
3. T013-T016 (version sync)
4. T017-T018 (polish)

---

## Notes

- All workflow tasks in US1 affect same file - execute sequentially
- Documentation tasks (US2) can be committed independently
- Test by pushing tag after workflow is merged to main
- No unit tests - infrastructure validated through actual tag push
