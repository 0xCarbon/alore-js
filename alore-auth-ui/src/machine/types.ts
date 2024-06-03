import { authService } from '.';

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

interface PublicKeyCredentialCreationOptions {
  rp: {
    name: string;
    id: string;
  };
  user: {
    name: string;
    id: string;
    displayName: string;
  };
  challenge: string;
  pubKeyCredParams: [];
  timeout?: number;
  // eslint-disable-next-line no-undef
  attestation?: AttestationConveyancePreference;
  // eslint-disable-next-line no-undef
  excludeCredentials?: PublicKeyCredentialDescriptor[];
  // eslint-disable-next-line no-undef
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  extensions?: {};
}

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
  salt?: string;
  error?: string;
  active2fa?: TwoFactorAuth[];
  registerUser?: {
    email: string;
    nickname: string;
    salt?: string;
  };
  forgeData?: any;
  googleOtpCode?: string;
  googleUser?: { email: string; nickname: string };
  sessionUser?: SessionUser;
  CCRPublicKey?: { publicKey: PublicKeyCredentialCreationOptions };
  RCRPublicKey?: { publicKey: PublicKeyCredentialRequestOptions };
  credentialEmail?: string;
}

export type AuthMachineEvents =
  | { type: 'INITIALIZE'; forgeId?: null | string }
  | { type: 'RESET' }
  | { type: 'RESET_CONTEXT' }
  | { type: 'ADVANCE_TO_PASSWORD' }
  | { type: 'BACK' }
  | { type: 'BACK_TO_IDLE' }
  | { type: 'SELECT_CONNECTOR' }
  | { type: 'NEXT'; payload: { email: string } }
  | {
      type: 'GOOGLE_LOGIN';
      googleToken: string;
    }
  | {
      type: 'START_PASSKEY_LOGIN';
      payload: {
        email: string;
      };
    }
  | {
      type: 'SELECT_PASSWORD';
      payload: {
        email: string;
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
    }
  | {
      type: 'FORCE_PASSWORD_METHOD';
      payload: {
        email: string;
      };
    }
  | {
      type: 'COMPLETE_GOOGLE_SIGN_IN';
      payload: { email: string; passwordHash: string; otp: string };
    }
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
  | {
      type: 'CONFIRM_SW_CODE';
      payload: {
        email: string;
        device: string;
        passwordHash: string;
        otp: string;
      };
    }
  | {
      type: 'CONFIRM_DEVICE_CODE';
      payload: {
        email: string;
        passwordHash: string;
        device: string;
        secureCode: string;
      };
    }
  | { type: 'USE_HARDWARE_2FA' }
  | { type: 'USE_SOFTWARE_2FA' }
  | {
      type: 'VERIFY_HW_AUTH';
      payload: {
        email: string;
        device: string;
        passwordHash: string;
        authId: string;
      };
    }
  | { type: 'SHOW_TERMS_MODAL' }
  | {
      type: 'SEND_REGISTRATION_EMAIL';
      payload: {
        email: string;
        nickname: string;
        isForgeClaim?: boolean;
        locale?: string;
      };
    }
  | { type: 'CLOSE_TERMS_MODAL' }
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
      type: 'CONFIRM_PASSWORD';
      payload: { email: string; passwordHash: string };
    }
  | { type: 'RESET_PASSWORD' }
  | { type: 'LOGIN' }
  | { type: 'FORGOT_PASSWORD' }
  | { type: 'SIGN_UP' }
  | { type: 'LOGIN_WITH_WEB3CONNECTOR' }
  | { type: 'CONFIRM_WEB3_LOGIN' }
  | {
      type: 'VERIFY_EMAIL_ELIGIBILITY';
      email: string;
      isForgeClaim?: boolean;
      locale?: string;
    }
  | {
      type: 'VERIFY_CLAIM_NFT_EMAIL_2FA';
      payload: { email: string; emailCode: string };
    }
  | { type: 'BACK_TO_LOGIN' }
  | {
      type: 'SETUP_REGISTER_USER';
      registerUser: { email: string; nickname: string; salt: string };
    };

type AuthReturn = {
  data: {
    error?: string;
    salt?: string;
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
