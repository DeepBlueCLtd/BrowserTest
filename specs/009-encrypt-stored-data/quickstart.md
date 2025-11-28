# Quickstart: Encrypt Stored Data

**Feature**: 009-encrypt-stored-data
**Date**: 2025-11-27

## Overview

This feature adds deterrence-level obfuscation to IndexedDB-stored student records. When enabled, data appears as unintelligible base64 strings in browser DevTools.

## Quick Setup

### 1. Enable Obfuscation

Edit `src/config/feature-flags.ts`:

```typescript
export const ENCRYPT_STORAGE = true;
```

### 2. Migrate Existing Data (if any)

Before enabling obfuscation on a system with existing data, run migration:

```javascript
// In browser console
await window.SonarQuiz.migrateStorage('encrypt', {
  releaseId: 'Your Release Name',
  dryRun: true  // Preview first
});

// If preview looks good, run actual migration
await window.SonarQuiz.migrateStorage('encrypt', {
  releaseId: 'Your Release Name'
});
```

### 3. Rebuild

```bash
npm run build
```

## Key Files

| File | Purpose |
|------|---------|
| `src/config/feature-flags.ts` | `ENCRYPT_STORAGE` toggle |
| `src/services/storage/obfuscation.ts` | Encode/decode utilities |
| `src/services/storage/indexeddb.ts` | Storage adapter (unchanged) |

## Development Notes

### Testing with Obfuscation Disabled

For development/debugging, keep `ENCRYPT_STORAGE = false`. Data will be readable in DevTools.

### Testing with Obfuscation Enabled

Set `ENCRYPT_STORAGE = true` and rebuild. Verify:
1. Submit a quiz answer
2. Open DevTools → Application → IndexedDB → BrowserTest → students
3. Data should show as `OBF:...` base64 strings

### Format Mismatch Errors

If you see `StorageFormatError`:
- **"Unobfuscated data found with ENCRYPT_STORAGE enabled"**: Run migration to encrypt
- **"Obfuscated data found with ENCRYPT_STORAGE disabled"**: Run migration to decrypt, or re-enable obfuscation

## Common Tasks

### Check Current Storage Format

```javascript
// In browser console
const db = await indexedDB.open('BrowserTest');
const tx = db.transaction('students', 'readonly');
const store = tx.objectStore('students');
const cursor = await store.openCursor();
console.log('First record:', cursor?.value);
// If starts with "OBF:" → obfuscated
// If is JSON object → plain
```

### Clear All Data and Start Fresh

```javascript
await indexedDB.deleteDatabase('BrowserTest');
location.reload();
```

### Decrypt for Debugging

```javascript
// Temporarily view obfuscated data (in console only)
const { decode, deriveKey } = window.SonarQuiz._obfuscation;
const key = deriveKey('Your Release Name');
const decrypted = decode('OBF:yourBase64DataHere', key);
console.log(decrypted);
```

## Architecture

```
┌────────────────────────────────────────────────┐
│                 Application                     │
│  (Quiz UI, Instructor Panel, CSV Export, etc.) │
└────────────────────┬───────────────────────────┘
                     │ StudentRecord (plain object)
                     ▼
┌────────────────────────────────────────────────┐
│           Obfuscation Layer (NEW)              │
│  ENCRYPT_STORAGE=true → encode() / decode()    │
│  ENCRYPT_STORAGE=false → passthrough           │
└────────────────────┬───────────────────────────┘
                     │ ObfuscatedString OR StudentRecord
                     ▼
┌────────────────────────────────────────────────┐
│         IndexedDBStorageAdapter                │
│  (existing, unchanged)                         │
└────────────────────┬───────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────┐
│              IndexedDB                          │
│  Database: BrowserTest                          │
│  Store: students                                │
└────────────────────────────────────────────────┘
```

## Security Notes

⚠️ **This is deterrence, not encryption.**

- The obfuscation key (Release ID) is visible in the page DOM
- A determined attacker could reverse-engineer the XOR cipher
- Purpose: Discourage casual inspection by students using DevTools
- NOT suitable for protecting sensitive data from sophisticated attackers
