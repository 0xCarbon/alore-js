import { startAuthentication } from '@simplewebauthn/browser';
import ethers from 'ethers';
import crypto from 'crypto';
import argon2 from 'argon2-browser';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export function hashUserInfo(userInfo: string) {
  const hash = crypto.createHash('sha256');
  hash.update(userInfo);
  return hash.digest('hex');
}

type KeyDerivationFunction = 'argon2d' | 'pbkdf2';

export async function generateSecureHash(
  password: string,
  salt: string,
  keyDerivationFunction: KeyDerivationFunction = 'argon2d'
): Promise<string> {
  if (keyDerivationFunction === 'argon2d') {
    const result = await argon2.hash({
      pass: password,
      salt,
      type: argon2.ArgonType.Argon2d,
      hashLen: 32,
      mem: 32768,
      time: 3,
      parallelism: 2,
    });

    return result.encoded;
  }
  throw new Error('Unsupported key derivation function');
}

const DEFAULT_URL = 'https://alpha-api.bealore.com/v1';

export interface AloreAuthConfiguration {
  endpoint?: string;
}

type FetchWithProgressiveBackoffConfig = {
  maxAttempts?: number;
  initialDelay?: number;
};

type SessionUser = {
  createdAt: string;
  device: string;
  deviceCreatedAt: string;
  email: string;
  id: string;
  lastLogin: string | null;
  lastTransaction: string | null;
  nickname: string;
  status: string;
  accessToken: string;
  refreshToken: string;
};

export type TwoFactorAuth = {
  id: string;
  name: string | null;
  twoFaTypeId: number;
};

interface ForgeData {
  tokenAddress: string;
  name: string;
  symbol: string;
  contractType: string;
  id: string;
  mintMethod: string;
  maxSupply: number;
  endTime: string;
  contractAddress: string;
  chainId: number;
}

interface AuthMachineContext {
  salt?: string;
  error?: string;
  active2fa?: TwoFactorAuth[];
  sessionId?: string;
  registerUser?: {
    email: string;
    nickname: string;
    salt?: string;
  };
  forgeData?: ForgeData;
  googleOtpCode?: string;
  googleUser?: { email: string; nickname: string };
  sessionUser?: SessionUser;
  CCRPublicKey?: { publicKey: PublicKeyCredentialCreationOptions };
  RCRPublicKey?: { publicKey: PublicKeyCredentialRequestOptions };
  credentialEmail?: string;
}

export class AloreAuth {
  protected readonly endpoint: string;
  protected readonly configuration: string;

  constructor(
    public readonly apiKey: string,
    options?: AloreAuthConfiguration
  ) {
    if (!apiKey) throw new Error('API_KEY is required');

    this.endpoint = options?.endpoint || DEFAULT_URL;

    this.configuration = 'TODO';

    // this.configuration = Base64.encode(
    //   JSON.stringify({
    //     API_KEY: this.apiKey,
    //   })
    // );
  }

  services = {
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
      }
    ) => {
      const { email, nickname, passwordHash, device } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        '/auth/account-registration',
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
        }
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
      }
    ) => {
      const { email, passwordHash } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        `/auth/password-creation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            newPasswordHash: passwordHash,
          }),
        }
      );

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
              nickname: string;
              isForgeClaim?: boolean;
              locale?: string;
            };
          }
    ) => {
      const { email, nickname } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/confirmation-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            nickname,
          }),
        }
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
    retrieveSalt: async (
      context: AuthMachineContext,
      event: {
        type: 'NEXT';
        payload: {
          email: string;
        };
      }
    ) => {
      const { email } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        `/auth/salt/${email}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const salt: string = await response.json();
        return { salt };
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
      }
    ) => {
      const { email } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        `/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      if (!response.ok) return { error: response?.statusText };

      return {};
    },
    startRegisterPasskey: async (
      _context: AuthMachineContext,
      event: {
        type: 'START_PASSKEY_REGISTER';
        payload: {
          device: string;
          email: string;
          nickname?: string;
        };
      }
    ) => {
      const { email, nickname, device } = event.payload;

      const startPasskeyRegistrationResponse =
        await this.fetchWithProgressiveBackoff(
          `/auth/account-registration-passkey`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userEmail: email,
              userNickname: nickname,
              userDevice: device,
            }),
          }
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
      }
    ) => {
      const { email, nickname, device, passkeyRegistration } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        `/auth/account-registration-passkey-finish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: email,
            userNickname: nickname,
            userDevice: device,
            passkeyRegistration,
            sessionId: context.sessionId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) return data;
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
          }
    ) => {
      const { passkeyAuth } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        `/auth/login-passkey-finish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ passkeyAuth, sessionId: context.sessionId }),
        }
      );
      const data = await response.json();
      if (response.ok) return data;

      if (!response.ok) {
        if (response.status === 403) {
          return { active2fa: data };
        }
        if (data?.error?.includes('2FA') || data?.error?.includes('device')) {
          return { error: data?.error };
        }
        throw new Error(data?.message || data?.error || data);
      } else {
        return { error: data?.error || data?.message };
      }
    },
    startPasskeyAuth: async (
      context: AuthMachineContext,
      event: {
        type: 'START_PASSKEY_LOGIN';
        payload: {
          email: string;
        };
      }
    ) => {
      const email =
        (event.type === 'START_PASSKEY_LOGIN' && event.payload?.email) ||
        context?.credentialEmail;
      const startAuthResponse = await this.fetchWithProgressiveBackoff(
        `/auth/login-passkey`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await startAuthResponse.json();

      if (startAuthResponse.ok) return data;

      if (!startAuthResponse.ok) {
        if (startAuthResponse.status === 403) {
          return { active2fa: data };
        }
        if (data?.error?.includes('2FA') || data?.error?.includes('device')) {
          return { error: data?.error };
        }
        throw new Error(data?.message || data?.error || data);
      } else {
        return { error: data?.error || data?.message };
      }
    },
    verifyLogin: async (
      _: AuthMachineContext,
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
          }
    ) => {
      const { email, passwordHash, device } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/login-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            passwordHash,
            device,
          }),
        }
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
      }
    ) => {
      const { email, passwordHash, device, otp } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/sw-2fa-verification',
        {
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
        }
      );

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
      }
    ) => {
      const { email, passwordHash, device, authId } = event.payload;

      const optionsResponse = await this.fetchWithProgressiveBackoff(
        '/auth/hw-2fa-start-verification',
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
        }
      );
      if (optionsResponse.status !== 200) {
        throw new Error(optionsResponse.statusText);
      }

      const optionsData = await optionsResponse.json();

      const credential = await startAuthentication(
        optionsData.requestChallengeResponse.publicKey
      ).catch((err) => {
        throw new Error(err);
      });

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/hw-2fa-finish-verification',
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
        }
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
      }
    ) => {
      const { email, passwordHash, device, secureCode } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/device-ownership-verification',
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
        }
      );

      const data = await response.json();

      if (response.ok) return data;

      throw new Error(data.message || data.error || 'Authentication failed');
    },
    verifyEmail: async (
      context: AuthMachineContext,
      event: {
        type: 'VERIFY_EMAIL';
        payload: {
          secureCode: string;
        };
      }
    ) => {
      const { secureCode } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        '/auth/registration-code-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailCode: secureCode,
            sessionId: context.sessionId,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || data?.error || data);
      } else {
        return {};
      }
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
      }
    ) => {
      const { email, passwordHash, secureCode } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/email-2fa-verification',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            passwordHash,
            emailCode: secureCode,
            sessionId: context.sessionId,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
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
      }
    ) => {
      const { email } = event;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/email-eligibility-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
          }),
        }
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
      }
    ) => {
      const { email, emailCode } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/eligible-email-code-verification',
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
        }
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
      }
    ) => {
      const response = await this.fetchWithProgressiveBackoff(
        `/forges/${event.forgeId}`
      );

      const data = (await response.json()) as ForgeData;

      if (!response.ok) {
        throw new Error(`Failed to fetchWithProgressiveBackoff: ${data}`);
      }

      return data;
    },
    googleLogin: async (
      _: AuthMachineContext,
      event: {
        type: 'GOOGLE_LOGIN';
        googleToken: string;
      }
    ) => {
      const { googleToken } = event;
      const response = await this.fetchWithProgressiveBackoff(
        '/auth/google-login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: googleToken,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
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
        return {
          isNewUser: true,
          registerUser: {
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
      }
    ) => {
      const { email, passwordHash, otp } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        '/auth/google-2fa-verification',
        {
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
        }
      );

      const data = await response.json();

      if (response.ok) return data;

      throw new Error(data.message || data.error || 'Authentication failed');
    },
  };

  private async delay(ms: number) {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async fetchWithProgressiveBackoff(
    // eslint-disable-next-line no-undef
    url: RequestInfo | URL,
    // eslint-disable-next-line no-undef
    options?: RequestInit,
    config?: FetchWithProgressiveBackoffConfig
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
        'X-API-KEY': this.apiKey,
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
        const response = await fetch(new URL(`${this.endpoint}${url}`), init);

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
          console.error(
            'Connection refused, the backend is probably not running.'
          );
          this.verifyBackendStatus();
        } else if (attempt < maxAttempts) {
          console.error(
            `Attempt ${attempt} failed, retrying in ${delayValue}ms...`
          );
        }
      }
    }

    throw new Error(`Max attempts (${maxAttempts}) exceeded`);
  }

  private async verifyBackendStatus() {
    try {
      const res = await fetch(`${this.endpoint}/health-check`);

      if (!res.ok) {
        throw new Error('Failed to fetch');
      }
    } catch {
      throw new Error('Server down');
    }
  }
}
