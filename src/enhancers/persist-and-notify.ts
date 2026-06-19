/**
 * Shared persist-and-notify step for the enhancers.
 *
 * The quiz and analysis persistence paths share the same tail: save the
 * student record to IndexedDB (warn on failure), rebuild the session cache,
 * persist it to sessionStorage, apply any DOM update, then emit events. This
 * helper centralizes that sequence.
 */

import type { StudentRecord, QuizEvents } from '../types/contracts.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import { getStorageService } from '../services/storage-service.js';
import { setJSON } from '../utils/storage-helpers.js';
import { emitCustomEvent } from '../utils/event-helpers.js';
import { warn } from '../utils/logger.js';

/** A custom event to emit after the record is persisted. */
export interface NotifyEvent {
  name: keyof QuizEvents;
  detail: unknown;
}

/** Options controlling the DOM update and events for {@link persistAndNotify}. */
export interface PersistAndNotifyOptions {
  /** Optional DOM update run after the cache is saved, before events fire. */
  onSavedDom?: () => void;
  /** Events to emit (in order) once the cache is saved. */
  events: NotifyEvent[];
}

/**
 * Persist a student record, refresh the session cache, update the DOM, and
 * emit events.
 *
 * @param record - The updated student record to persist
 * @param options - DOM update and events to fire
 */
export async function persistAndNotify(
  record: StudentRecord,
  options: PersistAndNotifyOptions,
): Promise<void> {
  const storageService = getStorageService();

  try {
    await storageService.saveStudentRecord(record);
  } catch (err) {
    warn('Failed to save student record to IndexedDB', err);
  }

  // Rebuild cache from the updated record and persist to sessionStorage
  const cache = storageService.buildCache(record);
  setJSON(STORAGE_KEYS.CACHE, cache);

  // Apply any DOM update, then emit events
  options.onSavedDom?.();
  const emit = emitCustomEvent as (name: keyof QuizEvents, detail: unknown) => void;
  for (const event of options.events) {
    emit(event.name, event.detail);
  }
}
