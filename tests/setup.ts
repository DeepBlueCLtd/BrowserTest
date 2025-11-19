/**
 * Vitest global setup file
 * Runs before all tests
 */

// Mock IndexedDB for testing
import 'fake-indexeddb/auto';

// Setup Web Crypto API for jsdom environment
import { Crypto } from '@peculiar/webcrypto';
Object.defineProperty(globalThis, 'crypto', {
  value: new Crypto(),
  writable: true,
  enumerable: true,
  configurable: true,
});

// Setup DOM testing utilities
import { afterEach } from 'vitest';

// Auto-cleanup after each test
afterEach(() => {
  // Clear storage after each test
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
});

// Global test utilities can be added here
