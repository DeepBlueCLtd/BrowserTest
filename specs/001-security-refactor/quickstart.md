# Quick Start: Security Remediation Implementation

**Feature**: Security Remediation and Code Quality Improvements
**Branch**: `001-security-refactor`
**Duration**: ~1 week for critical security, 2-3 weeks total

## Prerequisites

- Node.js 18+ and npm installed
- Access to the BrowserTest repository
- Understanding of TypeScript and Web Components
- Familiarity with TDD practices

## Setup Instructions

### 1. Check Out Feature Branch

```bash
git fetch origin
git checkout 001-security-refactor
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create `.env` file in project root:

```bash
# .env
VITE_INSTRUCTOR_PASSWORD_HASH=<your-hashed-password>
VITE_ENABLE_ENCRYPTION=true
VITE_ENABLE_RATE_LIMIT=true
VITE_ENABLE_SECURITY_LOGS=false  # true for development
VITE_DEBUG=false                  # true for development
```

Generate password hash:
```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

### 4. Verify Constitution Compliance

```bash
# Run all tests to ensure no regressions
npm test

# Check bundle size
npm run build && npm run size-check

# Verify linting passes
npm run lint

# Check formatting
npm run format:check
```

## Implementation Order

### Phase 1: Critical Security (Days 1-3)

Start with failing tests:

```bash
# Create security test file
touch tests/security/critical-vulnerabilities.test.ts
```

1. **Remove Hardcoded Password** (P1)
   - [ ] Write test for environment variable configuration
   - [ ] Update `qd-instructor.ts` to use `import.meta.env`
   - [ ] Verify test passes
   - [ ] Test in demo environment

2. **Fix XSS Vulnerabilities** (P1)
   - [ ] Write XSS injection tests
   - [ ] Replace innerHTML in `quiz-table.ts:544,553,556`
   - [ ] Replace innerHTML in `index.ts:260`
   - [ ] Verify all tests pass

3. **Encrypt Session Data** (P1)
   - [ ] Write encryption round-trip tests
   - [ ] Create `src/utils/crypto.ts`
   - [ ] Update `session.ts` to encrypt/decrypt
   - [ ] Verify session still works

### Phase 2: Additional Security (Days 4-5)

4. **Implement Rate Limiting** (P2)
   - [ ] Write rate limiter tests
   - [ ] Create `src/utils/rate-limiter.ts`
   - [ ] Integrate with `qd-instructor.ts`
   - [ ] Test lockout behavior

5. **Timing-Safe Comparison** (P2)
   - [ ] Write timing attack tests
   - [ ] Create `src/utils/security.ts`
   - [ ] Update password validation
   - [ ] Verify constant-time behavior

6. **Message Validation** (P2)
   - [ ] Write message validation tests
   - [ ] Add HMAC signing to BroadcastChannel
   - [ ] Test cross-tab communication

### Phase 3: Code Quality (Days 6-7)

7. **Extract Utilities** (P3)
   - [ ] Create `src/utils/comparison-table-builder.ts`
   - [ ] Create `src/utils/debouncer.ts`
   - [ ] Create `src/utils/storage-helpers.ts`
   - [ ] Update imports in affected files

8. **Optimize Performance** (P3)
   - [ ] Create `src/utils/dom-cache.ts`
   - [ ] Reduce debounce to 100ms
   - [ ] Verify performance improvements

## Testing Each Change

### Unit Test Pattern

```typescript
// tests/security/xss-prevention.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeInput } from '../../src/utils/dom-sanitizer';

describe('XSS Prevention', () => {
  it('should escape script tags', () => {
    const malicious = '<script>alert("XSS")</script>';
    const safe = sanitizeInput(malicious);
    expect(safe).not.toContain('<script>');
    expect(safe).toContain('&lt;script&gt;');
  });
});
```

### Integration Test Pattern

```typescript
// tests/integration/encrypted-session.test.ts
describe('Encrypted Session Storage', () => {
  it('should encrypt session data in storage', async () => {
    await sessionService.createSession({
      serviceId: 'RN1234',
      name: 'Test User',
      release: '11-2025'
    });

    const stored = sessionStorage.getItem('qd/session');
    const parsed = JSON.parse(stored!);

    expect(parsed.iv).toBeDefined();
    expect(parsed.ciphertext).toBeDefined();
    expect(stored).not.toContain('RN1234');
    expect(stored).not.toContain('Test User');
  });
});
```

### E2E Test Pattern

```typescript
// tests/e2e/security/authentication.spec.ts
test('should lock out after 5 failed attempts', async ({ page }) => {
  await page.goto('file:///.../demo/quiz-index.html');

  for (let i = 0; i < 5; i++) {
    await page.fill('#instructor-password', 'wrong');
    await page.click('#unlock-button');
  }

  await expect(page.locator('.error-message'))
    .toContainText('Too many attempts');
});
```

## Verification Checklist

After each implementation phase:

### Security Verification

- [ ] No hardcoded passwords in bundle
- [ ] No XSS vulnerabilities (test with `<script>` injection)
- [ ] Session data encrypted in browser storage
- [ ] Rate limiting prevents brute force
- [ ] Timing attacks ineffective
- [ ] Cross-tab messages validated

### Code Quality Verification

- [ ] TypeScript compiles without errors: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Linting clean: `npm run lint`
- [ ] Formatting correct: `npm run format:check`
- [ ] Bundle size under 35KB: `npm run size-check`
- [ ] ESLint disable comments reduced

### Performance Verification

- [ ] Debounce responds in <100ms
- [ ] Page loads in <2s with 50 questions
- [ ] DOM queries use cache
- [ ] No memory leaks (check DevTools)

## Common Issues & Solutions

### Issue: Build fails with missing env variable

```bash
Error: VITE_INSTRUCTOR_PASSWORD_HASH is not defined
```

**Solution**: Ensure `.env` file exists and contains the variable

### Issue: Tests fail with crypto not defined

```bash
ReferenceError: crypto is not defined
```

**Solution**: Tests need to run in browser environment or use Node 20+

### Issue: Bundle size exceeds limit

```bash
Bundle size: 36.3KB (exceeds 35KB limit)
```

**Solution**: Check for unnecessary imports, use tree shaking

### Issue: Encryption makes session slow

**Solution**: Cache derived keys, use faster iteration count in dev

## Demo & Manual Testing

1. **Build the bundle**:
   ```bash
   npm run build
   ```

2. **Test security features**:
   ```bash
   # Open demo with security features
   open demo/quiz-index.html
   ```

3. **Test scenarios**:
   - Try default "instructor" password (should fail)
   - Try configured password (should work)
   - Attempt XSS in quiz answers
   - Check sessionStorage is encrypted
   - Test rate limiting with multiple failures
   - Open multiple tabs and test sync

## Getting Help

- Review `specs/001-security-refactor/research.md` for technical decisions
- Check `specs/001-security-refactor/data-model.md` for entity definitions
- See `specs/001-security-refactor/contracts/` for interface definitions
- Consult `CLAUDE.md` for project conventions

## Next Steps

After completing implementation:

1. Run full test suite: `npm test`
2. Run security audit: `npm audit`
3. Update documentation if APIs changed
4. Create PR with security checklist
5. Request security review from team lead