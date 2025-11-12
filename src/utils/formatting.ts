/**
 * Formatting utilities for the Sonar Quiz System
 */

import type { ServiceId } from '../types/contracts';

/**
 * Masks a service ID to show only the last 3 digits
 * Used for privacy when displaying scores to non-instructor users
 *
 * @param serviceId - The full service ID to mask
 * @returns Masked service ID with only last 3 digits visible (e.g., "***123")
 *
 * @example
 * maskServiceId("RN2344") // returns "***344"
 * maskServiceId("ABC") // returns "***ABC"
 * maskServiceId("AB") // returns "***AB"
 * maskServiceId("A") // returns "***A"
 * maskServiceId("") // returns "***"
 */
export function maskServiceId(serviceId: ServiceId): string {
  if (serviceId.length <= 3) {
    // If 3 or fewer characters, show all with masking prefix
    return `***${serviceId}`;
  }
  // Show only last 3 digits
  return `***${serviceId.slice(-3)}`;
}

/**
 * Formats service ID based on instructor mode
 * Shows full ID for instructors, masked ID for regular users
 *
 * @param serviceId - The service ID to format
 * @param isInstructor - Whether the current user is in instructor mode
 * @returns Full or masked service ID based on instructor status
 *
 * @example
 * formatServiceId("RN2344", true) // returns "RN2344"
 * formatServiceId("RN2344", false) // returns "***344"
 */
export function formatServiceId(serviceId: ServiceId, isInstructor: boolean): string {
  return isInstructor ? serviceId : maskServiceId(serviceId);
}
