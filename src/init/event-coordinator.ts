/**
 * Event Coordinator
 * Registers and coordinates custom events across the application
 */

import { info } from '../utils/logger.js';

/**
 * Custom event detail types
 */
export interface LoginEventDetail {
  serviceId: string;
  name: string;
  release: string;
  loginTime: string;
}

export interface LogoutEventDetail {
  serviceId: string;
}

export interface AnswerSavedEventDetail {
  pageId: string;
  questionIndex: number;
  answer: string;
  success: boolean;
}

export interface StateChangedEventDetail {
  pageId: string;
  state: string;
}

export interface InstructorUnlockEventDetail {
  unlockTime: string;
}

export interface DataClearedEventDetail {
  timestamp: string;
}

/**
 * Event coordinator for managing application events
 */
export class EventCoordinator {
  private listeners: Map<string, EventListener[]> = new Map();

  /**
   * Register all event listeners
   */
  initialize(): void {
    this.registerLoginHandlers();
    this.registerLogoutHandlers();
    this.registerAnswerHandlers();
    this.registerStateHandlers();
    this.registerInstructorHandlers();
    this.registerDataHandlers();

    info('Event coordinator initialized');
  }

  /**
   * Register handlers for login events
   */
  private registerLoginHandlers(): void {
    this.addEventListener('qd:login', (event) => {
      const detail = (event as CustomEvent<LoginEventDetail>).detail;
      info(`Login event: ${detail.serviceId} (${detail.name})`);

      // Trigger cache rebuild
      this.dispatchEvent('qd:cache-rebuild', {});
    });
  }

  /**
   * Register handlers for logout events
   */
  private registerLogoutHandlers(): void {
    this.addEventListener('qd:logout', (event) => {
      const detail = (event as CustomEvent<LogoutEventDetail>).detail;
      info(`Logout event: ${detail.serviceId}`);

      // Clear any cached data
      this.dispatchEvent('qd:cache-clear', {});
    });
  }

  /**
   * Register handlers for answer saved events
   */
  private registerAnswerHandlers(): void {
    this.addEventListener('qd:answer-saved', (event) => {
      const detail = (event as CustomEvent<AnswerSavedEventDetail>).detail;
      info(
        `Answer saved: ${detail.pageId} Q${detail.questionIndex} = ${detail.answer} (${detail.success ? 'correct' : 'incorrect'})`,
      );

      // Trigger cache update
      this.dispatchEvent('qd:cache-update', { pageId: detail.pageId });
    });
  }

  /**
   * Register handlers for state changed events
   */
  private registerStateHandlers(): void {
    this.addEventListener('qd:state-changed', (event) => {
      const detail = (event as CustomEvent<StateChangedEventDetail>).detail;
      info(`State changed: ${detail.pageId} → ${detail.state}`);

      // Update badge state
      this.dispatchEvent('qd:badge-update', { pageId: detail.pageId, state: detail.state });
    });
  }

  /**
   * Register handlers for instructor events
   */
  private registerInstructorHandlers(): void {
    this.addEventListener('qd:instructor-unlock', (event) => {
      const detail = (event as CustomEvent<InstructorUnlockEventDetail>).detail;
      info(`Instructor mode unlocked at ${detail.unlockTime}`);
    });

    this.addEventListener('qd:instructor-lock', () => {
      info('Instructor mode locked');
    });
  }

  /**
   * Register handlers for data management events
   */
  private registerDataHandlers(): void {
    this.addEventListener('qd:data-cleared', (event) => {
      const detail = (event as CustomEvent<DataClearedEventDetail>).detail;
      info(`All data cleared at ${detail.timestamp}`);

      // Clear cache
      this.dispatchEvent('qd:cache-clear', {});
    });
  }

  /**
   * Add event listener
   */
  private addEventListener(eventName: string, handler: EventListener): void {
    document.addEventListener(eventName, handler);

    // Track listeners for cleanup
    const handlers = this.listeners.get(eventName) || [];
    handlers.push(handler);
    this.listeners.set(eventName, handlers);
  }

  /**
   * Dispatch custom event
   */
  private dispatchEvent<T = unknown>(eventName: string, detail: T): void {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(event);
  }

  /**
   * Cleanup event listeners
   */
  cleanup(): void {
    for (const [eventName, handlers] of this.listeners) {
      for (const handler of handlers) {
        document.removeEventListener(eventName, handler);
      }
    }
    this.listeners.clear();
    info('Event coordinator cleaned up');
  }
}
