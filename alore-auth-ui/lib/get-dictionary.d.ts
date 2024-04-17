import type { Awaited } from 'ts-essentials';
export declare const i18n: {
    readonly defaultLocale: "en";
    readonly locales: readonly ["en", "pt"];
};
export type Locale = (typeof i18n)['locales'][number];
export declare const dictionaries: {
    en: () => Promise<{
        password: string;
        formValidation: {
            required: string;
            invalidEmail: string;
            passwordMinimum: string;
            validName: string;
            agreeTerms: string;
        };
        auth: {
            poweredBy: string;
            continueWith: string;
            selectAnOption: string;
            continueGoogle: string;
            continueApple: string;
            layout: {
                default: {
                    title: string;
                    subtitle: string;
                };
                mintNft: {
                    title: string;
                    subtitle: string;
                };
            };
            web3Connector: {
                acceptConnection: string;
                connectionPending: string;
                typeEmail: string;
            };
            login: {
                login: string;
                forgeLogin: string;
                invalidEmailPassword: string;
                somethingWrong: string;
                invalidEmailPasswordDescription: string;
                defaultError: string;
                loginAccount: string;
                enterEmail: string;
                dontHaveAccount: string;
                createAccount: string;
                singUp: string;
                enterPassword: string;
                verifyEmail: string;
                verifyEmailDescription: string;
                wrongCode: string;
                confirmCode: string;
                resendCode: string;
                inform2FACode: string;
                newDevice: string;
                touchHardware: string;
                touchHardwareDescription: string;
                cantVerify2fa: string;
                tryAgain: string;
                tryHardware: string;
                useAnotherHardware: string;
                useSw2fa: string;
                useHw2fa: string;
            };
            register: {
                title: string;
                forgeTitle: string;
                emailLabel: string;
                emailPlaceholder: string;
                emailInvitePlaceholder: string;
                nicknameLabel: string;
                agreeTermsPart1: string;
                agreeTermsPart2: string;
                buttonStart: string;
                alreadyHaveAccount: string;
                loginHere: string;
                welcome: string;
                invitedBy: string;
                toJoin: string;
                verifyEmail: string;
                informCode: string;
                wrongCode: string;
                confirmCode: string;
                resendCode: string;
                createPassword: string;
                passwordPlaceholder: string;
                passwordLabel: string;
                passwordConfirmPlaceholder: string;
                passwordConfirmLabel: string;
                termsTitle: string;
                termsDescription: string;
            };
        };
    }>;
    pt: () => Promise<{
        password: string;
        formValidation: {
            required: string;
            invalidEmail: string;
            passwordMinimum: string;
            validName: string;
            agreeTerms: string;
        };
        auth: {
            poweredBy: string;
            continueWith: string;
            selectAnOption: string;
            continueGoogle: string;
            continueApple: string;
            layout: {
                default: {
                    title: string;
                    subtitle: string;
                };
                mintNft: {
                    title: string;
                    subtitle: string;
                };
            };
            web3Connector: {
                acceptConnection: string;
                connectionPending: string;
                typeEmail: string;
            };
            login: {
                login: string;
                forgeLogin: string;
                invalidEmailPassword: string;
                somethingWrong: string;
                invalidEmailPasswordDescription: string;
                defaultError: string;
                loginAccount: string;
                enterEmail: string;
                dontHaveAccount: string;
                singUp: string;
                createAccount: string;
                enterPassword: string;
                verifyEmail: string;
                verifyEmailDescription: string;
                wrongCode: string;
                confirmCode: string;
                resendCode: string;
                inform2FACode: string;
                newDevice: string;
                touchHardware: string;
                touchHardwareDescription: string;
                cantVerify2fa: string;
                tryAgain: string;
                tryHardware: string;
                useAnotherHardware: string;
                useSw2fa: string;
                useHw2fa: string;
            };
            register: {
                title: string;
                forgeTitle: string;
                emailLabel: string;
                emailPlaceholder: string;
                emailInvitePlaceholder: string;
                nicknameLabel: string;
                agreeTermsPart1: string;
                agreeTermsPart2: string;
                buttonStart: string;
                alreadyHaveAccount: string;
                loginHere: string;
                welcome: string;
                invitedBy: string;
                toJoin: string;
                verifyEmail: string;
                informCode: string;
                wrongCode: string;
                confirmCode: string;
                resendCode: string;
                createPassword: string;
                passwordPlaceholder: string;
                passwordLabel: string;
                passwordConfirmPlaceholder: string;
                passwordConfirmLabel: string;
                termsTitle: string;
                termsDescription: string;
            };
        };
    }>;
};
export declare const getDictionary: (locale: Locale) => Promise<{
    password: string;
    formValidation: {
        required: string;
        invalidEmail: string;
        passwordMinimum: string;
        validName: string;
        agreeTerms: string;
    };
    auth: {
        poweredBy: string;
        continueWith: string;
        selectAnOption: string;
        continueGoogle: string;
        continueApple: string;
        layout: {
            default: {
                title: string;
                subtitle: string;
            };
            mintNft: {
                title: string;
                subtitle: string;
            };
        };
        web3Connector: {
            acceptConnection: string;
            connectionPending: string;
            typeEmail: string;
        };
        login: {
            login: string;
            forgeLogin: string;
            invalidEmailPassword: string;
            somethingWrong: string;
            invalidEmailPasswordDescription: string;
            defaultError: string;
            loginAccount: string;
            enterEmail: string;
            dontHaveAccount: string;
            createAccount: string;
            singUp: string;
            enterPassword: string;
            verifyEmail: string;
            verifyEmailDescription: string;
            wrongCode: string;
            confirmCode: string;
            resendCode: string;
            inform2FACode: string;
            newDevice: string;
            touchHardware: string;
            touchHardwareDescription: string;
            cantVerify2fa: string;
            tryAgain: string;
            tryHardware: string;
            useAnotherHardware: string;
            useSw2fa: string;
            useHw2fa: string;
        };
        register: {
            title: string;
            forgeTitle: string;
            emailLabel: string;
            emailPlaceholder: string;
            emailInvitePlaceholder: string;
            nicknameLabel: string;
            agreeTermsPart1: string;
            agreeTermsPart2: string;
            buttonStart: string;
            alreadyHaveAccount: string;
            loginHere: string;
            welcome: string;
            invitedBy: string;
            toJoin: string;
            verifyEmail: string;
            informCode: string;
            wrongCode: string;
            confirmCode: string;
            resendCode: string;
            createPassword: string;
            passwordPlaceholder: string;
            passwordLabel: string;
            passwordConfirmPlaceholder: string;
            passwordConfirmLabel: string;
            termsTitle: string;
            termsDescription: string;
        };
    };
}>;
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
