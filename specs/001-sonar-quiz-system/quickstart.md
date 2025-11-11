# Quickstart Guide: Sonar Quiz System

## Overview

The Sonar Quiz System enhances DITA-published HTML training documents with interactive quiz functionality, progress tracking, and instructor review capabilities—all working completely offline from local file systems.

## For Content Authors

### Setting Up Quiz Tables

1. **Create a quiz table** with exactly 3 columns:
   ```html
   <table class="qd-quiz qd-page">
     <tr>
       <td>Question text</td>
       <td>correct_answer</td>
       <td>
         <ol>
           <li>Option A</li>
           <li>Option B</li>
           <li>Option C</li>
         </ol>
       </td>
     </tr>
   </table>
   ```

2. **For numeric questions**, use tolerance in the third column:
   ```html
   <tr>
     <td>What is the frequency in Hz?</td>
     <td>24.5</td>
     <td>0.5</td>  <!-- Tolerance of ±0.5 -->
   </tr>
   ```

3. **Important rules**:
   - Maximum ONE quiz table per page
   - Use class `qd-quiz qd-page` for quiz tables
   - MCQ options must be 1-indexed (first option = 1, not 0)
   - Mix MCQ and numeric questions in the same table if needed

### Setting Up Analysis Tables

1. **Create an analysis table**:
   ```html
   <table class="qd-analysis">
     <tr>
       <td>Label (read-only)</td>
       <td class="interactive">Editable cell for student input</td>
     </tr>
   </table>
   ```

2. **Rules**:
   - Cells WITH `class="interactive"` become editable text inputs
   - Cells WITHOUT `interactive` class remain read-only/unused
   - Authors can style cells (e.g., shaded backgrounds) independently of editability
   - Maximum ONE analysis table per page

### Home Page Setup

Add the status panel placeholder and mark quiz links:

```html
<!-- Status panel (will be auto-populated) -->
<div id="qd-status"></div>

<!-- Mark navigation links for badge display -->
<a href="chapter1.html" class="qd-test-link">Chapter 1: Introduction</a>
<a href="chapter2.html" class="qd-test-link">Chapter 2: Fundamentals</a>
```

## For System Integrators

### Installation

1. **Include the script** in your DITA template footer:
   ```html
   <script src="sonar-quiz.iife.js"></script>
   ```

2. **That's it!** The system auto-initializes on page load.

### File Structure

Your published documents should follow this structure:
```
training-docs/
├── index.html           # Home page with navigation
├── sonar-quiz.iife.js   # The quiz system (single file)
├── chapter1.html        # Content with quiz tables
├── chapter2.html        # More content
└── assets/              # Any images, styles, etc.
```

### Browser Requirements

- Chrome/Edge 96+
- Firefox 102+
- JavaScript enabled
- IndexedDB support (standard in all modern browsers)
- File:// protocol access allowed

## For Students

### Getting Started

1. **Open the training document** from your DVD or local folder
2. **Log in** with your name and service ID when prompted
3. **Navigate** through the training materials
4. **Answer quiz questions** - they save automatically
5. **Track your progress** via color-coded indicators:
   - 🔴 Red = Not started
   - 🟡 Amber = In progress
   - 🟢 Green = Complete

### Tips

- Your answers save immediately - no save button needed
- You can change answers anytime before instructor review
- Progress persists between sessions
- Session timeout is 30 minutes of inactivity

## For Instructors

### Accessing Instructor Mode

1. **Navigate** to any quiz page
2. **Enter the instructor password** when prompted
3. **Instructor features** now available:
   - View correct answers
   - See all student responses
   - Export results to CSV
   - Clear all data for new cohort

### Managing Cohorts

1. **Before a new class**:
   - Export previous cohort data (CSV)
   - Use "Erase All Data" function
   - Confirm by typing "DELETE ALL"

2. **During instruction**:
   - Review student progress on Scores page
   - Identify knowledge gaps from quiz results
   - Export data for record keeping

### Data Export

The CSV export includes:
- Student names and IDs
- Questions attempted and correct
- Success percentages
- Detailed answers by page (optional)

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (requires built bundle)
npm run test:e2e

# Visual regression tests
npm run chromatic
```

### Storybook

```bash
# Start Storybook for component development
npm run storybook

# Build static Storybook
npm run build-storybook
```

## Troubleshooting

### Common Issues

**Quiz table not recognized**
- Verify class names: `qd-quiz qd-page`
- Check for typos in table structure
- Ensure only one quiz table per page

**Answers not saving**
- Check browser console for errors
- Verify IndexedDB is enabled
- Ensure sufficient storage quota

**Session timeout too quickly**
- Activity resets the 30-minute timer
- Any quiz interaction counts as activity
- Refresh page to restore session if logged in

**File:// protocol blocked**
- Chrome: Launch with `--allow-file-access-from-files`
- Firefox: Set `privacy.file_unique_origin` to false
- Edge: Similar to Chrome flags

### Getting Help

- Check browser console for detailed error messages
- Validation errors appear as red banners on the page
- Storage errors are logged with operation context
- Event names use `qd:` prefix for filtering

## Architecture Overview

### Component Layers

1. **DOM Enhancement Layer**
   - Detects and upgrades DITA tables
   - Adds interactive elements
   - Manages visual feedback

2. **Storage Layer**
   - IndexedDB for persistence
   - SessionStorage for cache
   - Atomic transactions

3. **Component Layer**
   - Lit 3 Web Components
   - Shadow DOM isolation
   - Reactive properties

4. **Service Layer**
   - Business logic
   - State management
   - Event coordination

### Data Flow

```
User Input → DOM Handler → Service Layer → Storage Adapter
                ↓                              ↓
          Visual Update             IndexedDB/SessionStorage
```

### Key Files

- `src/index.ts` - Entry point and auto-init
- `src/types/contracts.ts` - Frozen type definitions
- `src/services/storage/adapter.ts` - Storage interface
- `src/components/` - Web Components
- `src/enhancers/` - DOM upgrade logic

## Performance Guidelines

- Bundle size: <25KB gzipped
- Save operations: <200ms
- Page load: <2s with 50 questions
- Session rebuild: <500ms
- CSV export: <3s for 1000 records

## Security Notes

- All data stored locally (no network transmission)
- Instructor password stored as hash
- No personally identifiable information in logs
- File:// protocol prevents cross-origin attacks
- Data isolated by release and service ID