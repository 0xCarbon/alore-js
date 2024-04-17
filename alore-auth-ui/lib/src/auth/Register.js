'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from 'react';
import { Button, Card, Spinner } from 'flowbite-react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useActor } from '@xstate/react';
import { ArrowRightIcon, EnvelopeIcon } from '@heroicons/react/20/solid';
import jwt_decode from 'jwt-decode';
import { passwordRules, ruleValidation } from '../components/FormRules/helpers';
import { useGoogleLogin } from '@react-oauth/google';
import { Turnstile } from '@marsidev/react-turnstile';
import { verifyEmptyValues } from '../helpers';
import { BackButton, CheckboxForm, TermsModal, InputForm, FormRules, InputOTP, } from '../components';
import useDictionary from '../hooks/useDictionary';
const envelopIcon = () => React.createElement(EnvelopeIcon, { className: 'h-4 w-4 text-gray-500' });
export const Register = ({ locale = 'pt', authServiceInstance, cloudflareKey, forgeId, inviteToken, cryptoUtils, }) => {
    const { hashUserInfo, generateSecureHash } = cryptoUtils;
    const dictionary = useDictionary(locale);
    const registerDictionary = dictionary === null || dictionary === void 0 ? void 0 : dictionary.auth.register;
    const [secureCode, setSecureCode] = useState('');
    const [sendEmailCooldown, setSendEmailCooldown] = useState(0);
    const [cooldownMultiplier, setCooldownMultiplier] = useState(1);
    const [authState, sendAuth] = useActor(authServiceInstance);
    const intervalRef = useRef();
    const { salt, error: authError, registerUser, googleUser, sessionUser, } = authState.context;
    const [userSalt, setUserSalt] = useState('');
    //   const keyshareWorker: null | Worker = useContext(KeyshareWorkerContext);
    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            resetUserInfo();
            sendAuth({
                type: 'GOOGLE_LOGIN',
                googleToken: tokenResponse.access_token,
            });
        },
    });
    const [captchaStatus, setCaptchaStatus] = useState('idle');
    const [captchaToken, setCaptchaToken] = useState('');
    const handleLogin = () => login();
    const userInfoFormSchema = yup
        .object({
        email: yup
            .string()
            .required(dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.required)
            .email(dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.invalidEmail),
        nickname: yup
            .string()
            .matches(/^[a-zA-Z].*$/, dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.validName)
            .max(40)
            .required(dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.required),
        agreedWithTerms: yup
            .boolean()
            .isTrue(dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.agreeTerms),
    })
        .required();
    const passwordFormSchema = yup
        .object({
        password: yup.string().required(dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.required),
        confirmPassword: yup
            .string()
            .required(dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.required),
    })
        .required();
    const userInfoDefaultValues = {
        email: '',
        nickname: '',
        agreedWithTerms: false,
    };
    const { control: userInfoControl, formState: { errors: userInfoErrors, dirtyFields: userInfoDirtyFields }, handleSubmit: userInfoHandleSubmit, setValue: userInfoSetValue, getValues: userInfoGetValues, reset: resetUserInfo, } = useForm({
        resolver: yupResolver(userInfoFormSchema),
        defaultValues: userInfoDefaultValues,
    });
    const passwordDefaultValues = {
        password: '',
        confirmPassword: '',
    };
    const { control: passwordControl, formState: { errors: passwordErrors, dirtyFields: passwordDirtyFields }, handleSubmit: passwordHandleSubmit, getValues: passwordGetValues, } = useForm({
        resolver: yupResolver(passwordFormSchema),
        defaultValues: passwordDefaultValues,
    });
    useWatch({ control: passwordControl, name: 'password' });
    useWatch({ control: passwordControl, name: 'confirmPassword' });
    const isLoading = useMemo(() => authState.matches('active.register.completingRegistration') ||
        authState.matches('active.register.sendingEmail') ||
        authState.matches('active.register.verifyingEmail') ||
        authState.matches('active.register.resendingRegistrationEmail') ||
        authState.matches('active.register.googleLogin') ||
        authState.matches('active.web3Connector.verifyingClaimNftEmail2fa') ||
        authState.matches('active.web3Connector.verifyingEmailEligibility'), [authState.value]);
    useEffect(() => {
        if (registerUser)
            sendAuth([
                { type: 'INITIALIZE', forgeId },
                'SIGN_UP',
                'ADVANCE_TO_PASSWORD',
            ]);
        else
            sendAuth([{ type: 'INITIALIZE', forgeId }, 'SIGN_UP']);
        return () => {
            sendAuth('RESET');
        };
    }, []);
    useEffect(() => {
        if (inviteToken) {
            try {
                const decoded = jwt_decode(inviteToken);
                const { email, nickname } = decoded;
                userInfoSetValue('email', email);
                userInfoSetValue('nickname', nickname);
                setUserSalt(decoded.salt);
            }
            catch (err) {
                console.error('Invalid inviteToken');
            }
        }
    }, [inviteToken]);
    // TODO new social login logic
    // useEffect(() => {
    //   if (
    //     status === 'authenticated' &&
    //     // @ts-ignore
    //     session.user?.provider === 'google' &&
    //     authState.matches('active.register.idle')
    //   ) {
    //     const sessionUser: any = session?.user;
    //     signOut({ redirect: false });
    //     sendAuth({
    //       type: 'GOOGLE_LOGIN',
    //       // @ts-ignore
    //       googleToken: session?.accessToken,
    //       googleUser: {
    //         email: sessionUser?.email || '',
    //         nickname: sessionUser?.name || '',
    //       },
    //     });
    //   }
    // }, [session]);
    useEffect(() => {
        if (googleUser) {
            sendAuth(['RESET', 'INITIALIZE']);
        }
    }, [googleUser]);
    useEffect(() => {
        if (secureCode.length === 6) {
            onClickSecureCodeSubmit();
        }
    }, [secureCode]);
    useEffect(() => {
        if (sendEmailCooldown <= 0) {
            clearInterval(intervalRef.current);
        }
    }, [sendEmailCooldown]);
    function onClickSecureCodeSubmit() {
        sendAuth({ type: 'VERIFY_EMAIL', payload: { secureCode } });
        setSecureCode('');
    }
    function resendSecureCode() {
        const { email, nickname } = userInfoGetValues();
        sendAuth({
            type: 'RESEND_CODE',
            payload: { email, nickname, isForgeClaim: !!forgeId, locale },
        });
        setSendEmailCooldown(15 * cooldownMultiplier);
        intervalRef.current = setInterval(() => setSendEmailCooldown((state) => state - 1), 1000);
        setCooldownMultiplier((state) => state + 1);
    }
    function onSubmitUserData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (inviteToken) {
                sendAuth('ADVANCE_TO_PASSWORD');
            }
            else {
                const { email, nickname } = data;
                sendAuth({
                    type: 'SEND_REGISTRATION_EMAIL',
                    payload: {
                        email,
                        nickname,
                        captchaToken,
                        isForgeClaim: !!forgeId,
                        locale,
                    },
                });
            }
        });
    }
    // TODO
    function derivePasswordAndGetKeyshares(password, email) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (keyshareWorker) {
            //   keyshareWorker.postMessage({
            //     method: 'derive-password',
            //     payload: { password, email },
            //   });
            // }
        });
    }
    function onSubmitRegister(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { password } = data;
            const email = registerUser
                ? registerUser.email
                : userInfoGetValues('email');
            const nickname = registerUser
                ? registerUser.nickname
                : userInfoGetValues('nickname');
            const { userAgent } = window.navigator;
            const device = hashUserInfo(userAgent);
            const saltWallet = registerUser ? registerUser.salt : salt || userSalt;
            if (saltWallet) {
                derivePasswordAndGetKeyshares(password, email);
                const secureHashArgon2d = yield generateSecureHash(password, saltWallet, 'argon2d');
                sendAuth({
                    type: 'COMPLETE_REGISTRATION',
                    payload: {
                        email,
                        passwordHash: secureHashArgon2d,
                        device,
                        nickname,
                    },
                });
            }
        });
    }
    const isUserInfoSubmitDisabled = useMemo(() => verifyEmptyValues(userInfoGetValues()), [userInfoGetValues(), userInfoDirtyFields]);
    const isPasswordSubmitDisabled = useMemo(() => {
        const passwordValues = passwordGetValues();
        const userInfoValues = registerUser || userInfoGetValues();
        let isValid = true;
        passwordRules.forEach((rule) => {
            if (!ruleValidation(rule, passwordValues, userInfoValues)) {
                isValid = false;
            }
        });
        return !isValid;
    }, [passwordGetValues(), passwordDirtyFields]);
    const UserInfo = useMemo(() => (React.createElement(React.Fragment, null,
        inviteToken ? (React.createElement("div", { className: 'flex flex-col gap-2.5' },
            React.createElement("h1", { className: 'mb-1 text-center text-[1.75rem] font-bold text-alr-grey' }, registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.welcome),
            React.createElement("div", { className: 'mb-5 text-gray-600' }, registerDictionary === null || registerDictionary === void 0 ? void 0 :
                registerDictionary.invitedBy,
                React.createElement("span", { className: 'font-semibold' }, " 0xCarbon "), registerDictionary === null || registerDictionary === void 0 ? void 0 :
                registerDictionary.toJoin,
                React.createElement("span", { className: 'text-alr-red' }, " Alore.")))) : (React.createElement("h1", { className: 'mb-1 text-center font-inter font-semibold text-gray-600 md:text-lg' }, forgeId
            ? registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.forgeTitle
            : registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.title)),
        (authError === null || authError === void 0 ? void 0 : authError.includes('beta')) && (React.createElement("span", { className: 'text-center font-poppins text-xl font-bold text-alr-red' }, authError)),
        React.createElement("form", { onSubmit: userInfoHandleSubmit((data) => onSubmitUserData(data)), className: 'mb-1 flex flex-col gap-y-5', "data-test": 'register-new-account-step' },
            React.createElement(InputForm, { control: userInfoControl, errors: userInfoErrors, name: 'email', placeholder: inviteToken
                    ? `${registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.emailInvitePlaceholder}`
                    : `${registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.emailLabel}`, "data-test": 'register-email', icon: envelopIcon, autoFocus: true, disabled: isLoading || !!inviteToken }),
            React.createElement(InputForm, { control: userInfoControl, errors: userInfoErrors, name: 'nickname', placeholder: registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.nicknameLabel, "data-test": 'register-first-name', disabled: isLoading }),
            React.createElement(Turnstile, { siteKey: cloudflareKey, options: { theme: 'light', language: locale, retry: 'never' }, onSuccess: (token) => {
                    setCaptchaToken(token);
                    setCaptchaStatus('success');
                }, onError: () => {
                    setCaptchaStatus('error');
                }, onExpire: () => setCaptchaStatus('expired') }),
            React.createElement(CheckboxForm, { className: 'flex items-center justify-center', control: userInfoControl, name: 'agreedWithTerms', "data-test": 'register-agreed-with-terms', label: React.createElement("span", { className: 'text-xs font-light text-gray-400 md:text-sm md:font-normal' }, registerDictionary === null || registerDictionary === void 0 ? void 0 :
                    registerDictionary.agreeTermsPart1,
                    React.createElement("span", { onClick: () => sendAuth('SHOW_TERMS_MODAL'), className: 'cursor-pointer text-alr-red underline', "data-test": 'terms-of-service' }, registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.agreeTermsPart2)) }),
            React.createElement(Button, { "data-test": 'register-button', type: 'submit', disabled: isUserInfoSubmitDisabled ||
                    isLoading ||
                    captchaStatus !== 'success' },
                isLoading && (React.createElement(Spinner, { className: 'mr-3 !h-5 w-full !fill-gray-300' })), registerDictionary === null || registerDictionary === void 0 ? void 0 :
                registerDictionary.buttonStart)),
        React.createElement("div", { className: 'flex w-full cursor-pointer flex-row items-center justify-center gap-1.5 text-sm text-gray-500', onClick: () => {
                sendAuth(['RESET', { type: 'INITIALIZE', forgeId }]);
            } },
            React.createElement("span", { className: 'font-inter font-semibold' }, registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.alreadyHaveAccount),
            React.createElement(ArrowRightIcon, { className: 'h-4 w-4' })),
        forgeId && (React.createElement(React.Fragment, null,
            React.createElement("div", { className: 'h-[0.5px] w-full bg-gray-300' }),
            React.createElement(Button, { color: 'light', onClick: handleLogin, outline: true },
                React.createElement("div", { className: 'flex flex-row items-center justify-center gap-2' },
                    React.createElement("img", { src: '/assets/google.svg', alt: 'google logo', width: 16 }), dictionary === null || dictionary === void 0 ? void 0 :
                    dictionary.auth.continueGoogle)),
            React.createElement(Button, { color: 'light', onClick: () => sendAuth('LOGIN_WITH_WEB3CONNECTOR'), outline: true },
                React.createElement("div", { className: 'flex flex-row items-center justify-center gap-2' },
                    React.createElement("div", { className: 'relative flex flex-row' },
                        React.createElement("img", { src: '/assets/metamask-logo.svg', alt: 'metamask logo', width: 20, className: 'absolute right-3' }),
                        React.createElement("img", { src: '/assets/wallet-connect-logo.svg', alt: 'walletconnect logo', width: 20 })),
                    "Metamask/WalletConnect")))))), [
        isUserInfoSubmitDisabled,
        userInfoControl,
        userInfoErrors,
        userInfoGetValues(),
        userInfoDirtyFields,
        isLoading,
    ]);
    const VerifyEmail = useMemo(() => (React.createElement(React.Fragment, null,
        React.createElement(BackButton, { disabled: isLoading, onClick: () => sendAuth('BACK') }),
        React.createElement("div", { className: 'flex w-full flex-col items-center', "data-test": 'register-verify-email-step' },
            React.createElement("span", { className: 'mb-6 font-poppins text-2xl font-bold text-alr-grey md:text-[1.75rem]' }, registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.verifyEmail),
            React.createElement("span", { className: 'mb-6 w-full text-center font-medium text-alr-grey' }, registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.informCode),
            React.createElement("div", { className: 'mb-6 flex' },
                React.createElement(InputOTP, { className: 'child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9', value: secureCode, onChange: (value) => setSecureCode(value), inputLength: 6, "data-test": 'secure-code', errorMessage: (authError === null || authError === void 0 ? void 0 : authError.includes('wrong'))
                        ? `${registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.wrongCode}`
                        : undefined, disabled: isLoading })),
            React.createElement(Button, { "data-test": 'secure-code-submit', onClick: () => onClickSecureCodeSubmit(), className: 'mb-6 w-full', disabled: secureCode.length !== 6 || isLoading },
                isLoading && (React.createElement(Spinner, { className: 'mr-3 !h-5 w-full !fill-gray-300' })), registerDictionary === null || registerDictionary === void 0 ? void 0 :
                registerDictionary.confirmCode),
            React.createElement("span", { onClick: () => resendSecureCode(), className: `${sendEmailCooldown > 0
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer opacity-100 hover:text-alr-red'} text-base font-medium duration-300` }, `${registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.resendCode}${sendEmailCooldown ? ` (${sendEmailCooldown}s)` : ''}`)))), [secureCode, sendEmailCooldown, isLoading]);
    const Password = useMemo(() => (React.createElement(React.Fragment, null,
        React.createElement(BackButton, { disabled: isLoading, onClick: () => sendAuth(inviteToken || registerUser ? 'BACK_TO_IDLE' : 'BACK') }, userInfoGetValues('email')),
        React.createElement("div", { className: 'flex w-full flex-col', "data-test": 'register-password-step' },
            React.createElement("span", { className: 'mb-5 text-center font-poppins font-bold text-alr-grey' }, registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.createPassword),
            React.createElement("form", { onSubmit: passwordHandleSubmit((data) => onSubmitRegister(data)), className: 'flex flex-col gap-y-4' },
                React.createElement(InputForm, { control: passwordControl, errors: passwordErrors, name: 'password', autoFocus: true, placeholder: registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.passwordPlaceholder, label: registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.passwordLabel, type: 'password', "data-test": 'register-password', disabled: isLoading }),
                React.createElement(InputForm, { control: passwordControl, errors: passwordErrors, name: 'confirmPassword', placeholder: registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.passwordConfirmPlaceholder, label: registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.passwordConfirmLabel, type: 'password', "data-test": 'register-confirm-password', disabled: isLoading }),
                React.createElement(FormRules, { locale: locale, className: '!gap-y-1 md:!gap-y-2', passwordValues: passwordGetValues(), userValues: registerUser || userInfoGetValues() }),
                React.createElement(Button, { "data-test": 'password-submit', type: 'submit', disabled: isPasswordSubmitDisabled || isLoading },
                    isLoading && (React.createElement(Spinner, { className: 'mr-3 !h-5 w-full !fill-gray-300' })), dictionary === null || dictionary === void 0 ? void 0 :
                    dictionary.next))))), [
        isPasswordSubmitDisabled,
        passwordControl,
        passwordErrors,
        passwordGetValues(),
        passwordDirtyFields,
        isLoading,
        registerUser,
    ]);
    return (React.createElement("div", { className: 'flex h-full min-h-screen w-full flex-col items-center justify-center gap-y-2 sm:gap-y-7', "data-test": 'register-page' },
        React.createElement(TermsModal, { locale: locale, show: authState.matches('active.register.termsModal'), onClose: () => sendAuth('CLOSE_TERMS_MODAL'), onSubmit: () => {
                userInfoSetValue('agreedWithTerms', true);
                sendAuth('CLOSE_TERMS_MODAL');
            } }),
        forgeId ? (React.createElement("div", { className: 'flex flex-col' },
            React.createElement("span", { className: 'text-center font-poppins text-2xl font-black text-alr-grey' }, "Tardezinha com Thiaguinho"),
            React.createElement("div", { className: 'flex w-full flex-row items-center justify-center gap-2' },
                React.createElement("span", { className: 'font-inter text-sm font-medium text-gray-900' }, dictionary === null || dictionary === void 0 ? void 0 : dictionary.auth.poweredBy),
                React.createElement("img", { src: '/assets/alore-logo-black.svg', alt: 'alore logo', width: '60' })))) : (React.createElement("img", { src: '/assets/alore-logo-black.svg', alt: 'alore logo', className: 'mb-5', width: authState.matches('active.login.newDevice') ? 153 : 201 })),
        React.createElement(Card, { className: `flex min-w-[20rem] md:w-96 ${isLoading ? 'pointer-events-none opacity-50' : ''} mx-5 py-2 md:mx-7 md:child:!px-9` },
            forgeId && authState.matches('active.web3Connector') && 'TODO',
            (authState.matches('active.register.idle') ||
                authState.matches('active.register.termsModal') ||
                authState.matches('active.register.googleLogin') ||
                authState.matches('active.register.sendingEmail')) &&
                UserInfo,
            (authState.matches('active.register.emailValidation') ||
                authState.matches('active.register.verifyingEmail') ||
                authState.matches('active.register.resendingRegistrationEmail')) &&
                VerifyEmail,
            (authState.matches('active.register.createPassword') ||
                authState.matches('active.register.completingRegistration')) &&
                Password,
            authState.matches('active.register.userCreated') && (React.createElement("div", { className: 'flex flex-row gap-2 justify-center items-center' },
                React.createElement("span", null, "Registration complete for"),
                React.createElement("span", { className: 'font-semibold' }, sessionUser === null || sessionUser === void 0 ? void 0 : sessionUser.nickname))))));
};
