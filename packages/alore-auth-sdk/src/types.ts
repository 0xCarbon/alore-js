export type FetchWithProgressiveBackoffConfig = {
  maxAttempts?: number;
  initialDelay?: number;
};

export type KeyDerivationFunction = 'argon2d' | 'pbkdf2';

/**
 * Configuration options for Auth Provider.
 *
 * @property rpDomain - Optional relying party domain, used for passkey.
 * @property locale - Optional locale for translation.
 * @property emailTemplate - Optional email template for authentication-related emails.
 * @property requireEmailVerification - Optional boolean to require email verification.
 * @property requireUsername - Optional boolean to require username.
 * @property passwordMinLength - Optional number for password minimum length.
 * @property enablePasskeys - Optional boolean to enable passkeys.
 * @property enablePasswords - Optional boolean to enable passwords.
 * @property socialLoginEnabled - Optional boolean to enable social login.
 * @property privacyPolicyUrl - Optional string for privacy policy URL.
 * @property termsOfServiceUrl - Optional string for terms of service URL.
 * @property logoUrl - Optional string for logo URL.
 * @property socialProviders - Optional social login providers.
 * @property enableWalletCreation - Optional boolean to enable wallet creation.
 */
export interface AuthProviderConfig {
  rpDomain?: string;
  locale?: 'pt' | 'en';
  emailTemplate?: string;
  requireEmailVerification?: boolean;
  requireUsername?: boolean;
  passwordMinLength?: number;
  enablePasskeys?: boolean;
  enablePasswords?: boolean;
  socialLoginEnabled?: boolean;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  logoUrl?: string;
  socialProviders?: SocialProvider[];
  /**
   * Where Microsoft returns the popup. Must be a page that does NOT boot the
   * consuming app: MSAL reads the token off this window's URL fragment, and an
   * app that routes on load (locale redirects, auth guards) clears the fragment
   * first, failing the sign-in with `hash_empty_error`. A blank static file is
   * the documented choice. Defaults to the origin, which only works for apps
   * that do not navigate on load.
   */
  microsoftRedirectUri?: string;
  enableWalletCreation?: boolean;
  firebaseCompatible?: boolean;
}

export interface AuthMachineContext {
  authProviderConfigs?: AuthProviderConfig;
  salt?: string;
  error?: string;
  active2fa?: TwoFactorAuth[];
  sessionId?: string;
  // The pending emailed-code challenge from a social sign-in whose provider
  // does not vouch for the address. Carries the id_token so the second call
  // can present the same one the challenge was raised for.
  socialChallenge?: {
    sessionId: string;
    idToken: string;
    providerName: string;
    device?: string;
  };
  registerUser?: {
    email: string;
    nickname: string;
    salt?: string;
  };
  sessionUser?: SessionUser;
  // eslint-disable-next-line no-undef
  CCRPublicKey?: { publicKey: PublicKeyCredentialCreationOptions };
  // eslint-disable-next-line no-undef
  RCRPublicKey?: { publicKey: PublicKeyCredentialRequestOptions };
  credentialEmail?: string;
}

type SessionUser = {
  createdAt: string;
  device: string;
  deviceCreatedAt: string;
  email: string;
  id: string;
  lastLogin: string | null;
  lastTransaction: string | null;
  nickname: string | null;
  /** Provider-hosted profile photo URL, when the account was created or
   * linked through social login. Always https; null otherwise. */
  picture: string | null;
  status: string;
  accessToken: string;
  refreshToken: string;
};

export type TwoFactorAuth = {
  id: string;
  name: string | null;
  twoFaTypeId: number;
};

export interface SocialProvider {
  id: string;
  providerName: string;
  clientId: string;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type StepUpAmr = 'pwd' | 'otp' | 'hwk' | 'fed' | 'email_otp' | (string & {});

export type StepUpPurpose = 'staff_mfa' | 'customer_reauth';

export type StepUpMethod = 'totp' | 'passkey' | 'hw_key';

export type CustomerReauthMethod =
  | 'passkey'
  | 'hw_key'
  | 'password'
  | 'password_totp'
  | 'email_code';

export type CustomerReauthScope =
  | 'customer_reauth'
  | 'support_access_grant'
  | 'account_action'
  | 'security_action';

export type StepUpChallengeMethod = 'passkey' | 'hw_key' | 'email_code';

export interface StepUpFactorsResponse {
  enrolled: boolean;
  totp: boolean;
  passkey: boolean;
  hardwareKey: boolean;
  methods: StepUpMethod[];
  password: boolean;
  emailCode: boolean;
  customerMethods: CustomerReauthMethod[];
}

export interface StepUpChallengeRequest {
  method: StepUpChallengeMethod;
  purpose?: StepUpPurpose;
  rpOrigin?: string;
  locale?: string;
}

export interface StepUpChallengeResponse {
  method: StepUpChallengeMethod;
  sessionId: string;
  requestChallengeResponse?: {
    publicKey: Record<string, unknown>;
  };
  expiresAt?: number;
}

export interface CustomerStepUpEmailChallengeResponse {
  method: 'email_code';
  sessionId: string;
  expiresAt: number;
}

export type PasskeyAuthenticatorFn = (
  // eslint-disable-next-line no-unused-vars
  optionsJSON: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

export type PasswordHashFn = (
  // eslint-disable-next-line no-unused-vars
  password: string,
  // eslint-disable-next-line no-unused-vars
  salt: string,
) => Promise<string>;

export type CustomerStepUpPasskeyInput =
  | {
      method: 'passkey' | 'hw_key';
      credential: Record<string, unknown>;
      sessionId: string;
      rpOrigin?: string;
      scope?: CustomerReauthScope;
    }
  | {
      method: 'passkey' | 'hw_key';
      credential?: undefined;
      sessionId?: undefined;
      rpOrigin?: string;
      scope?: CustomerReauthScope;
      authenticatePasskey?: PasskeyAuthenticatorFn;
    };

export type CustomerStepUpPasswordInput =
  | {
      method: 'password';
      passwordHash: string;
      otp?: string;
      scope?: CustomerReauthScope;
    }
  | {
      method: 'password';
      password: string;
      email?: string;
      salt?: string;
      otp?: string;
      scope?: CustomerReauthScope;
      hashPassword?: PasswordHashFn;
    };

export interface CustomerStepUpEmailCodeInput {
  method: 'email_code';
  emailCode: string;
  sessionId: string;
  scope?: CustomerReauthScope;
}

export type CustomerStepUpInput =
  | CustomerStepUpPasskeyInput
  | CustomerStepUpPasswordInput
  | CustomerStepUpEmailCodeInput;

export interface CustomerStepUpResult {
  reauthToken: string;
  purpose: 'customer_reauth';
  scope: CustomerReauthScope;
  amr: StepUpAmr[];
  authTime: number;
  expiresAt: number;
  jti: string;
}

export type StaffStepUpInput =
  | {
      method: 'totp';
      otp: string;
    }
  | {
      method: 'passkey' | 'hw_key';
      credential: Record<string, unknown>;
      sessionId: string;
      rpOrigin?: string;
    }
  | {
      method: 'passkey' | 'hw_key';
      credential?: undefined;
      sessionId?: undefined;
      rpOrigin?: string;
      authenticatePasskey?: PasskeyAuthenticatorFn;
    };

export interface StaffStepUpResult {
  accessToken: string;
  refreshToken: string;
  amr: StepUpAmr[];
  authTime: number;
  expiresAt: number;
}
