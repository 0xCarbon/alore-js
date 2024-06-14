// import { startAuthentication } from '@simplewebauthn/browser';
// import ethers from 'ethers';
// import base64url from 'base64url';
import crypto from 'crypto';
import argon2 from 'react-native-argon2';
// import { jwtDecode } from 'jwt-decode';

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
    const result = await argon2(password, salt, {
      hashLength: 32,
      memory: 32768,
      iterations: 3,
      parallelism: 2,
      mode: 'argon2d',
    });

    return result.encodedHash;
  }
  throw new Error('Unsupported key derivation function');
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
    this.accessToken = options?.accessToken;
    this.refreshToken = options?.refreshToken;
  }

  services = {
    completeRegistration: async (
      _: AuthMachineContext,
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

      const response = await fetch(
        `${this.endpoint}/auth/account-registration`,
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
      const { email, nickname, locale } = event.payload;

      const response = await fetch(`${this.endpoint}/auth/confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          nickname,
          locale,
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
      const response = await fetch(
        `${this.endpoint}/auth/registration-code-verification`,
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
