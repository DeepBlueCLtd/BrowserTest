declare interface AnalysisData {
    tableId: TableId;
    cells: Record<CellKey, string>;
    firstEdited?: string;
    lastEdited?: string;
}

declare interface AnalysisTableMetadata {
    parsed: ParsedAnalysisTable;
    interactive: boolean;
    pageId?: PageId;
    debouncer?: Debouncer;
    cellKeyMap?: Map<HTMLTableCellElement, CellKey>;
}

export declare interface AnswerRecord {
    answer: string;
    success: boolean;
    timestamp: string;
}

export declare function bootstrap(config?: BootstrapConfig): Promise<void>;

export declare interface BootstrapConfig extends ComponentInjectorConfig {
    autoEnhanceQuizTables?: boolean;
    autoEnhanceAnalysisTables?: boolean;
    autoEnhanceHomeBadges?: boolean;
}

export declare const BUILD_DATE: string;

export declare function calculateCompletionState(answers: AnswerRecord[], totalQuestions: number): CompletionState;

export declare type CellKey = string;

export declare function cleanup(): void;

export declare function clearQuizData(): number;

export declare type CompletionState = 'unstarted' | 'incomplete' | 'complete';

export declare interface ComponentInjectorConfig {
    statusPanelContainer?: string;
    dbName?: string;
}

export declare class Debouncer {
    private timers;
    debounce(key: string, fn: () => void, delay?: number): void;
    cancel(key: string): boolean;
    cancelAll(): number;
    isPending(key: string): boolean;
    getPendingCount(): number;
}

export declare function decode<T extends object>(encoded: ObfuscatedString, key: string): T;

export declare const DEFAULT_CONTAINERS: {
    readonly statusPanel: ".wh_top_menu_and_indexterms_link";
};

export declare function deriveKey(releaseId: string): string;

export declare function encode<T extends object>(data: T, key: string): ObfuscatedString;

export declare function enhanceAnalysisTable(table: HTMLTableElement, options: EnhanceAnalysisTableOptions): boolean;

export declare interface EnhanceAnalysisTableOptions {
    interactive: boolean;
    pageId?: PageId;
}

export declare function enhanceQuizTable(table: HTMLTableElement, options: EnhanceQuizTableOptions): boolean;

export declare interface EnhanceQuizTableOptions {
    interactive: boolean;
    pageId?: PageId;
}

export declare function error(message: string, error?: unknown): void;

export declare function generateCellKey(row: number, col: number, content: string): CellKey;

export declare function generateTableId(table: HTMLTableElement): TableId;

export declare function getAnalysisTableMetadata(table: HTMLTableElement): AnalysisTableMetadata | undefined;

export declare function getJSON<T>(key: string): T | null;

export declare function getQuizTableMetadata(table: HTMLTableElement): QuizTableMetadata | undefined;

export declare function info(message: string, data?: unknown): void;

export declare function injectComponents(config?: ComponentInjectorConfig): void;

export declare function isAnalysisTableEnhanced(table: HTMLTableElement): boolean;

export declare function isCellEditable(cell: HTMLTableCellElement): boolean;

export declare function isInitialized(): boolean;

export declare function isObfuscated(value: unknown): value is ObfuscatedString;

export declare function isQuizTableEnhanced(table: HTMLTableElement): boolean;

export declare function migrateObfuscation(dbName: string, direction: ObfuscationMigrationDirection, options: ObfuscationMigrationOptions): Promise<ObfuscationMigrationResult>;

export declare type ObfuscatedString = `${typeof OBFUSCATION_PREFIX}${string}`;

export declare const OBFUSCATION_PREFIX: "OBF:";

export declare type ObfuscationMigrationDirection = 'encrypt' | 'decrypt';

export declare interface ObfuscationMigrationOptions {
    releaseId: string;
    dryRun?: boolean;
}

export declare interface ObfuscationMigrationResult {
    migrated: number;
    skipped: number;
    errors: Array<{
        key: string;
        error: string;
    }>;
    durationMs: number;
}

declare interface PageCache {
    state: CompletionState;
    total: number;
    answered: number;
    correct: number;
    last?: string;
    answers?: AnswerRecord[];
    analysis?: AnalysisData;
}

export declare interface PageData {
    answers: AnswerRecord[];
    state: CompletionState;
    firstAttempted?: string;
    lastAttempted?: string;
    analysis?: AnalysisData;
}

export declare type PageId = string;

export declare function parseAnalysisTable(table: HTMLTableElement): ParsedAnalysisTable;

declare interface ParsedAnalysisTable {
    element: HTMLTableElement;
    tableId: TableId;
    editableCells: Array<{
        row: number;
        col: number;
        key: CellKey;
    }>;
    errors?: string[];
}

export declare interface ParsedQuizTable {
    element: HTMLTableElement;
    questions: QuizQuestion[];
    errors?: string[];
}

export declare function parseQuizTable(table: HTMLTableElement): ParsedQuizTable;

export declare type QuestionKind = 'mcq' | 'numeric';

export declare interface QuizQuestion {
    text: string;
    kind: QuestionKind;
    correctAnswer: string;
    options?: string[];
    tolerance?: number;
}

declare interface QuizTableMetadata {
    parsed: ParsedQuizTable;
    interactive: boolean;
    pageId?: PageId;
    inputs?: (HTMLInputElement | HTMLSelectElement)[];
    debouncer?: Debouncer;
    cleanupInstructorListeners?: () => void;
}

export declare type ReleaseId = string;

export declare const SCHEMA_VERSION = 2;

export declare type ServiceId = string;

export declare const SESSION_TIMEOUT_MS: number;

export declare interface SessionCache {
    totals: {
        total: number;
        answered: number;
        correct: number;
    };
    pages: Record<PageId, PageCache>;
}

export declare interface SessionData {
    serviceId: ServiceId;
    name: string;
    release: ReleaseId;
    loginTime: string;
    lastActivity: string;
    expiresAt: string;
    instructorUnlocked: boolean;
    unlockTime?: string;
}

export declare function setJSON<T>(key: string, value: T): boolean;

export declare const STORAGE_KEYS: {
    readonly SESSION: "qd/session";
    readonly CACHE: "qd/state";
    readonly INSTRUCTOR: "qd/instructor";
    readonly PIN_ATTEMPTS: "qd:pin-attempts";
};

export declare interface StudentRecord {
    schema: number;
    docId: string;
    release: ReleaseId;
    serviceId: ServiceId;
    name: string;
    attempted: number;
    correct: number;
    updated: string;
    pages: Record<PageId, PageData>;
    pinHash?: string;
    pinCreatedAt?: string;
    pinResetAt?: string;
}

export declare type TableId = string;

export declare function validateAnswer(question: QuizQuestion, answer: string): boolean;

export declare const VERSION = "0.1.0-phase3.1";

export declare function warn(message: string, data?: unknown): void;

export { }
