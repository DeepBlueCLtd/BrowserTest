/**
 * Component Injector
 * Injects UI components into the DOM during initialization
 */

import '../components/qd-login.js';
import '../components/qd-status.js';
import '../components/qd-instructor/qd-instructor.js';
import '../components/qd-storage-monitor.js';
import { info } from '../utils/logger.js';

/**
 * Default container selectors for component injection
 */
export const DEFAULT_CONTAINERS = {
  /** Where to inject status panel (Oxygen WebHelp default) */
  statusPanel: '.wh_top_menu_and_indexterms_link',
  /** Where to inject storage monitor (body) */
  storageMonitor: 'body',
} as const;

/**
 * Configuration for component injection
 */
export interface ComponentInjectorConfig {
  /** Selector for status panel container */
  statusPanelContainer?: string;
  /** Selector for storage monitor container */
  storageMonitorContainer?: string;
  /** Database name for storage monitor */
  dbName?: string;
  /** Enable debug mode (shows storage monitor) */
  debug?: boolean;
}

/**
 * Inject login component into status panel container
 */
export function injectLoginComponent(containerSelector: string): HTMLElement | null {
  const container = document.querySelector(containerSelector);
  if (!container) {
    info(`Login component not injected: container '${containerSelector}' not found`);
    return null;
  }

  const login = document.createElement('qd-login');
  container.appendChild(login);
  info('Login component injected');
  return login;
}

/**
 * Inject status component into status panel container
 */
export function injectStatusComponent(containerSelector: string): HTMLElement | null {
  const container = document.querySelector(containerSelector);
  if (!container) {
    info(`Status component not injected: container '${containerSelector}' not found`);
    return null;
  }

  const status = document.createElement('qd-status');
  container.appendChild(status);
  info('Status component injected');
  return status;
}

/**
 * Inject instructor component (shown when instructor unlocked)
 */
export function injectInstructorComponent(containerSelector: string): HTMLElement | null {
  const container = document.querySelector(containerSelector);
  if (!container) {
    info(`Instructor component not injected: container '${containerSelector}' not found`);
    return null;
  }

  const instructor = document.createElement('qd-instructor');
  container.appendChild(instructor);
  info('Instructor component injected');
  return instructor;
}

/**
 * Inject storage monitor for debugging
 */
export function injectStorageMonitor(
  config: Pick<ComponentInjectorConfig, 'storageMonitorContainer' | 'dbName' | 'debug'>
): HTMLElement | null {
  if (!config.debug) {
    return null;
  }

  const containerSelector = config.storageMonitorContainer || DEFAULT_CONTAINERS.storageMonitor;
  const container = document.querySelector(containerSelector);
  if (!container) {
    info(`Storage monitor not injected: container '${containerSelector}' not found`);
    return null;
  }

  const monitor = document.createElement('qd-storage-monitor');
  if (config.dbName) {
    monitor.setAttribute('dbName', config.dbName);
  }
  container.appendChild(monitor);
  info('Storage monitor injected (debug mode)');
  return monitor;
}

/**
 * Inject all UI components based on configuration
 */
export function injectComponents(config: ComponentInjectorConfig = {}): void {
  const statusPanelContainer = config.statusPanelContainer || DEFAULT_CONTAINERS.statusPanel;

  // Always inject login component (handles showing/hiding based on session state)
  injectLoginComponent(statusPanelContainer);

  // Always inject status component (handles showing/hiding based on session state)
  injectStatusComponent(statusPanelContainer);

  // Always inject instructor component (hidden until unlocked)
  injectInstructorComponent(statusPanelContainer);

  // Inject storage monitor if debug mode enabled
  injectStorageMonitor({
    storageMonitorContainer: config.storageMonitorContainer,
    dbName: config.dbName,
    debug: config.debug,
  });
}
