# BrowserTest

A browser-based quiz tool, capable of storing scores across a range of players and quiz versions. Fully client-side only, with no server/backend requirement.

## Overview

BrowserTest is an interactive quiz and analysis platform designed for offline use. It progressively enhances HTML documents with quiz functionality, student progress tracking, and instructor review capabilities—all without requiring a network connection or server backend.

**Status:** Feature-complete for the original eight-phase plan (June 2026); consolidated for restart in September 2026. See [docs/PROJECT_STATE.md](./docs/PROJECT_STATE.md) for the audit and [docs/MAINTAINERS.md](./docs/MAINTAINERS.md) for the maintainer guide.

## Key Features

- **Offline-first architecture** – All data stored locally using IndexedDB; works entirely from `file://` URLs
- **Interactive quizzes** – Support for multiple-choice questions (MCQ) and numeric answers with tolerance checking
- **Analysis tables** – Editable spreadsheet-like tables for student work with cell-level tracking
- **Instructor mode** – Password-protected answer reveal, student response tracking, and CSV export

## Technology Stack

- **Framework:** Lit 3 (Web Components)
- **Build:** Vite + TypeScript
- **Storage:** IndexedDB (primary), sessionStorage (session cache)
- **Testing:** Vitest (unit), Playwright (E2E), Storybook + Chromatic (visual regression)
- **Target:** Chromium ≥96, Firefox ≥102, offline-capable

## Prerequisites

- Node.js ≥18
- npm ≥9

## Getting Started

```bash
# Clone the repository
git clone https://github.com/DeepBlueCLtd/BrowserTest.git
cd BrowserTest

# Install dependencies
npm install

# Start development server
npm run dev

# Run Storybook for component development
npm run storybook

# Run tests
npm test

# Build for production
npm run build
```

## Demo Files

The `demo/` directory contains standalone HTML test files that demonstrate the system's functionality:

- **quiz-index.html** – Index page with login UI and navigation
- **quiz-examples.html** – Interactive quiz tables (MCQ and numeric questions)
- **analysis-examples.html** – Editable analysis tables for student work

To test the demo files:

```bash
# Build the project first
npm run build

# Option 1: Open directly in browser (file:// protocol)
open demo/quiz-index.html

# Option 2: Serve via HTTP for full functionality
python3 -m http.server 8000
# Then visit: http://localhost:8000/demo/quiz-index.html
```

See [demo/README.md](./demo/README.md) for detailed testing instructions, workflow guides, and troubleshooting tips.

## Testing

The project uses a comprehensive testing strategy across multiple layers:

### Unit Tests
```bash
npm run test:unit        # Vitest unit tests
npm run test:integration # DOM upgrade integration tests
```

### E2E Tests (Playwright)
```bash
npm run test:e2e         # Auto-starts/stops Storybook, runs E2E tests
npm run test:e2e:headed  # Run with visible browser
npm run test:e2e:debug   # Debug mode with Playwright Inspector
```

**Important**: E2E tests automatically manage Storybook lifecycle:
- Playwright starts Storybook before tests (12s timeout)
- Tests run against `http://localhost:6006` Storybook stories
- Storybook is automatically killed when tests complete
- If Storybook is already running locally, tests reuse the existing instance
- All test operations timeout after 2 seconds (local SPA, no network delays)

**No manual Storybook management required** - just run `npm run test:e2e`.

### Visual Regression Tests
```bash
npm run storybook        # Start Storybook for local development
npm run chromatic        # Run visual regression tests (requires API token)
```

### All Tests
```bash
npm test                 # Runs unit + integration tests
```

## DITA Publishing

To prepare the bundle for DITA publishing with Oxygen WebHelp:

```bash
# Build and copy to DITA template resources
npm run build:dita
```

This copies `dist/sonar-quiz.iife.js` to `dita/template/resources/` for inclusion in WebHelp output. See [dita/README.md](./dita/README.md) for DITA authoring guidelines and template customization.

## Releases

Releases are created by pushing a version tag to the main branch:

```bash
git tag v0.2.0
git push origin v0.2.0
```

See [docs/RELEASE.md](./docs/RELEASE.md) for complete release instructions.

## Project Documentation

| Document | Description |
|----------|-------------|
| [docs/RELEASE.md](./docs/RELEASE.md) | Release process and versioning guide |
| [System_Requirements.md](./System_Requirements.md) | Functional requirements, user roles, data model, and authoring rules |
| [Technical_Design.md](./Technical_Design.md) | Architecture, technology decisions, packaging, integration, and acceptance criteria |
| [ARCHITECTURE_FLOWS.md](./ARCHITECTURE_FLOWS.md) | Event flows, login processes, DOM patterns, and service interactions |
| [Contracts.md](./Contracts.md) | Core types, interfaces, events, constants, and validation rules (frozen API) |
| [docs/MAINTAINERS.md](./docs/MAINTAINERS.md) | Maintainer guide: setup, repo map, where the truth lives, known issues |
| [docs/PROJECT_STATE.md](./docs/PROJECT_STATE.md) | September 2026 consolidation audit and restart backlog |
| [docs/SECURITY.md](./docs/SECURITY.md) | What the project does for security, and its limits |
| [docs/README.md](./docs/README.md) | Index of all documentation, including archived material |

## Development Phases

The project follows an 8-phase delivery plan:

- **Phase 0:** Bootstrap + Contracts (toolchain, frozen interfaces)
- **Phase 1:** Quiz Core (interactive quizzes, no login/IDB)
- **Phase 2:** Analysis Workbook (editable tables)
- **Phase 3:** Instructor Unlock (supervisor mode)
- **Phase 4:** Login + Session Cache
- **Phase 5:** Persistent Storage + Scores
- **Phase 6:** Validation, Accessibility, Performance
- **Phase 7:** Beta Deployment & Feedback
- **Phase 8:** Security/Enhancements (optional)

All eight phases are complete. Later work (specs 001–012 under `specs/`) added security hardening, PIN authentication, help popups, storage obfuscation, release automation and a hot-spot refactor.

## Architecture

- **Runtime:** Single JavaScript bundle (IIFE ≤40 KB gzipped, enforced in CI) that progressively enhances DITA-published HTML
- **Pattern:** DOM upgrades for tables + Lit 3 custom elements for UI overlays
- **Data flow:** User actions → sessionStorage cache → IndexedDB persistence
- **Isolation:** Shadow DOM for components, scoped CSS for upgraded tables
- **Events:** Custom event system (`qd:*` namespace) for integration hooks

## License

[License information to be added]
