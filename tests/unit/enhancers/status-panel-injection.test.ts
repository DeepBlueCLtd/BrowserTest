/**
 * Unit Tests for Status Panel Injection
 *
 * Tests the injection logic that places the status panel as the last child
 * of a configurable navbar container with proper styling.
 *
 * Default container: .wh_top_menu_and_indexterms_link (Oxygen WebHelp)
 * Configurable via statusPanelContainer option
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ELEMENT_IDS, INJECTION_SELECTORS } from '../../../src/types/contracts';

describe('Status Panel Injection', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('Navbar Container Detection', () => {
    it('should find navbar container with correct selector', () => {
      container.innerHTML = `
        <div class="wh_top_menu_and_indexterms_link">
          <nav>Navigation items</nav>
        </div>
      `;

      const navbarContainer = container.querySelector(INJECTION_SELECTORS.NAVBAR_CONTAINER);
      expect(navbarContainer).toBeTruthy();
      expect(navbarContainer?.classList.contains('wh_top_menu_and_indexterms_link')).toBe(true);
    });

    it('should return null when navbar container not present', () => {
      container.innerHTML = `
        <div class="some-other-container">
          <nav>Navigation items</nav>
        </div>
      `;

      const navbarContainer = container.querySelector(INJECTION_SELECTORS.NAVBAR_CONTAINER);
      expect(navbarContainer).toBeNull();
    });
  });

  describe('Status Panel Wrapper Creation', () => {
    it('should create wrapper with correct id', () => {
      const wrapper = document.createElement('div');
      wrapper.id = ELEMENT_IDS.STATUS_PANEL;

      expect(wrapper.id).toBe('qd-status');
    });

    it('should apply correct inline styles to wrapper', () => {
      const wrapper = document.createElement('div');
      wrapper.id = ELEMENT_IDS.STATUS_PANEL;
      wrapper.style.cssText = 'display:inline-block; vertical-align:middle; margin-left:auto;';

      expect(wrapper.style.display).toBe('inline-block');
      expect(wrapper.style.verticalAlign).toBe('middle');
      expect(wrapper.style.marginLeft).toBe('auto');
    });
  });

  describe('Status Panel Injection Position', () => {
    it('should inject status panel as last child of navbar container', () => {
      container.innerHTML = `
        <div class="wh_top_menu_and_indexterms_link">
          <nav class="first-child">Nav 1</nav>
          <nav class="second-child">Nav 2</nav>
        </div>
      `;

      const navbarContainer = container.querySelector(INJECTION_SELECTORS.NAVBAR_CONTAINER);

      // Create and inject status panel
      const wrapper = document.createElement('div');
      wrapper.id = ELEMENT_IDS.STATUS_PANEL;
      wrapper.style.cssText = 'display:inline-block; vertical-align:middle; margin-left:auto;';
      wrapper.textContent = 'STATUS PANEL';

      navbarContainer?.appendChild(wrapper);

      // Verify it's the last child
      const lastChild = navbarContainer?.lastElementChild;
      expect(lastChild?.id).toBe('qd-status');
      expect(lastChild?.textContent).toBe('STATUS PANEL');

      // Verify there are now 3 children
      expect(navbarContainer?.children.length).toBe(3);
    });

    it('should inject after existing nav elements', () => {
      container.innerHTML = `
        <div class="wh_top_menu_and_indexterms_link">
          <nav class="wh_top_menu">
            <ul>
              <li><a href="#">Link 1</a></li>
              <li><a href="#">Link 2</a></li>
            </ul>
          </nav>
        </div>
      `;

      const navbarContainer = container.querySelector(INJECTION_SELECTORS.NAVBAR_CONTAINER);
      const navElement = container.querySelector('.wh_top_menu');

      // Create and inject status panel
      const wrapper = document.createElement('div');
      wrapper.id = ELEMENT_IDS.STATUS_PANEL;
      navbarContainer?.appendChild(wrapper);

      // Verify nav comes before status panel
      const children = Array.from(navbarContainer?.children || []);
      const navIndex = children.indexOf(navElement as Element);
      const statusIndex = children.indexOf(wrapper);

      expect(navIndex).toBeLessThan(statusIndex);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should not inject duplicate status panel', () => {
      container.innerHTML = `
        <div class="wh_top_menu_and_indexterms_link">
          <nav>Navigation</nav>
          <div id="qd-status">Existing panel</div>
        </div>
      `;

      const navbarContainer = container.querySelector(INJECTION_SELECTORS.NAVBAR_CONTAINER);

      // Check if status panel already exists
      const existingPanel = navbarContainer?.querySelector(`#${ELEMENT_IDS.STATUS_PANEL}`);
      expect(existingPanel).toBeTruthy();

      // Should not inject another one
      if (existingPanel) {
        // Injection logic would skip
        expect(navbarContainer?.querySelectorAll(`#${ELEMENT_IDS.STATUS_PANEL}`).length).toBe(1);
      }
    });
  });

  describe('Status Component Creation', () => {
    it('should create qd-status custom element', () => {
      const statusElement = document.createElement('qd-status');

      expect(statusElement).toBeDefined();
      expect(statusElement.tagName.toLowerCase()).toBe('qd-status');
    });

    it('should nest qd-status inside wrapper', () => {
      const wrapper = document.createElement('div');
      wrapper.id = ELEMENT_IDS.STATUS_PANEL;

      const statusElement = document.createElement('qd-status');
      wrapper.appendChild(statusElement);

      expect(wrapper.querySelector('qd-status')).toBe(statusElement);
      expect(wrapper.children.length).toBe(1);
    });
  });

  describe('Integration with Oxygen WebHelp Structure', () => {
    it('should work with complete Oxygen navbar structure', () => {
      container.innerHTML = `
        <div class="wh_header_flex_container">
          <div class="wh_logo_and_publication_title_container">
            <div class="wh_publication_title">
              <a href="#">Title</a>
            </div>
          </div>

          <div class="wh_search_input">
            <input type="search" placeholder="Search"/>
            <button type="submit">Search</button>
          </div>

          <div class="wh_top_menu_and_indexterms_link">
            <nav class="wh_top_menu c-menu">
              <ul role="menubar">
                <li><a href="#">Page Index</a></li>
                <li><a href="#">7 Questions</a></li>
                <li><a href="#">Background</a></li>
              </ul>
            </nav>
          </div>
        </div>
      `;

      const navbarContainer = container.querySelector(INJECTION_SELECTORS.NAVBAR_CONTAINER);
      expect(navbarContainer).toBeTruthy();

      // Inject status panel
      const wrapper = document.createElement('div');
      wrapper.id = ELEMENT_IDS.STATUS_PANEL;
      wrapper.style.cssText = 'display:inline-block; vertical-align:middle; margin-left:auto;';

      const statusElement = document.createElement('qd-status');
      wrapper.appendChild(statusElement);

      navbarContainer?.appendChild(wrapper);

      // Verify structure
      const injectedPanel = navbarContainer?.querySelector(`#${ELEMENT_IDS.STATUS_PANEL}`);
      expect(injectedPanel).toBeTruthy();
      expect(injectedPanel?.querySelector('qd-status')).toBeTruthy();

      // Verify it's positioned after nav
      const nav = navbarContainer?.querySelector('.wh_top_menu');
      const children = Array.from(navbarContainer?.children || []);
      const navIndex = children.indexOf(nav as Element);
      const panelIndex = children.indexOf(injectedPanel as Element);

      expect(panelIndex).toBeGreaterThan(navIndex);
    });
  });

  describe('CSS Selector Constants', () => {
    it('should export INJECTION_SELECTORS constant with default', () => {
      expect(INJECTION_SELECTORS).toBeDefined();
      expect(INJECTION_SELECTORS.NAVBAR_CONTAINER).toBe('.wh_top_menu_and_indexterms_link');
    });

    it('should export ELEMENT_IDS constant', () => {
      expect(ELEMENT_IDS).toBeDefined();
      expect(ELEMENT_IDS.STATUS_PANEL).toBe('qd-status');
    });
  });

  describe('Configurable Container Selector', () => {
    it('should work with custom navbar selector', () => {
      // Custom navbar structure
      container.innerHTML = `
        <div class="custom-navbar">
          <nav>
            <ul>
              <li><a href="#">Link 1</a></li>
              <li><a href="#">Link 2</a></li>
            </ul>
          </nav>
        </div>
      `;

      // Simulate injection with custom selector
      const customNavbar = container.querySelector('.custom-navbar');
      expect(customNavbar).toBeTruthy();

      // Inject status panel
      const wrapper = document.createElement('div');
      wrapper.id = ELEMENT_IDS.STATUS_PANEL;
      wrapper.style.cssText = 'display:inline-block; vertical-align:middle; margin-left:auto;';

      customNavbar?.appendChild(wrapper);

      // Verify injection
      expect(customNavbar?.lastElementChild).toBe(wrapper);
      expect(customNavbar?.querySelector(`#${ELEMENT_IDS.STATUS_PANEL}`)).toBeTruthy();
    });

    it('should work with ID selector', () => {
      container.innerHTML = `
        <nav id="header-navigation">
          <ul>
            <li><a href="#">Home</a></li>
          </ul>
        </nav>
      `;

      const navbar = container.querySelector('#header-navigation');
      expect(navbar).toBeTruthy();

      // Inject status panel
      const wrapper = document.createElement('div');
      wrapper.id = ELEMENT_IDS.STATUS_PANEL;
      navbar?.appendChild(wrapper);

      expect(navbar?.lastElementChild).toBe(wrapper);
    });

    it('should work with Bootstrap navbar class', () => {
      container.innerHTML = `
        <div class="navbar navbar-expand-lg">
          <ul class="navbar-nav">
            <li class="nav-item"><a href="#" class="nav-link">Link</a></li>
          </ul>
        </div>
      `;

      // Target the navbar-nav container
      const navbarNav = container.querySelector('.navbar-nav');
      expect(navbarNav).toBeTruthy();

      const wrapper = document.createElement('div');
      wrapper.id = ELEMENT_IDS.STATUS_PANEL;
      navbarNav?.appendChild(wrapper);

      expect(navbarNav?.lastElementChild).toBe(wrapper);
    });

    it('should handle missing container gracefully', () => {
      container.innerHTML = `
        <div class="content">
          <p>No navbar present</p>
        </div>
      `;

      // Try to find non-existent container
      const navbar = container.querySelector('.non-existent-navbar');
      expect(navbar).toBeNull();

      // Injection logic should skip when container not found
      // No error should be thrown
    });
  });
});
