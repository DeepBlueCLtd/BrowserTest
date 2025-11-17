/**
 * Debouncer utility for delaying function execution
 *
 * Provides centralized debounce timer management, replacing the WeakMap pattern
 * used in the original implementation. Saves ~22 lines of duplicated code.
 *
 * @example
 * ```typescript
 * const debouncer = new Debouncer();
 *
 * // Debounce save operation
 * function handleInput(value: string) {
 *   debouncer.debounce('save-answer', () => {
 *     saveToDatabase(value);
 *   }, 200);
 * }
 * ```
 */

/**
 * Debouncer class for managing delayed function calls
 *
 * Maintains a map of timers indexed by key, allowing multiple independent
 * debounced operations.
 */
export class Debouncer {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Debounce a function call
   *
   * If called multiple times with the same key, only the last call will execute
   * after the delay period.
   *
   * @param key - Unique identifier for this debounced operation
   * @param fn - Function to execute after delay
   * @param delay - Delay in milliseconds (default: 200ms)
   *
   * @example
   * ```typescript
   * const debouncer = new Debouncer();
   *
   * // Called multiple times rapidly
   * debouncer.debounce('auto-save', () => console.log('Saved!'), 500);
   * debouncer.debounce('auto-save', () => console.log('Saved!'), 500);
   * debouncer.debounce('auto-save', () => console.log('Saved!'), 500);
   * // Only logs "Saved!" once after 500ms
   * ```
   */
  debounce(key: string, fn: () => void, delay = 200): void {
    // Cancel existing timer if present
    const existing = this.timers.get(key);
    if (existing !== undefined) {
      clearTimeout(existing);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.timers.delete(key);
      fn();
    }, delay);

    this.timers.set(key, timer);
  }

  /**
   * Cancel a specific debounced operation
   *
   * @param key - Key of the operation to cancel
   * @returns true if a timer was cancelled, false if no timer existed
   */
  cancel(key: string): boolean {
    const timer = this.timers.get(key);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Cancel all pending debounced operations
   *
   * @returns Number of timers that were cancelled
   */
  cancelAll(): number {
    let count = 0;
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
      count++;
    }
    this.timers.clear();
    return count;
  }

  /**
   * Check if a debounced operation is pending
   *
   * @param key - Key to check
   * @returns true if a timer is active for this key
   */
  isPending(key: string): boolean {
    return this.timers.has(key);
  }

  /**
   * Get count of pending operations
   *
   * @returns Number of active timers
   */
  getPendingCount(): number {
    return this.timers.size;
  }
}
