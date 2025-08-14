import { startAuthentication } from '@simplewebauthn/browser';

import {
  AuthMachineContext,
  AuthProviderConfig,
  FetchWithProgressiveBackoffConfig,
  ForgeData,
} from '../types';
import { AloreAuthError, ErrorTypes } from './AuthError';

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
    // Utility to check if an email is allowed based on allowedEmailDomains config
    isEmailAllowed: (context: AuthMachineContext, email?: string | null) => {
      const allowedConf = context.authProviderConfigs?.allowedEmailDomains;
      const allowedList =
        // eslint-disable-next-line no-nested-ternary
        typeof allowedConf === 'string'
          ? [allowedConf]
          : Array.isArray(allowedConf)
            ? allowedConf
            : [];
      if (allowedList.length === 0) return true;
      if (!email) return false;
      const domain = (email.split('@')[1] || '').toLowerCase();
      // Allow items like '@bealore.com' or 'bealore.com'
      return allowedList.some((d) => {
        const normalized = d.startsWith('@') ? d.slice(1) : d;
        return domain === normalized.toLowerCase();
      });
    },
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
      if (!this.services.isEmailAllowed(context, email)) {
        throw new AloreAuthError(
          ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
          'Email domain not allowed',
          400,
        );
      }
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
      return { error: response?.statusText };
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

      const data = await response.json();
      throw new Error(data?.message || data?.error || data);
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
      if (!this.services.isEmailAllowed(context, email)) {
        throw new AloreAuthError(
          ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
          'Email domain not allowed',
          400,
        );
      }
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

      throw new Error(data.message || data.error || 'Authentication failed');
    },
    confirmPassword: async (
      context: AuthMachineContext,
      event: {
        type: 'CONFIRM_PASSWORD';
        payload: {
          email: string;
          passwordHash: string;
        };
      },
    ) => {
      const { email, passwordHash } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(`/auth/v1/password-creation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPasswordHash: passwordHash,
        }),
      });

      if (!response.ok) return {};

      return { error: response?.statusText };
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
              isForgeClaim?: boolean | undefined;
              locale?: string | undefined;
            };
          }
        | {
            type: 'SEND_REGISTRATION_EMAIL';
            payload: {
              email: string;
              nickname?: string;
              isForgeClaim?: boolean;
              locale?: string;
            };
          },
    ) => {
      const { email, nickname, locale } = event.payload;
      if (!this.services.isEmailAllowed(context, email)) {
        throw new AloreAuthError(
          ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
          'Email domain not allowed',
          400,
        );
      }
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

      if (response.status === 403) {
        const resJson = await response.json();
        throw new Error(resJson);
      }

      return { error: response?.statusText };
    },
    sendCode: async (
      context: AuthMachineContext,
      event: {
        type: 'SEND_CODE';
        payload: {
          email: string;
        };
      },
    ) => {
      const { email } = event.payload;
      if (!this.services.isEmailAllowed(context, email)) {
        throw new AloreAuthError(
          ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
          'Email domain not allowed',
          400,
        );
      }
      const response = await this.fetchWithProgressiveBackoff(`/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      if (!response.ok) return { error: response?.statusText };

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
              isForgeClaim?: boolean | undefined;
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
              isForgeClaim?: boolean | undefined;
              locale?: string | undefined;
            };
          },
    ) => {
      const { email, passwordHash, device, locale } = event.payload;
      if (!this.services.isEmailAllowed(context, email || context.credentialEmail)) {
        throw new AloreAuthError(
          ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
          'Email domain not allowed',
          400,
        );
      }
      const { credentialEmail } = context;

      const searchParams = new URLSearchParams();
      const url = '/auth/v1/login-verification';

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
            email: email || credentialEmail,
            passwordHash,
            device,
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
        throw new Error(data?.message || data?.error || data);
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
      if (email && !this.services.isEmailAllowed(context, email)) {
        throw new AloreAuthError(
          ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
          'Email domain not allowed',
          400,
        );
      }

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
      if (email && !this.services.isEmailAllowed(context, email)) {
        throw new AloreAuthError(
          ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
          'Email domain not allowed',
          400,
        );
      }

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
      if (email && !this.services.isEmailAllowed(context, email)) {
        throw new AloreAuthError(
          ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
          'Email domain not allowed',
          400,
        );
      }

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

      throw new AloreAuthError(ErrorTypes.FAILED_TO_FETCH, data.message || data.error || data);
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

      throw new Error(data.message || data.error || 'Authentication failed');
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

      const credential = await startAuthentication(
        optionsData.requestChallengeResponse.publicKey,
      ).catch((err) => {
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

      throw new Error(data.message || data.error || 'Authentication failed');
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
        };
      },
    ) => {
      const { email, passwordHash, secureCode } = event.payload;
      const { credentialEmail, authProviderConfigs } = context;
      if (!this.services.isEmailAllowed(context, email || credentialEmail)) {
        throw new AloreAuthError(
          ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
          'Email domain not allowed',
          400,
        );
      }
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
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data = await response.json();

      if (response.ok) return data;

      throw new Error(data.message || data.error || 'Authentication failed');
    },
    verifyEmailEligibility: async (
      _: AuthMachineContext,
      event: {
        type: 'VERIFY_EMAIL_ELIGIBILITY';
        email: string;
        isForgeClaim?: boolean | undefined;
        locale?: string | undefined;
      },
    ) => {
      const { email } = event;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/v1/email-eligibility-verification',
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

      const data = await response.json();

      if (!response.ok) throw new Error(data?.message || data?.error || data);

      return data;
    },
    verifyClaimNftEmail2fa: async (
      context: AuthMachineContext,
      event: {
        type: 'VERIFY_CLAIM_NFT_EMAIL_2FA';
        payload: {
          email: string;
          emailCode: string;
        };
      },
    ) => {
      const { email, emailCode } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/v1/eligible-email-code-verification',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            emailCode,
            sessionId: context.sessionId,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data = await response.json();

      if (response.ok) return data;

      throw new Error(data || 'Authentication failed');
    },
    fetchForgeData: async (
      _: AuthMachineContext,
      event: {
        type: 'INITIALIZE';
        forgeId?: string | null | undefined;
      },
    ) => {
      const response = await this.fetchWithProgressiveBackoff(`/forges/${event.forgeId}`);

      const data = (await response.json()) as ForgeData;

      if (!response.ok) {
        throw new Error(`Failed to fetchWithProgressiveBackoff: ${data}`);
      }

      return data;
    },
    // Google login flow
    googleLogin: async (
      context: AuthMachineContext,
      event: {
        type: 'GOOGLE_LOGIN';
        payload: {
          accessToken: string;
          providerName: string;
        };
      },
    ) => {
      const { accessToken, providerName } = event.payload;
      const { authProviderConfigs } = context;
      const { firebaseCompatible } = authProviderConfigs || {};

      const response = await this.fetchWithProgressiveBackoff(
        `/auth/v1/google-login${firebaseCompatible ? `?firebaseCompatibleToken=${firebaseCompatible}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken,
            provider: providerName,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        if (!this.services.isEmailAllowed(context, data.email)) {
          throw new AloreAuthError(
            ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
            'Email domain not allowed',
            400,
          );
        }
        return {
          googleOtpCode: data.otpCode,
          salt: data.salt,
          googleUser: {
            email: data.email,
            nickname: data.nickname,
            salt: data.salt,
          },
          sessionId: data.sessionId,
        };
      }

      if (response.status === 404) {
        if (!this.services.isEmailAllowed(context, data.email)) {
          throw new AloreAuthError(
            ErrorTypes.EMAIL_DOMAIN_NOT_ALLOWED,
            'Email domain not allowed',
            400,
          );
        }
        return {
          isNewUser: true,
          socialProviderRegisterUser: {
            email: data.email,
            nickname: data.nickname,
            salt: data.salt,
          },
        };
      }

      if (!response.ok) throw new Error(data.error || data.message || data);

      return {};
    },
    verifyGoogleLogin: async (
      context: AuthMachineContext,
      event: {
        type: 'COMPLETE_GOOGLE_SIGN_IN';
        payload: {
          email: string;
          passwordHash: string;
          otp: string;
        };
      },
    ) => {
      const { email, passwordHash, otp } = event.payload;

      const response = await this.fetchWithProgressiveBackoff('/auth/v1/google-2fa-verification', {
        method: 'POST',
        body: JSON.stringify({
          email,
          emailCode: otp,
          passwordHash,
          sessionId: context.sessionId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) return data;

      throw new Error(data.message || data.error || 'Authentication failed');
    },
  };

  // eslint-disable-next-line class-methods-use-this
  private async delay(ms: number) {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, ms));
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

    // eslint-disable-next-line no-undef
    const init: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...options?.headers,
        'X-CLIENT-ID': this.clientId,
        'CF-Connecting-IP': '127.0.0.1',
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

        if (
          error instanceof TypeError &&
          error.message === 'Failed to fetch' &&
          attempt >= maxAttempts
        ) {
          console.error('Connection refused, the backend is probably not running.');
          this.verifyBackendStatus();
        } else if (attempt < maxAttempts) {
          console.error(`Attempt ${attempt} failed, retrying in ${delayValue}ms...`);
        }
      }
    }

    throw new Error(`Max attempts (${maxAttempts}) exceeded`);
  }

  private async verifyBackendStatus() {
    try {
      const res = await fetch(`${this.aloreBaseUrl}/health-check`);

      if (!res.ok) {
        throw new Error('Failed to fetch');
      }
    } catch {
      throw new Error('Server down');
    }
  }
}
