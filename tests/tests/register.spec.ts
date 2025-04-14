import { test } from '@playwright/test';

import { registerUser } from './helpers';
import { navigateTo } from './helpers/general';
import { DEFAULT_ALORE_CONFIGS, TESTMAIL_API_KEY, TESTMAIL_NAMESPACE } from './utils/constants';
import { TestMailHelper } from './utils/EmailHelper';

// --- Mailosaur Email Helper ---
const emailHelper = new TestMailHelper(TESTMAIL_API_KEY as string, TESTMAIL_NAMESPACE as string);

// --- Test Suite ---
test.describe('Register Page Authentication', () => {
  test('should allow register with valid email and password and 2FA code', async ({ page }) => {
    await navigateTo(page, 'http://localhost:3000', DEFAULT_ALORE_CONFIGS);

    await registerUser(page, emailHelper);
  });
});
