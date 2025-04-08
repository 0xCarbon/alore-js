import { expect, Page } from '@playwright/test';

import { MAILOSAUR_SERVER_ID, TEST_NICKNAME, TEST_PASSWORD } from '../utils/constants';
import { EmailHelper } from '../utils/EmailHelper';

// --- Standard Register Helper Function ---
export async function registerUser(page: Page, emailHelper: EmailHelper) {
  // 1. Click Sign Up Button
  await expect(page.getByTestId('login-email-step')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('sign-up-button').click();

  // 2. Enter Email
  await page.getByTestId('register-email').click();
  await page.getByTestId('register-email').fill(emailHelper.emailAddress);

  // 3. Enter First Name
  await page.getByTestId('register-first-name').click();
  await page.getByTestId('register-first-name').fill(TEST_NICKNAME);

  // 4. Agree to Terms
  await page.getByTestId('register-agreed-with-terms-checkbox').check();
  await page.getByTestId('register-button').click();

  // 5. Enter Email Verification Code
  const code = await emailHelper.get2FACode(MAILOSAUR_SERVER_ID as string);

  await page.locator('.h-\\[2\\.56rem\\]').first().click();
  await page.locator('.h-\\[2\\.56rem\\]').first().fill(code);

  // 6. Enter Password
  await page.getByTestId('register-password-input').click();
  await page.getByTestId('register-password-input').fill(TEST_PASSWORD);
  await page.getByTestId('register-confirm-password-input').click();
  await page.getByTestId('register-confirm-password-input').fill(TEST_PASSWORD);
  await page.getByTestId('password-submit-button').click();

  // 7. Assert Success
  await expect(page.getByTestId('register-user-created-step')).toBeVisible({ timeout: 10000 });
}
