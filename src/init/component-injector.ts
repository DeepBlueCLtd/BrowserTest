/**
 * Component Injector
 * Injects UI components into the DOM during initialization
 */

import '../components/qd-login.js';
import '../components/qd-status.js';
import '../components/qd-instructor/qd-instructor.js';
import { info } from '../utils/logger.js';

/**
 * Default container selectors for component injection
 */
export const DEFAULT_CONTAINERS = {
  /** Where to inject status panel (Oxygen WebHelp default) */
  statusPanel: '.wh_top_menu_and_indexterms_link',
} as const;

/**
 * Configuration for component injection
 */
export interface ComponentInjectorConfig {
  /** Selector for status panel container */
  statusPanelContainer?: string;
  /** Database name for storage service */
  dbName?: string;
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

  markPanelHost(statusPanelContainer);
}

/** Class on the element that hosts the panels. */
export const PANEL_HOST_CLASS = 'qd-panel-host';
/** Class on the host's parent, so narrow screens can give the host its own row. */
export const PANEL_HOST_PARENT_CLASS = 'qd-panel-host-parent';

/**
 * Tag the panel container and its parent so the global stylesheet can move
 * the panels onto their own full-width header row on narrow screens. Oxygen's
 * header row does not wrap, so at 768 px the panel ran off the right edge and
 * hid Logout (SRD 013 UX-06).
 *
 * @param containerSelector - Selector for the panel container
 */
function markPanelHost(containerSelector: string): void {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return;
  }
  container.classList.add(PANEL_HOST_CLASS);
  container.parentElement?.classList.add(PANEL_HOST_PARENT_CLASS);
}
