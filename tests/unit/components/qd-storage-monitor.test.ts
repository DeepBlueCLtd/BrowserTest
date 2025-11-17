/**
 * Unit tests for qd-storage-monitor component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../src/components/qd-storage-monitor.js';
import type { QdStorageMonitor } from '../../../src/components/qd-storage-monitor.js';

describe('qd-storage-monitor', () => {
  let element: QdStorageMonitor;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-storage-monitor');
    container.appendChild(element);

    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
    sessionStorage.clear();
  });

  describe('rendering', () => {
    it('should render header with title', () => {
      const title = element.shadowRoot?.querySelector('.title');
      expect(title?.textContent).toContain('Storage Monitor');
    });

    it('should render close button', () => {
      const closeButton = element.shadowRoot?.querySelector('.controls button');
      expect(closeButton).toBeTruthy();
    });

    it('should render IndexedDB section', () => {
      const section = element.shadowRoot?.querySelector('.section .section-title');
      expect(section?.textContent).toContain('IndexedDB');
    });

    it('should render sessionStorage section', () => {
      const sections = element.shadowRoot?.querySelectorAll('.section .section-title');
      expect(sections?.[1]?.textContent).toContain('sessionStorage');
    });
  });

  describe('dbName property', () => {
    it('should have default dbName', () => {
      expect(element.dbName).toBe('quiz-scores');
    });

    it('should use custom dbName', async () => {
      element.dbName = 'CustomDB';
      await element.updateComplete;

      const section = element.shadowRoot?.querySelector('.section-title');
      expect(section?.textContent).toContain('CustomDB');
    });
  });

  describe('sessionStorage monitoring', () => {
    it('should show empty state when no data', () => {
      const empty = element.shadowRoot?.querySelectorAll('.empty');
      expect(empty?.length).toBeGreaterThan(0);
    });

    it('should display sessionStorage entries', async () => {
      sessionStorage.setItem('test-key', 'test-value');

      // Trigger refresh
      await new Promise(resolve => setTimeout(resolve, 1100));
      await element.updateComplete;

      const entries = element.shadowRoot?.querySelectorAll('.entry');
      expect(entries?.length).toBeGreaterThan(0);
    });
  });

  describe('visibility toggle', () => {
    it('should be hidden by default', () => {
      expect(element['visible']).toBe(false);
      expect(element.hidden).toBe(true);
    });

    it('should toggle visibility', async () => {
      element['toggleVisibility']();
      await element.updateComplete;

      expect(element['visible']).toBe(true);
      expect(element.hidden).toBe(false);

      element['toggleVisibility']();
      await element.updateComplete;

      expect(element['visible']).toBe(false);
      expect(element.hidden).toBe(true);
    });

    it('should hide when close button clicked', async () => {
      element['toggleVisibility']();
      await element.updateComplete;

      const closeButton = element.shadowRoot?.querySelector('.controls button') as HTMLButtonElement;
      closeButton?.click();
      await element.updateComplete;

      expect(element.hidden).toBe(true);
    });
  });

  describe('clear functionality', () => {
    beforeEach(() => {
      sessionStorage.setItem('test-key-1', 'value-1');
      sessionStorage.setItem('test-key-2', 'value-2');
    });

    it('should have clear button for sessionStorage', () => {
      const clearButtons = element.shadowRoot?.querySelectorAll('button.danger');
      expect(clearButtons?.length).toBeGreaterThan(0);
    });
  });

  describe('entry expansion', () => {
    beforeEach(async () => {
      sessionStorage.setItem('test', JSON.stringify({ foo: 'bar' }));
      await new Promise(resolve => setTimeout(resolve, 1100));
      await element.updateComplete;
    });

    it('should show collapsed entries by default', () => {
      const entryValue = element.shadowRoot?.querySelector('.entry-value');
      expect(entryValue).toBeNull();
    });
  });

  describe('keyboard shortcut', () => {
    it('should have documentation about Ctrl+Shift+D', () => {
      const title = element.shadowRoot?.querySelector('.title');
      expect(title?.textContent).toContain('Ctrl+Shift+D');
    });
  });
});
