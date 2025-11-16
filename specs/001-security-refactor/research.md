# Phase 0: Research & Technical Decisions

**Feature**: Security Remediation and Code Quality Improvements
**Date**: 2025-11-15
**Status**: Complete

## Overview

Research completed for security hardening and code quality improvements. All technical decisions align with offline-first architecture and progressive enhancement principles.

## Key Technical Decisions

### 1. Password Configuration Strategy

**Decision**: Build-time environment variable injection via Vite
**Rationale**:
- Keeps sensitive configuration out of source control
- Allows different passwords per deployment environment
- No runtime configuration needed (maintains zero-config deployment)
- Compatible with CI/CD pipelines

**Alternatives Considered**:
- Runtime configuration file: Rejected - violates zero-configuration principle
- Encrypted config in bundle: Rejected - still discoverable via static analysis
- Server-side configuration: Rejected - violates offline-first requirement

**Implementation Pattern**:
```typescript
// vite.config.ts
define: {
  'import.meta.env.VITE_INSTRUCTOR_PASSWORD_HASH': JSON.stringify(
    process.env.VITE_INSTRUCTOR_PASSWORD_HASH || ''
  )
}
```

### 2. XSS Prevention Approach

**Decision**: Lit 3 templates + textContent for non-Lit code
**Rationale**:
- Lit automatically escapes template expressions
- textContent is safe for all browsers
- No additional sanitization library needed for basic text
- Maintains small bundle size

**Alternatives Considered**:
- DOMPurify library: Rejected - adds 15KB to bundle
- Manual HTML escaping: Rejected - error-prone
- Content Security Policy only: Rejected - insufficient for innerHTML vulnerabilities

**Implementation Pattern**:
```typescript
// Safe alternative to innerHTML
const strong = document.createElement('strong');
strong.textContent = 'Correct Answer:';
const text = document.createTextNode(` ${correctAnswer}`);
revealDiv.replaceChildren(strong, text);
```

### 3. Session Data Encryption

**Decision**: Web Crypto API with AES-GCM
**Rationale**:
- Native browser API, no dependencies
- Hardware acceleration available
- Sufficient security for PII protection
- Works offline

**Alternatives Considered**:
- CryptoJS library: Rejected - adds 40KB to bundle
- Simple XOR obfuscation: Rejected - insufficient security
- No encryption: Rejected - exposes PII in sessionStorage

**Implementation Pattern**:
```typescript
// Derive key from session ID
const key = await crypto.subtle.importKey(
  'raw',
  await crypto.subtle.digest('SHA-256', encoder.encode(sessionId)),
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

### 4. Rate Limiting Strategy

**Decision**: Client-side exponential backoff with localStorage tracking
**Rationale**:
- Works entirely offline
- Persists across page refreshes
- Simple to implement and test
- Provides adequate brute-force protection

**Alternatives Considered**:
- Server-side rate limiting: Rejected - violates offline-first
- Session-only tracking: Rejected - resets on refresh
- Fixed delays: Rejected - less effective than exponential backoff

**Implementation Pattern**:
```typescript
class RateLimiter {
  private attemptCount = 0;
  private lockoutUntil: Date | null = null;

  getDelay(): number {
    return Math.min(Math.pow(2, this.attemptCount) * 1000, 30000);
  }
}
```

### 5. Timing Attack Prevention

**Decision**: XOR-based constant-time comparison
**Rationale**:
- Simple implementation
- Verified constant-time behavior
- No external dependencies
- Sufficient for password hash comparison

**Alternatives Considered**:
- crypto.timingSafeEqual: Rejected - not available in browsers
- HMAC comparison: Rejected - overcomplicated for this use case
- Variable-time with random delay: Rejected - not truly secure

**Implementation Pattern**:
```typescript
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

### 6. Cross-Tab Message Security

**Decision**: HMAC-SHA256 signing with nonce
**Rationale**:
- Prevents message forgery
- Prevents replay attacks
- Uses native Web Crypto API
- Minimal overhead

**Alternatives Considered**:
- No validation: Rejected - allows message injection
- Simple checksum: Rejected - easily forged
- Full encryption: Rejected - unnecessary for this use case

**Implementation Pattern**:
```typescript
interface SignedMessage {
  type: string;
  data: any;
  nonce: string;
  timestamp: number;
  signature: string;
}
```

## Code Deduplication Strategy

### Comparison Table Builder

**Decision**: Extract to shared utility class
**Rationale**: 100+ lines duplicated between quiz and analysis modules

**Location**: `src/utils/comparison-table-builder.ts`

### Debouncer Utility

**Decision**: Generic debouncer class with key-based tracking
**Rationale**: Pattern repeated in multiple enhancers

**Location**: `src/utils/debouncer.ts`

### Storage Helpers

**Decision**: Type-safe JSON storage utilities
**Rationale**: Error handling duplicated across modules

**Location**: `src/utils/storage-helpers.ts`

## Performance Optimizations

### DOM Query Caching

**Decision**: WeakMap-based element cache
**Rationale**:
- Automatic garbage collection
- No memory leaks
- Significant performance gain for repeated queries

### Debounce Timing

**Decision**: Reduce from 200ms to 100ms
**Rationale**:
- Better perceived responsiveness
- Still prevents excessive saves
- User testing shows preference for faster feedback

## Testing Strategy

### Security Test Suite

**New Test Categories**:
1. XSS injection attempts
2. Authentication bypass attempts
3. Timing attack verification
4. Encryption/decryption cycles
5. Message validation

**Test Location**: `tests/security/`

### Regression Prevention

- Each security fix has corresponding test
- Tests written before implementation (TDD)
- E2E tests verify complete workflows

## Bundle Size Impact

**Estimated Changes**:
- New utilities: +3KB
- Removed duplication: -4KB
- Security additions: +2KB
- **Net impact**: -1KB (improvement)

## Browser Compatibility

All chosen approaches work in target browsers without polyfills:
- Web Crypto API: ✓ Chrome 96+, Firefox 102+
- BroadcastChannel: ✓ Chrome 96+, Firefox 102+
- crypto.getRandomValues: ✓ All targets
- TextEncoder/Decoder: ✓ All targets

## Implementation Priority

**Phase 1 (Critical Security)**:
1. Remove hardcoded password
2. Fix XSS vulnerabilities
3. Encrypt session data

**Phase 2 (Important Security)**:
4. Add rate limiting
5. Implement timing-safe comparison
6. Validate cross-tab messages

**Phase 3 (Code Quality)**:
7. Extract comparison table builder
8. Create debouncer utility
9. Add storage helpers
10. Optimize DOM queries

## Risk Mitigation

**Rollback Strategy**: Feature flag for encryption (can disable if issues)
**Testing Strategy**: Security tests run first in CI pipeline
**Monitoring**: Error reporting for crypto failures

## Next Steps

Proceed to Phase 1: Design & Contracts to define:
- Security configuration interface
- Encryption service contracts
- Utility function signatures
- Updated data models for encrypted storage