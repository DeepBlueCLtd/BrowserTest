/**
 * Virtual scrolling utility for performance optimization when displaying 100+ items.
 * Only renders visible items plus a buffer, reusing DOM nodes as user scrolls.
 */

export interface VirtualListConfig {
  /**
   * Total number of items in the list
   */
  totalItems: number;

  /**
   * Height of each item in pixels
   */
  itemHeight: number;

  /**
   * Height of the visible viewport in pixels
   */
  viewportHeight: number;

  /**
   * Number of items to render above/below visible area as buffer
   * @default 5
   */
  bufferSize?: number;
}

export interface VirtualListState {
  /**
   * Index of first visible item
   */
  startIndex: number;

  /**
   * Index of last visible item
   */
  endIndex: number;

  /**
   * Total height of all items (for scrollbar sizing)
   */
  totalHeight: number;

  /**
   * Offset from top for positioning visible items
   */
  offsetY: number;
}

/**
 * Calculate which items should be rendered based on scroll position
 * @param scrollTop - Current scroll position
 * @param config - Virtual list configuration
 * @returns State describing which items to render and positioning
 */
export function calculateVirtualListState(
  scrollTop: number,
  config: VirtualListConfig,
): VirtualListState {
  const { totalItems, itemHeight, viewportHeight, bufferSize = 5 } = config;

  // Calculate which items are visible
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + bufferSize * 2);

  // Calculate positioning
  const totalHeight = totalItems * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
  };
}

/**
 * Create a virtual list controller for managing scroll events
 * @param container - Scroll container element
 * @param config - Virtual list configuration
 * @param onUpdate - Callback when visible range changes
 * @returns Cleanup function to remove event listeners
 */
export function createVirtualList(
  container: HTMLElement,
  config: VirtualListConfig,
  onUpdate: (state: VirtualListState) => void,
): () => void {
  let lastState: VirtualListState | null = null;

  const handleScroll = () => {
    const scrollTop = container.scrollTop;
    const newState = calculateVirtualListState(scrollTop, config);

    // Only update if the visible range changed
    if (
      !lastState ||
      lastState.startIndex !== newState.startIndex ||
      lastState.endIndex !== newState.endIndex
    ) {
      lastState = newState;
      onUpdate(newState);
    }
  };

  // Initial render
  handleScroll();

  // Attach scroll listener
  container.addEventListener('scroll', handleScroll, { passive: true });

  // Return cleanup function
  return () => {
    container.removeEventListener('scroll', handleScroll);
  };
}

/**
 * Helper to slice an array based on virtual list state
 * @param items - Full array of items
 * @param state - Virtual list state
 * @returns Slice of items that should be rendered
 */
export function getVisibleItems<T>(items: T[], state: VirtualListState): T[] {
  return items.slice(state.startIndex, state.endIndex + 1);
}
