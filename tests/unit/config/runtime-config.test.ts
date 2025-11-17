/**
 * Unit tests for runtime configuration
 */

import { describe, it, expect } from 'vitest';
import {
  mergeConfig,
  validateConfig,
  defaultConfig,
  type RuntimeConfig,
} from '../../../src/config/runtime-config.js';

describe('Runtime Configuration', () => {
  describe('defaultConfig', () => {
    it('should have correct default values', () => {
      expect(defaultConfig.debug).toBe(false);
      expect(defaultConfig.encryption.enabled).toBe(true);
      expect(defaultConfig.statusPanelContainer).toBe('.wh_top_menu_and_indexterms_link');
      expect(defaultConfig.sessionTimeoutMinutes).toBe(30);
    });
  });

  describe('mergeConfig()', () => {
    it('should return defaults when no user config provided', () => {
      const config = mergeConfig();

      expect(config).toEqual(defaultConfig);
    });

    it('should merge debug setting', () => {
      const config = mergeConfig({ debug: true });

      expect(config.debug).toBe(true);
      expect(config.encryption.enabled).toBe(true);
      expect(config.statusPanelContainer).toBe('.wh_top_menu_and_indexterms_link');
    });

    it('should merge encryption.enabled setting', () => {
      const config = mergeConfig({ encryption: { enabled: false } });

      expect(config.encryption.enabled).toBe(false);
      expect(config.debug).toBe(false);
    });

    it('should merge statusPanelContainer', () => {
      const config = mergeConfig({ statusPanelContainer: '.my-navbar' });

      expect(config.statusPanelContainer).toBe('.my-navbar');
      expect(config.debug).toBe(false);
      expect(config.encryption.enabled).toBe(true);
    });

    it('should merge sessionTimeoutMinutes', () => {
      const config = mergeConfig({ sessionTimeoutMinutes: 60 });

      expect(config.sessionTimeoutMinutes).toBe(60);
      expect(config.debug).toBe(false);
    });

    it('should merge multiple settings', () => {
      const config = mergeConfig({
        debug: true,
        encryption: { enabled: false },
        statusPanelContainer: '.custom',
        sessionTimeoutMinutes: 15,
      });

      expect(config.debug).toBe(true);
      expect(config.encryption.enabled).toBe(false);
      expect(config.statusPanelContainer).toBe('.custom');
      expect(config.sessionTimeoutMinutes).toBe(15);
    });

    it('should handle partial encryption config', () => {
      const config = mergeConfig({ encryption: { enabled: false } });

      expect(config.encryption.enabled).toBe(false);
    });

    it('should handle empty object', () => {
      const config = mergeConfig({});

      expect(config).toEqual(defaultConfig);
    });
  });

  describe('validateConfig()', () => {
    it('should accept valid default config', () => {
      expect(() => validateConfig(defaultConfig)).not.toThrow();
    });

    it('should accept valid custom config', () => {
      const config: RuntimeConfig = {
        debug: true,
        encryption: { enabled: false },
        statusPanelContainer: '.my-container',
        sessionTimeoutMinutes: 60,
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should reject zero sessionTimeoutMinutes', () => {
      const config: RuntimeConfig = {
        ...defaultConfig,
        sessionTimeoutMinutes: 0,
      };

      expect(() => validateConfig(config)).toThrow('sessionTimeoutMinutes must be positive');
    });

    it('should reject negative sessionTimeoutMinutes', () => {
      const config: RuntimeConfig = {
        ...defaultConfig,
        sessionTimeoutMinutes: -5,
      };

      expect(() => validateConfig(config)).toThrow('sessionTimeoutMinutes must be positive');
    });

    it('should reject empty statusPanelContainer', () => {
      const config: RuntimeConfig = {
        ...defaultConfig,
        statusPanelContainer: '',
      };

      expect(() => validateConfig(config)).toThrow(
        'statusPanelContainer must be a non-empty string',
      );
    });

    it('should reject whitespace-only statusPanelContainer', () => {
      const config: RuntimeConfig = {
        ...defaultConfig,
        statusPanelContainer: '   ',
      };

      expect(() => validateConfig(config)).toThrow(
        'statusPanelContainer must be a non-empty string',
      );
    });

    it('should accept minimum valid sessionTimeoutMinutes', () => {
      const config: RuntimeConfig = {
        ...defaultConfig,
        sessionTimeoutMinutes: 1,
      };

      expect(() => validateConfig(config)).not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should support development config', () => {
      const config = mergeConfig({
        debug: true,
        encryption: { enabled: false },
      });

      validateConfig(config);

      expect(config.debug).toBe(true);
      expect(config.encryption.enabled).toBe(false);
    });

    it('should support production config', () => {
      const config = mergeConfig({
        debug: false,
        encryption: { enabled: true },
      });

      validateConfig(config);

      expect(config.debug).toBe(false);
      expect(config.encryption.enabled).toBe(true);
    });

    it('should support custom timeout', () => {
      const config = mergeConfig({
        sessionTimeoutMinutes: 120,
      });

      validateConfig(config);

      expect(config.sessionTimeoutMinutes).toBe(120);
    });
  });
});
