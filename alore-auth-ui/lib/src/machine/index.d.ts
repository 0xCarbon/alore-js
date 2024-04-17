import { AuthMachineContext, AuthMachineServices } from './types';
export declare const authMachine: import("xstate").StateMachine<AuthMachineContext, any, {
    type: "INITIALIZE";
    forgeId?: string | null | undefined;
} | {
    type: "RESET";
} | {
    type: "RESET_CONTEXT";
} | {
    type: "ADVANCE_TO_PASSWORD";
} | {
    type: "BACK";
} | {
    type: "BACK_TO_IDLE";
} | {
    type: "SELECT_CONNECTOR";
} | {
    type: "NEXT";
    payload: {
        email: string;
    };
} | {
    type: "GOOGLE_LOGIN";
    googleToken: string;
} | {
    type: "COMPLETE_GOOGLE_SIGN_IN";
    payload: {
        email: string;
        passwordHash: string;
        otp: string;
    };
} | {
    type: "VERIFY_LOGIN";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        isForgeClaim?: boolean | undefined;
        captchaToken?: string | undefined;
        locale?: string | undefined;
    };
} | {
    type: "VERIFY_EMAIL_2FA";
    payload: {
        email: string;
        secureCode: string;
        passwordHash: string;
    };
} | {
    type: "RESEND_CODE";
    payload: {
        email: string;
        nickname?: string | undefined;
        device?: string | undefined;
        passwordHash?: string | undefined;
        captchaToken?: string | undefined;
        isForgeClaim?: boolean | undefined;
        locale?: string | undefined;
    };
} | {
    type: "CONFIRM_SW_CODE";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        otp: string;
    };
} | {
    type: "CONFIRM_DEVICE_CODE";
    payload: {
        email: string;
        passwordHash: string;
        device: string;
        secureCode: string;
    };
} | {
    type: "USE_HARDWARE_2FA";
} | {
    type: "USE_SOFTWARE_2FA";
} | {
    type: "VERIFY_HW_AUTH";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        authId: string;
    };
} | {
    type: "SHOW_TERMS_MODAL";
} | {
    type: "SEND_REGISTRATION_EMAIL";
    payload: {
        email: string;
        nickname: string;
        isForgeClaim?: boolean | undefined;
        captchaToken?: string | undefined;
        locale?: string | undefined;
    };
} | {
    type: "CLOSE_TERMS_MODAL";
} | {
    type: "VERIFY_EMAIL";
    payload: {
        secureCode: string;
    };
} | {
    type: "COMPLETE_REGISTRATION";
    payload: {
        email: string;
        nickname: string;
        passwordHash: string;
        device: string;
    };
} | {
    type: "SEND_CODE";
    payload: {
        email: string;
    };
} | {
    type: "CONFIRM_PASSWORD";
    payload: {
        email: string;
        passwordHash: string;
    };
} | {
    type: "RESET_PASSWORD";
} | {
    type: "LOGIN";
} | {
    type: "FORGOT_PASSWORD";
} | {
    type: "SIGN_UP";
} | {
    type: "LOGIN_WITH_WEB3CONNECTOR";
} | {
    type: "CONFIRM_WEB3_LOGIN";
} | {
    type: "VERIFY_EMAIL_ELIGIBILITY";
    email: string;
    isForgeClaim?: boolean | undefined;
    locale?: string | undefined;
} | {
    type: "VERIFY_CLAIM_NFT_EMAIL_2FA";
    payload: {
        email: string;
        emailCode: string;
    };
} | {
    type: "BACK_TO_LOGIN";
} | {
    type: "SETUP_REGISTER_USER";
    registerUser: {
        email: string;
        nickname: string;
        salt: string;
    };
}, {
    value: any;
    context: AuthMachineContext;
}, import("xstate").BaseActionObject, AuthMachineServices, import("xstate").ResolveTypegenMeta<import("./index.typegen").Typegen0, {
    type: "INITIALIZE";
    forgeId?: string | null | undefined;
} | {
    type: "RESET";
} | {
    type: "RESET_CONTEXT";
} | {
    type: "ADVANCE_TO_PASSWORD";
} | {
    type: "BACK";
} | {
    type: "BACK_TO_IDLE";
} | {
    type: "SELECT_CONNECTOR";
} | {
    type: "NEXT";
    payload: {
        email: string;
    };
} | {
    type: "GOOGLE_LOGIN";
    googleToken: string;
} | {
    type: "COMPLETE_GOOGLE_SIGN_IN";
    payload: {
        email: string;
        passwordHash: string;
        otp: string;
    };
} | {
    type: "VERIFY_LOGIN";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        isForgeClaim?: boolean | undefined;
        captchaToken?: string | undefined;
        locale?: string | undefined;
    };
} | {
    type: "VERIFY_EMAIL_2FA";
    payload: {
        email: string;
        secureCode: string;
        passwordHash: string;
    };
} | {
    type: "RESEND_CODE";
    payload: {
        email: string;
        nickname?: string | undefined;
        device?: string | undefined;
        passwordHash?: string | undefined;
        captchaToken?: string | undefined;
        isForgeClaim?: boolean | undefined;
        locale?: string | undefined;
    };
} | {
    type: "CONFIRM_SW_CODE";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        otp: string;
    };
} | {
    type: "CONFIRM_DEVICE_CODE";
    payload: {
        email: string;
        passwordHash: string;
        device: string;
        secureCode: string;
    };
} | {
    type: "USE_HARDWARE_2FA";
} | {
    type: "USE_SOFTWARE_2FA";
} | {
    type: "VERIFY_HW_AUTH";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        authId: string;
    };
} | {
    type: "SHOW_TERMS_MODAL";
} | {
    type: "SEND_REGISTRATION_EMAIL";
    payload: {
        email: string;
        nickname: string;
        isForgeClaim?: boolean | undefined;
        captchaToken?: string | undefined;
        locale?: string | undefined;
    };
} | {
    type: "CLOSE_TERMS_MODAL";
} | {
    type: "VERIFY_EMAIL";
    payload: {
        secureCode: string;
    };
} | {
    type: "COMPLETE_REGISTRATION";
    payload: {
        email: string;
        nickname: string;
        passwordHash: string;
        device: string;
    };
} | {
    type: "SEND_CODE";
    payload: {
        email: string;
    };
} | {
    type: "CONFIRM_PASSWORD";
    payload: {
        email: string;
        passwordHash: string;
    };
} | {
    type: "RESET_PASSWORD";
} | {
    type: "LOGIN";
} | {
    type: "FORGOT_PASSWORD";
} | {
    type: "SIGN_UP";
} | {
    type: "LOGIN_WITH_WEB3CONNECTOR";
} | {
    type: "CONFIRM_WEB3_LOGIN";
} | {
    type: "VERIFY_EMAIL_ELIGIBILITY";
    email: string;
    isForgeClaim?: boolean | undefined;
    locale?: string | undefined;
} | {
    type: "VERIFY_CLAIM_NFT_EMAIL_2FA";
    payload: {
        email: string;
        emailCode: string;
    };
} | {
    type: "BACK_TO_LOGIN";
} | {
    type: "SETUP_REGISTER_USER";
    registerUser: {
        email: string;
        nickname: string;
        salt: string;
    };
}, import("xstate").BaseActionObject, AuthMachineServices>>;
export declare const authService: (services: {}) => import("xstate").Interpreter<AuthMachineContext, any, {
    type: "INITIALIZE";
    forgeId?: string | null | undefined;
} | {
    type: "RESET";
} | {
    type: "RESET_CONTEXT";
} | {
    type: "ADVANCE_TO_PASSWORD";
} | {
    type: "BACK";
} | {
    type: "BACK_TO_IDLE";
} | {
    type: "SELECT_CONNECTOR";
} | {
    type: "NEXT";
    payload: {
        email: string;
    };
} | {
    type: "GOOGLE_LOGIN";
    googleToken: string;
} | {
    type: "COMPLETE_GOOGLE_SIGN_IN";
    payload: {
        email: string;
        passwordHash: string;
        otp: string;
    };
} | {
    type: "VERIFY_LOGIN";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        isForgeClaim?: boolean | undefined;
        captchaToken?: string | undefined;
        locale?: string | undefined;
    };
} | {
    type: "VERIFY_EMAIL_2FA";
    payload: {
        email: string;
        secureCode: string;
        passwordHash: string;
    };
} | {
    type: "RESEND_CODE";
    payload: {
        email: string;
        nickname?: string | undefined;
        device?: string | undefined;
        passwordHash?: string | undefined;
        captchaToken?: string | undefined;
        isForgeClaim?: boolean | undefined;
        locale?: string | undefined;
    };
} | {
    type: "CONFIRM_SW_CODE";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        otp: string;
    };
} | {
    type: "CONFIRM_DEVICE_CODE";
    payload: {
        email: string;
        passwordHash: string;
        device: string;
        secureCode: string;
    };
} | {
    type: "USE_HARDWARE_2FA";
} | {
    type: "USE_SOFTWARE_2FA";
} | {
    type: "VERIFY_HW_AUTH";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        authId: string;
    };
} | {
    type: "SHOW_TERMS_MODAL";
} | {
    type: "SEND_REGISTRATION_EMAIL";
    payload: {
        email: string;
        nickname: string;
        isForgeClaim?: boolean | undefined;
        captchaToken?: string | undefined;
        locale?: string | undefined;
    };
} | {
    type: "CLOSE_TERMS_MODAL";
} | {
    type: "VERIFY_EMAIL";
    payload: {
        secureCode: string;
    };
} | {
    type: "COMPLETE_REGISTRATION";
    payload: {
        email: string;
        nickname: string;
        passwordHash: string;
        device: string;
    };
} | {
    type: "SEND_CODE";
    payload: {
        email: string;
    };
} | {
    type: "CONFIRM_PASSWORD";
    payload: {
        email: string;
        passwordHash: string;
    };
} | {
    type: "RESET_PASSWORD";
} | {
    type: "LOGIN";
} | {
    type: "FORGOT_PASSWORD";
} | {
    type: "SIGN_UP";
} | {
    type: "LOGIN_WITH_WEB3CONNECTOR";
} | {
    type: "CONFIRM_WEB3_LOGIN";
} | {
    type: "VERIFY_EMAIL_ELIGIBILITY";
    email: string;
    isForgeClaim?: boolean | undefined;
    locale?: string | undefined;
} | {
    type: "VERIFY_CLAIM_NFT_EMAIL_2FA";
    payload: {
        email: string;
        emailCode: string;
    };
} | {
    type: "BACK_TO_LOGIN";
} | {
    type: "SETUP_REGISTER_USER";
    registerUser: {
        email: string;
        nickname: string;
        salt: string;
    };
}, {
    value: any;
    context: AuthMachineContext;
}, import("xstate").ResolveTypegenMeta<import("./index.typegen").Typegen0, {
    type: "INITIALIZE";
    forgeId?: string | null | undefined;
} | {
    type: "RESET";
} | {
    type: "RESET_CONTEXT";
} | {
    type: "ADVANCE_TO_PASSWORD";
} | {
    type: "BACK";
} | {
    type: "BACK_TO_IDLE";
} | {
    type: "SELECT_CONNECTOR";
} | {
    type: "NEXT";
    payload: {
        email: string;
    };
} | {
    type: "GOOGLE_LOGIN";
    googleToken: string;
} | {
    type: "COMPLETE_GOOGLE_SIGN_IN";
    payload: {
        email: string;
        passwordHash: string;
        otp: string;
    };
} | {
    type: "VERIFY_LOGIN";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        isForgeClaim?: boolean | undefined;
        captchaToken?: string | undefined;
        locale?: string | undefined;
    };
} | {
    type: "VERIFY_EMAIL_2FA";
    payload: {
        email: string;
        secureCode: string;
        passwordHash: string;
    };
} | {
    type: "RESEND_CODE";
    payload: {
        email: string;
        nickname?: string | undefined;
        device?: string | undefined;
        passwordHash?: string | undefined;
        captchaToken?: string | undefined;
        isForgeClaim?: boolean | undefined;
        locale?: string | undefined;
    };
} | {
    type: "CONFIRM_SW_CODE";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        otp: string;
    };
} | {
    type: "CONFIRM_DEVICE_CODE";
    payload: {
        email: string;
        passwordHash: string;
        device: string;
        secureCode: string;
    };
} | {
    type: "USE_HARDWARE_2FA";
} | {
    type: "USE_SOFTWARE_2FA";
} | {
    type: "VERIFY_HW_AUTH";
    payload: {
        email: string;
        device: string;
        passwordHash: string;
        authId: string;
    };
} | {
    type: "SHOW_TERMS_MODAL";
} | {
    type: "SEND_REGISTRATION_EMAIL";
    payload: {
        email: string;
        nickname: string;
        isForgeClaim?: boolean | undefined;
        captchaToken?: string | undefined;
        locale?: string | undefined;
    };
} | {
    type: "CLOSE_TERMS_MODAL";
} | {
    type: "VERIFY_EMAIL";
    payload: {
        secureCode: string;
    };
} | {
    type: "COMPLETE_REGISTRATION";
    payload: {
        email: string;
        nickname: string;
        passwordHash: string;
        device: string;
    };
} | {
    type: "SEND_CODE";
    payload: {
        email: string;
    };
} | {
    type: "CONFIRM_PASSWORD";
    payload: {
        email: string;
        passwordHash: string;
    };
} | {
    type: "RESET_PASSWORD";
} | {
    type: "LOGIN";
} | {
    type: "FORGOT_PASSWORD";
} | {
    type: "SIGN_UP";
} | {
    type: "LOGIN_WITH_WEB3CONNECTOR";
} | {
    type: "CONFIRM_WEB3_LOGIN";
} | {
    type: "VERIFY_EMAIL_ELIGIBILITY";
    email: string;
    isForgeClaim?: boolean | undefined;
    locale?: string | undefined;
} | {
    type: "VERIFY_CLAIM_NFT_EMAIL_2FA";
    payload: {
        email: string;
        emailCode: string;
    };
} | {
    type: "BACK_TO_LOGIN";
} | {
    type: "SETUP_REGISTER_USER";
    registerUser: {
        email: string;
        nickname: string;
        salt: string;
    };
}, import("xstate").BaseActionObject, AuthMachineServices>>;
