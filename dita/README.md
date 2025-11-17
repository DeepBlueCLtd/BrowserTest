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

- **`instructor.password.hash`** - SHA-256 hash of instructor password
  - **Value**: `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8`
  - **Description**: Default hash for password "password" (change for production)
  - **How to set**: In Oxygen transformation scenario → Parameters tab → Add parameter
  - **Purpose**: XSL template injects this into a hidden span for instructor authentication

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
