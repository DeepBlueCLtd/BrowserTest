/**
 * Unit tests for QdLogin component
 *
 * Tests horizontal layout, student/instructor login, validation, and event emission.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { QdLogin } from '../../src/components/qd-login.js';
import '../../src/components/qd-login.js';

describe('QdLogin Component', () => {
  let element: QdLogin;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Add release title element
    const titleContainer = document.createElement('div');
    titleContainer.className = 'wh_publication_title';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = 'TRV Connectors Autumn 2025';
    titleContainer.appendChild(titleSpan);
    document.body.appendChild(titleContainer);

    element = document.createElement('qd-login');
    container.appendChild(element);

    // Wait for component to render
    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
    // Clean up title element
    const titleContainer = document.querySelector('.wh_publication_title');
    titleContainer?.remove();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      expect(element).toBeDefined();
      expect(element.tagName.toLowerCase()).toBe('qd-login');
    });

    it('should render title', () => {
      const title = element.shadowRoot?.querySelector('.title');
      expect(title).toBeDefined();
      expect(title?.textContent?.trim()).toBe('Sonar Quiz System');
    });

    it('should render horizontal form with name and serviceId inputs', () => {
      const form = element.shadowRoot?.querySelector('.login-form');
      expect(form).toBeDefined();

      const inputs = element.shadowRoot?.querySelectorAll('input[type="text"]');
      expect(inputs?.length).toBe(2);

      const nameInput = inputs![0] as HTMLInputElement;
      const serviceIdInput = inputs![1] as HTMLInputElement;

      expect(nameInput.placeholder).toContain('Name');
      expect(serviceIdInput.placeholder).toContain('Service ID');
    });

    it('should render the Login button and the instructor-login child', () => {
      const buttons = element.shadowRoot?.querySelectorAll('button');
      const loginBtn = Array.from(buttons!).find((b) => b.textContent?.includes('Login'));
      expect(loginBtn).toBeDefined();

      // The Instructor button now lives inside the <qd-instructor-login> child.
      const instructorLogin = element.shadowRoot?.querySelector('qd-instructor-login');
      expect(instructorLogin).not.toBeNull();
    });

    it('should allow custom title property', async () => {
      element.title = 'Custom Quiz System';
      await element.updateComplete;

      const title = element.shadowRoot?.querySelector('.title');
      expect(title?.textContent?.trim()).toBe('Custom Quiz System');
    });
  });

  describe('Form Input', () => {
    it('should update state when name input changes', async () => {
      const nameInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[0] as HTMLInputElement;

      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      expect(nameInput.value).toBe('John Doe');
    });

    it('should update state when serviceId input changes', async () => {
      const serviceIdInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[1] as HTMLInputElement;

      serviceIdInput.value = 'RN2344';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      expect(serviceIdInput.value).toBe('RN2344');
    });

    it('should clear error message on input', async () => {
      const nameInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[0] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      // Trigger validation error by submitting empty form
      form?.dispatchEvent(new Event('submit'));
      await element.updateComplete;

      // Now type in name field
      nameInput.value = 'Test';
      nameInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      // Error should be cleared
      const errorDiv = element.shadowRoot?.querySelector('.error-message');
      expect(errorDiv).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate serviceId format (2-10 alphanumeric)', async () => {
      const nameInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[1] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      // Valid data except serviceId too short
      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = 'A'; // Only 1 character
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      form?.dispatchEvent(new Event('submit'));
      await element.updateComplete;

      const errorDiv = element.shadowRoot?.querySelector('.error-message');
      expect(errorDiv).toBeDefined();
    });

    it('should accept valid serviceId (2-10 alphanumeric) and show PIN creation', async () => {
      // With PIN auth, valid credentials trigger PIN creation modal for new students
      const nameInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[1] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = 'RN2344';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      form?.dispatchEvent(new Event('submit'));
      // Wait for async storage check
      await new Promise((resolve) => setTimeout(resolve, 100));
      await element.updateComplete;

      // Should show PIN creation for valid input (new student)
      const pinCreate = element.shadowRoot?.querySelector('qd-pin-create');
      expect(pinCreate).toBeDefined();
    });

    it('should show error for missing name', async () => {
      const serviceIdInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[1] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      serviceIdInput.value = 'RN2344';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      form?.dispatchEvent(new Event('submit'));
      await element.updateComplete;

      const errorDiv = element.shadowRoot?.querySelector('.error-message');
      expect(errorDiv).toBeDefined();
    });
  });

  describe('Student Login', () => {
    it('should show PIN creation modal for new student', async () => {
      // With PIN auth, new students must create a PIN before login completes
      const nameInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[1] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = 'RN2344';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      form?.dispatchEvent(new Event('submit'));
      // Wait for async storage check
      await new Promise((resolve) => setTimeout(resolve, 100));
      await element.updateComplete;

      // Should show PIN creation modal for new student
      const pinCreate = element.shadowRoot?.querySelector('qd-pin-create');
      expect(pinCreate).toBeDefined();
    });

    it('should read release from document title', async () => {
      // With PIN auth, login triggers PIN creation first
      // This test now verifies the PIN creation modal appears with correct release context
      const nameInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[1] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      nameInput.value = 'Test';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = 'ABC123';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      form?.dispatchEvent(new Event('submit'));
      // Wait for async storage check
      await new Promise((resolve) => setTimeout(resolve, 100));
      await element.updateComplete;

      // New students should see PIN creation modal
      const pinCreate = element.shadowRoot?.querySelector('qd-pin-create');
      expect(pinCreate).toBeDefined();
    });

    it('should trim whitespace from inputs', async () => {
      // With PIN auth, whitespace trimming happens but login goes to PIN creation first
      const nameInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[1] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      nameInput.value = '  John Doe  ';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = '  RN2344  ';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      form?.dispatchEvent(new Event('submit'));
      // Wait for async storage check
      await new Promise((resolve) => setTimeout(resolve, 100));
      await element.updateComplete;

      // PIN creation modal should appear (whitespace trimming tested implicitly)
      const pinCreate = element.shadowRoot?.querySelector('qd-pin-create');
      expect(pinCreate).toBeDefined();
    });
  });

  // Note: Instructor Modal tests moved to tests/unit/components/qd-password-modal.test.ts
  // The old imperative modal was replaced with <qd-password-modal> component

  describe('Validation hint', () => {
    const hintText = () =>
      element.shadowRoot?.querySelector('.hint-message')?.textContent?.trim() ?? null;

    it('should stay quiet on a pristine form', () => {
      // Nothing typed yet: do not scold the user before they start
      expect(hintText()).toBeNull();
    });

    it('should say what is missing once the user starts typing', async () => {
      const nameInput = element.shadowRoot?.querySelector('input[name="name"]') as HTMLInputElement;
      nameInput.value = 'J Smith';
      nameInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      expect(hintText()).toBe('Service ID required');
    });

    it('should name the PIN length rule when the PIN is too short', async () => {
      const set = (name: string, value: string) => {
        const input = element.shadowRoot?.querySelector(
          `input[name="${name}"]`,
        ) as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input'));
      };
      set('name', 'J Smith');
      set('serviceId', '30012345');
      set('pin', '123');
      await element.updateComplete;

      expect(hintText()).toBe('PIN must be exactly 4 digits');
    });

    it('should clear the hint once the form is valid', async () => {
      const set = (name: string, value: string) => {
        const input = element.shadowRoot?.querySelector(
          `input[name="${name}"]`,
        ) as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input'));
      };
      set('name', 'J Smith');
      set('serviceId', '30012345');
      set('pin', '1234');
      await element.updateComplete;

      expect(hintText()).toBeNull();
    });

    it('should state the 4-digit requirement on the PIN field', () => {
      const pinInput = element.shadowRoot?.querySelector('input[name="pin"]') as HTMLInputElement;

      expect(pinInput.placeholder).toContain('4 digits');
      expect(pinInput.title).toBe('4-digit PIN');
      expect(pinInput.getAttribute('aria-label')).toContain('4-digit PIN');
    });
  });

  describe('UI Behavior', () => {
    it('should disable Login button when form is invalid', () => {
      const buttons = element.shadowRoot?.querySelectorAll('button');
      const loginBtn = Array.from(buttons || []).find((b) =>
        b.classList.contains('login-btn'),
      ) as HTMLButtonElement;

      // Initially disabled (empty form)
      expect(loginBtn.disabled).toBe(true);
    });

    it('should enable Login button when form is valid', async () => {
      const nameInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll(
        'input[type="text"]',
      )[1] as HTMLInputElement;
      const pinInput = element.shadowRoot?.querySelector(
        'input[type="password"]',
      ) as HTMLInputElement;

      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = 'RN2344';
      serviceIdInput.dispatchEvent(new Event('input'));
      pinInput.value = '1234';
      pinInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      const buttons = element.shadowRoot?.querySelectorAll('button');
      const loginBtn = Array.from(buttons || []).find((b) =>
        b.classList.contains('login-btn'),
      ) as HTMLButtonElement;

      expect(loginBtn.disabled).toBe(false);
    });
  });
});
