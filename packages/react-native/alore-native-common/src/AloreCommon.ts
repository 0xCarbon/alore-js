import crypto from 'react-native-quick-crypto';
import argon2 from 'react-native-argon2';
import {
  AloreCommonConfiguration,
  FetchWithProgressiveBackoffConfig,
  KeyDerivationFunction,
} from './index';

const DEFAULT_URL = 'https://alpha-api.bealore.com/v1';

export type AloreCommonType = InstanceType<typeof AloreCommon>;

export class AloreCommon {
  public readonly endpoint: string;
  public readonly accessToken?: string;
  public readonly refreshToken?: string;
  public readonly emailTemplate?: string;

  constructor(
    public readonly apiKey: string,
    options?: AloreCommonConfiguration
  ) {
    if (!apiKey) throw new Error('API_KEY is required');

    this.endpoint = options?.endpoint || DEFAULT_URL;
    this.accessToken = options?.accessToken;
    this.refreshToken = options?.refreshToken;
    this.emailTemplate = options?.emailTemplate;
  }

  public async fetchWithProgressiveBackoff(
    url: RequestInfo | URL,
    options?: RequestInit,
    config?: FetchWithProgressiveBackoffConfig
  ) {
    const { maxAttempts = 3, initialDelay = 200 } = config || {};

    let attempt = 0;
    let delayValue = initialDelay;

    let init: RequestInit = {
      ...options,
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
        await this.delay(delayValue);
        delayValue *= 2;
      }

      attempt += 1;
      try {
        const response = await fetch(new URL(`${this.endpoint}${url}`), init);

        if (response.status === 401 && !url.toString().startsWith('/auth')) {
          const data = await response.json();

          if (data === 'ExpiredSignature') {
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

  public hashUserInfo(userInfo: string) {
    const hash = crypto.createHash('sha256');
    hash.update(userInfo);
    return hash.digest('hex');
  }

  public async generateSecureHash(
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

  private async delay(ms: number) {
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
