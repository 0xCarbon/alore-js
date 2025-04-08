import { expect, test } from '@playwright/test';

import { registerUser } from './helpers';
import {
  MAILOSAUR_API_KEY,
  MAILOSAUR_DOMAIN,
  MAILOSAUR_SERVER_ID,
  TEST_NICKNAME,
  TEST_PASSWORD,
} from './utils/constants';
import { EmailHelper } from './utils/EmailHelper';

// --- Mailosaur Email Helper ---
const emailHelper = new EmailHelper(MAILOSAUR_API_KEY as string, MAILOSAUR_DOMAIN as string);

// --- Test Suite ---
test.describe('Login Page Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('http://localhost:3000');
  });

  test('should allow login with valid email and password and 2FA code', async ({
    page,
    context,
  }) => {
    // Register a new user to login with
    await registerUser(page, emailHelper);
    await context.clearCookies();
    await page.goto('http://localhost:3000');

    await expect(page.getByTestId('login-email-step')).toBeVisible({ timeout: 10000 });

    // 1. Enter Email
    await page.getByTestId('login-email-input').click();
    await page.getByTestId('login-email-input').fill(emailHelper.emailAddress);

    // 2. Enter Password
    await page.getByTestId('login-button').click();
    await page.getByTestId('login-password').click();
    await page.getByTestId('login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();

    // 3. Enter Email Verification Code
    const code = await emailHelper.get2FACode(MAILOSAUR_SERVER_ID as string);

    await page.locator('.h-\\[2\\.56rem\\]').first().click();
    await page.locator('.h-\\[2\\.56rem\\]').first().fill(code);

    // 4. Assert Success
    await expect(page.getByTestId('login-successful-login-step')).toBeVisible({ timeout: 10000 });
  });
});
