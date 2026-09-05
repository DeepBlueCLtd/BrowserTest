# Security Quick Reference Card

**Purpose**: One-page security checklist for developers
**Read Time**: 5 minutes
**Related Docs**: SECURITY_BEST_PRACTICES.md, SECURITY_IMPLEMENTATION_GUIDE.md

---

## Developer Security Checklist

### 🔑 Before Each Commit
- [ ] No `.env` files committed
- [ ] No `console.log()` of passwords/secrets
- [ ] All user input sanitized before use
- [ ] All tests passing locally
- [ ] `npm run audit:secrets` passes

### 🛡️ Handling User Input
```typescript
// ALWAYS do this
const safe = sanitizeInput(userInput);     // Trim, limit length
html`<div>${safe}</div>`;                   // Lit auto-escapes

// NEVER do this
element.innerHTML = userInput;              // XSS vulnerability
const code = 'x' + userInput + 'y';        // String concatenation
eval(userInput);                            // Code injection
```

### 🔐 Authentication & Secrets
```typescript
// ✓ DO: Inject at build time
// vite.config.ts
define: {
  __UNLOCK_HASH__: JSON.stringify(env.UNLOCK_HASH)
}

// ✗ DON'T: Hardcode or expose
const SECRET = 'my-secret';                // Wrong
console.log(password);                      // Wrong
const code = process.env.UNLOCK_CODE;      // Wrong (visible in bundle)
```

### ⏱️ Rate Limiting
```typescript
// Check limit BEFORE action
if (!rateLimiter.canAttempt('key')) {
  return showError('Too many attempts');
}

// Record attempt result
if (success) {
  rateLimiter.recordSuccess('key');
} else {
  rateLimiter.recordAttempt('key');
}
```

### 🔄 Timing-Safe Comparison
```typescript
// ✓ DO: Constant-time comparison
if (constantTimeCompare(userCode, storedHash)) {
  unlockFeature();
}

// ✗ DON'T: Early exit comparison
if (userCode === storedHash) {              // Timing attack
  unlockFeature();
}
```

### 💬 Cross-Tab Messaging
```typescript
// Only send signed messages with nonce
const msg = {
  type: 'unlock',
  data: { /* ... */ },
  nonce: crypto.getRandomValues(new Uint8Array(16)),
  signature: await signMessage(data, secret)
};

// Verify signature & nonce before processing
if (!verifyMessage(msg.data, msg.signature, secret)) {
  return; // Reject
}
if (seenNonces.has(msg.nonce)) {
  return; // Replay attack
}
```

---

## Security Checklist by Phase

### Phase: Initial Setup (Week 1)
- [ ] Create `.env.example` with placeholders
- [ ] Add `.env` to `.gitignore`
- [ ] Add `audit:secrets` script to build
- [ ] Review all components for `innerHTML` usage
- [ ] Add `sanitizeInput()` function

**Test**: `npm run build && npm run audit:secrets`

### Phase: Enhanced Input (Week 2)
- [ ] Apply `sanitizeInput()` to all user input
- [ ] Test XSS payloads don't render
- [ ] Add rate limiting to auth attempts
- [ ] Implement `constantTimeCompare()`

**Test**: `npm run test -- xss rate-limiter timing-safe`

### Phase: Optional Encryption (Week 3)
- [ ] Implement Web Crypto utilities
- [ ] Add encryption to sessionStorage (optional)
- [ ] Test encrypt/decrypt roundtrip
- [ ] Add BroadcastChannel signing (optional)

**Test**: `npm run test -- crypto broadcast`

### Phase: Audit & Deploy (Week 4)
- [ ] Run full test suite: `npm run test`
- [ ] Run linting: `npm run lint`
- [ ] Run format check: `npm run format:check`
- [ ] Verify bundle: `npm run size-check`
- [ ] Audit secrets: `npm run audit:secrets`
- [ ] Final security review with team

**Deploy**: Merge to main after approval

---

## Common Security Patterns

### Pattern 1: User Input → Store → Display
```typescript
// Step 1: Sanitize
const clean = sanitizeInput(userInput);

// Step 2: Store
await storage.save(key, clean);

// Step 3: Display (Lit auto-escapes)
html`<div>${clean}</div>`
```

### Pattern 2: Rate-Limited Action
```typescript
const limiter = getRateLimiter();
if (!limiter.canAttempt('action-key')) {
  return showError('Try again later');
}

const result = await doAction();
if (result.success) {
  limiter.recordSuccess('action-key');
} else {
  limiter.recordAttempt('action-key');
}
```

### Pattern 3: Secret Verification
```typescript
// Compare using constant-time function
const matches = constantTimeCompare(
  await hashInput(userCode),
  __STORED_HASH__
);

if (matches) {
  // Success
} else {
  // Failure (don't leak which char was wrong)
}
```

### Pattern 4: Secure Storage
```typescript
// Plain text (default)
sessionStorage.setItem('qd/session', JSON.stringify(data));

// Encrypted (optional)
const encrypted = await encryptData(JSON.stringify(data), password);
sessionStorage.setItem('qd/session-enc', encrypted);
```

---

## Dangerous Code Patterns

| Pattern | Risk | Fix |
|---------|------|-----|
| `element.innerHTML = userInput` | XSS | Use `textContent` or Lit templates |
| `if (a === b)` for secrets | Timing leak | Use `constantTimeCompare(a, b)` |
| Hardcoded `password = 'x'` | Credential leak | Use `.env` + Vite `define` |
| `new Function(userInput)` | Code injection | Never do this |
| `eval(userInput)` | Code injection | Never do this |
| No rate limiting on auth | Brute force | Use `RateLimiter` class |
| Unencrypted secrets in bundle | Exposure | Use build-time injection |
| Unsigned BroadcastChannel msgs | Tampering | Add HMAC signature |
| Replayed messages | Hijacking | Add nonce + timestamp |

---

## Test Commands Quick Reference

```bash
# All security tests
npm run test -- security

# XSS prevention tests
npm run test -- xss

# Rate limiting tests
npm run test -- rate-limiter

# Timing attack tests
npm run test -- timing-safe

# Crypto tests (if implemented)
npm run test -- crypto

# Watch mode for development
npm run test:watch

# Full test suite
npm run test

# Lint security issues
npm run lint

# Check formatting
npm run format:check

# Verify bundle size and secrets
npm run build && npm run audit:secrets
```

---

## Security Decision Tree

### Should I encrypt this data?
```
Is it in IndexedDB?
├─ Yes → Sensitive data? → Yes → Consider encryption
└─ No → Is it in sessionStorage?
        └─ Yes → Login/auth tokens? → Yes → Consider encryption
```

### Should I use rate limiting?
```
Is it an authentication attempt?
├─ Yes → YES, use rate limiting
└─ No → Is it a sensitive action? (unlock, admin)
        └─ Yes → YES, consider rate limiting
```

### Should I use timing-safe comparison?
```
Am I comparing secrets/codes?
├─ Yes → YES, use constantTimeCompare()
└─ No → OK to use ===
```

### Should I sanitize this input?
```
Is it user-provided?
├─ Yes → Will it be displayed/stored?
│        ├─ Yes → YES, sanitize
│        └─ No → Still sanitize for safety
└─ No → OK to skip
```

---

## Browser Compatibility Matrix

| Feature | Chrome 96+ | Firefox 102+ | Edge 96+ | Support |
|---------|---|---|---|---|
| Lit Web Components | ✓ | ✓ | ✓ | 100% |
| Web Crypto API | ✓ | ✓ | ✓ | 100% |
| BroadcastChannel | ✓ | ✓ | ✓ | 100% |
| sessionStorage | ✓ | ✓ | ✓ | 100% |
| IndexedDB | ✓ | ✓ | ✓ | 100% |
| TextEncoder | ✓ | ✓ | ✓ | 100% |
| crypto.getRandomValues | ✓ | ✓ | ✓ | 100% |

**Note**: All security features are supported across target browsers without polyfills.

---

## Red Flags 🚨

### Code Review Red Flags
- [ ] `innerHTML` with user data
- [ ] `eval()` or `Function()` constructors
- [ ] Hardcoded passwords/API keys
- [ ] `process.env.SECRET` in production code
- [ ] Direct string equality for secrets: `===`
- [ ] No input validation/sanitization
- [ ] Unencrypted sensitive data in sessionStorage
- [ ] Unsigned/unsigned BroadcastChannel messages
- [ ] No rate limiting on sensitive actions
- [ ] Console.log of sensitive data

### If You See These, Stop and Review:
1. Any hardcoded credential
2. `innerHTML` with user input
3. `eval` or `Function` with untrusted data
4. Direct secret comparison without `constantTimeCompare`
5. Missing rate limiting on auth attempts

---

## Getting Help

### For Implementation Questions
1. Check SECURITY_BEST_PRACTICES.md (detailed explanations)
2. Check SECURITY_IMPLEMENTATION_GUIDE.md (code examples)
3. Review tests in `tests/security/`

### For Code Review
1. Use this checklist before requesting review
2. Ask reviewer to check "Dangerous Code Patterns"
3. Run `npm run lint` and `npm run format:check` first

### For Security Issues
1. Do NOT post in public issues
2. Use GitHub Security Advisory
3. Follow responsible disclosure

---

## Environment Setup (First Time)

```bash
# 1. Copy example
cp .env.example .env

# 2. Add actual secrets (locally only)
echo 'INSTRUCTOR_UNLOCK_HASH=...' >> .env

# 3. Verify .env in gitignore
grep "^\.env$" .gitignore

# 4. Do NOT commit .env
git check-ignore .env

# 5. Build and verify
npm run build
npm run audit:secrets
```

---

## Performance Impact

These security measures have minimal performance impact:

| Feature | Impact | Notes |
|---------|--------|-------|
| Input sanitization | <1ms | Per input event |
| Rate limiting | <1ms | In-memory check |
| Constant-time comparison | <10ms | Full string length |
| Web Crypto (encrypt) | 50-200ms | PBKDF2 is intentionally slow |
| Web Crypto (decrypt) | 50-200ms | Same derivation time |
| HMAC signing | <5ms | Per message |
| BroadcastChannel | <1ms | Browser native |

**Result**: No noticeable performance degradation for end users.

---

## Offline-Specific Considerations

### Data Never Leaves Device ✓
- No network requests
- No telemetry
- No CDN
- No third-party services

### Encryption Effectiveness
- At-rest encryption: Good (data protection if device stolen)
- In-memory security: Limited (JavaScript can't prevent memory access)
- Thread isolation: Browser prevents access between origins

### Air-Gap Security
- No authentication server needed
- Rate limiting protects against local brute-force
- Timing attacks possible but mitigated
- XSS still major threat (local DoS possible)

---

## Quick Troubleshooting

| Problem | Check |
|---------|-------|
| "Secret exposed in build" | Verify .env file, run audit:secrets |
| "Rate limiter not blocking" | Check recordAttempt/recordSuccess calls |
| "XSS payload rendered" | Verify sanitizeInput is called |
| "Decryption fails" | Verify same password/salt |
| "Message signature fails" | Verify same secret in both tabs |
| "Tests failing" | Run `npm run test:unit` with -v flag |

---

## Pre-Commit Hook (Optional)

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Prevent committing .env
if git diff --cached --name-only | grep -E "\.env$"; then
  echo "❌ ERROR: .env file cannot be committed"
  exit 1
fi

# Run security checks
npm run lint || exit 1
npm run test -- security || exit 1

echo "✅ Pre-commit security checks passed"
```

Install:
```bash
chmod +x .git/hooks/pre-commit
```

---

**Last Updated**: November 15, 2025
**Version**: 1.0.0
**Maintainer**: Security Team

See SECURITY_BEST_PRACTICES.md for detailed guidance.
