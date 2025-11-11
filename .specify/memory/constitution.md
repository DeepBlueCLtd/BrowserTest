<!--
Sync Impact Report
==================
Version Change: 0.0.0 → 1.0.0
Modified Principles: (New establishment)
Added Sections: All core principles and governance established
Removed Sections: None (initial creation)
Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section ready
  ✅ spec-template.md - User story structure aligned
  ✅ tasks-template.md - Test categorization matches principles
  ✅ agent-file-template.md - Generic guidance ready
Follow-up TODOs: None
-->

# BrowserTest Constitution

## Core Principles

### I. Offline-First Architecture
Every feature MUST work completely offline without any network dependencies. The system operates entirely from file:// URLs with all data stored locally in IndexedDB. No telemetry, remote config, or CDN dependencies are permitted. This ensures the application works on isolated, air-gapped systems as required for secure training environments.

### II. Progressive Enhancement
The system MUST enhance existing DITA-published HTML documents without breaking their original functionality. All interactive features are added through DOM upgrades and custom elements that gracefully degrade if JavaScript fails. Authors see zero impact to their workflow—they continue using standard DITA patterns while the runtime automatically detects and enhances recognized structures.

### III. Test-Driven Development
TDD is MANDATORY for all feature implementation. Tests MUST be written first, reviewed for correctness, confirmed to fail, then implementation follows. The Red-Green-Refactor cycle is strictly enforced. Every phase has explicit exit gates requiring test coverage: unit tests for logic, integration tests for DOM upgrades, visual regression tests via Chromatic, and E2E tests for complete workflows.

### IV. Phase-Gated Delivery
Development follows the 8-phase delivery plan with explicit exit criteria for each phase. No phase begins until the previous phase's exit gate is satisfied. Each phase delivers independently testable value: Phase 0 establishes frozen contracts, Phase 1-2 deliver core functionality without persistence, Phase 3-5 add instructor features and storage, Phase 6-8 ensure production readiness. This ensures incremental, verifiable progress.

### V. Performance Constraints
The entire runtime MUST fit within a 25KB min+gzip IIFE bundle. Components use Shadow DOM for isolation without global CSS pollution. Session operations complete within 200ms on reference hardware. This constraint ensures the system runs smoothly on older, resource-constrained training machines typical in the deployment environment.

### VI. Data Isolation & Privacy
All user data is stored locally with composite keys `qd/{release}/u{serviceId}`. No data leaves the browser. Session storage expires after 30 minutes of inactivity. Instructors can completely erase all data between cohorts. This ensures student privacy and clean separation between training sessions.

### VII. Zero Configuration Deployment
The system requires exactly one script tag in the DITA template—no configuration, no setup, no dependencies. Auto-initialization on DOMContentLoaded handles all detection and enhancement. Authors use standard DITA table patterns with optional `data-qd-*` attributes. This minimizes integration complexity and maintenance burden.

## Validation Requirements

### Author Constraints
- Maximum one `table.qd-quiz.qd-page` per page
- Maximum one `table.qd-analysis` per page
- MCQ answers use 1-indexed ordered lists
- Numeric questions specify tolerance via data attributes
- Clear error banners displayed for constraint violations

### Accessibility Standards
- WCAG 2.1 Level AA compliance required
- Keyboard navigation for all interactive elements
- ARIA live regions for dynamic status updates
- Focus management during modal operations
- Screen reader compatibility testing in each phase

## Governance

### Amendment Process
1. Proposed changes require written justification linking to user needs
2. Breaking changes require migration plan and major version bump
3. Technical debt must be documented with remediation timeline
4. Performance regressions automatically fail CI pipeline

### Compliance Verification
- All PRs must verify constitution compliance in review checklist
- Automated CI checks enforce bundle size, test coverage, and accessibility
- Phase exit gates require documented sign-off before proceeding
- Quarterly reviews assess adherence and identify improvement areas

### Version Policy
The constitution uses semantic versioning:
- MAJOR: Removing principles or breaking fundamental assumptions
- MINOR: Adding principles or substantial new requirements
- PATCH: Clarifications, examples, or non-breaking refinements

**Version**: 1.0.0 | **Ratified**: 2025-11-11 | **Last Amended**: 2025-11-11