import {
  PasskeyCreateRequest,
  PasskeyCreateResult,
  PasskeyGetRequest,
  PasskeyGetResult,
} from 'react-native-passkey';
import { AloreCommonType } from './AloreCommon';

interface AloreCommonConfiguration {
  endpoint?: string;
  accessToken?: string;
  refreshToken?: string;
  emailTemplate?: string;
}

type FetchWithProgressiveBackoffConfig = {
  maxAttempts?: number;
  initialDelay?: number;
};

type KeyDerivationFunction = 'argon2d' | 'pbkdf2';

type Locale = 'en' | 'pt';

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

type TwoFactorAuth = {
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
  CCRPublicKey?: { publicKey: PasskeyCreateRequest };
  RCRPublicKey?: { publicKey: PasskeyGetRequest };
  passkeyRegistrationResult?: PasskeyCreateResult;
  passkeyLoginResult?: PasskeyGetResult;
  credentialEmail?: string;
  isFirstLogin?: boolean;
  locale: Locale;
  authMethods: {
    password?: boolean;
    passkey?: boolean;
    google?: boolean;
  };
  userEmail?: string;
  secret?: string;
}

type InitializeEvent = { type: 'INITIALIZE' };

type LogoutEvent = { type: 'LOGOUT' };

type ResetContextEvent = { type: 'RESET_CONTEXT' };

type RegisterStepEvent = { type: 'REGISTER_STEP' };

type LoginStepEvent = { type: 'LOGIN_STEP' };

type BackEvent = { type: 'BACK' };

type NextEvent = { type: 'NEXT' };

type StartPasskeyLoginEvent = {
  type: 'START_PASSKEY_LOGIN';
  payload?: {
    email: string;
  };
};

type UserInputPasskeyLoginEvent = {
  type: 'USER_INPUT_PASSKEY_LOGIN';
  payload: {
    RCRPublicKey: { publicKey: PasskeyGetRequest };
  };
};

type FinishPasskeyLoginEvent = {
  type: 'FINISH_PASSKEY_LOGIN';
  payload: {
    passkeyAuth: PasskeyGetResult;
  };
};

type StartPasskeyRegisterEvent = {
  type: 'START_PASSKEY_REGISTER';
  payload: {
    device: string;
    email: string;
    nickname: string;
  };
};

type UserInputPasskeyRegisterEvent = {
  type: 'USER_INPUT_PASSKEY_REGISTER';
  payload: {
    CCRPublicKey: { publicKey: PasskeyCreateRequest };
    email: string;
    nickname: string;
  };
};

type FinishPasskeyRegisterEvent = {
  type: 'FINISH_PASSKEY_REGISTER';
  payload: {
    passkeyRegistration: PasskeyCreateResult;
    email: string;
    nickname: string;
    device: string;
  };
};

type FetchSaltEvent = { type: 'FETCH_SALT'; payload: { email: string } };

type GoogleLoginEvent = {
  type: 'GOOGLE_LOGIN';
  googleToken: string;
};

type SendRegistrationEmailEvent = {
  type: 'SEND_REGISTRATION_EMAIL';
  payload: {
    email: string;
    nickname: string;
    isForgeClaim?: boolean;
    locale?: string;
  };
};

type ResendCodeEvent = {
  type: 'RESEND_CODE';
  payload: {
    email: string;
    nickname?: string;
    device?: string;
    passwordHash?: string;
    isForgeClaim?: boolean;
    locale?: string;
  };
};

type VerifyEmailEvent = {
  type: 'VERIFY_EMAIL';
  payload: { secureCode: string };
};

type CompleteRegistrationEvent = {
  type: 'COMPLETE_REGISTRATION';
  payload: {
    email: string;
    nickname: string;
    passwordHash: string;
    device: string;
  };
};

type SendCodeEvent = { type: 'SEND_CODE'; payload: { email: string } };

type VerifyLoginEvent = {
  type: 'VERIFY_LOGIN';
  payload: {
    email: string;
    device: string;
    passwordHash: string;
    isForgeClaim?: boolean;
    locale?: string;
  };
};

type VerifyEmail2FAEvent = {
  type: 'VERIFY_EMAIL_2FA';
  payload: { email: string; secureCode: string; passwordHash: string };
};

type AuthMachineEvents =
  | InitializeEvent
  | LogoutEvent
  | ResetContextEvent
  | RegisterStepEvent
  | LoginStepEvent
  | BackEvent
  | NextEvent
  | StartPasskeyLoginEvent
  | UserInputPasskeyLoginEvent
  | FinishPasskeyLoginEvent
  | StartPasskeyRegisterEvent
  | UserInputPasskeyRegisterEvent
  | FinishPasskeyRegisterEvent
  | FetchSaltEvent
  | GoogleLoginEvent
  | SendRegistrationEmailEvent
  | ResendCodeEvent
  | VerifyEmailEvent
  | CompleteRegistrationEvent
  | SendCodeEvent
  | VerifyLoginEvent
  | VerifyEmail2FAEvent;

type AuthReturn = {
  data: {
    error?: string;
    salt?: string;
    sessionId?: string;
  };
};

type ValidSession = {
  data: SessionUser;
};

type AuthMachineServices = {
  completeRegistration: ValidSession;
  confirmPassword: AuthReturn;
  registerUser: AuthReturn;
  retrieveSalt: AuthReturn;
  sendCode: AuthReturn;
  signIn: AuthReturn;
  verify2faCode: ValidSession;
  authenticateWebauthn: ValidSession;
  verifyDeviceCode: ValidSession;
  verifyEmail: AuthReturn;
  verifyLogin: AuthReturn;
  verifyEmail2fa: ValidSession;
  sendConfirmationEmail: AuthReturn;
  googleLogin: { data: {} };
  verifyGoogleLogin: ValidSession;
  fetchForgeData: { data: any };
  verifyEmailEligibility: {
    data: {};
  };
  verifyClaimNftEmail2fa: {
    data: {};
  };
  startRegisterPasskey: {
    data: {};
  };
  startPasskeyAuth: {
    data: {};
  };
  finishPasskeyAuth: ValidSession;
  finishRegisterPasskey: ValidSession;
};

export type {
  AloreCommonType,
  AuthMachineEvents,
  AuthMachineServices,
  AuthMachineContext,
  SessionUser,
  TwoFactorAuth,
  KeyDerivationFunction,
  AloreCommonConfiguration,
  FetchWithProgressiveBackoffConfig,
  BackEvent,
  CompleteRegistrationEvent,
  FetchSaltEvent,
  FinishPasskeyLoginEvent,
  FinishPasskeyRegisterEvent,
  GoogleLoginEvent,
  InitializeEvent,
  Locale,
  LoginStepEvent,
  LogoutEvent,
  NextEvent,
  RegisterStepEvent,
  ResendCodeEvent,
  ResetContextEvent,
  SendCodeEvent,
  PasskeyCreateRequest,
  PasskeyCreateResult,
  PasskeyGetRequest,
  PasskeyGetResult,
  SendRegistrationEmailEvent,
  StartPasskeyLoginEvent,
  StartPasskeyRegisterEvent,
  UserInputPasskeyLoginEvent,
  UserInputPasskeyRegisterEvent,
  VerifyEmail2FAEvent,
  VerifyEmailEvent,
  VerifyLoginEvent,
};
