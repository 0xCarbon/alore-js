import { Locale } from '../../get-dictionary';
declare const useDictionary: (locale: Locale) => {
    accept: string;
    password: string;
    next: string;
    formValidation: {
        required: string;
        invalidEmail: string;
        passwordMinimum: string;
        validName: string;
        agreeTerms: string;
    };
    passwordRules: {
        specialCharacter: string;
        uppercaseLetter: string;
        minimumEightCharacters: string;
        passwordMatch: string;
        dontUseYourNameOrEmail: string;
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
} | undefined;
export default useDictionary;
