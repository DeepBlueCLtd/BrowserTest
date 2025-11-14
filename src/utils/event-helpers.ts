/**
 * Custom Event Helpers
 *
 * Provides utilities for emitting and listening to custom events.
 * Standardizes the qd:* event namespace and reduces code duplication.
 *
 * Eliminates 8+ duplicate custom event creation patterns.
 */

/**
 * Event detail types for type safety
 */
export interface QdLoginEvent {
  serviceId: string;
  name: string;
  release: string;
  timestamp: string;
}

export interface QdLogoutEvent {
  timestamp: string;
}

export interface QdAnswerSavedEvent {
  questionIndex: number;
  answer: {
    answer: string;
    success: boolean;
    timestamp: string;
  };
  tableElement: HTMLTableElement;
}

export interface QdStateChangedEvent {
  pageId: string;
  state: 'unstarted' | 'incomplete' | 'complete';
}

export interface QdInstructorUnlockEvent {
  timestamp: string;
}

export interface QdInstructorLockEvent {
  timestamp: string;
}

export interface QdDataClearedEvent {
  timestamp: string;
}

export interface QdInitEvent {
  version: string;
  tablesFound: number;
}

/**
 * Event name constants
 */
export const QD_EVENTS = {
  LOGIN: 'qd:login',
  LOGOUT: 'qd:logout',
  ANSWER_SAVED: 'qd:answer-saved',
  STATE_CHANGED: 'qd:state-changed',
  INSTRUCTOR_UNLOCK: 'qd:instructor-unlock',
  INSTRUCTOR_LOCK: 'qd:instructor-lock',
  DATA_CLEARED: 'qd:data-cleared',
  INIT: 'qd:init',
} as const;

/**
 * Emit a custom event with type safety
 *
 * @param eventName - Event name (use QD_EVENTS constants)
 * @param detail - Event detail data
 * @param options - Event options (bubbles, composed, cancelable)
 * @param target - Target element (default: document)
 *
 * @example
 * ```typescript
 * // Emit login event
 * emitEvent(QD_EVENTS.LOGIN, {
 *   serviceId: 'RN2344',
 *   name: 'John Doe',
 *   release: '02-2025',
 *   timestamp: new Date().toISOString()
 * });
 *
 * // Emit from specific element
 * emitEvent(QD_EVENTS.ANSWER_SAVED, answerData, {}, tableElement);
 * ```
 */
export function emitEvent<T>(
  eventName: string,
  detail: T,
  options?: {
    bubbles?: boolean;
    composed?: boolean;
    cancelable?: boolean;
  },
  target: EventTarget = document,
): void {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: options?.bubbles ?? true,
    composed: options?.composed ?? true,
    cancelable: options?.cancelable ?? false,
  });

  target.dispatchEvent(event);
}

/**
 * Listen for a custom event with type safety
 *
 * @param eventName - Event name (use QD_EVENTS constants)
 * @param handler - Event handler function
 * @param target - Target element (default: document)
 * @returns Cleanup function to remove listener
 *
 * @example
 * ```typescript
 * // Listen for login events
 * const cleanup = onEvent<QdLoginEvent>(QD_EVENTS.LOGIN, (event) => {
 *   console.log('User logged in:', event.detail.serviceId);
 * });
 *
 * // Later: cleanup();
 * ```
 */
export function onEvent<T>(
  eventName: string,
  handler: (event: CustomEvent<T>) => void,
  target: EventTarget = document,
): () => void {
  const listener = handler as EventListener;
  target.addEventListener(eventName, listener);

  // Return cleanup function
  return () => {
    target.removeEventListener(eventName, listener);
  };
}

/**
 * Listen for a custom event once
 *
 * @param eventName - Event name
 * @param handler - Event handler function (called only once)
 * @param target - Target element (default: document)
 *
 * @example
 * ```typescript
 * // Listen for init event once
 * onceEvent<QdInitEvent>(QD_EVENTS.INIT, (event) => {
 *   console.log('System initialized:', event.detail.version);
 * });
 * ```
 */
export function onceEvent<T>(
  eventName: string,
  handler: (event: CustomEvent<T>) => void,
  target: EventTarget = document,
): void {
  const listener = (event: Event) => {
    handler(event as CustomEvent<T>);
    target.removeEventListener(eventName, listener);
  };

  target.addEventListener(eventName, listener, { once: true });
}

/**
 * Wait for an event as a Promise
 *
 * @param eventName - Event name to wait for
 * @param target - Target element (default: document)
 * @param timeout - Optional timeout in milliseconds
 * @returns Promise that resolves with event detail
 *
 * @example
 * ```typescript
 * // Wait for login
 * const loginData = await waitForEvent<QdLoginEvent>(QD_EVENTS.LOGIN);
 * console.log('Logged in as:', loginData.name);
 *
 * // With timeout
 * try {
 *   const data = await waitForEvent<QdLoginEvent>(QD_EVENTS.LOGIN, document, 5000);
 * } catch (err) {
 *   console.error('Login timeout');
 * }
 * ```
 */
export function waitForEvent<T>(
  eventName: string,
  target: EventTarget = document,
  timeout?: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let timeoutId: number | undefined;

    const listener = (event: Event) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolve((event as CustomEvent<T>).detail);
      target.removeEventListener(eventName, listener);
    };

    target.addEventListener(eventName, listener, { once: true });

    if (timeout) {
      timeoutId = setTimeout(() => {
        target.removeEventListener(eventName, listener);
        reject(new Error(`Event ${eventName} timeout after ${timeout}ms`));
      }, timeout) as unknown as number;
    }
  });
}

/**
 * Emit login event
 *
 * @param detail - Login event data
 */
export function emitLogin(detail: QdLoginEvent): void {
  emitEvent(QD_EVENTS.LOGIN, detail);
}

/**
 * Emit logout event
 */
export function emitLogout(): void {
  emitEvent(QD_EVENTS.LOGOUT, {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit answer saved event
 *
 * @param detail - Answer saved event data
 * @param target - Table element that triggered the event
 */
export function emitAnswerSaved(detail: QdAnswerSavedEvent, target?: EventTarget): void {
  emitEvent(QD_EVENTS.ANSWER_SAVED, detail, {}, target || document);
}

/**
 * Emit state changed event
 *
 * @param pageId - Page identifier
 * @param state - New completion state
 */
export function emitStateChanged(
  pageId: string,
  state: 'unstarted' | 'incomplete' | 'complete',
): void {
  emitEvent(QD_EVENTS.STATE_CHANGED, { pageId, state });
}

/**
 * Emit instructor unlock event
 */
export function emitInstructorUnlock(): void {
  emitEvent(QD_EVENTS.INSTRUCTOR_UNLOCK, {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit instructor lock event
 */
export function emitInstructorLock(): void {
  emitEvent(QD_EVENTS.INSTRUCTOR_LOCK, {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit data cleared event
 */
export function emitDataCleared(): void {
  emitEvent(QD_EVENTS.DATA_CLEARED, {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit init event
 *
 * @param version - System version
 * @param tablesFound - Number of quiz tables found
 */
export function emitInit(version: string, tablesFound: number): void {
  emitEvent(QD_EVENTS.INIT, { version, tablesFound });
}
