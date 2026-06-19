/**
 * IndexedDB request/transaction helpers.
 *
 * Collapse the hand-rolled `new Promise(...)` + `onsuccess`/`onerror`
 * scaffolding that the adapter repeated for every operation into two reusable
 * helpers. Quota errors are surfaced as {@link StorageQuotaError}; all other
 * failures as {@link StorageError} tagged with the operation name.
 */

import { StorageError, StorageQuotaError } from './adapter-utils.js';

/**
 * Wrap a single {@link IDBRequest} in a promise.
 *
 * @param request - The IndexedDB request
 * @param op - Operation name for error reporting
 * @returns The request result when it succeeds
 */
export function promisifyRequest<T>(request: IDBRequest<T>, op: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(toStorageError(request.error, op));
  });
}

/**
 * Run a single-store transaction and resolve with the request result.
 *
 * @param db - Open database connection
 * @param store - Object store name
 * @param mode - Transaction mode
 * @param fn - Builds the request against the object store
 * @param op - Operation name for error reporting
 * @returns The request result when both the request and transaction succeed
 */
export function runTransaction<T>(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
  fn: (objectStore: IDBObjectStore) => IDBRequest<T>,
  op: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let request: IDBRequest<T>;
    try {
      const transaction = db.transaction(store, mode);
      const objectStore = transaction.objectStore(store);
      request = fn(objectStore);
      transaction.onerror = () => reject(toStorageError(transaction.error, op));
    } catch (error) {
      reject(new StorageError(`Failed during ${op}`, op, error as Error));
      return;
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(toStorageError(request.error, op));
  });
}

/**
 * Convert a DOMException from IndexedDB into the appropriate storage error.
 */
function toStorageError(error: DOMException | null, op: string): Error {
  if (error?.name === 'QuotaExceededError') {
    return new StorageQuotaError(op);
  }
  return new StorageError(`Failed during ${op}`, op, error as Error);
}
