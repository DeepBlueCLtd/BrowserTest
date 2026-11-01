# DITA Content & Publishing

This folder holds the DITA source for the Sonar Quiz System training material and the Oxygen
WebHelp publishing template that adds the quizzes to the published pages.

There are two audiences:

- **Content authors** write DITA in Oxygen and publish it. They need no command line.
- **Developers** change the quiz software and produce the template authors use.

---

## For content authors (no command line)

### 1. Get the template

1. Open the project's **Releases** page on GitHub and download `oxygen-template-<version>.zip`
   from the newest release.
2. Unzip it. It holds:
   - `template/`: the publishing template, with the quiz script already inside it
   - `generate-password-hash.html`: makes the instructor password value
   - `README.md`: this page
3. In Oxygen, open the transformation scenario and point its publishing template at
   `template/f13ldMan-CSA.opt` from the unzipped folder.

Use a new zip whenever a new release is announced. Do not mix files from different releases.

### 2. Set the scenario parameters

In Oxygen: **Configure Transformation Scenario** → your WebHelp scenario → **Parameters**.
The project file `dita/DITA_project_CSA.xpr` already lists them.

| Parameter | What to enter |
|---|---|
| `qd-db-name` | Name for the browser's data store, for example `BrowserTestDB`. **Required.** |
| `qd-instructor-hash` | The instructor password's hash. Open `generate-password-hash.html` in a browser, type the password, and copy the result. |
| `qd-answer-key` | Key that hides quiz answers in the published pages: 13 **different** capital letters, for example `KXMQBRTLHZWDP`. Use a different key for each publication. Leave empty to use a built-in key. |
| `qd-question-total` | Leave empty. The template counts the quiz questions itself. Enter a number only if students see the wrong total. |
| `qd-status-container`, `qd-title-selector` | Leave empty. |

Optional banner parameters: `webhelp.show.protection` (`yes` to show it), `webhelp.protection.text`
(for example "COMMERCIAL IN CONFIDENCE") and `webhelp.protection.background.color`.

### 3. Publish

Run the transformation as usual. The template:

- hides each quiz answer, and each numeric tolerance, in the published pages, so they cannot be
  read in a text editor or with "view source";
- counts the quiz questions, so students see "12 of 40 answered";
- leaves out full-text search, because its results used to show answers.

**If the build stops** with a message about a quiz answer, that answer contains something other
than digits, a minus sign and a decimal point. Fix it in the DITA source (an MCQ answer is the
option number, a numeric answer is just the number), then publish again. If it stops with a
message about `qd-answer-key`, the key is not 13 different capital letters.

### 4. Check the result

Open a quiz page from the output folder in Chrome or Edge:

1. Log in as a student, answer a question right and one wrong, and check each shows
   ✓ Correct or ✗ Incorrect.
2. Check the panel at the top says "… of N answered", with N the number of quiz questions in
   the publication. If it shows no "of N", set `qd-question-total` and publish again.
3. Log out, log in as instructor, and check the answers appear.

### Writing quiz and analysis tables

- **Quiz table**: a simple table with output class `qd-quiz` and exactly three columns:
  Question, Answer, Detail.
  - **Multiple choice**: put the options in a numbered list in the Detail column. The Answer is
    the number of the right option (the first option is 1).
  - **Numeric**: the Answer is the number, and the Detail column holds the tolerance (how far
    off an answer may be and still count as right).
- **Analysis table**: a table with output class `qd-analysis`. Cells with the class
  `interactive` are the ones students type into; put a label in the cell to their left.
- At most one quiz table and one analysis table per page.
- Links on the contents page that should show a red, amber or green progress badge need the
  class `quizPageBtn`.

---

## For developers

### Producing the template authors use

- Every pull request's CI run uploads `oxygen-template` (the zip above) as a build artifact, so a
  change can be tried in Oxygen before release.
- Tagging a release (`vX.Y.Z` on `main`, see `docs/RELEASE.md`) attaches
  `oxygen-template-X.Y.Z.zip` to the GitHub Release. That is what authors download.
- Locally, `npm run package:template` builds the same zip in `dist/`.

The script inside the template is the obfuscated-storage build (SRD 013 SEC-08). It is
gitignored in `template/resources/`; the packaging step copies it in.

### How the template protects answers (SRD 013 WP3)

- `template/xslt/inc/quizAnswerEncoding.xsl` rewrites each `qd-quiz` Answer cell, and each
  Detail cell holding only a number, as `qd1:` plus a letter substitution keyed by
  `qd-answer-key`. It stops the build on an answer it cannot encode.
- `template/xslt/inc/quizQuestionTotal.xsl` counts quiz rows in the topics the map references,
  using DITA-OT's `input.map.url`. If a stage does not receive the map, `#qd-question-total`
  stays empty and the runtime shows no total; `qd-question-total` overrides the count.
- `template/xslt/inc/customHeader.xsl` imports both and writes `#qd-answer-key` and
  `#qd-question-total` into every page. Every page stylesheet imports this header.
- `page-templates/header.xml` and `wt_search.html` no longer render search.
- These were tested with the xslt3 processor against DITA quiz topics and a map, not inside
  Oxygen. The first Oxygen publish is the real check.

### Updating the demo output

After publishing the demo content in Oxygen:

```bash
npm run check:answer-leak -- dita/out/oxygen   # fails on any plaintext answer
npm run update-dita-demo                       # copies the output into dita-demo/
```

Then commit `dita-demo/`. CI's E2E tests and the PR previews use it.

Without Oxygen, `npm run protect-dita-demo` applies the template's protection to the existing
`dita-demo/` output instead: it encodes answers and tolerances with the default key, adds the
`#qd-answer-key` and `#qd-question-total` spans, removes search and its index, and turns off
search autocomplete. It follows the template's rules (`scripts/protect-demo-output.js`), but it
is a stand-in: a real Oxygen publish is still the check that the template works.
