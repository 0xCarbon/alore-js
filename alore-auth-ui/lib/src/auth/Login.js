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
import { ArrowRightIcon, EnvelopeIcon } from '@heroicons/react/20/solid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useActor } from '@xstate/react';
import { Turnstile } from '@marsidev/react-turnstile';
import { InputOTP, InputForm, BackButton, Map } from '../components';
import { useGoogleLogin } from '@react-oauth/google';
import { verifyEmptyValues } from '../helpers';
import useDictionary from '../hooks/useDictionary';
// import { KeyshareWorkerContext } from '../../keyshareWorker'; // TODO
const envelopIcon = () => React.createElement(EnvelopeIcon, { className: 'h-4 w-4 text-gray-500' });
const HARDWARE = 1;
const SOFTWARE = 2;
export const Login = ({ locale = 'pt', authServiceInstance, cloudflareKey, forgeId, cryptoUtils, }) => {
    const { hashUserInfo, generateSecureHash } = cryptoUtils;
    const dictionary = useDictionary(locale);
    const loginDictionary = dictionary === null || dictionary === void 0 ? void 0 : dictionary.auth.login;
    // const keyshareWorker: Worker | null = useContext(KeyshareWorkerContext);
    const [secureCode2FA, setSecure2FACode] = useState('');
    const [secureCodeEmail, setSecureCodeEmail] = useState('');
    const [authState, sendAuth] = useActor(authServiceInstance);
    const { salt, error: authError, active2fa, registerUser, googleOtpCode, googleUser, sessionUser, } = authState.context;
    const [currentDevice, setCurrentDevice] = useState('');
    const [loading, setLoading] = useState(false);
    const [sendEmailCooldown, setSendEmailCooldown] = useState(0);
    const [cooldownMultiplier, setCooldownMultiplier] = useState(1);
    const [newDeviceInfo, setNewDeviceInfo] = useState();
    const intervalRef = useRef();
    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            resetEmail();
            sendAuth({
                type: 'GOOGLE_LOGIN',
                googleToken: tokenResponse.access_token,
            });
        },
    });
    const [captchaStatus, setCaptchaStatus] = useState('idle');
    const [captchaToken, setCaptchaToken] = useState('');
    const handleLogin = () => login();
    console.log({ value: authState.value });
    useEffect(() => {
        console.log({ authState });
        if (authState.matches('active.login.idle'))
            setCaptchaStatus('idle');
    }, [authState.value]);
    const isLoading = useMemo(() => loading ||
        authState.matches('active.login.retrievingSalt') ||
        authState.matches('active.login.verifyingLogin') ||
        authState.matches('active.login.verifyingHwAuth') ||
        authState.matches('active.login.verifying2faCode') ||
        authState.matches('active.login.verifyingCode') ||
        authState.matches('active.login.verifyingEmail2fa') ||
        authState.matches('active.login.resendingEmailCode') ||
        authState.matches('active.login.googleLogin') ||
        authState.matches('active.login.verifyingGoogleLogin') ||
        authState.matches('active.login.resendingConfirmationEmail') ||
        authState.matches('active.web3Connector.verifyingClaimNftEmail2fa') ||
        authState.matches('active.web3Connector.verifyingEmailEligibility'), [authState.value]);
    const emailFormSchema = yup
        .object({
        email: yup
            .string()
            .required(dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.required)
            .email(dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.invalidEmail),
    })
        .required();
    const passwordFormSchema = yup
        .object({
        password: yup
            .string()
            .required(dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.required)
            .min(8, dictionary === null || dictionary === void 0 ? void 0 : dictionary.formValidation.passwordMinimum),
    })
        .required();
    const activeHw2fa = useMemo(() => (active2fa === null || active2fa === void 0 ? void 0 : active2fa.filter((item) => item.twoFaTypeId === HARDWARE)) || [], [active2fa]);
    const activeSw2fa = useMemo(() => active2fa === null || active2fa === void 0 ? void 0 : active2fa.find((item) => item.twoFaTypeId === SOFTWARE), [active2fa]);
    const emailDefaultValues = {
        email: '',
    };
    const { control: emailControl, formState: { errors: emailErrors, dirtyFields: emailDirtyFields }, handleSubmit: handleSubmitEmail, getValues: getValuesEmail, reset: resetEmail, } = useForm({
        resolver: yupResolver(emailFormSchema),
        defaultValues: emailDefaultValues,
    });
    useWatch({ control: emailControl, name: ['email'] });
    const passwordDefaultValues = {
        password: '',
    };
    const { control: passwordControl, formState: { errors: passwordErrors, dirtyFields: passwordDirtyFields }, handleSubmit: handleSubmitPassword, getValues: getValuesPassword, } = useForm({
        resolver: yupResolver(passwordFormSchema),
        defaultValues: passwordDefaultValues,
    });
    useWatch({ control: passwordControl, name: ['password'] });
    useEffect(() => {
        if (registerUser) {
            if (forgeId) {
                sendAuth(['RESET', { type: 'INITIALIZE', forgeId }]);
            }
            else {
                sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'LOGIN']);
            }
        }
    }, [registerUser]);
    useEffect(() => {
        if (secureCode2FA.length === 6) {
            if (authState.matches('active.login.email2fa')) {
                onClickSecureCodeSubmit();
            }
            else {
                onSubmitSecureCode2FA();
            }
        }
    }, [secureCode2FA]);
    useEffect(() => {
        if (secureCodeEmail.length === 6) {
            onSubmitSecureCodeEmail();
        }
    }, [secureCodeEmail]);
    useEffect(() => {
        if (sendEmailCooldown <= 0) {
            clearInterval(intervalRef.current);
        }
    }, [sendEmailCooldown]);
    useEffect(() => {
        var _a;
        if (authState.matches('active.login.newDevice')) {
            // getNewDeviceInfo(); // TODO
        }
        if (authState.matches('active.login.hardware2fa') &&
            ((_a = authState.history) === null || _a === void 0 ? void 0 : _a.matches('active.login.verifyingLogin'))) {
            startHwAuth(0);
        }
    }, [authState.value]);
    function startHwAuth(index) {
        return __awaiter(this, void 0, void 0, function* () {
            setLoading(true);
            const { email } = getValuesEmail();
            const { password } = getValuesPassword();
            if (salt && active2fa) {
                const secureHashArgon2d = yield generateSecureHash(password, salt, 'argon2d');
                const hardwares2fa = active2fa.filter((item) => item.twoFaTypeId === HARDWARE);
                sendAuth({
                    type: 'VERIFY_HW_AUTH',
                    payload: {
                        email,
                        device: currentDevice,
                        passwordHash: secureHashArgon2d,
                        authId: hardwares2fa[index].id,
                    },
                });
            }
            setLoading(false);
        });
    }
    function onSubmitEmail(data) {
        return __awaiter(this, void 0, void 0, function* () {
            setLoading(true);
            const { email } = data;
            // await signOut({ redirect: false });
            sendAuth({ type: 'NEXT', payload: { email } });
            setLoading(false);
        });
    }
    // TODO
    function derivePasswordAndGetKeyshares(password, email) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (keyshareWorker) {
            //   // eslint-disable-next-line react/destructuring-assignment
            //   keyshareWorker.postMessage({
            //     method: 'derive-password',
            //     payload: { password, email },
            //   });
            // }
        });
    }
    function onSubmitLogin(data) {
        return __awaiter(this, void 0, void 0, function* () {
            setLoading(true);
            const { password } = data;
            const email = getValuesEmail('email') || (googleUser === null || googleUser === void 0 ? void 0 : googleUser.email);
            if (salt && email) {
                derivePasswordAndGetKeyshares(password, email);
                const secureHashArgon2d = yield generateSecureHash(password, salt, 'argon2d');
                let device = window.localStorage.getItem('currentDeviceSecret');
                if (!device) {
                    const { userAgent } = window.navigator;
                    device = hashUserInfo(userAgent);
                }
                setCurrentDevice(device);
                if (googleOtpCode) {
                    sendAuth({
                        type: 'COMPLETE_GOOGLE_SIGN_IN',
                        payload: {
                            email,
                            passwordHash: secureHashArgon2d,
                            otp: googleOtpCode,
                        },
                    });
                }
                else {
                    sendAuth({
                        type: 'VERIFY_LOGIN',
                        payload: {
                            email,
                            device,
                            passwordHash: secureHashArgon2d,
                            captchaToken,
                            isForgeClaim: !!forgeId,
                            locale,
                        },
                    });
                }
            }
            setLoading(false);
        });
    }
    function onSubmitSecureCode2FA() {
        return __awaiter(this, void 0, void 0, function* () {
            setLoading(true);
            const { email } = getValuesEmail();
            const { password } = getValuesPassword();
            if (salt) {
                derivePasswordAndGetKeyshares(password, email);
                const secureHashArgon2d = yield generateSecureHash(password, salt, 'argon2d');
                sendAuth({
                    type: 'CONFIRM_SW_CODE',
                    payload: {
                        email,
                        device: currentDevice,
                        passwordHash: secureHashArgon2d,
                        otp: secureCode2FA,
                    },
                });
                setSecure2FACode('');
            }
            setLoading(false);
        });
    }
    function onClickSecureCodeSubmit() {
        return __awaiter(this, void 0, void 0, function* () {
            setLoading(true);
            const { password } = getValuesPassword();
            const { email } = getValuesEmail();
            if (salt) {
                derivePasswordAndGetKeyshares(password, email);
                const secureHashArgon2d = yield generateSecureHash(password, salt, 'argon2d');
                let device = window.localStorage.getItem('currentDeviceSecret');
                if (!device) {
                    const { userAgent } = window.navigator;
                    device = hashUserInfo(userAgent);
                }
                setCurrentDevice(device);
                sendAuth({
                    type: 'VERIFY_EMAIL_2FA',
                    payload: {
                        email: getValuesEmail('email'),
                        secureCode: secureCode2FA,
                        passwordHash: secureHashArgon2d,
                    },
                });
            }
            setLoading(false);
            setSecure2FACode('');
        });
    }
    function resendSecureCode() {
        return __awaiter(this, void 0, void 0, function* () {
            setLoading(true);
            const { email } = getValuesEmail();
            const { password } = getValuesPassword();
            if (salt) {
                derivePasswordAndGetKeyshares(password, email);
                const secureHashArgon2d = yield generateSecureHash(password, salt, 'argon2d');
                sendAuth({
                    type: 'RESEND_CODE',
                    payload: {
                        email,
                        passwordHash: secureHashArgon2d,
                        device: currentDevice,
                        nickname: email,
                        isForgeClaim: !!forgeId,
                        locale,
                    },
                });
                setSecureCodeEmail('');
            }
            setLoading(false);
            setSendEmailCooldown(15 * cooldownMultiplier);
            intervalRef.current = setInterval(() => setSendEmailCooldown((state) => state - 1), 1000);
            setCooldownMultiplier((state) => state + 1);
        });
    }
    function onSubmitSecureCodeEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            setLoading(true);
            const { email } = getValuesEmail();
            const { password } = getValuesPassword();
            if (salt) {
                derivePasswordAndGetKeyshares(password, email);
                const secureHashArgon2d = yield generateSecureHash(password, salt, 'argon2d');
                sendAuth({
                    type: 'CONFIRM_DEVICE_CODE',
                    payload: {
                        email,
                        passwordHash: secureHashArgon2d,
                        device: currentDevice,
                        secureCode: secureCodeEmail,
                    },
                });
                setSecureCodeEmail('');
            }
            setLoading(false);
        });
    }
    const isLoginSubmitDisabled = useMemo(() => verifyEmptyValues(Object.assign(Object.assign({}, getValuesEmail()), getValuesPassword())), [
        Object.assign(Object.assign({}, getValuesEmail()), getValuesPassword()),
        Object.assign(Object.assign({}, emailDirtyFields), passwordDirtyFields),
    ]);
    const EmailInputStep = useMemo(() => (React.createElement(React.Fragment, null,
        authError ? (React.createElement("div", { className: 'flex flex-col items-center justify-center gap-5' },
            React.createElement("img", { src: '/assets/auth-error.svg', alt: 'alore logo', width: 70 }),
            (authError === null || authError === void 0 ? void 0 : authError.includes('beta')) ? (React.createElement("span", { className: 'text-center font-poppins text-xl font-bold text-alr-red' }, authError)) : (React.createElement(React.Fragment, null,
                React.createElement("span", { className: 'text-center font-poppins text-xl font-bold text-alr-red' }, (authError === null || authError === void 0 ? void 0 : authError.includes('Invalid credentials'))
                    ? loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.invalidEmailPassword
                    : loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.somethingWrong),
                React.createElement("span", { className: 'text-center font-medium text-alr-grey' }, (authError === null || authError === void 0 ? void 0 : authError.includes('Invalid credentials'))
                    ? loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.invalidEmailPasswordDescription
                    : loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.defaultError))))) : (React.createElement("h1", { className: 'text-center font-inter text-lg font-bold text-gray-700' }, forgeId
            ? loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.forgeLogin
            : loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.loginAccount)),
        React.createElement("form", { className: 'flex flex-col gap-y-5', onSubmit: handleSubmitEmail((data) => onSubmitEmail(data)) },
            React.createElement(InputForm, { className: 'my-1', control: emailControl, errors: emailErrors, name: 'email', placeholder: loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.enterEmail, "data-test": 'login-email', icon: envelopIcon }),
            React.createElement(Button, { type: 'submit', "data-test": 'login-button', disabled: verifyEmptyValues(getValuesEmail('email')) },
                isLoading && (React.createElement(Spinner, { className: 'mr-3 !h-5 w-full !fill-gray-300' })), loginDictionary === null || loginDictionary === void 0 ? void 0 :
                loginDictionary.login),
            React.createElement("div", { className: 'h-[0.5px] w-full bg-gray-300' }),
            React.createElement(Button, { color: 'light', onClick: handleLogin, outline: true },
                React.createElement("div", { className: 'flex flex-row items-center justify-center gap-2' },
                    React.createElement("img", { src: '/assets/google.svg', alt: 'google logo', width: 16 }), dictionary === null || dictionary === void 0 ? void 0 :
                    dictionary.auth.continueGoogle)),
            forgeId && (React.createElement(Button, { color: 'light', onClick: () => sendAuth('LOGIN_WITH_WEB3CONNECTOR'), outline: true },
                React.createElement("div", { className: 'flex flex-row items-center justify-center gap-2' },
                    React.createElement("div", { className: 'relative flex flex-row' },
                        React.createElement("img", { src: '/assets/metamask-logo.svg', alt: 'metamask logo', width: 20, className: 'absolute right-3' }),
                        React.createElement("img", { src: '/assets/wallet-connect-logo.svg', alt: 'walletconnect logo', width: 20 })),
                    "Metamask/WalletConnect"))),
            React.createElement("span", { className: 'text-center text-sm font-medium' }, loginDictionary === null || loginDictionary === void 0 ? void 0 :
                loginDictionary.dontHaveAccount,
                React.createElement("div", { className: 'cursor-pointer text-alr-red', onClick: () => {
                        sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'SIGN_UP']);
                    } }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.singUp))))), [
        getValuesEmail(),
        isLoginSubmitDisabled,
        emailErrors,
        emailControl,
        isLoading,
    ]);
    const PasswordInputStep = useMemo(() => (React.createElement(React.Fragment, null,
        React.createElement(BackButton, { className: 'mb-2.5', onClick: () => sendAuth('BACK') }, getValuesEmail('email') || (googleUser === null || googleUser === void 0 ? void 0 : googleUser.email)),
        authError && (React.createElement("div", { className: 'flex flex-col items-center justify-center gap-5' },
            React.createElement("img", { src: '/assets/auth-error.svg', alt: 'alore logo', width: 70 }),
            React.createElement("span", { className: 'text-center font-poppins text-xl font-bold text-alr-red' }, (authError === null || authError === void 0 ? void 0 : authError.includes('Invalid credentials'))
                ? loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.invalidEmailPassword
                : loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.somethingWrong),
            React.createElement("span", { className: 'text-center font-medium text-alr-grey' }, (authError === null || authError === void 0 ? void 0 : authError.includes('Invalid credentials'))
                ? loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.invalidEmailPasswordDescription
                : loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.defaultError))),
        React.createElement("form", { onSubmit: handleSubmitPassword((data) => onSubmitLogin(data)), className: 'flex flex-col gap-y-5', "data-test": 'login-password-step' },
            React.createElement(InputForm, { control: passwordControl, errors: passwordErrors, name: 'password', placeholder: loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.enterPassword, type: 'password', label: dictionary === null || dictionary === void 0 ? void 0 : dictionary.password, "data-test": 'login-password' }),
            React.createElement(Turnstile, { siteKey: cloudflareKey, options: { theme: 'light', language: locale, retry: 'never' }, onSuccess: (token) => {
                    setCaptchaToken(token);
                    setCaptchaStatus('success');
                }, onError: () => {
                    setCaptchaStatus('error');
                }, onExpire: () => setCaptchaStatus('expired') }),
            React.createElement(Button, { type: 'submit', "data-test": 'login-submit', disabled: verifyEmptyValues(getValuesPassword('password')) ||
                    captchaStatus !== 'success' },
                isLoading && (React.createElement(Spinner, { className: 'mr-3 !h-5 w-full !fill-gray-300' })), loginDictionary === null || loginDictionary === void 0 ? void 0 :
                loginDictionary.login),
            React.createElement("span", { className: 'text-sm font-medium' }, loginDictionary === null || loginDictionary === void 0 ? void 0 :
                loginDictionary.dontHaveAccount,
                React.createElement("div", { className: 'cursor-pointer text-alr-red', onClick: () => {
                        sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'SIGN_UP']);
                    } }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.singUp))))), [
        getValuesPassword(),
        isLoginSubmitDisabled,
        passwordErrors,
        passwordControl,
        isLoading,
    ]);
    const VerifyEmail = useMemo(() => (React.createElement("div", { className: 'pb-10 pt-4' },
        React.createElement(BackButton, { disabled: isLoading, onClick: () => sendAuth('BACK') }),
        React.createElement("div", { className: 'flex w-full flex-col items-center', "data-test": 'login-verify-email-step' },
            React.createElement("span", { className: 'mb-10 mt-[4.5rem] font-poppins text-[1.75rem] font-bold text-alr-grey' }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.verifyEmail),
            React.createElement("span", { className: 'mb-12 w-[23.75rem] text-center font-medium text-alr-grey' }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.verifyEmailDescription),
            React.createElement("div", { className: 'mb-6 flex' },
                React.createElement(InputOTP, { className: 'child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9', value: secureCode2FA, onChange: (value) => setSecure2FACode(value), inputLength: 6, "data-test": 'secure-code', errorMessage: (authError === null || authError === void 0 ? void 0 : authError.includes('wrong'))
                        ? loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.wrongCode
                        : undefined, disabled: isLoading })),
            React.createElement(Button, { "data-test": 'secure-code-submit', onClick: () => onClickSecureCodeSubmit(), className: 'mb-6 w-full', disabled: secureCode2FA.length !== 6 || isLoading },
                isLoading && (React.createElement(Spinner, { className: 'mr-3 !h-5 w-full !fill-gray-300' })), loginDictionary === null || loginDictionary === void 0 ? void 0 :
                loginDictionary.confirmCode),
            React.createElement("span", { onClick: () => resendSecureCode(), className: `${sendEmailCooldown > 0
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer opacity-100 hover:text-alr-red'} text-base font-medium duration-300` }, `${loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.resendCode}${sendEmailCooldown ? ` (${sendEmailCooldown}s)` : ''}`)))), [secureCode2FA, sendEmailCooldown, isLoading, authState]);
    const VerifyHw2FAStep = useMemo(() => (React.createElement("div", null,
        React.createElement(BackButton, { onClick: () => sendAuth('BACK') }),
        (authError === null || authError === void 0 ? void 0 : authError.includes('Failed authenticating with hardware key')) ? (React.createElement("div", { className: 'mt-6 flex w-full flex-col items-center gap-6' },
            React.createElement("img", { alt: 'fingerprint error', src: '/assets/fingerprint-error.svg' }),
            React.createElement("span", { className: 'text-center font-poppins text-[1.3rem] font-bold text-alr-red' }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.cantVerify2fa),
            React.createElement(Button, { className: 'w-full', onClick: () => startHwAuth(0) }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.tryAgain),
            (activeHw2fa === null || activeHw2fa === void 0 ? void 0 : activeHw2fa.length) > 1 && (React.createElement(React.Fragment, null,
                React.createElement("span", null, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.tryHardware),
                React.createElement("div", { className: 'flex cursor-pointer items-center gap-x-1 text-base font-semibold text-alr-red', onClick: () => startHwAuth(1) }, loginDictionary === null || loginDictionary === void 0 ? void 0 :
                    loginDictionary.useAnotherHardware,
                    React.createElement(ArrowRightIcon, { className: 'h-5 w-5' })))),
            activeSw2fa && (React.createElement("div", { className: 'flex cursor-pointer items-center gap-x-1 text-base font-semibold text-alr-red', onClick: () => sendAuth('USE_SOFTWARE_2FA') }, loginDictionary === null || loginDictionary === void 0 ? void 0 :
                loginDictionary.useSw2fa,
                React.createElement(ArrowRightIcon, { className: 'h-5 w-5' }))))) : (React.createElement("div", { className: 'flex w-full flex-col items-center' },
            React.createElement("span", { className: 'mb-10 mt-[3rem] text-center font-poppins text-[1.3rem] font-bold text-alr-grey' }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.touchHardware),
            React.createElement("span", { className: 'mb-10 w-[15rem] text-sm font-normal text-alr-grey' }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.touchHardwareDescription),
            React.createElement("img", { alt: 'usb indicator', src: '/assets/fingerprint.png' }),
            activeSw2fa && (React.createElement("div", { className: 'mt-9 flex cursor-pointer items-center gap-x-1 text-base font-semibold text-alr-red', onClick: () => sendAuth('USE_SOFTWARE_2FA') }, loginDictionary === null || loginDictionary === void 0 ? void 0 :
                loginDictionary.useSw2fa,
                React.createElement(ArrowRightIcon, { className: 'h-5 w-5' }))))))), [isLoading, active2fa]);
    const VerifySw2FAStep = useMemo(() => (React.createElement("div", null,
        React.createElement(BackButton, { onClick: () => sendAuth('BACK') }),
        React.createElement("div", { className: 'flex w-full flex-col items-center' },
            React.createElement("span", { className: 'mb-10 mt-[3rem] text-center font-poppins text-[1.3rem] font-bold text-alr-grey' }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.inform2FACode),
            React.createElement("div", { className: 'mb-6 flex' },
                React.createElement(InputOTP, { className: 'child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9', value: secureCode2FA, onChange: (value) => setSecure2FACode(value), "data-test": 'secure-code-2FA', inputLength: 6, errorMessage: (authError === null || authError === void 0 ? void 0 : authError.includes('Invalid 2FA code'))
                        ? loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.wrongCode
                        : undefined })),
            React.createElement(Button, { "data-test": 'secure-code-2FA-submit', onClick: () => onSubmitSecureCode2FA(), className: 'mb-6 w-full', disabled: secureCode2FA.length !== 6 },
                isLoading && (React.createElement(Spinner, { className: 'mr-3 !h-5 w-full !fill-gray-300' })), loginDictionary === null || loginDictionary === void 0 ? void 0 :
                loginDictionary.confirmCode),
            (active2fa === null || active2fa === void 0 ? void 0 : active2fa.find((item) => item.twoFaTypeId === HARDWARE)) && (React.createElement("div", { className: 'mt-9 flex cursor-pointer items-center gap-x-1 text-base font-semibold text-alr-red', onClick: () => sendAuth('USE_HARDWARE_2FA') }, loginDictionary === null || loginDictionary === void 0 ? void 0 :
                loginDictionary.useHw2fa,
                React.createElement(ArrowRightIcon, { className: 'h-5 w-5' })))))), [secureCode2FA, isLoading, active2fa]);
    const NewDeviceStep = useMemo(() => (React.createElement("div", null,
        React.createElement("div", { className: 'flex w-full flex-col items-center' },
            React.createElement("span", { className: 'mb-5 mt-14 font-poppins text-[1.75rem] font-bold text-alr-grey' }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.newDevice),
            React.createElement("span", { className: 'mb-3 w-[23.75rem] text-center font-medium text-alr-grey' }, loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.verifyEmailDescription),
            React.createElement("span", { className: 'mb-5 font-bold' }, getValuesEmail('email')),
            React.createElement("div", { className: 'mb-5 h-44 w-full' }, (newDeviceInfo === null || newDeviceInfo === void 0 ? void 0 : newDeviceInfo.coordinates) && (React.createElement(Map, { coordinates: newDeviceInfo === null || newDeviceInfo === void 0 ? void 0 : newDeviceInfo.coordinates }))),
            React.createElement("div", { className: 'mb-6 flex' },
                React.createElement(InputOTP, { className: 'child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9', value: secureCodeEmail, onChange: (value) => setSecureCodeEmail(value), "data-test": 'secure-code-email', inputLength: 6, errorMessage: (authError === null || authError === void 0 ? void 0 : authError.includes('Wrong code'))
                        ? loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.wrongCode
                        : undefined })),
            React.createElement(Button, { "data-test": 'secure-code-email-submit', onClick: () => onSubmitSecureCodeEmail(), className: 'mb-6 w-full', disabled: secureCodeEmail.length !== 6 },
                isLoading && (React.createElement(Spinner, { className: 'mr-3 !h-5 w-full !fill-gray-300' })), loginDictionary === null || loginDictionary === void 0 ? void 0 :
                loginDictionary.confirmCode),
            React.createElement("span", { onClick: () => resendSecureCode(), className: `${sendEmailCooldown > 0
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer opacity-100 hover:text-alr-red'} text-base font-medium duration-300` }, `${loginDictionary === null || loginDictionary === void 0 ? void 0 : loginDictionary.resendCode}${sendEmailCooldown ? ` (${sendEmailCooldown}s)` : ''}`)))), [secureCodeEmail, sendEmailCooldown, isLoading, newDeviceInfo]);
    return (React.createElement("div", { className: 'flex h-full min-h-screen w-full flex-col items-center justify-center gap-y-2 sm:gap-y-7', "data-test": 'login-page' },
        forgeId ? (React.createElement("div", { className: 'flex flex-col' },
            React.createElement("span", { className: 'text-center font-poppins text-2xl font-black text-alr-grey' }, "Tardezinha com Thiaguinho"),
            React.createElement("div", { className: 'flex w-full flex-row items-center justify-center gap-2' },
                React.createElement("span", { className: 'font-inter text-sm font-medium text-gray-900' }, dictionary === null || dictionary === void 0 ? void 0 : dictionary.auth.poweredBy),
                React.createElement("img", { src: '/assets/alore-logo-black.svg', alt: 'alore logo', width: '60' })))) : (React.createElement("img", { src: '/assets/alore-logo-black.svg', alt: 'alore logo', width: authState.matches('active.login.newDevice') ? 153 : 201 })),
        React.createElement(Card, { className: `flex min-w-[20rem] md:w-96 ${isLoading ? 'pointer-events-none opacity-50' : ''} mx-5 py-2 md:mx-7 md:child:!px-9` },
            forgeId && authState.matches('active.web3Connector') && 'TODO',
            (authState.matches('active.login.idle') ||
                authState.matches('active.login.googleLogin') ||
                authState.matches('active.login.retrievingSalt')) &&
                EmailInputStep,
            (authState.matches('active.login.inputPassword') ||
                authState.matches('active.login.verifyingGoogleLogin') ||
                authState.matches('active.login.verifyingLogin')) &&
                PasswordInputStep,
            (authState.matches('active.login.email2fa') ||
                authState.matches('active.login.resendingEmailCode') ||
                authState.matches('active.login.verifyingEmail2fa')) &&
                VerifyEmail,
            (authState.matches('active.login.hardware2fa') ||
                authState.matches('active.login.verifyingHwAuth')) &&
                VerifyHw2FAStep,
            (authState.matches('active.login.software2fa') ||
                authState.matches('active.login.verifying2faCode')) &&
                VerifySw2FAStep,
            (authState.matches('active.login.newDevice') ||
                authState.matches('active.login.verifyingCode') ||
                authState.matches('active.login.resendingConfirmationEmail')) &&
                NewDeviceStep,
            authState.matches('active.login.successfulLogin') && (React.createElement("div", { className: 'flex flex-row gap-2 justify-center items-center' },
                React.createElement("span", null, "Login complete for"),
                React.createElement("span", { className: 'font-semibold' }, sessionUser === null || sessionUser === void 0 ? void 0 : sessionUser.nickname))))));
};
