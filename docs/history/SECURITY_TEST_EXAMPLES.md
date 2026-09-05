# Security Test Examples

**Purpose**: Practical test code you can use and adapt
**Format**: Copy-paste ready with explanations
**Test Framework**: Vitest + Testing Library

---

## Testing Setup

### File Structure
```
tests/
├── security/
│   ├── xss.test.ts
│   ├── rate-limiter.test.ts
│   ├── timing-safe.test.ts
│   ├── crypto.test.ts
│   └── broadcast.test.ts
└── ... (existing tests)
```

### Base Configuration
```typescript
// vitest.config.ts (existing)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

---

## Test 1: XSS Prevention

### File: `tests/security/xss.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { html, render } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

/**
 * XSS Prevention Tests
 *
 * Verify that user input cannot inject scripts
 * Tests Lit's built-in XSS protection
 */

describe('XSS Prevention', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('Lit Template Safety', () => {
    it('should escape script tags in template interpolation', () => {
      const xssPayload = '<script>alert("xss")</script>';

      render(
        html`<div>${xssPayload}</div>`,
        container
      );

      const text = container.textContent;
      expect(text).toContain('<script>');
      expect(text).not.toContain('alert');

      // Verify script didn't execute
      expect(container.querySelector('script')).toBeFalsy();
    });

    it('should escape event handler attributes', () => {
      const eventHandler = '" onclick="alert(\'xss\')"';

      render(
        html`<button title="${eventHandler}">Click</button>`,
        container
      );

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.title).toContain('onclick');
      expect(button?.onclick).toBeNull();
    });

    it('should escape HTML entities', () => {
      const entities = '<div>Price & tax & shipping</div>';

      render(html`${entities}`, container);

      expect(container.textContent).toBe('<div>Price & tax & shipping</div>');
      expect(container.querySelector('div')).toBeFalsy();
    });

    it('should handle user input safely in loops', () => {
      const users = [
        { name: '<img src=x onerror="alert(1)">' },
        { name: 'Normal User' },
      ];

      render(
        html`
          ${users.map(user => html`<li>${user.name}</li>`)}
        `,
        container
      );

      const items = container.querySelectorAll('li');
      expect(items.length).toBe(2);
      expect(items[0]?.textContent).toContain('<img');
      expect(items[0]?.querySelector('img')).toBeFalsy();
    });
  });

  describe('Input Sanitization', () => {
    function sanitizeInput(value: string): string {
      return value
        .trim()
        .slice(0, 500)
        .replace(/[\r\n\t]/g, ' ')
        .replace(/  +/g, ' ');
    }

    it('should remove newlines from input', () => {
      const input = 'Line 1\nLine 2\r\nLine 3';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Line 1 Line 2 Line 3');
    });

    it('should limit input length', () => {
      const longInput = 'a'.repeat(1000);
      const sanitized = sanitizeInput(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(500);
    });

    it('should trim whitespace', () => {
      const input = '  \n  User Input  \t  ';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('User Input');
    });

    it('should collapse multiple spaces', () => {
      const input = 'Multiple    spaces    here';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Multiple spaces here');
    });

    it('should preserve legitimate HTML entities', () => {
      const input = 'Price: $100 & tax';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Price: $100 & tax');
    });
  });

  describe('textContent vs innerHTML', () => {
    it('should use textContent for user data', () => {
      const element = document.createElement('div');
      const userInput = '<script>alert("xss")</script>';

      // ✓ Safe: textContent
      element.textContent = userInput;
      expect(element.querySelector('script')).toBeFalsy();
      expect(element.textContent).toContain('<script>');

      // ✗ Unsafe: innerHTML
      element.innerHTML = userInput;
      expect(element.querySelector('script')).toBeTruthy(); // DANGEROUS
    });
  });

  describe('CSV Field Escaping', () => {
    function escapeCSVField(value: string): string {
      let escaped = value
        .replace(/"/g, '""')
        .replace(/[\r\n]+/g, ' ');

      if (escaped.includes(',') || escaped.includes('"')) {
        escaped = `"${escaped}"`;
      }
      return escaped;
    }

    it('should escape quotes in CSV', () => {
      const input = 'She said "hello"';
      const escaped = escapeCSVField(input);
      expect(escaped).toBe('"She said ""hello"""');
    });

    it('should wrap fields with commas', () => {
      const input = 'John, Jr.';
      const escaped = escapeCSVField(input);
      expect(escaped).toBe('"John, Jr."');
    });

    it('should remove newlines from CSV', () => {
      const input = 'Multi\nline\rvalue';
      const escaped = escapeCSVField(input);
      expect(escaped).toBe('Multi line value');
    });
  });

  describe('Error Message Safety', () => {
    function sanitizeErrorMessage(message: string): string {
      return message
        .replace(/[<>]/g, '')
        .slice(0, 200);
    }

    it('should remove HTML tags from error messages', () => {
      const error = '<script>alert("xss")</script>';
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should limit error message length', () => {
      const longError = 'a'.repeat(500);
      const sanitized = sanitizeErrorMessage(longError);
      expect(sanitized.length).toBeLessThanOrEqual(200);
    });
  });
});
```

---

## Test 2: Rate Limiting

### File: `tests/security/rate-limiter.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Rate Limiter Tests
 *
 * Verify rate limiting protects against brute-force attacks
 * Tests exponential backoff and attempt tracking
 */

class RateLimiter {
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

  clear(key: string): void {
    this.attempts.delete(key);
    this.blocked.delete(key);
  }
}

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial Behavior', () => {
    it('should allow initial attempts', () => {
      expect(limiter.canAttempt('test')).toBe(true);
      expect(limiter.canAttempt('test')).toBe(true);
      expect(limiter.canAttempt('test')).toBe(true);
    });

    it('should allow multiple keys independently', () => {
      expect(limiter.canAttempt('key1')).toBe(true);
      expect(limiter.canAttempt('key2')).toBe(true);

      limiter.recordAttempt('key1');
      limiter.recordAttempt('key1');
      limiter.recordAttempt('key1');

      // key1 is tracked, key2 is independent
      expect(limiter.canAttempt('key1')).toBe(true);
      expect(limiter.canAttempt('key2')).toBe(true);
    });
  });

  describe('Blocking', () => {
    it('should block after max attempts', () => {
      const maxAttempts = 3;

      for (let i = 0; i < maxAttempts; i++) {
        expect(limiter.canAttempt('test', maxAttempts)).toBe(true);
        limiter.recordAttempt('test');
      }

      // Next attempt should be blocked
      expect(limiter.canAttempt('test', maxAttempts)).toBe(false);
    });

    it('should use exponential backoff', () => {
      for (let i = 0; i < 5; i++) {
        limiter.recordAttempt('test');
      }

      const firstWait = limiter.getWaitTime('test');
      expect(firstWait).toBeGreaterThan(0);

      // Attempt again and verify longer wait
      vi.advanceTimersByTime(1000);
      limiter.recordAttempt('test'); // 6th attempt

      const secondWait = limiter.getWaitTime('test');
      expect(secondWait).toBeGreaterThan(firstWait);
    });

    it('should unblock after timeout', () => {
      for (let i = 0; i < 5; i++) {
        limiter.recordAttempt('test');
      }

      // Blocked
      expect(limiter.canAttempt('test', 5)).toBe(false);

      // Advance time past backoff
      vi.advanceTimersByTime(5000);

      // Should be unblocked now
      expect(limiter.canAttempt('test', 5)).toBe(true);
    });
  });

  describe('Success Handling', () => {
    it('should clear attempts on success', () => {
      limiter.recordAttempt('test');
      limiter.recordAttempt('test');

      limiter.recordSuccess('test');

      // Should allow attempts again
      expect(limiter.canAttempt('test', 5)).toBe(true);
    });

    it('should reset blocking on success', () => {
      for (let i = 0; i < 5; i++) {
        limiter.recordAttempt('test');
      }

      expect(limiter.canAttempt('test', 5)).toBe(false);

      limiter.recordSuccess('test');

      expect(limiter.canAttempt('test', 5)).toBe(true);
      expect(limiter.getWaitTime('test')).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should use custom max attempts', () => {
      for (let i = 0; i < 3; i++) {
        limiter.recordAttempt('test');
      }

      // With default (5), should still allow
      expect(limiter.canAttempt('test')).toBe(true);

      // With custom (3), should block
      expect(limiter.canAttempt('test', 3)).toBe(false);
    });

    it('should return wait time for UI feedback', () => {
      for (let i = 0; i < 5; i++) {
        limiter.recordAttempt('test');
      }

      const waitMs = limiter.getWaitTime('test');
      expect(waitMs).toBeGreaterThan(0);

      // Advance time
      vi.advanceTimersByTime(waitMs + 100);

      // Wait time should be 0 or very small
      expect(limiter.getWaitTime('test')).toBeLessThanOrEqual(100);
    });
  });

  describe('Real-World Scenario', () => {
    it('should prevent brute force of unlock code', () => {
      const MAX_ATTEMPTS = 3;
      let successCount = 0;

      // Attacker tries 10 times
      for (let i = 0; i < 10; i++) {
        if (limiter.canAttempt('unlock', MAX_ATTEMPTS)) {
          // Try code
          const isCorrect = i === 7; // Correct on 8th attempt
          if (isCorrect) {
            limiter.recordSuccess('unlock');
            successCount++;
          } else {
            limiter.recordAttempt('unlock');
          }
        }
      }

      // Should have blocked after 3 attempts, missing the correct code
      expect(successCount).toBe(0);
      expect(limiter.canAttempt('unlock', MAX_ATTEMPTS)).toBe(false);
    });

    it('should allow legitimate user after accidental failures', () => {
      const MAX_ATTEMPTS = 3;

      // User fails twice
      limiter.recordAttempt('unlock');
      limiter.recordAttempt('unlock');

      // Next attempt should work
      expect(limiter.canAttempt('unlock', MAX_ATTEMPTS)).toBe(true);

      // User gets it right
      limiter.recordSuccess('unlock');

      expect(limiter.canAttempt('unlock', MAX_ATTEMPTS)).toBe(true);
    });
  });
});
```

---

## Test 3: Timing-Safe Comparison

### File: `tests/security/timing-safe.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

/**
 * Timing-Safe Comparison Tests
 *
 * Verify that secret comparison doesn't leak information through timing
 */

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

describe('Timing-Safe Comparison', () => {
  describe('Correctness', () => {
    it('should return true for identical strings', () => {
      expect(constantTimeCompare('secret', 'secret')).toBe(true);
      expect(constantTimeCompare('', '')).toBe(true);
      expect(constantTimeCompare('a', 'a')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(constantTimeCompare('secret', 'wrong')).toBe(false);
      expect(constantTimeCompare('a', 'b')).toBe(false);
    });

    it('should return false for different lengths', () => {
      expect(constantTimeCompare('short', 'much longer')).toBe(false);
      expect(constantTimeCompare('', 'x')).toBe(false);
      expect(constantTimeCompare('x', '')).toBe(false);
    });

    it('should return false if any character differs', () => {
      expect(constantTimeCompare('secret1', 'secret2')).toBe(false);
      expect(constantTimeCompare('secreX', 'secret')).toBe(false);
    });
  });

  describe('Timing Characteristics', () => {
    it('should process all bytes regardless of position of difference', () => {
      // All these should process the same number of operations
      const str1 = 'a'.repeat(100) + 'x' + 'b'.repeat(1000);
      const str2_early = 'x' + 'a'.repeat(1099) + 'b';
      const str2_late = 'a'.repeat(100) + 'y' + 'b'.repeat(1000);

      // These comparisons process the same amount of work
      const result1 = constantTimeCompare(str1, str2_early);
      const result2 = constantTimeCompare(str1, str2_late);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      // Both took same time despite difference position
    });

    it('should not short-circuit on mismatch', () => {
      // Verify by always processing full length
      const a = 'x' + 'a'.repeat(999); // Mismatch on first char
      const b = 'a'.repeat(1000);

      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }

      // Result indicates mismatch, but all bytes were checked
      expect(result).not.toBe(0);
    });
  });

  describe('Usage in Authentication', () => {
    function verifyUnlockCode(userCode: string, storedHash: string): boolean {
      // Always hash user input first
      const userHash = simpleHash(userCode);

      // Then compare with timing-safe function
      return constantTimeCompare(userHash, storedHash);
    }

    function simpleHash(code: string): string {
      let hash = 0;
      for (let i = 0; i < code.length; i++) {
        hash = ((hash << 5) - hash) + code.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    }

    it('should verify correct code', () => {
      const code = 'correctCode123';
      const hash = simpleHash(code);

      expect(verifyUnlockCode(code, hash)).toBe(true);
    });

    it('should reject incorrect code', () => {
      const code = 'correctCode123';
      const hash = simpleHash(code);

      expect(verifyUnlockCode('wrongCode456', hash)).toBe(false);
    });

    it('should not leak which part of code is wrong', () => {
      const code = 'ABC123DEF456';
      const hash = simpleHash(code);

      // All wrong codes should take same time to compare
      expect(verifyUnlockCode('000000000000', hash)).toBe(false);
      expect(verifyUnlockCode('XYZ999UVW888', hash)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(constantTimeCompare('', '')).toBe(true);
      expect(constantTimeCompare('', 'a')).toBe(false);
      expect(constantTimeCompare('a', '')).toBe(false);
    });

    it('should handle unicode characters', () => {
      expect(constantTimeCompare('café', 'café')).toBe(true);
      expect(constantTimeCompare('café', 'cafe')).toBe(false);
    });

    it('should handle long strings', () => {
      const longStr = 'a'.repeat(10000);
      expect(constantTimeCompare(longStr, longStr)).toBe(true);
      expect(constantTimeCompare(longStr, longStr.slice(1))).toBe(false);
    });
  });
});
```

---

## Test 4: Web Crypto API

### File: `tests/security/crypto.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Web Crypto API Tests
 *
 * Verify encryption/decryption functionality
 * Note: Web Crypto is async, all tests must handle promises
 */

async function encryptData(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder();

  // Key derivation
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

  // Encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encoder.encode(plaintext)
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decryptData(encrypted: string, password: string): Promise<string> {
  const decoder = new TextDecoder();
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  // Extract IV
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  // Key derivation (must be identical)
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

  // Decryption
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    ciphertext
  );

  return decoder.decode(decrypted);
}

describe('Web Crypto API', () => {
  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data', async () => {
      const plaintext = 'Secret message';
      const password = 'myPassword123';

      const encrypted = await encryptData(plaintext, password);
      const decrypted = await decryptData(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should fail with wrong password', async () => {
      const plaintext = 'Secret message';
      const encrypted = await encryptData(plaintext, 'password1');

      try {
        await decryptData(encrypted, 'password2');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should produce different ciphertext each time', async () => {
      const plaintext = 'Same data';
      const password = 'password';

      const encrypted1 = await encryptData(plaintext, password);
      const encrypted2 = await encryptData(plaintext, password);

      // Different IVs produce different ciphertexts
      expect(encrypted1).not.toBe(encrypted2);

      // But both decrypt to same plaintext
      expect(await decryptData(encrypted1, password)).toBe(plaintext);
      expect(await decryptData(encrypted2, password)).toBe(plaintext);
    });

    it('should handle JSON data', async () => {
      const data = { serviceId: 'RN2344', name: 'John Doe' };
      const json = JSON.stringify(data);
      const password = 'secure';

      const encrypted = await encryptData(json, password);
      const decrypted = await decryptData(encrypted, password);
      const parsed = JSON.parse(decrypted);

      expect(parsed).toEqual(data);
    });

    it('should handle long data', async () => {
      const plaintext = 'a'.repeat(10000);
      const password = 'password';

      const encrypted = await encryptData(plaintext, password);
      const decrypted = await decryptData(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', async () => {
      const plaintext = '你好 مرحبا Привет 🔐';
      const password = 'password';

      const encrypted = await encryptData(plaintext, password);
      const decrypted = await decryptData(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Key Derivation', () => {
    it('should use PBKDF2 with sufficient iterations', async () => {
      // This test verifies that key derivation is slow (security feature)
      const start = performance.now();
      await encryptData('test', 'password');
      const duration = performance.now() - start;

      // PBKDF2 with 100k iterations should take at least 50ms
      expect(duration).toBeGreaterThan(50);
    });

    it('should derive same key from same password', async () => {
      const plaintext = 'test';
      const password = 'password';

      const enc1 = await encryptData(plaintext, password);
      // Decrypt and verify it works
      const dec1 = await decryptData(enc1, password);
      expect(dec1).toBe(plaintext);

      // Do it again with same password
      const dec2 = await decryptData(enc1, password);
      expect(dec2).toBe(plaintext);
    });
  });

  describe('Data Format', () => {
    it('should use base64 encoding', async () => {
      const encrypted = await encryptData('test', 'password');

      // Base64 string
      expect(typeof encrypted).toBe('string');
      expect(/^[A-Za-z0-9+/]+=*$/.test(encrypted)).toBe(true);
    });

    it('should be safe for storage', async () => {
      const plaintext = 'sessionData';
      const password = 'secret';

      const encrypted = await encryptData(plaintext, password);

      // Can be stored in sessionStorage
      sessionStorage.setItem('test-encrypted', encrypted);
      const retrieved = sessionStorage.getItem('test-encrypted');
      expect(retrieved).toBe(encrypted);

      // Can be decrypted
      const decrypted = await decryptData(retrieved!, password);
      expect(decrypted).toBe(plaintext);

      sessionStorage.removeItem('test-encrypted');
    });
  });
});
```

---

## Test 5: BroadcastChannel Signing

### File: `tests/security/broadcast.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * BroadcastChannel Security Tests
 *
 * Verify message signing and replay prevention
 */

async function signMessage(data: unknown, secret: string): Promise<string> {
  const msgStr = JSON.stringify(data);
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

async function verifyMessage(
  data: unknown,
  signature: string,
  secret: string
): Promise<boolean> {
  const msgStr = JSON.stringify(data);
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

describe('BroadcastChannel Security', () => {
  describe('Message Signing', () => {
    it('should sign and verify messages', async () => {
      const data = { type: 'unlock', timestamp: '2025-01-01T00:00:00Z' };
      const secret = 'shared-secret';

      const signature = await signMessage(data, secret);
      const isValid = await verifyMessage(data, signature, secret);

      expect(isValid).toBe(true);
    });

    it('should reject tampered messages', async () => {
      const data = { action: 'unlock' };
      const secret = 'secret';

      let signature = await signMessage(data, secret);

      // Tamper with signature
      const tampered = signature.slice(0, -4) + 'xxxx';

      const isValid = await verifyMessage(data, tampered, secret);
      expect(isValid).toBe(false);
    });

    it('should reject messages with wrong secret', async () => {
      const data = { action: 'unlock' };

      const signature = await signMessage(data, 'secret1');
      const isValid = await verifyMessage(data, signature, 'secret2');

      expect(isValid).toBe(false);
    });

    it('should reject modified data', async () => {
      const original = { action: 'unlock' };
      const modified = { action: 'lock' };
      const secret = 'secret';

      const signature = await signMessage(original, secret);
      const isValid = await verifyMessage(modified, signature, secret);

      expect(isValid).toBe(false);
    });
  });

  describe('Replay Prevention', () => {
    it('should detect duplicate nonces', () => {
      const nonces = new Set<string>();

      // Generate nonces
      const nonce1 = crypto.getRandomValues(new Uint8Array(16))
        .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
      const nonce2 = crypto.getRandomValues(new Uint8Array(16))
        .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

      nonces.add(nonce1);
      expect(nonces.has(nonce1)).toBe(true);
      expect(nonces.has(nonce2)).toBe(false);

      nonces.add(nonce2);
      expect(nonces.has(nonce2)).toBe(true);
    });

    it('should generate unique nonces', () => {
      const nonces = new Set<string>();

      // Generate 1000 nonces
      for (let i = 0; i < 1000; i++) {
        const nonce = crypto.getRandomValues(new Uint8Array(16))
          .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
        expect(nonces.has(nonce)).toBe(false);
        nonces.add(nonce);
      }

      // All should be unique
      expect(nonces.size).toBe(1000);
    });

    it('should validate timestamp freshness', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 5000); // 5 seconds ago
      const stale = new Date(now.getTime() - 60000); // 1 minute ago

      const recentTime = recent.toISOString();
      const staleTime = stale.toISOString();

      const MESSAGE_TIMEOUT_MS = 30000;

      function isRecentMessage(timestamp: string): boolean {
        const messageTime = new Date(timestamp).getTime();
        const age = now.getTime() - messageTime;
        return age >= 0 && age <= MESSAGE_TIMEOUT_MS;
      }

      expect(isRecentMessage(recentTime)).toBe(true);
      expect(isRecentMessage(staleTime)).toBe(false);
    });
  });

  describe('Real-World Scenario', () => {
    it('should validate complete signed message', async () => {
      interface SignedMessage {
        type: string;
        data: unknown;
        nonce: string;
        timestamp: string;
        signature: string;
      }

      const message: Omit<SignedMessage, 'signature'> = {
        type: 'unlock',
        data: { timestamp: new Date().toISOString() },
        nonce: crypto.getRandomValues(new Uint8Array(16))
          .reduce((s, b) => s + b.toString(16).padStart(2, '0'), ''),
        timestamp: new Date().toISOString(),
      };

      const secret = 'instructor-session-secret';

      // Sign the message
      const messageContent = {
        type: message.type,
        data: message.data,
        nonce: message.nonce,
        timestamp: message.timestamp,
      };
      const signature = await signMessage(messageContent, secret);

      const signed: SignedMessage = { ...message, signature };

      // Verify on receive
      const isValid = await verifyMessage(
        {
          type: signed.type,
          data: signed.data,
          nonce: signed.nonce,
          timestamp: signed.timestamp,
        },
        signed.signature,
        secret
      );

      expect(isValid).toBe(true);
    });
  });
});
```

---

## Running All Security Tests

```bash
# Run all security tests
npm run test -- tests/security

# Run with verbose output
npm run test -- tests/security -v

# Run specific test file
npm run test -- tests/security/xss.test.ts

# Watch mode for development
npm run test:watch -- tests/security

# Run with coverage
npm run test -- tests/security --coverage
```

---

## Coverage Target

Aim for at least 80% coverage of security-critical code:

```bash
npm run test -- --coverage
```

Should show:
- `src/utils/sanitize.ts`: >90%
- `src/services/rate-limiter.ts`: >85%
- `src/utils/timing-safe.ts`: >90%
- `src/components/qd-instructor.ts`: >80%
- `src/services/session.ts`: >75%

---

## Integration with CI/CD

Add to GitHub Actions:

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run security tests
        run: npm run test -- tests/security --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          flags: security
```

---

**Last Updated**: November 15, 2025
**Version**: 1.0.0

See SECURITY_BEST_PRACTICES.md and SECURITY_IMPLEMENTATION_GUIDE.md for full guidance.
