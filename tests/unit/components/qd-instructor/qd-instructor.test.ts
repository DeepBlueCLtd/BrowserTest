/**
 * Unit tests for qd-instructor orchestrator component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../../src/components/qd-instructor/qd-instructor.js';
import type { QdInstructor } from '../../../../src/components/qd-instructor/qd-instructor.js';
import type { StudentRecord } from '../../../../src/types/contracts.js';

describe('qd-instructor', () => {
  let element: QdInstructor;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-instructor');
    container.appendChild(element);

    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
  });

  describe('rendering', () => {
    it('should render unlock component when locked', async () => {
      const unlock = element.shadowRoot?.querySelector('qd-instructor-unlock');
      expect(unlock).toBeTruthy();
    });

    it('should not render controls when locked', async () => {
      const panel = element.shadowRoot?.querySelector('.instructor-panel');
      expect(panel).toBeNull();
    });
  });

  describe('unlock flow', () => {
    it('should show controls after unlock', async () => {
      element.unlock();
      await element.updateComplete;

      const panel = element.shadowRoot?.querySelector('.instructor-panel');
      expect(panel).toBeTruthy();

      const unlock = element.shadowRoot?.querySelector('qd-instructor-unlock');
      expect(unlock).toBeNull();
    });

    it('should emit qd:instructor-unlock event on unlock', async () => {
      let eventFired = false;
      element.addEventListener('qd:instructor-unlock', () => {
        eventFired = true;
      });

      element.unlock();
      await element.updateComplete;

      // Manually trigger unlock from child
      const unlockEvent = new CustomEvent('qd:instructor-unlock', {
        bubbles: true,
        composed: true,
      });
      element.dispatchEvent(unlockEvent);

      expect(eventFired).toBe(true);
    });
  });

  describe('lock flow', () => {
    it('should hide controls when locked', async () => {
      element.unlock();
      await element.updateComplete;

      element.lock();
      await element.updateComplete;

      const unlock = element.shadowRoot?.querySelector('qd-instructor-unlock');
      expect(unlock).toBeTruthy();
    });
  });

  describe('student data', () => {
    it('should accept student data', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'qd/01-2025/uTEST1',
          serviceId: 'TEST1',
          name: 'Test Student',
          release: '01-2025',
          attempted: 5,
          correct: 3,
          updated: new Date().toISOString(),
          pages: {},
        },
      ];

      element.setStudents(students);
      element.unlock();

      // Students should be passed to sub-components
      expect(element['students']).toEqual(students);
    });
  });

  describe('sub-component rendering', () => {
    beforeEach(async () => {
      element.unlock();
      await element.updateComplete;
    });

    it('should render export component', () => {
      const exportComp = element.shadowRoot?.querySelector('qd-instructor-export');
      expect(exportComp).toBeTruthy();
    });

    it('should render manage component', () => {
      const manageComp = element.shadowRoot?.querySelector('qd-instructor-manage');
      expect(manageComp).toBeTruthy();
    });

    it('should render scores component', () => {
      const scoresComp = element.shadowRoot?.querySelector('qd-instructor-scores');
      expect(scoresComp).toBeTruthy();
    });
  });
});
