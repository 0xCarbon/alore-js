import { Locale } from '../helpers/get-dictionary';
import { authService } from '.';
import {
  PasskeyAuthenticationResult,
  PasskeyRegistrationRequest,
  PasskeyRegistrationResult,
} from 'react-native-passkey/lib/typescript/Passkey';

export type SessionUser = {
  created_at: string;
  device: string;
  device_created_at: string;
  email: string;
  id: string;
  last_login: string | null;
  last_transaction: string | null;
  nickname: string;
  status: string;
};

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

export interface AuthMachineContext {
  googleId?: string;
  sessionUser?: SessionUser;
  locale: Locale;
  sessionId?: string;
  CCRPublicKey?: { publicKey: PublicKeyCredentialCreationOptions };
  passkeyRegistrationResult?: PasskeyRegistrationResult;
  RCRPublicKey?: { publicKey: PublicKeyCredentialRequestOptions };
  passkeyLoginResult?: PasskeyAuthenticationResult;
  salt?: string;
  error?: string;
  registerUser?: {
    email: string;
    nickname: string;
    salt?: string;
  };
  googleOtpCode?: string;
  googleUser?: { email: string; nickname: string };
  authMethods: {
    password?: boolean;
    passkey?: boolean;
    google?: boolean;
  };
  userEmail?: string;
}

export type AuthMachineEvents =
  | { type: 'INITIALIZE' }
  | { type: 'RESET' }
  | { type: 'LOGOUT' }
  | { type: 'RESET_CONTEXT' }
  | { type: 'REGISTER_STEP' }
  | { type: 'LOGIN_STEP' }
  | { type: 'BACK' }
  | { type: 'NEXT' }
  | {
      type: 'START_PASSKEY_LOGIN';
      payload: {
        email: string;
      };
    }
  | {
      type: 'USER_INPUT_PASSKEY_LOGIN';
      payload: {
        RCRPublicKey: { publicKey: PublicKeyCredentialRequestOptions };
        withSecurityKey?: boolean;
      };
    }
  | {
      type: 'FINISH_PASSKEY_LOGIN';
      payload: {
        passkeyAuth: PasskeyAuthenticationResult;
      };
    }
  | {
      type: 'START_PASSKEY_REGISTER';
      payload: {
        device: string;
        email: string;
        nickname?: string;
      };
    }
  | {
      type: 'USER_INPUT_PASSKEY_REGISTER';
      payload: {
        CCRPublicKey: { publicKey: PasskeyRegistrationRequest };
        withSecurityKey?: boolean;
      };
    }
  | {
      type: 'FINISH_PASSKEY_REGISTER';
      payload: {
        passkeyRegistration: PasskeyRegistrationResult;
        email: string;
        nickname: string;
        device: string;
      };
    }
  | { type: 'FETCH_SALT'; payload: { email: string } }
  | {
      type: 'GOOGLE_LOGIN';
      googleToken: string;
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
  | {
      type: 'RESEND_CODE';
      payload: {
        email: string;
        nickname?: string;
        device?: string;
        passwordHash?: string;
        isForgeClaim?: boolean;
        locale?: string;
      };
    }
  | { type: 'VERIFY_EMAIL'; payload: { secureCode: string } }
  | {
      type: 'COMPLETE_REGISTRATION';
      payload: {
        email: string;
        nickname: string;
        passwordHash: string;
        device: string;
      };
    }
  | { type: 'SEND_CODE'; payload: { email: string } }
  | {
      type: 'VERIFY_LOGIN';
      payload: {
        email: string;
        device: string;
        passwordHash: string;
        isForgeClaim?: boolean;
        locale?: string;
      };
    }
  | {
      type: 'VERIFY_EMAIL_2FA';
      payload: { email: string; secureCode: string; passwordHash: string };
    };

type AuthReturn = {
  data: {
    error?: string;
    salt?: string;
    sessionId?: string;
  };
};

export type ValidSession = {
  data: SessionUser;
};

export type TwoFactorAuth = {
  id: string;
  name: string | null;
  twoFaTypeId: number;
};

export type AuthMachineServices = {
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

export type AuthInstance = Awaited<ReturnType<typeof authService>>;
