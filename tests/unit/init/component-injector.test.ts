/**
 * Unit tests for component injection (src/init/component-injector.ts)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { infoMock } = vi.hoisted(() => ({ infoMock: vi.fn() }));

vi.mock('../../../src/utils/logger.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/logger.js')>();
  return { ...actual, info: infoMock };
});

import {
  DEFAULT_CONTAINERS,
  injectComponents,
  injectLoginComponent,
  injectStatusComponent,
  injectInstructorComponent,
} from '../../../src/init/component-injector.js';

function addContainer(className: string): HTMLElement {
  const container = document.createElement('nav');
  container.className = className;
  document.body.appendChild(container);
  return container;
}

describe('component-injector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    infoMock.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('DEFAULT_CONTAINERS', () => {
    it('defaults the status panel container to the Oxygen WebHelp navbar', () => {
      expect(DEFAULT_CONTAINERS.statusPanel).toBe('.wh_top_menu_and_indexterms_link');
    });
  });

  describe('individual injectors', () => {
    it('injectLoginComponent appends <qd-login> and returns it', () => {
      const container = addContainer('target');

      const el = injectLoginComponent('.target');

      expect(el).not.toBeNull();
      expect(el?.tagName.toLowerCase()).toBe('qd-login');
      expect(el?.parentElement).toBe(container);
      expect(infoMock).toHaveBeenCalledWith('Login component injected');
    });

    it('injectStatusComponent appends <qd-status> and returns it', () => {
      const container = addContainer('target');

      const el = injectStatusComponent('.target');

      expect(el?.tagName.toLowerCase()).toBe('qd-status');
      expect(el?.parentElement).toBe(container);
      expect(infoMock).toHaveBeenCalledWith('Status component injected');
    });

    it('injectInstructorComponent appends <qd-instructor> and returns it', () => {
      const container = addContainer('target');

      const el = injectInstructorComponent('.target');

      expect(el?.tagName.toLowerCase()).toBe('qd-instructor');
      expect(el?.parentElement).toBe(container);
      expect(infoMock).toHaveBeenCalledWith('Instructor component injected');
    });

    it('each injector returns null and logs when the selector misses', () => {
      expect(injectLoginComponent('.missing')).toBeNull();
      expect(injectStatusComponent('.missing')).toBeNull();
      expect(injectInstructorComponent('.missing')).toBeNull();

      expect(document.querySelector('qd-login')).toBeNull();
      expect(document.querySelector('qd-status')).toBeNull();
      expect(document.querySelector('qd-instructor')).toBeNull();

      expect(infoMock).toHaveBeenCalledWith(
        "Login component not injected: container '.missing' not found",
      );
      expect(infoMock).toHaveBeenCalledWith(
        "Status component not injected: container '.missing' not found",
      );
      expect(infoMock).toHaveBeenCalledWith(
        "Instructor component not injected: container '.missing' not found",
      );
    });
  });

  describe('injectComponents()', () => {
    it('appends qd-login, qd-status and qd-instructor into the configured container, in order', () => {
      const container = addContainer('custom-nav');

      injectComponents({ statusPanelContainer: '.custom-nav' });

      const tags = Array.from(container.children).map((c) => c.tagName.toLowerCase());
      expect(tags).toEqual(['qd-login', 'qd-status', 'qd-instructor']);
    });

    it('falls back to the default container selector when none is configured', () => {
      const container = addContainer('wh_top_menu_and_indexterms_link');

      injectComponents();

      expect(container.querySelector('qd-login')).not.toBeNull();
      expect(container.querySelector('qd-status')).not.toBeNull();
      expect(container.querySelector('qd-instructor')).not.toBeNull();
    });

    it('treats an empty selector as "use default"', () => {
      const container = addContainer('wh_top_menu_and_indexterms_link');

      injectComponents({ statusPanelContainer: '' });

      expect(container.children).toHaveLength(3);
    });

    it('injects nothing (and logs each miss) when the container selector misses', () => {
      addContainer('something-else');

      injectComponents({ statusPanelContainer: '.does-not-exist' });

      expect(document.querySelectorAll('qd-login, qd-status, qd-instructor')).toHaveLength(0);
      const messages = infoMock.mock.calls.map((c) => String(c[0]));
      expect(messages.filter((m) => m.includes("'.does-not-exist' not found"))).toHaveLength(3);
    });

    it('does not touch other containers on the page', () => {
      const target = addContainer('target');
      const other = addContainer('other');

      injectComponents({ statusPanelContainer: '.target' });

      expect(target.children).toHaveLength(3);
      expect(other.children).toHaveLength(0);
    });

    it('has no idempotence guard: a second call appends a second set of components', () => {
      // Characterization: injectComponents() does not check for existing
      // components. bootstrap() guarantees it only runs once per page.
      const container = addContainer('target');

      injectComponents({ statusPanelContainer: '.target' });
      injectComponents({ statusPanelContainer: '.target' });

      expect(container.querySelectorAll('qd-login')).toHaveLength(2);
      expect(container.querySelectorAll('qd-status')).toHaveLength(2);
      expect(container.querySelectorAll('qd-instructor')).toHaveLength(2);
    });
  });
});
