/**
 * Shared helpers for the Playwright E2E suites.
 */

import type { Locator } from '@playwright/test';

/** Milliseconds to wait for the login form to reach a settled state. */
const SETTLE_MS = 3000;

/**
 * Resolve with `value` only when `promise` succeeds.
 *
 * A branch that rejects (its `waitFor` timed out) never settles, so it cannot
 * win the race below and be mistaken for the outcome that did happen.
 */
function onSuccess<T>(promise: Promise<unknown>, value: T): Promise<T> {
  return promise.then(
    () => value,
    () => new Promise<T>(() => {}),
  );
}

/**
 * Submit the student login form, completing the confirm step when the form is
 * creating a new account.
 *
 * A service ID with no account offers "Create" and asks for the PIN a second
 * time before storing it, so a typo cannot silently become the stored PIN. An
 * existing account offers "Login" and needs only the single click. Tests call
 * this rather than clicking submit directly, so the two-step flow lives in one
 * place instead of in every spec.
 *
 * @param form - Locator for the `<qd-login>` element (or its wrapper)
 * @param pin - PIN to repeat at the confirm step. Defaults to whatever is
 *   currently in the PIN field, so callers never have to keep the two in sync.
 */
export async function submitStudentLogin(form: Locator, pin?: string): Promise<void> {
  // Scope every locator to the login form itself. The component also hosts
  // dialogs (PIN confirmation, storage migration) whose buttons and messages
  // would otherwise match and make the helper act on the wrong control.
  const loginForm = form.locator('form.login-form');
  const pinField = loginForm.locator('input[name="pin"]');
  const typedPin = pin ?? (await pinField.inputValue());
  const submit = loginForm.locator('button.login-btn');

  await submit.click();

  // The form resolves registration against storage before deciding whether to
  // ask for the PIN again, so wait for whichever outcome actually arrives
  // rather than guessing a delay.
  const confirming = await Promise.race([
    // Creating an account: the form is asking us to repeat the PIN
    onSuccess(
      loginForm
        .locator('button.login-btn:has-text("Confirm")')
        .waitFor({ state: 'visible', timeout: SETTLE_MS }),
      true,
    ),
    // Existing account, correct PIN: logged straight in
    onSuccess(
      form.page().locator('qd-status').waitFor({ state: 'visible', timeout: SETTLE_MS }),
      false,
    ),
    // Existing account, rejected PIN: the form reports it and stays put. Tests
    // that deliberately fail a login rely on this returning promptly.
    onSuccess(
      loginForm
        .locator('.error-message, .lockout-message')
        .first()
        .waitFor({ state: 'visible', timeout: SETTLE_MS }),
      false,
    ),
    // Anything else (a dialog took over, for instance): leave the form alone.
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), SETTLE_MS + 200)),
  ]);

  if (confirming) {
    await pinField.fill(typedPin);
    await submit.click();
  }
}
