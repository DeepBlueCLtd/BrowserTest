/**
 * DOM Configuration Reader
 *
 * Reads runtime configuration from hidden DOM elements injected by DITA publishing.
 * This allows configuration to be set via Oxygen Transformation Scenario parameters.
 *
 * Pattern: <span id="qd-config-name" style="display:none;">value</span>
 */

import { info, warn } from '../utils/logger.js';

/**
 * Configuration keys that can be read from DOM
 */
export interface DOMConfig {
  /**
   * CSS selector for status panel container
   * Default: '.wh_top_menu_and_indexterms_link'
   * DOM ID: 'qd-status-container'
   */
  statusPanelContainer: string;

  /**
   * CSS selector for publication title element (Release ID extraction)
   * Default: '.wh_publication_title .title'
   * DOM ID: 'qd-title-selector'
   */
  titleSelector: string;

  /**
   * Instructor password hash (12-character hash for verification)
   * Default: '' (no instructor access)
   * DOM ID: 'qd-instructor-hash'
   */
  instructorHash: string;

  /**
   * IndexedDB database name
   * REQUIRED: Must be provided via #qd-db-name element - no default
   * DOM ID: 'qd-db-name'
   */
  dbName: string;
}

/**
 * Default configuration values
 * NOTE: dbName has NO default - it MUST be provided via #qd-db-name element
 */
const DEFAULT_CONFIG: Omit<DOMConfig, 'dbName'> & { dbName: string } = {
  statusPanelContainer: '.wh_top_menu_and_indexterms_link',
  titleSelector: '.wh_publication_title .title',
  instructorHash: '',
  dbName: '', // No default - must be provided by page
};

/**
 * Configuration element IDs
 */
export const CONFIG_IDS = {
  statusPanelContainer: 'qd-status-container',
  titleSelector: 'qd-title-selector',
  instructorHash: 'qd-instructor-hash',
  dbName: 'qd-db-name',
} as const;

/**
 * Read a configuration value from a hidden DOM element
 *
 * @param elementId - ID of the hidden element
 * @param defaultValue - Default value if element not found
 * @returns Trimmed text content or default value
 */
function readConfigElement(elementId: string, defaultValue: string): string {
  const element = document.querySelector(`#${elementId}`);

  if (!element) {
    return defaultValue;
  }

  const value = element.textContent?.trim() || '';

  if (value === '') {
    warn(`Config element #${elementId} found but empty, using default: "${defaultValue}"`);
    return defaultValue;
  }

  info(`Config read from #${elementId}: "${value}"`);
  return value;
}

/**
 * Read a REQUIRED configuration value from a hidden DOM element
 *
 * @param elementId - ID of the hidden element
 * @throws Error if element not found or value is empty
 * @returns Trimmed text content
 */
function readRequiredConfigElement(elementId: string): string {
  const element = document.querySelector(`#${elementId}`);

  if (!element) {
    const msg = `FATAL: Required config element #${elementId} not found in DOM. Processing stopped.`;
    console.error(msg);
    throw new Error(msg);
  }

  const value = element.textContent?.trim() || '';

  if (value === '') {
    const msg = `FATAL: Required config element #${elementId} is empty. Processing stopped.`;
    console.error(msg);
    throw new Error(msg);
  }

  info(`Required config read from #${elementId}: "${value}"`);
  return value;
}

/**
 * Read all configuration from DOM
 *
 * Scans the document for hidden configuration elements and returns a complete
 * configuration object with defaults applied for any missing values.
 *
 * @returns Complete configuration with defaults applied
 */
export function readDOMConfig(): DOMConfig {
  info('Reading configuration from DOM...');

  // dbName is REQUIRED - throws if missing/empty
  const dbName = readRequiredConfigElement(CONFIG_IDS.dbName);

  const config: DOMConfig = {
    statusPanelContainer: readConfigElement(
      CONFIG_IDS.statusPanelContainer,
      DEFAULT_CONFIG.statusPanelContainer,
    ),
    titleSelector: readConfigElement(CONFIG_IDS.titleSelector, DEFAULT_CONFIG.titleSelector),
    instructorHash: readConfigElement(CONFIG_IDS.instructorHash, DEFAULT_CONFIG.instructorHash),
    dbName,
  };

  info('Configuration loaded:', config);

  return config;
}

/**
 * Get default configuration
 *
 * @returns Default configuration object
 */
export function getDefaultConfig(): DOMConfig {
  return { ...DEFAULT_CONFIG };
}
