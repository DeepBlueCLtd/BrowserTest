# Data Model: Encrypt Stored Data

**Feature**: 009-encrypt-stored-data
**Date**: 2025-11-27

## Overview

This feature adds an obfuscation layer to IndexedDB storage. The data model itself (StudentRecord, PageData, etc.) remains unchanged. The obfuscation transforms how data is serialized/deserialized at the storage boundary.

## Existing Entities (Unchanged)

### StudentRecord
Primary entity stored in IndexedDB. Structure remains exactly as defined in `src/types/contracts.ts`:

```typescript
interface StudentRecord {
  schema: number;
  serviceId: ServiceId;
  name: string;
  release: ReleaseId;
  attempted: number;
  correct: number;
  pages: Record<PageId, PageData>;
}
```

**Storage key**: `qd/{release}/u{serviceId}` (unchanged)

## New Entities

### ObfuscatedRecord

When `ENCRYPT_STORAGE = true`, StudentRecord is stored as an obfuscated string rather than a plain object.

```typescript
/**
 * Format of obfuscated data in IndexedDB
 *
 * Structure: "OBF:" + base64(xor(json, key))
 *
 * Example:
 *   Original: { "schema": 1, "serviceId": "RN1234", ... }
 *   Stored:   "OBF:SGVsbG8gV29ybGQhIFRoaXMgaXMgb2JmdXNjYXRlZA=="
 */
type ObfuscatedRecord = `OBF:${string}`;
```

**Fields**:
- `OBF:` - Magic prefix for format detection (4 bytes)
- Base64 payload - XOR-encoded JSON data

### ObfuscationKey

Derived from Release ID, used for XOR cipher.

```typescript
/**
 * Key derivation from Release ID
 *
 * Input: "TRV Connectors Autumn 2025"
 * Output: Repeating byte sequence for XOR
 */
type ObfuscationKey = string;
```

**Derivation rules**:
1. Take Release ID string (from `.wh_publication_title .title`)
2. Convert each character to char code
3. Join as string (creates repeating pattern for XOR)

### StorageFormatError

New error type for format mismatch detection.

```typescript
/**
 * Thrown when storage format doesn't match ENCRYPT_STORAGE setting
 */
class StorageFormatError extends Error {
  constructor(
    message: string,
    public readonly expected: 'obfuscated' | 'plain',
    public readonly found: 'obfuscated' | 'plain'
  ) {
    super(message);
    this.name = 'StorageFormatError';
  }
}
```

## State Transitions

### Record Lifecycle with Obfuscation

```
┌─────────────────┐
│  Application    │
│  StudentRecord  │  (Plain JSON object)
└────────┬────────┘
         │
         ▼ saveStudent()
┌─────────────────┐
│  Obfuscation    │  if ENCRYPT_STORAGE
│  Layer          │  encode(record, key) → "OBF:..."
└────────┬────────┘
         │
         ▼ put()
┌─────────────────┐
│   IndexedDB     │  Stores: "OBF:base64data..."
│   (students)    │  OR: plain StudentRecord (if disabled)
└────────┬────────┘
         │
         ▼ get()
┌─────────────────┐
│  Obfuscation    │  Format check + decode
│  Layer          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Application    │  (Plain JSON object)
│  StudentRecord  │
└─────────────────┘
```

### Migration States

```
┌──────────────────┐                    ┌──────────────────┐
│  Unobfuscated    │ ──── migrate ────► │   Obfuscated     │
│  (plain JSON)    │  (encrypt)         │   (OBF:...)      │
│                  │ ◄──── migrate ──── │                  │
│                  │  (decrypt)         │                  │
└──────────────────┘                    └──────────────────┘

Migration is one-time, explicit operation.
Mixed states are NOT supported (fail-fast).
```

## Validation Rules

### Format Detection

| Condition | Action |
|-----------|--------|
| `ENCRYPT_STORAGE=true` AND stored starts with `OBF:` | ✓ Proceed with decode |
| `ENCRYPT_STORAGE=true` AND stored is plain object | ✗ Throw StorageFormatError |
| `ENCRYPT_STORAGE=false` AND stored is plain object | ✓ Proceed normally |
| `ENCRYPT_STORAGE=false` AND stored starts with `OBF:` | ✗ Throw StorageFormatError |

### Decode Validation

After base64 decode and XOR:
1. Result MUST be valid JSON
2. Parsed result MUST match StudentRecord schema
3. Invalid data treated as corrupted (FR-005)

## Indexes (Unchanged)

IndexedDB indexes remain the same:
- `by-release` - for `getStudentsByRelease()`
- `by-service-id` - for lookups

Note: Indexes only work on plain objects. When obfuscation is enabled, index-based queries require full table scan + decode. This is acceptable for the expected scale (~100 students per release max).

## Schema Version

No change to `DB_VERSION` (currently 3). Obfuscation is a serialization concern, not a schema change. Existing IndexedDB structure supports both formats.
