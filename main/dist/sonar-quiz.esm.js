function maskServiceId(serviceId) {
  if (serviceId.length < 2) {
    return "**";
  }
  if (serviceId.length === 2) {
    return serviceId;
  }
  const prefix = serviceId.slice(0, 2);
  const suffix = "*".repeat(serviceId.length - 2);
  return prefix + suffix;
}
function sanitize(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "name" || key === "passwordHash") {
      continue;
    }
    if (key === "serviceId" && typeof value === "string") {
      sanitized[key] = maskServiceId(value);
      continue;
    }
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitize(value);
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}
function info(message, data) {
}
function error(message, error2) {
  if (error2 instanceof Error) {
    const errorObj = {
      name: error2.name,
      message: error2.message
    };
    console.error(`[ERROR] ${message}`, errorObj);
  } else if (error2 !== void 0) {
    console.error(`[ERROR] ${message}`, sanitize(error2));
  } else {
    console.error(`[ERROR] ${message}`);
  }
}
function warn(message, data) {
  if (data !== void 0) {
    console.warn(`[WARN] ${message}`, sanitize(data));
  } else {
    console.warn(`[WARN] ${message}`);
  }
}
function parseQuizTable(table) {
  const errors = [];
  const questions = [];
  if (!table.classList.contains("qd-quiz")) {
    errors.push('Table must have class "qd-quiz"');
    return { element: table, questions, errors };
  }
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  if (rows.length === 0) {
    errors.push("Quiz table has no data rows");
    return { element: table, questions, errors };
  }
  rows.forEach((row, index) => {
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length !== 3) {
      errors.push(
        `Row ${index + 1} has ${cells.length} columns, expected 3 (Question | Answer | Detail)`
      );
      return;
    }
    const questionCell = cells[0];
    const answerCell = cells[1];
    const detailCell = cells[2];
    if (!questionCell || !answerCell || !detailCell) {
      return;
    }
    const questionText = questionCell.textContent?.trim() || "";
    if (!questionText) {
      errors.push(`Row ${index + 1} has empty question text`);
      return;
    }
    const correctAnswer = answerCell.textContent?.trim() || "";
    if (!correctAnswer) {
      errors.push(`Row ${index + 1} has empty answer`);
      return;
    }
    const olElement = detailCell.querySelector("ol");
    if (olElement) {
      const options = extractMcqOptions(olElement);
      if (options.length === 0) {
        errors.push(`Row ${index + 1} MCQ has no options in <ol>`);
        return;
      }
      questions.push({
        text: questionText,
        kind: "mcq",
        correctAnswer,
        options
      });
    } else {
      const toleranceText = detailCell.textContent?.trim() || "";
      const tolerance = parseFloat(toleranceText);
      if (isNaN(tolerance)) {
        errors.push(
          `Row ${index + 1} appears to be numeric but has invalid tolerance: "${toleranceText}"`
        );
        return;
      }
      questions.push({
        text: questionText,
        kind: "numeric",
        correctAnswer,
        tolerance
      });
    }
  });
  return {
    element: table,
    questions,
    errors: errors.length > 0 ? errors : void 0
  };
}
function extractMcqOptions(ol) {
  const listItems = Array.from(ol.querySelectorAll("li"));
  return listItems.map((li) => li.textContent?.trim() || "").filter((text) => text.length > 0);
}
function validateAnswer(question, answer) {
  if (!answer || answer.trim() === "") {
    return false;
  }
  const trimmedAnswer = answer.trim();
  if (question.kind === "mcq") {
    return trimmedAnswer === question.correctAnswer;
  } else {
    const userValue = parseFloat(trimmedAnswer);
    const correctValue = parseFloat(question.correctAnswer);
    if (isNaN(userValue) || isNaN(correctValue)) {
      return false;
    }
    const tolerance = question.tolerance ?? 0;
    return Math.abs(userValue - correctValue) <= tolerance;
  }
}
const SCHEMA_VERSION = 2;
const SESSION_TIMEOUT_MS = 30 * 60 * 1e3;
const STORAGE_KEYS = {
  SESSION: "qd/session",
  CACHE: "qd/state",
  INSTRUCTOR: "qd/instructor",
  PIN_ATTEMPTS: "qd:pin-attempts"
};
const PIN_CONSTANTS = {
  /** Maximum failed attempts before lockout */
  MAX_ATTEMPTS: 3,
  /** Lockout duration in milliseconds (30 seconds) */
  LOCKOUT_MS: 30 * 1e3
};
function calculateStatusIndicator(total, correct) {
  if (total === 0 || correct === 0) {
    return "red";
  }
  if (correct === total) {
    return "green";
  }
  return "amber";
}
function recalculateTotalsFromPages(pages) {
  let attempted = 0;
  let correct = 0;
  for (const pageId in pages) {
    const pageData = pages[pageId];
    if (pageData && pageData.answers && Array.isArray(pageData.answers)) {
      const answered = pageData.answers.filter((a2) => a2.answer.trim() !== "");
      attempted += answered.length;
      correct += answered.filter((a2) => a2.success).length;
    }
  }
  return { attempted, correct };
}
function isSessionExpired(expiresAt, now = /* @__PURE__ */ new Date()) {
  const expiryDate = new Date(expiresAt);
  if (isNaN(expiryDate.getTime())) {
    return true;
  }
  return now >= expiryDate;
}
class SessionService {
  /**
   * Create a new session
   *
   * @param serviceId - Student service ID
   * @param name - Student name
   * @param release - Current release ID
   * @returns Created session data
   */
  createSession(serviceId, name, release) {
    const now = /* @__PURE__ */ new Date();
    const loginTime = now.toISOString();
    const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString();
    const session = {
      serviceId,
      name,
      release,
      loginTime,
      lastActivity: loginTime,
      expiresAt,
      instructorUnlocked: false
    };
    this.saveSession(session);
    this.emitEvent("qd:login", { serviceId, name, release, loginTime });
    return session;
  }
  /**
   * Get the current session
   *
   * @returns Session data or null if no session exists
   */
  getSession() {
    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      if (!sessionData) {
        return null;
      }
      const session = JSON.parse(sessionData);
      if (!session.serviceId || !session.release || !session.expiresAt) {
        warn("Invalid session data, missing required fields");
        return null;
      }
      return session;
    } catch (err) {
      error("Failed to parse session data", err);
      return null;
    }
  }
  /**
   * Update last activity time and extend session expiry
   */
  updateActivity() {
    const session = this.getSession();
    if (!session) {
      return;
    }
    const now = /* @__PURE__ */ new Date();
    session.lastActivity = now.toISOString();
    session.expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString();
    this.saveSession(session);
  }
  /**
   * Check if the current session is expired
   *
   * @returns True if session is expired or doesn't exist
   */
  isExpired() {
    const session = this.getSession();
    if (!session) {
      return true;
    }
    return isSessionExpired(session.expiresAt);
  }
  /**
   * Clear the current session
   */
  clearSession() {
    const session = this.getSession();
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.CACHE);
    sessionStorage.removeItem(STORAGE_KEYS.INSTRUCTOR);
    sessionStorage.removeItem("qd/instructor/showAnswers");
    if (session) {
      info(`Session cleared for ${session.serviceId}`);
      this.emitEvent("qd:logout", {
        serviceId: session.serviceId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  /**
   * Unlock instructor mode
   */
  unlockInstructor() {
    const session = this.getSession();
    if (!session) {
      return;
    }
    session.instructorUnlocked = true;
    session.unlockTime = (/* @__PURE__ */ new Date()).toISOString();
    this.saveSession(session);
    this.emitEvent("qd:instructor-unlock", { timestamp: session.unlockTime });
  }
  /**
   * Lock instructor mode
   */
  lockInstructor() {
    const session = this.getSession();
    if (!session) {
      return;
    }
    session.instructorUnlocked = false;
    delete session.unlockTime;
    this.saveSession(session);
    this.emitEvent("qd:instructor-lock", { timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  }
  /**
   * Check if instructor mode is unlocked
   *
   * @returns True if instructor mode is unlocked
   */
  isInstructorUnlocked() {
    const session = this.getSession();
    return session?.instructorUnlocked === true;
  }
  /**
   * Get session cache from sessionStorage
   *
   * @returns Session cache or null if not found
   */
  getCache() {
    try {
      const cacheData = sessionStorage.getItem(STORAGE_KEYS.CACHE);
      if (!cacheData) {
        return null;
      }
      return JSON.parse(cacheData);
    } catch (err) {
      error("Failed to parse cache data", err);
      return null;
    }
  }
  /**
   * Save session cache to sessionStorage
   *
   * @param cache - Cache data to save
   */
  saveCache(cache) {
    try {
      sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
    } catch (err) {
      error("Failed to save cache", err);
    }
  }
  /**
   * Clear the session cache
   */
  clearCache() {
    sessionStorage.removeItem(STORAGE_KEYS.CACHE);
  }
  /**
   * Save session to sessionStorage
   *
   * @param session - Session data to save
   */
  saveSession(session) {
    try {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch (err) {
      error("Failed to save session", err);
    }
  }
  /**
   * Emit a custom event
   *
   * @param eventName - Name of the event
   * @param detail - Event detail data
   */
  emitEvent(eventName, detail) {
    try {
      const event = new CustomEvent(eventName, { detail, bubbles: true });
      document.dispatchEvent(event);
    } catch (err) {
      error(`Failed to emit event ${eventName}`, err);
    }
  }
}
function buildCacheFromRecord(record) {
  const cache = {
    totals: {
      total: 0,
      answered: 0,
      correct: 0
    },
    pages: {}
  };
  for (const [pageId, pageData] of Object.entries(record.pages)) {
    const pageCache = buildPageCache(pageId, pageData);
    cache.pages[pageId] = pageCache;
    cache.totals.total += pageCache.total;
    cache.totals.answered += pageCache.answered;
    cache.totals.correct += pageCache.correct;
  }
  return cache;
}
function buildPageCache(_pageId, pageData) {
  const total = pageData.answers.length;
  const answered = pageData.answers.filter((a2) => a2.answer.trim() !== "").length;
  const correct = pageData.answers.filter((a2) => a2.success).length;
  return {
    state: pageData.state,
    total,
    answered,
    correct,
    last: pageData.lastAttempted,
    answers: pageData.answers,
    analysis: pageData.analysis
    // Preserve analysis data from analysis tables
  };
}
function registerPageQuestions(cache, pageId, totalQuestions) {
  const existingPage = cache.pages[pageId];
  if (existingPage && existingPage.total >= totalQuestions) {
    return cache;
  }
  const oldTotal = existingPage?.total || 0;
  const delta = totalQuestions - oldTotal;
  const updatedPage = {
    state: existingPage?.state || "unstarted",
    total: totalQuestions,
    answered: existingPage?.answered || 0,
    correct: existingPage?.correct || 0,
    last: existingPage?.last,
    answers: existingPage?.answers,
    analysis: existingPage?.analysis
  };
  return {
    totals: {
      total: cache.totals.total + delta,
      answered: cache.totals.answered,
      correct: cache.totals.correct
    },
    pages: {
      ...cache.pages,
      [pageId]: updatedPage
    }
  };
}
function getQuestionInputSpec(question, existingAnswer) {
  if (question.kind === "mcq") {
    const options = (question.options || []).map((optionText, index) => ({
      value: String(index + 1),
      // 1-indexed
      text: `${index + 1}. ${optionText}`
    }));
    return {
      type: "select",
      className: "qd-quiz-input",
      placeholder: "Select an answer...",
      value: existingAnswer?.answer || "",
      options
    };
  } else {
    return {
      type: "text",
      className: "qd-quiz-input",
      placeholder: "Enter value",
      value: existingAnswer?.answer || ""
    };
  }
}
function formatDisplayTimestamp(date) {
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month} ${day} ${hours}:${minutes}`;
}
function formatCSVTimestamp(date) {
  return date.toISOString();
}
function formatTimestamp(date, format = "display") {
  if (date == null) {
    console.warn("Invalid date provided to formatTimestamp:", date);
    return "Invalid Date";
  }
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    console.warn("Invalid date provided to formatTimestamp:", date);
    return "Invalid Date";
  }
  return format === "csv" ? formatCSVTimestamp(dateObj) : formatDisplayTimestamp(dateObj);
}
function formatStoredTimestamp(isoString) {
  return formatTimestamp(isoString, "display");
}
function formatStudentAnswersForDisplay(students, pageId, questionIndex) {
  const result = [];
  for (const student of students) {
    const pageData = student.pages[pageId];
    if (!pageData || !pageData.answers) continue;
    const answerRecord = pageData.answers[questionIndex];
    if (!answerRecord) continue;
    result.push({
      name: student.name,
      maskedServiceId: student.serviceId.slice(-4),
      answer: answerRecord.answer,
      success: answerRecord.success,
      formattedTimestamp: formatStoredTimestamp(answerRecord.timestamp),
      cssClass: answerRecord.success ? "qd-correct" : "qd-incorrect"
    });
  }
  return result;
}
class Debouncer {
  constructor() {
    this.timers = /* @__PURE__ */ new Map();
  }
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
  debounce(key, fn, delay = 200) {
    const existing = this.timers.get(key);
    if (existing !== void 0) {
      clearTimeout(existing);
    }
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
  cancel(key) {
    const timer = this.timers.get(key);
    if (timer !== void 0) {
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
  cancelAll() {
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
  isPending(key) {
    return this.timers.has(key);
  }
  /**
   * Get count of pending operations
   *
   * @returns Number of active timers
   */
  getPendingCount() {
    return this.timers.size;
  }
}
function getTableRows(table) {
  const tbody = table.querySelector("tbody");
  if (!tbody) {
    return [];
  }
  return Array.from(tbody.querySelectorAll("tr"));
}
function getRowCells(row) {
  return Array.from(row.cells);
}
function getTextContent(element) {
  if (!element) {
    return "";
  }
  return element.textContent?.trim() || "";
}
function createElement(tag, text, className) {
  const element = document.createElement(tag);
  return element;
}
function addClass(element, ...classNames) {
  element.classList.add(...classNames);
}
function removeClass(element, ...classNames) {
  element.classList.remove(...classNames);
}
function emitCustomEvent(name, detail, options) {
  const event = new CustomEvent(name, {
    detail,
    bubbles: true,
    composed: true,
    cancelable: false
  });
  return document.dispatchEvent(event);
}
function dispatchEventOn(element, name, detail, options) {
  const event = new CustomEvent(name, {
    detail,
    bubbles: true,
    composed: true,
    cancelable: false
  });
  return element.dispatchEvent(event);
}
function getJSON(key) {
  try {
    const data = sessionStorage.getItem(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  } catch (error2) {
    warn(`Failed to parse JSON from sessionStorage key: ${key}`, error2);
    return null;
  }
}
function setJSON(key, value) {
  try {
    const json = JSON.stringify(value);
    sessionStorage.setItem(key, json);
    return true;
  } catch (error2) {
    warn(`Failed to store JSON in sessionStorage key: ${key}`, error2);
    return false;
  }
}
function clearQuizData() {
  const keysToRemove = [];
  for (let i3 = 0; i3 < sessionStorage.length; i3++) {
    const key = sessionStorage.key(i3);
    if (key && key.startsWith("qd/")) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    sessionStorage.removeItem(key);
  }
  return keysToRemove.length;
}
function getStorageKey(release, serviceId) {
  return `qd/${release}/u${serviceId}`;
}
class StorageError extends Error {
  constructor(message, operation, cause) {
    super(message);
    this.operation = operation;
    this.cause = cause;
    this.name = "StorageError";
    if (cause) {
      error(`Storage error in ${operation}: ${message}`, cause);
    } else {
      error(`Storage error in ${operation}: ${message}`);
    }
  }
}
class StorageNotInitializedError extends StorageError {
  constructor(operation) {
    super("Storage adapter not initialized. Call init() first.", operation);
    this.name = "StorageNotInitializedError";
  }
}
class StorageQuotaError extends StorageError {
  constructor(operation) {
    super("Storage quota exceeded. Please clear old data or free up space.", operation);
    this.name = "StorageQuotaError";
  }
}
class StorageFormatError extends StorageError {
  constructor(message, expected, found, storageKey) {
    super(message, "formatCheck");
    this.name = "StorageFormatError";
    this.expected = expected;
    this.found = found;
    this.storageKey = storageKey;
  }
}
const ENCRYPT_STORAGE = false;
const OBFUSCATION_PREFIX = "OBF:";
function deriveKey(releaseId) {
  if (!releaseId) {
    return "";
  }
  return releaseId.split("").map((c2) => c2.charCodeAt(0).toString()).join("");
}
function stringToUtf8Bytes(str) {
  return new TextEncoder().encode(str);
}
function utf8BytesToString(bytes) {
  return new TextDecoder().decode(bytes);
}
function xorBytes(data, key) {
  if (key.length === 0) {
    return data;
  }
  const result = new Uint8Array(data.length);
  for (let i3 = 0; i3 < data.length; i3++) {
    const dataByte = data[i3];
    const keyByte = key[i3 % key.length];
    if (dataByte !== void 0 && keyByte !== void 0) {
      result[i3] = dataByte ^ keyByte;
    }
  }
  return result;
}
function bytesToBase64(bytes) {
  let binary = "";
  for (let i3 = 0; i3 < bytes.length; i3++) {
    const byte = bytes[i3];
    if (byte !== void 0) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i3 = 0; i3 < binary.length; i3++) {
    bytes[i3] = binary.charCodeAt(i3);
  }
  return bytes;
}
function encode(data, key) {
  const json = JSON.stringify(data);
  const jsonBytes = stringToUtf8Bytes(json);
  const keyBytes = stringToUtf8Bytes(key || "default");
  const xoredBytes = xorBytes(jsonBytes, keyBytes);
  const base64 = bytesToBase64(xoredBytes);
  return `${OBFUSCATION_PREFIX}${base64}`;
}
function decode(encoded, key) {
  const base64 = encoded.slice(OBFUSCATION_PREFIX.length);
  if (!base64) {
    throw new Error("Empty obfuscated payload");
  }
  let xoredBytes;
  try {
    xoredBytes = base64ToBytes(base64);
  } catch {
    throw new Error("Invalid base64 in obfuscated data");
  }
  const keyBytes = stringToUtf8Bytes(key || "default");
  const jsonBytes = xorBytes(xoredBytes, keyBytes);
  let json;
  try {
    json = utf8BytesToString(jsonBytes);
  } catch {
    throw new Error("Failed to decode UTF-8 data - possibly corrupted");
  }
  try {
    return JSON.parse(json);
  } catch {
    throw new Error("Failed to parse JSON - data may be corrupted or tampered");
  }
}
function isObfuscated(value) {
  return typeof value === "string" && value.startsWith(OBFUSCATION_PREFIX);
}
const DB_VERSION = 3;
const STORE_STUDENTS$1 = "students";
const STORE_BACKUPS = "backups";
const STORE_AUDIT_LOG = "auditLog";
class IndexedDBStorageAdapter {
  /**
   * Create a new IndexedDB storage adapter
   *
   * @param dbName - Database name (REQUIRED - no default)
   */
  constructor(dbName) {
    this.db = null;
    this.initPromise = null;
    if (!dbName) {
      throw new Error("FATAL: dbName is required for IndexedDBStorageAdapter");
    }
    this.dbName = dbName;
  }
  /**
   * Initialize the IndexedDB database
   *
   * Creates object stores and indexes on first run.
   * Safe to call multiple times - will reuse existing connection.
   *
   * @returns Promise that resolves when database is ready
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }
    if (this.db) {
      return Promise.resolve();
    }
    this.initPromise = new Promise((resolve, reject) => {
      const OPEN_TIMEOUT_MS = 5e3;
      let timeoutId;
      let resolved = false;
      const cleanup2 = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = void 0;
        }
      };
      timeoutId = window.setTimeout(() => {
        if (resolved) return;
        resolved = true;
        this.initPromise = null;
        warn(`IndexedDB open timed out after ${OPEN_TIMEOUT_MS}ms - attempting recovery`);
        const deleteReq = indexedDB.deleteDatabase(this.dbName);
        deleteReq.onsuccess = () => {
          this.init().then(resolve).catch(reject);
        };
        deleteReq.onerror = () => {
          reject(
            new StorageError(
              `Database "${this.dbName}" appears corrupted. Please clear site data in browser settings.`,
              "init"
            )
          );
        };
        deleteReq.onblocked = () => {
          reject(
            new StorageError(
              `Cannot recover database - close all other tabs with this site and reload.`,
              "init"
            )
          );
        };
      }, OPEN_TIMEOUT_MS);
      const request = indexedDB.open(this.dbName, DB_VERSION);
      request.onerror = () => {
        if (resolved) return;
        resolved = true;
        cleanup2();
        error(`IndexedDB open error: ${request.error?.message || "unknown"}`);
        this.initPromise = null;
        reject(new StorageError("Failed to open database", "init", request.error));
      };
      request.onblocked = () => {
        warn("IndexedDB open blocked - close other tabs with this database");
      };
      request.onsuccess = () => {
        if (resolved) return;
        resolved = true;
        cleanup2();
        this.db = request.result;
        if (!this.db.objectStoreNames.contains(STORE_STUDENTS$1) || !this.db.objectStoreNames.contains(STORE_BACKUPS) || !this.db.objectStoreNames.contains(STORE_AUDIT_LOG)) {
          warn(
            `Database corrupted (missing stores). Found: [${Array.from(this.db.objectStoreNames).join(", ")}]`
          );
          this.db.close();
          this.db = null;
          const deleteRequest = indexedDB.deleteDatabase(this.dbName);
          deleteRequest.onsuccess = () => {
            this.initPromise = null;
            this.init().then(resolve).catch(reject);
          };
          deleteRequest.onerror = () => {
            this.initPromise = null;
            reject(
              new StorageError(
                "Failed to delete corrupted database",
                "init",
                deleteRequest.error
              )
            );
          };
          return;
        }
        this.initPromise = null;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const transaction = event.target.transaction;
        if (transaction) {
          transaction.onerror = () => {
            error(`Upgrade transaction error: ${transaction.error?.message || "unknown"}`);
          };
          transaction.onabort = () => {
            error(`Upgrade transaction aborted: ${transaction.error?.message || "unknown"}`);
          };
        }
        try {
          if (!db.objectStoreNames.contains(STORE_STUDENTS$1)) {
            const studentsStore = db.createObjectStore(STORE_STUDENTS$1, { keyPath: null });
            studentsStore.createIndex("by-release", "release", { unique: false });
            studentsStore.createIndex("by-service-id", "serviceId", { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
            const backupsStore = db.createObjectStore(STORE_BACKUPS, { keyPath: null });
            backupsStore.createIndex("by-original-key", "originalKey", { unique: false });
            backupsStore.createIndex("by-timestamp", "timestamp", { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_AUDIT_LOG)) {
            const auditStore = db.createObjectStore(STORE_AUDIT_LOG, {
              keyPath: "eventId"
            });
            auditStore.createIndex("by-service-id", "serviceId", { unique: false });
            auditStore.createIndex("by-reset-at", "resetAt", { unique: false });
          }
        } catch (err) {
          error("Error during database upgrade", err);
          throw err;
        }
      };
    });
    return this.initPromise;
  }
  /**
   * Ensure database is initialized before operations
   *
   * @throws StorageNotInitializedError if not initialized
   * @returns Database instance
   */
  ensureInitialized() {
    if (!this.db) {
      throw new StorageNotInitializedError("ensureInitialized");
    }
    return this.db;
  }
  /**
   * Get a student record by release and service ID
   *
   * Handles obfuscation based on ENCRYPT_STORAGE flag.
   * Throws StorageFormatError if data format doesn't match flag setting.
   *
   * @param release - Release identifier
   * @param serviceId - Service identifier
   * @returns Student record or null if not found
   * @throws StorageFormatError if format mismatch detected
   */
  async getStudent(release, serviceId) {
    const db = this.ensureInitialized();
    const key = getStorageKey(release, serviceId);
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_STUDENTS$1, "readonly");
        const store = transaction.objectStore(STORE_STUDENTS$1);
        const request = store.get(key);
        request.onsuccess = () => {
          const rawValue = request.result;
          if (rawValue === void 0 || rawValue === null) {
            resolve(null);
            return;
          }
          try {
            const record = this.decodeStoredValue(rawValue, release, key);
            resolve(record);
          } catch (error2) {
            reject(error2 instanceof Error ? error2 : new Error(String(error2)));
          }
        };
        request.onerror = () => {
          reject(
            new StorageError("Failed to get student record", "getStudent", request.error)
          );
        };
      } catch (error2) {
        reject(new StorageError("Failed to get student record", "getStudent", error2));
      }
    });
  }
  /**
   * Decode stored value, checking format matches ENCRYPT_STORAGE setting
   *
   * @param rawValue - Value from IndexedDB (may be obfuscated string or plain object)
   * @param release - Release ID for key derivation
   * @param storageKey - Storage key for error reporting
   * @returns Decoded StudentRecord
   * @throws StorageFormatError if format doesn't match setting
   */
  decodeStoredValue(rawValue, release, storageKey) {
    const storedIsObfuscated = isObfuscated(rawValue);
    if (storedIsObfuscated) {
      throw new StorageFormatError(
        "Obfuscated data found with ENCRYPT_STORAGE disabled. Run migration to decrypt or re-enable encryption.",
        "plain",
        "obfuscated",
        storageKey
      );
    }
    return rawValue;
  }
  /**
   * Save a student record
   *
   * Encodes data if ENCRYPT_STORAGE is enabled.
   *
   * @param record - Student record to save
   * @throws StorageQuotaError if storage quota exceeded
   */
  async saveStudent(record) {
    const db = this.ensureInitialized();
    const key = getStorageKey(record.release, record.serviceId);
    const valueToStore = record;
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_STUDENTS$1, "readwrite");
        const store = transaction.objectStore(STORE_STUDENTS$1);
        const request = store.put(valueToStore, key);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          if (request.error?.name === "QuotaExceededError") {
            reject(new StorageQuotaError("saveStudent"));
          } else {
            reject(
              new StorageError(
                "Failed to save student record",
                "saveStudent",
                request.error
              )
            );
          }
        };
        transaction.onerror = () => {
          reject(
            new StorageError(
              "Transaction failed while saving student",
              "saveStudent",
              transaction.error
            )
          );
        };
      } catch (error2) {
        reject(new StorageError("Failed to save student record", "saveStudent", error2));
      }
    });
  }
  /**
   * Get all students for a specific release
   *
   * When ENCRYPT_STORAGE is disabled, uses the by-release index for efficient queries.
   * When ENCRYPT_STORAGE is enabled, performs full scan and decodes all records.
   *
   * @param release - Release identifier
   * @returns Array of student records (empty if none found)
   */
  async getStudentsByRelease(release) {
    const db = this.ensureInitialized();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_STUDENTS$1, "readonly");
        const store = transaction.objectStore(STORE_STUDENTS$1);
        const index = store.index("by-release");
        const request = index.getAll(release);
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        request.onerror = () => {
          reject(
            new StorageError(
              "Failed to get students by release",
              "getStudentsByRelease",
              request.error
            )
          );
        };
      } catch (error2) {
        reject(
          new StorageError(
            "Failed to get students by release",
            "getStudentsByRelease",
            error2
          )
        );
      }
    });
  }
  /**
   * Get all students for a release when encryption is enabled
   *
   * Performs full scan, decodes each record, and filters by release.
   */
  async getStudentsByReleaseEncrypted(release) {
    const db = this.ensureInitialized();
    const obfKey = deriveKey(release);
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_STUDENTS$1, "readonly");
        const store = transaction.objectStore(STORE_STUDENTS$1);
        const request = store.openCursor();
        const results = [];
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const rawValue = cursor.value;
            if (isObfuscated(rawValue)) {
              try {
                const record = decode(rawValue, obfKey);
                if (record.release === release) {
                  results.push(record);
                }
              } catch {
                const keyStr = typeof cursor.key === "string" ? cursor.key : JSON.stringify(cursor.key);
                warn(`Skipping corrupted record at key: ${keyStr}`);
              }
            }
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => {
          reject(
            new StorageError(
              "Failed to get students by release",
              "getStudentsByRelease",
              request.error
            )
          );
        };
      } catch (error2) {
        reject(
          new StorageError(
            "Failed to get students by release",
            "getStudentsByRelease",
            error2
          )
        );
      }
    });
  }
  /**
   * Clear all data from the database
   *
   * Removes both students and backups in a single atomic transaction.
   */
  async clearAll() {
    const db = this.ensureInitialized();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(
          [STORE_STUDENTS$1, STORE_BACKUPS, STORE_AUDIT_LOG],
          "readwrite"
        );
        const studentsStore = transaction.objectStore(STORE_STUDENTS$1);
        const backupsStore = transaction.objectStore(STORE_BACKUPS);
        const auditStore = transaction.objectStore(STORE_AUDIT_LOG);
        const clearStudentsRequest = studentsStore.clear();
        const clearBackupsRequest = backupsStore.clear();
        const clearAuditRequest = auditStore.clear();
        let studentsCleared = false;
        let backupsCleared = false;
        let auditCleared = false;
        clearStudentsRequest.onsuccess = () => {
          studentsCleared = true;
          if (backupsCleared && auditCleared) {
            resolve();
          }
        };
        clearBackupsRequest.onsuccess = () => {
          backupsCleared = true;
          if (studentsCleared && auditCleared) {
            resolve();
          }
        };
        clearAuditRequest.onsuccess = () => {
          auditCleared = true;
          if (studentsCleared && backupsCleared) {
            resolve();
          }
        };
        clearStudentsRequest.onerror = () => {
          reject(
            new StorageError(
              "Failed to clear students",
              "clearAll",
              clearStudentsRequest.error
            )
          );
        };
        clearBackupsRequest.onerror = () => {
          reject(
            new StorageError(
              "Failed to clear backups",
              "clearAll",
              clearBackupsRequest.error
            )
          );
        };
        clearAuditRequest.onerror = () => {
          reject(
            new StorageError(
              "Failed to clear audit log",
              "clearAll",
              clearAuditRequest.error
            )
          );
        };
        transaction.onerror = () => {
          reject(
            new StorageError(
              "Transaction failed during clearAll",
              "clearAll",
              transaction.error
            )
          );
        };
      } catch (error2) {
        reject(new StorageError("Failed to clear all data", "clearAll", error2));
      }
    });
  }
  /**
   * Create a backup of a student record
   *
   * Backup key format: backup_{timestamp}_{serviceId}
   *
   * @param record - Student record to backup
   * @throws StorageQuotaError if storage quota exceeded
   */
  async backup(record) {
    const db = this.ensureInitialized();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const backupKey = `backup_${timestamp}_${record.serviceId}`;
    const originalKey = getStorageKey(record.release, record.serviceId);
    const backupRecord = {
      ...record,
      originalKey,
      timestamp
    };
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_BACKUPS, "readwrite");
        const store = transaction.objectStore(STORE_BACKUPS);
        const request = store.put(backupRecord, backupKey);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          if (request.error?.name === "QuotaExceededError") {
            reject(new StorageQuotaError("backup"));
          } else {
            reject(new StorageError("Failed to create backup", "backup", request.error));
          }
        };
        transaction.onerror = () => {
          reject(
            new StorageError(
              "Transaction failed during backup",
              "backup",
              transaction.error
            )
          );
        };
      } catch (error2) {
        reject(new StorageError("Failed to create backup", "backup", error2));
      }
    });
  }
  /**
   * Save a PIN reset event to the audit log
   *
   * @param event - PIN reset event to log
   */
  async saveAuditEvent(event) {
    const db = this.ensureInitialized();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_AUDIT_LOG, "readwrite");
        const store = transaction.objectStore(STORE_AUDIT_LOG);
        const request = store.add(event);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          reject(
            new StorageError(
              "Failed to save audit event",
              "saveAuditEvent",
              request.error
            )
          );
        };
      } catch (error2) {
        reject(new StorageError("Failed to save audit event", "saveAuditEvent", error2));
      }
    });
  }
  /**
   * Close the database connection
   *
   * Useful for cleanup in tests and application shutdown.
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}
let storageInstance = null;
let currentDbName = null;
function getStorageAdapter(dbName) {
  if (!dbName) {
    throw new Error("FATAL: dbName is required for getStorageAdapter()");
  }
  if (storageInstance && currentDbName !== dbName) {
    storageInstance.close();
    storageInstance = null;
  }
  if (!storageInstance) {
    storageInstance = new IndexedDBStorageAdapter(dbName);
    currentDbName = dbName;
  }
  return storageInstance;
}
function calculateCompletionState(answers, totalQuestions) {
  if (totalQuestions === 0) {
    return "unstarted";
  }
  if (isPageUnstarted(answers)) {
    return "unstarted";
  }
  if (isPageComplete(answers, totalQuestions)) {
    return "complete";
  }
  return "incomplete";
}
function isPageComplete(answers, totalQuestions) {
  if (answers.length !== totalQuestions) {
    return false;
  }
  return answers.every((answer) => answer.success === true);
}
function isPageUnstarted(answers) {
  return answers.length === 0;
}
class StorageService {
  /**
   * Create storage service with specified database name
   *
   * @param dbName - IndexedDB database name (REQUIRED - no default)
   */
  constructor(dbName) {
    if (!dbName) {
      throw new Error("FATAL: dbName is required for StorageService");
    }
    this.dbName = dbName;
    this.adapter = getStorageAdapter(dbName);
  }
  /**
   * Initialize IndexedDB storage
   */
  async init() {
    try {
      await this.adapter.init();
      info(`Storage service initialized (IndexedDB "${this.dbName}" ready)`);
    } catch (err) {
      error("Failed to initialize storage service", err);
      throw err;
    }
  }
  /**
   * Load student record from IndexedDB
   *
   * Creates a new record if none exists.
   *
   * @param session - Current session data
   * @returns Student record
   */
  async loadStudentRecord(session) {
    try {
      const existing = await this.adapter.getStudent(session.release, session.serviceId);
      if (existing) {
        info(`Loaded student record for ${session.serviceId} from IndexedDB`);
        return existing;
      }
      const newRecord = {
        schema: 1,
        docId: session.release,
        // Use release as docId
        release: session.release,
        serviceId: session.serviceId,
        name: session.name,
        attempted: 0,
        correct: 0,
        updated: (/* @__PURE__ */ new Date()).toISOString(),
        pages: {}
      };
      info(`Created new student record for ${session.serviceId}`);
      return newRecord;
    } catch (err) {
      warn(`IndexedDB error, creating new record: ${err.message}`);
      const newRecord = {
        schema: 1,
        docId: session.release,
        release: session.release,
        serviceId: session.serviceId,
        name: session.name,
        attempted: 0,
        correct: 0,
        updated: (/* @__PURE__ */ new Date()).toISOString(),
        pages: {}
      };
      return newRecord;
    }
  }
  /**
   * Save student record to IndexedDB
   *
   * @param record - Student record to save
   */
  async saveStudentRecord(record) {
    try {
      record.updated = (/* @__PURE__ */ new Date()).toISOString();
      const totals = recalculateTotalsFromPages(record.pages);
      record.attempted = totals.attempted;
      record.correct = totals.correct;
      await this.adapter.saveStudent(record);
      info(`Saved student record for ${record.serviceId} to IndexedDB`);
    } catch (err) {
      error("Failed to save student record", err);
      throw err;
    }
  }
  /**
   * Update student record with a new answer
   *
   * @param record - Current student record
   * @param pageId - Page where answer was submitted
   * @param questionIndex - Question index (0-based)
   * @param answer - Answer record
   * @param totalQuestions - Total questions on the page
   * @returns Updated student record
   */
  updateRecordWithAnswer(record, pageId, questionIndex, answer, totalQuestions) {
    const existingPage = record.pages[pageId];
    const pageData = existingPage || {
      answers: [],
      state: "unstarted"
    };
    while (pageData.answers.length <= questionIndex) {
      pageData.answers.push({
        answer: "",
        success: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    pageData.answers[questionIndex] = answer;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!pageData.firstAttempted) {
      pageData.firstAttempted = now;
    }
    pageData.lastAttempted = now;
    pageData.state = calculateCompletionState(pageData.answers, totalQuestions);
    return {
      ...record,
      pages: {
        ...record.pages,
        [pageId]: pageData
      }
    };
  }
  /**
   * Build session cache from student record
   *
   * @param record - Student record
   * @returns Session cache
   */
  buildCache(record) {
    return buildCacheFromRecord(record);
  }
  /**
   * Get all students for a release
   *
   * @param release - Release identifier
   * @returns Array of student records
   */
  async getStudentsByRelease(release) {
    try {
      return await this.adapter.getStudentsByRelease(release);
    } catch (err) {
      error("Failed to get students by release", err);
      throw err;
    }
  }
  /**
   * Clear all data from IndexedDB
   */
  async clearAll() {
    try {
      await this.adapter.clearAll();
      info("Cleared all data from IndexedDB");
    } catch (err) {
      error("Failed to clear all data", err);
      throw err;
    }
  }
  /**
   * Create backup of student record
   *
   * @param record - Student record to backup
   */
  async backup(record) {
    try {
      await this.adapter.backup(record);
      info(`Created backup for ${record.serviceId}`);
    } catch (err) {
      warn(`Failed to create backup for ${record.serviceId}`, err);
    }
  }
}
let storageServiceInstance = null;
let currentServiceDbName = null;
function getStorageService(dbName) {
  if (storageServiceInstance && !dbName) {
    return storageServiceInstance;
  }
  if (storageServiceInstance && dbName && currentServiceDbName !== dbName) {
    warn(
      `Storage service already initialized with dbName="${currentServiceDbName}", ignoring new dbName="${dbName}"`
    );
    return storageServiceInstance;
  }
  if (!storageServiceInstance) {
    if (!dbName) {
      throw new Error("FATAL: dbName is required for first getStorageService() call");
    }
    storageServiceInstance = new StorageService(dbName);
    currentServiceDbName = dbName;
  }
  return storageServiceInstance;
}
const tableMetadata$1 = /* @__PURE__ */ new WeakMap();
function enhanceQuizTable(table, options) {
  const existing = tableMetadata$1.get(table);
  let parsed;
  if (existing) {
    if (!existing.interactive && options.interactive) {
      parsed = existing.parsed;
    } else {
      return true;
    }
  } else {
    parsed = parseQuizTable(table);
    if (parsed.errors && parsed.errors.length > 0) {
      error("Quiz table has validation errors:", parsed.errors);
    }
  }
  const metadata = {
    parsed,
    interactive: options.interactive,
    pageId: options.pageId
  };
  if (options.interactive) {
    if (!options.pageId) {
      error("Interactive mode requires pageId option");
      return false;
    }
    info(`Preparing interactive enhancement for pageId: ${options.pageId}`);
    metadata.debouncer = new Debouncer();
    metadata.inputs = [];
  }
  tableMetadata$1.set(table, metadata);
  if (options.interactive) {
    const result = enhanceInteractive$1(table, metadata);
    if (result) {
      info(`Interactive enhancement succeeded for table with ${parsed.questions.length} questions`);
    } else {
      error("Interactive enhancement failed");
    }
    return result;
  } else {
    return enhanceNonInteractive$1(table);
  }
}
function enhanceNonInteractive$1(table) {
  removeColgroup(table);
  hideAnswerColumn(table);
  hideDetailColumn(table);
  addClass(table, "qd-quiz-non-interactive");
  return true;
}
function enhanceInteractive$1(table, metadata) {
  const { parsed, pageId, debouncer } = metadata;
  if (!pageId || !debouncer) {
    error("Interactive mode requires pageId and debouncer");
    return false;
  }
  showAnswerColumn(table);
  hideDetailColumn(table);
  const session = getJSON(STORAGE_KEYS.SESSION);
  if (!session) {
    error("No active session found");
    return false;
  }
  let cache = getJSON(STORAGE_KEYS.CACHE);
  if (!cache) {
    cache = {
      totals: { total: 0, answered: 0, correct: 0 },
      pages: {}
    };
  } else {
    info(
      `Cache loaded: ${cache.totals.total} total questions, ${Object.keys(cache.pages).length} pages`
    );
  }
  const totalQuestions = parsed.questions.length;
  cache = registerPageQuestions(cache, pageId, totalQuestions);
  setJSON(STORAGE_KEYS.CACHE, cache);
  const pageCache = cache?.pages[pageId];
  const existingAnswers = pageCache?.answers || [];
  info(
    `Page ${pageId}: ${existingAnswers.length} existing answers, state: ${pageCache?.state || "none"}`
  );
  const tbody = table.querySelector("tbody");
  if (!tbody) {
    error("Quiz table has no tbody element");
    return false;
  }
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const inputs = [];
  parsed.questions.forEach((question, index) => {
    const row = rows[index];
    if (!row) return;
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length !== 3) return;
    const questionCell = cells[0];
    const answerCell = cells[1];
    if (!questionCell || !answerCell) return;
    const existingAnswer = existingAnswers[index];
    if (existingAnswer && existingAnswer.answer) {
      info(
        `Q${index + 1}: Pre-filling with "${existingAnswer.answer}" (${existingAnswer.success ? "correct" : "incorrect"})`
      );
    }
    const input = createQuestionInput(question, existingAnswer);
    inputs.push(input);
    removeClass(answerCell, "qd-answer-correct", "qd-answer-incorrect");
    answerCell.textContent = "";
    answerCell.appendChild(input);
    if (existingAnswer) {
      applyValidationStyling(answerCell, existingAnswer.success);
    }
    const eventType = input.tagName === "SELECT" ? "change" : "input";
    input.addEventListener(eventType, () => {
      handleAnswerInput(table, metadata, index, input.value);
    });
  });
  metadata.inputs = inputs;
  const showAnswersHandler = () => {
    void showStudentAnswersForTable(table, metadata);
  };
  const hideAnswersHandler = () => {
    hideStudentAnswersForTable(table);
  };
  document.addEventListener("qd:instructor-show-answers", showAnswersHandler);
  document.addEventListener("qd:instructor-hide-answers", hideAnswersHandler);
  const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === "true";
  const showAnswers = sessionStorage.getItem("qd/instructor/showAnswers") === "true";
  if (isInstructor && showAnswers) {
    void showStudentAnswersForTable(table, metadata);
  }
  const resetUIState = () => {
    const answerCells = table.querySelectorAll("td.qd-answer-correct, td.qd-answer-incorrect");
    answerCells.forEach((cell) => {
      removeClass(cell, "qd-answer-correct", "qd-answer-incorrect");
    });
    if (metadata.inputs) {
      for (const input of metadata.inputs) {
        if (input instanceof HTMLSelectElement) {
          input.selectedIndex = 0;
        } else if (input instanceof HTMLInputElement) {
          input.value = "";
        }
      }
    }
    hideStudentAnswersForTable(table);
  };
  const logoutHandler = () => {
    resetUIState();
  };
  const loginHandler = () => {
    resetUIState();
  };
  document.addEventListener("qd:logout", logoutHandler);
  document.addEventListener("qd:login", loginHandler);
  metadata.cleanupInstructorListeners = () => {
    document.removeEventListener("qd:instructor-show-answers", showAnswersHandler);
    document.removeEventListener("qd:instructor-hide-answers", hideAnswersHandler);
    document.removeEventListener("qd:logout", logoutHandler);
    document.removeEventListener("qd:login", loginHandler);
  };
  addClass(table, "qd-quiz-interactive");
  return true;
}
function createQuestionInput(question, existingAnswer) {
  const spec = getQuestionInputSpec(question, existingAnswer);
  if (spec.type === "select") {
    const select = createElement("select");
    select.className = spec.className;
    const placeholderOption = createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = spec.placeholder;
    placeholderOption.disabled = true;
    select.appendChild(placeholderOption);
    if (spec.options) {
      spec.options.forEach((opt) => {
        const option = createElement("option");
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
      });
    }
    select.value = spec.value;
    return select;
  } else {
    const input = createElement("input");
    input.type = spec.type;
    input.className = spec.className;
    input.placeholder = spec.placeholder;
    input.value = spec.value;
    return input;
  }
}
function handleAnswerInput(table, metadata, questionIndex, answer) {
  const { debouncer, pageId, parsed } = metadata;
  if (!debouncer || !pageId) {
    return;
  }
  const question = parsed.questions[questionIndex];
  if (!question) {
    return;
  }
  debouncer.debounce(
    `save-answer-${questionIndex}`,
    () => {
      void saveAnswer(table, metadata, questionIndex, answer);
    },
    200
  );
}
async function saveAnswer(table, metadata, questionIndex, answer) {
  const { pageId, parsed, inputs } = metadata;
  if (!pageId || !inputs) {
    return;
  }
  const question = parsed.questions[questionIndex];
  if (!question) {
    return;
  }
  const session = getJSON(STORAGE_KEYS.SESSION);
  if (!session) {
    error("No active session found");
    return;
  }
  const success = validateAnswer(question, answer);
  const answerRecord = {
    answer: answer.trim(),
    success,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  const storageService = getStorageService();
  let studentRecord;
  try {
    studentRecord = await storageService.loadStudentRecord(session);
  } catch (err) {
    warn("Failed to load student record, answer not saved", err);
    return;
  }
  const totalQuestions = parsed.questions.length;
  const updatedRecord = storageService.updateRecordWithAnswer(
    studentRecord,
    pageId,
    questionIndex,
    answerRecord,
    totalQuestions
  );
  try {
    await storageService.saveStudentRecord(updatedRecord);
  } catch (err) {
    warn("Failed to save student record to IndexedDB", err);
  }
  const cache = storageService.buildCache(updatedRecord);
  setJSON(STORAGE_KEYS.CACHE, cache);
  const row = table.querySelector(`tbody tr:nth-child(${questionIndex + 1})`);
  if (row) {
    const answerCell = row.querySelector("td:nth-child(2)");
    if (answerCell) {
      applyValidationStyling(answerCell, success);
    }
  }
  emitCustomEvent("qd:answer-saved", {
    pageId,
    answer: answerRecord
  });
  const pageData = updatedRecord.pages[pageId];
  if (pageData) {
    emitCustomEvent("qd:state-changed", {
      pageId,
      state: pageData.state
    });
  }
}
function applyValidationStyling(cell, success) {
  removeClass(cell, "qd-answer-correct", "qd-answer-incorrect");
  addClass(cell, success ? "qd-answer-correct" : "qd-answer-incorrect");
}
function removeColgroup(table) {
  const colgroup = table.querySelector("colgroup");
  if (colgroup) {
    colgroup.remove();
  }
}
function hideAnswerColumn(table) {
  const headerCells = table.querySelectorAll("thead th, thead td");
  if (headerCells[1]) {
    addClass(headerCells[1], "qd-hidden");
  }
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells[1]) {
      addClass(cells[1], "qd-hidden");
      cells[1].textContent = "";
    }
  });
}
function showAnswerColumn(table) {
  const headerCells = table.querySelectorAll("thead th, thead td");
  if (headerCells[1]) {
    removeClass(headerCells[1], "qd-hidden");
  }
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells[1]) {
      removeClass(cells[1], "qd-hidden");
    }
  });
}
function hideDetailColumn(table) {
  const headerCells = table.querySelectorAll("thead th, thead td");
  if (headerCells[2]) {
    addClass(headerCells[2], "qd-hidden");
  }
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells[2]) {
      addClass(cells[2], "qd-hidden");
    }
  });
}
function getQuizTableMetadata(table) {
  return tableMetadata$1.get(table);
}
function isQuizTableEnhanced(table) {
  return tableMetadata$1.has(table);
}
function resetQuizTableToNonInteractive(table) {
  const metadata = tableMetadata$1.get(table);
  if (!metadata) return;
  metadata.interactive = false;
  metadata.pageId = void 0;
  metadata.inputs = void 0;
  metadata.cleanupInstructorListeners?.();
  metadata.cleanupInstructorListeners = void 0;
  hideAnswerColumn(table);
  hideDetailColumn(table);
  removeClass(table, "qd-quiz-interactive");
}
async function showStudentAnswersForTable(table, metadata) {
  const { pageId, parsed } = metadata;
  if (!pageId) return;
  const session = getJSON(STORAGE_KEYS.SESSION);
  if (!session) return;
  const storageService = getStorageService();
  try {
    const students = await storageService.getStudentsByRelease(session.release);
    if (students.length === 0) {
      info("No student data available for this release");
      alert(
        "No student data available for this release. Students need to log in and answer questions first."
      );
      return;
    }
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll("tr"));
    parsed.questions.forEach((_question, questionIndex) => {
      const row = rows[questionIndex];
      if (!row) return;
      const cells = Array.from(row.querySelectorAll("td"));
      const answerCell = cells[1];
      if (!answerCell) return;
      const existingDisplay = answerCell.querySelector(".qd-student-answers");
      if (existingDisplay) {
        existingDisplay.remove();
      }
      const studentAnswers = formatStudentAnswersForDisplay(students, pageId, questionIndex);
      if (studentAnswers.length > 0) {
        const display = document.createElement("div");
        display.className = "qd-student-answers";
        studentAnswers.forEach((sa) => {
          const answerDiv = document.createElement("div");
          answerDiv.className = `qd-student-answer ${sa.cssClass}`;
          answerDiv.innerHTML = `
            <span class="qd-student-name">${sa.name} (${sa.maskedServiceId})</span>:
            <span class="qd-student-answer-text">${sa.answer}</span>
            <span class="qd-timestamp">${sa.formattedTimestamp}</span>
          `;
          display.appendChild(answerDiv);
        });
        answerCell.appendChild(display);
      }
    });
    info(`Displayed student answers for ${students.length} students on page ${pageId}`);
  } catch (err) {
    error("Failed to load student answers", err);
  }
}
function hideStudentAnswersForTable(table) {
  const displays = table.querySelectorAll(".qd-student-answers");
  displays.forEach((display) => display.remove());
}
function hashString(input, length = 16) {
  let hash = 5381;
  for (let i3 = 0; i3 < input.length; i3++) {
    const char = input.charCodeAt(i3);
    hash = (hash << 5) + hash + char;
    hash = hash & hash;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
  const repeatedHash = hexHash.repeat(Math.ceil(length / hexHash.length));
  return repeatedHash.substring(0, length);
}
function generateTableId(table) {
  const rows = getTableRows(table);
  const firstRow = rows[0];
  const cols = firstRow ? getRowCells(firstRow).length : 0;
  const className = table.className || "qd-analysis";
  const signature = `${rows.length}x${cols}:${className}`;
  return hashString(signature, 16);
}
function generateCellKey(row, col, content) {
  const normalized = content.replace(/\s+/g, " ").trim();
  const contentHash = hashString(normalized, 8);
  return `R${row}C${col}#f:${contentHash}`;
}
function isCellEditable(cell) {
  return cell.classList.contains("interactive");
}
function parseAnalysisTable(table) {
  const errors = [];
  if (!table.querySelector("tbody")) {
    errors.push("Analysis table must have a tbody element");
  }
  const rows = getTableRows(table);
  if (rows.length === 0) {
    errors.push("Analysis table must have at least one row");
  }
  const tableId = generateTableId(table);
  const editableCells = [];
  rows.forEach((row, rowIndex) => {
    const cells = getRowCells(row);
    cells.forEach((cell, colIndex) => {
      if (isCellEditable(cell)) {
        const content = getTextContent(cell);
        const key = generateCellKey(rowIndex, colIndex, content);
        editableCells.push({
          row: rowIndex,
          col: colIndex,
          key
        });
      }
    });
  });
  return {
    element: table,
    tableId,
    editableCells,
    errors: errors.length > 0 ? errors : void 0
  };
}
const tableMetadata = /* @__PURE__ */ new WeakMap();
function enhanceAnalysisTable(table, options) {
  const parsed = parseAnalysisTable(table);
  if (parsed.errors && parsed.errors.length > 0) {
    error("Analysis table has validation errors:", parsed.errors);
  }
  const metadata = {
    parsed,
    interactive: options.interactive,
    pageId: options.pageId
  };
  if (options.interactive) {
    if (!options.pageId) {
      error("Interactive mode requires pageId option");
      return false;
    }
    metadata.debouncer = new Debouncer();
    metadata.cellKeyMap = /* @__PURE__ */ new Map();
  }
  tableMetadata.set(table, metadata);
  if (options.interactive) {
    return enhanceInteractive(table, metadata);
  } else {
    return enhanceNonInteractive(table);
  }
}
function enhanceNonInteractive(table) {
  addClass(table, "qd-analysis-non-interactive");
  const showHandler = () => {
    void showStudentEntriesForTable(table);
  };
  const hideHandler = () => {
    hideStudentEntriesForTable(table);
  };
  document.addEventListener("qd:instructor-show-answers", showHandler);
  document.addEventListener("qd:instructor-hide-answers", hideHandler);
  return true;
}
function enhanceInteractive(table, metadata) {
  const { parsed, pageId, debouncer, cellKeyMap } = metadata;
  if (!pageId || !debouncer || !cellKeyMap) {
    error("Interactive mode requires pageId, debouncer, and cellKeyMap");
    return false;
  }
  const session = getJSON(STORAGE_KEYS.SESSION);
  if (!session) {
    error("No active session found");
    return false;
  }
  const cache = getJSON(STORAGE_KEYS.CACHE);
  const pageCache = cache?.pages[pageId];
  const existingAnalysis = pageCache?.analysis;
  const existingCells = existingAnalysis?.cells || {};
  const rows = getTableRows(table);
  parsed.editableCells.forEach(({ row, col, key }) => {
    const rowElement = rows[row];
    if (!rowElement) return;
    const cells = getRowCells(rowElement);
    const cell = cells[col];
    if (!cell) return;
    if (!isCellEditable(cell)) {
      error(`Cell at R${row}C${col} is no longer editable`);
      return;
    }
    cellKeyMap.set(cell, key);
    if (existingCells[key]) {
      cell.textContent = existingCells[key];
    }
    cell.contentEditable = "true";
    addClass(cell, "qd-editable");
    cell.addEventListener("input", () => {
      handleCellEdit(metadata, cell, key);
    });
  });
  addClass(table, "qd-analysis-interactive");
  return true;
}
function handleCellEdit(metadata, cell, cellKey) {
  const { debouncer, pageId } = metadata;
  if (!debouncer || !pageId) {
    return;
  }
  const content = getTextContent(cell);
  debouncer.debounce(
    `save-cell-${cellKey}`,
    () => {
      void saveCellData(metadata, cellKey, content);
    },
    500
  );
}
async function saveCellData(metadata, cellKey, content) {
  const { pageId, parsed } = metadata;
  if (!pageId) {
    return;
  }
  const session = getJSON(STORAGE_KEYS.SESSION);
  if (!session) {
    error("No active session found");
    return;
  }
  const storageService = getStorageService();
  let studentRecord;
  try {
    studentRecord = await storageService.loadStudentRecord(session);
  } catch (err) {
    warn("Failed to load student record, analysis not saved", err);
    return;
  }
  const pageData = studentRecord.pages[pageId] || {
    answers: [],
    state: "unstarted"
  };
  const analysisData = pageData.analysis || {
    tableId: parsed.tableId,
    cells: {}
  };
  analysisData.cells[cellKey] = content;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (!analysisData.firstEdited) {
    analysisData.firstEdited = now;
  }
  analysisData.lastEdited = now;
  pageData.analysis = analysisData;
  studentRecord.pages[pageId] = pageData;
  studentRecord.updated = now;
  try {
    await storageService.saveStudentRecord(studentRecord);
  } catch (err) {
    warn("Failed to save student record to IndexedDB", err);
  }
  const cache = storageService.buildCache(studentRecord);
  setJSON(STORAGE_KEYS.CACHE, cache);
  emitCustomEvent("qd:analysis-saved", {
    pageId,
    tableId: parsed.tableId,
    cellKey,
    content
  });
}
function getAnalysisTableMetadata(table) {
  return tableMetadata.get(table);
}
function isAnalysisTableEnhanced(table) {
  return tableMetadata.has(table);
}
function groupEntriesByCell(students, pageId) {
  const grouped = {};
  students.forEach((student) => {
    const pageData = student.pages[pageId];
    if (!pageData || !pageData.analysis) {
      return;
    }
    const { cells } = pageData.analysis;
    const timestamp = pageData.analysis.lastEdited || student.updated;
    Object.entries(cells).forEach(([cellKey, content]) => {
      if (!grouped[cellKey]) {
        grouped[cellKey] = [];
      }
      grouped[cellKey].push({
        serviceId: student.serviceId,
        name: student.name,
        content,
        timestamp
      });
    });
  });
  return grouped;
}
function sortByTimestamp(entries) {
  return [...entries].sort((a2, b2) => {
    const dateA = new Date(a2.timestamp).getTime();
    const dateB = new Date(b2.timestamp).getTime();
    return dateB - dateA;
  });
}
function createStudentEntriesDisplay(entries) {
  const container = document.createElement("div");
  container.className = "qd-student-entries";
  if (entries.length === 0) {
    container.className += " qd-no-entries";
    container.textContent = "(No entries yet)";
    container.style.cssText = "color: #9ca3af; font-style: italic; font-size: 13px; padding: 8px 0;";
    return container;
  }
  const sortedEntries = sortByTimestamp(entries);
  sortedEntries.forEach((entry) => {
    const entryDiv = document.createElement("div");
    entryDiv.className = "qd-entry";
    entryDiv.style.cssText = "padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #1f2937;";
    const last4 = entry.serviceId.slice(-4);
    const timestamp = formatStoredTimestamp(entry.timestamp);
    const nameSpan = document.createElement("span");
    nameSpan.style.cssText = "font-weight: 600; color: #374151;";
    nameSpan.textContent = `${entry.name} (${last4}) • ${timestamp}: `;
    const contentSpan = document.createElement("span");
    contentSpan.style.cssText = "white-space: pre-wrap;";
    contentSpan.textContent = entry.content;
    entryDiv.appendChild(nameSpan);
    entryDiv.appendChild(contentSpan);
    container.appendChild(entryDiv);
  });
  container.style.cssText = "margin-top: 12px; padding-top: 8px; border-top: 2px solid #3b82f6;";
  return container;
}
async function showStudentEntriesForTable(table) {
  const metadata = tableMetadata.get(table);
  if (!metadata) {
    warn("Cannot show student entries: table not enhanced");
    return;
  }
  const pageId = metadata.pageId || getCurrentPageId();
  if (!pageId) {
    warn("Cannot show student entries: page ID not found");
    return;
  }
  const session = getJSON(STORAGE_KEYS.SESSION);
  if (!session) {
    warn("Cannot show student entries: no active session");
    return;
  }
  const storageService = getStorageService();
  let students;
  try {
    students = await storageService.getStudentsByRelease(session.release);
  } catch (err) {
    error("Failed to load students for instructor view:", err);
    return;
  }
  const grouped = groupEntriesByCell(students, pageId);
  const { editableCells } = metadata.parsed;
  const rows = getTableRows(table);
  editableCells.forEach(({ row, col, key }) => {
    const rowElement = rows[row];
    if (!rowElement) return;
    const cells = getRowCells(rowElement);
    const cell = cells[col];
    if (!cell) return;
    const entries = grouped[key] || [];
    const displayElement = createStudentEntriesDisplay(entries);
    displayElement.setAttribute("data-qd-student-entries", "true");
    const existing = cell.querySelector("[data-qd-student-entries]");
    if (existing) {
      existing.remove();
    }
    cell.appendChild(displayElement);
  });
  info(`Displayed student entries for ${editableCells.length} cells`);
}
function hideStudentEntriesForTable(table) {
  const displays = table.querySelectorAll("[data-qd-student-entries]");
  displays.forEach((display) => display.remove());
}
function resetAnalysisTableToNonInteractive(table) {
  const metadata = tableMetadata.get(table);
  if (!metadata) return;
  hideStudentEntriesForTable(table);
  if (metadata.interactive) {
    const editableCells = table.querySelectorAll(".qd-editable");
    editableCells.forEach((cell) => {
      if (cell instanceof HTMLTableCellElement) {
        cell.contentEditable = "false";
        cell.classList.remove("qd-editable");
        cell.textContent = "";
      }
    });
    table.classList.remove("qd-analysis-interactive");
    metadata.debouncer?.cancelAll();
  }
  metadata.interactive = false;
  metadata.pageId = void 0;
  metadata.debouncer = void 0;
  metadata.cellKeyMap = void 0;
}
function getCurrentPageId() {
  const bodyPageId = document.body.dataset.pageId;
  if (bodyPageId) {
    return bodyPageId;
  }
  const path = window.location.pathname;
  const filename = path.split("/").pop() || "";
  const pageId = filename.replace(".html", "");
  return pageId || void 0;
}
class EventCoordinator {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * Register all event listeners
   */
  initialize() {
    this.registerLoginHandlers();
    this.registerLogoutHandlers();
    this.registerAnswerHandlers();
    this.registerStateHandlers();
    this.registerInstructorHandlers();
    this.registerDataHandlers();
  }
  /**
   * Register handlers for login events
   */
  registerLoginHandlers() {
    this.addEventListener("qd:login", (event) => {
      void (async () => {
        const detail = event.detail;
        info(`Login event: ${detail.serviceId} (${detail.name})`);
        if (detail.serviceId === "INSTRUCTOR") {
          return;
        }
        const session = getJSON(STORAGE_KEYS.SESSION);
        if (!session) {
          return;
        }
        const storageService = getStorageService();
        let studentRecord;
        let cache;
        try {
          studentRecord = await storageService.loadStudentRecord(session);
          await storageService.saveStudentRecord(studentRecord);
          cache = storageService.buildCache(studentRecord);
          setJSON(STORAGE_KEYS.CACHE, cache);
          info(`Cache built from IndexedDB: ${cache.totals.total} total questions`);
        } catch {
          const emptyCache = {
            totals: { total: 0, answered: 0, correct: 0 },
            pages: {}
          };
          setJSON(STORAGE_KEYS.CACHE, emptyCache);
        }
        this.dispatchEvent("qd:cache-rebuild", {});
        this.upgradeTablesAfterLogin();
      })();
    });
  }
  /**
   * Upgrade all tables to interactive mode after login
   */
  upgradeTablesAfterLogin() {
    const pathname = window.location.pathname;
    const filename = pathname.substring(pathname.lastIndexOf("/") + 1);
    const pageId = filename.replace(/\.html?$/i, "");
    if (!pageId) {
      return;
    }
    const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === "true";
    if (isInstructor) {
      const quizTables2 = document.querySelectorAll("table.qd-quiz");
      quizTables2.forEach((table) => {
        const metadata = getQuizTableMetadata(table);
        if (!metadata) return;
        metadata.pageId = pageId;
        const answerCells = table.querySelectorAll("td:nth-child(2), th:nth-child(2)");
        answerCells.forEach((cell) => {
          cell.classList.remove("qd-hidden");
        });
        const answerDataCells = table.querySelectorAll("tbody td:nth-child(2)");
        answerDataCells.forEach((cell, index) => {
          const question = metadata.parsed.questions[index];
          if (question && cell instanceof HTMLTableCellElement) {
            cell.textContent = question.correctAnswer;
          }
        });
        const detailCells = table.querySelectorAll("td:nth-child(3), th:nth-child(3)");
        detailCells.forEach((cell) => cell.classList.remove("qd-hidden"));
        const showAnswersHandler = () => {
          void showStudentAnswersForTable(table, metadata);
        };
        const hideAnswersHandler = () => {
          hideStudentAnswersForTable(table);
        };
        document.addEventListener("qd:instructor-show-answers", showAnswersHandler);
        document.addEventListener("qd:instructor-hide-answers", hideAnswersHandler);
        const showAnswers = sessionStorage.getItem("qd/instructor/showAnswers") === "true";
        if (showAnswers) {
          void showAnswersHandler();
        }
      });
      return;
    }
    const quizTables = document.querySelectorAll("table.qd-quiz");
    if (quizTables.length > 0) {
      info(`Upgrading ${quizTables.length} quiz table(s) to interactive mode...`);
      quizTables.forEach((table) => {
        enhanceQuizTable(table, { interactive: true, pageId });
      });
    }
    const analysisTables = document.querySelectorAll("table.qd-analysis");
    if (analysisTables.length > 0) {
      info(`Upgrading ${analysisTables.length} analysis table(s) to interactive mode...`);
      analysisTables.forEach((table) => {
        enhanceAnalysisTable(table, { interactive: true, pageId });
      });
    }
  }
  /**
   * Register handlers for logout events
   */
  registerLogoutHandlers() {
    this.addEventListener("qd:logout", (event) => {
      const detail = event.detail;
      info(`Logout event: ${detail.serviceId}`);
      const quizTables = document.querySelectorAll("table.qd-quiz");
      quizTables.forEach((table) => {
        resetQuizTableToNonInteractive(table);
      });
      const analysisTables = document.querySelectorAll("table.qd-analysis");
      analysisTables.forEach((table) => {
        resetAnalysisTableToNonInteractive(table);
      });
      this.dispatchEvent("qd:cache-clear", {});
    });
  }
  /**
   * Register handlers for answer saved events
   */
  registerAnswerHandlers() {
    this.addEventListener("qd:answer-saved", (event) => {
      const detail = event.detail;
      info(
        `Answer saved: ${detail.pageId} Q${detail.questionIndex} = ${detail.answer} (${detail.success ? "correct" : "incorrect"})`
      );
      this.dispatchEvent("qd:cache-update", { pageId: detail.pageId });
    });
  }
  /**
   * Register handlers for state changed events
   */
  registerStateHandlers() {
    this.addEventListener("qd:state-changed", (event) => {
      const detail = event.detail;
      info(`State changed: ${detail.pageId} → ${detail.state}`);
      this.dispatchEvent("qd:badge-update", { pageId: detail.pageId, state: detail.state });
    });
  }
  /**
   * Register handlers for instructor events
   */
  registerInstructorHandlers() {
    this.addEventListener("qd:instructor-unlock", (event) => {
      const detail = event.detail;
      info(`Instructor mode unlocked at ${detail.unlockTime}`);
    });
    this.addEventListener("qd:instructor-lock", () => {
    });
  }
  /**
   * Register handlers for data management events
   */
  registerDataHandlers() {
    this.addEventListener("qd:data-cleared", (event) => {
      const detail = event.detail;
      info(`All data cleared at ${detail.timestamp}`);
      this.dispatchEvent("qd:cache-clear", {});
    });
  }
  /**
   * Add event listener
   */
  addEventListener(eventName, handler) {
    document.addEventListener(eventName, handler);
    const handlers = this.listeners.get(eventName) || [];
    handlers.push(handler);
    this.listeners.set(eventName, handlers);
  }
  /**
   * Dispatch custom event
   */
  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }
  /**
   * Cleanup event listeners
   */
  cleanup() {
    for (const [eventName, handlers] of this.listeners) {
      for (const handler of handlers) {
        document.removeEventListener(eventName, handler);
      }
    }
    this.listeners.clear();
  }
}
class SessionCoordinator {
  constructor() {
    this.sessionService = new SessionService();
  }
  /**
   * Initialize session coordinator
   * - Load existing session from storage
   * - Schedule expiry check
   * - Setup activity tracking
   */
  initialize() {
    const session = this.sessionService.getSession();
    if (session) {
      info(`Existing session loaded for ${session.serviceId}`);
      if (this.sessionService.isExpired()) {
        warn("Session expired, clearing");
        this.sessionService.clearSession();
        return;
      }
      this.scheduleExpiryCheck(session);
      this.setupActivityTracking();
    }
  }
  /**
   * Schedule expiry check based on session timeout
   */
  scheduleExpiryCheck(session) {
    if (this.expiryTimeoutId !== void 0) {
      window.clearTimeout(this.expiryTimeoutId);
    }
    const now = (/* @__PURE__ */ new Date()).getTime();
    const expiresAt = new Date(session.expiresAt).getTime();
    const timeUntilExpiry = expiresAt - now;
    if (timeUntilExpiry <= 0) {
      this.sessionService.clearSession();
      return;
    }
    this.expiryTimeoutId = window.setTimeout(() => {
      this.sessionService.clearSession();
    }, timeUntilExpiry);
  }
  /**
   * Setup activity tracking to extend session on user interaction
   */
  setupActivityTracking() {
    const activityHandler = () => {
      const session = this.sessionService.getSession();
      if (!session) {
        return;
      }
      this.sessionService.updateActivity();
      const updatedSession = this.sessionService.getSession();
      if (updatedSession) {
        this.scheduleExpiryCheck(updatedSession);
      }
    };
    const events = ["click", "keydown", "scroll", "mousemove"];
    let activityDebounceTimeout;
    const debouncedHandler = () => {
      if (activityDebounceTimeout !== void 0) {
        window.clearTimeout(activityDebounceTimeout);
      }
      activityDebounceTimeout = window.setTimeout(() => {
        activityHandler();
      }, 5e3);
    };
    events.forEach((event) => {
      document.addEventListener(event, debouncedHandler, { passive: true });
    });
  }
  /**
   * Cleanup session coordinator
   */
  cleanup() {
    if (this.expiryTimeoutId !== void 0) {
      window.clearTimeout(this.expiryTimeoutId);
    }
  }
  /**
   * Get the session service instance
   */
  getSessionService() {
    return this.sessionService;
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$3 = globalThis, e$6 = t$3.ShadowRoot && (void 0 === t$3.ShadyCSS || t$3.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, s$2 = Symbol(), o$5 = /* @__PURE__ */ new WeakMap();
let n$3 = class n {
  constructor(t2, e2, o2) {
    if (this._$cssResult$ = true, o2 !== s$2) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t2, this.t = e2;
  }
  get styleSheet() {
    let t2 = this.o;
    const s2 = this.t;
    if (e$6 && void 0 === t2) {
      const e2 = void 0 !== s2 && 1 === s2.length;
      e2 && (t2 = o$5.get(s2)), void 0 === t2 && ((this.o = t2 = new CSSStyleSheet()).replaceSync(this.cssText), e2 && o$5.set(s2, t2));
    }
    return t2;
  }
  toString() {
    return this.cssText;
  }
};
const r$4 = (t2) => new n$3("string" == typeof t2 ? t2 : t2 + "", void 0, s$2), i$4 = (t2, ...e2) => {
  const o2 = 1 === t2.length ? t2[0] : e2.reduce((e3, s2, o3) => e3 + ((t3) => {
    if (true === t3._$cssResult$) return t3.cssText;
    if ("number" == typeof t3) return t3;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t3 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s2) + t2[o3 + 1], t2[0]);
  return new n$3(o2, t2, s$2);
}, S$1 = (s2, o2) => {
  if (e$6) s2.adoptedStyleSheets = o2.map((t2) => t2 instanceof CSSStyleSheet ? t2 : t2.styleSheet);
  else for (const e2 of o2) {
    const o3 = document.createElement("style"), n3 = t$3.litNonce;
    void 0 !== n3 && o3.setAttribute("nonce", n3), o3.textContent = e2.cssText, s2.appendChild(o3);
  }
}, c$2 = e$6 ? (t2) => t2 : (t2) => t2 instanceof CSSStyleSheet ? ((t3) => {
  let e2 = "";
  for (const s2 of t3.cssRules) e2 += s2.cssText;
  return r$4(e2);
})(t2) : t2;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: i$3, defineProperty: e$5, getOwnPropertyDescriptor: h$1, getOwnPropertyNames: r$3, getOwnPropertySymbols: o$4, getPrototypeOf: n$2 } = Object, a$1 = globalThis, c$1 = a$1.trustedTypes, l$1 = c$1 ? c$1.emptyScript : "", p$1 = a$1.reactiveElementPolyfillSupport, d$1 = (t2, s2) => t2, u$1 = { toAttribute(t2, s2) {
  switch (s2) {
    case Boolean:
      t2 = t2 ? l$1 : null;
      break;
    case Object:
    case Array:
      t2 = null == t2 ? t2 : JSON.stringify(t2);
  }
  return t2;
}, fromAttribute(t2, s2) {
  let i3 = t2;
  switch (s2) {
    case Boolean:
      i3 = null !== t2;
      break;
    case Number:
      i3 = null === t2 ? null : Number(t2);
      break;
    case Object:
    case Array:
      try {
        i3 = JSON.parse(t2);
      } catch (t3) {
        i3 = null;
      }
  }
  return i3;
} }, f$1 = (t2, s2) => !i$3(t2, s2), b = { attribute: true, type: String, converter: u$1, reflect: false, useDefault: false, hasChanged: f$1 };
Symbol.metadata ??= Symbol("metadata"), a$1.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let y$1 = class y extends HTMLElement {
  static addInitializer(t2) {
    this._$Ei(), (this.l ??= []).push(t2);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t2, s2 = b) {
    if (s2.state && (s2.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t2) && ((s2 = Object.create(s2)).wrapped = true), this.elementProperties.set(t2, s2), !s2.noAccessor) {
      const i3 = Symbol(), h2 = this.getPropertyDescriptor(t2, i3, s2);
      void 0 !== h2 && e$5(this.prototype, t2, h2);
    }
  }
  static getPropertyDescriptor(t2, s2, i3) {
    const { get: e2, set: r2 } = h$1(this.prototype, t2) ?? { get() {
      return this[s2];
    }, set(t3) {
      this[s2] = t3;
    } };
    return { get: e2, set(s3) {
      const h2 = e2?.call(this);
      r2?.call(this, s3), this.requestUpdate(t2, h2, i3);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t2) {
    return this.elementProperties.get(t2) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d$1("elementProperties"))) return;
    const t2 = n$2(this);
    t2.finalize(), void 0 !== t2.l && (this.l = [...t2.l]), this.elementProperties = new Map(t2.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d$1("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d$1("properties"))) {
      const t3 = this.properties, s2 = [...r$3(t3), ...o$4(t3)];
      for (const i3 of s2) this.createProperty(i3, t3[i3]);
    }
    const t2 = this[Symbol.metadata];
    if (null !== t2) {
      const s2 = litPropertyMetadata.get(t2);
      if (void 0 !== s2) for (const [t3, i3] of s2) this.elementProperties.set(t3, i3);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t3, s2] of this.elementProperties) {
      const i3 = this._$Eu(t3, s2);
      void 0 !== i3 && this._$Eh.set(i3, t3);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s2) {
    const i3 = [];
    if (Array.isArray(s2)) {
      const e2 = new Set(s2.flat(1 / 0).reverse());
      for (const s3 of e2) i3.unshift(c$2(s3));
    } else void 0 !== s2 && i3.push(c$2(s2));
    return i3;
  }
  static _$Eu(t2, s2) {
    const i3 = s2.attribute;
    return false === i3 ? void 0 : "string" == typeof i3 ? i3 : "string" == typeof t2 ? t2.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t2) => this.enableUpdating = t2), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t2) => t2(this));
  }
  addController(t2) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t2), void 0 !== this.renderRoot && this.isConnected && t2.hostConnected?.();
  }
  removeController(t2) {
    this._$EO?.delete(t2);
  }
  _$E_() {
    const t2 = /* @__PURE__ */ new Map(), s2 = this.constructor.elementProperties;
    for (const i3 of s2.keys()) this.hasOwnProperty(i3) && (t2.set(i3, this[i3]), delete this[i3]);
    t2.size > 0 && (this._$Ep = t2);
  }
  createRenderRoot() {
    const t2 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S$1(t2, this.constructor.elementStyles), t2;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t2) => t2.hostConnected?.());
  }
  enableUpdating(t2) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t2) => t2.hostDisconnected?.());
  }
  attributeChangedCallback(t2, s2, i3) {
    this._$AK(t2, i3);
  }
  _$ET(t2, s2) {
    const i3 = this.constructor.elementProperties.get(t2), e2 = this.constructor._$Eu(t2, i3);
    if (void 0 !== e2 && true === i3.reflect) {
      const h2 = (void 0 !== i3.converter?.toAttribute ? i3.converter : u$1).toAttribute(s2, i3.type);
      this._$Em = t2, null == h2 ? this.removeAttribute(e2) : this.setAttribute(e2, h2), this._$Em = null;
    }
  }
  _$AK(t2, s2) {
    const i3 = this.constructor, e2 = i3._$Eh.get(t2);
    if (void 0 !== e2 && this._$Em !== e2) {
      const t3 = i3.getPropertyOptions(e2), h2 = "function" == typeof t3.converter ? { fromAttribute: t3.converter } : void 0 !== t3.converter?.fromAttribute ? t3.converter : u$1;
      this._$Em = e2;
      const r2 = h2.fromAttribute(s2, t3.type);
      this[e2] = r2 ?? this._$Ej?.get(e2) ?? r2, this._$Em = null;
    }
  }
  requestUpdate(t2, s2, i3) {
    if (void 0 !== t2) {
      const e2 = this.constructor, h2 = this[t2];
      if (i3 ??= e2.getPropertyOptions(t2), !((i3.hasChanged ?? f$1)(h2, s2) || i3.useDefault && i3.reflect && h2 === this._$Ej?.get(t2) && !this.hasAttribute(e2._$Eu(t2, i3)))) return;
      this.C(t2, s2, i3);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t2, s2, { useDefault: i3, reflect: e2, wrapped: h2 }, r2) {
    i3 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t2) && (this._$Ej.set(t2, r2 ?? s2 ?? this[t2]), true !== h2 || void 0 !== r2) || (this._$AL.has(t2) || (this.hasUpdated || i3 || (s2 = void 0), this._$AL.set(t2, s2)), true === e2 && this._$Em !== t2 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t2));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t3) {
      Promise.reject(t3);
    }
    const t2 = this.scheduleUpdate();
    return null != t2 && await t2, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t4, s3] of this._$Ep) this[t4] = s3;
        this._$Ep = void 0;
      }
      const t3 = this.constructor.elementProperties;
      if (t3.size > 0) for (const [s3, i3] of t3) {
        const { wrapped: t4 } = i3, e2 = this[s3];
        true !== t4 || this._$AL.has(s3) || void 0 === e2 || this.C(s3, void 0, i3, e2);
      }
    }
    let t2 = false;
    const s2 = this._$AL;
    try {
      t2 = this.shouldUpdate(s2), t2 ? (this.willUpdate(s2), this._$EO?.forEach((t3) => t3.hostUpdate?.()), this.update(s2)) : this._$EM();
    } catch (s3) {
      throw t2 = false, this._$EM(), s3;
    }
    t2 && this._$AE(s2);
  }
  willUpdate(t2) {
  }
  _$AE(t2) {
    this._$EO?.forEach((t3) => t3.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t2)), this.updated(t2);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t2) {
    return true;
  }
  update(t2) {
    this._$Eq &&= this._$Eq.forEach((t3) => this._$ET(t3, this[t3])), this._$EM();
  }
  updated(t2) {
  }
  firstUpdated(t2) {
  }
};
y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$1("elementProperties")] = /* @__PURE__ */ new Map(), y$1[d$1("finalized")] = /* @__PURE__ */ new Map(), p$1?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$2 = globalThis, i$2 = t$2.trustedTypes, s$1 = i$2 ? i$2.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0, e$4 = "$lit$", h = `lit$${Math.random().toFixed(9).slice(2)}$`, o$3 = "?" + h, n$1 = `<${o$3}>`, r$2 = document, l = () => r$2.createComment(""), c = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2, a = Array.isArray, u = (t2) => a(t2) || "function" == typeof t2?.[Symbol.iterator], d = "[ 	\n\f\r]", f = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, v = /-->/g, _ = />/g, m = RegExp(`>|${d}(?:([^\\s"'>=/]+)(${d}*=${d}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), p = /'/g, g = /"/g, $ = /^(?:script|style|textarea|title)$/i, y2 = (t2) => (i3, ...s2) => ({ _$litType$: t2, strings: i3, values: s2 }), x = y2(1), T = Symbol.for("lit-noChange"), E = Symbol.for("lit-nothing"), A = /* @__PURE__ */ new WeakMap(), C = r$2.createTreeWalker(r$2, 129);
function P(t2, i3) {
  if (!a(t2) || !t2.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== s$1 ? s$1.createHTML(i3) : i3;
}
const V = (t2, i3) => {
  const s2 = t2.length - 1, o2 = [];
  let r2, l2 = 2 === i3 ? "<svg>" : 3 === i3 ? "<math>" : "", c2 = f;
  for (let i4 = 0; i4 < s2; i4++) {
    const s3 = t2[i4];
    let a2, u2, d2 = -1, y3 = 0;
    for (; y3 < s3.length && (c2.lastIndex = y3, u2 = c2.exec(s3), null !== u2); ) y3 = c2.lastIndex, c2 === f ? "!--" === u2[1] ? c2 = v : void 0 !== u2[1] ? c2 = _ : void 0 !== u2[2] ? ($.test(u2[2]) && (r2 = RegExp("</" + u2[2], "g")), c2 = m) : void 0 !== u2[3] && (c2 = m) : c2 === m ? ">" === u2[0] ? (c2 = r2 ?? f, d2 = -1) : void 0 === u2[1] ? d2 = -2 : (d2 = c2.lastIndex - u2[2].length, a2 = u2[1], c2 = void 0 === u2[3] ? m : '"' === u2[3] ? g : p) : c2 === g || c2 === p ? c2 = m : c2 === v || c2 === _ ? c2 = f : (c2 = m, r2 = void 0);
    const x2 = c2 === m && t2[i4 + 1].startsWith("/>") ? " " : "";
    l2 += c2 === f ? s3 + n$1 : d2 >= 0 ? (o2.push(a2), s3.slice(0, d2) + e$4 + s3.slice(d2) + h + x2) : s3 + h + (-2 === d2 ? i4 : x2);
  }
  return [P(t2, l2 + (t2[s2] || "<?>") + (2 === i3 ? "</svg>" : 3 === i3 ? "</math>" : "")), o2];
};
class N {
  constructor({ strings: t2, _$litType$: s2 }, n3) {
    let r2;
    this.parts = [];
    let c2 = 0, a2 = 0;
    const u2 = t2.length - 1, d2 = this.parts, [f2, v2] = V(t2, s2);
    if (this.el = N.createElement(f2, n3), C.currentNode = this.el.content, 2 === s2 || 3 === s2) {
      const t3 = this.el.content.firstChild;
      t3.replaceWith(...t3.childNodes);
    }
    for (; null !== (r2 = C.nextNode()) && d2.length < u2; ) {
      if (1 === r2.nodeType) {
        if (r2.hasAttributes()) for (const t3 of r2.getAttributeNames()) if (t3.endsWith(e$4)) {
          const i3 = v2[a2++], s3 = r2.getAttribute(t3).split(h), e2 = /([.?@])?(.*)/.exec(i3);
          d2.push({ type: 1, index: c2, name: e2[2], strings: s3, ctor: "." === e2[1] ? H : "?" === e2[1] ? I : "@" === e2[1] ? L : k }), r2.removeAttribute(t3);
        } else t3.startsWith(h) && (d2.push({ type: 6, index: c2 }), r2.removeAttribute(t3));
        if ($.test(r2.tagName)) {
          const t3 = r2.textContent.split(h), s3 = t3.length - 1;
          if (s3 > 0) {
            r2.textContent = i$2 ? i$2.emptyScript : "";
            for (let i3 = 0; i3 < s3; i3++) r2.append(t3[i3], l()), C.nextNode(), d2.push({ type: 2, index: ++c2 });
            r2.append(t3[s3], l());
          }
        }
      } else if (8 === r2.nodeType) if (r2.data === o$3) d2.push({ type: 2, index: c2 });
      else {
        let t3 = -1;
        for (; -1 !== (t3 = r2.data.indexOf(h, t3 + 1)); ) d2.push({ type: 7, index: c2 }), t3 += h.length - 1;
      }
      c2++;
    }
  }
  static createElement(t2, i3) {
    const s2 = r$2.createElement("template");
    return s2.innerHTML = t2, s2;
  }
}
function S(t2, i3, s2 = t2, e2) {
  if (i3 === T) return i3;
  let h2 = void 0 !== e2 ? s2._$Co?.[e2] : s2._$Cl;
  const o2 = c(i3) ? void 0 : i3._$litDirective$;
  return h2?.constructor !== o2 && (h2?._$AO?.(false), void 0 === o2 ? h2 = void 0 : (h2 = new o2(t2), h2._$AT(t2, s2, e2)), void 0 !== e2 ? (s2._$Co ??= [])[e2] = h2 : s2._$Cl = h2), void 0 !== h2 && (i3 = S(t2, h2._$AS(t2, i3.values), h2, e2)), i3;
}
class M {
  constructor(t2, i3) {
    this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i3;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t2) {
    const { el: { content: i3 }, parts: s2 } = this._$AD, e2 = (t2?.creationScope ?? r$2).importNode(i3, true);
    C.currentNode = e2;
    let h2 = C.nextNode(), o2 = 0, n3 = 0, l2 = s2[0];
    for (; void 0 !== l2; ) {
      if (o2 === l2.index) {
        let i4;
        2 === l2.type ? i4 = new R(h2, h2.nextSibling, this, t2) : 1 === l2.type ? i4 = new l2.ctor(h2, l2.name, l2.strings, this, t2) : 6 === l2.type && (i4 = new z(h2, this, t2)), this._$AV.push(i4), l2 = s2[++n3];
      }
      o2 !== l2?.index && (h2 = C.nextNode(), o2++);
    }
    return C.currentNode = r$2, e2;
  }
  p(t2) {
    let i3 = 0;
    for (const s2 of this._$AV) void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t2, s2, i3), i3 += s2.strings.length - 2) : s2._$AI(t2[i3])), i3++;
  }
}
class R {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t2, i3, s2, e2) {
    this.type = 2, this._$AH = E, this._$AN = void 0, this._$AA = t2, this._$AB = i3, this._$AM = s2, this.options = e2, this._$Cv = e2?.isConnected ?? true;
  }
  get parentNode() {
    let t2 = this._$AA.parentNode;
    const i3 = this._$AM;
    return void 0 !== i3 && 11 === t2?.nodeType && (t2 = i3.parentNode), t2;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t2, i3 = this) {
    t2 = S(this, t2, i3), c(t2) ? t2 === E || null == t2 || "" === t2 ? (this._$AH !== E && this._$AR(), this._$AH = E) : t2 !== this._$AH && t2 !== T && this._(t2) : void 0 !== t2._$litType$ ? this.$(t2) : void 0 !== t2.nodeType ? this.T(t2) : u(t2) ? this.k(t2) : this._(t2);
  }
  O(t2) {
    return this._$AA.parentNode.insertBefore(t2, this._$AB);
  }
  T(t2) {
    this._$AH !== t2 && (this._$AR(), this._$AH = this.O(t2));
  }
  _(t2) {
    this._$AH !== E && c(this._$AH) ? this._$AA.nextSibling.data = t2 : this.T(r$2.createTextNode(t2)), this._$AH = t2;
  }
  $(t2) {
    const { values: i3, _$litType$: s2 } = t2, e2 = "number" == typeof s2 ? this._$AC(t2) : (void 0 === s2.el && (s2.el = N.createElement(P(s2.h, s2.h[0]), this.options)), s2);
    if (this._$AH?._$AD === e2) this._$AH.p(i3);
    else {
      const t3 = new M(e2, this), s3 = t3.u(this.options);
      t3.p(i3), this.T(s3), this._$AH = t3;
    }
  }
  _$AC(t2) {
    let i3 = A.get(t2.strings);
    return void 0 === i3 && A.set(t2.strings, i3 = new N(t2)), i3;
  }
  k(t2) {
    a(this._$AH) || (this._$AH = [], this._$AR());
    const i3 = this._$AH;
    let s2, e2 = 0;
    for (const h2 of t2) e2 === i3.length ? i3.push(s2 = new R(this.O(l()), this.O(l()), this, this.options)) : s2 = i3[e2], s2._$AI(h2), e2++;
    e2 < i3.length && (this._$AR(s2 && s2._$AB.nextSibling, e2), i3.length = e2);
  }
  _$AR(t2 = this._$AA.nextSibling, i3) {
    for (this._$AP?.(false, true, i3); t2 !== this._$AB; ) {
      const i4 = t2.nextSibling;
      t2.remove(), t2 = i4;
    }
  }
  setConnected(t2) {
    void 0 === this._$AM && (this._$Cv = t2, this._$AP?.(t2));
  }
}
class k {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t2, i3, s2, e2, h2) {
    this.type = 1, this._$AH = E, this._$AN = void 0, this.element = t2, this.name = i3, this._$AM = e2, this.options = h2, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = E;
  }
  _$AI(t2, i3 = this, s2, e2) {
    const h2 = this.strings;
    let o2 = false;
    if (void 0 === h2) t2 = S(this, t2, i3, 0), o2 = !c(t2) || t2 !== this._$AH && t2 !== T, o2 && (this._$AH = t2);
    else {
      const e3 = t2;
      let n3, r2;
      for (t2 = h2[0], n3 = 0; n3 < h2.length - 1; n3++) r2 = S(this, e3[s2 + n3], i3, n3), r2 === T && (r2 = this._$AH[n3]), o2 ||= !c(r2) || r2 !== this._$AH[n3], r2 === E ? t2 = E : t2 !== E && (t2 += (r2 ?? "") + h2[n3 + 1]), this._$AH[n3] = r2;
    }
    o2 && !e2 && this.j(t2);
  }
  j(t2) {
    t2 === E ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t2 ?? "");
  }
}
class H extends k {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t2) {
    this.element[this.name] = t2 === E ? void 0 : t2;
  }
}
class I extends k {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t2) {
    this.element.toggleAttribute(this.name, !!t2 && t2 !== E);
  }
}
class L extends k {
  constructor(t2, i3, s2, e2, h2) {
    super(t2, i3, s2, e2, h2), this.type = 5;
  }
  _$AI(t2, i3 = this) {
    if ((t2 = S(this, t2, i3, 0) ?? E) === T) return;
    const s2 = this._$AH, e2 = t2 === E && s2 !== E || t2.capture !== s2.capture || t2.once !== s2.once || t2.passive !== s2.passive, h2 = t2 !== E && (s2 === E || e2);
    e2 && this.element.removeEventListener(this.name, this, s2), h2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
  }
  handleEvent(t2) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t2) : this._$AH.handleEvent(t2);
  }
}
class z {
  constructor(t2, i3, s2) {
    this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i3, this.options = s2;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2) {
    S(this, t2);
  }
}
const j = t$2.litHtmlPolyfillSupport;
j?.(N, R), (t$2.litHtmlVersions ??= []).push("3.3.1");
const B = (t2, i3, s2) => {
  const e2 = s2?.renderBefore ?? i3;
  let h2 = e2._$litPart$;
  if (void 0 === h2) {
    const t3 = s2?.renderBefore ?? null;
    e2._$litPart$ = h2 = new R(i3.insertBefore(l(), t3), t3, void 0, s2 ?? {});
  }
  return h2._$AI(t2), h2;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const s = globalThis;
let i$1 = class i extends y$1 {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t2 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t2.firstChild, t2;
  }
  update(t2) {
    const r2 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t2), this._$Do = B(r2, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return T;
  }
};
i$1._$litElement$ = true, i$1["finalized"] = true, s.litElementHydrateSupport?.({ LitElement: i$1 });
const o$2 = s.litElementPolyfillSupport;
o$2?.({ LitElement: i$1 });
(s.litElementVersions ??= []).push("4.2.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1 = (t2) => (e2, o2) => {
  void 0 !== o2 ? o2.addInitializer(() => {
    customElements.define(t2, e2);
  }) : customElements.define(t2, e2);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const o$1 = { attribute: true, type: String, converter: u$1, reflect: false, hasChanged: f$1 }, r$1 = (t2 = o$1, e2, r2) => {
  const { kind: n3, metadata: i3 } = r2;
  let s2 = globalThis.litPropertyMetadata.get(i3);
  if (void 0 === s2 && globalThis.litPropertyMetadata.set(i3, s2 = /* @__PURE__ */ new Map()), "setter" === n3 && ((t2 = Object.create(t2)).wrapped = true), s2.set(r2.name, t2), "accessor" === n3) {
    const { name: o2 } = r2;
    return { set(r3) {
      const n4 = e2.get.call(this);
      e2.set.call(this, r3), this.requestUpdate(o2, n4, t2);
    }, init(e3) {
      return void 0 !== e3 && this.C(o2, void 0, t2, e3), e3;
    } };
  }
  if ("setter" === n3) {
    const { name: o2 } = r2;
    return function(r3) {
      const n4 = this[o2];
      e2.call(this, r3), this.requestUpdate(o2, n4, t2);
    };
  }
  throw Error("Unsupported decorator location: " + n3);
};
function n2(t2) {
  return (e2, o2) => "object" == typeof o2 ? r$1(t2, e2, o2) : ((t3, e3, o3) => {
    const r2 = e3.hasOwnProperty(o3);
    return e3.constructor.createProperty(o3, t3), r2 ? Object.getOwnPropertyDescriptor(e3, o3) : void 0;
  })(t2, e2, o2);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function r(r2) {
  return n2({ ...r2, state: true, attribute: false });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e$3 = (e2, t2, c2) => (c2.configurable = true, c2.enumerable = true, Reflect.decorate && "object" != typeof t2 && Object.defineProperty(e2, t2, c2), c2);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function e$2(e2, r2) {
  return (n3, s2, i3) => {
    const o2 = (t2) => t2.renderRoot?.querySelector(e2) ?? null;
    return e$3(n3, s2, { get() {
      return o2(this);
    } });
  };
}
function validateStudentForm(name, serviceId, pin) {
  const errors = [];
  if (!name || name.trim() === "") {
    errors.push("Name required");
  }
  if (!serviceId) {
    errors.push("Service ID required");
  } else {
    const serviceIdRegex = /^[a-zA-Z0-9]{2,10}$/;
    if (!serviceIdRegex.test(serviceId)) {
      errors.push("Service ID must be 2-10 alphanumeric characters");
    }
  }
  if (!pin) {
    errors.push("PIN required");
  } else {
    const pinRegex = /^\d{4}$/;
    if (!pinRegex.test(pin)) {
      errors.push("PIN must be exactly 4 digits");
    }
  }
  return errors;
}
function sanitizePinInput(input) {
  return input.replace(/\D/g, "");
}
const DEFAULT_CONFIG = {
  statusPanelContainer: ".wh_top_menu_and_indexterms_link",
  titleSelector: ".wh_publication_title .title",
  instructorHash: ""
};
const CONFIG_IDS = {
  statusPanelContainer: "qd-status-container",
  titleSelector: "qd-title-selector",
  instructorHash: "qd-instructor-hash",
  dbName: "qd-db-name"
};
function readConfigElement(elementId, defaultValue) {
  const element = document.querySelector(`#${elementId}`);
  if (!element) {
    return defaultValue;
  }
  const value = element.textContent?.trim() || "";
  if (value === "") {
    warn(`Config element #${elementId} found but empty, using default: "${defaultValue}"`);
    return defaultValue;
  }
  return value;
}
function readRequiredConfigElement(elementId) {
  const element = document.querySelector(`#${elementId}`);
  if (!element) {
    const msg = `FATAL: Required config element #${elementId} not found in DOM. Processing stopped.`;
    console.error(msg);
    throw new Error(msg);
  }
  const value = element.textContent?.trim() || "";
  if (value === "") {
    const msg = `FATAL: Required config element #${elementId} is empty. Processing stopped.`;
    console.error(msg);
    throw new Error(msg);
  }
  return value;
}
function readDOMConfig() {
  const dbName = readRequiredConfigElement(CONFIG_IDS.dbName);
  const config = {
    statusPanelContainer: readConfigElement(
      CONFIG_IDS.statusPanelContainer,
      DEFAULT_CONFIG.statusPanelContainer
    ),
    titleSelector: readConfigElement(CONFIG_IDS.titleSelector, DEFAULT_CONFIG.titleSelector),
    instructorHash: readConfigElement(CONFIG_IDS.instructorHash, DEFAULT_CONFIG.instructorHash),
    dbName
  };
  return config;
}
function needsMigration(record) {
  return record.schema < SCHEMA_VERSION;
}
function hasPinSet(record) {
  return Boolean(record.pinHash && record.pinHash.length > 0);
}
function completePinSetup(record, pinHash) {
  return {
    ...record,
    schema: SCHEMA_VERSION,
    pinHash,
    pinCreatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function resetPin(record) {
  return {
    ...record,
    pinHash: "",
    pinResetAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b2) => b2.toString(16).padStart(2, "0")).join("");
}
async function verifyPin(pin, storedHash) {
  const inputHash = await hashPin(pin);
  return constantTimeCompare$1(inputHash, storedHash);
}
function constantTimeCompare$1(a2, b2) {
  if (a2.length !== b2.length) {
    return false;
  }
  let result = 0;
  for (let i3 = 0; i3 < a2.length; i3++) {
    result |= a2.charCodeAt(i3) ^ b2.charCodeAt(i3);
  }
  return result === 0;
}
function getAttemptKey(serviceId) {
  return `${STORAGE_KEYS.PIN_ATTEMPTS}:${serviceId}`;
}
function getAttemptState(serviceId) {
  const key = getAttemptKey(serviceId);
  const data = sessionStorage.getItem(key);
  if (!data) {
    return null;
  }
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
function checkLockout(serviceId) {
  const state2 = getAttemptState(serviceId);
  if (!state2 || !state2.lockoutUntil) {
    return { isLocked: false, remainingMs: 0 };
  }
  const lockoutTime = new Date(state2.lockoutUntil).getTime();
  const now = Date.now();
  if (lockoutTime > now) {
    return { isLocked: true, remainingMs: lockoutTime - now };
  }
  clearAttemptState(serviceId);
  return { isLocked: false, remainingMs: 0 };
}
function recordFailedAttempt(serviceId) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let state2 = getAttemptState(serviceId);
  if (!state2) {
    state2 = {
      serviceId,
      attempts: 0,
      lockoutUntil: null,
      lastAttempt: now
    };
  }
  state2.attempts += 1;
  state2.lastAttempt = now;
  if (state2.attempts >= PIN_CONSTANTS.MAX_ATTEMPTS) {
    const lockoutTime = new Date(Date.now() + PIN_CONSTANTS.LOCKOUT_MS);
    state2.lockoutUntil = lockoutTime.toISOString();
    warn(
      `PIN lockout triggered for ${maskServiceId(serviceId)} after ${state2.attempts} failed attempts`
    );
  } else {
    info(
      `Failed PIN attempt ${state2.attempts}/${PIN_CONSTANTS.MAX_ATTEMPTS} for ${maskServiceId(serviceId)}`
    );
  }
  const key = getAttemptKey(serviceId);
  sessionStorage.setItem(key, JSON.stringify(state2));
  return state2;
}
function clearAttemptState(serviceId) {
  const state2 = getAttemptState(serviceId);
  if (state2 && state2.attempts > 0) {
    info(
      `Cleared ${state2.attempts} failed PIN attempts for ${maskServiceId(serviceId)} on successful login`
    );
  }
  const key = getAttemptKey(serviceId);
  sessionStorage.removeItem(key);
}
function getRemainingAttempts(serviceId) {
  const state2 = getAttemptState(serviceId);
  if (!state2) {
    return PIN_CONSTANTS.MAX_ATTEMPTS;
  }
  const lockout = checkLockout(serviceId);
  if (lockout.isLocked) {
    return 0;
  }
  return Math.max(0, PIN_CONSTANTS.MAX_ATTEMPTS - state2.attempts);
}
var __getOwnPropDesc$f = Object.getOwnPropertyDescriptor;
var __decorateClass$f = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$f(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = decorator(result) || result;
  return result;
};
let QdBuildInfo = class extends i$1 {
  render() {
    const buildDate = "28/Nov/2025";
    return x`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${buildDate}</span>
      </div>
    `;
  }
};
QdBuildInfo.styles = i$4`
    :host {
      display: inline-block;
      position: relative;
    }

    .info-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #6c757d;
      color: white;
      font-size: 10px;
      font-weight: bold;
      font-style: italic;
      font-family: Georgia, serif;
      cursor: help;
      user-select: none;
    }

    .info-icon:hover {
      background: #5a6268;
    }

    .tooltip {
      position: absolute;
      top: 50%;
      right: 100%;
      transform: translateY(-50%);
      margin-right: 8px;
      padding: 8px 12px;
      background: #333;
      color: white;
      font-size: 11px;
      font-style: normal;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.2s,
        visibility 0.2s;
      z-index: 1000;
      pointer-events: none;
    }

    .tooltip::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 100%;
      transform: translateY(-50%);
      border: 5px solid transparent;
      border-left-color: #333;
    }

    .info-icon:hover + .tooltip,
    .info-icon:focus + .tooltip {
      opacity: 1;
      visibility: visible;
    }

    .tooltip-line {
      display: block;
      line-height: 1.4;
    }
  `;
QdBuildInfo = __decorateClass$f([
  t$1("qd-build-info")
], QdBuildInfo);
var __defProp$e = Object.defineProperty;
var __getOwnPropDesc$e = Object.getOwnPropertyDescriptor;
var __decorateClass$e = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$e(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$e(target, key, result);
  return result;
};
const MODAL_STATE_KEY = "__qdModalCurrentRef__";
function getCurrentModal() {
  return globalThis[MODAL_STATE_KEY] ?? null;
}
function setCurrentModal(modal) {
  globalThis[MODAL_STATE_KEY] = modal;
}
let QdModal = class extends i$1 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.closable = true;
    this.previouslyFocused = null;
    this.originalParent = null;
    this.originalNextSibling = null;
    this.isInBody = false;
    this.handleKeyDown = (event) => {
      if (event.key === "Escape" && this.open && this.closable) {
        this.emitCloseEvent();
        this.close();
      }
    };
    this.handleBackdropClick = () => {
      if (this.closable) {
        this.emitCloseEvent();
        this.close();
      }
    };
    this.handleCloseClick = () => {
      this.emitCloseEvent();
      this.close();
    };
    this.stopPropagation = (event) => {
      event.stopPropagation();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleKeyDown);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleKeyDown);
    if (getCurrentModal() === this && !this.isInBody) {
      setCurrentModal(null);
    }
  }
  updated(changedProperties) {
    if (changedProperties.has("open")) {
      if (this.open) {
        this.handleOpen();
      } else {
        this.handleClose();
      }
    }
  }
  /**
   * Move this element to document.body to escape stacking contexts
   */
  moveToBody() {
    if (this.isInBody) return;
    this.originalParent = this.parentNode;
    this.originalNextSibling = this.nextSibling;
    this.isInBody = true;
    document.body.appendChild(this);
  }
  /**
   * Restore this element to its original position in the DOM
   */
  restorePosition() {
    if (!this.isInBody || !this.originalParent) return;
    if (this.originalNextSibling) {
      this.originalParent.insertBefore(this, this.originalNextSibling);
    } else {
      this.originalParent.appendChild(this);
    }
    this.originalParent = null;
    this.originalNextSibling = null;
    this.isInBody = false;
  }
  render() {
    return x`
      <div class="backdrop" @click=${this.handleBackdropClick}>
        <div class="content" role="dialog" aria-modal="true" @click=${this.stopPropagation}>
          <div class="header">
            <span class="header-title"><slot name="header"></slot></span>
            ${this.closable ? x`<button
                  type="button"
                  class="close-button"
                  @click=${this.handleCloseClick}
                  aria-label="Close"
                  title="Close"
                >
                  ×
                </button>` : ""}
          </div>
          <div class="body">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
  /**
   * Open the modal
   */
  show() {
    this.open = true;
  }
  /**
   * Close the modal
   */
  close() {
    this.open = false;
  }
  /**
   * Handle modal opening
   */
  handleOpen() {
    const currentModal = getCurrentModal();
    if (currentModal && currentModal !== this) {
      currentModal.close();
    }
    setCurrentModal(this);
    this.previouslyFocused = document.activeElement;
    this.moveToBody();
    requestAnimationFrame(() => {
      this.focusFirstElement();
    });
  }
  /**
   * Handle modal closing
   */
  handleClose() {
    if (getCurrentModal() === this) {
      setCurrentModal(null);
    }
    this.restorePosition();
    if (this.previouslyFocused instanceof HTMLElement) {
      this.previouslyFocused.focus();
    }
  }
  /**
   * Focus the first focusable element in the modal
   */
  focusFirstElement() {
    const content = this.shadowRoot?.querySelector(".content");
    if (!content) return;
    const slot = this.shadowRoot?.querySelector("slot:not([name])");
    if (slot) {
      const assignedElements = slot.assignedElements({ flatten: true });
      for (const el of assignedElements) {
        const focusable = el.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
          focusable.focus();
          return;
        }
        if (el instanceof HTMLElement && el.matches('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')) {
          el.focus();
          return;
        }
      }
    }
    const closeBtn = this.shadowRoot?.querySelector(".close-button");
    if (closeBtn) {
      closeBtn.focus();
    }
  }
  /**
   * Emit close event
   */
  emitCloseEvent() {
    const event = new CustomEvent("qd:modal-close", {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
};
QdModal.styles = i$4`
    :host {
      display: contents;
    }

    .backdrop {
      display: none;
    }

    :host([open]) .backdrop {
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      animation: qd-modal-fadeIn 0.15s ease-out;
    }

    @keyframes qd-modal-fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      animation: qd-modal-slideIn 0.15s ease-out;
    }

    @keyframes qd-modal-slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      font-weight: 600;
      font-size: 18px;
    }

    .header ::slotted(*) {
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 20px;
      color: #666;
      line-height: 1;
      border-radius: 4px;
      transition:
        background-color 0.2s,
        color 0.2s;
      margin-left: auto;
    }

    .close-button:hover {
      background: #f0f0f0;
      color: #333;
    }

    .close-button:focus {
      outline: 2px solid #0066cc;
      outline-offset: 2px;
    }

    .body {
      padding: 20px;
    }
  `;
__decorateClass$e([
  n2({ type: Boolean, reflect: true })
], QdModal.prototype, "open", 2);
__decorateClass$e([
  n2({ type: Boolean })
], QdModal.prototype, "closable", 2);
QdModal = __decorateClass$e([
  t$1("qd-modal")
], QdModal);
var __defProp$d = Object.defineProperty;
var __getOwnPropDesc$d = Object.getOwnPropertyDescriptor;
var __decorateClass$d = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$d(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$d(target, key, result);
  return result;
};
let QdPasswordModal = class extends i$1 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.title = "Enter Password";
    this.error = "";
    this.password = "";
    this.handleModalClose = () => {
      this.close();
    };
    this.handleInput = (e2) => {
      const input = e2.target;
      this.password = input.value;
      if (this.error) {
        this.error = "";
      }
    };
    this.handleSubmit = (e2) => {
      e2.preventDefault();
      if (!this.password.trim()) {
        return;
      }
      this.dispatchEvent(
        new CustomEvent("qd:password-submit", {
          detail: { password: this.password },
          bubbles: true,
          composed: true
        })
      );
    };
    this.handleCancel = () => {
      this.close();
    };
  }
  /**
   * Show the modal
   */
  show() {
    this.open = true;
    this.password = "";
    this.error = "";
  }
  /**
   * Close the modal
   */
  close() {
    this.open = false;
    this.password = "";
    this.error = "";
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }
  /**
   * Focus password input when modal opens
   */
  updated(changedProps) {
    if (changedProps.has("open") && this.open) {
      this.password = "";
      void this.updateComplete.then(() => {
        this.passwordInput?.focus();
      });
    }
  }
  render() {
    return x`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        ${this.open ? x`
              <form class="password-form" @submit=${this.handleSubmit}>
                <div class="form-field">
                  <label for="password-input">Password</label>
                  <input
                    id="password-input"
                    type="password"
                    placeholder="Password"
                    .value=${this.password}
                    @input=${this.handleInput}
                    required
                    aria-label="Enter your password"
                  />
                </div>

                ${this.error ? x`<div class="error-message">${this.error}</div>` : ""}

                <div class="button-row">
                  <button type="button" @click=${this.handleCancel}>Cancel</button>
                  <button type="submit">Login</button>
                </div>
              </form>
            ` : E}
      </qd-modal>
    `;
  }
};
QdPasswordModal.styles = i$4`
    :host {
      display: contents;
    }

    .password-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    label {
      font-size: 13px;
      font-weight: 500;
      color: #333;
    }

    input[type='password'] {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
    }

    input[type='password']:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .error-message {
      color: #d32f2f;
      font-size: 12px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
      border-left: 3px solid #d32f2f;
    }

    .button-row {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button[type='submit'] {
      background: #0066cc;
      color: white;
    }

    button[type='submit']:hover {
      background: #0052a3;
    }

    button[type='button'] {
      background: #e0e0e0;
      color: #333;
    }

    button[type='button']:hover {
      background: #d0d0d0;
    }
  `;
__decorateClass$d([
  n2({ type: Boolean, reflect: true })
], QdPasswordModal.prototype, "open", 2);
__decorateClass$d([
  n2({ type: String })
], QdPasswordModal.prototype, "title", 2);
__decorateClass$d([
  n2({ type: String })
], QdPasswordModal.prototype, "error", 2);
__decorateClass$d([
  r()
], QdPasswordModal.prototype, "password", 2);
__decorateClass$d([
  e$2('input[type="password"]')
], QdPasswordModal.prototype, "passwordInput", 2);
QdPasswordModal = __decorateClass$d([
  t$1("qd-password-modal")
], QdPasswordModal);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t = { CHILD: 2 }, e$1 = (t2) => (...e2) => ({ _$litDirective$: t2, values: e2 });
class i2 {
  constructor(t2) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t2, e2, i3) {
    this._$Ct = t2, this._$AM = e2, this._$Ci = i3;
  }
  _$AS(t2, e2) {
    return this.update(t2, e2);
  }
  update(t2, e2) {
    return this.render(...e2);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class e extends i2 {
  constructor(i3) {
    if (super(i3), this.it = E, i3.type !== t.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
  }
  render(r2) {
    if (r2 === E || null == r2) return this._t = void 0, this.it = r2;
    if (r2 === T) return r2;
    if ("string" != typeof r2) throw Error(this.constructor.directiveName + "() called with a non-string value");
    if (r2 === this.it) return this._t;
    this.it = r2;
    const s2 = [r2];
    return s2.raw = s2, this._t = { _$litType$: this.constructor.resultType, strings: s2, values: [] };
  }
}
e.directiveName = "unsafeHTML", e.resultType = 1;
const o = e$1(e);
var __defProp$c = Object.defineProperty;
var __getOwnPropDesc$c = Object.getOwnPropertyDescriptor;
var __decorateClass$c = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$c(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$c(target, key, result);
  return result;
};
let QdConfirmDialog = class extends i$1 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.title = "Confirm";
    this.message = "";
    this.confirmText = "Confirm";
    this.cancelText = "Cancel";
    this.destructive = false;
    this.handleModalClose = () => {
      this.close();
      this.dispatchEvent(
        new CustomEvent("qd:cancel", {
          bubbles: true,
          composed: true
        })
      );
    };
    this.handleConfirm = () => {
      this.close();
      this.dispatchEvent(
        new CustomEvent("qd:confirm", {
          bubbles: true,
          composed: true
        })
      );
    };
    this.handleCancel = () => {
      this.close();
      this.dispatchEvent(
        new CustomEvent("qd:cancel", {
          bubbles: true,
          composed: true
        })
      );
    };
  }
  /**
   * Show the dialog
   */
  show() {
    this.open = true;
  }
  /**
   * Close the dialog
   */
  close() {
    this.open = false;
  }
  render() {
    return x`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <div class="confirm-content">
          <div class="message">${o(this.message)}</div>

          <div class="button-row">
            <button type="button" class="cancel-btn" @click=${this.handleCancel}>
              ${this.cancelText}
            </button>
            <button
              type="button"
              class="confirm-btn ${this.destructive ? "destructive" : ""}"
              @click=${this.handleConfirm}
            >
              ${this.confirmText}
            </button>
          </div>
        </div>
      </qd-modal>
    `;
  }
};
QdConfirmDialog.styles = i$4`
    :host {
      display: contents;
    }

    .confirm-content {
      padding: 8px 0;
    }

    .message {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .button-row {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .cancel-btn {
      background: #e0e0e0;
      color: #333;
    }

    .cancel-btn:hover {
      background: #d0d0d0;
    }

    .confirm-btn {
      background: #0066cc;
      color: white;
    }

    .confirm-btn:hover {
      background: #0052a3;
    }

    .confirm-btn.destructive {
      background: #d32f2f;
    }

    .confirm-btn.destructive:hover {
      background: #b71c1c;
    }
  `;
__decorateClass$c([
  n2({ type: Boolean, reflect: true })
], QdConfirmDialog.prototype, "open", 2);
__decorateClass$c([
  n2({ type: String })
], QdConfirmDialog.prototype, "title", 2);
__decorateClass$c([
  n2({ type: String })
], QdConfirmDialog.prototype, "message", 2);
__decorateClass$c([
  n2({ type: String })
], QdConfirmDialog.prototype, "confirmText", 2);
__decorateClass$c([
  n2({ type: String })
], QdConfirmDialog.prototype, "cancelText", 2);
__decorateClass$c([
  n2({ type: Boolean })
], QdConfirmDialog.prototype, "destructive", 2);
QdConfirmDialog = __decorateClass$c([
  t$1("qd-confirm-dialog")
], QdConfirmDialog);
var __defProp$b = Object.defineProperty;
var __getOwnPropDesc$b = Object.getOwnPropertyDescriptor;
var __decorateClass$b = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$b(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$b(target, key, result);
  return result;
};
let QdHelpTrigger = class extends i$1 {
  constructor() {
    super(...arguments);
    this.panelType = "login";
    this.handleClick = () => {
      this.dispatchEvent(
        new CustomEvent("qd:help-open", {
          detail: { panelType: this.panelType },
          bubbles: true,
          composed: true
        })
      );
    };
  }
  render() {
    return x`
      <button class="help-icon" @click=${this.handleClick} aria-label="Help" title="Help">?</button>
    `;
  }
};
QdHelpTrigger.styles = i$4`
    :host {
      display: inline-block;
    }

    .help-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #0066cc;
      color: white;
      font-size: 12px;
      font-weight: bold;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      cursor: pointer;
      border: none;
      padding: 0;
      transition: background 0.15s ease;
    }

    .help-icon:hover {
      background: #0052a3;
    }

    .help-icon:focus {
      outline: 2px solid #0066cc;
      outline-offset: 2px;
    }

    .help-icon:active {
      background: #004080;
    }
  `;
__decorateClass$b([
  n2({ type: String })
], QdHelpTrigger.prototype, "panelType", 2);
QdHelpTrigger = __decorateClass$b([
  t$1("qd-help-trigger")
], QdHelpTrigger);
var __defProp$a = Object.defineProperty;
var __getOwnPropDesc$a = Object.getOwnPropertyDescriptor;
var __decorateClass$a = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$a(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$a(target, key, result);
  return result;
};
const HELP_POPUP_STYLES = `
.qd-help-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,-apple-system,sans-serif}
.qd-help-content{background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:450px;max-height:80vh;overflow:auto}
.qd-help-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee}
.qd-help-title{font-weight:600;font-size:18px;color:#333;margin:0}
.qd-help-close{background:none;border:none;font-size:24px;color:#666;cursor:pointer;padding:0;line-height:1;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px}
.qd-help-close:hover{background:#f0f0f0;color:#333}
.qd-help-close:focus{outline:2px solid #0066cc;outline-offset:2px}
.qd-help-body{padding:20px;line-height:1.6;color:#444}
.qd-help-body h3{margin-top:0;margin-bottom:12px;color:#333;font-size:16px}
.qd-help-body p{margin:0 0 12px 0}
.qd-help-body p:last-child{margin-bottom:0}
.qd-help-body strong{color:#333}`;
let QdHelpPopup = class extends i$1 {
  constructor() {
    super(...arguments);
    this.portalElement = null;
    this.previouslyFocused = null;
    this.open = false;
    this.title = "Help";
    this.content = "";
    this._isOpen = false;
    this.handleKeyDown = (event) => {
      if (event.key === "Escape" && this._isOpen) {
        this.close();
      }
    };
    this.handleBackdropClick = () => {
      this.close();
    };
    this.handleCloseClick = () => {
      this.close();
    };
    this.stopPropagation = (event) => {
      event.stopPropagation();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleKeyDown);
    this.ensureStyles();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleKeyDown);
    this.removePortal();
  }
  updated(changedProperties) {
    if (changedProperties.has("open")) {
      if (this.open && !this._isOpen) {
        this.handleOpen();
      } else if (!this.open && this._isOpen) {
        this.handleClose();
      }
    }
  }
  /**
   * Ensure help popup styles are added to document head (once)
   */
  ensureStyles() {
    if (!QdHelpPopup.styleElement) {
      QdHelpPopup.styleElement = document.createElement("style");
      QdHelpPopup.styleElement.textContent = HELP_POPUP_STYLES;
      document.head.appendChild(QdHelpPopup.styleElement);
    }
  }
  /**
   * Create and show the portal
   */
  createPortal() {
    this.removePortal();
    this.portalElement = document.createElement("div");
    this.portalElement.className = "qd-help-backdrop";
    this.portalElement.addEventListener("click", this.handleBackdropClick);
    const contentEl = document.createElement("div");
    contentEl.className = "qd-help-content";
    contentEl.setAttribute("role", "dialog");
    contentEl.setAttribute("aria-modal", "true");
    contentEl.setAttribute("aria-labelledby", "qd-help-title");
    contentEl.addEventListener("click", this.stopPropagation);
    const headerEl = document.createElement("div");
    headerEl.className = "qd-help-header";
    const titleEl = document.createElement("h2");
    titleEl.className = "qd-help-title";
    titleEl.id = "qd-help-title";
    titleEl.textContent = this.title;
    const closeBtn = document.createElement("button");
    closeBtn.className = "qd-help-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = "×";
    closeBtn.addEventListener("click", this.handleCloseClick);
    headerEl.appendChild(titleEl);
    headerEl.appendChild(closeBtn);
    const bodyEl = document.createElement("div");
    bodyEl.className = "qd-help-body";
    bodyEl.innerHTML = this.content;
    contentEl.appendChild(headerEl);
    contentEl.appendChild(bodyEl);
    this.portalElement.appendChild(contentEl);
    document.body.appendChild(this.portalElement);
    requestAnimationFrame(() => {
      closeBtn.focus();
    });
  }
  /**
   * Remove portal from DOM
   */
  removePortal() {
    if (this.portalElement) {
      this.portalElement.remove();
      this.portalElement = null;
    }
  }
  /**
   * Handle opening
   */
  handleOpen() {
    this._isOpen = true;
    this.previouslyFocused = document.activeElement;
    this.createPortal();
  }
  /**
   * Handle closing
   */
  handleClose() {
    this._isOpen = false;
    this.removePortal();
    if (this.previouslyFocused instanceof HTMLElement) {
      this.previouslyFocused.focus();
    }
  }
  /**
   * Close the popup and emit event
   */
  close() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("qd:modal-close", {
        bubbles: true,
        composed: true
      })
    );
  }
  render() {
    return E;
  }
};
QdHelpPopup.styleElement = null;
__decorateClass$a([
  n2({ type: Boolean, reflect: true })
], QdHelpPopup.prototype, "open", 2);
__decorateClass$a([
  n2({ type: String })
], QdHelpPopup.prototype, "title", 2);
__decorateClass$a([
  n2({ type: String })
], QdHelpPopup.prototype, "content", 2);
__decorateClass$a([
  r()
], QdHelpPopup.prototype, "_isOpen", 2);
QdHelpPopup = __decorateClass$a([
  t$1("qd-help-popup")
], QdHelpPopup);
const STORE_STUDENTS = "students";
async function migrateObfuscation(dbName, direction, options) {
  const startTime = performance.now();
  const result = {
    migrated: 0,
    skipped: 0,
    errors: [],
    durationMs: 0
  };
  const { releaseId, dryRun = false } = options;
  const obfKey = deriveKey(releaseId);
  const db = await openDatabase(dbName);
  try {
    const allRecords = await getAllRawRecords(db);
    for (const { key, value } of allRecords) {
      try {
        const currentlyObfuscated = isObfuscated(value);
        if (direction === "encrypt") {
          if (currentlyObfuscated) {
            result.skipped++;
            continue;
          }
          const plainRecord = value;
          const obfuscatedValue = encode(plainRecord, obfKey);
          if (!dryRun) {
            await putRawRecord(db, key, obfuscatedValue);
          }
          result.migrated++;
        } else {
          if (!currentlyObfuscated) {
            result.skipped++;
            continue;
          }
          const plainRecord = decode(value, obfKey);
          if (!dryRun) {
            await putRawRecord(db, key, plainRecord);
          }
          result.migrated++;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        result.errors.push({ key, error: errorMessage });
        warn(`Migration error for key ${key}: ${errorMessage}`);
      }
    }
  } finally {
    db.close();
  }
  result.durationMs = performance.now() - startTime;
  info(
    `Migration complete: migrated=${result.migrated}, skipped=${result.skipped}, errors=${result.errors.length}, duration=${result.durationMs.toFixed(2)}ms`
  );
  return result;
}
async function openDatabase(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      error(`Failed to open database: ${request.error?.message}`);
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };
  });
}
async function getAllRawRecords(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_STUDENTS, "readonly");
    const store = transaction.objectStore(STORE_STUDENTS);
    const request = store.openCursor();
    const records = [];
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const keyStr = typeof cursor.key === "string" ? cursor.key : JSON.stringify(cursor.key);
        records.push({ key: keyStr, value: cursor.value });
        cursor.continue();
      } else {
        resolve(records);
      }
    };
    request.onerror = () => {
      reject(new Error(`Failed to read records: ${request.error?.message}`));
    };
  });
}
async function putRawRecord(db, key, value) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_STUDENTS, "readwrite");
    const store = transaction.objectStore(STORE_STUDENTS);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      reject(new Error(`Failed to save record: ${request.error?.message}`));
    };
  });
}
var __defProp$9 = Object.defineProperty;
var __getOwnPropDesc$9 = Object.getOwnPropertyDescriptor;
var __decorateClass$9 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$9(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$9(target, key, result);
  return result;
};
let QdMigrationDialog = class extends i$1 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.expected = "plain";
    this.found = "plain";
    this.dbName = "";
    this.releaseId = "";
    this.dialogState = "password";
    this.password = "";
    this.error = "";
    this.migrationResult = null;
    this.handleModalClose = () => {
      this.dispatchEvent(
        new CustomEvent("qd:migration-cancel", {
          bubbles: true,
          composed: true
        })
      );
    };
    this.handleInput = (e2) => {
      const input = e2.target;
      this.password = input.value;
      if (this.error) {
        this.error = "";
      }
    };
    this.handleSubmit = async (e2) => {
      e2.preventDefault();
      if (!this.password.trim()) {
        return;
      }
      const isValid = await this.validatePassword(this.password);
      if (!isValid) {
        if (!this.error) {
          this.error = "Incorrect instructor password";
        }
        return;
      }
      await this.runMigration();
    };
    this.handleContinue = () => {
      this.dispatchEvent(
        new CustomEvent("qd:migration-complete", {
          detail: this.migrationResult,
          bubbles: true,
          composed: true
        })
      );
    };
    this.handleCancel = () => {
      this.dispatchEvent(
        new CustomEvent("qd:migration-cancel", {
          bubbles: true,
          composed: true
        })
      );
    };
  }
  /**
   * Reset state when dialog opens
   */
  updated(changedProps) {
    if (changedProps.has("open") && this.open) {
      this.dialogState = "password";
      this.password = "";
      this.error = "";
      this.migrationResult = null;
      void this.updateComplete.then(() => {
        this.passwordInput?.focus();
      });
    }
  }
  /**
   * Validate instructor password against configured hash
   */
  async validatePassword(password) {
    const hashElement = document.getElementById(CONFIG_IDS.instructorHash);
    const expectedHash = hashElement?.textContent?.trim();
    if (!expectedHash) {
      this.error = "Instructor password not configured";
      return false;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const actualHash = hashArray.map((b2) => b2.toString(16).padStart(2, "0")).join("").substring(0, 12);
    return actualHash === expectedHash;
  }
  /**
   * Run the migration
   */
  async runMigration() {
    this.dialogState = "migrating";
    this.error = "";
    try {
      const direction = ENCRYPT_STORAGE ? "encrypt" : "decrypt";
      const result = await migrateObfuscation(this.dbName, direction, {
        releaseId: this.releaseId,
        dryRun: false
      });
      if (result.errors.length > 0) {
        this.dialogState = "error";
        this.error = `Migration completed with ${result.errors.length} error(s). Some records may not have been migrated.`;
        return;
      }
      this.migrationResult = {
        migrated: result.migrated,
        skipped: result.skipped
      };
      this.dialogState = "success";
    } catch (err) {
      this.dialogState = "error";
      this.error = `Migration failed: ${err instanceof Error ? err.message : "Unknown error"}`;
    }
  }
  render() {
    return x`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Database Migration Required</span>

        ${this.open ? this.renderContent() : E}
      </qd-modal>
    `;
  }
  renderContent() {
    switch (this.dialogState) {
      case "password":
        return this.renderPasswordForm();
      case "migrating":
        return this.renderMigrating();
      case "error":
        return this.renderError();
      case "success":
        return this.renderSuccess();
    }
  }
  renderPasswordForm() {
    return x`
      <div class="migration-content">
        <div class="warning-banner">
          <span class="warning-icon">&#9888;</span>
          <div class="warning-text">
            <strong>Storage format mismatch detected</strong>
            <div class="format-info">
              <div class="format-row">
                <span class="format-label">Current data:</span>
                <span class="format-value">${this.found}</span>
              </div>
              <div class="format-row">
                <span class="format-label">Build expects:</span>
                <span class="format-value">${this.expected}</span>
              </div>
            </div>
          </div>
        </div>

        <p>Enter the instructor password to migrate all stored records to the new format.</p>

        <form @submit=${this.handleSubmit}>
          <div class="form-field">
            <label for="migration-password">Instructor Password</label>
            <input
              id="migration-password"
              type="password"
              placeholder="Password"
              .value=${this.password}
              @input=${this.handleInput}
              required
              aria-label="Enter instructor password to authorize migration"
            />
          </div>

          ${this.error ? x`<div class="error-message">${this.error}</div>` : E}

          <div class="button-row">
            <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
            <button type="submit" class="primary">Migrate Database</button>
          </div>
        </form>
      </div>
    `;
  }
  renderMigrating() {
    return x`
      <div class="migration-content">
        <div class="migrating-state">
          <div class="spinner"></div>
          <p>Migrating database records...</p>
          <p class="format-info">Please wait, do not close this window.</p>
        </div>
      </div>
    `;
  }
  renderError() {
    return x`
      <div class="migration-content">
        <div class="error-message">${this.error}</div>

        <div class="button-row">
          <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
          <button type="button" class="primary" @click=${() => this.dialogState = "password"}>
            Try Again
          </button>
        </div>
      </div>
    `;
  }
  renderSuccess() {
    return x`
      <div class="migration-content">
        <div class="success-message">
          Migration completed successfully!<br />
          <span class="format-info">
            ${this.migrationResult?.migrated ?? 0} record(s) migrated,
            ${this.migrationResult?.skipped ?? 0} already in correct format.
          </span>
        </div>

        <div class="button-row">
          <button type="button" class="primary" @click=${this.handleContinue}>Continue</button>
        </div>
      </div>
    `;
  }
};
QdMigrationDialog.styles = i$4`
    :host {
      display: contents;
    }

    .migration-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }

    .warning-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #fff3cd;
      border-radius: 4px;
      border-left: 4px solid #ffc107;
    }

    .warning-icon {
      font-size: 20px;
      line-height: 1;
    }

    .warning-text {
      flex: 1;
    }

    .warning-text strong {
      display: block;
      margin-bottom: 4px;
      color: #856404;
    }

    .format-info {
      font-size: 13px;
      color: #666;
    }

    .format-row {
      display: flex;
      gap: 8px;
      margin: 4px 0;
    }

    .format-label {
      font-weight: 500;
      min-width: 100px;
    }

    .format-value {
      font-family: monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    label {
      font-size: 13px;
      font-weight: 500;
      color: #333;
    }

    input[type='password'] {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
    }

    input[type='password']:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .error-message {
      color: #d32f2f;
      font-size: 12px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
      border-left: 3px solid #d32f2f;
    }

    .success-message {
      color: #2e7d32;
      font-size: 13px;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 4px;
      border-left: 3px solid #4caf50;
    }

    .migrating-state {
      text-align: center;
      padding: 20px;
    }

    .spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 3px solid #e0e0e0;
      border-top-color: #0066cc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .button-row {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    button.primary {
      background: #0066cc;
      color: white;
    }

    button.primary:hover:not(:disabled) {
      background: #0052a3;
    }

    button.secondary {
      background: #e0e0e0;
      color: #333;
    }

    button.secondary:hover:not(:disabled) {
      background: #d0d0d0;
    }
  `;
__decorateClass$9([
  n2({ type: Boolean, reflect: true })
], QdMigrationDialog.prototype, "open", 2);
__decorateClass$9([
  n2({ type: String })
], QdMigrationDialog.prototype, "expected", 2);
__decorateClass$9([
  n2({ type: String })
], QdMigrationDialog.prototype, "found", 2);
__decorateClass$9([
  n2({ type: String })
], QdMigrationDialog.prototype, "dbName", 2);
__decorateClass$9([
  n2({ type: String })
], QdMigrationDialog.prototype, "releaseId", 2);
__decorateClass$9([
  r()
], QdMigrationDialog.prototype, "dialogState", 2);
__decorateClass$9([
  r()
], QdMigrationDialog.prototype, "password", 2);
__decorateClass$9([
  r()
], QdMigrationDialog.prototype, "error", 2);
__decorateClass$9([
  r()
], QdMigrationDialog.prototype, "migrationResult", 2);
__decorateClass$9([
  e$2('input[type="password"]')
], QdMigrationDialog.prototype, "passwordInput", 2);
QdMigrationDialog = __decorateClass$9([
  t$1("qd-migration-dialog")
], QdMigrationDialog);
const HELP_CONTENT = {
  login: {
    title: "Login Help",
    body: '<p>Enter <strong>Name</strong> and <strong>Service ID</strong> to log in.  Provide a new <strong>PIN</strong> if this is your first visit to this release of this document, otherwise use the PIN you previously created. Your instructor is able to reset PINs.  See the <b>Feedback</b> page for more support.</p><p> <strong>Instructors:</strong> click "Instructor" for instructor login page (password accompanies distribution).</p>'
  },
  status: {
    title: "Student View",
    body: '<p>Page color coding:<ul><li><strong style="color:#4caf50">Green</strong>=All correct </li><li><strong style="color:#ff9800">Amber</strong>=Some answered </li><li><strong style="color:#d32f2f">Red</strong>=None yet</li></ul></p><p>You can view your overall progress at attempted questions in the <b>Test Progress</b> panel.</p>'
  },
  instructor: {
    title: "Instructor Tools",
    body: "<p><ul><li><strong>Show current answers</strong>: Toggle for display of student answers for the current page.</li><li><strong>View All Scores</strong>: View table scores for all students.</li><li><strong>Reset PIN</strong>: Reset student PINs.</li><li><strong>Export CSV</strong>: CSV download of all scores/answers.</li><li><strong>Erase All Data</strong>: Clear all stored student data.</li></ul></p>"
  }
};
function getHelpContent(panelType) {
  return HELP_CONTENT[panelType];
}
var __defProp$8 = Object.defineProperty;
var __getOwnPropDesc$8 = Object.getOwnPropertyDescriptor;
var __decorateClass$8 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$8(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$8(target, key, result);
  return result;
};
let QdLogin = class extends i$1 {
  constructor() {
    super(...arguments);
    this.title = "Sonar Quiz System";
    this.name = "";
    this.serviceId = "";
    this.showInstructorModal = false;
    this.instructorError = "";
    this.errorMessage = "";
    this.isSubmitting = false;
    this.pin = "";
    this.lockoutSeconds = 0;
    this.showPinConfirmation = false;
    this.helpOpen = false;
    this.showMigrationDialog = false;
    this.migrationError = null;
    this.pendingLoginData = null;
    this.lockoutInterval = null;
    this.handleLogoutEvent = () => {
      this.name = "";
      this.serviceId = "";
      this.errorMessage = "";
      this.isSubmitting = false;
      this.showInstructorModal = false;
      this.instructorError = "";
      this.pin = "";
      this.lockoutSeconds = 0;
      this.showPinConfirmation = false;
      this.helpOpen = false;
      if (this.lockoutInterval) {
        clearInterval(this.lockoutInterval);
        this.lockoutInterval = null;
      }
      this.updateVisibility();
    };
    this.handleHelpOpen = () => {
      this.helpOpen = true;
    };
    this.handleHelpClose = () => {
      this.helpOpen = false;
    };
    this.handleInstructorPasswordSubmit = (e2) => {
      void this.handleInstructorLogin(e2.detail.password);
    };
    this.handleInstructorModalClose = () => {
      this.showInstructorModal = false;
      this.instructorError = "";
    };
    this.handlePinConfirmationDismiss = () => {
      this.showPinConfirmation = false;
    };
    this.handleMigrationComplete = () => {
      this.showMigrationDialog = false;
      this.migrationError = null;
      if (this.pendingLoginData) {
        const { serviceId, name, release } = this.pendingLoginData;
        this.pendingLoginData = null;
        void this.retryLoginAfterMigration(serviceId, name, release);
      }
    };
    this.handleMigrationCancel = () => {
      this.showMigrationDialog = false;
      this.migrationError = null;
      this.pendingLoginData = null;
      this.errorMessage = "Data migration cancelled. Please contact your instructor for assistance.";
      this.isSubmitting = false;
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.updateVisibility();
    document.addEventListener("qd:logout", this.handleLogoutEvent);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("qd:logout", this.handleLogoutEvent);
    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
    }
  }
  /**
   * Lifecycle: Called after first render completes (shadow DOM ready)
   */
  firstUpdated() {
    this.setAttribute("data-ready", "");
  }
  /**
   * Update visibility - show only if NOT logged in
   */
  updateVisibility() {
    const session = getJSON(STORAGE_KEYS.SESSION);
    if (!session) {
      this.setAttribute("data-show", "");
    } else {
      this.removeAttribute("data-show");
    }
  }
  render() {
    return x`
      <div class="login-container">
        <div class="title">
          ${this.title}
          <qd-build-info></qd-build-info>
          <qd-help-trigger panelType="login" @qd:help-open=${this.handleHelpOpen}></qd-help-trigger>
        </div>

        <form class="login-form" @submit=${(e2) => this.handleStudentLogin(e2)}>
          <input
            type="text"
            name="name"
            placeholder="Name (J Smith)"
            .value=${this.name}
            @input=${(e2) => this.handleNameInput(e2)}
            ?disabled=${this.isSubmitting}
            required
          />

          <input
            type="text"
            name="serviceId"
            placeholder="Service ID (30012345)"
            .value=${this.serviceId}
            @input=${(e2) => this.handleServiceIdInput(e2)}
            ?disabled=${this.isSubmitting}
            pattern="[A-Za-z0-9]{2,10}"
            title="2-10 alphanumeric characters"
            required
          />

          <input
            type="password"
            name="pin"
            class="pin-input"
            placeholder="PIN"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="4"
            autocomplete="off"
            aria-label="Enter your 4-digit PIN"
            .value=${this.pin}
            @input=${(e2) => this.handlePinInput(e2)}
            ?disabled=${this.isSubmitting || this.lockoutSeconds > 0}
            required
          />

          <button
            type="submit"
            class="login-btn"
            ?disabled=${this.isSubmitting || !this.isValid() || this.lockoutSeconds > 0}
          >
            Login
          </button>

          <button
            type="button"
            class="instructor-btn"
            @click=${() => this.openInstructorModal()}
            ?disabled=${this.isSubmitting}
          >
            Instructor
          </button>

          ${this.errorMessage ? x`<div class="error-message">${this.errorMessage}</div>` : ""}
          ${this.lockoutSeconds > 0 ? x`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
                Too many attempts. Try again in ${this.lockoutSeconds}s
              </div>` : ""}
        </form>
      </div>

      <qd-password-modal
        .open=${this.showInstructorModal}
        title="Instructor Login"
        .error=${this.instructorError}
        @qd:password-submit=${this.handleInstructorPasswordSubmit}
        @close=${this.handleInstructorModalClose}
      ></qd-password-modal>

      <qd-confirm-dialog
        .open=${this.showPinConfirmation}
        title="PIN Stored"
        message="Your PIN has been saved. Use it with your name and service ID on future logins."
        confirmText="OK"
        cancelText=""
        @qd:confirm=${this.handlePinConfirmationDismiss}
        @qd:cancel=${this.handlePinConfirmationDismiss}
      ></qd-confirm-dialog>

      <qd-help-popup
        .open=${this.helpOpen}
        .title=${getHelpContent("login").title}
        .content=${getHelpContent("login").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>

      <qd-migration-dialog
        .open=${this.showMigrationDialog}
        .expected=${this.migrationError?.expected ?? "plain"}
        .found=${this.migrationError?.found ?? "plain"}
        .dbName=${this.pendingLoginData?.dbName ?? ""}
        .releaseId=${this.pendingLoginData?.release ?? ""}
        @qd:migration-complete=${this.handleMigrationComplete}
        @qd:migration-cancel=${this.handleMigrationCancel}
      ></qd-migration-dialog>
    `;
  }
  /**
   * Handle name input
   */
  handleNameInput(e2) {
    const input = e2.target;
    this.name = input.value;
    this.errorMessage = "";
  }
  /**
   * Handle service ID input
   */
  handleServiceIdInput(e2) {
    const input = e2.target;
    this.serviceId = input.value;
    this.errorMessage = "";
  }
  /**
   * Handle PIN input
   */
  handlePinInput(e2) {
    const input = e2.target;
    this.pin = sanitizePinInput(input.value);
    this.errorMessage = "";
  }
  /**
   * Check if student form is valid using validation helper
   */
  isValid() {
    const errors = validateStudentForm(this.name, this.serviceId, this.pin);
    return errors.length === 0;
  }
  /**
   * Get release from document title
   * Reads selector from config, then queries document
   */
  getRelease() {
    const selectorElement = document.getElementById(CONFIG_IDS.titleSelector);
    const selector = selectorElement?.textContent?.trim() || ".wh_publication_title .title";
    const titleElement = document.querySelector(selector);
    return titleElement?.textContent?.trim() || "";
  }
  /**
   * Handle student login
   */
  async handleStudentLogin(e2) {
    e2.preventDefault();
    if (!this.isValid()) {
      this.errorMessage = "Please enter name, service ID, and 4-digit PIN";
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = "";
    try {
      const release = this.getRelease();
      if (!release) {
        this.errorMessage = "Release not found (missing publication title element)";
        this.isSubmitting = false;
        return;
      }
      const serviceId = this.serviceId.trim();
      const name = this.name.trim();
      const lockout = checkLockout(serviceId);
      if (lockout.isLocked) {
        this.startLockoutCountdown(lockout.remainingMs);
        this.isSubmitting = false;
        return;
      }
      const dbNameElement = document.getElementById(CONFIG_IDS.dbName);
      if (!dbNameElement?.textContent?.trim()) {
        throw new Error(
          `Database name not configured. Add <span id="${CONFIG_IDS.dbName}">dbName</span> to page.`
        );
      }
      const dbName = dbNameElement.textContent.trim();
      const storage = getStorageAdapter(dbName);
      await storage.init();
      const existingStudent = await storage.getStudent(release, serviceId);
      if (existingStudent) {
        if (needsMigration(existingStudent) || !hasPinSet(existingStudent)) {
          const pinHash = await hashPin(this.pin);
          const updatedStudent = completePinSetup(existingStudent, pinHash);
          await storage.saveStudent(updatedStudent);
          this.dispatchEvent(
            new CustomEvent("qd:pin-created", {
              detail: { serviceId, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
              bubbles: true,
              composed: true
            })
          );
          this.showPinStoredConfirmation();
          this.completeLogin(serviceId, name, release);
          return;
        }
        const isValid = await verifyPin(this.pin, existingStudent.pinHash || "");
        if (!isValid) {
          const state2 = recordFailedAttempt(serviceId);
          const remaining = getRemainingAttempts(serviceId);
          if (state2.lockoutUntil) {
            const lockoutMs = new Date(state2.lockoutUntil).getTime() - Date.now();
            this.startLockoutCountdown(lockoutMs);
          } else {
            this.errorMessage = `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining`;
          }
          this.pin = "";
          this.isSubmitting = false;
          return;
        }
        clearAttemptState(serviceId);
        this.dispatchEvent(
          new CustomEvent("qd:pin-verified", {
            detail: { serviceId, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
            bubbles: true,
            composed: true
          })
        );
      } else {
        const pinHash = await hashPin(this.pin);
        const newStudent = {
          schema: SCHEMA_VERSION,
          docId: "",
          release,
          serviceId,
          name,
          attempted: 0,
          correct: 0,
          updated: (/* @__PURE__ */ new Date()).toISOString(),
          pages: {},
          pinHash,
          pinCreatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await storage.saveStudent(newStudent);
        this.dispatchEvent(
          new CustomEvent("qd:pin-created", {
            detail: { serviceId, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
            bubbles: true,
            composed: true
          })
        );
        this.showPinStoredConfirmation();
        this.completeLogin(serviceId, name, release);
        return;
      }
      this.completeLogin(serviceId, name, release);
    } catch (err) {
      if (err instanceof StorageFormatError) {
        const dbNameElement = document.getElementById(CONFIG_IDS.dbName);
        const dbName = dbNameElement?.textContent?.trim() || "";
        this.migrationError = err;
        this.pendingLoginData = {
          serviceId: this.serviceId.trim(),
          name: this.name.trim(),
          release: this.getRelease(),
          pin: this.pin,
          dbName
        };
        this.showMigrationDialog = true;
        this.isSubmitting = false;
        return;
      }
      this.errorMessage = "Login failed. Please try again.";
      console.error("Student login error:", err);
      this.isSubmitting = false;
    }
  }
  /**
   * Show confirmation popup that PIN has been stored
   */
  showPinStoredConfirmation() {
    this.showPinConfirmation = true;
  }
  /**
   * Retry login after successful migration
   */
  async retryLoginAfterMigration(serviceId, name, release) {
    this.isSubmitting = true;
    this.errorMessage = "";
    try {
      const dbNameElement = document.getElementById(CONFIG_IDS.dbName);
      const dbName = dbNameElement?.textContent?.trim() || "";
      const storage = getStorageAdapter(dbName);
      await storage.init();
      const existingStudent = await storage.getStudent(release, serviceId);
      if (existingStudent) {
        if (needsMigration(existingStudent) || !hasPinSet(existingStudent)) {
          const pinHash = await hashPin(this.pin);
          const updatedStudent = completePinSetup(existingStudent, pinHash);
          await storage.saveStudent(updatedStudent);
          this.dispatchEvent(
            new CustomEvent("qd:pin-created", {
              detail: { serviceId, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
              bubbles: true,
              composed: true
            })
          );
          this.showPinStoredConfirmation();
          this.completeLogin(serviceId, name, release);
          return;
        }
        const isValid = await verifyPin(this.pin, existingStudent.pinHash || "");
        if (!isValid) {
          const state2 = recordFailedAttempt(serviceId);
          const remaining = getRemainingAttempts(serviceId);
          if (state2.lockoutUntil) {
            const lockoutMs = new Date(state2.lockoutUntil).getTime() - Date.now();
            this.startLockoutCountdown(lockoutMs);
          } else {
            this.errorMessage = `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining`;
          }
          this.pin = "";
          this.isSubmitting = false;
          return;
        }
        clearAttemptState(serviceId);
        this.dispatchEvent(
          new CustomEvent("qd:pin-verified", {
            detail: { serviceId, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
            bubbles: true,
            composed: true
          })
        );
      } else {
        const pinHash = await hashPin(this.pin);
        const newStudent = {
          schema: SCHEMA_VERSION,
          docId: "",
          release,
          serviceId,
          name,
          attempted: 0,
          correct: 0,
          updated: (/* @__PURE__ */ new Date()).toISOString(),
          pages: {},
          pinHash,
          pinCreatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await storage.saveStudent(newStudent);
        this.dispatchEvent(
          new CustomEvent("qd:pin-created", {
            detail: { serviceId, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
            bubbles: true,
            composed: true
          })
        );
        this.showPinStoredConfirmation();
        this.completeLogin(serviceId, name, release);
        return;
      }
      this.completeLogin(serviceId, name, release);
    } catch (err) {
      this.errorMessage = "Login failed after migration. Please try again.";
      console.error("Post-migration login error:", err);
      this.isSubmitting = false;
    }
  }
  /**
   * Start lockout countdown timer
   */
  startLockoutCountdown(remainingMs) {
    this.lockoutSeconds = Math.ceil(remainingMs / 1e3);
    this.errorMessage = "";
    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
    }
    this.lockoutInterval = window.setInterval(() => {
      this.lockoutSeconds--;
      if (this.lockoutSeconds <= 0) {
        if (this.lockoutInterval) {
          clearInterval(this.lockoutInterval);
          this.lockoutInterval = null;
        }
      }
    }, 1e3);
  }
  /**
   * Complete the login process
   */
  completeLogin(serviceId, name, release) {
    const sessionService = new SessionService();
    sessionService.createSession(serviceId, name, release);
    const loginData = {
      serviceId,
      name,
      release,
      role: "student"
    };
    const event = new CustomEvent("qd:login", {
      detail: loginData,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
    this.pin = "";
    this.isSubmitting = false;
    this.updateVisibility();
  }
  /**
   * Open instructor modal
   */
  openInstructorModal() {
    this.showInstructorModal = true;
    this.instructorError = "";
  }
  /**
   * Hash password using SHA-256
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b2) => b2.toString(16).padStart(2, "0")).join("").substring(0, 12);
  }
  /**
   * Get expected password hash from hidden element
   */
  getExpectedHash() {
    const hashElement = document.getElementById(CONFIG_IDS.instructorHash);
    return hashElement?.textContent?.trim() || "";
  }
  /**
   * Handle instructor login with password
   */
  async handleInstructorLogin(password) {
    try {
      const passwordHash = await this.hashPassword(password);
      const expectedHash = this.getExpectedHash();
      if (!expectedHash) {
        this.instructorError = "Instructor password not configured";
        return;
      }
      if (passwordHash !== expectedHash) {
        this.instructorError = "Incorrect password";
        return;
      }
      const release = this.getRelease();
      const sessionService = new SessionService();
      sessionService.createSession("INSTRUCTOR", "Instructor", release || "");
      sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, "true");
      const loginData = {
        serviceId: "INSTRUCTOR",
        name: "Instructor",
        release: release || "",
        role: "instructor"
      };
      const event = new CustomEvent("qd:login", {
        detail: loginData,
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(event);
      this.showInstructorModal = false;
      this.instructorError = "";
      this.updateVisibility();
    } catch (err) {
      this.instructorError = "Login failed. Please try again.";
      console.error("Instructor login error:", err);
    }
  }
};
QdLogin.styles = i$4`
    :host {
      display: none; /* Hidden if already logged in */
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }

    :host([data-show]) {
      display: block;
    }

    .login-container {
      padding: 8px 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      max-width: 480px;
    }

    .title {
      margin: 0 0 8px 0;
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }

    .login-form {
      display: flex;
      gap: 6px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    input {
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 11px;
      width: 110px;
      min-width: 75px;
      max-width: 110px;
    }

    input.pin-input {
      width: 45px;
      min-width: 45px;
      max-width: 45px;
      text-align: center;
      letter-spacing: 1px;
    }

    input:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .login-btn {
      background: #0066cc;
      color: white;
    }

    .login-btn:hover:not(:disabled) {
      background: #0052a3;
    }

    .login-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .instructor-btn {
      background: #6c757d;
      color: white;
    }

    .instructor-btn:hover {
      background: #5a6268;
    }

    .error-message {
      width: 100%;
      color: #d32f2f;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #ffebee;
      border-radius: 3px;
      border-left: 3px solid #d32f2f;
    }

    .lockout-message {
      width: 100%;
      color: #f57c00;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #fff3e0;
      border-radius: 3px;
      border-left: 3px solid #f57c00;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .login-form {
        flex-direction: column;
      }

      input,
      button {
        width: 100%;
      }
    }
  `;
__decorateClass$8([
  n2({ type: String })
], QdLogin.prototype, "title", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "name", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "serviceId", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "showInstructorModal", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "instructorError", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "errorMessage", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "isSubmitting", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "pin", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "lockoutSeconds", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "showPinConfirmation", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "helpOpen", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "showMigrationDialog", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "migrationError", 2);
__decorateClass$8([
  r()
], QdLogin.prototype, "pendingLoginData", 2);
QdLogin = __decorateClass$8([
  t$1("qd-login")
], QdLogin);
var __defProp$7 = Object.defineProperty;
var __getOwnPropDesc$7 = Object.getOwnPropertyDescriptor;
var __decorateClass$7 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$7(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$7(target, key, result);
  return result;
};
let QdStatus = class extends i$1 {
  constructor() {
    super(...arguments);
    this.total = 0;
    this.correct = 0;
    this.percentage = 0;
    this.statusColor = "red";
    this.name = "";
    this.serviceId = "";
    this.helpOpen = false;
    this.handleStateChanged = () => {
      this.loadCache();
    };
    this.handleLogin = () => {
      this.updateVisibility();
      this.loadCache();
    };
    this.handleCacheRebuild = () => {
      this.loadCache();
    };
    this.handleLogoutEvent = () => {
      this.updateVisibility();
    };
    this.handleHelpOpen = () => {
      this.helpOpen = true;
    };
    this.handleHelpClose = () => {
      this.helpOpen = false;
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.updateVisibility();
    this.loadCache();
    document.addEventListener("qd:state-changed", this.handleStateChanged);
    document.addEventListener("qd:login", this.handleLogin);
    document.addEventListener("qd:logout", this.handleLogoutEvent);
    document.addEventListener("qd:cache-rebuild", this.handleCacheRebuild);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("qd:state-changed", this.handleStateChanged);
    document.removeEventListener("qd:login", this.handleLogin);
    document.removeEventListener("qd:logout", this.handleLogoutEvent);
    document.removeEventListener("qd:cache-rebuild", this.handleCacheRebuild);
  }
  render() {
    const last4 = this.serviceId.slice(-4);
    return x`
      <div class="status-panel">
        <div class="top-row">
          <span class="user-info">
            <span class="user-label">Test progress:</span>
            ${this.name} **${last4}
          </span>
          <qd-help-trigger
            panelType="status"
            @qd:help-open=${this.handleHelpOpen}
          ></qd-help-trigger>
          <button class="logout-button" @click=${() => this.handleLogout()}>Logout</button>
          <qd-build-info></qd-build-info>
        </div>
        <div class="bottom-row">
          <div class="status-indicator ${this.statusColor}"></div>
          <div class="progress-text">
            ${this.correct}/${this.total} Correct (${this.percentage}%)
          </div>
        </div>
      </div>
      <qd-help-popup
        .open=${this.helpOpen}
        .title=${getHelpContent("status").title}
        .content=${getHelpContent("status").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>
    `;
  }
  /**
   * Load cache from storage and update state
   */
  loadCache() {
    const session = getJSON(STORAGE_KEYS.SESSION);
    if (session) {
      this.name = session.name || "";
      this.serviceId = session.serviceId || "";
    } else {
      this.name = "";
      this.serviceId = "";
    }
    const cache = getJSON(STORAGE_KEYS.CACHE);
    if (!cache) {
      this.total = 0;
      this.correct = 0;
      this.percentage = 0;
      this.statusColor = "red";
      return;
    }
    this.total = cache.totals.total;
    this.correct = cache.totals.correct;
    this.percentage = this.calculatePercentage(cache.totals.total, cache.totals.correct);
    this.statusColor = this.calculateStatusColor(cache.totals.total, cache.totals.correct);
  }
  /**
   * Calculate percentage from total/correct
   */
  calculatePercentage(total, correct) {
    if (total === 0) return 0;
    return Math.round(correct / total * 100);
  }
  /**
   * Calculate status indicator color using calculation helper
   * Red: No questions registered or no answers
   * Green: All questions answered correctly
   * Amber: Some answered but not all correct
   */
  calculateStatusColor(total, correct) {
    return calculateStatusIndicator(total, correct);
  }
  /**
   * Update visibility based on session state
   * Show only if logged in as student (not instructor)
   */
  updateVisibility() {
    const session = getJSON(STORAGE_KEYS.SESSION);
    const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === "true";
    if (session && !isInstructor) {
      this.setAttribute("data-show", "");
    } else {
      this.removeAttribute("data-show");
    }
  }
  /**
   * Handle logout button click
   */
  handleLogout() {
    const session = getJSON(STORAGE_KEYS.SESSION);
    const sessionService = new SessionService();
    sessionService.clearSession();
    const event = new CustomEvent("qd:logout", {
      detail: {
        serviceId: session?.serviceId || "unknown"
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
};
QdStatus.styles = i$4`
    :host {
      display: none; /* Hidden by default, shown when logged in */
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }

    :host([data-show]) {
      display: block;
    }

    .status-panel {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .top-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bottom-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-info {
      font-size: 13px;
      color: #333;
      white-space: nowrap;
    }

    .user-label {
      font-weight: 500;
      color: #555;
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-indicator.red {
      background: #d32f2f;
    }

    .status-indicator.amber {
      background: #ff9800;
    }

    .status-indicator.green {
      background: #4caf50;
    }

    .progress-label {
      font-size: 13px;
      font-weight: 500;
      color: #555;
      white-space: nowrap;
    }

    .progress-text {
      font-size: 13px;
      color: #333;
      white-space: nowrap;
    }

    .logout-button {
      padding: 5px 10px;
      background: #d32f2f;
      color: white;
      border: none;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      white-space: nowrap;
    }

    .logout-button:hover {
      background: #b71c1c;
    }
  `;
__decorateClass$7([
  r()
], QdStatus.prototype, "total", 2);
__decorateClass$7([
  r()
], QdStatus.prototype, "correct", 2);
__decorateClass$7([
  r()
], QdStatus.prototype, "percentage", 2);
__decorateClass$7([
  r()
], QdStatus.prototype, "statusColor", 2);
__decorateClass$7([
  r()
], QdStatus.prototype, "name", 2);
__decorateClass$7([
  r()
], QdStatus.prototype, "serviceId", 2);
__decorateClass$7([
  r()
], QdStatus.prototype, "helpOpen", 2);
QdStatus = __decorateClass$7([
  t$1("qd-status")
], QdStatus);
const sharedStyles = i$4`
  :host {
    display: inline-block;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  /* When showing modal, host should not constrain size */
  :host([showmodal]) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none; /* Let clicks through except on modal */
  }

  :host([showmodal]) .modal-overlay {
    pointer-events: auto; /* Re-enable on overlay */
  }

  .instructor-panel {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .instructor-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--qd-text-on-dark, #fff);
    margin-right: 8px;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--qd-text-on-dark, #fff);
    user-select: none;
  }

  .toggle-label input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  button {
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  button:hover {
    background: #f5f5f5;
    border-color: #999;
  }

  button:active {
    background: #e5e5e5;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button.compact {
    padding: 6px 12px;
    font-size: 13px;
  }

  button.primary {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  button.primary:hover {
    background: #0056b3;
    border-color: #0056b3;
  }

  button.secondary {
    background: #ff9800;
    color: white;
    border-color: #ff9800;
  }

  button.secondary:hover {
    background: #f57c00;
    border-color: #f57c00;
  }

  button.danger {
    background: #dc3545;
    color: white;
    border-color: #dc3545;
  }

  button.danger:hover {
    background: #c82333;
    border-color: #c82333;
  }

  button.logout {
    background: #6c757d;
    color: white;
    border-color: #6c757d;
  }

  button.logout:hover {
    background: #5a6268;
    border-color: #5a6268;
  }

  input,
  textarea {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  .error {
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
  }

  .success {
    color: #28a745;
    font-size: 12px;
    margin-top: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  th,
  td {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid #ddd;
    color: #333; /* Explicit dark text */
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
    color: #000; /* Explicit black for headers */
  }

  tr:hover {
    background: #f9f9f9;
  }

  .correct {
    color: #28a745;
  }

  .incorrect {
    color: #dc3545;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--qd-modal-overlay-z-index, 9999);
    pointer-events: auto; /* Ensure overlay catches all clicks */
  }

  .modal-content {
    position: relative;
    background: white;
    padding: 24px;
    border-radius: 8px;
    max-width: 800px;
    max-height: 80vh;
    overflow: auto;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: var(--qd-modal-z-index, 10000);
    color: #333; /* Explicit dark text color */
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #000; /* Explicit black for title */
  }

  .close-button {
    padding: 4px 8px;
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  }

  .close-button:hover {
    color: #000;
  }
`;
class RateLimiter {
  constructor() {
    this.failureCount = 0;
    this.lockoutUntil = null;
  }
  /**
   * Attempt an action (e.g., login attempt)
   *
   * @returns true if action is allowed, false if rate limited
   */
  attempt() {
    if (this.lockoutUntil && Date.now() < this.lockoutUntil) {
      return false;
    }
    if (this.lockoutUntil && Date.now() >= this.lockoutUntil) {
      this.lockoutUntil = null;
    }
    return true;
  }
  /**
   * Record a failed attempt and apply exponential backoff
   *
   * Delays: 2s, 4s, 8s, 16s, 30s (max)
   */
  recordFailure() {
    this.failureCount++;
    const delays = [2e3, 4e3, 8e3, 16e3, 3e4];
    const delayIndex = Math.min(this.failureCount - 1, delays.length - 1);
    const delay = delays[delayIndex] ?? 3e4;
    this.lockoutUntil = Date.now() + delay;
  }
  /**
   * Reset the rate limiter after successful authentication
   */
  reset() {
    this.failureCount = 0;
    this.lockoutUntil = null;
  }
  /**
   * Get remaining lockout time in seconds
   *
   * @returns Number of seconds until next attempt allowed, or 0 if not locked
   */
  getRemainingSeconds() {
    if (!this.lockoutUntil) {
      return 0;
    }
    const remaining = Math.max(0, this.lockoutUntil - Date.now());
    return Math.ceil(remaining / 1e3);
  }
  /**
   * Check if currently locked out
   */
  isLockedOut() {
    return this.lockoutUntil !== null && Date.now() < this.lockoutUntil;
  }
}
async function constantTimeCompare(a2, b2) {
  if (a2.length !== b2.length) {
    return false;
  }
  if (a2.length === 0) {
    return true;
  }
  const encoder = new TextEncoder();
  const aBuffer = encoder.encode(a2);
  const bBuffer = encoder.encode(b2);
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      aBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, bBuffer);
    const expectedKey = await crypto.subtle.importKey(
      "raw",
      bBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const expectedSignature = await crypto.subtle.sign("HMAC", expectedKey, aBuffer);
    if (signature.byteLength !== expectedSignature.byteLength) {
      return false;
    }
    const sigView = new Uint8Array(signature);
    const expView = new Uint8Array(expectedSignature);
    let result = 0;
    for (let i3 = 0; i3 < sigView.length; i3++) {
      result |= (sigView[i3] ?? 0) ^ (expView[i3] ?? 0);
    }
    return result === 0;
  } catch (error2) {
    console.error("Constant-time comparison failed:", error2);
    return false;
  }
}
const PASSWORD_HASH_ELEMENT_ID = "instructor.password.hash";
function getInstructorPasswordHash() {
  const hashElement = document.getElementById(PASSWORD_HASH_ELEMENT_ID);
  if (!hashElement) {
    const errorMsg = `Instructor password hash not found. Expected element with id="${PASSWORD_HASH_ELEMENT_ID}". Check Oxygen XSL transform configuration.`;
    error(errorMsg);
    throw new Error(errorMsg);
  }
  const hash = hashElement.textContent?.trim();
  if (!hash) {
    const errorMsg = `Instructor password hash element is empty. Check Oxygen parameter configuration.`;
    error(errorMsg);
    throw new Error(errorMsg);
  }
  if (!/^[a-f0-9]{64}$/i.test(hash)) {
    const errorMsg = `Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${hash.substring(0, 20)}...`;
    error(errorMsg);
    throw new Error(errorMsg);
  }
  return hash.toLowerCase();
}
var __defProp$6 = Object.defineProperty;
var __getOwnPropDesc$6 = Object.getOwnPropertyDescriptor;
var __decorateClass$6 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$6(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$6(target, key, result);
  return result;
};
let QdInstructorUnlock = class extends i$1 {
  constructor() {
    super(...arguments);
    this.password = "";
    this.error = "";
    this.remainingSeconds = 0;
    this.rateLimiter = new RateLimiter();
    this.handlePasswordInput = (e2) => {
      const input = e2.target;
      this.password = input.value;
      this.error = "";
    };
    this.handleSubmit = async (e2) => {
      e2.preventDefault();
      const allowed = this.rateLimiter.attempt();
      if (!allowed) {
        this.remainingSeconds = this.rateLimiter.getRemainingSeconds();
        this.startCountdown();
        this.error = `Too many attempts. Try again in ${this.remainingSeconds}s`;
        return;
      }
      try {
        const expectedHash = getInstructorPasswordHash();
        const encoder = new TextEncoder();
        const data = encoder.encode(this.password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const actualHash = hashArray.map((b2) => b2.toString(16).padStart(2, "0")).join("");
        const valid = await constantTimeCompare(actualHash, expectedHash);
        if (valid) {
          this.rateLimiter.reset();
          this.password = "";
          this.error = "";
          dispatchEventOn(this, "qd:instructor-unlock", {});
        } else {
          this.error = "Invalid password";
          this.password = "";
        }
      } catch {
        this.error = "Authentication failed";
        this.password = "";
      }
    };
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.countdownInterval) {
      window.clearInterval(this.countdownInterval);
    }
  }
  startCountdown() {
    if (this.countdownInterval) {
      window.clearInterval(this.countdownInterval);
    }
    this.countdownInterval = window.setInterval(() => {
      this.remainingSeconds = this.rateLimiter.getRemainingSeconds();
      if (this.remainingSeconds === 0) {
        if (this.countdownInterval) {
          window.clearInterval(this.countdownInterval);
          this.countdownInterval = void 0;
        }
        this.error = "";
      } else {
        this.error = `Too many attempts. Try again in ${this.remainingSeconds}s`;
      }
    }, 1e3);
  }
  render() {
    const isLocked = this.remainingSeconds > 0;
    return x`
      <div class="unlock-container">
        <h3>Instructor Access</h3>
        <p>Enter the instructor password to unlock administrative features.</p>

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="password">Password:</label>
            <input
              type="password"
              id="password"
              .value=${this.password}
              @input=${this.handlePasswordInput}
              ?disabled=${isLocked}
              autocomplete="current-password"
              required
            />
          </div>

          ${this.error ? x`<div class="error" role="alert" aria-live="polite">${this.error}</div>` : ""}

          <button type="submit" class="primary" ?disabled=${isLocked || !this.password}>
            ${isLocked ? `Locked (${this.remainingSeconds}s)` : "Unlock"}
          </button>
        </form>
      </div>
    `;
  }
};
QdInstructorUnlock.styles = sharedStyles;
__decorateClass$6([
  r()
], QdInstructorUnlock.prototype, "password", 2);
__decorateClass$6([
  r()
], QdInstructorUnlock.prototype, "error", 2);
__decorateClass$6([
  r()
], QdInstructorUnlock.prototype, "remainingSeconds", 2);
QdInstructorUnlock = __decorateClass$6([
  t$1("qd-instructor-unlock")
], QdInstructorUnlock);
var __defProp$5 = Object.defineProperty;
var __getOwnPropDesc$5 = Object.getOwnPropertyDescriptor;
var __decorateClass$5 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$5(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$5(target, key, result);
  return result;
};
let QdScoresModal = class extends i$1 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.students = [];
    this.handleModalClose = () => {
      this.open = false;
      this.dispatchEvent(new CustomEvent("close"));
    };
  }
  render() {
    return x`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Student Scores</span>
        <style>
          .scores-content {
            min-width: 500px;
            max-width: 800px;
          }
          .scores-content .empty-message {
            color: #666;
            padding: 20px;
            text-align: center;
          }
          .scores-content table {
            width: 100%;
            border-collapse: collapse;
          }
          .scores-content thead th {
            padding: 6px 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            background: #f5f5f5;
            font-weight: 600;
            font-size: 12px;
          }
          .scores-content .student-row td {
            padding: 4px 8px;
            border-bottom: 1px solid #eee;
            vertical-align: middle;
            font-size: 12px;
          }
          .scores-content .student-row:nth-child(even) {
            background: #e8e8e8;
          }
          .scores-content .student-row:hover {
            background: #f0f0f0;
          }
          .scores-content .score-perfect {
            color: #28a745;
            font-weight: 500;
          }
          .scores-content .score-zero {
            color: #dc3545;
          }
          .scores-content .answers-cell {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .scores-content .page-row {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .scores-content .page-name {
            font-weight: 500;
            font-size: 10px;
            color: #555;
            min-width: 80px;
          }
          .scores-content .page-answers {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
          }
          .scores-content .answer-badge {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 500;
          }
          .scores-content .answer-badge.correct {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .scores-content .answer-badge.incorrect {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          .scores-content .no-answers {
            color: #999;
            font-style: italic;
            font-size: 11px;
          }
        </style>
        <div class="scores-content">
          ${this.students.length === 0 ? x`<p class="empty-message">No student data available.</p>` : this.renderScoresTable()}
        </div>
      </qd-modal>
    `;
  }
  renderScoresTable() {
    const sortedStudents = [...this.students].sort((a2, b2) => a2.name.localeCompare(b2.name));
    return x`
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Service ID</th>
            <th>Score</th>
            <th>Answers</th>
          </tr>
        </thead>
        <tbody>
          ${sortedStudents.map((student) => this.renderStudentRow(student))}
        </tbody>
      </table>
    `;
  }
  renderStudentRow(student) {
    const summary = this.calculateSummary(student);
    const pages = Object.entries(student.pages);
    return x`
      <tr class="student-row">
        <td>${summary.name}</td>
        <td>${summary.serviceId}</td>
        <td class=${this.getScoreClass(summary)}>
          ${summary.correct}/${summary.attempted} (${summary.percentage}%)
        </td>
        <td>
          ${pages.length === 0 ? x`<span class="no-answers">—</span>` : x`
                <div class="answers-cell">
                  ${pages.map(
      ([pageId, pageData]) => x`
                      <div class="page-row">
                        <span class="page-name">${pageId}</span>
                        <div class="page-answers">
                          ${pageData.answers.map(
        (answer, idx) => x`
                              <span
                                class="answer-badge ${answer?.success ? "correct" : "incorrect"}"
                              >
                                Q${idx + 1}: ${answer?.answer ?? "—"}
                              </span>
                            `
      )}
                        </div>
                      </div>
                    `
    )}
                </div>
              `}
        </td>
      </tr>
    `;
  }
  getScoreClass(summary) {
    if (summary.attempted === 0) return "";
    if (summary.percentage === 100) return "score-perfect";
    if (summary.percentage === 0) return "score-zero";
    return "";
  }
  calculateSummary(student) {
    const percentage = student.attempted > 0 ? Math.round(student.correct / student.attempted * 100) : 0;
    return {
      serviceId: student.serviceId,
      name: student.name,
      attempted: student.attempted,
      correct: student.correct,
      percentage
    };
  }
  /**
   * Open the modal
   */
  show() {
    this.open = true;
  }
  /**
   * Close the modal
   */
  close() {
    this.open = false;
  }
};
QdScoresModal.styles = i$4`
    :host {
      display: contents;
    }
  `;
__decorateClass$5([
  n2({ type: Boolean, reflect: true })
], QdScoresModal.prototype, "open", 2);
__decorateClass$5([
  n2({ type: Array })
], QdScoresModal.prototype, "students", 2);
QdScoresModal = __decorateClass$5([
  t$1("qd-scores-modal")
], QdScoresModal);
var __defProp$4 = Object.defineProperty;
var __getOwnPropDesc$4 = Object.getOwnPropertyDescriptor;
var __decorateClass$4 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$4(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$4(target, key, result);
  return result;
};
let QdInstructorScores = class extends i$1 {
  constructor() {
    super(...arguments);
    this.students = [];
    this.showModal = false;
    this.handleClose = () => {
      this.dispatchEvent(new CustomEvent("close"));
    };
  }
  render() {
    return x`
      <qd-scores-modal
        .open=${this.showModal}
        .students=${this.students}
        @close=${this.handleClose}
      ></qd-scores-modal>
    `;
  }
};
QdInstructorScores.styles = sharedStyles;
__decorateClass$4([
  n2({ type: Array })
], QdInstructorScores.prototype, "students", 2);
__decorateClass$4([
  n2({ type: Boolean })
], QdInstructorScores.prototype, "showModal", 2);
QdInstructorScores = __decorateClass$4([
  t$1("qd-instructor-scores")
], QdInstructorScores);
var __defProp$3 = Object.defineProperty;
var __getOwnPropDesc$3 = Object.getOwnPropertyDescriptor;
var __decorateClass$3 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$3(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$3(target, key, result);
  return result;
};
let QdInstructorExport = class extends i$1 {
  constructor() {
    super(...arguments);
    this.students = [];
    this.handleExport = () => {
      const csv = this.generateCSV();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const now = /* @__PURE__ */ new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      link.download = `quiz-data-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
  }
  escapeCSVField(field) {
    const str = String(field);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
  generateCSV() {
    const rows = [];
    rows.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");
    for (const student of this.students) {
      for (const [pageId, pageData] of Object.entries(student.pages)) {
        const answers = pageData.answers || [];
        answers.forEach((answer, index) => {
          if (answer) {
            rows.push(
              [
                this.escapeCSVField(student.serviceId),
                this.escapeCSVField(student.name),
                this.escapeCSVField(student.release),
                this.escapeCSVField(pageId),
                this.escapeCSVField(index),
                this.escapeCSVField(answer.answer),
                this.escapeCSVField(answer.success),
                this.escapeCSVField(answer.timestamp)
              ].join(",")
            );
          }
        });
      }
    }
    return rows.join("\n");
  }
  render() {
    const hasData = this.students.length > 0 && this.students.some((student) => student.attempted > 0);
    const tooltip = hasData ? `Export ${this.students.length} student${this.students.length === 1 ? "" : "s"} to CSV` : this.students.length > 0 ? "No answers to export (students have not answered any questions)" : "No data to export";
    return x`
      <button
        @click=${this.handleExport}
        ?disabled=${!hasData}
        class="primary compact"
        title=${tooltip}
      >
        Export CSV
      </button>
    `;
  }
};
QdInstructorExport.styles = sharedStyles;
__decorateClass$3([
  n2({ type: Array })
], QdInstructorExport.prototype, "students", 2);
QdInstructorExport = __decorateClass$3([
  t$1("qd-instructor-export")
], QdInstructorExport);
var __defProp$2 = Object.defineProperty;
var __getOwnPropDesc$2 = Object.getOwnPropertyDescriptor;
var __decorateClass$2 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$2(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$2(target, key, result);
  return result;
};
let QdInstructorManage = class extends i$1 {
  constructor() {
    super(...arguments);
    this.showConfirmDialog = false;
    this.confirmText = "";
    this.error = "";
    this.success = "";
    this.modalContainer = null;
    this.handleClearRequest = () => {
      this.showConfirmDialog = true;
      this.confirmText = "";
      this.error = "";
      this.success = "";
    };
    this.handleCancelClear = () => {
      this.showConfirmDialog = false;
      this.confirmText = "";
      this.error = "";
    };
    this.handleConfirmInput = (e2) => {
      const input = e2.target;
      this.confirmText = input.value;
    };
    this.handleConfirmClear = () => {
      if (this.confirmText !== "DELETE ALL DATA") {
        this.error = "Confirmation text does not match";
        return;
      }
      try {
        clearQuizData();
        dispatchEventOn(this, "qd:data-cleared", {});
        this.success = "All quiz data cleared successfully";
        this.showConfirmDialog = false;
        this.confirmText = "";
        this.error = "";
        setTimeout(() => {
          this.success = "";
        }, 3e3);
      } catch {
        this.error = "Failed to clear data";
      }
    };
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeModalFromBody();
  }
  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("showConfirmDialog")) {
      if (this.showConfirmDialog) {
        this.renderModalToBody();
      } else {
        this.removeModalFromBody();
      }
    }
    if (this.showConfirmDialog && (changedProperties.has("confirmText") || changedProperties.has("error"))) {
      this.renderModalToBody();
    }
  }
  renderModalToBody() {
    if (!this.modalContainer) {
      this.modalContainer = document.createElement("div");
      this.modalContainer.className = "qd-manage-modal-container";
      document.body.appendChild(this.modalContainer);
    }
    B(this.renderConfirmDialog(), this.modalContainer);
  }
  removeModalFromBody() {
    if (this.modalContainer) {
      this.modalContainer.remove();
      this.modalContainer = null;
    }
  }
  render() {
    return x`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success ? x`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          ` : ""}
    `;
  }
  renderConfirmDialog() {
    const isValid = this.confirmText === "DELETE ALL DATA";
    return x`
      <div
        class="qd-manage-modal-overlay"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;"
        @click=${(e2) => {
      if (e2.target === e2.currentTarget) this.handleCancelClear();
    }}
      >
        <div
          style="background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);"
          @click=${(e2) => e2.stopPropagation()}
        >
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
          >
            <h2 style="font-size: 18px; font-weight: 600; margin: 0; color: #000;">
              Confirm Data Deletion
            </h2>
            <button
              style="padding: 4px 8px; border: none; background: transparent; font-size: 20px; cursor: pointer; color: #666;"
              @click=${this.handleCancelClear}
            >
              ✕
            </button>
          </div>

          <p style="color: #dc3545; font-weight: 600; margin: 12px 0;">
            ⚠️ This will permanently delete all student quiz data, answers, and progress.
          </p>

          <p style="margin: 12px 0; color: #333;">
            This action cannot be undone. All students will need to start over.
          </p>

          <p style="margin: 12px 0; color: #333;">
            Type <strong>DELETE ALL DATA</strong> to confirm:
          </p>

          <input
            type="text"
            .value=${this.confirmText}
            @input=${this.handleConfirmInput}
            placeholder="DELETE ALL DATA"
            style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin: 16px 0; box-sizing: border-box;"
            autocomplete="off"
          />

          ${this.error ? x`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>` : ""}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button
              style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer; font-size: 14px;"
              @click=${this.handleCancelClear}
            >
              Cancel
            </button>
            <button
              style="padding: 8px 16px; border: none; border-radius: 4px; background: ${isValid ? "#dc3545" : "#ccc"}; color: white; cursor: ${isValid ? "pointer" : "not-allowed"}; font-size: 14px;"
              @click=${this.handleConfirmClear}
              ?disabled=${!isValid}
            >
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    `;
  }
};
QdInstructorManage.styles = sharedStyles;
__decorateClass$2([
  r()
], QdInstructorManage.prototype, "showConfirmDialog", 2);
__decorateClass$2([
  r()
], QdInstructorManage.prototype, "confirmText", 2);
__decorateClass$2([
  r()
], QdInstructorManage.prototype, "error", 2);
__decorateClass$2([
  r()
], QdInstructorManage.prototype, "success", 2);
QdInstructorManage = __decorateClass$2([
  t$1("qd-instructor-manage")
], QdInstructorManage);
var __defProp$1 = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __decorateClass$1 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$1(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$1(target, key, result);
  return result;
};
let QdPinResetDialog = class extends i$1 {
  constructor() {
    super(...arguments);
    this.students = [];
    this.open = false;
    this.searchText = "";
    this.confirmingStudent = null;
    this.confirmDialogOpen = false;
    this.errorMessage = "";
    this.handleModalClose = () => {
      if (this.confirmDialogOpen) {
        return;
      }
      this.close();
      this.dispatchEvent(new CustomEvent("close"));
    };
    this.handleSearchInput = (e2) => {
      const input = e2.target;
      this.searchText = input.value;
    };
    this.handleResetClick = (student) => {
      this.confirmingStudent = student;
      this.confirmDialogOpen = true;
    };
    this.handleConfirmReset = () => {
      if (this.confirmingStudent) {
        void this.executeReset(this.confirmingStudent);
      }
    };
    this.handleCancelReset = () => {
      this.confirmDialogOpen = false;
      this.confirmingStudent = null;
    };
  }
  set showModal(value) {
    this.open = value;
  }
  get showModal() {
    return this.open;
  }
  get filteredStudents() {
    if (!this.searchText.trim()) {
      return this.students;
    }
    const search = this.searchText.toLowerCase().trim();
    return this.students.filter(
      (s2) => s2.name.toLowerCase().includes(search) || s2.serviceId.toLowerCase().includes(search)
    );
  }
  /**
   * Close the modal
   */
  close() {
    this.open = false;
    this.confirmingStudent = null;
    this.confirmDialogOpen = false;
    this.searchText = "";
    this.errorMessage = "";
  }
  /**
   * Show the modal
   */
  show() {
    this.open = true;
  }
  async executeReset(student) {
    try {
      const dbNameElement = document.getElementById(CONFIG_IDS.dbName);
      if (!dbNameElement?.textContent?.trim()) {
        throw new Error(
          `Database name not configured. Add <span id="${CONFIG_IDS.dbName}">dbName</span> to page.`
        );
      }
      const dbName = dbNameElement.textContent.trim();
      const storage = getStorageAdapter(dbName);
      await storage.init();
      const updatedStudent = resetPin(student);
      await storage.saveStudent(updatedStudent);
      const auditEvent = {
        eventId: crypto.randomUUID(),
        serviceId: student.serviceId,
        resetBy: "instructor",
        resetAt: (/* @__PURE__ */ new Date()).toISOString(),
        release: student.release
      };
      await storage.saveAuditEvent(auditEvent);
      const index = this.students.findIndex((s2) => s2.serviceId === student.serviceId);
      if (index >= 0) {
        this.students[index] = updatedStudent;
        this.students = [...this.students];
      }
      this.dispatchEvent(
        new CustomEvent("qd:pin-reset", {
          detail: {
            serviceId: student.serviceId,
            resetBy: "instructor",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          },
          bubbles: true,
          composed: true
        })
      );
      this.confirmDialogOpen = false;
      this.confirmingStudent = null;
      this.errorMessage = "";
    } catch (err) {
      console.error("PIN reset error:", err);
      this.errorMessage = "Failed to reset PIN. Please try again.";
      this.confirmDialogOpen = false;
      this.confirmingStudent = null;
    }
  }
  render() {
    const student = this.confirmingStudent;
    const confirmMessage = student ? `Reset PIN for <strong>${student.name}</strong> (${student.serviceId})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>` : "";
    return x`
      <qd-modal
        .open=${this.open && !this.confirmDialogOpen}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Reset Student PIN</span>

        ${this.open ? x`
              <div class="pin-reset-content">
                <input
                  type="text"
                  class="search-input"
                  placeholder="Search by name or ID..."
                  .value=${this.searchText}
                  @input=${this.handleSearchInput}
                />

                <div class="student-table-container">
                  ${this.filteredStudents.length === 0 ? x`<div class="empty-message">
                        ${this.searchText ? "No matching students" : "No students found"}
                      </div>` : x`
                        <table class="student-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Service ID</th>
                              <th>Reset PIN</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${this.filteredStudents.map(
      (s2) => x`
                                <tr>
                                  <td>${s2.name}</td>
                                  <td>${s2.serviceId}</td>
                                  <td>
                                    <button
                                      class="reset-btn"
                                      type="button"
                                      @click=${() => this.handleResetClick(s2)}
                                    >
                                      Reset
                                    </button>
                                  </td>
                                </tr>
                              `
    )}
                          </tbody>
                        </table>
                      `}
                </div>

                ${this.errorMessage ? x`<div class="error-message">${this.errorMessage}</div>` : ""}
              </div>
            ` : E}
      </qd-modal>

      <qd-confirm-dialog
        .open=${this.confirmDialogOpen}
        title="Reset PIN"
        .message=${confirmMessage}
        confirmText="Reset PIN"
        cancelText="Cancel"
        destructive
        @qd:confirm=${this.handleConfirmReset}
        @qd:cancel=${this.handleCancelReset}
      ></qd-confirm-dialog>
    `;
  }
};
QdPinResetDialog.styles = i$4`
    :host {
      display: contents;
    }

    .pin-reset-content {
      min-width: 400px;
      max-width: 500px;
    }

    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    .search-input:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .student-table-container {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .student-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .student-table th {
      text-align: left;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 500;
      position: sticky;
      top: 0;
    }

    .student-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .student-table tbody tr:nth-child(even) {
      background: #f8f8f8;
    }

    .student-table tbody tr:hover {
      background: #f0f0f0;
    }

    .student-table tr:last-child td {
      border-bottom: none;
    }

    .reset-btn {
      background: #ff5722;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 10px;
      cursor: pointer;
    }

    .reset-btn:hover {
      background: #e64a19;
    }

    .empty-message {
      padding: 16px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }

    .error-message {
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
    }
  `;
__decorateClass$1([
  n2({ type: Array })
], QdPinResetDialog.prototype, "students", 2);
__decorateClass$1([
  n2({ type: Boolean, reflect: true })
], QdPinResetDialog.prototype, "open", 2);
__decorateClass$1([
  r()
], QdPinResetDialog.prototype, "searchText", 2);
__decorateClass$1([
  r()
], QdPinResetDialog.prototype, "confirmingStudent", 2);
__decorateClass$1([
  r()
], QdPinResetDialog.prototype, "confirmDialogOpen", 2);
__decorateClass$1([
  r()
], QdPinResetDialog.prototype, "errorMessage", 2);
__decorateClass$1([
  n2({ type: Boolean })
], QdPinResetDialog.prototype, "showModal", 1);
QdPinResetDialog = __decorateClass$1([
  t$1("qd-pin-reset-dialog")
], QdPinResetDialog);
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i3 = decorators.length - 1, decorator; i3 >= 0; i3--)
    if (decorator = decorators[i3])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
let QdInstructor = class extends i$1 {
  constructor() {
    super(...arguments);
    this.unlocked = false;
    this.showScores = false;
    this.students = [];
    this.showStudentAnswers = false;
    this.showPinReset = false;
    this.helpOpen = false;
    this.handleLoginEvent = (event) => {
      const customEvent = event;
      const role = customEvent.detail?.role;
      this.updateVisibility();
      if (role === "instructor") {
        this.unlock();
        void this.loadStudents();
      }
    };
    this.handleLogoutEvent = () => {
      this.updateVisibility();
      this.lock();
    };
    this.handleResetPins = async () => {
      const session = getJSON(STORAGE_KEYS.SESSION);
      if (!session) return;
      try {
        const storageService = getStorageService();
        const students = await storageService.getStudentsByRelease(session.release);
        this.students = students;
      } catch (err) {
        console.error("Failed to load students:", err);
        this.students = [];
      }
      this.showPinReset = true;
    };
    this.handleClosePinReset = () => {
      this.showPinReset = false;
    };
    this.handlePinReset = () => {
      this.dispatchEvent(
        new CustomEvent("qd:pin-reset", {
          bubbles: true,
          composed: true
        })
      );
    };
    this.handleUnlock = () => {
      this.unlocked = true;
      this.dispatchEvent(
        new CustomEvent("qd:instructor-unlock", {
          bubbles: true,
          composed: true
        })
      );
    };
    this.handleViewScores = async () => {
      const session = getJSON(STORAGE_KEYS.SESSION);
      if (!session) return;
      try {
        const storageService = getStorageService();
        const students = await storageService.getStudentsByRelease(session.release);
        this.students = students;
      } catch (err) {
        console.error("Failed to load students:", err);
        this.students = [];
      }
      this.showScores = true;
    };
    this.handleCloseScores = () => {
      this.showScores = false;
    };
    this.handleDataCleared = () => {
      this.dispatchEvent(
        new CustomEvent("qd:data-cleared", {
          bubbles: true,
          composed: true
        })
      );
      this.students = [];
    };
    this.handleLogout = () => {
      const session = getJSON(STORAGE_KEYS.SESSION);
      const sessionService = new SessionService();
      sessionService.clearSession();
      this.dispatchEvent(
        new CustomEvent("qd:logout", {
          detail: {
            serviceId: session?.serviceId || "unknown"
          },
          bubbles: true,
          composed: true
        })
      );
    };
    this.handleToggleStudentAnswers = async (e2) => {
      const checkbox = e2.target;
      this.showStudentAnswers = checkbox.checked;
      if (this.showStudentAnswers && this.students.length === 0) {
        const session = getJSON(STORAGE_KEYS.SESSION);
        if (session) {
          try {
            const storageService = getStorageService();
            const students = await storageService.getStudentsByRelease(session.release);
            this.students = students;
          } catch (err) {
            console.error("Failed to load students for toggle:", err);
          }
        }
      }
      const eventName = this.showStudentAnswers ? "qd:instructor-show-answers" : "qd:instructor-hide-answers";
      this.dispatchEvent(
        new CustomEvent(eventName, {
          bubbles: true,
          composed: true
        })
      );
      sessionStorage.setItem("qd/instructor/showAnswers", String(this.showStudentAnswers));
    };
    this.handleHelpOpen = () => {
      this.helpOpen = true;
    };
    this.handleHelpClose = () => {
      this.helpOpen = false;
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.updateVisibility();
    const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === "true";
    if (isInstructor) {
      this.unlock();
      void this.loadStudents();
    }
    const savedState = sessionStorage.getItem("qd/instructor/showAnswers");
    if (savedState !== null) {
      this.showStudentAnswers = savedState === "true";
      if (this.showStudentAnswers && isInstructor) {
        setTimeout(() => {
          this.dispatchEvent(
            new CustomEvent("qd:instructor-show-answers", {
              bubbles: true,
              composed: true
            })
          );
        }, 100);
      }
    }
    document.addEventListener("qd:login", this.handleLoginEvent);
    document.addEventListener("qd:logout", this.handleLogoutEvent);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("qd:login", this.handleLoginEvent);
    document.removeEventListener("qd:logout", this.handleLogoutEvent);
  }
  /**
   * Update visibility based on instructor session state
   */
  updateVisibility() {
    const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === "true";
    if (isInstructor) {
      this.setAttribute("data-show", "");
    } else {
      this.removeAttribute("data-show");
    }
  }
  /**
   * Set student data for display
   */
  setStudents(students) {
    this.students = students;
  }
  /**
   * Load students from storage for current release
   */
  async loadStudents() {
    const session = getJSON(STORAGE_KEYS.SESSION);
    if (!session) return;
    try {
      const storageService = getStorageService();
      const students = await storageService.getStudentsByRelease(session.release);
      this.students = students;
    } catch (err) {
      console.error("Failed to load students:", err);
      this.students = [];
    }
  }
  /**
   * Unlock instructor panel (call after successful auth)
   */
  unlock() {
    this.unlocked = true;
  }
  /**
   * Lock instructor panel (call on logout)
   */
  lock() {
    this.unlocked = false;
    this.showScores = false;
    this.showPinReset = false;
  }
  render() {
    if (!this.unlocked) {
      return x`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `;
    }
    return x`
      <div class="instructor-panel">
        <div class="instructor-title">
          Instructor Mode
          <qd-help-trigger
            panelType="instructor"
            @qd:help-open=${this.handleHelpOpen}
          ></qd-help-trigger>
          <qd-build-info></qd-build-info>
        </div>

        <label class="toggle-label">
          <input
            type="checkbox"
            .checked=${this.showStudentAnswers}
            @change=${this.handleToggleStudentAnswers}
          />
          Show current answers
        </label>

        <button @click=${this.handleViewScores} class="primary compact">View All Scores</button>

        <button @click=${this.handleResetPins} class="secondary compact">Reset PINs</button>

        <qd-instructor-export .students=${this.students}></qd-instructor-export>

        <qd-instructor-manage @qd:data-cleared=${this.handleDataCleared}></qd-instructor-manage>

        <button @click=${this.handleLogout} class="logout">Logout</button>

        <qd-instructor-scores
          .students=${this.students}
          .showModal=${this.showScores}
          @close=${this.handleCloseScores}
        ></qd-instructor-scores>

        <qd-pin-reset-dialog
          .students=${this.students}
          .showModal=${this.showPinReset}
          @close=${this.handleClosePinReset}
          @qd:pin-reset=${this.handlePinReset}
        ></qd-pin-reset-dialog>

        <qd-help-popup
          .open=${this.helpOpen}
          .title=${getHelpContent("instructor").title}
          .content=${getHelpContent("instructor").body}
          @qd:modal-close=${this.handleHelpClose}
        ></qd-help-popup>
      </div>
    `;
  }
};
QdInstructor.styles = [
  sharedStyles,
  i$4`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `
];
__decorateClass([
  r()
], QdInstructor.prototype, "unlocked", 2);
__decorateClass([
  r()
], QdInstructor.prototype, "showScores", 2);
__decorateClass([
  r()
], QdInstructor.prototype, "students", 2);
__decorateClass([
  r()
], QdInstructor.prototype, "showStudentAnswers", 2);
__decorateClass([
  r()
], QdInstructor.prototype, "showPinReset", 2);
__decorateClass([
  r()
], QdInstructor.prototype, "helpOpen", 2);
QdInstructor = __decorateClass([
  t$1("qd-instructor")
], QdInstructor);
const DEFAULT_CONTAINERS = {
  /** Where to inject status panel (Oxygen WebHelp default) */
  statusPanel: ".wh_top_menu_and_indexterms_link"
};
function injectLoginComponent(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return null;
  }
  const login = document.createElement("qd-login");
  container.appendChild(login);
  return login;
}
function injectStatusComponent(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return null;
  }
  const status = document.createElement("qd-status");
  container.appendChild(status);
  return status;
}
function injectInstructorComponent(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return null;
  }
  const instructor = document.createElement("qd-instructor");
  container.appendChild(instructor);
  return instructor;
}
function injectComponents(config = {}) {
  const statusPanelContainer = config.statusPanelContainer || DEFAULT_CONTAINERS.statusPanel;
  injectLoginComponent(statusPanelContainer);
  injectStatusComponent(statusPanelContainer);
  injectInstructorComponent(statusPanelContainer);
}
const BADGE_CLASSES = {
  red: "qd-badge-red",
  amber: "qd-badge-amber",
  green: "qd-badge-green"
};
const STATE_TO_BADGE = {
  unstarted: "red",
  incomplete: "amber",
  complete: "green"
};
function applyBadge(link, state2) {
  Object.values(BADGE_CLASSES).forEach((className) => {
    link.classList.remove(className);
  });
  const badgeColor = STATE_TO_BADGE[state2];
  const badgeClass = BADGE_CLASSES[badgeColor];
  link.classList.add(badgeClass);
}
function getPageState(pageId, cache) {
  if (!pageId || !cache?.pages) {
    return "unstarted";
  }
  const pageData = cache.pages[pageId];
  return pageData?.state ?? "unstarted";
}
function updateLinkBadge(link) {
  const pageId = link.getAttribute("data-page-id");
  const cache = getJSON(STORAGE_KEYS.CACHE);
  const state2 = getPageState(pageId, cache);
  applyBadge(link, state2);
}
function updateAllBadges() {
  const links = document.querySelectorAll(".quizPageBtn");
  const cache = getJSON(STORAGE_KEYS.CACHE);
  const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === "true";
  if (!cache || isInstructor) {
    links.forEach((link) => {
      Object.values(BADGE_CLASSES).forEach((className) => {
        link.classList.remove(className);
      });
    });
    if (isInstructor) {
      info(`Removed badge styling from ${links.length} page links (instructor mode)`);
    } else {
      info(`Removed badge styling from ${links.length} page links (no session)`);
    }
    return;
  }
  links.forEach((link) => {
    updateLinkBadge(link);
  });
  info(`Updated ${links.length} page badges`);
}
function handleStateChanged(event) {
  const customEvent = event;
  const { pageId } = customEvent.detail;
  const link = document.querySelector(`[data-page-id="${pageId}"]`);
  if (link && link.classList.contains("quizPageBtn")) {
    updateLinkBadge(link);
  }
}
function handleCacheRebuild() {
  updateAllBadges();
}
function handleLogout() {
  const links = document.querySelectorAll(".quizPageBtn");
  links.forEach((link) => {
    Object.values(BADGE_CLASSES).forEach((className) => {
      link.classList.remove(className);
    });
  });
  info(`Removed badge styling from ${links.length} page links`);
}
function extractPageIdFromHref(link) {
  const href = link.getAttribute("href");
  if (!href) {
    return null;
  }
  const filename = href.substring(href.lastIndexOf("/") + 1);
  const pageId = filename.replace(/\.html?$/i, "");
  return pageId || null;
}
function enhanceHomeBadges() {
  const links = document.querySelectorAll(".quizPageBtn");
  links.forEach((link) => {
    const pageId = extractPageIdFromHref(link);
    if (pageId) {
      link.setAttribute("data-page-id", pageId);
      info(`Set data-page-id="${pageId}" for link: ${link.textContent?.trim()}`);
    } else {
      info(`Failed to extract pageId from href: ${link.getAttribute("href")}`);
    }
  });
  updateAllBadges();
  document.addEventListener("qd:state-changed", handleStateChanged);
  document.addEventListener("qd:cache-rebuild", handleCacheRebuild);
  document.addEventListener("qd:logout", handleLogout);
}
function injectGlobalStyles() {
  if (document.getElementById("qd-global-styles")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "qd-global-styles";
  style.textContent = `
    /* Sonar Quiz System - Global Styles */
    .qd-hidden {
      display: none !important;
    }

    /* Quiz table interactive mode styles */
    .qd-quiz-interactive .qd-quiz-input {
      width: 100%;
      padding: 0.5rem;
      font-size: inherit;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    /* Ensure select elements inherit font properly */
    .qd-quiz-interactive select.qd-quiz-input {
      font-family: inherit;
      font-size: inherit;
    }

    /* Validation styling for answer cells */
    .qd-quiz-interactive .qd-answer-correct {
      background-color: #d4edda !important;
      border-color: #28a745 !important;
    }

    .qd-quiz-interactive .qd-answer-incorrect {
      background-color: #f8d7da !important;
      border-color: #dc3545 !important;
    }

    /* Home page badge styles (R/A/G indicators) */
    .qd-badge-red {
      border-left: 4px solid #d32f2f !important;
      background-color: #ffebee !important;
    }

    .qd-badge-amber {
      border-left: 4px solid #ff9800 !important;
      background-color: #fff3e0 !important;
    }

    .qd-badge-green {
      border-left: 4px solid #4caf50 !important;
      background-color: #e8f5e9 !important;
    }

    /* Instructor mode: Student answers display */
    .qd-student-answers {
      margin-top: 12px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }

    .qd-student-answer {
      font-size: 12px;
      padding: 4px 0;
      line-height: 1.4;
    }

    .qd-student-answer.qd-correct {
      color: #28a745;
    }

    .qd-student-answer.qd-incorrect {
      color: #dc3545;
    }

    .qd-student-name {
      font-weight: 600;
    }

    .qd-student-answer-text {
      margin: 0 4px;
    }

    .qd-timestamp {
      color: #6c757d;
      font-size: 11px;
      margin-left: 8px;
    }

    /* Modal error message styles (needed because qd-modal moves to body) */
    .error-message {
      color: #d32f2f;
      font-size: 12px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
      border-left: 3px solid #d32f2f;
    }
  `;
  document.head.appendChild(style);
}
const state = {
  initialized: false
};
async function bootstrap(config = {}) {
  if (state.initialized) {
    warn("Bootstrap already initialized, skipping");
    return;
  }
  injectGlobalStyles();
  if (!config.dbName) {
    const msg = "FATAL: dbName not provided in bootstrap config. Processing stopped.";
    console.error(msg);
    throw new Error(msg);
  }
  const storageService = getStorageService(config.dbName);
  await storageService.init();
  const eventCoordinator = new EventCoordinator();
  eventCoordinator.initialize();
  state.eventCoordinator = eventCoordinator;
  const sessionCoordinator = new SessionCoordinator();
  sessionCoordinator.initialize();
  state.sessionCoordinator = sessionCoordinator;
  injectComponents({
    statusPanelContainer: config.statusPanelContainer,
    dbName: config.dbName
  });
  if (config.autoEnhanceQuizTables !== false) {
    enhanceAllQuizTables();
  }
  if (config.autoEnhanceAnalysisTables !== false) {
    enhanceAllAnalysisTables();
  }
  if (config.autoEnhanceHomeBadges !== false) {
    enhanceHomeBadgesIfPresent();
  }
  await checkExistingSessionAndUpgradeTables();
  document.addEventListener("qd:login", (event) => {
    const detail = event.detail;
    if (detail?.role === "instructor") {
      revealQuizAnswersForInstructor();
    }
  });
  state.initialized = true;
}
function enhanceAllQuizTables() {
  const tables = document.querySelectorAll("table.qd-quiz");
  if (tables.length === 0) {
    return;
  }
  info(`Enhancing ${tables.length} quiz table(s) in non-interactive mode...`);
  let enhanced = 0;
  for (const table of Array.from(tables)) {
    try {
      enhanceQuizTable(table, { interactive: false });
      enhanced++;
    } catch (err) {
      warn(`Failed to enhance quiz table: ${err.message}`);
    }
  }
  info(`Enhanced ${enhanced} of ${tables.length} quiz table(s) (non-interactive)`);
}
function enhanceAllAnalysisTables() {
  const tables = document.querySelectorAll("table.qd-analysis");
  if (tables.length === 0) {
    return;
  }
  info(`Enhancing ${tables.length} analysis table(s) in non-interactive mode...`);
  let enhanced = 0;
  for (const table of Array.from(tables)) {
    try {
      enhanceAnalysisTable(table, { interactive: false });
      enhanced++;
    } catch (err) {
      warn(`Failed to enhance analysis table: ${err.message}`);
    }
  }
  info(`Enhanced ${enhanced} of ${tables.length} analysis table(s) (non-interactive)`);
}
function enhanceHomeBadgesIfPresent() {
  const links = document.querySelectorAll(".quizPageBtn");
  if (links.length === 0) {
    return;
  }
  info(`Enhancing home page badges for ${links.length} link(s)...`);
  try {
    enhanceHomeBadges();
    info("Home page badges enhanced");
  } catch (err) {
    warn(`Failed to enhance home badges: ${err.message}`);
  }
}
function revealQuizAnswersForInstructor() {
  const pathname = window.location.pathname;
  const filename = pathname.substring(pathname.lastIndexOf("/") + 1);
  const pageId = filename.replace(/\.html?$/i, "");
  const quizTables = document.querySelectorAll("table.qd-quiz");
  if (quizTables.length === 0) {
    return;
  }
  quizTables.forEach((table) => {
    const metadata = getQuizTableMetadata(table);
    if (!metadata) return;
    metadata.pageId = pageId;
    table.classList.add("qd-quiz-instructor");
    const answerCells = table.querySelectorAll("td:nth-child(2), th:nth-child(2)");
    answerCells.forEach((cell) => {
      cell.classList.remove("qd-hidden");
    });
    const answerDataCells = table.querySelectorAll("tbody td:nth-child(2)");
    answerDataCells.forEach((cell, index) => {
      const question = metadata.parsed.questions[index];
      if (question && cell instanceof HTMLTableCellElement) {
        cell.textContent = question.correctAnswer;
      }
    });
    const detailCells = table.querySelectorAll("td:nth-child(3), th:nth-child(3)");
    detailCells.forEach((cell) => cell.classList.remove("qd-hidden"));
    const showAnswersHandler = () => {
      void showStudentAnswersForTable(table, metadata);
    };
    const hideAnswersHandler = () => {
      hideStudentAnswersForTable(table);
    };
    document.addEventListener("qd:instructor-show-answers", showAnswersHandler);
    document.addEventListener("qd:instructor-hide-answers", hideAnswersHandler);
    const showAnswers = sessionStorage.getItem("qd/instructor/showAnswers") === "true";
    if (showAnswers) {
      void showAnswersHandler();
    }
  });
  info(`Revealed answers for instructor on ${quizTables.length} quiz table(s)`);
}
async function checkExistingSessionAndUpgradeTables() {
  const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === "true";
  if (isInstructor) {
    revealQuizAnswersForInstructor();
    return;
  }
  const session = getJSON(STORAGE_KEYS.SESSION);
  if (!session) {
    return;
  }
  info(`Existing session detected for ${session.serviceId}, upgrading tables to interactive mode`);
  const storageService = getStorageService();
  let cache = getJSON(STORAGE_KEYS.CACHE);
  if (!cache) {
    try {
      const studentRecord = await storageService.loadStudentRecord(session);
      cache = storageService.buildCache(studentRecord);
      setJSON(STORAGE_KEYS.CACHE, cache);
      info(`Cache rebuilt from IndexedDB: ${cache.totals.total} total questions`);
    } catch {
      warn("Failed to rebuild cache from IndexedDB, using empty cache");
      cache = {
        totals: { total: 0, answered: 0, correct: 0 },
        pages: {}
      };
      setJSON(STORAGE_KEYS.CACHE, cache);
    }
  }
  const pathname = window.location.pathname;
  const filename = pathname.substring(pathname.lastIndexOf("/") + 1);
  const pageId = filename.replace(/\.html?$/i, "");
  if (!pageId) {
    return;
  }
  const quizTables = document.querySelectorAll("table.qd-quiz");
  if (quizTables.length > 0) {
    info(`Upgrading ${quizTables.length} quiz table(s) to interactive mode...`);
    quizTables.forEach((table) => {
      enhanceQuizTable(table, { interactive: true, pageId });
    });
  }
  const analysisTables = document.querySelectorAll("table.qd-analysis");
  if (analysisTables.length > 0) {
    info(`Upgrading ${analysisTables.length} analysis table(s) to interactive mode...`);
    analysisTables.forEach((table) => {
      enhanceAnalysisTable(table, { interactive: true, pageId });
    });
  }
}
function cleanup() {
  if (!state.initialized) {
    warn("Bootstrap not initialized, nothing to cleanup");
    return;
  }
  state.eventCoordinator?.cleanup();
  state.sessionCoordinator?.cleanup();
  state.initialized = false;
  state.eventCoordinator = void 0;
  state.sessionCoordinator = void 0;
}
function isInitialized() {
  return state.initialized;
}
const VERSION = "0.1.0-phase3.1";
const BUILD_DATE = "28/Nov/2025";
if (typeof window !== "undefined") {
  const init = () => {
    const domConfig = readDOMConfig();
    bootstrap({
      dbName: domConfig.dbName,
      statusPanelContainer: domConfig.statusPanelContainer,
      autoEnhanceQuizTables: true,
      autoEnhanceAnalysisTables: true,
      autoEnhanceHomeBadges: true
    }).catch((err) => {
      console.error("[FATAL] Bootstrap failed:", err);
    });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }
}
export {
  BUILD_DATE,
  DEFAULT_CONTAINERS,
  Debouncer,
  OBFUSCATION_PREFIX,
  SCHEMA_VERSION,
  SESSION_TIMEOUT_MS,
  STORAGE_KEYS,
  VERSION,
  bootstrap,
  calculateCompletionState,
  cleanup,
  clearQuizData,
  decode,
  deriveKey,
  encode,
  enhanceAnalysisTable,
  enhanceQuizTable,
  error,
  generateCellKey,
  generateTableId,
  getAnalysisTableMetadata,
  getJSON,
  getQuizTableMetadata,
  info,
  injectComponents,
  isAnalysisTableEnhanced,
  isCellEditable,
  isInitialized,
  isObfuscated,
  isQuizTableEnhanced,
  migrateObfuscation,
  parseAnalysisTable,
  parseQuizTable,
  setJSON,
  validateAnswer,
  warn
};
//# sourceMappingURL=sonar-quiz.esm.js.map
