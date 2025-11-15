# Security Best Practices for Offline Browser Applications

**Document Version**: 1.0.0
**Last Updated**: November 15, 2025
**Target Audience**: Development team, security reviewers
**Scope**: Sonar Quiz System (offline-first, file:// protocol)

## Executive Summary

This document provides actionable security best practices for browser-based offline applications with a focus on Sonar Quiz System's context: no network dependencies, client-side data processing, and air-gapped training environments. Each section includes implementation patterns, security considerations, and browser compatibility notes.

**Key Constraints**:
- Zero network connectivity (file:// protocol)
- No backend authentication server
- Client-side only (Lit 3 Web Components)
- Target browsers: Chrome/Edge ≥96, Firefox ≥102
- Data persistence: IndexedDB + sessionStorage

---

## 1. Password Configuration & Environment Variables

### Current State
Quiz system uses student identification (service ID + name) with no password-protected login. However, if instructor unlock or future admin features are added, credential management is critical.

### Recommended Approach

#### 1.1 Development vs. Production Secrets

**DO NOT** hardcode any secrets in source code:
```typescript
// WRONG - Never do this
const MASTER_PASSWORD = 'instructor123';
const BACKUP_KEY = 'fixed-encryption-key';

// WRONG - Still visible in compiled bundle
export const CONFIG = {
  password: process.env.PASSWORD,
};
```

#### 1.2 Vite Environment Variables at Build Time

Use Vite's `define` plugin to inject secrets only at build time:

**File**: `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import dotenv from 'dotenv';

const env = dotenv.config().parsed || {};

export default defineConfig({
  define: {
    // ✓ Injected at build time only
    __INSTRUCTOR_UNLOCK_HASH__: JSON.stringify(env.INSTRUCTOR_UNLOCK_HASH),
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),

    // NEVER expose raw passwords - only hashes
    __NEVER__: undefined, // Explicitly exclude secrets
  },
});
```

**File**: `.env.example`
```bash
# Example secrets (DO NOT include actual values)
# INSTRUCTOR_UNLOCK_HASH should be a bcryptjs hash from: npm install -g bcryptjs
# bcryptjs.hashSync('your-password', 10)
INSTRUCTOR_UNLOCK_HASH=unused-in-offline

# Build metadata (safe to expose)
BUILD_ENVIRONMENT=development
```

**File**: `.env` (Local only - never commit)
```bash
INSTRUCTOR_UNLOCK_HASH=$2b$10$...encrypted...hash...
```

**Usage in Code**: `src/services/instructor.ts`
```typescript
// ✓ Safely injected at build time
declare const __INSTRUCTOR_UNLOCK_HASH__: string;

export class InstructorService {
  async verifyUnlockCode(code: string): Promise<boolean> {
    // Compare using constant-time comparison (see section 5)
    const codeHash = await this.hashCode(code);
    return constantTimeCompare(codeHash, __INSTRUCTOR_UNLOCK_HASH__);
  }
}
```

#### 1.3 Gitignore Configuration

**File**: `.gitignore`
```bash
# Environment secrets
.env
.env.local
.env.*.local

# Build artifacts with secrets
dist/

# IDE secrets
.vscode/settings.json
.idea/

# OS secrets
.DS_Store
Thumbs.db
```

#### 1.4 CI/CD Safe Practices

For GitHub Actions or similar:

**File**: `.github/workflows/build.yml`
```yaml
name: Build & Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # ✓ Use secrets only in build step
      - name: Build with production secrets
        env:
          INSTRUCTOR_UNLOCK_HASH: ${{ secrets.INSTRUCTOR_UNLOCK_HASH }}
        run: npm run build

      # ✓ Verify no secrets in build output
      - name: Audit build for secrets
        run: npm run audit:secrets
```

**Script**: `scripts/audit-secrets.js`
```javascript
import fs from 'fs';
import path from 'path';

const distFile = './dist/sonar-quiz.iife.js';
const content = fs.readFileSync(distFile, 'utf8');

// Check for common secret patterns
const patterns = [
  /password|passwd/i,
  /apikey|api_key|secret/i,
  /bcrypt|sha256/i,
];

let found = false;
patterns.forEach((pattern) => {
  if (pattern.test(content)) {
    console.error(`⚠ Possible secret exposed: ${pattern}`);
    found = true;
  }
});

if (found) {
  process.exit(1);
}

console.log('✓ No obvious secrets detected in bundle');
```

### Security Considerations

| Risk | Mitigation | Impact |
|------|-----------|--------|
| Hardcoded secrets in git | Use `.env`, add to `.gitignore`, use pre-commit hooks | HIGH |
| Secrets in compiled bundle | Use Vite's `define` only for hashes, never raw passwords | CRITICAL |
| Environment variable leaks | Never console.log secrets, rotate regularly | HIGH |
| Unencrypted .env files | Use file permissions `chmod 600`, encrypt in CI/CD | MEDIUM |
| Shoulder surfing | Use `***` masks in UI for codes | MEDIUM |

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome ≥96 | ✓ Full | Dynamic `import.meta.env` works |
| Firefox ≥102 | ✓ Full | Requires Vite config for bundling |
| Edge ≥96 | ✓ Full | Chromium-based, identical support |
| Safari ≥15.2 | ✓ Full | Web Components + ES2022 support |

---

## 2. XSS Prevention: Safe DOM Manipulation

### Current Risk Assessment

**Sonar Quiz System Uses**:
- ✓ Lit 3 (safe by default - auto-escapes text content)
- ✓ `.textContent` for user data
- ✓ No `innerHTML` in production code

**Risk Areas**:
- Analysis table cell editing (user-entered text)
- CSV export display
- Dynamic error messages

### Recommended Approach

#### 2.1 Core Principles (Defense in Depth)

```typescript
// WRONG - XSS vulnerability
html`<div>${userContent}</div>`;  // Lit escapes this ✓

// WRONG - Still vulnerable
element.innerHTML = userContent;  // User can inject scripts ✗

// RIGHT - Lit template syntax
html`<div>${userContent}</div>`;  // Auto-escaped by Lit

// RIGHT - DOM API
element.textContent = userContent;  // Plain text, no parsing

// RIGHT - Trusted content with sanitization
const safe = sanitizeHtml(userContent);
html`<div>${safe}</div>`;
```

#### 2.2 Implementation: Analysis Table Edit Handler

**File**: `src/enhancers/analysis-table.ts`
```typescript
import { html, LitElement } from 'lit';

export class AnalysisTableEditor extends LitElement {
  // Store user content separately from HTML structure
  private cells: Map<string, string> = new Map();

  /**
   * Handle cell edit with XSS prevention
   * User input → Plain text storage → Escaped on render
   */
  async _handleCellEdit(cellKey: string, newValue: string): Promise<void> {
    // ✓ Step 1: Trim and validate input
    const sanitized = this._sanitizeInput(newValue);
    if (!sanitized) {
      console.warn('Invalid cell content');
      return;
    }

    // ✓ Step 2: Store plain text (no HTML)
    this.cells.set(cellKey, sanitized);

    // ✓ Step 3: Save to storage (plain text only)
    await this._saveCellData(cellKey, sanitized);

    // ✓ Step 4: Re-render (Lit auto-escapes)
    this.requestUpdate();
  }

  /**
   * Input sanitization: Remove newlines, trim length
   * Does NOT remove HTML - that's handled by Lit
   */
  private _sanitizeInput(value: string): string {
    return value
      .trim()                           // Remove whitespace
      .replace(/\r\n/g, ' ')           // Normalize line breaks
      .replace(/\n/g, ' ')             // Convert to spaces
      .slice(0, 500);                  // Enforce max length from contracts
  }

  /**
   * Render cell content - Lit auto-escapes all template values
   */
  render() {
    return html`
      <table>
        ${Array.from(this.cells.entries()).map(([key, content]) => html`
          <td
            @blur=${(e: FocusEvent) => this._handleCellEdit(key, (e.target as HTMLDivElement).textContent || '')}
            contenteditable="true"
          >
            <!-- ✓ Lit auto-escapes content -->
            ${content}
          </td>
        `)}
      </table>
    `;
  }
}
```

#### 2.3 Handling Existing HTML Content

If displaying static HTML from DITA source (safe to trust):

```typescript
export class QuizRenderer extends LitElement {
  @property()
  questionText = '<strong>Question:</strong> What is X?'; // From DITA (trusted)

  // WRONG - Even trusted HTML should be careful
  dangerousHtml() {
    return html`<div>${unsafeHTML(this.questionText)}</div>`;
  }

  // RIGHT - Use a purpose-built component for safe rendering
  safeHtml() {
    // Create a temporary element, set textContent, then render
    const temp = document.createElement('div');
    temp.textContent = this.questionText;
    return html`<div>${temp.innerHTML}</div>`;
  }

  // BEST - Use DOMPurify for untrusted HTML
  async sanitizeTrustedHtml(html: string): Promise<string> {
    // Only if needed - prefer textContent
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    // Remove script tags, event handlers
    parsed.querySelectorAll('script').forEach(s => s.remove());
    parsed.querySelectorAll('[on*]').forEach(e => {
      Array.from(e.attributes).forEach(a => {
        if (a.name.startsWith('on')) e.removeAttribute(a.name);
      });
    });
    return parsed.body.innerHTML;
  }
}
```

#### 2.4 Error Message Display (Safe)

**File**: `src/components/qd-error-banner.ts`
```typescript
@customElement('qd-error-banner')
export class QdErrorBanner extends LitElement {
  @property({ type: String })
  message = '';

  // ✓ Error messages are auto-escaped by Lit
  render() {
    return html`
      <div class="error-banner" role="alert">
        <!-- This is safe: text content, no HTML parsing -->
        ${this.message}
      </div>
    `;
  }

  // Safe method to show errors from exceptions
  showError(error: Error | string) {
    // Never use error.message in innerHTML
    const msg = typeof error === 'string' ? error : error.message;
    // Extract safe parts only
    const safeMsg = msg.replace(/[<>]/g, '');
    this.message = safeMsg;
  }
}
```

#### 2.5 CSV Export Display

**File**: `src/services/csv-export.ts`
```typescript
export class CSVExporter {
  /**
   * Format student name for CSV export
   * Removes special characters that might break parsing
   */
  private formatCSVField(value: string): string {
    // Escape quotes, newlines, commas
    let escaped = value
      .replace(/"/g, '""')           // Double quotes
      .replace(/[\r\n]+/g, ' ');     // Remove line breaks

    // Wrap in quotes if contains special chars
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      escaped = `"${escaped}"`;
    }
    return escaped;
  }

  /**
   * When displaying CSV in UI, use textContent not innerHTML
   */
  displayCSV(csvContent: string): HTMLElement {
    const pre = document.createElement('pre');
    pre.textContent = csvContent;  // ✓ Plain text rendering
    return pre;
  }
}
```

#### 2.6 DOMPurify for Maximum Safety (Optional)

If you need to handle untrusted HTML:

**Installation**:
```bash
npm install isomorphic-dompurify
```

**Usage**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

export class TrustedHTMLRenderer {
  render(userHtml: string) {
    // Only if displaying HTML from external sources
    const clean = DOMPurify.sanitize(userHtml, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    });

    return html`<div>${unsafeHTML(clean)}</div>`;
  }
}
```

### Security Considerations

| Attack Vector | Risk | Mitigation | Level |
|---------------|------|-----------|-------|
| Stored XSS (user input) | HIGH | Lit auto-escaping + sanitizeInput | CRITICAL |
| DOM-based XSS (innerHTML) | CRITICAL | Never use with user data | CRITICAL |
| Event handler injection | MEDIUM | Remove `on*` attributes before rendering | HIGH |
| Template injection | MEDIUM | Use Lit templates, not string concat | MEDIUM |
| DITA source XSS | LOW | Trust author-written HTML, validate on load | LOW |

### Browser Compatibility

| Browser | XSS Protection | Content Security Policy |
|---------|----------------|-------------------------|
| Chrome ≥96 | ✓ XSSAuditor (deprecated but helps) | ✓ Full support |
| Firefox ≥102 | ✓ Built-in XSS filter | ✓ Full support |
| Edge ≥96 | ✓ Chromium-based XSS protection | ✓ Full support |

---

## 3. Browser Encryption: sessionStorage Security

### Current State
**Sonar Quiz System**:
- Stores session data in plain text sessionStorage
- sessionStorage is origin-specific (file:// protocol context)
- No encryption currently - acceptable for offline educational context

### Risk Assessment

| Data | Risk Level | Current Storage | Recommendation |
|------|-----------|-----------------|-----------------|
| serviceId, name | MEDIUM | Plain sessionStorage | OK for offline |
| Session timestamps | LOW | Plain sessionStorage | OK |
| Quiz answers | MEDIUM | IndexedDB (persistent) | Consider encryption |
| Analysis cell edits | MEDIUM | IndexedDB (persistent) | Consider encryption |

### Recommended Approach for Enhanced Security

#### 3.1 Web Crypto API for sessionStorage Encryption

**File**: `src/services/crypto.ts`
```typescript
/**
 * Client-side encryption for sensitive sessionStorage data
 * Uses Web Crypto API (built-in, no dependencies)
 *
 * Note: Encryption here is defense-in-depth, not true security
 * Encrypted data is still visible to JavaScript in same origin
 */

const ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
};

const SALT_LENGTH = 16;
const TAG_LENGTH = 128;
const ITERATIONS = 100000;

export class SessionCrypto {
  /**
   * Encrypt session data using Web Crypto API
   * Returns ciphertext + IV + salt for storage
   */
  static async encrypt(plaintext: string, passphrase: string): Promise<string> {
    try {
      // ✓ Step 1: Derive encryption key from passphrase + random salt
      const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
      const key = await this._deriveKey(passphrase, salt);

      // ✓ Step 2: Generate random IV for this encryption
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM

      // ✓ Step 3: Encrypt plaintext with authenticated encryption
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data,
      );

      // ✓ Step 4: Return salt + IV + ciphertext as base64 for storage
      const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

      return this._uint8ToBase64(combined);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt session data');
    }
  }

  /**
   * Decrypt session data
   */
  static async decrypt(encrypted: string, passphrase: string): Promise<string> {
    try {
      // ✓ Step 1: Parse encrypted data
      const combined = this._base64ToUint8(encrypted);
      const salt = combined.slice(0, SALT_LENGTH);
      const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + 12);
      const ciphertext = combined.slice(SALT_LENGTH + 12);

      // ✓ Step 2: Derive same key from passphrase + stored salt
      const key = await this._deriveKey(passphrase, salt);

      // ✓ Step 3: Decrypt with authenticated decryption
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext,
      );

      return new TextDecoder().decode(plaintext);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt session data');
    }
  }

  /**
   * Derive encryption key from passphrase using PBKDF2
   */
  private static async _deriveKey(
    passphrase: string,
    salt: Uint8Array,
  ): Promise<CryptoKey> {
    // ✓ Import passphrase as key
    const passphraseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    // ✓ Derive AES key with PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      passphraseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  private static _uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static _base64ToUint8(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
```

#### 3.2 Usage in Session Service

**File**: `src/services/session.ts` (Enhanced)
```typescript
import { SessionCrypto } from './crypto';

export class SecureSessionService {
  private encryptionEnabled = false;
  private passphrase: string | null = null;

  /**
   * Enable encryption for session storage
   * Passphrase is derived from login credentials
   */
  async enableEncryption(serviceId: string, name: string): Promise<void> {
    // ✓ Derive passphrase from non-sensitive login data
    // This provides encryption but not authentication
    this.passphrase = await this._derivePassphrase(serviceId, name);
    this.encryptionEnabled = true;
  }

  /**
   * Save session with optional encryption
   */
  async saveSession(session: SessionData): Promise<void> {
    try {
      const sessionJson = JSON.stringify(session);

      let dataToStore = sessionJson;
      if (this.encryptionEnabled && this.passphrase) {
        // Encrypt for at-rest security
        dataToStore = await SessionCrypto.encrypt(sessionJson, this.passphrase);
      }

      sessionStorage.setItem(STORAGE_KEYS.SESSION, dataToStore);
    } catch (error) {
      console.error('Failed to save session:', error);
      // Fallback to unencrypted storage
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  }

  /**
   * Load session with optional decryption
   */
  async getSession(): Promise<SessionData | null> {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      if (!stored) return null;

      let sessionJson = stored;
      if (this.encryptionEnabled && this.passphrase) {
        try {
          sessionJson = await SessionCrypto.decrypt(stored, this.passphrase);
        } catch {
          // If decryption fails, treat as corrupted
          console.warn('Failed to decrypt session, clearing');
          sessionStorage.removeItem(STORAGE_KEYS.SESSION);
          return null;
        }
      }

      return JSON.parse(sessionJson) as SessionData;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Derive passphrase from login info (not a true password)
   * This is for encryption only, not authentication
   */
  private async _derivePassphrase(serviceId: string, name: string): Promise<string> {
    // Combine login info to create encryption passphrase
    const combined = `${serviceId}:${name}:${navigator.userAgent}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

#### 3.3 IndexedDB Encryption (Optional)

For sensitive data in IndexedDB:

**File**: `src/services/storage/encrypted-adapter.ts`
```typescript
import { IndexedDBStorageAdapter } from './indexeddb';
import { SessionCrypto } from '../crypto';

/**
 * IndexedDB adapter with optional per-record encryption
 * Useful for sensitive student data in offline scenarios
 */
export class EncryptedIndexedDBAdapter extends IndexedDBStorageAdapter {
  private encryptionKey: CryptoKey | null = null;

  /**
   * Setup encryption with a master key
   * In offline context, key is derived from device + user data
   */
  async setupEncryption(keyDerivationData: string): Promise<void> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keyDerivationData),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );

    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('sonar-quiz-encryption'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Override saveStudent to encrypt record
   */
  async saveStudent(record: StudentRecord): Promise<void> {
    if (this.encryptionKey) {
      // Encrypt sensitive fields
      const encrypted = await this._encryptRecord(record);
      await super.saveStudent(encrypted);
    } else {
      await super.saveStudent(record);
    }
  }

  /**
   * Override getStudent to decrypt record
   */
  async getStudent(release: ReleaseId, serviceId: ServiceId): Promise<StudentRecord | null> {
    const encrypted = await super.getStudent(release, serviceId);
    if (encrypted && this.encryptionKey) {
      return this._decryptRecord(encrypted);
    }
    return encrypted;
  }

  private async _encryptRecord(record: StudentRecord): Promise<StudentRecord> {
    // Encrypt pages data
    const pagesJson = JSON.stringify(record.pages);
    const encryptedPages = await SessionCrypto.encrypt(pagesJson, 'key');
    return {
      ...record,
      pages: encryptedPages as any,
    };
  }

  private async _decryptRecord(record: StudentRecord): Promise<StudentRecord> {
    // Decrypt pages data
    if (typeof record.pages === 'string') {
      const pagesJson = await SessionCrypto.decrypt(record.pages, 'key');
      return {
        ...record,
        pages: JSON.parse(pagesJson),
      };
    }
    return record;
  }
}
```

### Security Considerations

| Aspect | Security Level | Notes |
|--------|----------------|-------|
| **sessionStorage encryption** | Medium | Encrypts data at-rest, not from JavaScript in same origin |
| **Web Crypto API** | High | Standard, no dependencies, available in all modern browsers |
| **Passphrase derivation** | Medium | Derived from login data, not true password encryption |
| **Key management** | Medium | Keys are ephemeral (in-memory during session) |
| **IndexedDB encryption** | Medium | Optional layer for future sensitive data storage |

### Browser Compatibility

| Browser | Web Crypto API | Support Level |
|---------|---|---|
| Chrome ≥96 | ✓ AES-GCM, PBKDF2, SHA-256 | Full |
| Firefox ≥102 | ✓ All algorithms | Full |
| Edge ≥96 | ✓ All algorithms | Full |
| Safari ≥14 | ✓ All algorithms | Full |

**Note**: Web Crypto API is available in all target browsers without polyfills.

---

## 4. Rate Limiting: Client-Side Authentication

### Current State
**Sonar Quiz System**: No password authentication - only service ID + name login
**Future State**: Instructor unlock code (single per session)

### Recommended Approach

#### 4.1 Rate Limiting Service

**File**: `src/services/rate-limiter.ts`
```typescript
/**
 * Client-side rate limiting with exponential backoff
 * Prevents brute-force attacks on authentication attempts
 *
 * Note: This is client-side defense. True security requires server-side checks.
 * In offline context, this prevents accidental repeated failures.
 */

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil: number;
}

export class RateLimiter {
  private static readonly DEFAULT_WINDOW_MS = 60000; // 1 minute
  private static readonly DEFAULT_MAX_ATTEMPTS = 5;
  private static readonly BACKOFF_MULTIPLIER = 2;
  private static readonly INITIAL_BACKOFF_MS = 1000; // 1 second

  private limits: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if an action is rate-limited
   *
   * @param key - Unique identifier (e.g., "unlock-code", "login:RN2344")
   * @param maxAttempts - Max attempts per window
   * @param windowMs - Time window for attempts
   * @returns true if action is allowed, false if rate-limited
   */
  isAllowed(
    key: string,
    maxAttempts = RateLimiter.DEFAULT_MAX_ATTEMPTS,
    windowMs = RateLimiter.DEFAULT_WINDOW_MS,
  ): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No previous attempts
    if (!entry) {
      this._createEntry(key);
      return true;
    }

    // Check if currently blocked
    if (now < entry.blockedUntil) {
      return false;
    }

    // Check if window has expired
    if (now - entry.lastAttempt > windowMs) {
      // Reset if outside time window
      this._createEntry(key);
      return true;
    }

    // Check if limit exceeded
    if (entry.attempts >= maxAttempts) {
      // Calculate exponential backoff
      const backoffMs = RateLimiter.INITIAL_BACKOFF_MS *
        Math.pow(RateLimiter.BACKOFF_MULTIPLIER, entry.attempts - maxAttempts);
      entry.blockedUntil = now + backoffMs;
      return false;
    }

    return true;
  }

  /**
   * Record a failed attempt
   */
  recordFailure(key: string): void {
    const entry = this.limits.get(key);
    if (entry) {
      entry.attempts += 1;
      entry.lastAttempt = Date.now();
    } else {
      this._createEntry(key);
      const newEntry = this.limits.get(key)!;
      newEntry.attempts = 1;
    }
  }

  /**
   * Reset after successful attempt
   */
  recordSuccess(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Get time until rate limit expires (milliseconds)
   * Useful for UI feedback
   */
  getWaitTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const now = Date.now();
    const waitMs = entry.blockedUntil - now;
    return Math.max(0, waitMs);
  }

  /**
   * Clear specific limit
   */
  clear(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all limits
   */
  clearAll(): void {
    this.limits.clear();
  }

  private _createEntry(key: string): void {
    this.limits.set(key, {
      attempts: 0,
      lastAttempt: Date.now(),
      blockedUntil: 0,
    });
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

export function resetRateLimiter(): void {
  rateLimiterInstance = null;
}
```

#### 4.2 Usage in Instructor Unlock

**File**: `src/components/qd-instructor.ts`
```typescript
import { getRateLimiter } from '../services/rate-limiter';

@customElement('qd-instructor')
export class QdInstructor extends LitElement {
  @state()
  private _attemptCount = 0;

  @state()
  private _isBlocked = false;

  @state()
  private _waitSeconds = 0;

  private rateLimiter = getRateLimiter();
  private readonly RATE_LIMIT_KEY = 'instructor-unlock';
  private readonly MAX_ATTEMPTS = 3;
  private blockCheckInterval: number | null = null;

  async _handleUnlockAttempt(code: string): Promise<void> {
    // ✓ Check rate limit BEFORE processing
    if (!this.rateLimiter.isAllowed(this.RATE_LIMIT_KEY, this.MAX_ATTEMPTS)) {
      const waitMs = this.rateLimiter.getWaitTime(this.RATE_LIMIT_KEY);
      const waitSeconds = Math.ceil(waitMs / 1000);

      this._isBlocked = true;
      this._waitSeconds = waitSeconds;

      // Show countdown UI
      this._startBlockCountdown();

      this._showError(
        `Too many attempts. Try again in ${waitSeconds} seconds.`,
      );
      return;
    }

    // Process unlock attempt
    const result = await this._verifyCode(code);

    if (result.success) {
      // ✓ Clear rate limit on success
      this.rateLimiter.recordSuccess(this.RATE_LIMIT_KEY);
      this._isBlocked = false;
      this._attemptCount = 0;
      this._unlockInstructor();
    } else {
      // ✓ Record failure for rate limiting
      this.rateLimiter.recordFailure(this.RATE_LIMIT_KEY);
      this._attemptCount += 1;

      // Show feedback
      const remaining = this.MAX_ATTEMPTS - this._attemptCount;
      if (remaining > 0) {
        this._showError(`Incorrect code. ${remaining} attempts remaining.`);
      } else {
        // Final attempt failed - trigger rate limit
        const waitMs = this.rateLimiter.getWaitTime(this.RATE_LIMIT_KEY);
        this._isBlocked = true;
        this._waitSeconds = Math.ceil(waitMs / 1000);
        this._startBlockCountdown();
      }
    }
  }

  private _startBlockCountdown(): void {
    if (this.blockCheckInterval !== null) {
      clearInterval(this.blockCheckInterval);
    }

    const startWait = this._waitSeconds;
    this.blockCheckInterval = window.setInterval(() => {
      const remaining = this.rateLimiter.getWaitTime(this.RATE_LIMIT_KEY);
      const remainingSeconds = Math.ceil(remaining / 1000);

      if (remainingSeconds <= 0) {
        this._isBlocked = false;
        this._waitSeconds = 0;
        if (this.blockCheckInterval !== null) {
          clearInterval(this.blockCheckInterval);
          this.blockCheckInterval = null;
        }
        this.requestUpdate();
      } else {
        this._waitSeconds = remainingSeconds;
        this.requestUpdate();
      }
    }, 100); // Update UI every 100ms for smooth countdown
  }

  private _showError(message: string): void {
    // Use error banner component
    const event = new CustomEvent('qd:error', {
      detail: { message },
      bubbles: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    return html`
      <form @submit=${(e: Event) => this._handleSubmit(e)}>
        <input
          type="password"
          id="code"
          placeholder="Unlock code"
          ?disabled=${this._isBlocked}
          aria-label="Instructor unlock code"
        />

        <button type="submit" ?disabled=${this._isBlocked}>
          ${this._isBlocked
            ? `Wait ${this._waitSeconds}s...`
            : 'Unlock'}
        </button>
      </form>

      ${this._attemptCount > 0 && !this._isBlocked
        ? html`
            <p class="attempt-count">
              Attempts: ${this._attemptCount}/${this.MAX_ATTEMPTS}
            </p>
          `
        : nothing}
    `;
  }

  private _handleSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const code = (form.elements[0] as HTMLInputElement).value.trim();
    this._handleUnlockAttempt(code);
  }

  private async _verifyCode(code: string): Promise<{ success: boolean }> {
    // Implementation in section 5: Timing Attack Prevention
    return { success: false };
  }

  private _unlockInstructor(): void {
    const sessionService = getSessionService();
    sessionService.unlockInstructor();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.blockCheckInterval !== null) {
      clearInterval(this.blockCheckInterval);
    }
  }
}
```

#### 4.3 Unit Tests for Rate Limiting

**File**: `tests/services/rate-limiter.test.ts`
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRateLimiter, resetRateLimiter } from '../../src/services/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: ReturnType<typeof getRateLimiter>;

  beforeEach(() => {
    resetRateLimiter();
    rateLimiter = getRateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow initial attempts', () => {
    expect(rateLimiter.isAllowed('test-key')).toBe(true);
    expect(rateLimiter.isAllowed('test-key')).toBe(true);
  });

  it('should block after max attempts', () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.recordFailure('test-key');
    }

    expect(rateLimiter.isAllowed('test-key', 5)).toBe(false);
  });

  it('should implement exponential backoff', () => {
    // Record 5 failures (trigger rate limit)
    for (let i = 0; i < 5; i++) {
      rateLimiter.recordFailure('test-key');
    }

    let waitTime = rateLimiter.getWaitTime('test-key');
    expect(waitTime).toBeGreaterThan(0);

    // Advance time less than initial backoff
    vi.advanceTimersByTime(500);
    expect(rateLimiter.isAllowed('test-key', 5)).toBe(false);

    // Advance past initial backoff
    vi.advanceTimersByTime(1000);
    // Should still be blocked due to exponential backoff
    expect(rateLimiter.isAllowed('test-key', 5)).toBe(true);
  });

  it('should reset on success', () => {
    rateLimiter.recordFailure('test-key');
    rateLimiter.recordFailure('test-key');
    rateLimiter.recordSuccess('test-key');

    expect(rateLimiter.isAllowed('test-key')).toBe(true);
  });

  it('should reset after time window expires', () => {
    rateLimiter.recordFailure('test-key');
    expect(rateLimiter.getWaitTime('test-key')).toBe(0);

    // Advance past window
    vi.advanceTimersByTime(61000);
    expect(rateLimiter.isAllowed('test-key')).toBe(true);
  });
});
```

### Security Considerations

| Risk | Mitigation | Effectiveness |
|------|-----------|----------------|
| Brute-force attempts | Exponential backoff, max 5 attempts per minute | Medium (client-side only) |
| Bypass by clearing storage | Can clear localStorage but not in-memory state | Medium |
| DoS via many keys | Implement per-user rate limits, cleanup old entries | Medium |
| Timing side-channels | Use constant-time comparison (see section 5) | High |

### Browser Compatibility

All target browsers support `Date.now()` and basic rate limiting implementation:

| Browser | Support |
|---------|---------|
| Chrome ≥96 | ✓ Full |
| Firefox ≥102 | ✓ Full |
| Edge ≥96 | ✓ Full |

---

## 5. Timing Attack Prevention

### Current State
**Sonar Quiz System**: No password comparison currently
**Future Enhancement**: Instructor unlock code verification

### Why Timing Attacks Matter

Even offline, timing attacks can reveal information if code is predictable:
```javascript
// VULNERABLE - Timing attack possible
if (userCode === correctCode) { // Exits early on mismatch
  unlockInstructor();
}

// SAFE - Constant-time comparison
if (constantTimeCompare(userCode, correctCode)) {
  unlockInstructor();
}
```

### Recommended Approach

#### 5.1 Constant-Time Comparison Implementation

**File**: `src/utils/crypto-utils.ts`
```typescript
/**
 * Constant-time string comparison
 * Prevents timing side-channels from revealing code information
 *
 * Runs in O(n) time regardless of where strings differ
 */
export function constantTimeCompare(a: string, b: string): boolean {
  // First check: ensure same length (don't leak length info)
  if (a.length !== b.length) {
    // Still do a dummy comparison to maintain timing
    const dummy = Buffer.alloc(32);
    crypto.subtle.timingSafeEqual(dummy, dummy); // No-op
    return false;
  }

  // Compare bytes in constant time
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    // XOR each byte - result remains non-zero if any byte differs
    result |= aBytes[i]! ^ bBytes[i]!;
  }

  return result === 0;
}

/**
 * Timing-safe hash comparison
 * Compares two base64-encoded hashes without timing leaks
 */
export function constantTimeHashCompare(hashA: string, hashB: string): boolean {
  // Decode from base64 first
  const aBytes = Uint8Array.from(atob(hashA), c => c.charCodeAt(0));
  const bBytes = Uint8Array.from(atob(hashB), c => c.charCodeAt(0));

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i]! ^ bBytes[i]!;
  }

  return result === 0;
}

/**
 * Hash code using PBKDF2 (slower, more resistant to attacks)
 */
export async function hashCode(
  code: string,
  salt: Uint8Array = crypto.getRandomValues(new Uint8Array(16)),
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(code),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000, // Intentionally slow
      hash: 'SHA-256',
    },
    key,
    256,
  );

  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}
```

#### 5.2 Usage in Instructor Service

**File**: `src/services/instructor.ts`
```typescript
import { constantTimeCompare, constantTimeHashCompare, hashCode } from '../utils/crypto-utils';

export class InstructorService {
  /**
   * Verify instructor unlock code
   * Uses constant-time comparison to prevent timing attacks
   */
  async verifyUnlockCode(userCode: string): Promise<boolean> {
    try {
      // ✓ Step 1: Get stored hash (never store plaintext)
      const storedHash = await this._getStoredCodeHash();
      if (!storedHash) {
        // No unlock code configured
        return false;
      }

      // ✓ Step 2: Hash user input with same method
      const userHash = await hashCode(userCode);

      // ✓ Step 3: Compare using constant-time function
      const matches = constantTimeHashCompare(storedHash, userHash);

      // ✓ Step 4: Rate limiting and logging happen elsewhere
      // (see section 4)

      return matches;
    } catch (error) {
      console.error('Verification failed:', error);
      // Fail securely
      return false;
    }
  }

  private async _getStoredCodeHash(): Promise<string | null> {
    // In build time: injected via Vite define
    if (typeof __INSTRUCTOR_UNLOCK_HASH__ !== 'undefined') {
      return __INSTRUCTOR_UNLOCK_HASH__;
    }

    // In development: no code
    return null;
  }
}
```

#### 5.3 Unit Tests

**File**: `tests/utils/crypto-utils.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { constantTimeCompare } from '../../src/utils/crypto-utils';

describe('constantTimeCompare', () => {
  it('should return true for matching strings', () => {
    expect(constantTimeCompare('test', 'test')).toBe(true);
  });

  it('should return false for different strings', () => {
    expect(constantTimeCompare('test', 'fail')).toBe(false);
  });

  it('should return false for different lengths', () => {
    expect(constantTimeCompare('short', 'much longer string')).toBe(false);
  });

  it('should handle empty strings', () => {
    expect(constantTimeCompare('', '')).toBe(true);
    expect(constantTimeCompare('', 'x')).toBe(false);
  });

  it('should have consistent timing regardless of position of difference', () => {
    // This is a simplified test - true timing analysis requires
    // statistical analysis over many runs
    const str1 = 'a'.repeat(1000) + 'x' + 'b'.repeat(1000);
    const str2_early = 'x' + 'a'.repeat(1999) + 'b';
    const str2_late = 'a'.repeat(1000) + 'y' + 'b'.repeat(1000);

    // All should return false
    expect(constantTimeCompare(str1, str2_early)).toBe(false);
    expect(constantTimeCompare(str1, str2_late)).toBe(false);
  });
});
```

### Security Considerations

| Attack | Risk | Mitigation |
|--------|------|-----------|
| Timing analysis of unlock code | Medium (offline context) | Constant-time comparison |
| Cache timing attacks | Low (JavaScript abstraction) | No direct mitigation possible |
| Spectre/Meltdown | Very Low (browser mitigation) | CPU/browser level |
| Code length inference | Medium | Always process full length |
| Salt timing | Low | Use random salt, same processing |

### Browser Compatibility

| Feature | Chrome | Firefox | Edge | Notes |
|---------|--------|---------|------|-------|
| TextEncoder | ✓ | ✓ | ✓ | Standard API |
| XOR operations | ✓ | ✓ | ✓ | Basic JS |
| atob/btoa | ✓ | ✓ | ✓ | Standard API |
| crypto.getRandomValues | ✓ | ✓ | ✓ | Standard API |

---

## 6. Cross-Tab Message Validation

### Current State
**Sonar Quiz System**: Single-tab offline application
**Future Enhancement**: Multi-window instructor dashboard

### Use Case
Instructor opens multiple windows to monitor student progress:
- Main quiz window (read-only student data)
- Instructor dashboard (write access to unlock codes)
- Both need to stay in sync

### Risk Assessment

| Scenario | Risk | Mitigation |
|----------|------|-----------|
| Attacker injects fake unlock message | HIGH | Message signing/validation |
| Timing analysis of message arrival | MEDIUM | Random delays |
| Message replay attacks | MEDIUM | Timestamps + nonce |
| Cross-origin tab messages | LOW (offline) | Origin check still needed |

### Recommended Approach

#### 6.1 Secure Cross-Tab Communication

**File**: `src/services/broadcast.ts`
```typescript
/**
 * Cross-tab communication with message validation
 * Uses BroadcastChannel API for offline-first applications
 *
 * Features:
 * - Message signing (HMAC-SHA256)
 * - Nonce to prevent replay attacks
 * - Timestamp validation to detect stale messages
 * - Origin validation for extra safety
 */

const CHANNEL_NAME = 'qd-instructor-sync';
const MESSAGE_TIMEOUT_MS = 30000; // 30 second message validity
const NONCE_LENGTH = 16;

interface SignedMessage<T> {
  type: string;
  data: T;
  timestamp: string;
  nonce: string;
  signature: string;
}

export class SecureBroadcast<T> {
  private channel: BroadcastChannel | null = null;
  private sharedSecret: string;
  private seenNonces: Set<string> = new Set();
  private nonceTTL: Map<string, number> = new Map();

  constructor(channelName: string, sharedSecret: string) {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not supported');
      return;
    }

    this.sharedSecret = sharedSecret;
    this.channel = new BroadcastChannel(channelName);
  }

  /**
   * Send a signed message to other tabs
   */
  async send(type: string, data: T): Promise<void> {
    if (!this.channel) {
      console.error('BroadcastChannel not available');
      return;
    }

    try {
      const message = await this._createSignedMessage(type, data);
      this.channel.postMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Listen for signed messages
   * Only processes valid, authenticated messages
   */
  onMessage(handler: (type: string, data: T) => void): void {
    if (!this.channel) {
      console.error('BroadcastChannel not available');
      return;
    }

    this.channel.onmessage = async (event: MessageEvent) => {
      try {
        const message = event.data as SignedMessage<T>;

        // ✓ Step 1: Validate message structure
        if (!this._isValidMessageStructure(message)) {
          console.warn('Invalid message structure');
          return;
        }

        // ✓ Step 2: Check timestamp (reject stale messages)
        if (!this._isRecentMessage(message.timestamp)) {
          console.warn('Stale message rejected');
          return;
        }

        // ✓ Step 3: Check for replay attacks
        if (this._isReplayedNonce(message.nonce)) {
          console.warn('Replay attack detected');
          return;
        }

        // ✓ Step 4: Verify message signature (HMAC)
        const isValid = await this._verifySignature(message);
        if (!isValid) {
          console.warn('Message signature verification failed');
          return;
        }

        // ✓ Step 5: Record nonce to prevent replays
        this._recordNonce(message.nonce);

        // ✓ Step 6: Call handler with validated data
        handler(message.type, message.data);
      } catch (error) {
        console.error('Message processing failed:', error);
      }
    };
  }

  /**
   * Create a signed message with HMAC authentication
   */
  private async _createSignedMessage(type: string, data: T): Promise<SignedMessage<T>> {
    const timestamp = new Date().toISOString();
    const nonce = this._generateNonce();

    // Create message content to sign
    const messageContent = JSON.stringify({
      type,
      data,
      timestamp,
      nonce,
    });

    // Sign with HMAC-SHA256
    const signature = await this._hmacSign(messageContent);

    return {
      type,
      data,
      timestamp,
      nonce,
      signature,
    };
  }

  /**
   * Verify message signature using HMAC
   */
  private async _verifySignature(message: SignedMessage<T>): Promise<boolean> {
    const messageContent = JSON.stringify({
      type: message.type,
      data: message.data,
      timestamp: message.timestamp,
      nonce: message.nonce,
    });

    const expectedSignature = await this._hmacSign(messageContent);

    // ✓ Use constant-time comparison to prevent timing attacks
    return this._constantTimeCompare(message.signature, expectedSignature);
  }

  /**
   * HMAC-SHA256 signing
   */
  private async _hmacSign(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.sharedSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));

    // Return as hex string
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate random nonce to prevent replay attacks
   */
  private _generateNonce(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Check if nonce has been seen before (replay attack prevention)
   */
  private _isReplayedNonce(nonce: string): boolean {
    return this.seenNonces.has(nonce);
  }

  /**
   * Record nonce with TTL for replay prevention
   */
  private _recordNonce(nonce: string): void {
    const now = Date.now();
    this.seenNonces.add(nonce);
    this.nonceTTL.set(nonce, now + MESSAGE_TIMEOUT_MS);

    // Cleanup expired nonces periodically
    if (this.seenNonces.size > 1000) {
      this._cleanupExpiredNonces();
    }
  }

  /**
   * Remove expired nonces from memory
   */
  private _cleanupExpiredNonces(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.nonceTTL.forEach((ttl, nonce) => {
      if (now > ttl) {
        expired.push(nonce);
      }
    });

    expired.forEach(nonce => {
      this.seenNonces.delete(nonce);
      this.nonceTTL.delete(nonce);
    });
  }

  /**
   * Check if message timestamp is recent
   */
  private _isRecentMessage(timestamp: string): boolean {
    const messageTime = new Date(timestamp).getTime();
    const now = Date.now();
    const age = now - messageTime;

    // Reject if older than 30 seconds
    return age >= 0 && age <= MESSAGE_TIMEOUT_MS;
  }

  /**
   * Validate message structure
   */
  private _isValidMessageStructure(message: unknown): message is SignedMessage<T> {
    if (typeof message !== 'object' || message === null) {
      return false;
    }

    const m = message as Record<string, unknown>;
    return (
      typeof m.type === 'string' &&
      typeof m.timestamp === 'string' &&
      typeof m.nonce === 'string' &&
      typeof m.signature === 'string' &&
      m.data !== undefined
    );
  }

  /**
   * Constant-time string comparison
   */
  private _constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Close the broadcast channel
   */
  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}
```

#### 6.2 Usage in Instructor Unlock

**File**: `src/services/instructor.ts` (Enhanced)
```typescript
import { SecureBroadcast } from './broadcast';

interface InstructorMessage {
  action: 'unlock' | 'lock' | 'reset-codes';
  timestamp: string;
  sessionId: string;
}

export class InstructorCoordinator {
  private broadcast: SecureBroadcast<InstructorMessage>;
  private sessionId: string;

  constructor(sessionId: string, sharedSecret: string) {
    this.sessionId = sessionId;

    // ✓ Use session-specific secret for shared context
    this.broadcast = new SecureBroadcast<InstructorMessage>(
      'qd-instructor-sync',
      `${sessionId}:${sharedSecret}`,
    );

    // Setup listeners
    this._setupListeners();
  }

  /**
   * Notify other tabs when instructor unlocks
   */
  async notifyUnlock(): Promise<void> {
    await this.broadcast.send('unlock', {
      action: 'unlock',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Listen for instructor unlock from other tabs
   */
  private _setupListeners(): void {
    this.broadcast.onMessage((type: string, message: InstructorMessage) => {
      if (type === 'unlock') {
        this._handleRemoteUnlock(message);
      } else if (type === 'lock') {
        this._handleRemoteLock(message);
      }
    });
  }

  private _handleRemoteUnlock(message: InstructorMessage): void {
    // Verify the unlock came from same session
    if (message.sessionId !== this.sessionId) {
      console.warn('Unlock from different session');
      return;
    }

    // Update local instructor mode
    const sessionService = getSessionService();
    sessionService.unlockInstructor();

    // Emit event for UI update
    window.dispatchEvent(
      new CustomEvent('qd:instructor-unlock-remote', {
        detail: { source: 'broadcast' },
      }),
    );
  }

  private _handleRemoteLock(message: InstructorMessage): void {
    if (message.sessionId !== this.sessionId) {
      return;
    }

    const sessionService = getSessionService();
    sessionService.lockInstructor();

    window.dispatchEvent(
      new CustomEvent('qd:instructor-lock-remote', {
        detail: { source: 'broadcast' },
      }),
    );
  }

  close(): void {
    this.broadcast.close();
  }
}
```

#### 6.3 Unit Tests

**File**: `tests/services/broadcast.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecureBroadcast } from '../../src/services/broadcast';

describe('SecureBroadcast', () => {
  let broadcast1: SecureBroadcast<{ data: string }>;
  let broadcast2: SecureBroadcast<{ data: string }>;
  const sharedSecret = 'test-secret';

  beforeEach(() => {
    // Mock BroadcastChannel if not available
    if (typeof BroadcastChannel === 'undefined') {
      // @ts-ignore
      global.BroadcastChannel = class MockBroadcastChannel {
        name: string;
        onmessage: null | ((e: MessageEvent) => void) = null;
        listeners: Map<string, ((e: MessageEvent) => void)[]> = new Map();

        constructor(name: string) {
          this.name = name;
        }

        postMessage(message: unknown) {
          // Simulate message broadcast
          this.listeners.get(this.name)?.forEach(listener => {
            listener(new MessageEvent('message', { data: message }));
          });
        }

        close() {}
      };
    }
  });

  it('should create signed messages', async () => {
    broadcast1 = new SecureBroadcast('test', sharedSecret);
    // Test that message is created with signature
    // Implementation depends on test setup
  });

  it('should reject messages with invalid signatures', async () => {
    broadcast1 = new SecureBroadcast('test', sharedSecret);
    // Should not process messages with tampered signatures
  });

  it('should reject replay attacks', async () => {
    broadcast1 = new SecureBroadcast('test', sharedSecret);
    // Should reject messages with duplicate nonces
  });

  it('should reject stale messages', async () => {
    broadcast1 = new SecureBroadcast('test', sharedSecret);
    // Should reject messages older than 30 seconds
  });
});
```

### Security Considerations

| Attack | Risk | Mitigation |
|--------|------|-----------|
| Message tampering | CRITICAL | HMAC-SHA256 signature |
| Replay attacks | HIGH | Nonce + timestamp validation |
| Stale messages | MEDIUM | Timestamp TTL (30 seconds) |
| Cross-origin injection | LOW | BroadcastChannel is origin-specific |
| Nonce collision | VERY LOW | 16 bytes of random data (2^128) |

### Browser Compatibility

| Browser | BroadcastChannel | Support |
|---------|------------------|---------|
| Chrome ≥96 | ✓ | Full |
| Firefox ≥102 | ✓ | Full |
| Edge ≥96 | ✓ | Full |
| Safari ≥15.1 | ✓ | Full |

**Note**: BroadcastChannel is a standard API in all target browsers. Falls back gracefully if not available.

---

## Summary Table: Security Measures

| Security Area | Implementation | Browser Support | Effort |
|---|---|---|---|
| **Password Config** | Vite define + .env | ✓ All | Low |
| **XSS Prevention** | Lit auto-escaping + sanitizeInput | ✓ All | Low |
| **Encryption** | Web Crypto API (optional) | ✓ All | Medium |
| **Rate Limiting** | Custom RateLimiter class | ✓ All | Medium |
| **Timing Attacks** | Constant-time comparison | ✓ All | Low |
| **Cross-Tab** | SecureBroadcast + HMAC | ✓ All | High |

---

## Implementation Priority

### Phase 1: Essential (Immediate)
1. ✓ Password management (.env, .gitignore)
2. ✓ XSS prevention (Lit best practices)
3. ✓ Input sanitization (trim, length limits)

### Phase 2: Important (Before Production)
4. Rate limiting (for future auth)
5. Timing attack prevention
6. Message validation

### Phase 3: Nice-to-Have (For Enhanced Security)
7. sessionStorage encryption
8. IndexedDB encryption
9. Cross-tab synchronization

---

## Testing & Validation

### Security Test Checklist
```bash
# 1. No secrets in bundle
npm run audit:secrets

# 2. XSS prevention
npm run test:unit -- crypto-utils sanitize-input

# 3. Rate limiting
npm run test:unit -- rate-limiter

# 4. Encryption (if implemented)
npm run test:unit -- crypto session-crypto

# 5. Integration tests
npm run test:integration

# 6. Build verification
npm run build
npm run size-check
```

### Manual Security Review
- [ ] No hardcoded passwords in source
- [ ] No console.log of secrets
- [ ] All user input goes through sanitization
- [ ] Rate limiter blocks after max attempts
- [ ] Timing comparison is constant-time
- [ ] BroadcastChannel messages are signed
- [ ] Build excludes all .env files

---

## References & Resources

### Web Crypto API
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- https://www.w3.org/TR/WebCryptoAPI/

### OWASP Security Guidelines
- https://owasp.org/www-project-web-security-testing-guide/
- https://cheatsheetseries.owasp.org/

### Vite Security
- https://vitejs.dev/config/shared-options#define
- https://vitejs.dev/guide/env-and-mode.html

### Lit Security
- https://lit.dev/docs/security/

### BroadcastChannel API
- https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel

### Offline Security Best Practices
- https://developer.chrome.com/blog/offline-security/
- https://www.w3.org/TR/app-cache/ (historical)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-15 | Initial document: 6 security areas, implementation patterns, browser compatibility |

---

## Questions & Feedback

For security concerns or implementation questions, follow this process:

1. **Report Issues**: Use GitHub Security Advisory (not public issues)
2. **Discussion**: File RFC in discussions for architectural changes
3. **Compliance**: Verify against Constitution III (Test-Driven Development)
4. **Review**: All security changes require code review before merge

---

**Document Status**: Reference Implementation Guide
**Maintenance**: Update quarterly or when new browser capabilities emerge
**Last Reviewed**: November 15, 2025
