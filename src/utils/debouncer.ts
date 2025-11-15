/**
 * Debouncer Utility
 *
 * Generic debouncer for delaying function execution until after a specified
 * delay has elapsed since the last invocation. Useful for auto-save operations
 * and other scenarios where you want to wait for user input to stabilize.
 *
 * Usage:
 * ```typescript
 * const debouncer = new Debouncer(200); // 200ms default delay
 *
 * // Debounce a callback for a specific key
 * debouncer.debounce('myKey', () => saveData());
 *
 * // Cancel pending callback
 * debouncer.cancel('myKey');
 *
 * // Check if pending
 * if (debouncer.isPending('myKey')) {
 *   console.log('Still waiting...');
 * }
 * ```
 */

/**
 * Debouncer class for managing delayed callback execution
 */
export class Debouncer {
  /** Default delay in milliseconds */
  private defaultDelay: number;

  /** Map of active timers keyed by identifier */
  private timers: Map<string, ReturnType<typeof setTimeout>>;

  /**
   * Create a new Debouncer instance
   *
   * @param defaultDelay - Default delay in milliseconds (default: 200)
   */
  constructor(defaultDelay: number = 200) {
    this.defaultDelay = defaultDelay;
    this.timers = new Map();
  }

  /**
   * Debounce a callback function for a specific key
   *
   * If a timer already exists for the key, it will be cancelled and a new
   * timer will be started. This ensures that the callback only executes after
   * the specified delay has elapsed since the last call.
   *
   * @param key - Unique identifier for this debounced operation
   * @param callback - Function to execute after delay
   * @param delay - Optional custom delay (uses default if not provided)
   */
  debounce(key: string, callback: () => void, delay?: number): void {
    // Cancel existing timer for this key
    this.cancel(key);

    // Create new timer
    const actualDelay = delay ?? this.defaultDelay;
    const timer = setTimeout(() => {
      this.timers.delete(key);
      try {
        callback();
      } catch (error) {
        // Log error but don't propagate to prevent timer issues
        console.error(`Debounced callback error for key "${key}":`, error);
      }
    }, actualDelay);

    // Store timer
    this.timers.set(key, timer);
  }

  /**
   * Cancel a pending debounced callback for a specific key
   *
   * @param key - Unique identifier for the operation to cancel
   */
  cancel(key: string): void {
    const timer = this.timers.get(key);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * Cancel all pending debounced callbacks
   */
  cancelAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  /**
   * Check if a debounced callback is pending for a specific key
   *
   * @param key - Unique identifier to check
   * @returns True if a timer is active for this key
   */
  isPending(key: string): boolean {
    return this.timers.has(key);
  }

  /**
   * Get the number of pending callbacks
   *
   * @returns Count of active timers
   */
  getPendingCount(): number {
    return this.timers.size;
  }
}
