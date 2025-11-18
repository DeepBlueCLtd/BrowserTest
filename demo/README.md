# Sonar Quiz System - Demo HTML Files

This directory contains standalone HTML test files that load and test the built Sonar Quiz System artifacts from the `dist` folder.

## Files Overview

### 1. `quiz-index.html` - Quiz Index/Homepage
**Purpose**: Demonstrates the quiz index page with login UI and navigation
**Features**:
- Login panel (`qd-login` component) for student authentication
- Status panel (`qd-status` component) showing progress
- Navigation links with R/A/G (Red/Amber/Green) status badges
- Links to quiz and analysis pages
- **Publication title element** (`.wh_publication_title .title`) - **REQUIRED** for Release ID extraction

**What it tests**:
- Login component rendering and interaction
- Status panel injection into `#qd-status` div
- Home badge initialization for navigation links
- Event system (`qd:login`, `qd:state-changed`)
- Session management and storage

### 2. `quiz-examples.html` - Quiz Tables
**Purpose**: Demonstrates interactive quiz tables with MCQ and numeric questions
**Features**:
- Mixed MCQ and numeric question tables
- MCQ-only table examples
- Numeric-only table examples
- Proper `qd-quiz` class markup
- Authoring guidelines

**What it tests**:
- Quiz table detection and parsing
- Table enhancement with interactive controls
- Answer validation (MCQ 1-indexed, numeric with tolerance)
- Answer storage in IndexedDB
- `qd:answer-saved` events
- State calculation (unstarted → incomplete → complete)

### 3. `analysis-examples.html` - Analysis Tables
**Purpose**: Demonstrates editable analysis tables for free-form student input
**Features**:
- Various analysis table layouts
- Interactive vs read-only cells
- Mixed pre-filled and editable content
- Proper `qd-analysis` class and `interactive` class markup
- Authoring guidelines

**What it tests**:
- Analysis table detection and parsing
- Cell-level editability based on `interactive` class
- Cell key generation (R{row}C{col}#f:{hash})
- Auto-save functionality
- 500 character cell limit
- Storage persistence

## How to Test

### Prerequisites
1. Build the project to generate the dist bundle:
   ```bash
   npm run build
   ```
   This creates `dist/sonar-quiz.iife.js` and `dist/sonar-quiz.esm.js`

### Testing in Browser

#### Option 1: Local File Protocol (Recommended for offline testing)
1. Open the HTML files directly in your browser using `file://` protocol:
   ```bash
   # On Linux/Mac
   open demo/quiz-index.html

   # Or manually navigate to:
   # file:///path/to/BrowserTest/demo/quiz-index.html
   ```

2. **Note**: IndexedDB may have restrictions in `file://` protocol depending on browser:
   - **Chrome/Edge**: Works with `--allow-file-access-from-files` flag
   - **Firefox**: Works by default
   - **Safari**: Works with "Disable Local File Restrictions" in Develop menu

#### Option 2: HTTP Server (Recommended for full functionality)
Serve the files over HTTP to test with full browser features:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Using Vite preview (from project root)
npm run preview
```

Then navigate to:
- http://localhost:8000/demo/quiz-index.html
- http://localhost:8000/demo/quiz-examples.html
- http://localhost:8000/demo/analysis-examples.html

### Test Workflow

#### Test 1: Index Page & Login
1. Open `quiz-index.html`
2. Verify login component appears
3. Enter service ID (e.g., "RN2344") and name
4. Click "Login"
5. Verify status panel updates to show progress

**Expected Results**:
- Login form renders correctly
- Validation works (alphanumeric service ID, 2-10 chars)
- `qd:login` event fires
- Session stored in sessionStorage
- Status panel shows "Your Progress"
- Console shows debug logs (data-debug="true")

#### Test 2: Quiz Tables & Questions
1. From index, click "Sonar Basics" → `quiz-examples.html`
2. Verify quiz tables are enhanced with interactive controls
3. Answer some MCQ questions (select options)
4. Answer some numeric questions (enter values)
5. Check console for `qd:answer-saved` events
6. Verify answers persist on page reload

**Expected Results**:
- Tables enhanced with input controls
- MCQ: 1-indexed selection (1 = first option)
- Numeric: Tolerance validation
- Answers saved to IndexedDB
- State changes from unstarted → incomplete
- Page state badge updates on index

#### Test 3: Analysis Tables
1. From index, click "Contact Analysis" → `analysis-examples.html`
2. Verify cells with `class="interactive"` are editable
3. Enter text in editable cells
4. Verify read-only cells cannot be edited
5. Check auto-save (debounced ~200ms)
6. Reload page and verify data persists

**Expected Results**:
- Only `interactive` cells are editable
- Text inputs render in editable cells
- Auto-save triggers after typing stops
- Cell keys generated correctly (R{row}C{col}#f:{hash})
- Data persists in storage
- 500 character limit enforced

#### Test 4: Session Management
1. Login on index page
2. Navigate to quiz/analysis pages
3. Answer questions
4. Wait for session timeout (30 min) OR manually clear sessionStorage
5. Verify auto-logout behavior

**Expected Results**:
- Session persists across page navigation
- `lastActivity` timestamp updates
- Session expires after 30 min inactivity
- `qd:logout` event fires on expiry
- User redirected to login

#### Test 5: R/A/G Badges (Home Page)
1. Login and answer some questions
2. Return to index page
3. Verify badge colors update:
   - Red: Unstarted (no answers)
   - Amber: Incomplete (some answered OR any incorrect)
   - Green: Complete (all answered AND all correct)

**Expected Results**:
- Badges render next to navigation links
- Colors match page completion state
- States calculate correctly
- Cache updates propagate to badges

### Debug Mode

All HTML files have `data-debug="true"` attribute on the script tag:
```html
<script src="../dist/sonar-quiz.iife.js" data-sonar-quiz data-debug="true"></script>
```

This enables:
- Console logging of all events
- Initialization messages
- State transition logs
- Validation error banners (if any)

To disable debug mode, remove the attribute:
```html
<script src="../dist/sonar-quiz.iife.js" data-sonar-quiz></script>
```

## Browser DevTools Inspection

### Check Storage
1. Open DevTools → Application/Storage tab
2. **IndexedDB**: Look for `qd/{release}/u{serviceId}` keys
   - Should contain `StudentRecord` with answers and page data
3. **sessionStorage**: Look for `qd/session` and `qd/state` keys
   - `qd/session`: Current session data
   - `qd/state`: Session cache (totals, page states)

### Check Events
1. Open DevTools → Console
2. Monitor for custom events:
   - `qd:init` - System initialized
   - `qd:login` - User logged in
   - `qd:logout` - User logged out
   - `qd:answer-saved` - Answer persisted
   - `qd:state-changed` - Page state updated

### Check Network
Since the system is offline-first:
- **No network requests** should occur during normal operation
- All data stays local (IndexedDB/sessionStorage)
- No telemetry, CDN, or remote config calls

## File Structure

```
demo/
├── README.md                    # This file
├── quiz-index.html              # NEW: Index page with login & navigation
├── quiz-examples.html           # UPDATED: Loads dist bundle
├── analysis-examples.html       # UPDATED: Loads dist bundle
└── (other files...)

dist/                            # Generated by npm run build
├── sonar-quiz.iife.js          # IIFE bundle (auto-init)
├── sonar-quiz.iife.js.map      # Source map
├── sonar-quiz.esm.js           # ESM bundle
├── sonar-quiz.esm.js.map       # Source map
└── index.d.ts                  # TypeScript definitions
```

## Troubleshooting

### Issue: Quiz tables not enhancing
**Check**:
- Table has `class="qd-quiz"` or `class="qd-analysis"`
- Script loaded (check console for errors)
- No JavaScript errors blocking initialization

### Issue: Login component not appearing
**Check**:
- Index page has `<div id="qd-status"></div>`
- Or system will inject before `<main>` or first child of `<body>`
- Custom elements registered (check `customElements.get('qd-login')`)

### Issue: Answers not saving
**Check**:
- Browser supports IndexedDB
- No storage quota exceeded
- Console for save errors
- Network tab shows no blocking requests

### Issue: Session not persisting
**Check**:
- sessionStorage enabled in browser
- Not in private/incognito mode (sessionStorage cleared on close)
- Session timeout not exceeded (30 min)

### Issue: Badges not updating
**Check**:
- Links have `class="qd-test-link"`
- `data-page-id` attribute matches page IDs in storage
- Cache being updated on answer save
- Console for `qd:state-changed` events

## CI/CD Integration

These HTML files can be used for:
1. **Manual Testing**: Open in browser to verify functionality
2. **E2E Testing**: Playwright/Puppeteer can automate interactions
3. **Visual Regression**: Chromatic snapshots
4. **Bundle Size Verification**: Check `dist/sonar-quiz.iife.js` size
5. **Smoke Tests**: Verify bundle loads without errors

## Notes

- **Offline-first**: No network dependencies, works from `file://` URLs
- **Progressive Enhancement**: Works without JavaScript (shows static tables)
- **Zero Configuration**: Single `<script>` tag, auto-initializes
- **Bundle Size**: IIFE bundle must be ≤25KB min+gzip
- **Browser Support**: Chrome/Edge ≥96, Firefox ≥102
- **Accessibility**: WCAG 2.1 Level AA compliant

## Related Documentation

- `/home/user/BrowserTest/CLAUDE.md` - Project overview and architecture
- `/home/user/BrowserTest/specs/001-sonar-quiz-system/spec.md` - Full feature spec
- `/home/user/BrowserTest/docs/System_Requirements.md` - Functional requirements
- `/home/user/BrowserTest/docs/Technical_Design.md` - Technical architecture
