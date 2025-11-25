#!/usr/bin/env node

/**
 * Structural Gap Analysis Script
 * Identifies source files without corresponding test files.
 *
 * Usage:
 *   node scripts/check-test-gaps.js          # Text output
 *   node scripts/check-test-gaps.js --json   # JSON output
 *   node scripts/check-test-gaps.js --strict # Exit code 1 if gaps found
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Configuration
const SRC_DIR = join(ROOT, 'src');

// Exclusion patterns (files that don't need direct tests)
const EXCLUSIONS = [
  /^src\/types\//,           // Type-only files
  /^src\/index\.ts$/,        // Entry point (tested via integration)
  /\.d\.ts$/,                // Declaration files
  /shared-styles\.ts$/,      // CSS-only files
];

// Parse CLI arguments
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const strictMode = args.includes('--strict');

/**
 * Recursively get all TypeScript files in a directory
 */
function getFiles(dir, base = '') {
  const results = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = join(base, entry);

    if (statSync(fullPath).isDirectory()) {
      results.push(...getFiles(fullPath, relativePath));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts') && !entry.endsWith('.spec.ts')) {
      results.push(relativePath);
    }
  }
  return results;
}

/**
 * Check if a source file should be excluded from gap analysis
 */
function isExcluded(srcPath) {
  const fullPath = `src/${srcPath}`;
  return EXCLUSIONS.some(pattern => pattern.test(fullPath));
}

/**
 * Get expected test paths for a source file
 */
function getExpectedTestPaths(srcPath) {
  const dir = dirname(srcPath);
  const name = basename(srcPath, extname(srcPath));
  const testName = `${name}.test.ts`;

  const paths = [];

  // Unit test path preserves directory structure
  if (dir && dir !== '.') {
    paths.push(join('tests/unit', dir, testName));
  } else {
    paths.push(join('tests/unit', testName));
  }

  // Integration test path (flat structure)
  paths.push(join('tests/integration', testName));

  return paths;
}

/**
 * Check if any of the expected test paths exist
 */
function hasTest(srcPath) {
  const expectedPaths = getExpectedTestPaths(srcPath);
  return expectedPaths.some(p => existsSync(join(ROOT, p)));
}

// Main execution
const sourceFiles = getFiles(SRC_DIR);
const gaps = [];
const covered = [];

for (const srcFile of sourceFiles) {
  if (isExcluded(srcFile)) {
    continue;
  }

  if (hasTest(srcFile)) {
    covered.push(srcFile);
  } else {
    gaps.push({
      sourceFile: `src/${srcFile}`,
      expectedTestPaths: getExpectedTestPaths(srcFile),
      status: 'missing',
    });
  }
}

const totalFiles = covered.length + gaps.length;
const coveragePercent = totalFiles > 0 ? ((covered.length / totalFiles) * 100).toFixed(1) : 0;

// Output results
if (jsonOutput) {
  const result = {
    summary: {
      totalFiles,
      filesWithTests: covered.length,
      filesWithoutTests: gaps.length,
      coveragePercent: parseFloat(coveragePercent),
    },
    gaps,
  };
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('=== Source Files Without Tests ===\n');

  if (gaps.length === 0) {
    console.log('All source files have corresponding test files!\n');
  } else {
    for (const gap of gaps) {
      console.log(gap.sourceFile);
      console.log(`  Expected: ${gap.expectedTestPaths.join(' OR ')}`);
      console.log(`  Status: MISSING\n`);
    }
  }

  console.log('=== Summary ===');
  console.log(`Total source files: ${totalFiles}`);
  console.log(`Files with tests: ${covered.length}`);
  console.log(`Files without tests: ${gaps.length}`);
  console.log(`Coverage: ${coveragePercent}%`);
}

// Exit with error if strict mode and gaps found
if (strictMode && gaps.length > 0) {
  process.exit(1);
}
