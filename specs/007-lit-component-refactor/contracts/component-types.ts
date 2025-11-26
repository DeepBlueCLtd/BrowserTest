/**
 * Modal Component Type Contracts
 *
 * Feature: 007-lit-component-refactor
 * Purpose: Define interfaces for Lit modal components
 *
 * These types define the public API of each component.
 */

import type { StudentRecord, ReleaseId } from '../../../src/types/contracts';

// =============================================================================
// Base Modal Component (<qd-modal>)
// =============================================================================

/**
 * Properties for the base modal component.
 */
export interface QdModalProps {
  /** Whether the modal is open */
  open: boolean;

  /** Whether the modal can be closed by user action (Escape, backdrop click) */
  closable?: boolean;
}

/**
 * Events emitted by the base modal component.
 */
export interface QdModalEvents {
  /** Fired when user requests to close the modal */
  'qd:modal-close': CustomEvent<void>;
}

/**
 * CSS custom properties for modal styling.
 */
export interface QdModalCSSProperties {
  /** Backdrop background color (default: rgba(0,0,0,0.5)) */
  '--qd-modal-backdrop': string;

  /** Modal background color (default: white) */
  '--qd-modal-background': string;

  /** Modal border radius (default: 8px) */
  '--qd-modal-radius': string;

  /** Modal max width (default: 600px) */
  '--qd-modal-max-width': string;
}

// =============================================================================
// Scores Modal Component (<qd-scores-modal>)
// =============================================================================

/**
 * Properties for the scores modal component.
 */
export interface QdScoresModalProps {
  /** Whether the modal is open */
  open: boolean;

  /** Array of student records to display */
  students: StudentRecord[];

  /** Current release ID for context */
  release: ReleaseId;
}

/**
 * Events emitted by the scores modal component.
 */
export interface QdScoresModalEvents {
  /** Fired when modal is closed */
  'qd:modal-close': CustomEvent<void>;

  /** Fired when a student row is expanded/collapsed */
  'qd:student-expand': CustomEvent<{ serviceId: string; expanded: boolean }>;
}

/**
 * Internal state for expandable rows.
 */
export interface ScoresModalRowState {
  /** Map of service ID to expanded state */
  expandedRows: Map<string, boolean>;
}

// =============================================================================
// Password Modal Component (<qd-password-modal>)
// =============================================================================

/**
 * Properties for the password modal component.
 */
export interface QdPasswordModalProps {
  /** Whether the modal is open */
  open: boolean;

  /** Title displayed in modal header */
  title?: string;

  /** Error message to display (empty for no error) */
  errorMessage?: string;

  /** Whether submission is in progress */
  submitting?: boolean;
}

/**
 * Events emitted by the password modal component.
 */
export interface QdPasswordModalEvents {
  /** Fired when modal is closed */
  'qd:modal-close': CustomEvent<void>;

  /** Fired when password is submitted */
  'qd:password-submit': CustomEvent<{ password: string }>;
}

// =============================================================================
// Confirm Dialog Component (<qd-confirm-dialog>)
// =============================================================================

/**
 * Properties for the confirm dialog component.
 */
export interface QdConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Title displayed in dialog header */
  title: string;

  /** Message/description to display */
  message: string;

  /** Text for confirm button (default: "Confirm") */
  confirmText?: string;

  /** Text for cancel button (default: "Cancel") */
  cancelText?: string;

  /** Whether this is a destructive action (changes button styling) */
  destructive?: boolean;

  /** Whether confirmation is in progress */
  confirming?: boolean;
}

/**
 * Events emitted by the confirm dialog component.
 */
export interface QdConfirmDialogEvents {
  /** Fired when user confirms the action */
  'qd:confirm': CustomEvent<void>;

  /** Fired when user cancels the action */
  'qd:cancel': CustomEvent<void>;

  /** Fired when dialog is closed (by any means) */
  'qd:modal-close': CustomEvent<void>;
}

// =============================================================================
// Event Type Helpers
// =============================================================================

/**
 * Union of all modal close events (for event handling).
 */
export type ModalCloseEvent = CustomEvent<void>;

/**
 * Type guard for checking if an event is a modal close event.
 */
export function isModalCloseEvent(event: Event): event is ModalCloseEvent {
  return event.type === 'qd:modal-close';
}
