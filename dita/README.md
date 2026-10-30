# DITA Content & Build

This directory contains DITA source content and Oxygen WebHelp template for the Sonar Quiz System training materials.

## Directory Structure

- `dita/` - DITA source files (topics, maps, images)
  - `Pages/` - Quiz and analysis pages
  - `page-index.dita` - Main navigation index
- `template/` - Oxygen WebHelp Responsive template customization
  - `resources/` - Static assets (JS, CSS, fonts, images)
  - `xslt/` - XSL transforms for custom output
  - `page-templates/` - HTML page structure templates

## Building for DITA Publishing

Before publishing DITA content with Oxygen XML WebHelp, ensure the Sonar Quiz System bundle is up to date:

```bash
# From project root
npm run build:dita
```

This will:
1. Build the TypeScript source (`tsc`)
2. Bundle with Vite (IIFE format)
3. Copy `dist/sonar-quiz.iife.js` to `dita/template/resources/`

The bundle will then be included in the published WebHelp output.

## Oxygen WebHelp Parameters

When publishing with Oxygen, ensure these parameters are set in your transformation scenario:

### Required Parameters

These are set in the transformation scenario of `dita/DITA_project_CSA.xpr` and read by
`template/xslt/inc/customHeader.xsl`, which writes each into a hidden span the runtime reads.

- **`qd-db-name`** - IndexedDB database name (required by the runtime).
- **`qd-instructor-hash`** - Instructor password hash: the first 12 hex characters of its
  SHA-256 (or the full 64). Generate it with `generate-password-hash.html`.
- **`qd-status-container`**, **`qd-title-selector`** - Optional selectors; empty means the defaults.
- **`qd-answer-key`** - Key used to encode quiz answers in the published HTML (SRD 013): 13
  different capital letters, for example `KXMQBRTLHZWDP`. Empty means the built-in default.
  Set a different key per publication.

### Quiz answers are encoded at publish time

`template/xslt/inc/quizAnswerEncoding.xsl` rewrites the Answer cell of every `qd-quiz` simple
table, and a Detail cell holding only a numeric tolerance, as `qd1:` plus a letter substitution.
The build stops if an answer contains anything but digits, a sign and a decimal point. Authors
still write plain answers in DITA. Full-text search is removed from the template because its
result snippets showed answers. After every rebuild, run the checklist below.

### Rebuild checklist (owner, after template changes)

1. `npm run build:dita` (obfuscated-storage bundle into `template/resources/`).
2. Publish in Oxygen with the `f13ldMan-CSA` template.
3. `npm run check:answer-leak -- dita/out/oxygen` must report no plaintext answers and no
   search index. If it reports the index, delete `oxygen-webhelp/app/search/index/` from the
   output before distributing it.
4. Open a quiz page as a student and as an instructor and check answers still validate.
5. `npm run update-dita-demo`, then commit `dita-demo/`.

### Optional Parameters

- `webhelp.show.protection` - Set to `yes` to show protection header (default: no)
- `webhelp.protection.text` - Classification banner text (e.g., "COMMERCIAL IN CONFIDENCE")
- `webhelp.protection.background.color` - CSS color for protection banner background

### Setting Parameters in Oxygen

1. Open transformation scenario (Configure Transformation Scenario)
2. Click **Parameters** tab
3. Click **New** to add `instructor.password.hash`
4. Set **Value** to the SHA-256 hash above
5. Apply and run transformation

## Content Authoring

See `CLAUDE.md` in project root for:
- Quiz table structure (`qd-quiz` class)
- Analysis table structure (`qd-analysis` class)
- Home page badge markers (`quizPageBtn` class)
- MCQ format (1-indexed `<ol>` lists)
- Numeric question format (tolerance values)
