# Feature Specification: Encrypt Stored Data

**Feature Branch**: `009-encrypt-stored-data`
**Created**: 2025-11-27
**Status**: Draft
**Input**: GitHub Issue #64 - Encrypt stored data to deter inspection via LocalStorage/IndexedDB

## Clarifications

### Session 2025-11-27

- Q: Storage Monitor reference? → A: Removed; no longer exists in codebase.
- Q: Mode toggle mechanism? → A: Dedicated boolean const `ENCRYPT_STORAGE`, independent of DEBUG_MODE.
- Q: Obfuscation key source? → A: Release ID from `.wh_publication_title .title` element.
- Q: Mixed obfuscated/unobfuscated records? → A: Fail fast with error if format mismatch detected.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Protected Student Data in Production (Priority: P1)

When the system is deployed in production mode, student answer data stored in IndexedDB should be obfuscated to discourage casual inspection via browser developer tools. This prevents students from easily reading stored answers or modifying their records through the browser's storage inspector.

**Why this priority**: Core security requirement - protects assessment integrity by deterring students from accessing stored answers through browser DevTools.

**Independent Test**: Deploy the system, submit quiz answers, then open browser DevTools → Application → IndexedDB. Verify that stored values appear as unintelligible obfuscated strings rather than readable JSON.

**Acceptance Scenarios**:

1. **Given** a student has submitted answers in production mode, **When** they inspect IndexedDB via browser DevTools, **Then** the stored data values appear as obfuscated/encoded strings that are not human-readable.

2. **Given** a student attempts to manually modify obfuscated IndexedDB data, **When** the system reads the tampered data, **Then** the system either fails gracefully with an error or treats the data as invalid/corrupt.

3. **Given** the obfuscation mechanism uses a page-embedded hashcode, **When** a student views page source, **Then** they cannot trivially reverse the obfuscation without technical effort beyond casual inspection.

---

### User Story 2 - Readable Data in Development Mode (Priority: P2)

During development, developers need to inspect stored data for debugging purposes. The system must allow readable (non-obfuscated) data storage when running in development mode.

**Why this priority**: Essential for developer productivity - debugging requires inspecting actual stored values.

**Independent Test**: Run the system in development mode, submit quiz answers, inspect IndexedDB via DevTools. Verify stored data is readable JSON.

**Acceptance Scenarios**:

1. **Given** the system runs in development mode, **When** a developer inspects IndexedDB via browser DevTools, **Then** stored data appears as readable JSON without obfuscation.

2. **Given** the system runs in development mode, **When** developers inspect IndexedDB directly via browser DevTools, **Then** stored data is immediately readable without additional tooling.

---

### User Story 3 - Instructor Access to Obfuscated Data (Priority: P3)

Instructors logged into the system can view and export student data regardless of obfuscation. The obfuscation happens at the storage layer, not the application layer.

**Why this priority**: Ensures instructor functionality remains unaffected by security measures.

**Independent Test**: Log in as instructor, view student scores, export CSV. Verify all data displays and exports correctly.

**Acceptance Scenarios**:

1. **Given** an instructor is logged in to production mode, **When** they view the scores modal, **Then** all student data displays correctly (decrypted transparently by the application).

2. **Given** an instructor exports data to CSV in production mode, **When** the export completes, **Then** the CSV contains readable, correct student answers and scores.

---

### Edge Cases

- What happens when switching from development to production mode with existing unobfuscated data? → **Run migration utility first; system will fail fast if unmigrated data detected.**
- How does the system handle corrupted/tampered obfuscated data? → **Treat as invalid per FR-005; graceful error handling.**
- What happens if the Release ID changes between releases? → **Non-issue: data is already partitioned by release in storage keys (`qd/{release}/u{serviceId}`), so each release's data uses its own key.**
- How does the system behave if IndexedDB contains a mix of obfuscated and unobfuscated records? → **Fail fast with error; do not attempt auto-detection.**

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST obfuscate all student answer data values stored in IndexedDB when running in production mode.
- **FR-002**: System MUST store data in readable format (no obfuscation) when running in development mode.
- **FR-003**: System MUST transparently decrypt obfuscated data when reading from IndexedDB, with no visible change to application behavior.
- **FR-004**: System MUST derive the obfuscation key from the Release ID (extracted from `.wh_publication_title .title` element).
- **FR-005**: System MUST detect and gracefully handle corrupted or tampered obfuscated data, treating it as invalid.
- **FR-006**: Obfuscation MUST NOT affect sessionStorage data (which is already cleared on logout/browser close).
- **FR-007**: System MUST provide a one-time migration utility to convert existing unobfuscated data before enabling obfuscation (not automatic on read).
- **FR-008**: A dedicated boolean constant (e.g., `ENCRYPT_STORAGE`) MUST control whether obfuscation is enabled, independent of other debug flags.
- **FR-009**: System MUST fail fast with a clear error if it detects a format mismatch (e.g., reading unobfuscated data when obfuscation is enabled, or vice versa).

### Key Entities

- **StudentRecord**: Primary entity to be obfuscated. Contains serviceId, name, release, answers, and scores.
- **ObfuscationKey**: Derived from Release ID. Used for encoding/decoding stored values.
- **EncryptionToggle**: A compile-time boolean constant (`ENCRYPT_STORAGE`) that enables or disables obfuscation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of IndexedDB stored values in production mode are not readable as plain JSON when inspected via browser DevTools.
- **SC-002**: All existing application functionality (quiz answering, score viewing, CSV export) works identically regardless of obfuscation state.
- **SC-003**: Obfuscation adds less than 50ms overhead per storage read/write operation.
- **SC-004**: Data migration from unobfuscated to obfuscated format completes successfully without data loss.
- **SC-005**: System correctly rejects or recovers from 100% of tampered obfuscated data attempts.

## Assumptions

- The obfuscation key is derived from the Release ID (always present in `.wh_publication_title .title`), not the optional instructor password hash.
- "Deterrence" level security is sufficient - this is not cryptographically secure encryption, just obfuscation to prevent casual inspection.
- A new boolean constant `ENCRYPT_STORAGE` will control obfuscation, separate from `DEBUG_MODE`.
- sessionStorage data does not require obfuscation since it's ephemeral and cleared on logout.
- Data migration from legacy unobfuscated format requires explicit one-time utility run before enabling obfuscation.

## Scope Boundaries

**In Scope**:
- IndexedDB value obfuscation for StudentRecord data
- Boolean const toggle (`ENCRYPT_STORAGE`) for enabling/disabling
- Transparent decrypt on read
- One-time migration utility for existing unobfuscated data
- Tamper detection and format mismatch error handling

**Out of Scope**:
- Full cryptographic encryption (AES, etc.)
- sessionStorage obfuscation
- Key management or rotation
- Obfuscation of IndexedDB keys (only values are obfuscated)
