/**
 * Storage monitor component for development
 * Real-time inspection of IndexedDB and sessionStorage
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface StorageEntry {
  key: string;
  value: unknown;
  expanded: boolean;
}

/**
 * Development tool for monitoring browser storage
 *
 * Features:
 * - Real-time IndexedDB inspection
 * - SessionStorage viewer
 * - Expand/collapse JSON objects
 * - Clear individual keys or all storage
 * - Keyboard shortcut: Ctrl+Shift+D to toggle visibility
 * - Auto-injected when data-debug="true"
 *
 * @example
 * ```html
 * <qd-storage-monitor dbName="SonarQuizDB"></qd-storage-monitor>
 * ```
 */
@customElement('qd-storage-monitor')
export class QdStorageMonitor extends LitElement {
  static override styles = css`
    :host {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 400px;
      max-height: 500px;
      background: white;
      border: 2px solid #333;
      border-radius: 4px 0 0 0;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
    }

    :host([hidden]) {
      display: none;
    }

    .header {
      background: #333;
      color: white;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title {
      font-weight: bold;
    }

    .controls {
      display: flex;
      gap: 8px;
    }

    button {
      background: #555;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }

    button:hover {
      background: #777;
    }

    button.danger {
      background: #dc3545;
    }

    button.danger:hover {
      background: #c82333;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-weight: bold;
      margin-bottom: 4px;
      padding: 4px;
      background: #f0f0f0;
    }

    .entry {
      margin: 4px 0;
      padding: 4px;
      border-left: 2px solid #ddd;
      padding-left: 8px;
    }

    .entry-key {
      color: #0066cc;
      cursor: pointer;
      user-select: none;
    }

    .entry-key:hover {
      text-decoration: underline;
    }

    .entry-value {
      color: #666;
      margin-left: 16px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .entry-actions {
      margin-left: 16px;
      margin-top: 4px;
    }

    .empty {
      color: #999;
      font-style: italic;
    }
  `;

  @property({ type: String })
  dbName = 'quiz-scores';

  @property({ type: Boolean, reflect: true })
  hidden = true;

  @state()
  private visible = false;

  @state()
  private indexedDBEntries: StorageEntry[] = [];

  @state()
  private sessionStorageEntries: StorageEntry[] = [];

  private refreshInterval?: number;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setupKeyboardShortcut();
    this.startRefresh();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopRefresh();
  }

  private setupKeyboardShortcut(): void {
    const handler = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.toggleVisibility();
      }
    };
    document.addEventListener('keydown', handler);
  }

  private toggleVisibility(): void {
    this.visible = !this.visible;
    this.hidden = !this.visible;
  }

  private startRefresh(): void {
    this.refreshData();
    this.refreshInterval = window.setInterval(() => {
      this.refreshData();
    }, 1000);
  }

  private stopRefresh(): void {
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
    }
  }

  private async refreshData(): Promise<void> {
    await this.refreshIndexedDB();
    this.refreshSessionStorage();
  }

  private async refreshIndexedDB(): Promise<void> {
    try {
      const db = await this.openDatabase();
      const entries: StorageEntry[] = [];

      for (const storeName of Array.from(db.objectStoreNames)) {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        await new Promise<void>((resolve, reject) => {
          request.onsuccess = () => {
            const items = request.result as unknown[];
            items.forEach((item, index) => {
              entries.push({
                key: `${storeName}[${index}]`,
                value: item,
                expanded: false,
              });
            });
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      }

      this.indexedDBEntries = entries;
    } catch {
      this.indexedDBEntries = [];
    }
  }

  private refreshSessionStorage(): void {
    const entries: StorageEntry[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        try {
          const value = sessionStorage.getItem(key);
          entries.push({
            key,
            value: value ? JSON.parse(value) : value,
            expanded: false,
          });
        } catch {
          entries.push({
            key,
            value: sessionStorage.getItem(key),
            expanded: false,
          });
        }
      }
    }
    this.sessionStorageEntries = entries;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private handleToggleEntry = (entry: StorageEntry): void => {
    entry.expanded = !entry.expanded;
    this.requestUpdate();
  };

  private handleClearSessionStorage = (): void => {
    if (confirm('Clear all sessionStorage?')) {
      sessionStorage.clear();
      this.refreshData();
    }
  };

  private handleClearIndexedDB = async (): Promise<void> => {
    if (confirm(`Clear IndexedDB "${this.dbName}"?`)) {
      try {
        const db = await this.openDatabase();
        for (const storeName of Array.from(db.objectStoreNames)) {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.clear();
        }
        await this.refreshData();
      } catch (err) {
        console.error('Failed to clear IndexedDB:', err);
      }
    }
  };

  private handleClose = (): void => {
    this.visible = false;
    this.hidden = true;
  };

  private renderEntry(entry: StorageEntry): unknown {
    return html`
      <div class="entry">
        <div class="entry-key" @click=${() => this.handleToggleEntry(entry)}>
          ${entry.expanded ? '▼' : '▶'} ${entry.key}
        </div>
        ${entry.expanded ? html`
          <div class="entry-value">
            ${JSON.stringify(entry.value, null, 2)}
          </div>
        ` : ''}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="header">
        <span class="title">Storage Monitor (Ctrl+Shift+D)</span>
        <div class="controls">
          <button @click=${this.handleClose}>✕</button>
        </div>
      </div>
      <div class="content">
        <div class="section">
          <div class="section-title">
            IndexedDB: ${this.dbName}
            <button
              class="danger"
              @click=${this.handleClearIndexedDB}
              style="float: right; margin-top: -2px;"
            >
              Clear
            </button>
          </div>
          ${this.indexedDBEntries.length === 0
            ? html`<div class="empty">No entries</div>`
            : this.indexedDBEntries.map(e => this.renderEntry(e))}
        </div>

        <div class="section">
          <div class="section-title">
            sessionStorage
            <button
              class="danger"
              @click=${this.handleClearSessionStorage}
              style="float: right; margin-top: -2px;"
            >
              Clear
            </button>
          </div>
          ${this.sessionStorageEntries.length === 0
            ? html`<div class="empty">No entries</div>`
            : this.sessionStorageEntries.map(e => this.renderEntry(e))}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-storage-monitor': QdStorageMonitor;
  }
}
