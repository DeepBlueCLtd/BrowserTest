/**
 * Event helper utilities
 *
 * Provides type-safe custom event emission and handling, with consistent
 * configuration for bubbling and composition. Saves ~8 lines per event emission.
 */

import type { QuizEvents } from '../types/contracts.js';

/**
 * Emit a custom event on the document
 *
 * Events bubble by default and are composed (cross shadow DOM boundaries).
 *
 * @param name - Event name (should use 'qd:' namespace)
 * @param detail - Event detail data
 * @param options - Optional event configuration
 *
 * @example
 * ```typescript
 * // Emit login event
 * emitCustomEvent('qd:login', {
 *   serviceId: 'RN2344',
 *   name: 'John Doe',
 *   loginTime: new Date().toISOString(),
 * });
 * ```
 */
export function emitCustomEvent<K extends keyof QuizEvents>(
  name: K,
  detail: QuizEvents[K]['detail'],
  options?: {
    bubbles?: boolean;
    composed?: boolean;
    cancelable?: boolean;
  },
): boolean {
  const event = new CustomEvent(name, {
    detail,
    bubbles: options?.bubbles ?? true,
    composed: options?.composed ?? true,
    cancelable: options?.cancelable ?? false,
  });

  return document.dispatchEvent(event);
}

/**
 * Add event listener for custom event
 *
 * @param name - Event name
 * @param handler - Event handler function
 * @param options - Optional event listener options
 *
 * @example
 * ```typescript
 * // Listen for login events
 * const unsubscribe = addEventListener('qd:login', (event) => {
 *   console.log('User logged in:', event.detail.serviceId);
 * });
 *
 * // Later: remove listener
 * unsubscribe();
 * ```
 */
export function addEventListener<K extends keyof QuizEvents>(
  name: K,
  handler: (event: CustomEvent<QuizEvents[K]['detail']>) => void,
  options?: AddEventListenerOptions,
): () => void {
  const listener = handler as EventListener;
  document.addEventListener(name, listener, options);

  // Return unsubscribe function
  return () => {
    document.removeEventListener(name, listener, options);
  };
}

/**
 * Remove event listener for custom event
 *
 * @param name - Event name
 * @param handler - Event handler function
 * @param options - Optional event listener options
 *
 * @example
 * ```typescript
 * function handleLogin(event) {
 *   console.log('Logged in:', event.detail.serviceId);
 * }
 *
 * addEventListener('qd:login', handleLogin);
 * // Later...
 * removeEventListener('qd:login', handleLogin);
 * ```
 */
export function removeEventListener<K extends keyof QuizEvents>(
  name: K,
  handler: (event: CustomEvent<QuizEvents[K]['detail']>) => void,
  options?: EventListenerOptions,
): void {
  const listener = handler as EventListener;
  document.removeEventListener(name, listener, options);
}

/**
 * Add one-time event listener that auto-removes after first trigger
 *
 * @param name - Event name
 * @param handler - Event handler function
 *
 * @example
 * ```typescript
 * // Wait for login, then perform action once
 * addEventListenerOnce('qd:login', (event) => {
 *   console.log('First login detected');
 * });
 * ```
 */
export function addEventListenerOnce<K extends keyof QuizEvents>(
  name: K,
  handler: (event: CustomEvent<QuizEvents[K]['detail']>) => void,
): void {
  const listener = handler as EventListener;
  document.addEventListener(name, listener, { once: true });
}

/**
 * Wait for a specific event to occur
 *
 * Returns a promise that resolves when the event is emitted.
 *
 * @param name - Event name to wait for
 * @param timeout - Optional timeout in milliseconds
 * @returns Promise that resolves with event detail
 *
 * @example
 * ```typescript
 * // Wait for login
 * const session = await waitForEvent('qd:login', 5000);
 * console.log('User logged in:', session.serviceId);
 * ```
 */
export function waitForEvent<K extends keyof QuizEvents>(
  name: K,
  timeout?: number,
): Promise<QuizEvents[K]['detail']> {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const handler = (event: Event) => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      const customEvent = event as CustomEvent<QuizEvents[K]['detail']>;
      resolve(customEvent.detail);
    };

    document.addEventListener(name, handler, { once: true });

    if (timeout !== undefined) {
      timeoutId = setTimeout(() => {
        document.removeEventListener(name, handler);
        reject(new Error(`Timeout waiting for event: ${name}`));
      }, timeout);
    }
  });
}

/**
 * Dispatch event on a specific element
 *
 * @param element - Element to dispatch event on
 * @param name - Event name
 * @param detail - Event detail
 * @param options - Optional event configuration
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * if (button) {
 *   dispatchEventOn(button, 'qd:custom', { data: 'test' });
 * }
 * ```
 */
export function dispatchEventOn<T>(
  element: Element,
  name: string,
  detail: T,
  options?: {
    bubbles?: boolean;
    composed?: boolean;
    cancelable?: boolean;
  },
): boolean {
  const event = new CustomEvent(name, {
    detail,
    bubbles: options?.bubbles ?? true,
    composed: options?.composed ?? true,
    cancelable: options?.cancelable ?? false,
  });

  return element.dispatchEvent(event);
}
