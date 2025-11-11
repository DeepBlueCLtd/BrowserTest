# Sonar Training Document System Requirements Document (SRD)

## 1. Overview
This system extends the DITA-published HTML training materials for sonar operators with **interactive self-test** and **analysis capture** capabilities.  
It runs **offline**, directly from a DVD or local file system, and does not require a network or server backend.

Documents are published quarterly and used by individual students. Instructors can review results, reveal correct answers, and reset data between cohorts.

---

## 2. Environment

| Component | Technology |
|------------|-------------|
| Authoring | Oxygen XML Editor (DITA) |
| Publication | Responsive HTML via Oxygen DITA publishing |
| Runtime | Browser-based JavaScript enhancement |
| Data Storage | IndexedDB (primary), sessionStorage (cache and session state) |
| Offline | 100% standalone — no server dependencies |

---

## 3. Key User Roles

### 3.1 Student
- Opens published document on local machine.
- Logs in with **name** and **service ID**.
- Works through instructional pages.
- Answers quiz questions and fills in analysis tables.
- Progress and answers persist locally between sessions.

### 3.2 Instructor
- Enters unlock password to reveal answers.
- Optionally views each student’s submitted answers for current page.
- Can export quiz results as CSV.
- Can **erase all stored data** (for new class).
- No central login or network identity.

---

## 4. Functional Requirements

### 4.1 Login and Session
- On first access, prompt for *Name* and *Service ID*.
- Session stored in `sessionStorage` for 30 minutes of inactivity.
- All user data stored by composite key:  
  `qd/{release}/u{serviceId}`.
- On logout or expiry, both session data and cached page state are cleared.
- Next session rebuilds cache from IndexedDB after login.

### 4.2 Quiz Tables
- Each page may contain one table: `table.qd-quiz.qd-page`.
- Columns (strict order):  
  1. **Question text**  
  2. **Answer** (number or MCQ index)  
  3. **Detail** (`<ol>` of choices for MCQ or numeric tolerance)
- MCQ answers use a **1-indexed ordered list** (`<ol>`).
- Numeric questions use tolerance in same row (single number).
- Mixed MCQ and numeric rows permitted.
- One quiz table per page. Validation errors are displayed clearly to authors at runtime.

### 4.3 Quiz Presentation
- MCQs rendered as `<select>` dropdowns.
- Numeric questions rendered as `<input type="number">`.
- Page results saved immediately on input change.
- Correctness calculated locally and displayed with minimal icons.
- Instructor can unlock answers via password.

### 4.4 Quiz Page Status Panel
- A floating panel (`id="qd-status"`) summarizes page state:
  - **Unstarted** – red
  - **Incomplete** – amber
  - **Complete** – green
- Shows counts and last attempt time.
- Updated live after each answer save.

### 4.5 Page Status (R/A/G)
- Derived per page:
  - `unstarted` → no answers  
  - `incomplete` → some answered or any incorrect  
  - `complete` → all answered correctly
- Stored in `sessionStorage` during active user session only.  
  Cleared when session ends or user logs out.

### 4.6 Home Page Badges
- Each button link with `class="qd-test-link"` receives R/A/G badge based on cached state.
- Cache rebuilt automatically after quiz updates or on session reset.

---

## 5. Data Model

### 5.1 Storage Record (IndexedDB)
```json
{
  "schema": 3,
  "docId": "core-acs",
  "release": "02-2025",
  "serviceId": "RN2344",
  "name": "Smith, J",
  "attempted": 5,
  "correct": 4,
  "updated": "2025-11-10T14:27:00Z",
  "pages": {
    "gram-1": {
      "answers": ["a:+", "12.2:-"],
      "firstAttempted": "2025-11-10T13:59:01Z",
      "lastAttempted":  "2025-11-10T14:04:43Z",
      "state": "incomplete",
      "analysis": {
        "tableId": "t:4c9a1f3b",
        "cells": {
          "R2C3#f:9bd2e1a4": "Port shaft ~24 Hz"
        },
        "firstEdited": "2025-11-10T15:01:12Z",
        "lastEdited":  "2025-11-10T15:07:33Z"
      }
    }
  }
}
```

### 5.2 Session Cache (sessionStorage)
```json
{
  "totals": {"answered": 12, "correct": 10},
  "pages": {
    "gram-1": {"state":"incomplete","answered":2,"correct":1,"last":"2025-11-10T14:04:43Z"}
  }
}
```

### 5.3 Analysis Table
- Authored as `<table class="qd-analysis">`
- Any `<td>` **without** inline `background-color:` is **writable**.
- Rendered as small text inputs.
- Each writable cell gets a key `R{row}C{col}#f:{hash}`.
- Values stored under `page.analysis.cells`.
- Instructor unlock reveals compact tables of all student entries for that cell:
  - 4-char username prefix + text.
  - Hover shows full name + service ID.
- No color tints or correctness applied for these values.
- No CSV export for analysis tables.

---

## 6. Instructor Features

### 6.1 Unlock
- Instructor enters password to:
  - Reveal correct answers.
  - Show per-student answers beside correct ones.
  - Show per-cell entry grids in analysis tables.
  - Enable “Erase all data” button.

### 6.2 Score Page
- Lists all users for current release.
- Shows:
  - Name, service ID
  - Questions attempted, correct
  - Percentage
- Optional “Show answers per user” toggle.
- Buttons:
  - **Export CSV (per-question or per-page)**
  - **Erase all data**

### 6.3 Erase All Data
- Instructor-only.
- Deletes all records from IndexedDB and clears all `sessionStorage` keys.
- Confirm by typing `DELETE ALL`.
- Optionally export quiz results before erase.
- Broadcasts update so all open tabs refresh to blank state.

---

## 7. Data Persistence

| Layer | Purpose | Lifetime |
|--------|----------|-----------|
| IndexedDB | Primary user data (answers, analysis) | Persistent |
| sessionStorage | Page-state cache and user session | Until browser/tab close or 30 min idle |

Backup/export options:
- “Save Results” → CSV (per-answer or per-page)
- Instructor erase fully clears stored data.

---

## 8. Authoring Rules

| Table Type | Class | Author Instructions |
|-------------|--------|--------------------|
| Quiz | `qd-quiz qd-page` | One per page, 3 columns (question, answer, detail). Use `<ol>` for MCQ options. |
| Analysis | `qd-analysis` | One per page. Cells with `background-color:` remain static; others become text inputs. |
| Status Panel | `#qd-status` | Empty floating div on quiz pages. JS injects status summary. |

Author runtime validation:
- One quiz or analysis table per page.
- Columns count correct.
- MCQ index within range.
- Tolerance numeric.
- Clear red banner for errors.

---

## 9. Visual Conventions

| Element | Colors |
|----------|---------|
| Status “Unstarted” | Red (#d32f2f border, #fff5f5 background) |
| Status “Incomplete” | Amber (#f57c00 border, #fff8e1 background) |
| Status “Complete” | Green (#2e7d32 border, #f1f8e9 background) |
| Badges (Home Page) | Same color mapping |
| Analysis Instructor View | Neutral (no color cues) |

---

## 10. Accessibility
- All interactive elements keyboard-accessible.
- `role="status"` and `aria-live="polite"` used for status panel updates.
- Color-coded states include text labels for color-blind accessibility.

---

## 11. Data Integrity & Safety
- Writes to IndexedDB use atomic transactions.
- Local backups written every 5th save.
- Verify on reload (`schema` version check).
- Hard refresh or reboot **does not** lose data.
- Instructor erase is the only destructive operation.

---

## 12. Future Enhancements
- Optional encryption using user service ID as key.
- Multi-release comparison mode for instructors.
- Lightweight cloud sync (future).

---

**Document version:** v1.1  
**Date:** 2025-11-11  
**Author:** Sirius Digital  
**Project:** Sonar Training Interactive Document
