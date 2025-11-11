#!/usr/bin/env node

import { readFileSync, statSync } from 'fs';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAX_SIZE_KB = 25;
const IIFE_PATH = join(__dirname, '../dist/sonar-quiz.iife.js');

try {
  // Read the IIFE bundle
  const content = readFileSync(IIFE_PATH, 'utf-8');

  // Get minified size
  const minifiedSize = statSync(IIFE_PATH).size;
  const minifiedKB = (minifiedSize / 1024).toFixed(2);

  // Get gzipped size
  const gzipped = gzipSync(content);
  const gzippedSize = gzipped.length;
  const gzippedKB = (gzippedSize / 1024).toFixed(2);

  console.log('📦 Bundle Size Report');
  console.log('─────────────────────');
  console.log(`Minified:  ${minifiedKB} KB`);
  console.log(`Gzipped:   ${gzippedKB} KB`);
  console.log(`Max limit: ${MAX_SIZE_KB} KB`);
  console.log('─────────────────────');

  if (gzippedSize / 1024 > MAX_SIZE_KB) {
    console.error(`❌ Bundle size exceeds limit! (${gzippedKB} KB > ${MAX_SIZE_KB} KB)`);
    process.exit(1);
  } else {
    const remaining = MAX_SIZE_KB - (gzippedSize / 1024);
    console.log(`✅ Bundle size within limit (${remaining.toFixed(2)} KB remaining)`);
    process.exit(0);
  }
} catch (error) {
  console.error('❌ Error checking bundle size:', error.message);
  console.error('Make sure to run "npm run build" first');
  process.exit(1);
}
