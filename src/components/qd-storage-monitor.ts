/**
 * Storage Monitor Component
 *
 * Development tool for monitoring browser storage state in real-time.
 * Displays sessionStorage, IndexedDB entries with qd prefix.
 * Toggle visibility with Ctrl+Shift+D.
 *
 * Configuration:
 * - `dbName` attribute: Set the IndexedDB database name to monitor (default: 'quiz-scores')
 *
 * Example usage:
 * ```html
 * <!-- Use default database name -->
 * <qd-storage-monitor></qd-storage-monitor>
 *
 * <!-- Specify custom database name -->
 * <qd-storage-monitor dbName="SonarQuizDB"></qd-storage-monitor>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

interface StorageEntry {
  key: string;
  value: unknown;
  size: number;
  expanded?: boolean;
}

interface IndexedDBEntry {
  key: string;
  value: unknown;
  size: number;
  expanded?: boolean;
}

@customElement('qd-storage-monitor')
export class StorageMonitor extends LitElement {
  /**
   * IndexedDB database name to monitor
   * @default 'quiz-scores'
   */
  @property({ type: String })
  dbName = 'quiz-scores';

  @state()
  private visible = true;

  @state()
  private sessionEntries: StorageEntry[] = [];

  @state()
  private indexedDBEntries: IndexedDBEntry[] = [];

  @state()
  private sessionExpanded = true;

  @state()
  private indexedDBExpanded = true;

  private keyboardHandler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      this.visible = !this.visible;
    }
  };

  connectedCallback(): void {
    super.connectedCallback();

    // Listen for keyboard shortcut
    window.addEventListener('keydown', this.keyboardHandler);

    // Listen for qd:* events
    window.addEventListener('qd:login', () => {
      void this.refreshData();
    });
    window.addEventListener('qd:logout', () => {
      void this.refreshData();
    });
    window.addEventListener('qd:answer-saved', () => {
      void this.refreshData();
    });
    window.addEventListener('qd:state-changed', () => {
      void this.refreshData();
    });
    window.addEventListener('qd:instructor-unlock', () => {
      void this.refreshData();
    });
    window.addEventListener('qd:instructor-lock', () => {
      void this.refreshData();
    });
    window.addEventListener('qd:data-cleared', () => {
      void this.refreshData();
    });

    // Initial load
    void this.refreshData();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.keyboardHandler);
  }

  private async refreshData(): Promise<void> {
    this.sessionEntries = this.readSessionStorage();
    this.indexedDBEntries = await this.readIndexedDB();
  }

  private readSessionStorage(): StorageEntry[] {
    const entries: StorageEntry[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('qd')) {
        const value = sessionStorage.getItem(key);
        if (value) {
          try {
            entries.push({
              key,
              value: JSON.parse(value),
              size: new Blob([value]).size,
              expanded: false,
            });
          } catch {
            entries.push({
              key,
              value,
              size: new Blob([value]).size,
              expanded: false,
            });
          }
        }
      }
    }

    return entries.sort((a, b) => a.key.localeCompare(b.key));
  }

  private async readIndexedDB(): Promise<IndexedDBEntry[]> {
    try {
      const db = await this.openDatabase(this.dbName);
      const entries: IndexedDBEntry[] = [];

      // Check if 'students' object store exists before trying to read it
      if (!db.objectStoreNames.contains('students')) {
        db.close();
        return []; // Database exists but schema not initialized yet (user not logged in)
      }

      const transaction = db.transaction(['students'], 'readonly');
      const store = transaction.objectStore('students');
      const request = store.openCursor();

      await new Promise<void>((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (cursor) {
            const key = cursor.key as string;
            if (key.startsWith('qd')) {
              const value = cursor.value as unknown;
              const size = new Blob([JSON.stringify(value)]).size;
              entries.push({
                key,
                value,
                size,
                expanded: false,
              });
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB error'));
      });

      db.close();
      return entries.sort((a, b) => a.key.localeCompare(b.key));
    } catch (error) {
      console.warn('Failed to read IndexedDB:', error);
      return [];
    }
  }

  private openDatabase(dbName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      // Open without specifying version to avoid creating/upgrading the database
      // This allows us to read from existing database without interfering with initialization
      const request = indexedDB.open(dbName);

      request.onsuccess = () => {
        const db = request.result;
        // Check if database has expected object stores
        // If not, it means the database hasn't been properly initialized yet
        if (!db.objectStoreNames.contains('students')) {
          db.close();
          reject(new Error('Database not initialized - missing students object store'));
          return;
        }
        resolve(db);
      };

      request.onerror = () =>
        reject(new Error(request.error?.message || 'Failed to open database'));

      // Important: Don't add onupgradeneeded handler here
      // We don't want the storage monitor to create/upgrade the database schema
    });
  }

  private toggleEntryExpansion(entries: StorageEntry[], key: string): void {
    const entry = entries.find((e) => e.key === key);
    if (entry) {
      entry.expanded = !entry.expanded;
      this.requestUpdate();
    }
  }

  private clearSessionStorage(): void {
    if (confirm('Clear all qd-prefixed sessionStorage data?')) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('qd')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
      void this.refreshData();
    }
  }

  private clearSessionKey(key: string): void {
    if (confirm(`Clear sessionStorage key: ${key}?`)) {
      sessionStorage.removeItem(key);
      void this.refreshData();
    }
  }

  private async clearIndexedDB(): Promise<void> {
    if (confirm('Clear all qd-prefixed IndexedDB data?')) {
      try {
        const db = await this.openDatabase(this.dbName);
        const transaction = db.transaction(['students'], 'readwrite');
        const store = transaction.objectStore('students');

        const keysToDelete: string[] = [];
        const cursorRequest = store.openCursor();

        await new Promise<void>((resolve, reject) => {
          cursorRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
            if (cursor) {
              const key = cursor.key as string;
              if (key.startsWith('qd')) {
                keysToDelete.push(key);
              }
              cursor.continue();
            } else {
              resolve();
            }
          };
          cursorRequest.onerror = () =>
            reject(new Error(cursorRequest.error?.message || 'Cursor error'));
        });

        for (const key of keysToDelete) {
          store.delete(key);
        }

        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () =>
            reject(new Error(transaction.error?.message || 'Transaction error'));
        });

        db.close();
        void this.refreshData();
      } catch (error) {
        console.error('Failed to clear IndexedDB:', error);
        alert('Failed to clear IndexedDB');
      }
    }
  }

  private async clearIndexedDBKey(key: string): Promise<void> {
    if (confirm(`Clear IndexedDB key: ${key}?`)) {
      try {
        const db = await this.openDatabase(this.dbName);
        const transaction = db.transaction(['students'], 'readwrite');
        const store = transaction.objectStore('students');
        store.delete(key);

        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () =>
            reject(new Error(transaction.error?.message || 'Transaction error'));
        });

        db.close();
        void this.refreshData();
      } catch (error) {
        console.error('Failed to clear IndexedDB key:', error);
        alert('Failed to clear IndexedDB key');
      }
    }
  }

  private renderValue(value: unknown, depth = 0): unknown {
    if (value === null) {
      return html`<span class="value-null">null</span>`;
    }

    if (value === undefined) {
      return html`<span class="value-undefined">undefined</span>`;
    }

    if (typeof value === 'string') {
      return html`<span class="value-string">"${value}"</span>`;
    }

    if (typeof value === 'number') {
      return html`<span class="value-number">${value}</span>`;
    }

    if (typeof value === 'boolean') {
      return html`<span class="value-boolean">${value}</span>`;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return html`<span class="value-array">[]</span>`;
      }
      return html`
        <div class="value-array">
          <span class="bracket">[</span>
          <div class="indent">
            ${value.map(
              (item, i) => html`
                <div class="array-item">
                  <span class="index">${i}:</span>
                  ${this.renderValue(item, depth + 1)}
                </div>
              `,
            )}
          </div>
          <span class="bracket">]</span>
        </div>
      `;
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) {
        return html`<span class="value-object">{}</span>`;
      }
      return html`
        <div class="value-object">
          <span class="bracket">{</span>
          <div class="indent">
            ${entries.map(
              ([k, v]) => html`
                <div class="object-entry">
                  <span class="key">${k}:</span>
                  ${this.renderValue(v, depth + 1)}
                </div>
              `,
            )}
          </div>
          <span class="bracket">}</span>
        </div>
      `;
    }

    // Fallback for unknown types - use JSON.stringify to ensure proper display
    const displayValue = JSON.stringify(value);
    return html`<span class="value-unknown">${displayValue}</span>`;
  }

  private renderEntry(entry: StorageEntry, onClear: () => void): unknown {
    return html`
      <div class="entry">
        <div class="entry-header">
          <button
            class="expand-btn"
            @click=${() => this.toggleEntryExpansion(this.sessionEntries, entry.key)}
          >
            ${entry.expanded ? '▼' : '▶'}
          </button>
          <span class="entry-key">${entry.key}</span>
          <span class="entry-size">${this.formatSize(entry.size)}</span>
          <button class="clear-btn" @click=${onClear}>✕</button>
        </div>
        ${entry.expanded
          ? html` <div class="entry-value">${this.renderValue(entry.value)}</div> `
          : ''}
      </div>
    `;
  }

  private renderIndexedDBEntry(entry: IndexedDBEntry): unknown {
    return html`
      <div class="entry">
        <div class="entry-header">
          <button
            class="expand-btn"
            @click=${() => this.toggleEntryExpansion(this.indexedDBEntries, entry.key)}
          >
            ${entry.expanded ? '▼' : '▶'}
          </button>
          <span class="entry-key">${entry.key}</span>
          <span class="entry-size">${this.formatSize(entry.size)}</span>
          <button class="clear-btn" @click=${() => this.clearIndexedDBKey(entry.key)}>✕</button>
        </div>
        ${entry.expanded
          ? html` <div class="entry-value">${this.renderValue(entry.value)}</div> `
          : ''}
      </div>
    `;
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  render() {
    if (!this.visible) {
      return html``;
    }

    return html`
      <div class="monitor">
        <div class="header">
          <h2>Storage Monitor</h2>
          <button class="close-btn" @click=${() => (this.visible = false)}>✕</button>
        </div>

        <div class="hint">Press Ctrl+Shift+D to toggle</div>

        <div class="section">
          <div class="section-header">
            <button
              class="expand-btn"
              @click=${() => (this.sessionExpanded = !this.sessionExpanded)}
            >
              ${this.sessionExpanded ? '▼' : '▶'}
            </button>
            <h3>sessionStorage</h3>
            <span class="count">(${this.sessionEntries.length})</span>
            <button class="clear-all-btn" @click=${() => this.clearSessionStorage()}>
              Clear All
            </button>
          </div>

          ${this.sessionExpanded
            ? html`
                <div class="entries">
                  ${this.sessionEntries.length === 0
                    ? html`<div class="empty">No qd-prefixed entries</div>`
                    : this.sessionEntries.map((entry) =>
                        this.renderEntry(entry, () => this.clearSessionKey(entry.key)),
                      )}
                </div>
              `
            : ''}
        </div>

        <div class="section">
          <div class="section-header">
            <button
              class="expand-btn"
              @click=${() => (this.indexedDBExpanded = !this.indexedDBExpanded)}
            >
              ${this.indexedDBExpanded ? '▼' : '▶'}
            </button>
            <h3>IndexedDB</h3>
            <span class="count">(${this.indexedDBEntries.length})</span>
            <button class="clear-all-btn" @click=${() => this.clearIndexedDB()}>Clear All</button>
          </div>

          ${this.indexedDBExpanded
            ? html`
                <div class="entries">
                  ${this.indexedDBEntries.length === 0
                    ? html`<div class="empty">No qd-prefixed entries</div>`
                    : this.indexedDBEntries.map((entry) => this.renderIndexedDBEntry(entry))}
                </div>
              `
            : ''}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      width: 400px;
      height: 100vh;
      font-family: monospace;
      font-size: 12px;
    }

    .monitor {
      width: 100%;
      height: 100%;
      background: #1e1e1e;
      color: #d4d4d4;
      display: flex;
      flex-direction: column;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: #252526;
      border-bottom: 1px solid #3e3e42;
    }

    .header h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #d4d4d4;
      font-size: 16px;
      cursor: pointer;
      padding: 4px 8px;
    }

    .close-btn:hover {
      background: #3e3e42;
    }

    .hint {
      padding: 8px 12px;
      font-size: 10px;
      color: #858585;
      background: #252526;
      border-bottom: 1px solid #3e3e42;
    }

    .section {
      border-bottom: 1px solid #3e3e42;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #2d2d30;
    }

    .section-header h3 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      flex: 1;
    }

    .count {
      font-size: 11px;
      color: #858585;
    }

    .clear-all-btn {
      background: #c5393a;
      border: none;
      color: white;
      font-size: 10px;
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 2px;
    }

    .clear-all-btn:hover {
      background: #d14344;
    }

    .entries {
      max-height: 400px;
      overflow-y: auto;
    }

    .empty {
      padding: 12px;
      color: #858585;
      font-style: italic;
    }

    .entry {
      border-bottom: 1px solid #3e3e42;
    }

    .entry-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #1e1e1e;
    }

    .entry-header:hover {
      background: #2d2d30;
    }

    .expand-btn {
      background: transparent;
      border: none;
      color: #d4d4d4;
      font-size: 10px;
      cursor: pointer;
      padding: 0;
      width: 16px;
      text-align: left;
    }

    .entry-key {
      flex: 1;
      font-weight: 500;
      color: #9cdcfe;
    }

    .entry-size {
      font-size: 10px;
      color: #858585;
    }

    .clear-btn {
      background: transparent;
      border: none;
      color: #858585;
      font-size: 12px;
      cursor: pointer;
      padding: 2px 6px;
    }

    .clear-btn:hover {
      color: #c5393a;
      background: #3e3e42;
    }

    .entry-value {
      padding: 8px 12px 8px 36px;
      background: #252526;
      font-size: 11px;
      overflow-x: auto;
    }

    .indent {
      margin-left: 16px;
    }

    .value-string {
      color: #ce9178;
    }

    .value-number {
      color: #b5cea8;
    }

    .value-boolean {
      color: #569cd6;
    }

    .value-null,
    .value-undefined {
      color: #569cd6;
      font-style: italic;
    }

    .value-array,
    .value-object {
      color: #d4d4d4;
    }

    .bracket {
      color: #d4d4d4;
    }

    .key {
      color: #9cdcfe;
      margin-right: 4px;
    }

    .index {
      color: #858585;
      margin-right: 4px;
    }

    .array-item,
    .object-entry {
      margin: 2px 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-storage-monitor': StorageMonitor;
  }
}
