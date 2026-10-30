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

/** Per-field validation messages for the student login form. */
export interface StudentFieldErrors {
  name?: string;
  serviceId?: string;
  pin?: string;
}

/**
 * Validate each student login field separately, so the form can mark the
 * faulty fields and report all of them at once (SRD 013 UX-10).
 *
 * @param name - Student name
 * @param serviceId - Service ID (2-10 alphanumeric characters)
 * @param pin - 4-digit PIN
 * @returns Message per invalid field; empty object when all are valid
 */
export function validateStudentFields(
  name: string,
  serviceId: string,
  pin: string,
): StudentFieldErrors {
  const errors: StudentFieldErrors = {};
  if (!name || name.trim() === '') {
    errors.name = 'Name required';
  }
  if (!serviceId) {
    errors.serviceId = 'Service ID required';
  } else if (!/^[a-zA-Z0-9]{2,10}$/.test(serviceId)) {
    errors.serviceId = 'Service ID must be 2-10 alphanumeric characters';
  }
  if (!pin) {
    errors.pin = 'PIN required';
  } else if (!/^\d{4}$/.test(pin)) {
    errors.pin = 'PIN must be exactly 4 digits';
  }
  return errors;
}

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

/**
 * Whether a numeric answer is a complete number: optional sign, digits and an
 * optional decimal point (SRD 013 UX-03).
 *
 * @param value - Trimmed input value
 * @returns True for values such as "1500", "-5", "2.5", ".5"
 */
export function isNumericAnswer(value: string): boolean {
  return /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(value);
}

/**
 * Whether a numeric input contains a character no number can contain, so the
 * error can show at once rather than waiting for the field to lose focus.
 *
 * @param value - Raw input value
 * @returns True when the value has characters other than digits, sign, point
 *   and spaces
 */
export function hasNonNumericCharacters(value: string): boolean {
  return /[^0-9+\-.\s]/.test(value);
}

/** Message shown under a numeric input that is not a number. */
export const NUMERIC_INPUT_ERROR = 'Enter a number, for example 1500';
