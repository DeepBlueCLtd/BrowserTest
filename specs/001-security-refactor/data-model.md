# Data Model: Security Remediation

**Feature**: Security Remediation and Code Quality Improvements
**Date**: 2025-11-15
**Status**: Complete

## Overview

Data model updates for security hardening. Primary changes involve encryption of sensitive data and addition of security-related state tracking.

## Updated Entities

### EncryptedSession

Replaces plain `SessionData` in sessionStorage.

```typescript
interface EncryptedSession {
  iv: string;           // Initialization vector for AES-GCM
  salt: string;         // Salt for key derivation
  ciphertext: string;   // Encrypted SessionData
  timestamp: string;    // ISO 8601 encryption time
}
```

**Storage Location**: `sessionStorage['qd/session']`
**Encryption**: AES-GCM-256 with PBKDF2 key derivation

### SessionData (Internal Only)

Decrypted form, never stored directly.

```typescript
interface SessionData {
  serviceId: string;    // Student service ID
  name: string;         // Student name
  release: string;      // Release ID
  loginTime: string;    // ISO 8601
  expiresAt: string;    // ISO 8601
  lastActivity: string; // ISO 8601
}
```

### RateLimitState

Tracks authentication attempts for rate limiting.

```typescript
interface RateLimitState {
  attemptCount: number;       // Current attempt count
  firstAttemptTime: string;   // ISO 8601 first attempt
  lastAttemptTime: string;    // ISO 8601 last attempt
  lockoutUntil: string | null;// ISO 8601 lockout expiry
  attemptHistory: Array<{
    timestamp: string;        // ISO 8601
    success: boolean;         // Attempt result
  }>;
}
```

**Storage Location**: `localStorage['qd/rateLimit']`
**Cleanup**: Reset after successful auth or 30 minutes

### SecurityEventLog

Audit trail for security-relevant events.

```typescript
interface SecurityEventLog {
  eventId: string;      // UUID v4
  eventType: SecurityEventType;
  timestamp: string;    // ISO 8601
  metadata: {
    [key: string]: any; // Event-specific data (sanitized)
  };
}

enum SecurityEventType {
  AUTH_ATTEMPT = 'AUTH_ATTEMPT',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTH_LOCKOUT = 'AUTH_LOCKOUT',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  DATA_CLEARED = 'DATA_CLEARED',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR'
}
```

**Storage Location**: `IndexedDB['securityLogs']` (circular buffer, max 1000 entries)

### SignedBroadcastMessage

Secure cross-tab communication format.

```typescript
interface SignedBroadcastMessage {
  type: string;         // Message type
  data: any;           // Payload
  nonce: string;       // Random nonce (prevent replay)
  timestamp: string;   // ISO 8601
  signature: string;   // HMAC-SHA256 signature
}
```

**Validation**: Messages older than 5 seconds rejected

### DOMCache

Performance optimization for repeated queries.

```typescript
interface DOMCache {
  selector: string;
  element: WeakRef<Element>;
  timestamp: number;
}
```

**Storage**: In-memory WeakMap (automatic GC)

## Configuration Model

### SecurityConfig

Build-time security configuration.

```typescript
interface SecurityConfig {
  instructorPasswordHash: string;  // Pre-hashed password
  encryptionEnabled: boolean;      // Feature flag
  maxAuthAttempts: number;         // Default: 5
  lockoutDurationMs: number;       // Default: 30000
  sessionTimeoutMs: number;        // Default: 1800000 (30 min)
  debugMode: boolean;              // Enable security logs
}
```

**Source**: Environment variables via Vite define

## Validation Rules

### Password Validation

- Minimum 8 characters (build-time check)
- Must be pre-hashed (SHA-256 or better)
- No default values allowed
- Constant-time comparison required

### Encryption Validation

- IV must be 12 bytes (96 bits) for AES-GCM
- Salt must be at least 16 bytes (128 bits)
- Ciphertext must be base64 encoded
- Timestamp required for freshness check

### Rate Limit Validation

- Max 5 attempts per 30-second window
- Exponential backoff: 2^n seconds (max 30s)
- Lockout persists across refreshes
- Reset on successful authentication

### Message Validation

- Signature must verify with shared key
- Timestamp must be within 5 seconds
- Nonce must be unique (prevent replay)
- Type must be whitelisted

## State Transitions

### Authentication State Machine

```
LOCKED → (password attempt) → CHECKING
CHECKING → (success) → UNLOCKED
CHECKING → (failure < max) → LOCKED
CHECKING → (failure >= max) → RATE_LIMITED
RATE_LIMITED → (timeout) → LOCKED
UNLOCKED → (logout) → LOCKED
```

### Session State Machine

```
NO_SESSION → (login) → ACTIVE
ACTIVE → (activity) → ACTIVE
ACTIVE → (30 min idle) → EXPIRED
ACTIVE → (logout) → NO_SESSION
EXPIRED → (any action) → NO_SESSION
```

## Migration Strategy

### Backward Compatibility

1. Check for encrypted session format
2. If plain format found, encrypt and update
3. Log migration event
4. Clear plain data

```typescript
function migrateSession(): void {
  const raw = sessionStorage.getItem('qd/session');
  if (raw && !isEncrypted(raw)) {
    const encrypted = encryptSession(JSON.parse(raw));
    sessionStorage.setItem('qd/session', JSON.stringify(encrypted));
    logSecurityEvent('SESSION_MIGRATED');
  }
}
```

### Feature Flags

```typescript
const FEATURES = {
  ENCRYPTION: import.meta.env.VITE_ENABLE_ENCRYPTION !== 'false',
  RATE_LIMITING: import.meta.env.VITE_ENABLE_RATE_LIMIT !== 'false',
  SECURITY_LOGS: import.meta.env.VITE_ENABLE_SECURITY_LOGS === 'true'
};
```

## Storage Quotas

### Size Estimates

- EncryptedSession: ~2KB per session
- RateLimitState: ~1KB per user
- SecurityEventLog: ~500 bytes per event × 1000 = 500KB max
- DOMCache: Negligible (WeakMap)

### Total Impact

- sessionStorage: +2KB (encrypted vs plain)
- localStorage: +1KB (rate limit state)
- IndexedDB: +500KB (security logs)
- **Total**: ~503KB additional storage

## Performance Impact

### Encryption Overhead

- Key derivation: 50-200ms (intentionally slow)
- Encryption: <10ms per operation
- Decryption: <10ms per operation
- Total session create: ~250ms (acceptable)

### Validation Overhead

- Message signature: <5ms
- Rate limit check: <1ms
- Constant-time compare: <10ms
- Total auth attempt: ~15ms (negligible)

## Security Considerations

### Key Management

- Session key derived from session ID
- Never store keys in code or storage
- Keys exist only in memory
- New key per session

### Sensitive Data Handling

- Never log PII in plain text
- Sanitize all error messages
- Use error codes instead of details
- Clear sensitive data on logout

### Attack Surface Reduction

- No eval or Function constructor
- No dynamic script injection
- No inline event handlers
- All user input sanitized

## Testing Requirements

### Unit Tests

- Encryption/decryption round trip
- Rate limit state transitions
- Message signature verification
- Constant-time comparison

### Integration Tests

- Session migration from plain to encrypted
- Cross-tab message validation
- Storage quota handling
- Feature flag toggling

### Security Tests

- XSS payload sanitization
- Timing attack resistance
- Replay attack prevention
- Brute force protection