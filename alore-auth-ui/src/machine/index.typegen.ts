// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.authMachine.active.login.googleLogin:invocation[0]": {
      type: "done.invoke.authMachine.active.login.googleLogin:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.authMachine.active.login.verifying2faCode:invocation[0]": {
      type: "done.invoke.authMachine.active.login.verifying2faCode:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.authMachine.active.login.verifyingCode:invocation[0]": {
      type: "done.invoke.authMachine.active.login.verifyingCode:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.authMachine.active.login.verifyingEmail2fa:invocation[0]": {
      type: "done.invoke.authMachine.active.login.verifyingEmail2fa:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.authMachine.active.login.verifyingGoogleLogin:invocation[0]": {
      type: "done.invoke.authMachine.active.login.verifyingGoogleLogin:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.authMachine.active.login.verifyingHwAuth:invocation[0]": {
      type: "done.invoke.authMachine.active.login.verifyingHwAuth:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.authMachine.active.login.verifyingLogin:invocation[0]": {
      type: "done.invoke.authMachine.active.login.verifyingLogin:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.authMachine.active.register.completingRegistration:invocation[0]": {
      type: "done.invoke.authMachine.active.register.completingRegistration:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.authMachine.active.register.googleLogin:invocation[0]": {
      type: "done.invoke.authMachine.active.register.googleLogin:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    authenticateWebauthn: "done.invoke.authMachine.active.login.verifyingHwAuth:invocation[0]";
    completeRegistration: "done.invoke.authMachine.active.register.completingRegistration:invocation[0]";
    confirmPassword: "done.invoke.authMachine.active.forgotPassword.savingPassword:invocation[0]";
    fetchForgeData: "done.invoke.authMachine.active.login.fetchingForgeData:invocation[0]";
    googleLogin:
      | "done.invoke.authMachine.active.login.googleLogin:invocation[0]"
      | "done.invoke.authMachine.active.register.googleLogin:invocation[0]";
    retrieveSalt: "done.invoke.authMachine.active.login.retrievingSalt:invocation[0]";
    sendCode: "done.invoke.authMachine.active.forgotPassword.sendingCode:invocation[0]";
    sendConfirmationEmail:
      | "done.invoke.authMachine.active.register.resendingRegistrationEmail:invocation[0]"
      | "done.invoke.authMachine.active.register.sendingEmail:invocation[0]";
    verify2faCode: "done.invoke.authMachine.active.login.verifying2faCode:invocation[0]";
    verifyClaimNftEmail2fa: "done.invoke.authMachine.active.web3Connector.verifyingClaimNftEmail2fa:invocation[0]";
    verifyDeviceCode: "done.invoke.authMachine.active.login.verifyingCode:invocation[0]";
    verifyEmail: "done.invoke.authMachine.active.register.verifyingEmail:invocation[0]";
    verifyEmail2fa: "done.invoke.authMachine.active.login.verifyingEmail2fa:invocation[0]";
    verifyEmailEligibility: "done.invoke.authMachine.active.web3Connector.verifyingEmailEligibility:invocation[0]";
    verifyGoogleLogin: "done.invoke.authMachine.active.login.verifyingGoogleLogin:invocation[0]";
    verifyLogin:
      | "done.invoke.authMachine.active.login.resendingConfirmationEmail:invocation[0]"
      | "done.invoke.authMachine.active.login.resendingEmailCode:invocation[0]"
      | "done.invoke.authMachine.active.login.verifyingLogin:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    clearContext: "RESET_CONTEXT";
    setSessionUser:
      | "done.invoke.authMachine.active.login.verifying2faCode:invocation[0]"
      | "done.invoke.authMachine.active.login.verifyingCode:invocation[0]"
      | "done.invoke.authMachine.active.login.verifyingEmail2fa:invocation[0]"
      | "done.invoke.authMachine.active.login.verifyingGoogleLogin:invocation[0]"
      | "done.invoke.authMachine.active.login.verifyingHwAuth:invocation[0]"
      | "done.invoke.authMachine.active.register.completingRegistration:invocation[0]";
    setupRegisterUser: "SETUP_REGISTER_USER";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    forgeClaim: "INITIALIZE";
    hasHardware2FA: "done.invoke.authMachine.active.login.verifyingLogin:invocation[0]";
    hasSoftware2FA: "done.invoke.authMachine.active.login.verifyingLogin:invocation[0]";
    isNewDevice:
      | "done.invoke.authMachine.active.login.verifying2faCode:invocation[0]"
      | "done.invoke.authMachine.active.login.verifyingHwAuth:invocation[0]"
      | "done.invoke.authMachine.active.login.verifyingLogin:invocation[0]";
    isNewUser:
      | "done.invoke.authMachine.active.login.googleLogin:invocation[0]"
      | "done.invoke.authMachine.active.register.googleLogin:invocation[0]";
  };
  eventsCausingServices: {
    authenticateWebauthn: "VERIFY_HW_AUTH";
    completeRegistration: "COMPLETE_REGISTRATION";
    confirmPassword: "CONFIRM_PASSWORD";
    fetchForgeData: "INITIALIZE";
    googleLogin: "GOOGLE_LOGIN";
    retrieveSalt: "NEXT";
    sendCode: "SEND_CODE";
    sendConfirmationEmail: "RESEND_CODE" | "SEND_REGISTRATION_EMAIL";
    verify2faCode: "CONFIRM_SW_CODE";
    verifyClaimNftEmail2fa: "VERIFY_CLAIM_NFT_EMAIL_2FA";
    verifyDeviceCode: "CONFIRM_DEVICE_CODE";
    verifyEmail: "VERIFY_EMAIL";
    verifyEmail2fa: "VERIFY_EMAIL_2FA";
    verifyEmailEligibility: "VERIFY_EMAIL_ELIGIBILITY";
    verifyGoogleLogin: "COMPLETE_GOOGLE_SIGN_IN";
    verifyLogin: "RESEND_CODE" | "VERIFY_LOGIN";
  };
  matchesStates:
    | "active"
    | "active.forgotPassword"
    | "active.forgotPassword.codeSent"
    | "active.forgotPassword.idle"
    | "active.forgotPassword.newPassword"
    | "active.forgotPassword.passwordSaved"
    | "active.forgotPassword.savingPassword"
    | "active.forgotPassword.sendingCode"
    | "active.login"
    | "active.login.email2fa"
    | "active.login.fetchingForgeData"
    | "active.login.googleLogin"
    | "active.login.hardware2fa"
    | "active.login.idle"
    | "active.login.inputPassword"
    | "active.login.newDevice"
    | "active.login.resendingConfirmationEmail"
    | "active.login.resendingEmailCode"
    | "active.login.retrievingSalt"
    | "active.login.software2fa"
    | "active.login.successfulLogin"
    | "active.login.verifying2faCode"
    | "active.login.verifyingCode"
    | "active.login.verifyingEmail2fa"
    | "active.login.verifyingGoogleLogin"
    | "active.login.verifyingHwAuth"
    | "active.login.verifyingLogin"
    | "active.register"
    | "active.register.completingRegistration"
    | "active.register.createPassword"
    | "active.register.emailValidation"
    | "active.register.googleLogin"
    | "active.register.idle"
    | "active.register.resendingRegistrationEmail"
    | "active.register.sendingEmail"
    | "active.register.termsModal"
    | "active.register.userCreated"
    | "active.register.verifyingEmail"
    | "active.web3Connector"
    | "active.web3Connector.connecting"
    | "active.web3Connector.email2faCode"
    | "active.web3Connector.emailConfirmed"
    | "active.web3Connector.emailInput"
    | "active.web3Connector.idle"
    | "active.web3Connector.verifyingClaimNftEmail2fa"
    | "active.web3Connector.verifyingEmailEligibility"
    | "inactive"
    | {
        active?:
          | "forgotPassword"
          | "login"
          | "register"
          | "web3Connector"
          | {
              forgotPassword?:
                | "codeSent"
                | "idle"
                | "newPassword"
                | "passwordSaved"
                | "savingPassword"
                | "sendingCode";
              login?:
                | "email2fa"
                | "fetchingForgeData"
                | "googleLogin"
                | "hardware2fa"
                | "idle"
                | "inputPassword"
                | "newDevice"
                | "resendingConfirmationEmail"
                | "resendingEmailCode"
                | "retrievingSalt"
                | "software2fa"
                | "successfulLogin"
                | "verifying2faCode"
                | "verifyingCode"
                | "verifyingEmail2fa"
                | "verifyingGoogleLogin"
                | "verifyingHwAuth"
                | "verifyingLogin";
              register?:
                | "completingRegistration"
                | "createPassword"
                | "emailValidation"
                | "googleLogin"
                | "idle"
                | "resendingRegistrationEmail"
                | "sendingEmail"
                | "termsModal"
                | "userCreated"
                | "verifyingEmail";
              web3Connector?:
                | "connecting"
                | "email2faCode"
                | "emailConfirmed"
                | "emailInput"
                | "idle"
                | "verifyingClaimNftEmail2fa"
                | "verifyingEmailEligibility";
            };
      };
  tags: never;
}
