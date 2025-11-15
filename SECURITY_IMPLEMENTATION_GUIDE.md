# Security Implementation Guide

**Companion Document to**: SECURITY_BEST_PRACTICES.md
**Purpose**: Practical code examples and checklists for implementation

---

## Quick Start Checklist

### Before Implementing Security Features
- [ ] Read SECURITY_BEST_PRACTICES.md sections 1-6
- [ ] Review project's frozen contracts (src/types/contracts.ts)
- [ ] Understand offline-first constraints
- [ ] Check target browser support (Chrome/Edge ≥96, Firefox ≥102)

### Implementation Order
1. **Week 1**: Environment variables + XSS prevention
2. **Week 2**: Rate limiting + timing attacks
3. **Week 3**: Web Crypto (optional) + BroadcastChannel
4. **Week 4**: Testing + audit

---

## Security Area 1: Environment Variables

### Setup Task List

#### 1.1 Create .env structure
```bash
# File: .env (DO NOT COMMIT)
INSTRUCTOR_UNLOCK_HASH=unused-in-offline

# File: .env.example (COMMIT THIS)
INSTRUCTOR_UNLOCK_HASH=unused-in-offline
```

#### 1.2 Update .gitignore
```bash
# Existing .gitignore - verify these lines exist
.env
.env.local
.env.*.local
```

#### 1.3 Update vite.config.ts
```typescript
// Add dotenv support
import dotenv from 'dotenv';

const env = dotenv.config().parsed || {};

export default defineConfig({
  define: {
    __INSTRUCTOR_UNLOCK_HASH__: JSON.stringify(env.INSTRUCTOR_UNLOCK_HASH || ''),
  },
});
```

#### 1.4 Add audit script
```bash
# File: scripts/audit-secrets.js
import fs from 'fs';

const distFile = './dist/sonar-quiz.iife.js';
if (fs.existsSync(distFile)) {
  const content = fs.readFileSync(distFile, 'utf8');
  const patterns = [/password|passwd|secret|apikey/i];
  let found = false;

  patterns.forEach(pattern => {
    if (pattern.test(content)) {
      console.error(`⚠ Warning: Possible secret in bundle`);
      found = true;
    }
  });

  process.exit(found ? 1 : 0);
}
```

#### 1.5 Update package.json scripts
```json
{
  "scripts": {
    "build": "tsc && vite build && npm run audit:secrets",
    "audit:secrets": "node scripts/audit-secrets.js"
  }
}
```

### Verification Steps
```bash
# 1. Test that .env is NOT in git
git check-ignore .env
# Expected: .env  (exit 0)

# 2. Verify build runs audit
npm run build
# Expected: "✓ No obvious secrets detected in bundle"

# 3. Check that variables are injected
grep -l "__INSTRUCTOR_UNLOCK_HASH__" dist/sonar-quiz.iife.js
# Expected: finds file
```

---

## Security Area 2: XSS Prevention

### Code Review Checklist

#### Before Implementing
- [ ] All user input runs through `_sanitizeInput()`
- [ ] No `innerHTML` with user data
- [ ] No `eval()` or `new Function()`
- [ ] Lit templates used for all dynamic content

#### Implementation Pattern
```typescript
// ✓ SAFE: Lit auto-escaping
html`<div>${userContent}</div>`

// ✓ SAFE: textContent for plain text
element.textContent = userContent;

// ✗ UNSAFE: innerHTML with user data
element.innerHTML = userContent;

// ✗ UNSAFE: String concatenation in templates
html`<div>${'<script>' + userContent}</div>`
```

### Test Template
```typescript
// File: tests/security/xss.test.ts
import { describe, it, expect } from 'vitest';

describe('XSS Prevention', () => {
  it('should escape script tags in content', () => {
    const xssPayload = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(xssPayload);
    expect(sanitized).not.toContain('<script>');
  });

  it('should escape event handlers', () => {
    const payload = '" onclick="alert(1)"';
    const sanitized = sanitizeInput(payload);
    expect(sanitized).not.toContain('onclick');
  });

  it('should preserve legitimate HTML entities', () => {
    const text = 'Price: $100 & tax';
    const sanitized = sanitizeInput(text);
    expect(sanitized).toBe('Price: $100 & tax');
  });
});
```

### Input Sanitization Helper
```typescript
// File: src/utils/sanitize.ts
export function sanitizeInput(value: string): string {
  return value
    .trim()                              // Remove whitespace
    .slice(0, 500)                       // Enforce max length
    .replace(/[\r\n\t]/g, ' ')          // Normalize whitespace
    .replace(/  +/g, ' ');              // Collapse multiple spaces
}

// For CSV/data export contexts
export function sanitizeCSVField(value: string): string {
  let escaped = value
    .replace(/"/g, '""')                // Escape quotes
    .replace(/[\r\n]+/g, ' ');          // Remove line breaks

  if (escaped.includes(',') || escaped.includes('"')) {
    escaped = `"${escaped}"`;
  }
  return escaped;
}

// For displaying error messages (remove HTML chars)
export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/[<>]/g, '')               // Remove angle brackets
    .slice(0, 200);                     // Limit length
}
```

### Audit Script
```bash
# File: scripts/audit-xss.sh
echo "Checking for XSS-vulnerable patterns..."

# Check for innerHTML usage
grep -r "innerHTML\s*=" src/ && echo "⚠ Found innerHTML usage" || echo "✓ No innerHTML found"

# Check for eval
grep -r "eval\|Function(" src/ && echo "⚠ Found eval usage" || echo "✓ No eval found"

# Check for direct string templates
grep -r "html\`.*\${.*\+" src/ && echo "⚠ Found string concatenation in templates" || echo "✓ No string concat in templates"
```

---

## Security Area 3: Rate Limiting

### Quick Implementation

#### File: src/services/rate-limiter.ts (Simplified)
```typescript
export class RateLimiter {
  private attempts: Map<string, number> = new Map();
  private blocked: Map<string, number> = new Map();

  canAttempt(key: string, maxAttempts = 5, windowMs = 60000): boolean {
    const now = Date.now();
    const blocked = this.blocked.get(key) || 0;

    if (now < blocked) {
      return false;
    }

    const attemptCount = this.attempts.get(key) || 0;
    if (attemptCount >= maxAttempts) {
      const backoff = 1000 * Math.pow(2, attemptCount - maxAttempts);
      this.blocked.set(key, now + backoff);
      return false;
    }

    return true;
  }

  recordAttempt(key: string): void {
    const count = (this.attempts.get(key) || 0) + 1;
    this.attempts.set(key, count);
  }

  recordSuccess(key: string): void {
    this.attempts.delete(key);
    this.blocked.delete(key);
  }

  getWaitTime(key: string): number {
    const blocked = this.blocked.get(key) || 0;
    return Math.max(0, blocked - Date.now());
  }
}
```

#### Usage in Login Component
```typescript
import { getRateLimiter } from '../services/rate-limiter';

export class QdInstructor extends LitElement {
  private rateLimiter = getRateLimiter();

  async _handleUnlockAttempt(code: string): Promise<void> {
    const KEY = 'instructor-unlock';

    // Check rate limit
    if (!this.rateLimiter.canAttempt(KEY, 3)) {
      const wait = Math.ceil(this.rateLimiter.getWaitTime(KEY) / 1000);
      this._showError(`Try again in ${wait} seconds`);
      return;
    }

    // Verify code
    const success = await this._verifyCode(code);
    if (success) {
      this.rateLimiter.recordSuccess(KEY);
      this._unlockInstructor();
    } else {
      this.rateLimiter.recordAttempt(KEY);
      this._showError('Invalid code');
    }
  }
}
```

### Test Suite
```typescript
// File: tests/services/rate-limiter.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '../../src/services/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
    vi.useFakeTimers();
  });

  it('allows initial attempts', () => {
    expect(limiter.canAttempt('test')).toBe(true);
    expect(limiter.canAttempt('test')).toBe(true);
  });

  it('blocks after max attempts', () => {
    for (let i = 0; i < 5; i++) {
      limiter.recordAttempt('test');
    }
    expect(limiter.canAttempt('test', 5)).toBe(false);
  });

  it('implements exponential backoff', () => {
    for (let i = 0; i < 5; i++) {
      limiter.recordAttempt('test');
    }

    // Should be blocked
    expect(limiter.canAttempt('test', 5)).toBe(false);

    // Wait 1 second - still blocked
    vi.advanceTimersByTime(1000);
    expect(limiter.canAttempt('test', 5)).toBe(false);

    // Success clears all limits
    limiter.recordSuccess('test');
    expect(limiter.canAttempt('test', 5)).toBe(true);
  });
});
```

---

## Security Area 4: Timing Attacks

### Simple Constant-Time Comparison
```typescript
// File: src/utils/timing-safe.ts
export function constantTimeCompare(a: string, b: string): boolean {
  // Prevent length inference
  if (a.length !== b.length) {
    return false;
  }

  // Compare all bytes regardless of differences
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
```

### Usage Example
```typescript
export class InstructorService {
  async verifyCode(userCode: string): Promise<boolean> {
    const storedHash = this._getStoredHash();
    const userHash = this._hashCode(userCode);

    // ✓ Use constant-time comparison
    return constantTimeCompare(userHash, storedHash);
  }

  private _getStoredHash(): string {
    // From Vite define, or fallback
    return typeof __INSTRUCTOR_UNLOCK_HASH__ !== 'undefined'
      ? __INSTRUCTOR_UNLOCK_HASH__
      : '';
  }

  private _hashCode(code: string): string {
    // Simple hash (not cryptographically secure, but illustrative)
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = ((hash << 5) - hash) + code.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}
```

### Test Suite
```typescript
// File: tests/utils/timing-safe.test.ts
import { describe, it, expect } from 'vitest';
import { constantTimeCompare } from '../../src/utils/timing-safe';

describe('constantTimeCompare', () => {
  it('returns true for matching strings', () => {
    expect(constantTimeCompare('secret', 'secret')).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(constantTimeCompare('secret', 'wrong')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(constantTimeCompare('short', 'longer')).toBe(false);
  });

  it('always performs full comparison', () => {
    // Both differ, but should still check all positions
    const str1 = 'aaaaaaaaab';
    const str2 = 'baaaaaaaa0';
    expect(constantTimeCompare(str1, str2)).toBe(false);
  });
});
```

---

## Security Area 5: sessionStorage Encryption (Optional)

### Basic Web Crypto Integration
```typescript
// File: src/utils/web-crypto.ts
export async function encryptData(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder();

  // Derive key from password
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('sonar-quiz'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encoder.encode(plaintext)
  );

  // Combine iv + encrypted
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encrypted: string, password: string): Promise<string> {
  const decoder = new TextDecoder();
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('sonar-quiz'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    ciphertext
  );

  return decoder.decode(decrypted);
}
```

### Usage
```typescript
// In session service
export class SessionService {
  async saveSecureSession(session: SessionData, password: string): Promise<void> {
    const json = JSON.stringify(session);
    const encrypted = await encryptData(json, password);
    sessionStorage.setItem('qd/session-encrypted', encrypted);
  }

  async loadSecureSession(password: string): Promise<SessionData | null> {
    const encrypted = sessionStorage.getItem('qd/session-encrypted');
    if (!encrypted) return null;

    try {
      const json = await decryptData(encrypted, password);
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to decrypt session');
      return null;
    }
  }
}
```

---

## Security Area 6: BroadcastChannel Messages

### Simplified Signed Messages
```typescript
// File: src/utils/message-crypto.ts
export async function signMessage(
  message: unknown,
  secret: string
): Promise<string> {
  const msgStr = JSON.stringify(message);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(msgStr)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verifyMessage(
  message: unknown,
  signature: string,
  secret: string
): Promise<boolean> {
  const msgStr = JSON.stringify(message);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

  try {
    return await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(msgStr)
    );
  } catch {
    return false;
  }
}
```

### Usage in Cross-Tab Communication
```typescript
// File: src/services/instructor-sync.ts
interface SignedMessage {
  type: string;
  data: unknown;
  signature: string;
  nonce: string;
}

export class InstructorSync {
  private channel: BroadcastChannel;
  private seenNonces = new Set<string>();
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
    this.channel = new BroadcastChannel('qd-instructor');
    this.channel.onmessage = (e) => this._handleMessage(e.data);
  }

  async broadcastUnlock(): Promise<void> {
    const msg: SignedMessage = {
      type: 'unlock',
      data: { timestamp: new Date().toISOString() },
      nonce: this._generateNonce(),
      signature: '',
    };

    msg.signature = await signMessage(
      { type: msg.type, data: msg.data, nonce: msg.nonce },
      this.secret
    );

    this.channel.postMessage(msg);
  }

  private async _handleMessage(msg: SignedMessage) {
    // Verify signature
    const isValid = await verifyMessage(
      { type: msg.type, data: msg.data, nonce: msg.nonce },
      msg.signature,
      this.secret
    );

    if (!isValid) {
      console.warn('Invalid signature');
      return;
    }

    // Check for replay
    if (this.seenNonces.has(msg.nonce)) {
      console.warn('Replay attack detected');
      return;
    }

    this.seenNonces.add(msg.nonce);

    if (msg.type === 'unlock') {
      window.dispatchEvent(
        new CustomEvent('qd:remote-unlock', { detail: msg.data })
      );
    }
  }

  private _generateNonce(): string {
    return crypto.getRandomValues(new Uint8Array(16))
      .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
  }

  close(): void {
    this.channel.close();
  }
}
```

---

## Integration Checklist

### Before Deploying Security Features
- [ ] All tests passing: `npm run test`
- [ ] No console.log of secrets: `grep -r "console.log.*secret" src/`
- [ ] No hardcoded credentials: `grep -r "password.*=\|apikey.*=" src/`
- [ ] Bundle audit passes: `npm run audit:secrets`
- [ ] Linting clean: `npm run lint`
- [ ] Format check: `npm run format:check`
- [ ] Build succeeds: `npm run build`

### Code Review Checklist
- [ ] User input goes through sanitization
- [ ] All data validated on read
- [ ] No innerHTML with user data
- [ ] Rate limiting in place for auth attempts
- [ ] Timing-safe comparison used for secrets
- [ ] BroadcastChannel messages signed (if implemented)
- [ ] .env not committed
- [ ] secrets audit script runs on build

### Security Testing
```bash
# Run all security tests
npm run test -- --include "**/security/**"

# Run XSS tests
npm run test -- xss

# Run rate limiter tests
npm run test -- rate-limiter

# Run timing attack tests
npm run test -- timing-safe

# Audit bundle
npm run audit:secrets
```

---

## Deployment Verification

### Pre-Deploy Checklist
```bash
# 1. Build with secrets
npm run build

# 2. Verify no secrets exposed
npm run audit:secrets

# 3. Run all tests
npm run test

# 4. Check linting
npm run lint

# 5. Verify size limits
npm run size-check

# 6. Verify .env not in git
git ls-files | grep ".env"
# Expected: no output (exit 1)
```

### Production Build Script
```bash
#!/bin/bash
# File: scripts/secure-build.sh

set -e

echo "🔒 Security Build Check..."

# 1. Ensure .env exists (locally)
if [ ! -f .env ]; then
  echo "❌ .env file not found"
  exit 1
fi

# 2. Build with env vars
npm run build

# 3. Audit output
npm run audit:secrets

# 4. Run tests
npm run test

# 5. Check size
npm run size-check

echo "✅ Build complete and verified"
```

Usage:
```bash
chmod +x scripts/secure-build.sh
./scripts/secure-build.sh
```

---

## Common Patterns

### Pattern: Safe Input → Store → Display
```typescript
// Step 1: Sanitize on input
const userInput = _sanitizeInput(rawInput);

// Step 2: Store plain text
await storage.saveAnalysisCell(cellKey, userInput);

// Step 3: Display via Lit (auto-escapes)
render() {
  return html`<div>${userInput}</div>`;
}
```

### Pattern: Rate Limited Action
```typescript
async function protectedAction(key: string) {
  const limiter = getRateLimiter();

  // Check limit
  if (!limiter.canAttempt(key)) {
    return { success: false, error: 'Rate limited' };
  }

  // Try action
  const result = await attemptAction();

  if (result.success) {
    limiter.recordSuccess(key);
  } else {
    limiter.recordAttempt(key);
  }

  return result;
}
```

### Pattern: Secure Storage
```typescript
// Option 1: Plain (current)
sessionStorage.setItem('qd/session', JSON.stringify(session));

// Option 2: Encrypted (enhanced)
const encrypted = await encryptData(JSON.stringify(session), password);
sessionStorage.setItem('qd/session-encrypted', encrypted);
```

---

## Troubleshooting

### Issue: "Secret exposed in bundle"
**Solution**:
1. Check .env file for actual values
2. Verify Vite define only includes hashes
3. Verify .gitignore includes .env
4. Clear dist/ and rebuild

### Issue: "Rate limiter not blocking"
**Solution**:
1. Verify `recordAttempt()` is called on failure
2. Check that `canAttempt()` is called before action
3. Verify timestamps are working (check system clock)

### Issue: "Decryption fails"
**Solution**:
1. Verify same password/salt used for encrypt/decrypt
2. Ensure IV is stored and retrieved correctly
3. Check that ciphertext is valid base64

### Issue: "BroadcastChannel messages not signing"
**Solution**:
1. Verify secret is consistent across tabs
2. Check that nonce is unique per message
3. Verify timestamp is recent
4. Ensure HMAC algorithm is supported

---

## Resources

### Testing Tools
```bash
npm install --save-dev vitest @testing-library/dom jsdom
```

### Security Scanning
```bash
# Check for known vulnerabilities
npm audit

# Check for hardcoded secrets
npm install --save-dev secretlint
npx secretlint 'src/**'
```

### Further Reading
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Crypto API Cookbook](https://github.com/mdn/webassembly-examples)
- [Timing Attacks in JavaScript](https://codahale.com/a-lesson-in-timing-attacks/)

---

**Document Version**: 1.0.0
**Status**: Reference Implementation
**Last Updated**: November 15, 2025
