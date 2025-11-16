/**
 * Frozen Type Contracts for Sonar Quiz System
 * Version: 1.0.0
 *
 * These types are FROZEN and must not be modified without version bump.
 * Any changes require migration strategy and backwards compatibility.
 */

// ============================================================================
// CORE IDENTIFIERS
// ============================================================================

/** Release identifier format: "MM-YYYY" */
export type ReleaseId = string;

/** Service ID for student identification */
export type ServiceId = string;

/** Page identifier from DITA document */
export type PageId = string;

/** Table identifier (16-char hash based on table structure: rows x cols + class name) */
export type TableId = string;

/** Cell key format: "R{row}C{col}#f:{hash}" where hash is 8-char from normalized content */
export type CellKey = string;

// ============================================================================
// ENUMERATIONS
// ============================================================================

/** Page completion state */
export type CompletionState = 'unstarted' | 'incomplete' | 'complete';

/** Question type in quiz */
export type QuestionKind = 'mcq' | 'numeric';

// ============================================================================
// QUIZ ENTITIES
// ============================================================================

/** Individual quiz answer with correctness */
export interface AnswerRecord {
  /** User's answer value */
  answer: string;
  /** Whether the answer is correct */
  success: boolean;
  /** Timestamp when answer was submitted (ISO 8601) */
  timestamp: string;
}

/** Quiz question definition */
export interface QuizQuestion {
  /** Question text */
  text: string;
  /** Question type */
  kind: QuestionKind;
  /** Correct answer */
  correctAnswer: string;
  /** MCQ options (for mcq type) */
  options?: string[];
  /** Numeric tolerance (for numeric type) */
  tolerance?: number;
}

// ============================================================================
// ANALYSIS ENTITIES
// ============================================================================

/** Analysis table data */
export interface AnalysisData {
  /** Unique table identifier */
  tableId: TableId;
  /** Cell key to content mapping */
  cells: Record<CellKey, string>;
  /** First edit timestamp (ISO 8601) */
  firstEdited?: string;
  /** Last edit timestamp (ISO 8601) */
  lastEdited?: string;
}

// ============================================================================
// PAGE DATA
// ============================================================================

/** Student's data for a specific page */
export interface PageData {
  /** Array of quiz answers */
  answers: AnswerRecord[];
  /** Calculated completion state */
  state: CompletionState;
  /** First attempt timestamp (ISO 8601) */
  firstAttempted?: string;
  /** Last attempt timestamp (ISO 8601) */
  lastAttempted?: string;
  /** Analysis table data if present */
  analysis?: AnalysisData;
}

// ============================================================================
// STUDENT RECORD
// ============================================================================

/** Complete student progress record */
export interface StudentRecord {
  /** Schema version for migrations */
  schema: number;
  /** Document identifier */
  docId: string;
  /** Release version */
  release: ReleaseId;
  /** Student service ID */
  serviceId: ServiceId;
  /** Student name */
  name: string;
  /** Total questions attempted */
  attempted: number;
  /** Total correct answers */
  correct: number;
  /** Last update timestamp (ISO 8601) */
  updated: string;
  /** Page data by page ID */
  pages: Record<PageId, PageData>;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Active session data
 *
 * Note: serviceId and release are duplicated from the storage key
 * for convenient access without requiring a storage lookup
 */
export interface SessionData {
  /** Student service ID (duplicated from storage key) */
  serviceId: ServiceId;
  /** Student name */
  name: string;
  /** Current release (duplicated from storage key) */
  release: ReleaseId;
  /** Login timestamp (ISO 8601) */
  loginTime: string;
  /** Last activity timestamp (ISO 8601) */
  lastActivity: string;
  /** Session expiry timestamp (ISO 8601) */
  expiresAt: string;
  /** Whether instructor mode is unlocked */
  instructorUnlocked: boolean;
  /** Instructor unlock timestamp (ISO 8601) */
  unlockTime?: string;
}

/** Cached page state for performance */
export interface PageCache {
  /** Page completion state */
  state: CompletionState;
  /** Number of questions answered */
  answered: number;
  /** Number of correct answers */
  correct: number;
  /** Last update timestamp (ISO 8601) */
  last?: string;
}

/** Session cache for quick access */
export interface SessionCache {
  /** Aggregated totals */
  totals: {
    answered: number;
    correct: number;
  };
  /** Per-page cache */
  pages: Record<PageId, PageCache>;
}

// ============================================================================
// INSTRUCTOR FEATURES
// ============================================================================

/** Student summary for instructor view */
export interface StudentSummary {
  /** Student service ID */
  serviceId: ServiceId;
  /** Student name */
  name: string;
  /** Questions attempted */
  attempted: number;
  /** Correct answers */
  correct: number;
  /** Success percentage */
  percentage: number;
  /** Last activity timestamp */
  lastActive: string;
}

/** Quiz results export format */
export interface QuizExport {
  /** Export timestamp */
  timestamp: string;
  /** Release version */
  release: ReleaseId;
  /** Document ID */
  docId: string;
  /** Student results */
  students: StudentSummary[];
  /** Detailed answers by page */
  details?: {
    pageId: PageId;
    studentId: ServiceId;
    answers: AnswerRecord[];
  }[];
}

// ============================================================================
// DOM ENHANCEMENT
// ============================================================================

/** Quiz table parsing result */
export interface ParsedQuizTable {
  /** Table element reference */
  element: HTMLTableElement;
  /** Extracted questions */
  questions: QuizQuestion[];
  /** Validation errors if any */
  errors?: string[];
}

/** Analysis table parsing result */
export interface ParsedAnalysisTable {
  /** Table element reference */
  element: HTMLTableElement;
  /** Table identifier */
  tableId: TableId;
  /** Editable cell positions */
  editableCells: Array<{
    row: number;
    col: number;
    key: CellKey;
  }>;
  /** Validation errors if any */
  errors?: string[];
}

// ============================================================================
// STORAGE ADAPTER
// ============================================================================

/** Storage adapter interface for data persistence */
export interface StorageAdapter {
  /** Initialize storage */
  init(): Promise<void>;

  /** Get student record */
  getStudent(release: ReleaseId, serviceId: ServiceId): Promise<StudentRecord | null>;

  /** Save student record */
  saveStudent(record: StudentRecord): Promise<void>;

  /** Get all students for a release */
  getStudentsByRelease(release: ReleaseId): Promise<StudentRecord[]>;

  /** Delete all data */
  clearAll(): Promise<void>;

  /** Create backup */
  backup(record: StudentRecord): Promise<void>;
}

// ============================================================================
// EVENTS
// ============================================================================

/** Custom event namespace */
export const EVENT_NAMESPACE = 'qd';

/** Event type definitions */
export interface QuizEvents {
  'qd:login': { detail: SessionData };
  'qd:logout': { detail: { serviceId: ServiceId } };
  'qd:answer-saved': { detail: { pageId: PageId; answer: AnswerRecord } };
  'qd:state-changed': { detail: { pageId: PageId; state: CompletionState } };
  'qd:instructor-unlock': { detail: { timestamp: string } };
  'qd:instructor-lock': { detail: { timestamp: string } };
  'qd:data-cleared': { detail: { timestamp: string } };
  'qd:storage-error': { detail: { error: Error; operation: string } };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Current schema version */
export const SCHEMA_VERSION = 1;

/** Session timeout in milliseconds (30 minutes) */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/** Storage keys */
export const STORAGE_KEYS = {
  SESSION: 'qd/session',
  CACHE: 'qd/state',
  INSTRUCTOR: 'qd/instructor',
} as const;

/** CSS classes for DOM selection */
export const CSS_CLASSES = {
  QUIZ_TABLE: 'qd-quiz',
  PAGE_TABLE: 'qd-page',
  ANALYSIS_TABLE: 'qd-analysis',
  TEST_LINK: 'quizPageBtn',
} as const;

/** Element IDs */
export const ELEMENT_IDS = {
  STATUS_PANEL: 'qd-status',
} as const;

/**
 * CSS selectors for DOM injection points
 *
 * These are default/reference values. Actual selectors are configurable
 * via SonarQuizConfig.statusPanelContainer option.
 *
 * @see SonarQuizConfig in src/index.ts
 */
export const INJECTION_SELECTORS = {
  /** Default navbar container for Oxygen WebHelp templates */
  NAVBAR_CONTAINER: '.wh_top_menu_and_indexterms_link',
} as const;

/** Validation limits */
export const LIMITS = {
  MAX_QUESTIONS_PER_PAGE: 100,
  MAX_CELL_CONTENT_LENGTH: 500,
  MAX_NAME_LENGTH: 100,
  MAX_SERVICE_ID_LENGTH: 10,
} as const;
