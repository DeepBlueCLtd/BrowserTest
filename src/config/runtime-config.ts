/**
 * Runtime configuration for Sonar Quiz System
 *
 * This file defines the configuration interface that can be passed to
 * the main application initialization function. All settings can be
 * controlled at runtime without descending into the file structure.
 *
 * @example
 * ```typescript
 * // Production mode with all defaults
 * SonarQuiz.init();
 *
 * // Development mode with encryption disabled for debugging
 * SonarQuiz.init({
 *   encryption: { enabled: false },
 *   debug: true,
 * });
 *
 * // Custom configuration
 * SonarQuiz.init({
 *   encryption: { enabled: true },
 *   debug: false,
 *   statusPanelContainer: '.my-custom-navbar',
 * });
 * ```
 */

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  /**
   * Enable AES-GCM encryption for sessionStorage
   *
   * When true (default): Session data is encrypted using Web Crypto API
   * When false: Session data is stored as plain JSON (for debugging)
   *
   * @default true
   */
  enabled: boolean;
}

/**
 * Main runtime configuration
 */
export interface RuntimeConfig {
  /**
   * Enable debug mode
   *
   * When true: Enables console logging, diagnostic output, storage monitor
   * When false: Silent operation, production mode
   *
   * @default false
   */
  debug: boolean;

  /**
   * Encryption configuration
   */
  encryption: EncryptionConfig;

  /**
   * CSS selector for status panel container
   *
   * The status panel (login form + progress display) will be injected
   * as the last child of this container.
   *
   * @default '.wh_top_menu_and_indexterms_link' (Oxygen WebHelp navbar)
   */
  statusPanelContainer: string;

  /**
   * Session timeout in minutes
   *
   * Auto-logout after this period of inactivity.
   *
   * @default 30
   */
  sessionTimeoutMinutes: number;
}

/**
 * Default runtime configuration
 */
export const defaultConfig: RuntimeConfig = {
  debug: false,
  encryption: {
    enabled: true,
  },
  statusPanelContainer: '.wh_top_menu_and_indexterms_link',
  sessionTimeoutMinutes: 30,
};

/**
 * Merge user configuration with defaults
 *
 * @param userConfig - Partial configuration provided by user
 * @returns Complete configuration with defaults applied
 */
export function mergeConfig(userConfig?: Partial<RuntimeConfig>): RuntimeConfig {
  return {
    debug: userConfig?.debug ?? defaultConfig.debug,
    encryption: {
      enabled: userConfig?.encryption?.enabled ?? defaultConfig.encryption.enabled,
    },
    statusPanelContainer: userConfig?.statusPanelContainer ?? defaultConfig.statusPanelContainer,
    sessionTimeoutMinutes: userConfig?.sessionTimeoutMinutes ?? defaultConfig.sessionTimeoutMinutes,
  };
}

/**
 * Validate runtime configuration
 *
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: RuntimeConfig): void {
  if (config.sessionTimeoutMinutes <= 0) {
    throw new Error(
      'sessionTimeoutMinutes must be positive (got: ' + config.sessionTimeoutMinutes + ')',
    );
  }

  if (!config.statusPanelContainer || config.statusPanelContainer.trim() === '') {
    throw new Error('statusPanelContainer must be a non-empty string');
  }
}
