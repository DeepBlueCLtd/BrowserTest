/**
 * Validation Helpers
 *
 * Pure functions for form validation and input sanitization.
 * Feature: 007-lit-component-refactor
 *
 * These functions have no side effects and no DOM dependencies,
 * making them easy to unit test.
 */

/**
 * Validation error messages (array - empty if valid).
 */
export type ValidationErrors = string[];

/**
 * Validates student login form fields.
 *
 * @param name - Student name
 * @param serviceId - Service ID (2-10 alphanumeric characters)
 * @param pin - 4-digit PIN
 * @returns Array of validation error messages (empty if valid)
 */
export function validateStudentForm(
  name: string,
  serviceId: string,
  pin: string,
): ValidationErrors {
  const errors: ValidationErrors = [];

  // Validate name
  if (!name || name.trim() === '') {
    errors.push('Name required');
  }

  // Validate service ID - empty check first
  if (!serviceId) {
    errors.push('Service ID required');
  } else {
    // Then format check (2-10 alphanumeric)
    const serviceIdRegex = /^[a-zA-Z0-9]{2,10}$/;
    if (!serviceIdRegex.test(serviceId)) {
      errors.push('Service ID must be 2-10 alphanumeric characters');
    }
  }

  // Validate PIN - empty check first
  if (!pin) {
    errors.push('PIN required');
  } else {
    // Then format check (exactly 4 digits)
    const pinRegex = /^\d{4}$/;
    if (!pinRegex.test(pin)) {
      errors.push('PIN must be exactly 4 digits');
    }
  }

  return errors;
}

/**
 * Sanitizes PIN input to only allow digits.
 *
 * @param input - Raw input string
 * @returns String with non-digit characters removed
 */
export function sanitizePinInput(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Validates that PIN and confirmation match.
 *
 * @param pin - Original PIN
 * @param confirmPin - Confirmation PIN
 * @returns True if they match
 */
export function validatePinMatch(pin: string, confirmPin: string): boolean {
  return pin === confirmPin;
}
