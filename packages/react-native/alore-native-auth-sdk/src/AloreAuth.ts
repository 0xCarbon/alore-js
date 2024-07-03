import crypto, { randomBytes } from "crypto";
import argon2 from "react-native-argon2";
import {
  Passkey,
  PasskeyAuthenticationResult,
  PasskeyRegistrationResult,
} from "react-native-passkey";
import base64url from "base64url";
import { PasskeyAuthenticationRequest } from "react-native-passkey/lib/typescript/Passkey";

export function hashUserInfo(userInfo: string) {
  const hash = crypto.createHash("sha256");
  hash.update(userInfo);
  return hash.digest("hex");
}

type KeyDerivationFunction = "argon2d" | "pbkdf2";

export async function generateSecureHash(
  password: string,
  salt: string,
  keyDerivationFunction: KeyDerivationFunction = "argon2d"
): Promise<string> {
  if (keyDerivationFunction === "argon2d") {
    const result = await argon2(password, salt, {
      hashLength: 32,
      memory: 32768,
      iterations: 3,
      parallelism: 2,
      mode: "argon2d",
    });

    return result.encodedHash;
  }
  throw new Error("Unsupported key derivation function");
}

const DEFAULT_URL = "https://alpha-api.bealore.com/v1";

interface Rp {
  name: string;
  id: string;
}

interface User {
  id: string;
  name: string;
  displayName: string;
}

interface PubKeyCredParam {
  type: string;
  alg: number;
}

interface AuthenticatorSelection {
  requireResidentKey: boolean;
  userVerification: string;
}

interface PublicKeyCredentialCreationOptions {
  rp: Rp;
  user: User;
  challenge: string;
  pubKeyCredParams: PubKeyCredParam[];
  timeout: number;
  attestation: string;
  authenticatorSelection: AuthenticatorSelection;
  extensions: Record<string, unknown>;
}

interface PublicKeyCredentialRequestOptions {
  allowCredentials?: Array<{
    type: string;
    id: string;
    transports?: string[];
  }>;
  challenge: string;
  rpId: string;
  timeout?: number;
  userVerification?: "required" | "preferred" | "discouraged";
  extensions?: Record<string, unknown>;
}

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

  constructor(
    public readonly apiKey: string,
    options?: AloreAuthConfiguration
  ) {
    if (!apiKey) throw new Error("API_KEY is required");

    this.endpoint = options?.endpoint || DEFAULT_URL;
  }

  services = {
    finishPasskeyAuth: async (
      context: AuthMachineContext,
      event: {
        type: "FINISH_PASSKEY_LOGIN";
        payload: {
          passkeyAuth: PasskeyAuthenticationResult;
        };
      }
    ) => {
      const { passkeyAuth } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        `/auth/login-passkey-finish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        if (data?.error?.includes("2FA") || data?.error?.includes("device")) {
          return { error: data?.error };
        }
        throw new Error(data?.message || data?.error || data);
      } else {
        return { error: data?.error || data?.message };
      }
    },
    userInputLoginPasskey: async (
      _: AuthMachineContext,
      event: {
        type: "USER_INPUT_PASSKEY_LOGIN";
        payload: {
          RCRPublicKey: { publicKey: PublicKeyCredentialRequestOptions };
          withSecurityKey?: boolean;
        };
      }
    ) => {
      const publicKey = event.payload.RCRPublicKey?.publicKey;
      const withSecurityKey = event.payload.withSecurityKey || false;

      if (!publicKey) {
        throw new Error("PublicKeyCredentialCreationOptions is undefined");
      }

      const blob = new Uint8Array(randomBytes(32));

      // TODO: add support for security key and ios/android blob/prf
      const loginData: PasskeyAuthenticationRequest = {
        ...publicKey,
        extensions: {
          largeBlob: {
            write: blob,
          },
          prf: { eval: { first: new TextEncoder().encode("Alore") } },
        },
      };

      const result = await Passkey.authenticate(loginData, {
        withSecurityKey,
      });

      return result;
    },
    startPasskeyAuth: async (
      _: AuthMachineContext,
      event: {
        type: "START_PASSKEY_LOGIN";
        payload: {
          email: string;
        };
      }
    ) => {
      const email = event.payload.email;
      const startAuthResponse = await this.fetchWithProgressiveBackoff(
        `/auth/login-passkey`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        if (data?.error?.includes("2FA") || data?.error?.includes("device")) {
          return { error: data?.error };
        }
        throw new Error(data?.message || data?.error || data);
      } else {
        return { error: data?.error || data?.message };
      }
    },
    userInputRegisterPasskey: async (
      _: AuthMachineContext,
      event: {
        type: "USER_INPUT_PASSKEY_REGISTER";
        payload: {
          CCRPublicKey: { publicKey: PublicKeyCredentialCreationOptions };
          withSecurityKey?: boolean;
        };
      }
    ) => {
      const publicKey = event.payload.CCRPublicKey?.publicKey;
      const withSecurityKey = event.payload.withSecurityKey || false;

      if (!publicKey) {
        throw new Error("PublicKeyCredentialCreationOptions is undefined");
      }

      const registerData = {
        challenge: publicKey.challenge,
        rp: {
          name: publicKey.rp.name,
          id: publicKey.rp.id,
        },
        user: {
          id: publicKey.user.id,
          name: publicKey.user.name,
          displayName: publicKey.user.displayName,
        },
        pubKeyCredParams: [
          {
            type: "public-key",
            alg: -7,
          },
          {
            type: "public-key",
            alg: -257,
          },
        ],
        authenticatorSelection: {
          requireResidentKey: true,
          userVerification: "preferred",
        },
        extensions: {
          prf: {},
          largeBlob: {
            support: "required",
          },
        },
      };

      // TODO: add support for security key and ios/android blob/prf
      const result = await Passkey.register(registerData, {
        withSecurityKey,
      });

      return result;
    },
    finishRegisterPasskey: async (
      context: AuthMachineContext,
      event: {
        type: "FINISH_PASSKEY_REGISTER";
        payload: {
          passkeyRegistration: PasskeyRegistrationResult;
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
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userEmail: email,
            userNickname: nickname,
            userDevice: device,
            passkeyRegistration: {
              id: passkeyRegistration.id,
              rawId: base64url.fromBase64(passkeyRegistration.rawId),
              response: {
                attestationObject: base64url.fromBase64(
                  passkeyRegistration.response.attestationObject
                ),
                clientDataJSON: base64url.fromBase64(
                  passkeyRegistration.response.clientDataJSON
                ),
              },
              type: passkeyRegistration.type,
            },
            sessionId: context.sessionId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return data;
      }

      if (response.status === 403) {
        const resJson = await response.json();
        throw new Error(resJson);
      }

      return { error: response?.statusText };
    },
    completeRegistration: async (
      _: AuthMachineContext,
      event: {
        type: "COMPLETE_REGISTRATION";
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
        `/auth/account-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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

      throw new Error(data.message || data.error || "Authentication failed");
    },
    sendConfirmationEmail: async (
      _: AuthMachineContext,
      event:
        | {
            type: "RESEND_CODE";
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
            type: "SEND_REGISTRATION_EMAIL";
            payload: {
              email: string;
              nickname: string;
              isForgeClaim?: boolean;
              locale?: string;
            };
          }
    ) => {
      const { email, nickname, locale } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        `/auth/confirmation-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            nickname,
            locale,
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
    verifyEmail: async (
      context: AuthMachineContext,
      event: {
        type: "VERIFY_EMAIL";
        payload: {
          secureCode: string;
        };
      }
    ) => {
      const { secureCode } = event.payload;
      const response = await this.fetchWithProgressiveBackoff(
        `/auth/registration-code-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        type: "NEXT";
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
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const salt: string = await response.json();
        return { salt };
      }

      return { error: response?.statusText };
    },
    startRegisterPasskey: async (
      _context: AuthMachineContext,
      event: {
        type: "START_PASSKEY_REGISTER";
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
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
    verifyLogin: async (
      _: AuthMachineContext,
      event:
        | {
            type: "VERIFY_LOGIN";
            payload: {
              email: string;
              device: string;
              passwordHash: string;
              isForgeClaim?: boolean | undefined;
              locale?: string | undefined;
            };
          }
        | {
            type: "RESEND_CODE";
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
        `/auth/login-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        if (data?.error?.includes("2FA") || data?.error?.includes("device")) {
          return { error: data?.error };
        }
        throw new Error(data?.message || data?.error || data);
      } else {
        return data;
      }
    },
    verifyEmail2fa: async (
      context: AuthMachineContext,
      event: {
        type: "VERIFY_EMAIL_2FA";
        payload: {
          email: string;
          secureCode: string;
          passwordHash: string;
        };
      }
    ) => {
      const { email, passwordHash, secureCode } = event.payload;

      const response = await this.fetchWithProgressiveBackoff(
        `/auth/email-2fa-verification`,
        {
          method: "POST",
          body: JSON.stringify({
            email,
            passwordHash,
            emailCode: secureCode,
            sessionId: context.sessionId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) return data;

      throw new Error(data.message || data.error || "Authentication failed");
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
    const init: RequestInit = {
      ...options,
      headers: {
        ...options?.headers,
        "X-API-KEY": this.apiKey,
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
        const response = await fetch(`${this.endpoint}${url}`, init);

        if (response.ok || attempt === maxAttempts || response.status !== 500) {
          return response;
        }
      } catch (error) {
        console.error(error);

        if (
          error instanceof TypeError &&
          error.message === "Failed to fetch" &&
          attempt >= maxAttempts
        ) {
          console.error(
            "Connection refused, the backend is probably not running."
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
      const url = `${this.endpoint}/health-check`;
      const basePath = url.match(/(https?:\/\/[^\//]+)/);

      if (!basePath || basePath.length < 2) {
        throw new Error("Failed to fetch");
      }

      const res = await fetch(`${basePath[1]}/health-check`);

      if (!res.ok) {
        throw new Error("Failed to fetch");
      }
    } catch {
      throw new Error("Server down");
    }
  }
}