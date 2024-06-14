import { Locale } from '../helpers/get-dictionary';
import { authService } from '.';
import { PasskeyRegistrationRequest } from 'react-native-passkey/lib/typescript/Passkey';

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

interface PublicKeyCredentialRequestOptions {
  challenge: string;
  timeout?: number;
  rpId: string;
  pubKeyCredParams: [];
  allowCredentials?: [];
  userVerification?: {};
  extensions?: {};
}

export interface AuthMachineContext {
<<<<<<< Updated upstream
=======
  googleId?: string;
>>>>>>> Stashed changes
  sessionUser?: SessionUser;
  locale: Locale;
  sessionId?: string;
  CCRPublicKey?: { publicKey: PasskeyRegistrationRequest };
  RCRPublicKey?: { publicKey: PublicKeyCredentialRequestOptions };
<<<<<<< Updated upstream
=======
  salt?: string;
  error?: string;
  registerUser?: {
    email: string;
    nickname: string;
    salt?: string;
  };
  googleOtpCode?: string;
  googleUser?: { email: string; nickname: string };
>>>>>>> Stashed changes
}

export type AuthMachineEvents =
  | { type: 'INITIALIZE' }
  | { type: 'RESET' }
  | { type: 'RESET_CONTEXT' }
  | { type: 'REGISTER_STEP' }
  | { type: 'LOGIN_STEP' }
  | { type: 'BACK' }
  | { type: 'NEXT' }
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
        userAgent: string;
      };
    }
  | {
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
<<<<<<< Updated upstream
=======
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
      type: 'RESEND_CODE';
      payload: {
        email: string;
        nickname?: string;
        device?: string;
        passwordHash?: string;
        isForgeClaim?: boolean;
        locale?: string;
      };
>>>>>>> Stashed changes
    };

type AuthReturn = {
  data: {
    error?: string;
    salt?: string;
<<<<<<< Updated upstream
=======
    sessionId?: string;
>>>>>>> Stashed changes
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
