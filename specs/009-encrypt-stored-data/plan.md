# Implementation Plan: Encrypt Stored Data

**Branch**: `009-encrypt-stored-data` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-encrypt-stored-data/spec.md`

## Summary

Add deterrence-level obfuscation to IndexedDB-stored student records. When `ENCRYPT_STORAGE = true`, all StudentRecord values are obfuscated using a key derived from the Release ID before storage and transparently decrypted on read. This prevents casual inspection via browser DevTools while maintaining full application functionality.

## Technical Context

**Language/Version**: TypeScript 5.x / ES2020+ with Lit 3.0 (Web Components)
**Primary Dependencies**: Existing IndexedDBStorageAdapter (`src/services/storage/indexeddb.ts`)
**Storage**: IndexedDB (primary) - obfuscation at adapter layer; sessionStorage unchanged
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Modern browsers (Chrome/Edge ≥96, Firefox ≥102) from file:// URLs
**Project Type**: Single web application (IIFE bundle)
**Performance Goals**: <50ms overhead per storage operation
**Constraints**: <35KB min+gzip bundle, offline-capable, no external dependencies
**Scale/Scope**: Single-user local storage, ~50 questions per release

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Offline-First**: Obfuscation uses Release ID from DOM, no network calls
- [x] **Progressive Enhancement**: Storage layer change only; existing UI unaffected
- [x] **Test-Driven Development**: Tests written first for encode/decode, then adapter wrapper
- [x] **Phase-Gated Delivery**: Clear phases - obfuscation utils → adapter wrapper → migration
- [x] **Performance Constraints**: XOR + base64 is lightweight; <50ms target achievable
- [x] **Data Isolation**: Same `qd/{release}/u{serviceId}` key scheme; obfuscation adds security
- [x] **Zero Configuration**: `ENCRYPT_STORAGE` const compiled in; no runtime config needed

## Project Structure

### Documentation (this feature)

```text
specs/009-encrypt-stored-data/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── services/
│   └── storage/
│       ├── indexeddb.ts           # Existing - will wrap with obfuscation
│       ├── obfuscation.ts         # NEW: encode/decode utilities
│       └── migration.ts           # Existing - add obfuscation migration
├── config/
│   └── feature-flags.ts           # NEW: ENCRYPT_STORAGE constant
└── types/
    └── contracts.ts               # Existing - no changes needed

tests/
├── unit/
│   └── services/storage/
│       └── obfuscation.test.ts    # NEW: encode/decode unit tests
├── integration/
│   └── storage/
│       └── encrypted-storage.test.ts  # NEW: adapter integration tests
└── e2e/
    └── encrypted-storage.spec.ts  # NEW: E2E verification
```

**Structure Decision**: Extend existing storage layer with new obfuscation module. No architectural changes - obfuscation wraps existing IndexedDBStorageAdapter transparently.

## Complexity Tracking

> No constitution violations - obfuscation is a straightforward storage layer enhancement.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
