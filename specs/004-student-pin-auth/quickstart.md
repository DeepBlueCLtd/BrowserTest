# Quickstart: Student PIN Authentication

## Overview

This feature adds mandatory 4-digit PIN authentication to prevent student impersonation on shared computers.

## For Students

### First Time Login
1. Enter your service ID and name as usual
2. You'll be prompted to create a 4-digit PIN
3. Enter your PIN twice to confirm
4. Remember this PIN - you'll need it every time you log in

### Returning Login
1. Enter your service ID and name
2. Enter your 4-digit PIN
3. If you forget your PIN, ask your instructor to reset it

### Important Notes
- Your PIN must be exactly 4 digits (0-9)
- Leading zeros are OK (e.g., "0042")
- After 3 wrong attempts, you'll be locked out for 30 seconds
- Only your instructor can reset a forgotten PIN

## For Instructors

### PIN Reset Process
1. Log in with instructor password
2. Click "View All Scores" in the instructor panel
3. Find the student who needs a reset
4. Click "Reset PIN" next to their name
5. Confirm the reset
6. Tell the student they'll create a new PIN on next login

### Monitoring
- Students without PINs are flagged in the scores view
- Reset events are logged for audit purposes
- You can see when PINs were created/reset

## For Existing Students

If you already have quiz progress from before PINs were added:
1. Your data is safe - nothing is lost
2. Next login, you'll be prompted to create a PIN
3. After creating your PIN, all your progress is still there

## Security Features

- **Hashed Storage**: PINs are never stored in plain text
- **Rate Limiting**: 3 attempts, then 30-second lockout
- **Session Isolation**: Each browser tab tracks attempts separately
- **Audit Trail**: All PIN resets are logged

## Troubleshooting

### "Too many attempts" message
- Wait 30 seconds and try again
- If you forgot your PIN, ask your instructor

### PIN creation won't accept my input
- Must be exactly 4 digits
- No letters or symbols
- No spaces

### I closed my browser during PIN creation
- Just log in again - you'll be prompted to create the PIN

### Different PIN on different computer?
- PINs are per-student, not per-computer
- Same PIN works everywhere

## Technical Details

### Bundle Impact
- ~2KB additional JavaScript (gzipped)
- No external dependencies
- Works completely offline

### Browser Support
- Chrome/Edge 96+
- Firefox 102+
- Uses Web Crypto API for hashing

### Data Storage
- PIN hash in IndexedDB with student record
- Rate limit state in sessionStorage
- Audit log in IndexedDB

## Testing the Feature

### Manual Testing
1. **New Student**: Clear all data, try to login → should prompt for PIN creation
2. **Returning Student**: Login with correct PIN → should work
3. **Wrong PIN**: Enter wrong PIN 3 times → should lock out for 30 seconds
4. **Instructor Reset**: Reset a PIN → student should create new PIN
5. **Migration**: Load old student data → should prompt for PIN on login

### Automated Tests
```bash
# Unit tests
npm run test:unit -- pin-service
npm run test:unit -- rate-limiter

# Integration tests
npm run test:integration -- login-flow
npm run test:integration -- instructor-reset

# E2E tests
npm run test:e2e -- pin-creation
npm run test:e2e -- pin-authentication
```

## Implementation Timeline

1. **Phase 1**: Core PIN functionality (Week 1)
   - PIN hashing service
   - Login component updates
   - Basic validation

2. **Phase 2**: Rate limiting & UX (Week 1-2)
   - Failed attempt tracking
   - Lockout countdown
   - Clear error messages

3. **Phase 3**: Instructor tools (Week 2)
   - Reset functionality
   - Audit logging
   - Migration support

4. **Phase 4**: Testing & Polish (Week 3)
   - Full test coverage
   - Performance optimization
   - Security review