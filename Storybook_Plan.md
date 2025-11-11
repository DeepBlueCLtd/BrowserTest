# STORYBOOK_PLAN.md

## 1. Purpose
Define and standardize Storybook stories for Sonar Training Document components.  
Goals:
- Enable visual and interaction review in Chromatic before runtime integration.
- Provide fixtures and controls for testing UI states.
- Drive test coverage via Storybook interactions.

---

## 2. Story Groups

### QuizPage
**Stories:** `SmallSet`, `LargeSet`, `MixedNumeric`, `Dynamic`

**Controls**
- `loggedIn:boolean`
- `instructor:boolean`
- `showAllResponses:boolean`
- `release:string`
- `serviceId:string`
- `slug:UserReleaseRecord` (mock data source)
- `applied:boolean` (for Dynamic only)

**Behavior**
- Simulates quiz table conversion and state changes.
- Supervisor mode reveals answers and student overlays.
- `Dynamic` story starts with raw author HTML table and applies enhancement on toggle.

---

### StatusPanel
**Stories:** `Unstarted`, `Incomplete`, `Complete`  
**Args:** `answered`, `total`, `correct`, `last`  
**Purpose:** Baseline visual for R/A/G state indicator.

---

### InstructorToolbar
**Stories:** `Locked`, `Unlocked`, `EraseConfirm`  
**Controls:** `unlocked:boolean`, `hasData:boolean`  
**Events:** emits `qd:unlock`, `qd:erase`.

---

### LoginPanel
**Stories:** `Default`, `ValidationError`, `Prefilled`  
**Controls:** `prefillName`, `prefillServiceId`  
**Tests:** verifies emission of `qd:login`.

---

### AnalysisWorkbook
**Stories:** `BlankSheet`, `FewEntries`, `DenseEntries`, `Dynamic`

**Controls**
- `loggedIn:boolean`
- `instructor:boolean`
- `sheetSlug:{ tableId, cells, entries[] }`
- `cellSize:'compact'|'comfortable'`
- `maxCols:number`
- `applied:boolean` (for Dynamic only)

**Behavior**
- Editable analysis sheet transformation.
- Supervisor mode reveals instructor overlays.
- `Dynamic` story demonstrates live upgrade of author HTML table into interactive sheet.

---

## 3. Dynamic Stories — Deferred Processing

### QuizPage/Dynamic
**Purpose**
Show unmodified HTML table, then let reviewers toggle enhancement.

**Controls**
| Arg | Type | Description |
|------|------|-------------|
| `applied` | boolean | Whether the upgrade is active (`true`) or reset (`false`). |
| `instructor` | boolean | Instructor view toggle. |
| `showAllResponses` | boolean | Show all student responses. |
| `slug` | object | Mock `UserReleaseRecord` content for page. |

**Behavior**
- Starts with raw table markup.
- When `applied` = true → run upgrade (`applyQuizEnhancement()`).
- When `applied` = false → restore original DOM.
- Supervisor toggle still functions.

**Testing Goals**
- Visual diff raw vs. enhanced.
- Apply/unapply cycles deterministic and stable.

### AnalysisWorkbook/Dynamic
**Purpose**
Demonstrate transformation of plain table to editable workbook.

**Controls**
| Arg | Type | Description |
|------|------|-------------|
| `applied` | boolean | Whether cell enhancement is active. |
| `instructor` | boolean | Show instructor overlays. |
| `sheetSlug` | object | Mock data for cell values and entries. |

**Behavior**
- Starts unprocessed.
- `applied` = true → add input fields to editable cells.
- Toggle off → revert to author markup.
- Supervisor on → adds per-cell overlays.

**Testing Goals**
- Correctly ignores shaded cells.
- No listener duplication.
- Visual comparison author vs. enhanced.

---

## 4. Common Controls and Fixtures

| Control | Description |
|----------|-------------|
| `loggedIn` | Simulates active session; toggles login states. |
| `instructor` | Enables instructor mode for answer display. |
| `showAllResponses` | Displays compact table of student responses. |
| `slug` | Static mock equivalent to `UserReleaseRecord`. |
| `sheetSlug` | Mock for analysis sheet state. |

All mock data deterministic for stable Chromatic screenshots.

---

## 5. Mock Adapters

- **InMemoryAdapter:** Implements `StorageAdapter`, holds mock `UserReleaseRecord` in memory.
- Used by all stories instead of IndexedDB.
- Returns consistent fixtures for each build.

---

## 6. Visual Regression Policy

| Component | Threshold | Notes |
|------------|------------|------|
| `<qd-status>` | 0% | Strict |
| `<qd-login>` | 0% | Strict |
| `<qd-quiz-row>` | 0% | Strict |
| `<qd-quiz-page>` | ≤0.2% | Moderate |
| `<qd-instructor-toolbar>` | ≤0.2% | Moderate |
| `<qd-analysis-workbook>` | ≤0.5% | Tolerant |

- Fixed viewport (800×600), system font only.
- Light theme baseline first.

---

## 7. Accessibility Checks
- Global a11y addon enabled.
- Tests for label association, focus order, contrast.
- `<qd-status>` uses `aria-live` to announce updates.

---

## 8. Interaction Tests
- Use `@storybook/test` + `play` functions.
- Verify:
  - Selecting answers updates status.
  - Supervisor toggle reveals correct panels.
  - Login emits correct event payloads.
  - Analysis cell edits update value.
  - Erase confirm modal appears.
  - Dynamic stories toggle upgrade cleanly.

---

## 9. CI Integration
- Build Storybook via `npm run build-storybook`.
- Chromatic Action runs on PR + `main` push.
- Required GitHub check: *UI regression & interaction tests must pass*.
- Preview links automatically posted to PRs.

---

## 10. Reviewer Guidance
Each PR must include:
- Link to Chromatic build.
- Which stories changed.
- Expected behavior checklist (instructor toggle, Dynamic test, etc.).
- Reference screenshots for visual deltas.
