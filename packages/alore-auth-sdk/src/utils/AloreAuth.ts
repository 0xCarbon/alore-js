import { startAuthentication } from '@simplewebauthn/browser';

import { generateSecureHash } from '../helpers/crypto';
import type {
  AuthMachineContext,
  AuthProviderConfig,
  CustomerStepUpEmailChallengeResponse,
  CustomerStepUpInput,
  CustomerStepUpResult,
  FetchWithProgressiveBackoffConfig,
  StaffStepUpInput,
  StaffStepUpResult,
  StepUpChallengeRequest,
  StepUpChallengeResponse,
  StepUpFactorsResponse,
} from '../types';
import { AloreAuthError, ErrorCodes, ErrorTypes } from './AuthError';

const DEFAULT_URL = 'https://alpha-api.bealore.com/v1';

export class AloreAuth {
  protected readonly aloreBaseUrl: string;

  protected readonly emailTemplate: string;

  protected readonly clientId: string;

  constructor(clientId: string, aloreBaseUrl?: string, config?: AuthProviderConfig) {
    if (!clientId) throw new AloreAuthError(ErrorTypes.CLIENT_ID_REQUIRED, 'Client ID is required');

    this.clientId = clientId;
    this.aloreBaseUrl = aloreBaseUrl || DEFAULT_URL;
    this.emailTemplate = config?.emailTemplate || '';
  }

  services = {
    healthCheck: async () => {
      try {
        await this.verifyBackendStatus();
      } catch (error) {
        throw new AloreAuthError(ErrorTypes.SERVER_DOWN, 'Server is down');
      }

      return { data: true };
    },
    // Email and password flow
    retrieveSalt: async (
      context: AuthMachineContext,
      event: {
        type: 'SELECT_PASSWORD';
        payload: {
          email: string;
        };
      },
    ) => {
      const { email } = event.payload;
      const { credentialEmail } = context;

      const response = await this.fetchWithProgressiveBackoff(
        `/auth/v1/salt/${email || credentialEmail}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const salt: string = await response.json();
        return { salt };
      }

      // Propagate parsed error so machine receives full payload as event.data
      await this.throwParsedResponseError(response);
    },
    verifyEmail: async (
      context: AuthMachineContext,
      event: {
        type: 'VERIFY_EMAIL';
        payload: {
          secureCode: string;
        };
      },
    ) => {
      const { secureCode } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        '/auth/v1/registration-code-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailCode: secureCode,
            sessionId: context.sessionId,
          }),
        },
      );

      if (response.ok) {
        return {};
      }

      await this.throwParsedResponseError(response);
    },
    completeRegistration: async (
      context: AuthMachineContext,
      event: {
        type: 'COMPLETE_REGISTRATION';
        payload: {
          email: string;
          nickname: string;
          passwordHash: string;
          device: string;
        };
      },
    ) => {
      const { email, nickname, passwordHash, device } = event.payload;
      const { firebaseCompatible } = context.authProviderConfigs || {};

      const response = await this.fetchWithProgressiveBackoff(
        `/auth/v1/account-registration${firebaseCompatible ? `?firebaseCompatibleToken=${firebaseCompatible}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            nickname,
            passwordHash,
            device,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) return data;

      await this.throwParsedResponseError(response);
    },
    confirmPassword: async (
      context: AuthMachineContext,
      event: {
        type: 'CONFIRM_PASSWORD';
        payload: {
          salt: string;
          passwordHash: string;
          token: string;
        };
      },
    ) => {
      const { salt, passwordHash, token } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(`/auth/v1/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          salt,
          newPassword: passwordHash,
        }),
      });

      if (!response.ok) await this.throwParsedResponseError(response);

      return {};
    },
    sendConfirmationEmail: async (
      context: AuthMachineContext,
      event:
        | {
            type: 'RESEND_CODE';
            payload: {
              email: string;
              nickname?: string | undefined;
              device?: string | undefined;
              passwordHash?: string | undefined;
              locale?: string | undefined;
            };
          }
        | {
            type: 'SEND_REGISTRATION_EMAIL';
            payload: {
              email: string;
              nickname?: string;
              locale?: string;
            };
          },
    ) => {
      const { email, nickname, locale } = event.payload;
      const searchParams = new URLSearchParams();
      const url = '/auth/v1/confirmation-email';

      if (locale) {
        searchParams.append('locale', locale);
      }

      if (this.emailTemplate !== '') {
        searchParams.append('template', this.emailTemplate);
      }

      const response = await this.fetchWithProgressiveBackoff(
        searchParams.size > 0 ? `${url}?${searchParams.toString()}` : url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            nickname: nickname || null,
          }),
        },
      );

      if (response.ok) {
        const resJson = await response.json();
        const { salt, sessionId } = resJson;
        return { salt, sessionId };
      }

      // Throw parsed error for machine to consume
      await this.throwParsedResponseError(response);
    },
    sendCode: async (
      context: AuthMachineContext,
      event: {
        type: 'SEND_CODE';
        payload: {
          email: string;
          locale?: string;
        };
      },
    ) => {
      const { email, locale } = event.payload;
      const searchParams = new URLSearchParams();
      const url = '/auth/v1/request-password-reset';

      if (locale) {
        searchParams.append('locale', locale);
      }

      const response = await this.fetchWithProgressiveBackoff(
        searchParams.size > 0 ? `${url}?${searchParams.toString()}` : url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
          }),
        },
      );

      if (!response.ok) await this.throwParsedResponseError(response);

      return {};
    },
    verifyLogin: async (
      context: AuthMachineContext,
      event:
        | {
            type: 'VERIFY_LOGIN';
            payload: {
              email: string;
              device: string;
              passwordHash: string;
              locale?: string | undefined;
            };
          }
        | {
            type: 'RESEND_CODE';
            payload: {
              email: string;
              nickname?: string | undefined;
              device?: string | undefined;
              passwordHash?: string | undefined;
              locale?: string | undefined;
            };
          },
    ) => {
      const { email, passwordHash, device, locale } = event.payload;
      const { credentialEmail } = context;

      const searchParams = new URLSearchParams();
      const url = '/auth/v1/login-verification';

      if (locale) {
        searchParams.append('locale', locale);
      }

      if (this.emailTemplate !== '') {
        searchParams.append('template', this.emailTemplate);
      }

      // Include device trust token if available (to skip email 2FA on trusted devices)
      let trustToken: string | null = null;
      if (typeof window !== 'undefined') {
        trustToken = window.localStorage.getItem('deviceTrustToken');
      }

      const response = await this.fetchWithProgressiveBackoff(
        searchParams.size > 0 ? `${url}?${searchParams.toString()}` : url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email || credentialEmail,
            passwordHash,
            device,
            ...(trustToken && { trustToken }),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          return { active2fa: data };
        }
        if (data?.error?.includes('2FA') || data?.error?.includes('device')) {
          return { error: data?.error };
        }
        await this.throwParsedResponseError(response);
      } else {
        return data;
      }
    },
    // Passkey registration flow
    startRegisterPasskey: async (
      context: AuthMachineContext,
      event: {
        type: 'START_PASSKEY_REGISTER';
        payload: {
          device: string;
          email: string;
          nickname?: string;
        };
      },
    ) => {
      const { rpDomain } = context.authProviderConfigs || {};
      const { email, nickname, device } = event.payload || context.registerUser;

      const startPasskeyRegistrationResponse = await this.fetchWithProgressiveBackoff(
        '/auth/v1/account-registration-passkey',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: email || null,
            userNickname: nickname || null,
            userDevice: device,
            rpOrigin: rpDomain,
          }),
        },
      );

      const data = await startPasskeyRegistrationResponse.json();

      if (!startPasskeyRegistrationResponse.ok)
        await this.throwParsedResponseError(startPasskeyRegistrationResponse);

      return data;
    },
    finishRegisterPasskey: async (
      context: AuthMachineContext,
      event: {
        type: 'FINISH_PASSKEY_REGISTER';
        payload: {
          passkeyRegistration: {
            id: string;
            rawId: string;
            response: {
              attestationObject: string;
              clientDataJSON: string;
            };
            type: string;
          };
          email: string;
          nickname: string;
          device: string;
        };
      },
    ) => {
      const { rpDomain } = context.authProviderConfigs || {};
      const { email, nickname, device, passkeyRegistration } = event.payload || {};

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/v1/account-registration-passkey-finish',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: email || null,
            userNickname: nickname || null,
            userDevice: device,
            passkeyRegistration,
            sessionId: context.sessionId,
            rpOrigin: rpDomain,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) return data;
    },
    // Passkey login flow
    startPasskeyAuth: async (
      context: AuthMachineContext,
      event: {
        type: 'START_PASSKEY_LOGIN';
        payload: {
          email: string;
        };
      },
    ) => {
      const { rpDomain } = context.authProviderConfigs || {};

      const email = event.payload?.email;

      const searchParams = new URLSearchParams();
      const url = '/auth/v1/login-passkey';

      if (rpDomain) {
        searchParams.append('rp_origin', rpDomain);
      }

      if (email) {
        searchParams.append('email', encodeURIComponent(email));
      }

      const urlWithParams = `${url}?${searchParams.toString()}`;

      const startAuthResponse = await this.fetchWithProgressiveBackoff(urlWithParams);

      const data = await startAuthResponse.json();

      if (startAuthResponse.ok) return data;

      throw new Error(data.message || data.error || data);
    },
    finishPasskeyAuth: async (
      context: AuthMachineContext,
      event:
        | {
            type: 'FINISH_PASSKEY_LOGIN';
            payload: {
              passkeyAuth: {
                id: string;
                rawId: string;
                response: {
                  authenticatorData: string;
                  clientDataJSON: string;
                  signature: string;
                  userHandle?: string;
                };
                type: string;
              };
            };
          }
        | {
            type: 'FINISH_PASSKEY_AUTH';
            payload: {
              passkeyAuth: {
                id: string;
                rawId: string;
                response: {
                  authenticatorData: string;
                  clientDataJSON: string;
                  signature: string;
                  userHandle?: string;
                };
                type: string;
              };
            };
          },
    ) => {
      const { rpDomain, firebaseCompatible } = context.authProviderConfigs || {};
      const { passkeyAuth } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        `/auth/v1/login-passkey-finish${firebaseCompatible ? `?firebaseCompatibleToken=${firebaseCompatible}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            passkeyAuth,
            sessionId: context.sessionId,
            rpOrigin: rpDomain,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) return data;

      await this.throwParsedResponseError(response);
    },
    // Hardware 2FA flow
    verify2faCode: async (
      _context: AuthMachineContext,
      event: {
        type: 'CONFIRM_SW_CODE';
        payload: {
          email: string;
          device: string;
          passwordHash: string;
          otp: string;
        };
      },
    ) => {
      const { email, passwordHash, device, otp } = event.payload;

      const response = await this.fetchWithProgressiveBackoff('/auth/v1/sw-2fa-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          passwordHash,
          device,
          otp,
        }),
      });

      const data = await response.json();

      if (response.ok) return data;

      await this.throwParsedResponseError(response);
    },
    authenticateWebauthn: async (
      context: AuthMachineContext,
      event: {
        type: 'VERIFY_HW_AUTH';
        payload: {
          email: string;
          device: string;
          passwordHash: string;
          authId: string;
        };
      },
    ) => {
      const { email, passwordHash, device, authId } = event.payload;

      const optionsResponse = await this.fetchWithProgressiveBackoff(
        '/auth/v1/hw-2fa-start-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            twofaId: authId,
            email,
            passwordHash,
          }),
        },
      );
      if (optionsResponse.status !== 200) {
        throw new Error(optionsResponse.statusText);
      }

      const optionsData = await optionsResponse.json();

      const credential = await startAuthentication({
        optionsJSON: optionsData.requestChallengeResponse.publicKey,
      }).catch((err) => {
        throw new Error(err);
      });

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/v1/hw-2fa-finish-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            passwordHash,
            device,
            credential,
            sessionId: optionsData.sessionId,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) return data;

      await this.throwParsedResponseError(response);
    },
    verifyDeviceCode: async (
      context: AuthMachineContext,
      event: {
        type: 'CONFIRM_DEVICE_CODE';
        payload: {
          email: string;
          passwordHash: string;
          device: string;
          secureCode: string;
        };
      },
    ) => {
      const { email, passwordHash, device, secureCode } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/v1/device-ownership-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            passwordHash,
            deviceSecret: device,
            emailCode: secureCode,
            sessionId: context.sessionId,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) return data;

      throw new Error(data.message || data.error || 'Authentication failed');
    },
    verifyEmail2fa: async (
      context: AuthMachineContext,
      event: {
        type: 'VERIFY_EMAIL_2FA';
        payload: {
          email: string;
          secureCode: string;
          passwordHash: string;
          device?: string;
          trustThisDevice?: boolean;
        };
      },
    ) => {
      const { email, passwordHash, secureCode, device, trustThisDevice } = event.payload;
      const { credentialEmail, authProviderConfigs } = context;

      const { firebaseCompatible } = authProviderConfigs || {};

      const response = await this.fetchWithProgressiveBackoff(
        `/auth/v1/email-2fa-verification${firebaseCompatible ? `?firebaseCompatibleToken=${firebaseCompatible}` : ''}`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: email || credentialEmail,
            passwordHash,
            emailCode: secureCode,
            sessionId: context.sessionId,
            ...(device && { device }),
            ...(trustThisDevice !== undefined && { trustThisDevice }),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Persist device trust token for future logins
        if (data.deviceTrustToken && typeof window !== 'undefined') {
          window.localStorage.setItem('deviceTrustToken', data.deviceTrustToken);
        } else if (typeof window !== 'undefined') {
          window.localStorage.removeItem('deviceTrustToken');
        }
        return data;
      }

      throw new Error(data.message || data.error || 'Authentication failed');
    },
    /**
     * Passwordless social sign-in.
     *
     * Sends an OIDC id_token, not an access token: an access token carries no
     * audience the backend can verify, so the older googleLogin flow below
     * cannot tell a token minted for this app from one minted for any other.
     * On success the backend returns a full session — there is no OTP and no
     * password step.
     */
    socialLogin: async (
      context: AuthMachineContext,
      event: {
        type: 'SOCIAL_LOGIN';
        payload: {
          idToken: string;
          providerName: string;
          device?: string;
          nonce?: string;
          sessionId?: string;
          emailCode?: string;
        };
      },
    ) => {
      const { idToken, providerName, device, nonce, sessionId, emailCode } = event.payload;
      const { authProviderConfigs } = context;
      const { firebaseCompatible, locale } = authProviderConfigs || {};

      const query = new URLSearchParams();
      if (firebaseCompatible) query.set('firebaseCompatibleToken', String(firebaseCompatible));
      if (locale) query.set('locale', locale);
      const queryString = query.toString();

      const response = await this.fetchWithProgressiveBackoff(
        `/auth/v1/social-login${queryString ? `?${queryString}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken,
            provider: providerName,
            ...(device ? { device } : {}),
            ...(nonce ? { nonce } : {}),
            ...(sessionId ? { sessionId } : {}),
            ...(emailCode ? { emailCode } : {}),
          }),
        },
      );

      // Not every 403 here is a refusal. Where the provider does not vouch for
      // the address — Microsoft never does, since Entra carries no
      // email_verified claim — the backend emails a code to the address the
      // token claimed and hands back the session carrying it. The flow
      // continues by calling this same endpoint again with that session and
      // the code.
      if (response.status === 403) {
        const challenge = await response
          .clone()
          .json()
          .catch(() => null);

        if (challenge?.error === 'SOCIAL_EMAIL_VERIFICATION_REQUIRED' && challenge?.sessionId) {
          return {
            emailChallenge: {
              sessionId: challenge.sessionId,
              idToken,
              providerName,
              device,
            },
          };
        }
      }

      if (!response.ok) await this.throwParsedResponseError(response);

      const sessionUser = await response.json();

      // 201 means the backend provisioned the account on this call. The
      // consuming app keys its own user creation off that, so it has to survive
      // as far as the onRegister/onLogin split in Auth.tsx.
      return { sessionUser, isNewUser: response.status === 201 };
    },
  };

  /**
   * Lists the authenticated user's available staff MFA and customer re-auth factors.
   */
  public async getStepUpFactors(accessToken: string): Promise<StepUpFactorsResponse> {
    const token = this.requireAccessToken(accessToken);
    const response = await this.fetchWithProgressiveBackoff('/auth/v1/step-up/factors', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await this.throwStepUpError(response);
    }

    return (await response.json()) as StepUpFactorsResponse;
  }

  /**
   * Starts a WebAuthn (`passkey` / `hw_key`) or `email_code` step-up challenge.
   * Uses a single attempt (`maxAttempts: 1`) so email codes are never double-sent.
   */
  public async startStepUpChallenge(
    accessToken: string,
    request: StepUpChallengeRequest,
  ): Promise<StepUpChallengeResponse> {
    const token = this.requireAccessToken(accessToken);
    const body: Record<string, unknown> = {
      method: request.method,
    };
    if (request.purpose !== undefined) {
      body.purpose = request.purpose;
    }
    if (request.rpOrigin !== undefined) {
      body.rpOrigin = request.rpOrigin;
    }
    if (request.locale !== undefined) {
      body.locale = request.locale;
    }

    const response = await this.fetchWithProgressiveBackoff(
      '/auth/v1/step-up/challenge',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      { maxAttempts: 1 },
    );

    if (!response.ok) {
      await this.throwStepUpError(response);
    }

    return (await response.json()) as StepUpChallengeResponse;
  }

  /**
   * Requests a single-use customer re-authentication verification code by email.
   */
  public async requestCustomerReauthEmailCode(
    accessToken: string,
    options?: { locale?: string },
  ): Promise<CustomerStepUpEmailChallengeResponse> {
    const challenge = await this.startStepUpChallenge(accessToken, {
      method: 'email_code',
      purpose: 'customer_reauth',
      locale: options?.locale,
    });

    return {
      method: 'email_code',
      sessionId: challenge.sessionId,
      expiresAt: challenge.expiresAt ?? 0,
    };
  }

  /**
   * Performs customer re-authentication ("Confirme que é você") using passkey,
   * hardware key, password (+ TOTP when enrolled), or an emailed single-use code.
   * Returns a short-lived, scoped `reauthToken` (`purpose: 'customer_reauth'`).
   */
  public async stepUp(
    accessToken: string,
    input: CustomerStepUpInput,
  ): Promise<CustomerStepUpResult> {
    const token = this.requireAccessToken(accessToken);
    const payload = await this.buildCustomerStepUpPayload(token, input);

    const response = await this.fetchWithProgressiveBackoff(
      '/auth/v1/step-up/customer',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      { maxAttempts: 1 },
    );

    if (!response.ok) {
      await this.throwStepUpError(response);
    }

    return (await response.json()) as CustomerStepUpResult;
  }

  /**
   * Performs staff MFA step-up (`POST /auth/v1/step-up`) using an enrolled TOTP,
   * passkey, or hardware key and returns freshly minted session tokens.
   */
  public async staffStepUp(
    accessToken: string,
    input: StaffStepUpInput,
  ): Promise<StaffStepUpResult> {
    const token = this.requireAccessToken(accessToken);
    let payload: Record<string, unknown>;

    if (input.method === 'totp') {
      payload = { method: 'totp', otp: input.otp };
    } else if (input.credential && input.sessionId) {
      payload = {
        method: input.method,
        credential: input.credential,
        sessionId: input.sessionId,
        ...(input.rpOrigin ? { rpOrigin: input.rpOrigin } : {}),
      };
    } else {
      const challenge = await this.startStepUpChallenge(token, {
        method: input.method,
        purpose: 'staff_mfa',
        rpOrigin: input.rpOrigin,
      });
      const publicKey = challenge.requestChallengeResponse?.publicKey;
      if (!publicKey) {
        throw new AloreAuthError(
          ErrorTypes.BAD_RESPONSE,
          'Missing WebAuthn challenge options from server',
        );
      }
      const authenticate =
        ('authenticatePasskey' in input && input.authenticatePasskey) ||
        ((optionsJSON: Record<string, unknown>) =>
          startAuthentication({ optionsJSON: optionsJSON as any }) as unknown as Promise<
            Record<string, unknown>
          >);
      const credential = await authenticate(publicKey);
      payload = {
        method: input.method,
        credential,
        sessionId: challenge.sessionId,
        ...(input.rpOrigin ? { rpOrigin: input.rpOrigin } : {}),
      };
    }

    const response = await this.fetchWithProgressiveBackoff(
      '/auth/v1/step-up',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      { maxAttempts: 1 },
    );

    if (!response.ok) {
      await this.throwStepUpError(response);
    }

    return (await response.json()) as StaffStepUpResult;
  }

  private async buildCustomerStepUpPayload(
    accessToken: string,
    input: CustomerStepUpInput,
  ): Promise<Record<string, unknown>> {
    if (input.method === 'email_code') {
      return {
        method: 'email_code',
        emailCode: input.emailCode,
        sessionId: input.sessionId,
        ...(input.scope ? { scope: input.scope } : {}),
      };
    }

    if (input.method === 'password') {
      let passwordHash: string;
      if ('passwordHash' in input) {
        passwordHash = input.passwordHash;
      } else {
        let { salt } = input;
        if (!salt) {
          if (!input.email) {
            throw new AloreAuthError(
              ErrorTypes.STEP_UP_INVALID_REQUEST,
              'Email or salt is required to hash password for re-authentication',
              ErrorCodes.BAD_REQUEST,
            );
          }
          const saltResp = await this.fetchWithProgressiveBackoff(
            `/auth/v1/salt/${encodeURIComponent(input.email)}`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
          if (!saltResp.ok) {
            await this.throwStepUpError(saltResp);
          }
          salt = (await saltResp.json()) as string;
        }
        const hashFn =
          input.hashPassword ??
          ((password: string, resolvedSalt: string) =>
            generateSecureHash(password, resolvedSalt, 'argon2d'));
        passwordHash = await hashFn(input.password, salt);
      }

      return {
        method: 'password',
        passwordHash,
        ...(input.otp !== undefined && input.otp !== '' ? { otp: input.otp } : {}),
        ...(input.scope ? { scope: input.scope } : {}),
      };
    }

    // Passkey or hardware key
    if (input.credential && input.sessionId) {
      return {
        method: input.method,
        credential: input.credential,
        sessionId: input.sessionId,
        ...(input.rpOrigin ? { rpOrigin: input.rpOrigin } : {}),
        ...(input.scope ? { scope: input.scope } : {}),
      };
    }

    const challenge = await this.startStepUpChallenge(accessToken, {
      method: input.method,
      purpose: 'customer_reauth',
      rpOrigin: input.rpOrigin,
    });
    const publicKey = challenge.requestChallengeResponse?.publicKey;
    if (!publicKey) {
      throw new AloreAuthError(
        ErrorTypes.BAD_RESPONSE,
        'Missing WebAuthn challenge options from server',
      );
    }

    const authenticate =
      ('authenticatePasskey' in input && input.authenticatePasskey) ||
      ((optionsJSON: Record<string, unknown>) =>
        startAuthentication({ optionsJSON: optionsJSON as any }) as unknown as Promise<
          Record<string, unknown>
        >);
    const credential = await authenticate(publicKey);

    return {
      method: input.method,
      credential,
      sessionId: challenge.sessionId,
      ...(input.rpOrigin ? { rpOrigin: input.rpOrigin } : {}),
      ...(input.scope ? { scope: input.scope } : {}),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private requireAccessToken(accessToken: string): string {
    const trimmed = typeof accessToken === 'string' ? accessToken.trim() : '';
    if (!trimmed) {
      throw new AloreAuthError(
        ErrorTypes.STEP_UP_INVALID_FACTOR,
        'Access token is required for re-authentication',
        ErrorCodes.UNAUTHORIZED,
      );
    }
    return trimmed;
  }

  // eslint-disable-next-line class-methods-use-this
  private async throwStepUpError(response: Response): Promise<never> {
    const { status } = response;
    let rawServerMessage = '';
    try {
      const parsed = await response.json();
      if (typeof parsed === 'string') {
        rawServerMessage = parsed;
      } else if (parsed && typeof parsed === 'object') {
        rawServerMessage = String(parsed.message ?? parsed.error ?? '');
      }
    } catch {
      rawServerMessage = '';
    }

    if (status === ErrorCodes.TOO_MANY_REQUESTS) {
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSeconds =
        retryAfterHeader && /^\d+$/.test(retryAfterHeader.trim())
          ? Number.parseInt(retryAfterHeader.trim(), 10)
          : undefined;
      throw new AloreAuthError(
        ErrorTypes.TOO_MANY_REQUESTS,
        'Too many re-authentication attempts. Please try again later.',
        ErrorCodes.TOO_MANY_REQUESTS,
        {
          status,
          ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
        },
      );
    }

    if (status === ErrorCodes.UNAUTHORIZED) {
      throw new AloreAuthError(
        ErrorTypes.STEP_UP_INVALID_FACTOR,
        'Re-authentication failed. Please verify your factor and try again.',
        ErrorCodes.UNAUTHORIZED,
        { status },
      );
    }

    if (status === ErrorCodes.FORBIDDEN) {
      if (rawServerMessage.includes('TOTP_REQUIRED')) {
        throw new AloreAuthError(
          ErrorTypes.STEP_UP_TOTP_REQUIRED,
          'An enrolled TOTP code is required alongside your password.',
          ErrorCodes.FORBIDDEN,
          { status, code: 'TOTP_REQUIRED' },
        );
      }
      throw new AloreAuthError(
        ErrorTypes.STEP_UP_FORBIDDEN,
        'Selected re-authentication method is not available for this account.',
        ErrorCodes.FORBIDDEN,
        { status },
      );
    }

    if (status === ErrorCodes.BAD_REQUEST) {
      throw new AloreAuthError(
        ErrorTypes.STEP_UP_INVALID_REQUEST,
        'Invalid re-authentication request.',
        ErrorCodes.BAD_REQUEST,
        { status },
      );
    }

    throw new AloreAuthError(
      ErrorTypes.FAILED_TO_FETCH,
      'Re-authentication request failed.',
      status,
      { status },
    );
  }

  // eslint-disable-next-line class-methods-use-this
  private async delay(ms: number) {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  // eslint-disable-next-line class-methods-use-this
  private isLocalUrl(urlString: string): boolean {
    try {
      const parsed = new URL(urlString);
      const isHttp = parsed.protocol === 'http:';
      const isLoopbackHost =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname === '::1';
      const isPort8000 = parsed.port === '8000';
      return isHttp || isLoopbackHost || isPort8000;
    } catch (_e) {
      return false;
    }
  }

  public async fetchWithProgressiveBackoff(
    // eslint-disable-next-line no-undef
    url: RequestInfo | URL,
    // eslint-disable-next-line no-undef
    options?: RequestInit,
    config?: FetchWithProgressiveBackoffConfig,
  ) {
    const { maxAttempts = 3, initialDelay = 200 } = config || {};

    let attempt = 0;
    let delayValue = initialDelay;

    const isLocal = this.isLocalUrl(this.aloreBaseUrl);

    // eslint-disable-next-line no-undef
    const init: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...options?.headers,
        'X-CLIENT-ID': this.clientId,
        ...(isLocal && { 'CF-Connecting-IP': '127.0.0.1' }),
      },
    };

    while (attempt < maxAttempts) {
      if (attempt > 0) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return, no-loop-func
        await this.delay(delayValue);
        delayValue *= 2;
      }

      attempt += 1;
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch(new URL(`${this.aloreBaseUrl}${url}`), init);

        if (response.ok || attempt === maxAttempts || response.status !== 500) {
          return response;
        }
      } catch (error) {
        console.error(error);

        // Treat any fetch TypeError as a network/CORS-style failure. Browsers localize the message.
        const isFailedToFetch = error instanceof TypeError;

        if (isFailedToFetch && attempt >= maxAttempts) {
          // Determine whether backend is down or the request is likely blocked (e.g., CORS)
          const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
          try {
            // eslint-disable-next-line no-await-in-loop
            const health = await this.verifyBackendStatus();

            const fullUrl = `${this.aloreBaseUrl}${url}`;
            const message = origin
              ? `Request blocked by CORS policy. Endpoint: ${fullUrl}. Please ensure origin ${origin} is allowed.`
              : `Request blocked by CORS policy. Endpoint: ${fullUrl}.`;

            const corsErr = new AloreAuthError(ErrorTypes.CORS_BLOCKED, message);
            // Preserve original fetch error and health-check details for diagnostics
            // @ts-ignore
            corsErr.data = {
              originalError: this.extractErrorInfo(error),
              healthCheck: { reachable: true, ...health },
            };
            throw corsErr;
          } catch (healthError) {
            // Backend health-check failed → server likely down/unreachable
            const downErr = new AloreAuthError(
              ErrorTypes.SERVER_DOWN,
              `Server is unreachable at ${this.aloreBaseUrl}. Please try again later.`,
            );
            // @ts-ignore
            downErr.data = {
              originalError: this.extractErrorInfo(error),
              healthCheck: { reachable: false, error: this.extractErrorInfo(healthError) },
            };
            throw downErr;
          }
        }

        if (attempt < maxAttempts) {
          console.error(`Attempt ${attempt} failed, retrying in ${delayValue}ms...`);
        }
      }
    }

    // Final fallback (should rarely hit due to early throws above)
    throw new AloreAuthError(
      ErrorTypes.FAILED_TO_FETCH,
      `Max attempts (${maxAttempts}) exceeded while contacting ${this.aloreBaseUrl}${url}`,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  private async parseErrorResponse(response: Response) {
    try {
      const data = await response.json();
      // Standardize to server payload when present
      if (data && typeof data === 'object' && (data.message || data.status)) {
        return {
          status: data.status || response.status,
          message: data.message || data.error || response.statusText,
          timestamp: data.timestamp,
        };
      }
      return { status: response.status, message: response.statusText } as const;
    } catch {
      return { status: response.status, message: response.statusText } as const;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private async throwParsedResponseError(response: Response) {
    const parsed = await this.parseErrorResponse(response);
    // Normalize well-known auth errors for consistent UI handling
    let normalizedMessage = parsed.message || 'Request failed';
    if (parsed.status === 401 && parsed.message !== 'INVALID_SESSION') {
      normalizedMessage = 'INVALID_CREDENTIALS';
    } else if (parsed.status === 403 && parsed.message === 'EMAIL_NOT_ALLOWED') {
      normalizedMessage = 'EMAIL_NOT_ALLOWED';
    }

    const err = new AloreAuthError(ErrorTypes.FAILED_TO_FETCH, normalizedMessage);
    // @ts-ignore attach server payload for consumers
    err.data = { ...parsed, message: normalizedMessage };
    throw err;
  }

  private async verifyBackendStatus() {
    const endpoint = '/health/ready';
    // eslint-disable-next-line no-undef
    const init: RequestInit = { mode: 'no-cors', cache: 'no-store' } as any;

    try {
      await fetch(`${this.aloreBaseUrl}${endpoint}`, init);
      return { checkedEndpoints: [endpoint] };
    } catch {
      throw new Error('Server down');
    }
  }

  // Capture a concise, serializable snapshot of an unknown error
  // eslint-disable-next-line class-methods-use-this
  private extractErrorInfo(error: unknown) {
    if (error instanceof Error) {
      return { name: error.name, message: error.message, stack: error.stack };
    }
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return { error };
    }
  }
}
