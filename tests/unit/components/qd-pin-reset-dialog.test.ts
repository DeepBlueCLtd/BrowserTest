/**
 * Unit tests for <qd-pin-reset-dialog>: the instructor password is re-checked
 * at the moment of a PIN reset (SRD 013 SEC-03).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { resetStudentPinMock } = vi.hoisted(() => ({
  resetStudentPinMock: vi.fn(),
}));
vi.mock('../../../src/services/pin-reset-service.js', () => ({
  resetStudentPin: resetStudentPinMock,
}));

import '../../../src/components/qd-pin-reset-dialog.js';
import type { QdPinResetDialog } from '../../../src/components/qd-pin-reset-dialog.js';
import type { StudentRecord } from '../../../src/types/contracts.js';
import {
  configureInstructorHash,
  resetInstructorForTest,
  TEST_INSTRUCTOR_PASSWORD,
} from '../../helpers/instructor.js';
import { resetReauthLimiterForTests } from '../../../src/services/auth/instructor-session.js';

const student: StudentRecord = {
  schema: 3,
  docId: '',
  release: 'R1',
  serviceId: '30012345',
  name: 'Jo Bloggs',
  attempted: 0,
  correct: 0,
  updated: '2026-10-30T00:00:00Z',
  pages: {},
  pinHash: 'x',
};

async function settle(el: QdPinResetDialog): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
  }
}

describe('qd-pin-reset-dialog password re-check', () => {
  let el: QdPinResetDialog;

  beforeEach(async () => {
    resetStudentPinMock.mockReset();
    resetStudentPinMock.mockResolvedValue({ ok: true, updated: { ...student, pinHash: '' } });
    resetReauthLimiterForTests();
    await configureInstructorHash();
    el = document.createElement('qd-pin-reset-dialog');
    el.students = [student];
    document.body.appendChild(el);
    el.open = true;
    await el.updateComplete;
    el['confirmingStudent'] = student;
    el['confirmDialogOpen'] = true;
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
    document.querySelectorAll('body > qd-modal').forEach((m) => m.remove());
    resetInstructorForTest();
  });

  function confirmWith(password: string): void {
    const dialog = el.shadowRoot!.querySelector('qd-confirm-dialog')!;
    dialog.dispatchEvent(new CustomEvent('qd:confirm', { detail: { password } }));
  }

  it('asks the confirmation dialog for a password', () => {
    const dialog = el.shadowRoot!.querySelector('qd-confirm-dialog')!;
    expect((dialog as unknown as { requirePassword: boolean }).requirePassword).toBe(true);
  });

  it('does not reset with a wrong password and says why', async () => {
    confirmWith('wrong');
    await settle(el);
    expect(resetStudentPinMock).not.toHaveBeenCalled();
    expect(el['errorMessage']).toBe('Incorrect instructor password. The PIN was not reset.');
  });

  it('does not reset when no password was sent', async () => {
    el.shadowRoot!.querySelector('qd-confirm-dialog')!.dispatchEvent(new CustomEvent('qd:confirm'));
    await settle(el);
    expect(resetStudentPinMock).not.toHaveBeenCalled();
  });

  it('resets with the right password', async () => {
    let resetEvent = false;
    el.addEventListener('qd:pin-reset', () => (resetEvent = true));
    confirmWith(TEST_INSTRUCTOR_PASSWORD);
    await settle(el);
    expect(resetStudentPinMock).toHaveBeenCalledWith(student);
    expect(resetEvent).toBe(true);
  });
});
