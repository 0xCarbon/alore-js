import { expect, Page, test } from '@playwright/test';

import { registerUser } from './helpers';
import { navigateTo } from './helpers/general';
import {
  DEFAULT_ALORE_CONFIGS,
  TEST_PASSWORD,
  TESTMAIL_API_KEY,
  TESTMAIL_NAMESPACE,
} from './utils/constants';
import { TestMailHelper } from './utils/EmailHelper';

// --- Mailosaur Email Helper ---
const emailHelper = new TestMailHelper(TESTMAIL_API_KEY as string, TESTMAIL_NAMESPACE as string);

// --- Test Suite ---
test.describe('Login Page Authentication', () => {
  test('should allow login with valid email and password and 2FA code', async ({
    page,
    context,
  }) => {
    await navigateTo(page, 'http://localhost:3000', DEFAULT_ALORE_CONFIGS);

    // Register a new user to login with
    await registerUser(page, emailHelper);

    await page.getByTestId('logout-button').click();
    await context.clearCookies();

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
    const code = await emailHelper.get2FACode('login');

    await page.locator('.h-\\[2\\.56rem\\]').first().click();
    await page.locator('.h-\\[2\\.56rem\\]').first().fill(code);

    // 4. Assert Success
    const [response] = await Promise.all([
      page.waitForResponse('**/auth/v1/email-2fa-verification', {
        timeout: 360000, // 6 minutes
      }),
    ]);
    expect(response.ok()).toBe(true);
  });

  test('should allow auth with google social login provider, and if user does not exist create user', async ({
    page,
    context,
  }) => {
    const googleEmail = process.env.GOOGLE_USER;
    const googlePassword = process.env.GOOGLE_PWD;

    if (!googleEmail || !googlePassword) {
      throw new Error(
        'Google credentials (GOOGLE_USER, GOOGLE_PWD) environment variables must be set for this test.',
      );
    }

    const aloreConfigs = {
      ...DEFAULT_ALORE_CONFIGS,
      socialProviders: [
        {
          id: 'google',
          providerName: 'google',
          clientId: process.env.NEXT_PUBLIC_GOOGLE_ID || '',
        },
      ],
    };

    await navigateTo(page, 'http://localhost:3000', aloreConfigs);

    await expect(page.getByTestId('login-email-step')).toBeVisible({ timeout: 10000 });

    // --- Google Login Flow ---
    // 1. Setup popup listener BEFORE clicking
    const popupPromise = Promise.race([
      context.waitForEvent('page', { timeout: 15000 }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Popup did not open within 15s')), 15000);
      }),
    ]);

    await page.waitForTimeout(1000);

    // 2. Trigger Google login button click
    await page.getByTestId('login-social-google-button').click();

    // 3. Get reference to the popup
    const popup = (await popupPromise) as Page;

    // 4. Wait for popup to reach Google's login page
    await popup.waitForURL(/accounts\.google\.com/);

    // 5. Handle email input
    await popup.getByRole('textbox', { name: 'Email or phone' }).fill(googleEmail);
    await popup.getByRole('button', { name: 'Next' }).click();

    // 6. Handle password input
    const passwordInput = popup.getByRole('textbox', {
      name: 'Enter your password',
    });
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill(googlePassword);

    // 7. Click Next and wait for navigation
    await popup.getByRole('button', { name: 'Next' }).click();

    const continueButton = popup.getByRole('button', { name: /Continue|Continuar|Fazer login/i });

    await Promise.race([
      continueButton.waitFor({ state: 'visible' }).catch(() => {}),
      popup.waitForEvent('close', { timeout: 30000 }),
    ]);

    if (!popup.isClosed() && (await continueButton.isVisible())) {
      await Promise.all([popup.waitForEvent('close'), continueButton.click()]);
    }

    if (!popup.isClosed()) {
      await popup.waitForEvent('close', { timeout: 30000 });
    }

    await page.waitForTimeout(1000);

    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('login-email-step')).toBeHidden();
    console.log('Cheg0u');
    // 8. Verify successful login OR registration initiation in main window
    const googleLoginResponsePromise = page.waitForResponse('**/auth/v1/google-login');

    console.log('googleLoginResponsePromise', googleLoginResponsePromise);
    const googleLoginResponse = await googleLoginResponsePromise;
    console.log('googleLoginResponse', googleLoginResponse);

    await page.waitForTimeout(2000);

    const loginPasswordStep = page.getByTestId('login-password-step');
    const isExistingUser = await loginPasswordStep.isVisible({ timeout: 15000 });

    console.log('isExistingUser', isExistingUser);

    if (isExistingUser) {
      // --- Existing User Flow ---
      await page.getByTestId('login-password').click();
      await page.getByTestId('login-password').fill(TEST_PASSWORD);
      await page.getByTestId('login-submit').click();

      // 9. Assert Final Success
      const google2faVerificationResponsePromise = page.waitForResponse(
        '**/auth/v1/google-2fa-verification',
        {
          timeout: 240000, // 4 minutes
        },
      );

      const google2faVerificationResponse = await google2faVerificationResponsePromise;
      expect(google2faVerificationResponse.ok()).toBe(true);
    } else {
      // --- New User Flow ---
      await expect(page.getByTestId('register-password-input')).toBeVisible({ timeout: 10000 }); // Check if registration password input is now visible
      await page.getByTestId('register-password-input').click();
      await page.getByTestId('register-password-input').fill(TEST_PASSWORD);
      await page.getByTestId('register-confirm-password-input').click();
      await page.getByTestId('register-confirm-password-input').fill(TEST_PASSWORD);

      // 9. Assert Final Success
      const responsePromise = page.waitForResponse('**/auth/v1/account-registration', {
        timeout: 240000, // 4 minutes
      });

      await page.getByTestId('password-submit-button').click();

      const response = await responsePromise;
      expect(response.ok()).toBe(true);
    }
  });

  test('should allow auth with microsoft social login provider, and if user does not exist create user', async ({
    page,
    context,
  }) => {
    const microsoftEmail = process.env.MICROSOFT_USER;
    const microsoftPassword = process.env.MICROSOFT_PWD;

    if (!microsoftEmail || !microsoftPassword) {
      throw new Error(
        'Microsoft credentials (MICROSOFT_USER, MICROSOFT_PWD) environment variables must be set for this test.',
      );
    }

    const aloreConfigs = {
      ...DEFAULT_ALORE_CONFIGS,
      socialProviders: [
        {
          id: 'microsoft',
          providerName: 'microsoft',
          clientId: process.env.NEXT_PUBLIC_MICROSOFT_ID || '',
        },
      ],
    };

    await navigateTo(page, 'http://localhost:3000', aloreConfigs);

    await expect(page.getByTestId('login-email-step')).toBeVisible({ timeout: 10000 });

    // --- Microsoft Login Flow ---
    // 1. Setup popup listener BEFORE clicking
    const popupPromise = Promise.race([
      context.waitForEvent('page', { timeout: 15000 }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Popup did not open within 15s')), 15000);
      }),
    ]);

    await page.waitForTimeout(1000);

    // 2. Trigger Microsoft login button click
    await page.getByTestId('login-social-microsoft-button').click();

    // 3. Get reference to the popup
    const popup = (await popupPromise) as Page;
    try {
      // 4. Wait for popup to reach Microsoft's login page
      await popup.waitForURL(/login\.microsoftonline\.com/);

      // 5. Handle email input
      // Use a selector that reliably targets the email input on the Microsoft page
      await popup.getByPlaceholder('Email, phone, or Skype').waitFor();
      await popup.getByPlaceholder('Email, phone, or Skype').fill(microsoftEmail);
      await popup.getByRole('button', { name: 'Next' }).click();

      await page.waitForTimeout(1000);

      // 6. Handle password input
      const passwordInput = popup.locator('input[type="password"]');
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
      await passwordInput.fill(microsoftPassword);

      // 7. Click Sign in/Next and wait for navigation/popup closure
      await Promise.all([
        popup.waitForNavigation(),
        popup.getByRole('button', { name: 'Next' }).click(),
      ]);

      // Here could have the screen "Let this app access your info?" and should click in Accept button if it appear
      const accessInfoAcceptButton = popup.getByRole('button', { name: /Accept/i });
      let accessInfoVisible = false;

      try {
        await accessInfoAcceptButton.waitFor({ state: 'visible', timeout: 10000 });
        accessInfoVisible = true;
      } catch (error) {
        console.log('"Let this app access your info?" screen not detected');
      }

      if (accessInfoVisible) {
        if (!popup.isClosed()) {
          await Promise.all([
            Promise.race([
              popup.waitForEvent('close'),
              popup.waitForNavigation({ waitUntil: 'networkidle' }),
            ]),
            accessInfoAcceptButton.click(),
          ]);
        }
      }

      // Handle "Stay signed in?" prompt with proper closure handling
      const staySignedInButton = popup.getByRole('button', { name: /No|Don't stay signed in/i });
      let staySignedInVisible = false;

      try {
        await staySignedInButton.waitFor({ state: 'visible', timeout: 10000 });
        staySignedInVisible = true;
      } catch (error) {
        console.log('"Stay signed in" prompt not detected');
      }

      if (staySignedInVisible) {
        // Check if popup is still open before interacting
        if (!popup.isClosed()) {
          await Promise.all([
            // Wait for either popup closure or navigation
            Promise.race([
              popup.waitForEvent('close'),
              popup.waitForNavigation({ waitUntil: 'networkidle' }),
            ]),
            staySignedInButton.click(),
          ]);
        }
      }

      // Then handle consent screen with same pattern
      const consentButton = popup.getByRole('button', { name: /Accept|Yes/i });
      let consentIsVisible = false;

      try {
        await consentButton.waitFor({ state: 'visible', timeout: 15000 });
        consentIsVisible = true;
      } catch (error) {
        console.log('No consent screen detected');
      }

      if (consentIsVisible) {
        // Check popup availability again
        if (!popup.isClosed()) {
          await Promise.all([
            Promise.race([
              popup.waitForEvent('close'),
              popup.waitForNavigation({ waitUntil: 'networkidle' }),
            ]),
            consentButton.click(),
          ]);
        }
      }

      // Final popup closure wait
      if (!popup.isClosed()) {
        await popup.waitForEvent('close', { timeout: 30000 });
      }

      await page.waitForTimeout(1000);

      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('login-email-step')).toBeHidden();

      const microsoftLoginResponsePromise = page.waitForResponse('**/auth/v1/google-login', {
        timeout: 240000, // 4 minutes
      });

      const microsoftLoginResponse = await microsoftLoginResponsePromise;
      expect(microsoftLoginResponse.ok()).toBe(true);

      await page.waitForTimeout(2000);

      // 8. Verify successful login OR registration initiation in main window
      const loginPasswordStep = page.getByTestId('login-password-step');
      const isExistingUser = await loginPasswordStep.isVisible({ timeout: 15000 });

      if (isExistingUser) {
        // --- Existing User Flow ---
        await page.getByTestId('login-password').click();
        await page.getByTestId('login-password').fill(TEST_PASSWORD);

        // 9. Assert Final Success
        const microsoft2faVerificationResponsePromise = page.waitForResponse(
          '**/auth/v1/google-2fa-verification',
          {
            timeout: 240000, // 4 minutes
          },
        );

        const microsoft2faVerificationResponse = await microsoft2faVerificationResponsePromise;
        expect(microsoft2faVerificationResponse.ok()).toBe(true);

        await page.getByTestId('login-submit').click();
      } else {
        // --- New User Flow ---
        await expect(page.getByTestId('register-password-input')).toBeVisible({ timeout: 10000 }); // Check if registration password input is now visible
        await page.getByTestId('register-password-input').click();
        await page.getByTestId('register-password-input').fill(TEST_PASSWORD);
        await page.getByTestId('register-confirm-password-input').click();
        await page.getByTestId('register-confirm-password-input').fill(TEST_PASSWORD);

        // 9. Assert Final Success
        const responsePromise = page.waitForResponse('**/auth/v1/account-registration', {
          timeout: 240000, // 4 minutes
        });

        await page.getByTestId('password-submit-button').click();

        const response = await responsePromise;
        expect(response.ok()).toBe(true);
      }
    } catch (error) {
      if (!popup.isClosed()) {
        await popup.screenshot({ path: 'microsoft-auth-failure.png' });
      }
      await page.screenshot({ path: 'failure.png' });
      throw error;
    }
  });
});
