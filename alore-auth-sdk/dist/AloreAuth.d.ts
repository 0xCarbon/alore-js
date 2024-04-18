export interface AloreAuthConfiguration {
    endpoint?: string;
}
type FetchWithProgressiveBackoffConfig = {
    maxAttempts?: number;
    initialDelay?: number;
};
type SessionUser = {
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
export type TwoFactorAuth = {
    id: string;
    name: string | null;
    twoFaTypeId: number;
};
interface AuthMachineContext {
    salt?: string;
    error?: string;
    active2fa?: TwoFactorAuth[];
    registerUser?: {
        email: string;
        nickname: string;
        salt: string;
    };
    forgeData?: any;
    googleOtpCode?: string;
    googleUser?: {
        email: string;
        nickname: string;
    };
    sessionUser?: SessionUser;
    CCRPublicKey?: any;
    RCRPublicKey?: any;
}
export declare class AloreAuth {
    readonly apiKey: string;
    protected readonly endpoint: string;
    protected readonly configuration: string;
    constructor(apiKey: string, options?: AloreAuthConfiguration);
    services: {
        completeRegistration: (context: AuthMachineContext, event: {
            type: 'COMPLETE_REGISTRATION';
            payload: {
                email: string;
                nickname: string;
                passwordHash: string;
                device: string;
            };
        }) => Promise<any>;
        confirmPassword: (context: AuthMachineContext, event: {
            type: 'CONFIRM_PASSWORD';
            payload: {
                email: string;
                passwordHash: string;
            };
        }) => Promise<{
            error?: undefined;
        } | {
            error: string;
        }>;
        sendConfirmationEmail: (context: AuthMachineContext, event: {
            type: 'RESEND_CODE';
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
            type: 'SEND_REGISTRATION_EMAIL';
            payload: {
                email: string;
                nickname: string;
                isForgeClaim?: boolean;
                captchaToken?: string;
                locale?: string;
            };
        }) => Promise<{
            salt: any;
            error?: undefined;
        } | {
            error: string;
            salt?: undefined;
        }>;
        retrieveSalt: (context: AuthMachineContext, event: {
            type: 'NEXT';
            payload: {
                email: string;
            };
        }) => Promise<{
            salt: string;
            error?: undefined;
        } | {
            error: string;
            salt?: undefined;
        }>;
        sendCode: (context: AuthMachineContext, event: {
            type: 'SEND_CODE';
            payload: {
                email: string;
            };
        }) => Promise<{
            error: string;
        } | {
            error?: undefined;
        }>;
        verifyLogin: (_: AuthMachineContext, event: {
            type: 'VERIFY_LOGIN';
            payload: {
                email: string;
                device: string;
                passwordHash: string;
                isForgeClaim?: boolean | undefined;
                captchaToken?: string | undefined;
                locale?: string | undefined;
            };
        } | {
            type: 'RESEND_CODE';
            payload: {
                email: string;
                nickname?: string | undefined;
                device?: string | undefined;
                passwordHash?: string | undefined;
                captchaToken?: string | undefined;
                isForgeClaim?: boolean | undefined;
                locale?: string | undefined;
            };
        }) => Promise<{
            active2fa: any;
            error?: undefined;
        } | {
            error: any;
            active2fa?: undefined;
        }>;
        verify2faCode: (context: AuthMachineContext, event: {
            type: 'CONFIRM_SW_CODE';
            payload: {
                email: string;
                device: string;
                passwordHash: string;
                otp: string;
            };
        }) => Promise<any>;
        authenticateWebauthn: (context: AuthMachineContext, event: {
            type: 'VERIFY_HW_AUTH';
            payload: {
                email: string;
                device: string;
                passwordHash: string;
                authId: string;
            };
        }) => Promise<any>;
        verifyDeviceCode: (context: AuthMachineContext, event: {
            type: 'CONFIRM_DEVICE_CODE';
            payload: {
                email: string;
                passwordHash: string;
                device: string;
                secureCode: string;
            };
        }) => Promise<any>;
        verifyEmail: (_: AuthMachineContext, event: {
            type: 'VERIFY_EMAIL';
            payload: {
                secureCode: string;
            };
        }) => Promise<{}>;
        verifyEmail2fa: (context: AuthMachineContext, event: {
            type: 'VERIFY_EMAIL_2FA';
            payload: {
                email: string;
                secureCode: string;
                passwordHash: string;
            };
        }) => Promise<any>;
        verifyEmailEligibility: (_: AuthMachineContext, event: {
            type: 'VERIFY_EMAIL_ELIGIBILITY';
            email: string;
            isForgeClaim?: boolean | undefined;
            locale?: string | undefined;
        }) => Promise<{
            error: any;
        }>;
        verifyClaimNftEmail2fa: (context: AuthMachineContext, event: {
            type: 'VERIFY_CLAIM_NFT_EMAIL_2FA';
            payload: {
                email: string;
                emailCode: string;
            };
        }) => Promise<any>;
        fetchForgeData: (_: AuthMachineContext, event: {
            type: 'INITIALIZE';
            forgeId?: string | null | undefined;
        }) => Promise<any>;
        googleLogin: (_: AuthMachineContext, event: {
            type: 'GOOGLE_LOGIN';
            googleToken: string;
        }) => Promise<{
            googleOtpCode: any;
            salt: any;
            googleUser: {
                email: any;
                nickname: any;
                salt: any;
            };
            isNewUser?: undefined;
            registerUser?: undefined;
        } | {
            isNewUser: boolean;
            registerUser: {
                email: any;
                nickname: any;
                salt: any;
            };
            googleOtpCode?: undefined;
            salt?: undefined;
            googleUser?: undefined;
        } | {
            googleOtpCode?: undefined;
            salt?: undefined;
            googleUser?: undefined;
            isNewUser?: undefined;
            registerUser?: undefined;
        }>;
        verifyGoogleLogin: (_: AuthMachineContext, event: {
            type: 'COMPLETE_GOOGLE_SIGN_IN';
            payload: {
                email: string;
                passwordHash: string;
                otp: string;
            };
        }) => Promise<any>;
    };
    private delay;
    fetchWithProgressiveBackoff(url: RequestInfo | URL, options?: RequestInit, config?: FetchWithProgressiveBackoffConfig): Promise<Response>;
    private verifyBackendStatus;
}
export {};
