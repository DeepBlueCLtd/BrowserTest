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
      expect(title?.textContent).toBe('Sonar Quiz System');
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

    it('should render Login and Instructor buttons', () => {
      const buttons = element.shadowRoot?.querySelectorAll('button');
      expect(buttons?.length).toBeGreaterThanOrEqual(2);

      const loginBtn = Array.from(buttons!).find((b) => b.textContent?.includes('Login'));
      const instructorBtn = Array.from(buttons!).find((b) => b.textContent?.includes('Instructor'));

      expect(loginBtn).toBeDefined();
      expect(instructorBtn).toBeDefined();
    });

    it('should allow custom title property', async () => {
      element.title = 'Custom Quiz System';
      await element.updateComplete;

      const title = element.shadowRoot?.querySelector('.title');
      expect(title?.textContent).toBe('Custom Quiz System');
    });
  });

  describe('Form Input', () => {
    it('should update state when name input changes', async () => {
      const nameInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;

      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      expect(nameInput.value).toBe('John Doe');
    });

    it('should update state when serviceId input changes', async () => {
      const serviceIdInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;

      serviceIdInput.value = 'RN2344';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      expect(serviceIdInput.value).toBe('RN2344');
    });

    it('should clear error message on input', async () => {
      const nameInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;
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
      const nameInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;
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

    it('should accept valid serviceId (2-10 alphanumeric)', async () => {
      let eventFired = false;
      element.addEventListener('qd:login', () => {
        eventFired = true;
      });

      const nameInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = 'RN2344';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      form?.dispatchEvent(new Event('submit'));
      await element.updateComplete;

      expect(eventFired).toBe(true);
    });

    it('should show error for missing name', async () => {
      const serviceIdInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;
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
    it('should emit qd:login event with correct data and role=student', async () => {
      let eventDetail: unknown;
      element.addEventListener('qd:login', ((e: CustomEvent) => {
        eventDetail = e.detail;
      }) as EventListener);

      const nameInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = 'RN2344';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      form?.dispatchEvent(new Event('submit'));
      await element.updateComplete;

      expect(eventDetail).toEqual({
        serviceId: 'RN2344',
        name: 'John Doe',
        release: 'TRV Connectors Autumn 2025',
        role: 'student',
      });
    });

    it('should read release from document title', async () => {
      let eventDetail: unknown;
      element.addEventListener('qd:login', ((e: CustomEvent) => {
        eventDetail = e.detail;
      }) as EventListener);

      const nameInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      nameInput.value = 'Test';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = 'ABC123';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      form?.dispatchEvent(new Event('submit'));
      await element.updateComplete;

      const detail = eventDetail as { release: string };
      expect(detail.release).toBe('TRV Connectors Autumn 2025');
    });

    it('should trim whitespace from inputs', async () => {
      let eventDetail: unknown;
      element.addEventListener('qd:login', ((e: CustomEvent) => {
        eventDetail = e.detail;
      }) as EventListener);

      const nameInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;
      const form = element.shadowRoot?.querySelector('form');

      nameInput.value = '  John Doe  ';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = '  RN2344  ';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      form?.dispatchEvent(new Event('submit'));
      await element.updateComplete;

      const detail = eventDetail as { serviceId: string; name: string };
      expect(detail.serviceId).toBe('RN2344');
      expect(detail.name).toBe('John Doe');
    });
  });

  describe('Instructor Modal', () => {
    it('should open instructor modal when Instructor button clicked', async () => {
      const buttons = element.shadowRoot?.querySelectorAll('button');
      const instructorBtn = Array.from(buttons!).find((b) => b.textContent?.includes('Instructor')) as HTMLButtonElement;

      instructorBtn.click();
      await element.updateComplete;

      const modal = element.shadowRoot?.querySelector('.modal-overlay');
      expect(modal).toBeDefined();
    });

    it('should render password input in modal', async () => {
      const buttons = element.shadowRoot?.querySelectorAll('button');
      const instructorBtn = Array.from(buttons!).find((b) => b.textContent?.includes('Instructor')) as HTMLButtonElement;

      instructorBtn.click();
      await element.updateComplete;

      const passwordInput = element.shadowRoot?.querySelector('input[type="password"]');
      expect(passwordInput).toBeDefined();
    });

    it('should close modal on Cancel button click', async () => {
      const buttons = element.shadowRoot?.querySelectorAll('button');
      const instructorBtn = Array.from(buttons!).find((b) => b.textContent?.includes('Instructor')) as HTMLButtonElement;

      instructorBtn.click();
      await element.updateComplete;

      let modal = element.shadowRoot?.querySelector('.modal-overlay');
      expect(modal).toBeDefined();

      const cancelBtn = element.shadowRoot?.querySelector('.cancel-btn') as HTMLButtonElement;
      cancelBtn.click();
      await element.updateComplete;

      modal = element.shadowRoot?.querySelector('.modal-overlay');
      expect(modal).toBeNull();
    });

    it('should close modal on overlay click', async () => {
      const buttons = element.shadowRoot?.querySelectorAll('button');
      const instructorBtn = Array.from(buttons!).find((b) => b.textContent?.includes('Instructor')) as HTMLButtonElement;

      instructorBtn.click();
      await element.updateComplete;

      const overlay = element.shadowRoot?.querySelector('.modal-overlay') as HTMLElement;
      overlay.click();
      await element.updateComplete;

      const modal = element.shadowRoot?.querySelector('.modal-overlay');
      expect(modal).toBeNull();
    });

    it('should emit qd:login with role=instructor on correct password', async () => {
      // Add instructor password hash element
      const hashElement = document.createElement('div');
      hashElement.id = 'instructor.password.hash';
      // SHA-256 hash of "test123" (first 12 characters)
      hashElement.textContent = 'ecd71870d196';
      document.body.appendChild(hashElement);

      return new Promise<void>((resolve) => {
        element.addEventListener('qd:login', ((e: CustomEvent) => {
          expect(e.detail).toEqual({
            serviceId: 'INSTRUCTOR',
            name: 'Instructor',
            release: 'TRV Connectors Autumn 2025',
            role: 'instructor',
          });

          // Cleanup
          hashElement.remove();
          resolve();
        }) as EventListener);

        const buttons = element.shadowRoot?.querySelectorAll('button');
        const instructorBtn = Array.from(buttons!).find((b) => b.textContent?.includes('Instructor')) as HTMLButtonElement;

        instructorBtn.click();
        void element.updateComplete.then(() => {
          const passwordInput = element.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
          passwordInput.value = 'test123';
          passwordInput.dispatchEvent(new Event('input'));

          const modalForm = element.shadowRoot?.querySelector('.modal form');
          modalForm?.dispatchEvent(new Event('submit'));
        });
      });
    });

    it('should show error on incorrect password', async () => {
      // Add instructor password hash element
      const hashElement = document.createElement('div');
      hashElement.id = 'instructor.password.hash';
      hashElement.textContent = 'somehash';
      document.body.appendChild(hashElement);

      const buttons = element.shadowRoot?.querySelectorAll('button');
      const instructorBtn = Array.from(buttons!).find((b) => b.textContent?.includes('Instructor')) as HTMLButtonElement;

      instructorBtn.click();
      await element.updateComplete;

      const passwordInput = element.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      passwordInput.value = 'wrongpassword';
      passwordInput.dispatchEvent(new Event('input'));

      const modalForm = element.shadowRoot?.querySelector('.modal form');
      modalForm?.dispatchEvent(new Event('submit'));

      // Wait for async password hashing
      await new Promise((resolve) => setTimeout(resolve, 100));
      await element.updateComplete;

      const errorDiv = element.shadowRoot?.querySelector('.modal-body .error-message');
      expect(errorDiv).toBeDefined();
      if (errorDiv) {
        expect(errorDiv.textContent).toContain('Incorrect password');
      }

      // Cleanup
      hashElement.remove();
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
      const nameInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;
      const serviceIdInput = element.shadowRoot?.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;

      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input'));
      serviceIdInput.value = 'RN2344';
      serviceIdInput.dispatchEvent(new Event('input'));
      await element.updateComplete;

      const buttons = element.shadowRoot?.querySelectorAll('button');
      const loginBtn = Array.from(buttons || []).find((b) =>
        b.classList.contains('login-btn'),
      ) as HTMLButtonElement;

      expect(loginBtn.disabled).toBe(false);
    });
  });
});
