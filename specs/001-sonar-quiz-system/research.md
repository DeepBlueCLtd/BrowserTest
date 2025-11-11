# Research & Technical Decisions: Sonar Quiz System

**Date**: 2025-11-11
**Feature**: Sonar Quiz System
**Purpose**: Resolve technical decisions for offline quiz enhancement system

## Key Decisions

### 1. Web Components Framework

**Decision**: Lit 3 for custom elements
**Rationale**:
- Minimal runtime overhead (~5KB gzipped)
- Native Web Components with reactive properties
- Shadow DOM encapsulation prevents CSS conflicts with DITA styles
- TypeScript-first with excellent tooling support
**Alternatives considered**:
- Vanilla Web Components: More boilerplate, harder to maintain
- React: Too heavy (40KB+), requires build step for users
- Vue: Similar weight concerns, less suited for drop-in components

### 2. Storage Strategy

**Decision**: IndexedDB for persistence, sessionStorage for cache
**Rationale**:
- IndexedDB provides reliable offline storage with 50MB+ quota
- Structured data storage with transaction support
- sessionStorage perfect for 30-minute session management
- Both work reliably from file:// protocol
**Alternatives considered**:
- localStorage: 5MB limit insufficient for cohort data
- WebSQL: Deprecated, no longer supported
- Cache API: Requires service workers, doesn't work from file://

### 3. Build & Bundle Strategy

**Decision**: Vite library mode with IIFE output
**Rationale**:
- Optimized tree-shaking keeps bundle under 25KB
- IIFE format works as drop-in script without module support
- Source maps for debugging while maintaining small prod bundle
- Fast development builds with HMR support
**Alternatives considered**:
- Webpack: More complex config, slower builds
- Rollup alone: Less dev experience features
- esbuild: Less mature plugin ecosystem

### 4. DOM Enhancement Pattern

**Decision**: Progressive enhancement with validation
**Rationale**:
- Detect and upgrade existing DITA tables without modification
- Graceful degradation if JavaScript disabled
- Clear error messages for authoring violations
- Zero configuration required from authors
**Alternatives considered**:
- Full replacement: Would break DITA publishing workflow
- Server-side rendering: Requires backend, violates offline requirement
- iframe injection: Security issues with file:// protocol

### 5. Testing Strategy

**Decision**: Vitest + Playwright + Storybook/Chromatic
**Rationale**:
- Vitest provides fast unit testing with native ESM support
- Playwright enables file:// protocol E2E testing
- Storybook isolates component development
- Chromatic catches visual regressions automatically
**Alternatives considered**:
- Jest: Slower, requires more configuration for ESM
- Cypress: Doesn't support file:// protocol well
- Puppeteer: Less cross-browser support

### 6. Data Key Strategy

**Decision**: Composite keys with release/user namespacing
**Rationale**:
- Format: `qd/{release}/u{serviceId}` ensures data isolation
- Prevents conflicts between quarterly releases
- Enables per-user data management
- Simple to query and manage programmatically
**Alternatives considered**:
- UUID keys: Harder to debug and query
- Sequential IDs: Risk of collisions
- Hash-based keys: Unnecessary complexity

### 7. Session Management

**Decision**: sessionStorage with 30-minute timeout
**Rationale**:
- Browser-native session handling
- Automatic cleanup on tab close
- Simple timeout implementation with timestamp checking
- Separate from persistent data in IndexedDB
**Alternatives considered**:
- Cookie-based: Doesn't work from file:// URLs
- In-memory: Lost on page refresh
- IndexedDB sessions: Requires manual cleanup

### 8. CSV Export Format

**Decision**: Standard RFC 4180 CSV with BOM for Excel compatibility
**Rationale**:
- UTF-8 with BOM ensures proper Excel encoding
- Simple format instructors can open directly
- Includes headers for clarity
- Standard library support available
**Alternatives considered**:
- JSON export: Not instructor-friendly
- Excel XLSX: Requires heavy libraries
- TSV: Less universal support

### 9. Password Protection

**Decision**: Client-side password check with local storage
**Rationale**:
- Simple implementation for instructor unlock
- No security requirements (training data only)
- Password can be distributed separately to instructors
- Stored hashed in localStorage for convenience
**Alternatives considered**:
- No protection: Too easy to accidentally trigger
- Server validation: Violates offline requirement
- Crypto key: Overcomplicated for use case

### 10. Visual Feedback Colors

**Decision**: Red/Amber/Green with accessible patterns
**Rationale**:
- Universal understanding of RAG status
- WCAG AA contrast ratios maintained
- Additional text labels for colorblind users
- CSS variables for customization if needed
**Alternatives considered**:
- Icons only: Less immediately recognizable
- Blue/Yellow/Green: Less intuitive
- Numeric scores: Doesn't show completion state clearly

## Implementation Notes

### Bundle Size Management
- Use dynamic imports for instructor-only features
- Tree-shake unused Lit decorators
- Minify with terser for optimal compression
- Target <25KB gzipped for full bundle

### Performance Optimizations
- Debounce auto-save operations (200ms)
- Batch IndexedDB writes in transactions
- Lazy-load analysis table enhancements
- Use CSS containment for table rendering

### Browser Compatibility
- Target: Chrome/Edge 96+, Firefox 102+
- Polyfills: None needed for target browsers
- Progressive enhancement for older browsers
- Feature detection for storage APIs

### Error Handling
- Clear validation messages for authoring errors
- Fallback to sessionStorage if IndexedDB fails
- Network detection to warn if accidentally online
- Transaction retries for storage operations

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|---------|------------|
| Storage quota exceeded | High | Monitor usage, warn at 80%, provide cleanup tools |
| Browser compatibility issues | Medium | Extensive cross-browser testing, graceful degradation |
| File:// protocol restrictions | Medium | Document browser settings, provide setup guide |
| Performance with large cohorts | Low | Pagination for instructor views, indexed queries |
| Concurrent tab conflicts | Low | Storage events for cross-tab sync, last-write-wins |

## Next Steps

1. Create frozen type contracts (contracts.ts)
2. Define data models for all entities
3. Build storage adapter interface
4. Develop Storybook stories for components
5. Implement TDD test suite structure