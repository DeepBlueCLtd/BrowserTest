#!/usr/bin/env node

/**
 * E2E Gap Analysis Script
 * Maps application features to E2E test coverage via spec file analysis.
 *
 * Usage:
 *   node scripts/analyze-e2e-gaps.js    # Generate docs/test-coverage-report.md
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const E2E_DIR = join(ROOT, 'tests/e2e/workflows');
const OUTPUT_FILE = join(ROOT, 'docs/test-coverage-report.md');

// Feature inventory (from CLAUDE.md analysis)
const FEATURES = [
  {
    id: 'student-login',
    name: 'Student login',
    selectors: ['qd-login', 'serviceId', 'name', '[data-testid="login-button"]'],
    keywords: ['login', 'student', 'serviceId'],
  },
  {
    id: 'instructor-login',
    name: 'Instructor login',
    selectors: ['qd-login', 'instructor-modal', '[data-testid="instructor-button"]', 'password'],
    keywords: ['instructor', 'password', 'unlock'],
  },
  {
    id: 'quiz-mcq',
    name: 'Quiz interaction (MCQ)',
    selectors: ['qd-quiz', '[type="radio"]', 'mcq'],
    keywords: ['quiz', 'mcq', 'radio', 'answer'],
  },
  {
    id: 'quiz-numeric',
    name: 'Quiz interaction (Numeric)',
    selectors: ['qd-quiz', '[type="number"]', 'numeric'],
    keywords: ['quiz', 'numeric', 'number', 'input'],
  },
  {
    id: 'analysis-tables',
    name: 'Analysis table editing',
    selectors: ['qd-analysis', 'contenteditable', 'analysis'],
    keywords: ['analysis', 'table', 'edit', 'contenteditable'],
  },
  {
    id: 'progress-tracking',
    name: 'Progress tracking (R/A/G badges)',
    selectors: ['badge', 'quizPageBtn', 'progress'],
    keywords: ['progress', 'badge', 'rag', 'green', 'amber', 'red'],
  },
  {
    id: 'session-timeout',
    name: 'Session management (timeout)',
    selectors: ['session', 'timeout', 'lastActivity'],
    keywords: ['session', 'timeout', 'expire', 'logout'],
  },
  {
    id: 'csv-export',
    name: 'Data export (CSV)',
    selectors: ['export', 'csv', 'download'],
    keywords: ['export', 'csv', 'download'],
  },
  {
    id: 'cohort-management',
    name: 'Cohort management (data erasure)',
    selectors: ['erase', 'clear', 'cohort', 'data-clear'],
    keywords: ['erase', 'clear', 'cohort', 'delete'],
  },
  {
    id: 'build-info',
    name: 'Build info display',
    selectors: ['qd-build-info', 'build', 'version'],
    keywords: ['build', 'version', 'info'],
  },
  {
    id: 'pin-auth',
    name: 'PIN authentication',
    selectors: ['qd-pin', 'pin-create', 'pin-reset'],
    keywords: ['pin', 'authentication', 'create', 'reset'],
  },
];

/**
 * Extract patterns from spec file content
 */
function analyzeSpecFile(content, filename) {
  const analysis = {
    filename,
    selectors: [],
    actions: {
      click: 0,
      fill: 0,
      waitForSelector: 0,
      check: 0,
      selectOption: 0,
      goto: 0,
    },
    assertions: 0,
    testCount: 0,
  };

  // Count tests
  const testMatches = content.match(/test\s*\(/g) || [];
  analysis.testCount = testMatches.length;

  // Extract selectors
  const selectorRegex = /(?:locator|getBy\w+|waitForSelector)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = selectorRegex.exec(content)) !== null) {
    if (!analysis.selectors.includes(match[1])) {
      analysis.selectors.push(match[1]);
    }
  }

  // Count actions
  analysis.actions.click = (content.match(/\.click\s*\(/g) || []).length;
  analysis.actions.fill = (content.match(/\.fill\s*\(/g) || []).length;
  analysis.actions.waitForSelector = (content.match(/waitForSelector\s*\(/g) || []).length;
  analysis.actions.check = (content.match(/\.check\s*\(/g) || []).length;
  analysis.actions.selectOption = (content.match(/\.selectOption\s*\(/g) || []).length;
  analysis.actions.goto = (content.match(/\.goto\s*\(/g) || []).length;

  // Count assertions
  analysis.assertions = (content.match(/expect\s*\(/g) || []).length;

  return analysis;
}

/**
 * Check if a feature is covered by a spec file
 */
function isFeatureCovered(feature, specAnalyses) {
  for (const spec of specAnalyses) {
    // Check selectors
    for (const selector of feature.selectors) {
      if (spec.selectors.some(s => s.toLowerCase().includes(selector.toLowerCase()))) {
        return spec.filename;
      }
    }
    // Check keywords in filename
    for (const keyword of feature.keywords) {
      if (spec.filename.toLowerCase().includes(keyword.toLowerCase())) {
        return spec.filename;
      }
    }
  }
  return null;
}

// Main execution
const specFiles = readdirSync(E2E_DIR).filter(f => f.endsWith('.spec.ts'));
const specAnalyses = [];

for (const file of specFiles) {
  const content = readFileSync(join(E2E_DIR, file), 'utf-8');
  specAnalyses.push(analyzeSpecFile(content, file));
}

// Map features to coverage
const featureCoverage = FEATURES.map(feature => ({
  ...feature,
  coveredBy: isFeatureCovered(feature, specAnalyses),
}));

// Aggregate selector and action counts
const allSelectors = {};
for (const spec of specAnalyses) {
  for (const sel of spec.selectors) {
    allSelectors[sel] = (allSelectors[sel] || 0) + 1;
  }
}

const totalActions = {
  click: 0,
  fill: 0,
  waitForSelector: 0,
  check: 0,
  selectOption: 0,
  goto: 0,
};
for (const spec of specAnalyses) {
  for (const [action, count] of Object.entries(spec.actions)) {
    totalActions[action] += count;
  }
}

// Generate markdown report
const now = new Date().toISOString().split('T')[0];
const covered = featureCoverage.filter(f => f.coveredBy);
const gaps = featureCoverage.filter(f => !f.coveredBy);

let report = `# E2E Test Coverage Report

Generated: ${now}

## Summary

- **Total Features**: ${FEATURES.length}
- **Covered**: ${covered.length} (${((covered.length / FEATURES.length) * 100).toFixed(0)}%)
- **Gaps**: ${gaps.length}
- **E2E Spec Files**: ${specFiles.length}
- **Total Tests**: ${specAnalyses.reduce((sum, s) => sum + s.testCount, 0)}

## Feature Coverage Matrix

| Feature | E2E Spec File | Status |
|---------|---------------|--------|
`;

for (const feature of featureCoverage) {
  const status = feature.coveredBy ? '✅ Covered' : '❌ Gap';
  const specFile = feature.coveredBy || '-';
  report += `| ${feature.name} | ${specFile} | ${status} |\n`;
}

report += `
## Spec File Analysis

| Spec File | Tests | Clicks | Fills | Waits | Assertions |
|-----------|-------|--------|-------|-------|------------|
`;

for (const spec of specAnalyses) {
  report += `| ${spec.filename} | ${spec.testCount} | ${spec.actions.click} | ${spec.actions.fill} | ${spec.actions.waitForSelector} | ${spec.assertions} |\n`;
}

report += `
## Tested Selectors

Top selectors by frequency:

`;

const sortedSelectors = Object.entries(allSelectors)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

for (const [sel, count] of sortedSelectors) {
  report += `- \`${sel}\` (${count} specs)\n`;
}

report += `
## Action Summary

| Action | Count |
|--------|-------|
| page.click() | ${totalActions.click} |
| page.fill() | ${totalActions.fill} |
| page.waitForSelector() | ${totalActions.waitForSelector} |
| page.check() | ${totalActions.check} |
| page.selectOption() | ${totalActions.selectOption} |
| page.goto() | ${totalActions.goto} |

## Gaps Requiring Attention

`;

if (gaps.length === 0) {
  report += 'All features have E2E coverage!\n';
} else {
  for (const gap of gaps) {
    report += `### ${gap.name}\n\n`;
    report += `**Feature ID**: ${gap.id}\n`;
    report += `**Expected selectors**: ${gap.selectors.join(', ')}\n`;
    report += `**Search keywords**: ${gap.keywords.join(', ')}\n\n`;
  }
}

report += `
---
*This report was generated by \`npm run analyze:e2e-gaps\`*
`;

// Ensure docs directory exists
const docsDir = dirname(OUTPUT_FILE);
if (!existsSync(docsDir)) {
  mkdirSync(docsDir, { recursive: true });
}

// Write report
writeFileSync(OUTPUT_FILE, report);

console.log(`E2E Gap Analysis Report generated: ${OUTPUT_FILE}`);
console.log(`\nSummary:`);
console.log(`  Features: ${FEATURES.length}`);
console.log(`  Covered: ${covered.length}`);
console.log(`  Gaps: ${gaps.length}`);
console.log(`  Spec files analyzed: ${specFiles.length}`);
