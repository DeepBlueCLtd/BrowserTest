/**
 * Date formatting utilities for consistent timestamp display across the application.
 * Provides both display formatting (24-hour, month/date/time) and CSV export formatting (ISO 8601).
 */

/**
 * Format options for timestamp display
 */
export type TimestampFormat = 'display' | 'csv';

/**
 * Format a date for display in the instructor interface
 * @param date - Date to format
 * @returns Formatted string in "Nov 19 14:23" or "11/19 14:23:45" format (24-hour time)
 */
function formatDisplayTimestamp(date: Date): string {
  // Use short month name format: "Nov 19 14:23"
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${month} ${day} ${hours}:${minutes}`;
}

/**
 * Format a date for CSV export
 * @param date - Date to format
 * @returns ISO 8601 formatted string for spreadsheet compatibility
 */
function formatCSVTimestamp(date: Date): string {
  return date.toISOString();
}

/**
 * Main timestamp formatting function
 * @param date - Date to format (can be Date object or ISO string)
 * @param format - Format type ('display' for UI, 'csv' for export)
 * @returns Formatted timestamp string
 */
export function formatTimestamp(date: Date | string, format: TimestampFormat = 'display'): string {
  // Handle null/undefined
  if (date == null) {
    console.warn('Invalid date provided to formatTimestamp:', date);
    return 'Invalid Date';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Validate date
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatTimestamp:', date);
    return 'Invalid Date';
  }

  return format === 'csv' ? formatCSVTimestamp(dateObj) : formatDisplayTimestamp(dateObj);
}

/**
 * Parse an ISO 8601 timestamp from storage and format for display
 * @param isoString - ISO 8601 timestamp string from IndexedDB
 * @returns Formatted display string
 */
export function formatStoredTimestamp(isoString: string): string {
  return formatTimestamp(isoString, 'display');
}

/**
 * Get current timestamp in ISO 8601 format for storage
 * @returns Current time as ISO 8601 string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
