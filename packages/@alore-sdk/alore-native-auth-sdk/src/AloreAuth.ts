// import { startAuthentication } from '@simplewebauthn/browser';
// import ethers from 'ethers';
// import base64url from 'base64url';
// import crypto from 'crypto';
// import argon2 from 'argon2-browser';
// import Cookies from 'js-cookie';
// import { jwtDecode } from 'jwt-decode';

// import { Passkey } from 'react-native-passkey';
// import { PasskeyRegistrationRequest } from 'react-native-passkey/lib/typescript/Passkey';

export function hashUserInfo(userInfo: string) {
  // const hash = crypto.createHash('sha256');
  // hash.update(userInfo);
  // return hash.digest('hex');
}

const DEFAULT_URL = 'https://alpha-api.bealore.com/v1';

export interface AloreAuthConfiguration {
  endpoint?: string;
  accessToken?: string;
  refreshToken?: string;
}

type FetchWithProgressiveBackoffConfig = {
  maxAttempts?: number;
  initialDelay?: number;
};

type SessionUser = {
  created_at: string;
  device: string;
  device_created_at: string;
  email: string;
  id: string;
  last_login: string | null;
  last_transaction: string | null;
  nickname: string;
  status: string;
  access_token: string;
  refresh_token: string;
};

export type TwoFactorAuth = {
  id: string;
  name: string | null;
  twoFaTypeId: number;
};

interface AuthMachineContext {
  salt?: string;
  error?: string;
  active2fa?: TwoFactorAuth[];
  registerUser?: {
    email: string;
    nickname: string;
    salt: string;
  };
  forgeData?: any;
  googleOtpCode?: string;
  googleUser?: { email: string; nickname: string };
  sessionUser?: SessionUser;
  CCRPublicKey?: { publicKey: PublicKeyCredentialCreationOptions };
  RCRPublicKey?: { publicKey: PublicKeyCredentialRequestOptions };
  credentialEmail?: string;
}

export class AloreAuth {
  protected readonly endpoint: string;
  protected readonly accessToken?: string;
  protected readonly refreshToken?: string;

  constructor(
    public readonly apiKey: string,
    options?: AloreAuthConfiguration
  ) {
    if (!apiKey) throw new Error('API_KEY is required');

    this.endpoint = options?.endpoint || DEFAULT_URL;

    if (!apiKey) throw new Error('API_KEY is required');

    this.endpoint = options?.endpoint || DEFAULT_URL;
    this.accessToken = options?.accessToken;
    this.refreshToken = options?.refreshToken;
  }

  services = {
    sendConfirmationEmail: async (
      _: AuthMachineContext,
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

      const response = await fetch(`${this.endpoint}/auth/confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          nickname,
        }),
      });

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
      _: AuthMachineContext,
      event: {
        type: 'NEXT';
        payload: {
          email: string;
        };
      }
    ) => {
      const { email } = event.payload;
      const response = await fetch(`${this.endpoint}/auth/salt/${email}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const salt: string = await response.json();
        return { salt };
      }

      return { error: response?.statusText };
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

      const startPasskeyRegistrationResponse = await fetch(
        `${this.endpoint}/auth/account-registration-passkey`,
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

      const ccr = await startPasskeyRegistrationResponse.json();

      return ccr;
    },
  };

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
    let init: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...options?.headers,
        'X-API-KEY': this.apiKey,
      },
    };

    if (this.accessToken) {
      init = {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${this.accessToken}`,
        },
      };
    }

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

        if (response.status === 401 && !url.toString().startsWith('/auth')) {
          // eslint-disable-next-line no-await-in-loop
          const data = await response.json();

          if (data === 'ExpiredSignature') {
            // eslint-disable-next-line no-await-in-loop
            const refreshResponse = await fetch(
              new URL(
                `${this.endpoint}/auth/exchange-jwt-token/${this.refreshToken}`
              )
            );

            if (!refreshResponse.ok) {
              console.error('Refresh token failed');
              return response;
            }

            throw new Error('ExpiredSignature');
          } else if (
            typeof data === 'string' &&
            data.includes('No Authorization header')
          ) {
            return response;
          }
        }

        if (response.ok || attempt === maxAttempts || response.status !== 500)
          return response;
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

  private async delay(ms: number) {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, ms));
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
