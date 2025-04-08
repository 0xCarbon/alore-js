import { test } from '@playwright/test';

import { registerUser } from './helpers';
import { MAILOSAUR_API_KEY, MAILOSAUR_DOMAIN } from './utils/constants';
import { EmailHelper } from './utils/EmailHelper';

// --- Mailosaur Email Helper ---
const emailHelper = new EmailHelper(MAILOSAUR_API_KEY as string, MAILOSAUR_DOMAIN as string);

// --- Test Suite ---
test.describe('Register Page Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('http://localhost:3000');
  });

  test('should allow register with valid email and password and 2FA code', async ({ page }) => {
    await registerUser(page, emailHelper);
  });
});
