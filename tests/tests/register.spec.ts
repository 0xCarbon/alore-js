import { test } from '@playwright/test';

import { registerUser } from './helpers';
import { navigateTo } from './helpers/general';
import { DEFAULT_ALORE_CONFIGS, MAILOSAUR_API_KEY, MAILOSAUR_DOMAIN } from './utils/constants';
import { EmailHelper } from './utils/EmailHelper';

// --- Mailosaur Email Helper ---
const emailHelper = new EmailHelper(MAILOSAUR_API_KEY as string, MAILOSAUR_DOMAIN as string);

// --- Test Suite ---
test.describe('Register Page Authentication', () => {
  test('should allow register with valid email and password and 2FA code', async ({ page }) => {
    await navigateTo(page, 'http://localhost:3000', DEFAULT_ALORE_CONFIGS);

    await registerUser(page, emailHelper);
  });
});
