/**
 * UI Component Contracts
 *
 * Lit Web Component interfaces for PIN authentication UI.
 */

import { LitElement } from 'lit';

/**
 * PIN Creation Modal Component
 *
 * Modal dialog for first-time PIN creation or reset.
 */
export interface QdPinCreate extends LitElement {
  // Properties
  serviceId: string;
  studentName: string;
  isReset: boolean; // true if resetting after instructor action

  // Methods
  open(): void;
  close(): void;
  reset(): void;

  // Events
  /**
   * Fired when PIN successfully created
   * @event qd:pin-created
   * @detail { pinHash: string }
   */

  /**
   * Fired when user cancels PIN creation
   * @event qd:pin-cancelled
   */
}

/**
 * Extended Login Component
 *
 * Existing qd-login component with PIN support.
 */
export interface QdLoginExtended extends LitElement {
  // Existing properties
  release: string;

  // New PIN properties
  requiresPin: boolean;
  showPinField: boolean;
  pinLocked: boolean;
  lockoutRemaining: number;

  // New PIN methods
  checkPinRequired(serviceId: string): Promise<boolean>;
  validatePin(pin: string): Promise<boolean>;
  handlePinFailure(): void;
  showPinCreation(): void;

  // Events
  /**
   * Fired on successful login (with PIN if required)
   * @event qd:login
   * @detail { serviceId: string, name: string, hasPin: boolean }
   */
}

/**
 * Instructor Status Panel Extension
 *
 * Adds PIN reset functionality to instructor panel.
 */
export interface QdInstructorStatusExtended extends LitElement {
  // Existing methods
  showScores(): void;
  exportCsv(): void;

  // New PIN methods
  showPinResetDialog(): void;
  resetStudentPin(serviceId: string): Promise<void>;
  getStudentsRequiringPin(): StudentInfo[];

  // Events
  /**
   * Fired when PIN reset completed
   * @event qd:pin-reset
   * @detail { serviceId: string, timestamp: string }
   */
}

/**
 * PIN Reset Dialog Component
 *
 * Modal for instructor to reset student PINs.
 */
export interface QdPinResetDialog extends LitElement {
  // Properties
  students: StudentInfo[];
  searchTerm: string;

  // Methods
  open(): void;
  close(): void;
  filterStudents(term: string): void;
  confirmReset(serviceId: string): Promise<void>;

  // Events
  /**
   * Fired when reset confirmed
   * @event qd:reset-confirmed
   * @detail { serviceId: string }
   */
}

// Supporting types
export interface StudentInfo {
  serviceId: string;
  name: string;
  hasPin: boolean;
  lastActivity: string;
  attempted: number;
  correct: number;
}

/**
 * Component Registration
 *
 * All components must be registered as custom elements.
 */
export interface ComponentRegistry {
  'qd-pin-create': QdPinCreate;
  'qd-login': QdLoginExtended;
  'qd-instructor-status': QdInstructorStatusExtended;
  'qd-pin-reset-dialog': QdPinResetDialog;
}

/**
 * Component Lifecycle Hooks
 */
export interface PinComponentLifecycle {
  /**
   * Called when PIN verification needed
   */
  onPinRequired(): void;

  /**
   * Called after successful PIN verification
   */
  onPinVerified(): void;

  /**
   * Called when PIN creation triggered
   */
  onPinCreationStarted(): void;

  /**
   * Called when PIN creation completed
   */
  onPinCreationCompleted(hash: string): void;

  /**
   * Called when rate limited
   */
  onRateLimited(remainingSeconds: number): void;
}