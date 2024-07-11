// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  internalEvents: {
    'done.invoke.authMachine.active.login.googleLogin:invocation[0]': {
      type: 'done.invoke.authMachine.active.login.googleLogin:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.login.resendingEmailCode:invocation[0]': {
      type: 'done.invoke.authMachine.active.login.resendingEmailCode:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.login.verifying2faCode:invocation[0]': {
      type: 'done.invoke.authMachine.active.login.verifying2faCode:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.login.verifyingCode:invocation[0]': {
      type: 'done.invoke.authMachine.active.login.verifyingCode:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.login.verifyingEmail2fa:invocation[0]': {
      type: 'done.invoke.authMachine.active.login.verifyingEmail2fa:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.login.verifyingGoogleLogin:invocation[0]': {
      type: 'done.invoke.authMachine.active.login.verifyingGoogleLogin:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.login.verifyingHwAuth:invocation[0]': {
      type: 'done.invoke.authMachine.active.login.verifyingHwAuth:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.login.verifyingLogin:invocation[0]': {
      type: 'done.invoke.authMachine.active.login.verifyingLogin:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.login.verifyingRegisterPublicKeyCredential:invocation[0]': {
      type: 'done.invoke.authMachine.active.login.verifyingRegisterPublicKeyCredential:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.register.completingRegistration:invocation[0]': {
      type: 'done.invoke.authMachine.active.register.completingRegistration:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.register.googleLogin:invocation[0]': {
      type: 'done.invoke.authMachine.active.register.googleLogin:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.register.resendingRegistrationEmail:invocation[0]': {
      type: 'done.invoke.authMachine.active.register.resendingRegistrationEmail:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.register.sendingAuthPublicCredential:invocation[0]': {
      type: 'done.invoke.authMachine.active.register.sendingAuthPublicCredential:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.register.sendingPublicCredential:invocation[0]': {
      type: 'done.invoke.authMachine.active.register.sendingPublicCredential:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.authMachine.active.web3Connector.verifyingEmailEligibility:invocation[0]': {
      type: 'done.invoke.authMachine.active.web3Connector.verifyingEmailEligibility:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    authenticateWebauthn: 'done.invoke.authMachine.active.login.verifyingHwAuth:invocation[0]';
    completeRegistration: 'done.invoke.authMachine.active.register.completingRegistration:invocation[0]';
    confirmPassword: 'done.invoke.authMachine.active.forgotPassword.savingPassword:invocation[0]';
    fetchForgeData: 'done.invoke.authMachine.active.login.fetchingForgeData:invocation[0]';
    finishPasskeyAuth:
      | 'done.invoke.authMachine.active.login.verifyingRegisterPublicKeyCredential:invocation[0]'
      | 'done.invoke.authMachine.active.register.sendingAuthPublicCredential:invocation[0]';
    finishRegisterPasskey: 'done.invoke.authMachine.active.register.sendingPublicCredential:invocation[0]';
    googleLogin:
      | 'done.invoke.authMachine.active.login.googleLogin:invocation[0]'
      | 'done.invoke.authMachine.active.register.googleLogin:invocation[0]';
    retrieveSalt: 'done.invoke.authMachine.active.login.retrievingSalt:invocation[0]';
    sendCode: 'done.invoke.authMachine.active.forgotPassword.sendingCode:invocation[0]';
    sendConfirmationEmail:
      | 'done.invoke.authMachine.active.register.resendingRegistrationEmail:invocation[0]'
      | 'done.invoke.authMachine.active.register.sendingEmail:invocation[0]';
    startPasskeyAuth:
      | 'done.invoke.authMachine.active.login.retrievingRCR:invocation[0]'
      | 'done.invoke.authMachine.active.register.retrievingRCR:invocation[0]';
    startRegisterPasskey: 'done.invoke.authMachine.active.register.retrievingCCR:invocation[0]';
    verify2faCode: 'done.invoke.authMachine.active.login.verifying2faCode:invocation[0]';
    verifyClaimNftEmail2fa: 'done.invoke.authMachine.active.web3Connector.verifyingClaimNftEmail2fa:invocation[0]';
    verifyDeviceCode: 'done.invoke.authMachine.active.login.verifyingCode:invocation[0]';
    verifyEmail: 'done.invoke.authMachine.active.register.verifyingEmail:invocation[0]';
    verifyEmail2fa: 'done.invoke.authMachine.active.login.verifyingEmail2fa:invocation[0]';
    verifyEmailEligibility: 'done.invoke.authMachine.active.web3Connector.verifyingEmailEligibility:invocation[0]';
    verifyGoogleLogin: 'done.invoke.authMachine.active.login.verifyingGoogleLogin:invocation[0]';
    verifyLogin:
      | 'done.invoke.authMachine.active.login.resendingConfirmationEmail:invocation[0]'
      | 'done.invoke.authMachine.active.login.resendingEmailCode:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingLogin:invocation[0]';
  };
  missingImplementations: {
    actions: 'setSessionId' | 'updateAccessToken';
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    clearContext: 'RESET_CONTEXT';
    setSessionId:
      | 'done.invoke.authMachine.active.login.resendingEmailCode:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingLogin:invocation[0]'
      | 'done.invoke.authMachine.active.register.resendingRegistrationEmail:invocation[0]'
      | 'done.invoke.authMachine.active.web3Connector.verifyingEmailEligibility:invocation[0]';
    setSessionUser:
      | 'done.invoke.authMachine.active.login.verifying2faCode:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingCode:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingEmail2fa:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingGoogleLogin:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingHwAuth:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingRegisterPublicKeyCredential:invocation[0]'
      | 'done.invoke.authMachine.active.register.completingRegistration:invocation[0]'
      | 'done.invoke.authMachine.active.register.sendingAuthPublicCredential:invocation[0]';
    setupRegisterUser: 'SETUP_REGISTER_USER';
    updateAccessToken: 'REFRESH_ACCESS_TOKEN';
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    forgeClaim: 'INITIALIZE';
    hasHardware2FA:
      | 'done.invoke.authMachine.active.login.verifyingLogin:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingRegisterPublicKeyCredential:invocation[0]';
    hasSoftware2FA:
      | 'done.invoke.authMachine.active.login.verifyingLogin:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingRegisterPublicKeyCredential:invocation[0]';
    isNewDevice:
      | 'done.invoke.authMachine.active.login.verifying2faCode:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingHwAuth:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingLogin:invocation[0]'
      | 'done.invoke.authMachine.active.login.verifyingRegisterPublicKeyCredential:invocation[0]';
    isNewUser:
      | 'done.invoke.authMachine.active.login.googleLogin:invocation[0]'
      | 'done.invoke.authMachine.active.register.googleLogin:invocation[0]';
  };
  eventsCausingServices: {
    authenticateWebauthn: 'VERIFY_HW_AUTH';
    completeRegistration: 'COMPLETE_REGISTRATION';
    confirmPassword: 'CONFIRM_PASSWORD';
    fetchForgeData: 'INITIALIZE';
    finishPasskeyAuth: 'FINISH_PASSKEY_AUTH' | 'FINISH_PASSKEY_LOGIN';
    finishRegisterPasskey: 'FINISH_PASSKEY_REGISTER';
    googleLogin: 'GOOGLE_LOGIN';
    retrieveSalt: 'NEXT';
    sendCode: 'SEND_CODE';
    sendConfirmationEmail: 'RESEND_CODE' | 'SEND_REGISTRATION_EMAIL';
    startPasskeyAuth:
      | 'START_PASSKEY_LOGIN'
      | 'done.invoke.authMachine.active.register.sendingPublicCredential:invocation[0]';
    startRegisterPasskey: 'START_PASSKEY_REGISTER';
    verify2faCode: 'CONFIRM_SW_CODE';
    verifyClaimNftEmail2fa: 'VERIFY_CLAIM_NFT_EMAIL_2FA';
    verifyDeviceCode: 'CONFIRM_DEVICE_CODE';
    verifyEmail: 'VERIFY_EMAIL';
    verifyEmail2fa: 'VERIFY_EMAIL_2FA';
    verifyEmailEligibility: 'VERIFY_EMAIL_ELIGIBILITY';
    verifyGoogleLogin: 'COMPLETE_GOOGLE_SIGN_IN';
    verifyLogin: 'RESEND_CODE' | 'VERIFY_LOGIN';
  };
  matchesStates:
    | 'active'
    | 'active.forgotPassword'
    | 'active.forgotPassword.codeSent'
    | 'active.forgotPassword.idle'
    | 'active.forgotPassword.newPassword'
    | 'active.forgotPassword.passwordSaved'
    | 'active.forgotPassword.savingPassword'
    | 'active.forgotPassword.sendingCode'
    | 'active.login'
    | 'active.login.email2fa'
    | 'active.login.fetchingForgeData'
    | 'active.login.googleLogin'
    | 'active.login.hardware2fa'
    | 'active.login.idle'
    | 'active.login.inputPassword'
    | 'active.login.localSignCredential'
    | 'active.login.loginMethodSelection'
    | 'active.login.newDevice'
    | 'active.login.resendingConfirmationEmail'
    | 'active.login.resendingEmailCode'
    | 'active.login.retrievingRCR'
    | 'active.login.retrievingSalt'
    | 'active.login.software2fa'
    | 'active.login.successfulLogin'
    | 'active.login.verifying2faCode'
    | 'active.login.verifyingCode'
    | 'active.login.verifyingEmail2fa'
    | 'active.login.verifyingGoogleLogin'
    | 'active.login.verifyingHwAuth'
    | 'active.login.verifyingLogin'
    | 'active.login.verifyingRegisterPublicKeyCredential'
    | 'active.register'
    | 'active.register.completingRegistration'
    | 'active.register.createPassword'
    | 'active.register.emailValidation'
    | 'active.register.googleLogin'
    | 'active.register.idle'
    | 'active.register.localSigningPasskeyAuth'
    | 'active.register.localSigningPasskeyRegister'
    | 'active.register.registerMethodSelection'
    | 'active.register.resendingRegistrationEmail'
    | 'active.register.retrievingCCR'
    | 'active.register.retrievingRCR'
    | 'active.register.sendingAuthPublicCredential'
    | 'active.register.sendingEmail'
    | 'active.register.sendingPublicCredential'
    | 'active.register.termsModal'
    | 'active.register.userCreated'
    | 'active.register.verifyingEmail'
    | 'active.web3Connector'
    | 'active.web3Connector.connecting'
    | 'active.web3Connector.email2faCode'
    | 'active.web3Connector.emailConfirmed'
    | 'active.web3Connector.emailInput'
    | 'active.web3Connector.idle'
    | 'active.web3Connector.verifyingClaimNftEmail2fa'
    | 'active.web3Connector.verifyingEmailEligibility'
    | 'inactive'
    | {
        active?:
          | 'forgotPassword'
          | 'login'
          | 'register'
          | 'web3Connector'
          | {
              forgotPassword?:
                | 'codeSent'
                | 'idle'
                | 'newPassword'
                | 'passwordSaved'
                | 'savingPassword'
                | 'sendingCode';
              login?:
                | 'email2fa'
                | 'fetchingForgeData'
                | 'googleLogin'
                | 'hardware2fa'
                | 'idle'
                | 'inputPassword'
                | 'localSignCredential'
                | 'loginMethodSelection'
                | 'newDevice'
                | 'resendingConfirmationEmail'
                | 'resendingEmailCode'
                | 'retrievingRCR'
                | 'retrievingSalt'
                | 'software2fa'
                | 'successfulLogin'
                | 'verifying2faCode'
                | 'verifyingCode'
                | 'verifyingEmail2fa'
                | 'verifyingGoogleLogin'
                | 'verifyingHwAuth'
                | 'verifyingLogin'
                | 'verifyingRegisterPublicKeyCredential';
              register?:
                | 'completingRegistration'
                | 'createPassword'
                | 'emailValidation'
                | 'googleLogin'
                | 'idle'
                | 'localSigningPasskeyAuth'
                | 'localSigningPasskeyRegister'
                | 'registerMethodSelection'
                | 'resendingRegistrationEmail'
                | 'retrievingCCR'
                | 'retrievingRCR'
                | 'sendingAuthPublicCredential'
                | 'sendingEmail'
                | 'sendingPublicCredential'
                | 'termsModal'
                | 'userCreated'
                | 'verifyingEmail';
              web3Connector?:
                | 'connecting'
                | 'email2faCode'
                | 'emailConfirmed'
                | 'emailInput'
                | 'idle'
                | 'verifyingClaimNftEmail2fa'
                | 'verifyingEmailEligibility';
            };
      };
  tags: never;
}
