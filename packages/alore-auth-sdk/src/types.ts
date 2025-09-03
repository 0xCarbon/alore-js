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
  enableWalletCreation?: boolean;
  firebaseCompatible?: boolean;
}

export interface AuthMachineContext {
  authProviderConfigs?: AuthProviderConfig;
  salt?: string;
  error?: string;
  active2fa?: TwoFactorAuth[];
  registerUser?: {
    email: string;
    nickname: string;
    salt?: string;
  };
  forgeData?: ForgeData;
  googleOtpCode?: string;
  googleUser?: { email: string; nickname: string };
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

export interface ForgeData {
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

export interface SocialProvider {
  id: string;
  providerName: string;
  clientId: string;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
