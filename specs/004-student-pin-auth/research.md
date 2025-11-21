# Research: Student PIN Authentication

**Date**: 2025-11-21
**Feature**: Student PIN Authentication
**Research Focus**: Security best practices for PIN implementation in browser environment

## Key Decisions

### 1. PIN Hashing Algorithm

**Decision**: Use Web Crypto API with SHA-256 for PIN hashing

**Rationale**:
- Native browser API, no additional dependencies
- Sufficient for 4-digit PIN protection (10,000 possible combinations)
- Fast execution (<10ms per hash)
- Widely supported in target browsers

**Alternatives Considered**:
- bcrypt.js: Rejected - adds 20KB to bundle, overkill for 4-digit PIN
- Plain text: Rejected - violates basic security principles
- Custom hash: Rejected - security through obscurity is not secure

### 2. Rate Limiting Storage

**Decision**: Use sessionStorage for rate limiting state

**Rationale**:
- Per-tab isolation prevents cross-tab attacks
- Automatically cleared on tab close
- No persistence needed beyond session
- Simple key-value storage sufficient

**Alternatives Considered**:
- IndexedDB: Rejected - unnecessary persistence, adds complexity
- In-memory: Rejected - lost on page refresh during session
- localStorage: Rejected - persists too long, shared across tabs

### 3. Schema Migration Strategy

**Decision**: Lazy migration on first login

**Rationale**:
- No batch processing needed
- Minimal code complexity
- User-driven timing (natural touchpoint)
- Preserves all existing data

**Alternatives Considered**:
- Batch migration on deploy: Rejected - requires admin intervention
- Parallel schema support: Rejected - increases code complexity
- Force recreation: Rejected - data loss unacceptable

### 4. PIN Input UX

**Decision**: Separate modal for PIN creation with confirmation

**Rationale**:
- Clear visual separation of security step
- Prevents accidental submission
- Allows for clear instructions
- Confirmation prevents typos

**Alternatives Considered**:
- Inline in login form: Rejected - cluttered UI, unclear flow
- Single PIN entry: Rejected - typo risk too high
- Auto-generate PIN: Rejected - students won't remember

### 5. Lockout Duration

**Decision**: 30-second lockout after 3 failed attempts

**Rationale**:
- Prevents brute force (max 6 attempts/minute)
- Not frustrating for legitimate users
- No permanent lockout (instructor availability uncertain)
- Simple countdown display

**Alternatives Considered**:
- Exponential backoff: Rejected - too complex for use case
- Permanent lockout: Rejected - requires instructor availability
- No lockout: Rejected - 10,000 PINs vulnerable to brute force

### 6. Constant-Time Comparison

**Decision**: Implement basic constant-time comparison for PIN verification

**Rationale**:
- Prevents timing attacks (academic environment = curious students)
- Minimal performance impact (<1ms)
- Industry best practice for auth checks
- Simple implementation with XOR comparison

**Alternatives Considered**:
- Direct string comparison: Rejected - vulnerable to timing attacks
- crypto.timingSafeEqual: Rejected - not available in browsers
- Server-side validation: Rejected - offline requirement

## Implementation Considerations

### Security
- Never log PIN values or hashes in console/debug output
- Clear PIN input fields immediately after processing
- Use `autocomplete="off"` on PIN input fields
- Disable browser password managers for PIN fields

### Performance
- Cache hashed PIN in memory during session (don't re-hash)
- Rate limit checks should be O(1) lookups
- Migration check only on first login attempt

### Accessibility
- Clear error messages for screen readers
- Keyboard navigation for all PIN inputs
- Focus management during modal transitions
- ARIA labels for PIN input purpose

### Browser Compatibility
- Web Crypto API supported in all target browsers
- SessionStorage has 5MB limit (sufficient for rate limiting)
- No polyfills needed for core functionality

## Resolved Clarifications

All technical decisions have been made based on:
- Existing codebase patterns (Lit components, IndexedDB usage)
- Security best practices for browser-based authentication
- Offline-first requirement (no server validation possible)
- User experience in training environment (shared computers)

No remaining NEEDS CLARIFICATION items.