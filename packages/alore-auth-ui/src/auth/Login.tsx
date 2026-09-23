'use client';

/* eslint-disable @next/next/no-img-element */
import type { SocialProvider } from '@alore/auth-react-sdk';
import { useMsal } from '@azure/msal-react';
import { ArrowRightIcon, EnvelopeIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/20/solid';
import { LockOpenIcon } from '@heroicons/react/24/outline';
import { yupResolver } from '@hookform/resolvers/yup';
import { GoogleLogin } from '@react-oauth/google';
import { useActor } from '@xstate/react';
import { Button, Card, Spinner } from 'flowbite-react';
import { Locale } from 'get-dictionary';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldValues, useForm, useWatch } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';
import * as yup from 'yup';

import { NewDeviceInfo, verifyEmptyValues } from '../helpers';
import useDictionary from '../hooks/useDictionary';
import { AuthInstance } from '../machine/types';
import {
  aloreLogoBlack,
  authErrorImage,
  fingerprint,
  fingerprintError,
  metamaskLogo,
  microsoftLogo,
  walletConnectLogo,
} from '../utils';
import { buildWalletExtensions, resolveWalletSecret } from '../utils/passkeyExtensions';

/* eslint-disable @next/next/no-img-element */

const InputForm = React.lazy(() => import('../components/InputForm'));
const InputOTP = React.lazy(() => import('../components/InputOTP'));
const BackButton = React.lazy(() => import('../components/BackButton'));
const LinkButton = React.lazy(() => import('../components/LinkButton'));

const envelopIcon = () => <EnvelopeIcon className="size-4 text-gray-500" />;
const lockClosedIcon = () => <LockClosedIcon className="size-4 text-gray-500" />;

const HARDWARE = 1;
const SOFTWARE = 2;

const ABORT_CONDITIONAL_UI = 'abort-conditional-ui';

export interface LoginProps {
  locale?: Locale;
  authServiceInstance: AuthInstance;
  forgeId?: string;
  logoImage?: React.ReactNode;
  keyshareWorker?: Worker | null;
  cryptoUtils: {
    hashUserInfo: (_userInfo: string) => string;
    generateSecureHash: (
      _data: string,
      _salt: string,
      _keyDerivationFunction: 'argon2d' | 'pbkdf2',
    ) => Promise<string>;
  };
  // Custom styling props
  customStyles?: {
    borderRadius?: string;
    borderWidth?: string;
    borderColor?: string;
    backgroundColor?: string;
    padding?: string;
    boxShadow?: string;
  };
  // Content customization props
  title?: string;
  titleClassName?: string;
  loginTitle?: string;
  loginTitleClassName?: string;
  emailInputLabel?: string;
  inputClassName?: string;
  contentAlignment?: 'left' | 'center' | 'right';
  // Custom CSS class name for the Card component
  customClassName?: string;
  // Custom spacing between title/logo and card content
  titleSpacing?: string;
  // Custom className for logo container
  logoContainerClassName?: string;
}

// Google's button is rendered by GSI and cannot be restyled, so the Microsoft
// one copies its typography exactly — same stack, size, weight and tracking —
// rather than inheriting the host app's font and reading as a different
// control. Measured off the rendered GSI button.
const GOOGLE_BUTTON_TYPOGRAPHY = {
  fontFamily: '"Google Sans", arial, sans-serif',
  fontSize: '14px',
  fontWeight: 400,
  letterSpacing: '0.25px',
} as const;

const Login = ({
  locale = 'pt',
  authServiceInstance,
  forgeId,
  logoImage,
  keyshareWorker,
  cryptoUtils,
  customStyles,
  title,
  titleClassName,
  loginTitle,
  loginTitleClassName,
  emailInputLabel,
  inputClassName,
  contentAlignment = 'center',
  customClassName,
  titleSpacing = 'gap-y-2 sm:gap-y-7',
  logoContainerClassName,
}: LoginProps) => {
  const { hashUserInfo, generateSecureHash } = cryptoUtils;
  const dictionary = useDictionary(locale);
  const loginDictionary = dictionary?.auth.login;

  const [secureCode2FA, setSecure2FACode] = useState('');
  const [secureCodeEmail, setSecureCodeEmail] = useState('');
  const [socialEmailCode, setSocialEmailCode] = useState('');
  // Google's button is rendered by GSI, which ignores a percentage width — it
  // only accepts a pixel number, and falls back to its own default otherwise
  // (the "Provided button width is invalid: 100%" warning). Measuring the row
  // is the only way the two providers can be the same width.
  const [socialButtonWidth, setSocialButtonWidth] = useState(0);
  // Callback ref, not useEffect+useRef: the row is inside a memoized subtree
  // that remounts (e.g. when an error block appears), and an effect keyed on
  // anything else keeps observing the old, detached node — leaving GSI rendered
  // at a stale width. A zero measurement is ignored rather than clamped up to
  // the 200px floor, which is what produced a short Google button next to a
  // full-width Microsoft one.
  const socialRowObserver = useRef<ResizeObserver>();
  const socialRowRef = useCallback((node: HTMLDivElement | null) => {
    socialRowObserver.current?.disconnect();
    if (!node) return;

    const measure = () => {
      const width = Math.round(node.clientWidth);
      if (width > 0) setSocialButtonWidth(Math.max(200, Math.min(400, width)));
    };

    measure();
    if (typeof ResizeObserver !== 'undefined') {
      socialRowObserver.current = new ResizeObserver(measure);
      socialRowObserver.current.observe(node);
    }
  }, []);

  const [authState, sendAuth] = useActor(authServiceInstance);
  const {
    salt,
    error: errorObj,
    active2fa,
    registerUser,
    RCRPublicKey,
    authProviderConfigs,
    credentialEmail,
    socialChallenge,
  } = authState.context;

  // Single UI-facing error message derived from the error object
  const displayError = errorObj?.message || '';
  const hasDisplayError = !!displayError;
  // Failures whose copy already tells the user what happened and what to do.
  const isExplainedError = ['SOCIAL_EMAIL_MISSING', 'EMAIL_NOT_ALLOWED'].includes(displayError);

  const {
    enablePasskeys,
    requireEmailVerification,
    enablePasswords,
    socialProviders,
    enableWalletCreation,
  } = authProviderConfigs || {};

  const [currentDevice, setCurrentDevice] = useState('');
  const [loading, setLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [sendEmailCooldown, setSendEmailCooldown] = useState(0);
  const [cooldownMultiplier, setCooldownMultiplier] = useState(1);
  const [newDeviceInfo] = useState<NewDeviceInfo>();
  const [loginMethod, setLoginMethod] = useState<'password' | 'passkey'>('password');
  const [isConditionalMediationAvailable, setIsConditionalMediationAvailable] = useState(false);
  const [authAbortController, setAuthAbortController] = useState<AbortController | undefined>(
    undefined,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const { instance } = useMsal();

  const onlyPasskeyLogin = useMemo(() => {
    return enablePasskeys && !enablePasswords;
  }, [enablePasskeys, enablePasswords]);

  const microsoftLogin = () => {
    instance
      // The OIDC scopes, not Graph's user.read: `email` is what puts an email
      // claim in the id_token, and the backend has nothing to send a code to
      // without it. Nothing here calls Graph, so user.read only bought a
      // consent prompt.
      .loginPopup({
        scopes: ['openid', 'profile', 'email'],
      })
      .then((response) => {
        resetEmail();
        sendAuth({
          type: 'SOCIAL_LOGIN',
          payload: {
            idToken: response.idToken,
            providerName: 'microsoft',
          },
        });
      })
      .catch((error) => {
        console.error('Login failed:', error);
      });
  };

  const handleMicrosoftLogin = () => microsoftLogin();

  // Answering the emailed-code challenge: the SAME id_token goes back with the
  // session and the code. The backend re-verifies it and requires the session's
  // address and identity to match it, so nothing else can be substituted here.
  const onSubmitSocialEmailCode = () => {
    if (!socialChallenge) return;

    sendAuth({
      type: 'SOCIAL_LOGIN',
      payload: {
        idToken: socialChallenge.idToken,
        providerName: socialChallenge.providerName,
        ...(socialChallenge.device ? { device: socialChallenge.device } : {}),
        sessionId: socialChallenge.sessionId,
        emailCode: socialEmailCode,
      },
    });

    setSocialEmailCode('');
  };

  const handleGoogleCredential = (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;

    resetEmail();
    sendAuth({
      type: 'SOCIAL_LOGIN',
      payload: {
        idToken: credentialResponse.credential,
        providerName: 'google',
      },
    });
  };

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const hasPasskeySupportWithPRFOrLargeBlob = () => {
    if (
      window.PublicKeyCredential &&
      // eslint-disable-next-line no-undef
      PublicKeyCredential.isConditionalMediationAvailable
    ) {
      Promise.all([
        // eslint-disable-next-line no-undef
        PublicKeyCredential.isConditionalMediationAvailable(),
      ]).then(([isConditionalMediationAvailableCheck]) => {
        setIsConditionalMediationAvailable(isConditionalMediationAvailableCheck);
      });
    }
  };

  const selectLoginMethod = () => {
    const email = getValuesEmail('email');

    if (loginMethod === 'password') {
      sendAuth({ type: 'SELECT_PASSWORD', payload: { email } });
    } else {
      sendAuth({
        type: 'START_PASSKEY_LOGIN',
        payload: {
          email,
        },
      });
    }
  };

  const cancelConditionalCredentialRequest = () => {
    authAbortController?.abort(ABORT_CONDITIONAL_UI);
    setAuthAbortController(undefined);
  };

  // eslint-disable-next-line no-undef
  const sendSignedCredential = async (credential: PublicKeyCredential) => {
    const extensionResults = credential.getClientExtensionResults();

    // JOO-1792: with wallets disabled no secret is required (none was requested);
    // with wallets enabled the previous PRF/largeBlob/Safari semantics are preserved.
    const { supported: walletSecretSupported, secret: secretFromCredential } = resolveWalletSecret(
      !!enableWalletCreation,
      extensionResults,
      {
        isSafari,
      },
    );

    if (!walletSecretSupported) {
      sendAuth({
        type: 'PASSKEY_NOT_SUPPORTED',
        payload: { error: loginDictionary?.passkeyNotSupported! },
      });

      return;
    }

    sendAuth({
      type: 'FINISH_PASSKEY_LOGIN',
      payload: {
        passkeyAuth: {
          id: credential.id,
          rawId: Buffer.from(credential.rawId).toString('base64'),
          response: {
            authenticatorData: Buffer.from(
              // eslint-disable-next-line no-undef
              (credential.response as AuthenticatorAssertionResponse).authenticatorData,
            ).toString('base64'),
            clientDataJSON: Buffer.from(credential.response.clientDataJSON).toString('base64'),
            signature: Buffer.from(
              // eslint-disable-next-line no-undef
              (credential.response as AuthenticatorAssertionResponse).signature,
            ).toString('base64'),
            userHandle: Buffer.from(
              // @ts-ignore
              credential.response.userHandle || [0],
            ).toString('base64'),
          },
          type: 'public-key',
        },
      },
    });

    if (keyshareWorker && secretFromCredential) {
      keyshareWorker.postMessage({
        method: 'derive-password',
        payload: {
          password: new TextDecoder().decode(secretFromCredential),
          email: credential.id,
        },
      });
    }
  };

  const finishPasskeyAuth = async () => {
    if (!RCRPublicKey || !navigator?.credentials) {
      sendAuth('BACK');
      return;
    }

    cancelConditionalCredentialRequest();

    const { publicKey } = RCRPublicKey;

    const extensions = buildWalletExtensions('login', !!enableWalletCreation);

    // eslint-disable-next-line no-undef
    const credentialOptions: CredentialRequestOptions = {
      publicKey: {
        ...publicKey,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allowCredentials: publicKey.allowCredentials?.map((cred: any) => ({
          ...cred,
          id: Buffer.from(cred.id, 'base64'),
        })),
        timeout: 10000,
        // @ts-ignore
        challenge: Buffer.from(publicKey.challenge, 'base64'),
        rpId: publicKey.rpId,
        // @ts-ignore
        extensions: {
          ...publicKey.extensions,
          // @ts-ignore
          ...extensions,
        },
      },
    };

    try {
      if (
        authState.matches('active.login.signingCredentialRCR') ||
        authState.matches('active.login.idle.signWithPasskey') ||
        authState.matches('active.login.idle.authScreen')
      ) {
        const cred = await navigator.credentials.get(credentialOptions);

        // eslint-disable-next-line no-undef
        const credential = cred as PublicKeyCredential;
        sendSignedCredential(credential);
      }

      if (
        isConditionalMediationAvailable &&
        authState.matches('active.login.idle.localPasskeySign')
      ) {
        const abortController = new AbortController();

        setAuthAbortController(abortController);
        const cred = await navigator.credentials.get({
          ...credentialOptions,
          mediation: 'conditional',
          signal: abortController.signal,
        });
        // eslint-disable-next-line no-undef
        const credential = cred as PublicKeyCredential;
        sendSignedCredential(credential);
        abortController?.abort();
        setAuthAbortController(undefined);
      }
    } catch (error) {
      if (error !== ABORT_CONDITIONAL_UI) {
        authAbortController?.abort();
        setAuthAbortController(undefined);
        sendAuth('BACK');
      }
    }
  };

  useEffect(() => {
    cancelConditionalCredentialRequest();
  }, [authState.matches('active.login.loginMethodSelection')]);

  useEffect(() => {
    if (
      authState.matches('active.login.idle.localPasskeySign') ||
      authState.matches('active.login.idle.signWithPasskey') ||
      authState.matches('active.login.signingCredentialRCR')
    ) {
      finishPasskeyAuth();
    }
  }, [
    authState.matches('active.login.idle.localPasskeySign'),
    authState.matches('active.login.idle.signWithPasskey'),
    authState.matches('active.login.signingCredentialRCR'),
  ]);

  const handlePasskeyButton = async () => {
    sendAuth('START_PASSKEY_LOGIN');
  };

  const isLoading = useMemo(
    () =>
      loading ||
      authState.matches('active.login.retrievingSalt') ||
      authState.matches('active.login.verifyingLogin') ||
      authState.matches('active.login.verifyingHwAuth') ||
      authState.matches('active.login.verifying2faCode') ||
      authState.matches('active.login.verifyingCode') ||
      authState.matches('active.login.verifyingEmail2fa') ||
      authState.matches('active.login.resendingEmailCode') ||
      authState.matches('active.login.googleLogin') ||
      authState.matches('active.login.socialLogin') ||
      authState.matches('active.login.verifyingGoogleLogin') ||
      authState.matches('active.login.verifyingRegisterPublicKeyCredential') ||
      authState.matches('active.login.retrievingCredentialRCR') ||
      authState.matches('active.login.signingCredentialRCR') ||
      authState.matches('active.login.resendingConfirmationEmail') ||
      authState.matches('active.web3Connector.verifyingClaimNftEmail2fa') ||
      authState.matches('active.web3Connector.verifyingEmailEligibility'),
    [authState.value],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleMethodSelectionEnter = (event: KeyboardEvent) => {
      if (
        event.key === 'Enter' &&
        authState.matches('active.login.loginMethodSelection') &&
        !isLoading
      ) {
        event.preventDefault();
        selectLoginMethod();
      }
    };

    window.addEventListener('keydown', handleMethodSelectionEnter);

    return () => {
      window.removeEventListener('keydown', handleMethodSelectionEnter);
    };
  }, [authState.value, isLoading, selectLoginMethod]);

  const canGoBack = useMemo(
    () =>
      authState.matches('active.login.loginMethodSelection') ||
      authState.matches('active.login.inputPassword') ||
      authState.matches('active.login.email2fa') ||
      authState.matches('active.login.hardware2fa') ||
      authState.matches('active.login.software2fa'),
    [authState.value],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && canGoBack && !isLoading) {
        event.preventDefault();
        sendAuth('BACK');
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [canGoBack, isLoading, sendAuth]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      hasPasskeySupportWithPRFOrLargeBlob();
    }

    return () => {
      cancelConditionalCredentialRequest();
    };
  }, []);

  const emailFormSchema = yup
    .object({
      email: yup
        .string()
        .required(dictionary?.formValidation.required)
        .email(dictionary?.formValidation.invalidEmail),
    })
    .required();

  const passwordFormSchema = yup
    .object({
      password: yup
        .string()
        .required(dictionary?.formValidation.required)
        .min(8, dictionary?.formValidation.passwordMinimum),
    })
    .required();

  const activeHw2fa = useMemo(
    () => active2fa?.filter((item) => item.twoFaTypeId === HARDWARE) || [],
    [active2fa],
  );
  const activeSw2fa = useMemo(
    () => active2fa?.find((item) => item.twoFaTypeId === SOFTWARE),
    [active2fa],
  );

  const emailDefaultValues: FieldValues = {
    email: '',
  };

  const {
    control: emailControl,
    formState: { errors: emailErrors, dirtyFields: emailDirtyFields },
    handleSubmit: handleSubmitEmail,
    getValues: getValuesEmail,
    reset: resetEmail,
  } = useForm({
    resolver: yupResolver(emailFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: emailDefaultValues,
  });
  useWatch({ control: emailControl, name: ['email'] });

  const passwordDefaultValues: FieldValues = {
    password: '',
  };

  const {
    control: passwordControl,
    formState: { errors: passwordErrors, dirtyFields: passwordDirtyFields },
    handleSubmit: handleSubmitPassword,
    getValues: getValuesPassword,
  } = useForm({
    resolver: yupResolver(passwordFormSchema),
    defaultValues: passwordDefaultValues,
  });
  useWatch({ control: passwordControl, name: ['password'] });

  useEffect(() => {
    if (registerUser) {
      if (forgeId) {
        sendAuth(['RESET', { type: 'INITIALIZE', forgeId }]);
      } else {
        sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'LOGIN']);
      }
    }
  }, [registerUser]);

  useEffect(() => {
    if (secureCode2FA.length === 6) {
      if (authState.matches('active.login.email2fa')) {
        onClickSecureCodeSubmit();
      } else {
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
    if (socialEmailCode.length === 6) {
      onSubmitSocialEmailCode();
    }
  }, [socialEmailCode]);

  useEffect(() => {
    if (sendEmailCooldown <= 0) {
      clearInterval(intervalRef.current);
    }
  }, [sendEmailCooldown]);

  useEffect(() => {
    if (authState.matches('active.login.newDevice')) {
      // getNewDeviceInfo(); // TODO
    }

    if (
      authState.matches('active.login.hardware2fa') &&
      authState.history?.matches('active.login.verifyingLogin')
    ) {
      startHwAuth(0);
    }
  }, [authState.value]);

  const startHwAuth = async (index: number) => {
    setLoading(true);
    const { email } = getValuesEmail();
    const { password } = getValuesPassword();
    if (salt && active2fa) {
      const secureHashArgon2d = await generateSecureHash(password, salt, 'argon2d');
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
  };

  const onSubmitEmail = async (data: typeof emailDefaultValues) => {
    setLoading(true);

    const { email } = data;

    sendAuth({ type: 'SELECT_PASSWORD_METHOD', payload: { email } });
    setLoading(false);
  };

  const derivePasswordAndGetKeyshares = async (password: string, email: string) => {
    if (keyshareWorker) {
      keyshareWorker.postMessage({
        method: 'derive-password',
        payload: { password, email },
      });
    }
  };

  const onSubmitLogin = async (data: typeof passwordDefaultValues) => {
    setLoading(true);
    const { password } = data;
    const email = getValuesEmail('email') || credentialEmail;

    if (salt && email) {
      derivePasswordAndGetKeyshares(password, email);
      const secureHashArgon2d = await generateSecureHash(password, salt, 'argon2d');

      if (typeof window !== 'undefined') {
        let device = window.localStorage.getItem('currentDeviceSecret');
        if (!device) {
          const { userAgent } = window.navigator;
          device = hashUserInfo(userAgent);
        }
        setCurrentDevice(device);

        sendAuth({
          type: 'VERIFY_LOGIN',
          payload: {
            email,
            device,
            passwordHash: secureHashArgon2d,
            isForgeClaim: !!forgeId,
            locale,
          },
        });
      }
    }
    setLoading(false);
  };

  const onSubmitSecureCode2FA = async () => {
    setLoading(true);
    const { email } = getValuesEmail();
    const { password } = getValuesPassword();
    if (salt) {
      derivePasswordAndGetKeyshares(password, email);
      const secureHashArgon2d = await generateSecureHash(password, salt, 'argon2d');

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
  };

  const onClickSecureCodeSubmit = async () => {
    setLoading(true);
    const { password } = getValuesPassword();
    const { email } = getValuesEmail();

    if (salt) {
      derivePasswordAndGetKeyshares(password, email);
      const secureHashArgon2d = await generateSecureHash(password, salt, 'argon2d');

      if (typeof window !== 'undefined') {
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
            device,
            trustThisDevice: trustDevice,
          },
        });
      }
    }

    setLoading(false);
    setSecure2FACode('');
  };

  const resendSecureCode = async () => {
    setLoading(true);
    const { email } = getValuesEmail();
    const { password } = getValuesPassword();
    if (salt) {
      derivePasswordAndGetKeyshares(password, email);
      const secureHashArgon2d = await generateSecureHash(password, salt, 'argon2d');
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
  };

  const onSubmitSecureCodeEmail = async () => {
    setLoading(true);
    const { email } = getValuesEmail();
    const { password } = getValuesPassword();
    if (salt) {
      derivePasswordAndGetKeyshares(password, email);
      const secureHashArgon2d = await generateSecureHash(password, salt, 'argon2d');
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
  };

  const isLoginSubmitDisabled = useMemo(
    () => verifyEmptyValues({ ...getValuesEmail(), ...getValuesPassword() }),
    [
      { ...getValuesEmail(), ...getValuesPassword() },
      { ...emailDirtyFields, ...passwordDirtyFields },
    ],
  );

  const otpError = useMemo(() => {
    const lower = displayError.toLowerCase?.();
    let errorMessage = '';

    if (lower?.includes('wrong')) {
      errorMessage = `${loginDictionary?.wrongCode}`;
    } else if (lower?.includes('expired')) {
      errorMessage = `${loginDictionary?.codeExpired}`;
    }

    return errorMessage;
  }, [displayError]);

  const getAuthError = () => {
    let authErrorTitle = loginDictionary?.somethingWrong;
    let authErrorDescription = loginDictionary?.defaultError;

    const lower = displayError.toLowerCase?.();
    const errData = errorObj?.data;
    const serverPayload = errData?.data || errData;
    const serverMessage = serverPayload?.message?.toLowerCase?.();

    if (displayError === 'EMAIL_NOT_ALLOWED' || serverMessage === 'EMAIL_NOT_ALLOWED') {
      authErrorTitle = dictionary?.auth?.emailDomainNotAllowed;
      return { authErrorTitle, authErrorDescription };
    }
    // Nothing the user can do on this screen fixes it — the provider sent no
    // address — so it gets its own copy instead of the generic failure.
    if (displayError === 'SOCIAL_EMAIL_MISSING' || serverMessage === 'social_email_missing') {
      authErrorTitle = dictionary?.auth?.socialEmailMissing;
      authErrorDescription = dictionary?.auth?.socialEmailMissingDescription;
      return { authErrorTitle, authErrorDescription };
    }
    if (displayError === 'INVALID_CREDENTIALS' || serverMessage === 'INVALID_CREDENTIALS') {
      authErrorTitle = loginDictionary?.invalidEmailPassword;
      authErrorDescription = loginDictionary?.invalidEmailPasswordDescription;
    } else if (lower?.includes('no passkey found')) {
      authErrorTitle = loginDictionary?.noPasskey;
      authErrorDescription = loginDictionary?.noPasskeyDescription;
    } else if (lower?.includes('passkey')) {
      authErrorTitle = loginDictionary?.passkeyNotSupported;
      authErrorDescription = loginDictionary?.passkeyNotSupportedDescription;
    }

    return { authErrorTitle, authErrorDescription };
  };

  // Get alignment classes based on contentAlignment prop
  const getAlignmentClasses = useMemo(() => {
    const alignmentMap = {
      left: 'items-start text-left',
      center: 'items-center text-center',
      right: 'items-end text-right',
    };
    return alignmentMap[contentAlignment];
  }, [contentAlignment]);

  // Get text alignment class only
  const getTextAlignment = useMemo(() => {
    const alignmentMap = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };
    return alignmentMap[contentAlignment];
  }, [contentAlignment]);

  // Get flex items alignment class only
  const getItemsAlignment = useMemo(() => {
    const alignmentMap = {
      left: 'items-start',
      center: 'items-center',
      right: 'items-end',
    };
    return alignmentMap[contentAlignment];
  }, [contentAlignment]);

  const IdleStep = useMemo(() => {
    const { authErrorTitle, authErrorDescription } = getAuthError();
    return (
      <div data-testid="login-email-step">
        {hasDisplayError ? (
          // Compact on purpose: this block sits ABOVE the form it interrupts,
          // so every pixel it takes pushes the sign-in controls further down —
          // on a short window that is what drove the card past its container.
          <div className="flex flex-col items-center justify-center gap-3 pb-7 pt-2">
            <img
              src={authErrorImage}
              alt=""
              width={48}
            />
            {displayError?.includes('beta') ? (
              <span className="font-poppins text-alr-red text-center text-base font-bold">
                {displayError}
              </span>
            ) : (
              <>
                <span className="font-poppins text-alr-red text-center text-base font-bold">
                  {authErrorTitle}
                </span>
                <span className="text-alr-grey text-center text-sm font-medium leading-snug">
                  {authErrorDescription}
                </span>
                {errorObj?.code && !isExplainedError && (
                  <span className="mt-1 text-center text-xs text-gray-500">{`${loginDictionary?.errorCode} ${errorObj.code}`}</span>
                )}
              </>
            )}
          </div>
        ) : (
          <h1
            className={
              loginTitleClassName ||
              `font-inter text-xl font-bold text-gray-700 ${getTextAlignment}`
            }
          >
            {loginTitle || (forgeId ? loginDictionary?.forgeLogin : loginDictionary?.loginAccount)}
          </h1>
        )}
        <div className="mt-4 flex flex-col gap-y-5">
          {!onlyPasskeyLogin && requireEmailVerification && (
            <form
              className="flex flex-col gap-y-5"
              onSubmit={handleSubmitEmail((data) => onSubmitEmail(data))}
            >
              <InputForm
                inputClassName={inputClassName}
                control={emailControl}
                errors={emailErrors}
                name="email"
                type="text"
                placeholder={emailInputLabel || loginDictionary?.enterEmail}
                data-testid="login-email-input"
                icon={envelopIcon}
                autoComplete={
                  authAbortController && isConditionalMediationAvailable
                    ? 'username webauthn'
                    : undefined
                }
                autoFocus
              />

              <LinkButton
                data-testid="forgot-password-link"
                onClick={() => sendAuth('FORGOT_PASSWORD')}
                className="text-xs"
              >
                {loginDictionary?.forgotPassword}
              </LinkButton>
              <Button
                type="submit"
                data-testid="login-button"
                disabled={verifyEmptyValues(getValuesEmail('email'))}
              >
                {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
                {onlyPasskeyLogin ? loginDictionary?.passkeyLogin : loginDictionary?.login}
              </Button>
            </form>
          )}
          {onlyPasskeyLogin && (
            <Button onClick={handlePasskeyButton}>
              <div className="flex flex-row items-center justify-center gap-2">
                <KeyIcon className="size-4 text-white" />
                <span className="font-semibold text-white">{loginDictionary?.passkeyLogin}</span>
              </div>
            </Button>
          )}
          <div className="h-[0.5px] w-full bg-gray-300" />
          {socialProviders?.length && (
            <>
              <div
                ref={socialRowRef}
                className="flex w-full flex-col gap-3"
              >
                {socialProviders.map((provider: SocialProvider) => {
                  if (provider.providerName === 'google') {
                    return (
                      // Google's own button, because the credential it returns IS
                      // the id_token. The custom button below cannot produce one:
                      // useGoogleLogin yields an access_token, whose audience the
                      // backend has no way to verify. Styling is limited to what
                      // Google exposes here.
                      <div
                        key={provider.id}
                        className="w-full"
                        data-testid="login-social-google-button"
                      >
                        <GoogleLogin
                          // GSI renders the button once and ignores a later width
                          // change, so the measurement has to remount it — otherwise it
                          // keeps its 209px default and sits narrower than Microsoft's.
                          key={socialButtonWidth}
                          onSuccess={handleGoogleCredential}
                          onError={() => console.error('Google sign-in failed')}
                          shape="rectangular"
                          size="large"
                          width={socialButtonWidth || undefined}
                          text="continue_with"
                          locale={locale}
                        />
                      </div>
                    );
                  }

                  if (provider.providerName === 'microsoft') {
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        data-testid="login-social-microsoft-button"
                        onClick={handleMicrosoftLogin}
                        className="flex h-10 w-full items-center rounded border border-[#dadce0] bg-white px-3 text-sm font-normal text-[#3c4043] transition-colors hover:border-[#d2e3fc] hover:bg-[rgba(66,133,244,0.08)] focus:bg-[rgba(66,133,244,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--primary-color] active:bg-[rgba(66,133,244,0.1)]"
                        style={GOOGLE_BUTTON_TYPOGRAPHY}
                      >
                        <img
                          src={microsoftLogo}
                          alt=""
                          width={18}
                          height={18}
                        />
                        <span className="flex-1 text-center">
                          {dictionary?.auth.continueMicrosoft}
                        </span>
                      </button>
                    );
                  }

                  // A provider this build has no button for. Rendering the
                  // Microsoft one for it, as this used to, signs the user into
                  // the wrong provider.
                  return null;
                })}
              </div>
              <div className="h-[0.5px] w-full bg-gray-300" />
            </>
          )}
          {forgeId && (
            <Button
              color="light"
              onClick={() => sendAuth('LOGIN_WITH_WEB3CONNECTOR')}
              outline
            >
              <div className="flex flex-row items-center justify-center gap-2">
                <div className="relative flex flex-row">
                  <img
                    src={metamaskLogo}
                    alt="metamask logo"
                    width={20}
                    className="absolute right-3"
                  />
                  <img
                    src={walletConnectLogo}
                    alt="walletconnect logo"
                    width={20}
                  />
                </div>
                {loginDictionary?.metamaskWalletConnect}
              </div>
            </Button>
          )}
          {/* Deliberately centred and stacked, independent of `contentAlignment`:
              the sign-up prompt is the one element the design centres under the
              card regardless of how the rest of the form is aligned. */}
          <div className="flex flex-col items-center gap-0.5 text-center text-sm font-medium">
            <span>{loginDictionary?.dontHaveAccount}</span>
            <LinkButton
              data-testid="sign-up-button"
              className="text-sm"
              onClick={() => {
                sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'SIGN_UP']);
              }}
            >
              {loginDictionary?.signUp}
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }, [
    getValuesEmail,
    emailErrors,
    emailControl,
    isLoading,
    displayError,
    loginTitleClassName,
    loginTitle,
    inputClassName,
    emailInputLabel,
    forgeId,
    loginDictionary,
    authAbortController,
    isConditionalMediationAvailable,
    sendAuth,
    socialProviders,
    // Without this the memo keeps the subtree from the first render, when the
    // row had not been measured yet, and Google's button stays at its default
    // width while Microsoft's fills the card.
    socialButtonWidth,
    dictionary,
    handleSubmitEmail,
    onSubmitEmail,
    handlePasskeyButton,
    handleGoogleCredential,
    handleMicrosoftLogin,
    onlyPasskeyLogin,
    requireEmailVerification,
    errorObj,
    hasDisplayError,
    getTextAlignment,
  ]);

  const SelectLoginMethod = useMemo(() => {
    const { authErrorTitle, authErrorDescription } = getAuthError();

    return (
      <div>
        <BackButton
          disabled={isLoading}
          onClick={() => sendAuth('BACK')}
        >
          {dictionary?.back}
        </BackButton>
        {hasDisplayError ? (
          <div className={`my-3 flex flex-col gap-1.5 ${getAlignmentClasses}`}>
            <span className={`font-poppins text-alr-red text-base font-bold ${getTextAlignment}`}>
              {authErrorTitle}
            </span>
            <span className={`text-alr-grey text-sm font-medium leading-snug ${getTextAlignment}`}>
              {authErrorDescription}
            </span>
            {/* The raw code is only useful when the message above is the generic
                one. For an explained failure it contradicts it — the transport
                wrapper reports FAILED_TO_FETCH while the real reason is stated
                in the sentence the user just read. */}
            {errorObj?.code && !isExplainedError && (
              <span
                className={`text-xs text-gray-500 ${getTextAlignment}`}
              >{`${loginDictionary?.errorCode} ${errorObj.code}`}</span>
            )}
          </div>
        ) : undefined}
        <div
          className={`mt-4 flex w-full flex-col ${getAlignmentClasses}`}
          data-testid="login-method-selection-step"
        >
          {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
          <span
            className={`font-poppins text-alr-grey mb-6 text-2xl font-bold md:text-[1.75rem] ${getTextAlignment}`}
          >
            {loginDictionary?.selectMethodTitle}
          </span>
          <span className={`text-alr-grey mb-6 w-full font-medium ${getTextAlignment}`}>
            {loginDictionary?.selectMethodDescription}
          </span>
          <div className="flex flex-col gap-5">
            <div className="flex w-full gap-2">
              <Button
                data-testid="login-method-selection-password"
                onClick={() => setLoginMethod('password')}
                color="light"
                className={`${
                  loginMethod === 'password' ? '!border-[--primary-color]' : '!border-gray-300'
                } child:h-full !h-fit w-full cursor-pointer ${getItemsAlignment} rounded-lg border-2 p-4 duration-300 focus:ring-0`}
              >
                <div className={`flex flex-col justify-center gap-2 ${getItemsAlignment}`}>
                  <LockOpenIcon
                    className={`${
                      loginMethod === 'password' ? 'text-[--primary-color]' : 'text-gray-500'
                    } size-7 duration-300`}
                  />
                  <span className="font-semibold text-gray-900">{loginDictionary?.password}</span>
                  <span className={`text-xs font-normal text-gray-600 ${getTextAlignment}`}>
                    {loginDictionary?.selectMethodPassword}
                  </span>
                </div>
              </Button>
              <Button
                data-testid="login-method-selection-passkey"
                onClick={() => setLoginMethod('passkey')}
                color="light"
                className={`${
                  loginMethod === 'passkey' ? '!border-[--primary-color]' : '!border-gray-300'
                } child:h-full !h-fit w-full cursor-pointer ${getItemsAlignment} rounded-lg border-2 p-4 duration-300 focus:ring-0`}
              >
                <div className={`flex flex-col justify-center gap-2 ${getItemsAlignment}`}>
                  <KeyIcon
                    className={`${
                      loginMethod === 'passkey' ? 'text-[--primary-color]' : 'text-gray-500'
                    } size-7 duration-300`}
                  />
                  <span className="font-semibold text-gray-900">{loginDictionary?.passkey}</span>
                  <span className={`text-xs font-normal text-gray-600 ${getTextAlignment}`}>
                    {loginDictionary?.selectMethodPasskey}
                  </span>
                </div>
              </Button>
            </div>
            <Button
              data-testid="login-method-selection-submit"
              onClick={() => selectLoginMethod()}
              className="mb-6 flex w-full"
            >
              {loginDictionary?.continue}
            </Button>
          </div>
        </div>
      </div>
    );
  }, [
    isLoading,
    loginMethod,
    loginDictionary,
    displayError,
    getAlignmentClasses,
    getTextAlignment,
    getItemsAlignment,
    hasDisplayError,
    errorObj,
    dictionary,
    sendAuth,
    setLoginMethod,
    selectLoginMethod,
    getAuthError,
  ]);

  const PasswordInputStep = useMemo(() => {
    const { authErrorTitle, authErrorDescription } = getAuthError();

    return (
      <>
        <BackButton
          className="mb-2.5"
          onClick={() => sendAuth('BACK')}
        >
          {getValuesEmail('email') || credentialEmail}
        </BackButton>

        {hasDisplayError && (
          <div className="flex flex-col items-center justify-center gap-5">
            <img
              src={authErrorImage}
              alt="alore logo"
              width={70}
            />
            <div className="my-4 flex flex-col items-center justify-center gap-2">
              <span className="font-poppins text-alr-red text-center text-xl font-bold">
                {authErrorTitle}
              </span>
              <span className="text-alr-grey text-center font-medium">{authErrorDescription}</span>
              {errorObj?.code && (
                <span className="text-center text-xs text-gray-500">{`${loginDictionary?.errorCode} ${errorObj.code}`}</span>
              )}
            </div>
          </div>
        )}
        <form
          onSubmit={handleSubmitPassword((data) => onSubmitLogin(data))}
          className="flex flex-col gap-y-5"
          data-testid="login-password-step"
        >
          <InputForm
            inputClassName={inputClassName}
            control={passwordControl}
            errors={passwordErrors}
            name="password"
            placeholder={loginDictionary?.enterPassword}
            icon={lockClosedIcon}
            type="password"
            label={dictionary?.password}
            passwordToggleLabel={dictionary?.auth.togglePasswordVisibility}
            data-testid="login-password"
          />

          <LinkButton
            data-testid="forgot-password-link"
            onClick={() => sendAuth('FORGOT_PASSWORD')}
            className="text-xs"
          >
            {loginDictionary?.forgotPassword}
          </LinkButton>
          <Button
            type="submit"
            data-testid="login-submit"
            disabled={isLoginSubmitDisabled}
          >
            {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
            {loginDictionary?.login}
          </Button>
          {/* Deliberately centred and stacked, independent of `contentAlignment`:
              the sign-up prompt is the one element the design centres under the
              card regardless of how the rest of the form is aligned. */}
          <div className="flex flex-col items-center gap-0.5 text-center text-sm font-medium">
            <span>{loginDictionary?.dontHaveAccount}</span>
            <LinkButton
              data-testid="sign-up-button"
              className="text-sm"
              onClick={() => {
                sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'SIGN_UP']);
              }}
            >
              {loginDictionary?.signUp}
            </LinkButton>
          </div>
        </form>
      </>
    );
  }, [
    getValuesPassword,
    getValuesEmail,
    credentialEmail,
    passwordErrors,
    passwordControl,
    isLoading,
    displayError,
    hasDisplayError,
    errorObj,
    inputClassName,
    loginDictionary,
    dictionary,
    sendAuth,
    handleSubmitPassword,
    onSubmitLogin,
    forgeId,
    isLoginSubmitDisabled,
    getTextAlignment,
  ]);

  const VerifyEmail = useMemo(
    () => (
      <div data-testid="login-verify-email-step">
        <BackButton
          className="mb-4"
          disabled={isLoading}
          onClick={() => sendAuth('BACK')}
        >
          {dictionary?.back}
        </BackButton>

        <div
          className={`flex w-full flex-col ${getAlignmentClasses}`}
          data-testid="login-verify-email-step"
        >
          <span
            className={`font-poppins text-alr-grey mb-4 mt-2 text-[1.75rem] font-bold ${getTextAlignment}`}
          >
            {loginDictionary?.verifyEmail}
          </span>
          <span className={`mb-6 font-medium text-gray-600 ${getTextAlignment}`}>
            {loginDictionary?.verifyEmailDescription}
          </span>

          <div className="mb-6 flex">
            <InputOTP
              className="child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9"
              value={secureCode2FA}
              onChange={(value) => setSecure2FACode(value)}
              inputLength={6}
              data-testid="secure-code"
              errorMessage={otpError}
              disabled={isLoading}
            />
          </div>
          <label
            htmlFor="trust-device-checkbox"
            className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-gray-600"
          >
            <input
              id="trust-device-checkbox"
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="size-4 rounded border-gray-300 text-[--primary-color] focus:ring-[--primary-color]"
            />
            {loginDictionary?.trustThisDevice}
          </label>
          <Button
            data-testid="secure-code-submit"
            onClick={() => onClickSecureCodeSubmit()}
            className="group relative mb-6 flex w-full items-center justify-center rounded-lg border border-transparent bg-[--primary-color] p-0.5 text-center font-medium text-white duration-300 hover:bg-[--primary-hover] focus:z-10 focus:outline-none focus:ring-2 focus:ring-red-300 enabled:hover:bg-red-700 disabled:hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:enabled:hover:bg-red-700 dark:disabled:hover:bg-red-600"
            disabled={secureCode2FA.length !== 6 || isLoading}
          >
            {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
            {loginDictionary?.confirmCode}
          </Button>
          <LinkButton
            data-testid="resend-code-button"
            onClick={() => resendSecureCode()}
            disabled={sendEmailCooldown > 0}
            className={twMerge(`text-base`, sendEmailCooldown > 0 ? 'opacity-50' : 'opacity-100')}
          >
            {`${loginDictionary?.resendCode}${sendEmailCooldown ? ` (${sendEmailCooldown}s)` : ''}`}
          </LinkButton>
        </div>
      </div>
    ),
    [
      secureCode2FA,
      sendEmailCooldown,
      isLoading,
      authState,
      getAlignmentClasses,
      getTextAlignment,
      dictionary,
      loginDictionary,
      sendAuth,
      otpError,
      trustDevice,
      onClickSecureCodeSubmit,
      resendSecureCode,
    ],
  );

  // Shown when the provider's word on the address is not enough — Microsoft's
  // never is — and the backend has emailed a code to the address the token
  // claimed. No trust-this-device box: there is no password step behind this
  // one to skip next time.
  const VerifySocialEmail = useMemo(
    () => (
      <div data-testid="login-social-verify-email-step">
        <BackButton
          className="mb-4"
          disabled={isLoading}
          onClick={() => sendAuth('BACK')}
        >
          {dictionary?.back}
        </BackButton>

        <div className={`flex w-full flex-col ${getAlignmentClasses}`}>
          <span
            className={`font-poppins text-alr-grey mb-4 mt-2 text-[1.75rem] font-bold ${getTextAlignment}`}
          >
            {loginDictionary?.verifyEmail}
          </span>
          <span className={`mb-6 font-medium text-gray-600 ${getTextAlignment}`}>
            {loginDictionary?.verifyEmailDescription}
          </span>

          <div className="mb-6 flex">
            <InputOTP
              className="child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9"
              value={socialEmailCode}
              onChange={(value) => setSocialEmailCode(value)}
              inputLength={6}
              data-testid="social-email-code"
              errorMessage={displayError}
              disabled={isLoading}
            />
          </div>
          <Button
            data-testid="social-email-code-submit"
            onClick={() => onSubmitSocialEmailCode()}
            className="group relative mb-6 flex w-full items-center justify-center rounded-lg border border-transparent bg-[--primary-color] p-0.5 text-center font-medium text-white duration-300 hover:bg-[--primary-hover] focus:z-10 focus:outline-none focus:ring-2 focus:ring-red-300 enabled:hover:bg-red-700 disabled:hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:enabled:hover:bg-red-700 dark:disabled:hover:bg-red-600"
            disabled={socialEmailCode.length !== 6 || isLoading}
          >
            {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
            {loginDictionary?.confirmCode}
          </Button>
        </div>
      </div>
    ),
    [
      socialEmailCode,
      isLoading,
      displayError,
      getAlignmentClasses,
      getTextAlignment,
      dictionary,
      loginDictionary,
      sendAuth,
      onSubmitSocialEmailCode,
    ],
  );

  const VerifyHw2FAStep = useMemo(
    () => (
      <div>
        <BackButton onClick={() => sendAuth('BACK')} />

        {displayError?.includes('Failed authenticating with hardware key') ? (
          <div className={`mt-6 flex w-full flex-col gap-6 ${getAlignmentClasses}`}>
            <img
              alt="fingerprint error"
              src={fingerprintError}
            />
            <span
              className={`font-poppins text-alr-red text-[1.3rem] font-bold ${getTextAlignment}`}
            >
              {loginDictionary?.cantVerify2fa}
            </span>
            <Button
              className="bg-alr-red hover:bg-alr-dark-red group relative flex w-full items-center justify-center rounded-lg border border-transparent p-0.5 text-center font-medium text-white duration-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-red-300 enabled:hover:bg-red-700 disabled:hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:enabled:hover:bg-red-700 dark:disabled:hover:bg-red-600"
              onClick={() => startHwAuth(0)}
            >
              {loginDictionary?.tryAgain}
            </Button>
            {activeHw2fa?.length > 1 && (
              <>
                <span>{loginDictionary?.tryHardware}</span>
                <LinkButton
                  data-testid="use-another-hardware-button"
                  className="flex items-center gap-x-1 text-base font-semibold"
                  onClick={() => startHwAuth(1)}
                >
                  {loginDictionary?.useAnotherHardware}
                  <ArrowRightIcon className="size-5" />
                </LinkButton>
              </>
            )}
            {activeSw2fa && (
              <LinkButton
                data-testid="use-software-2fa-button"
                className="flex items-center gap-x-1 text-base font-semibold"
                onClick={() => sendAuth('USE_SOFTWARE_2FA')}
              >
                {loginDictionary?.useSw2fa}
                <ArrowRightIcon className="size-5" />
              </LinkButton>
            )}
          </div>
        ) : (
          <div className={`flex w-full flex-col ${getAlignmentClasses}`}>
            <span
              className={`font-poppins text-alr-grey mb-10 mt-12 text-[1.3rem] font-bold ${getTextAlignment}`}
            >
              {loginDictionary?.touchHardware}
            </span>
            <span className={`text-alr-grey mb-10 w-60 text-sm font-normal ${getTextAlignment}`}>
              {loginDictionary?.touchHardwareDescription}
            </span>
            <img
              alt="usb indicator"
              src={fingerprint}
            />
            {activeSw2fa && (
              <LinkButton
                data-testid="use-software-2fa-button"
                className="mt-9 flex items-center gap-x-1 text-base font-semibold"
                onClick={() => sendAuth('USE_SOFTWARE_2FA')}
              >
                {loginDictionary?.useSw2fa}
                <ArrowRightIcon className="size-5" />
              </LinkButton>
            )}
          </div>
        )}
      </div>
    ),
    [
      isLoading,
      active2fa,
      displayError,
      getAlignmentClasses,
      getTextAlignment,
      loginDictionary,
      sendAuth,
      startHwAuth,
      activeHw2fa,
      activeSw2fa,
    ],
  );

  const VerifySw2FAStep = useMemo(
    () => (
      <div>
        <BackButton onClick={() => sendAuth('BACK')} />

        <div className={`flex w-full flex-col ${getAlignmentClasses}`}>
          <span
            className={`font-poppins text-alr-grey mb-10 mt-12 text-[1.3rem] font-bold ${getTextAlignment}`}
          >
            {loginDictionary?.inform2FACode}
          </span>

          <div className="mb-6 flex">
            <InputOTP
              className="child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9"
              value={secureCode2FA}
              onChange={(value) => setSecure2FACode(value)}
              data-testid="secure-code-2FA"
              inputLength={6}
              errorMessage={
                displayError?.includes('Invalid 2FA code') ? loginDictionary?.wrongCode : undefined
              }
            />
          </div>
          <Button
            data-testid="secure-code-2FA-submit"
            onClick={() => onSubmitSecureCode2FA()}
            className="bg-alr-red hover:bg-alr-dark-red group relative mb-6 flex w-full items-center justify-center rounded-lg border border-transparent p-0.5 text-center font-medium text-white duration-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-red-300 enabled:hover:bg-red-700 disabled:hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:enabled:hover:bg-red-700 dark:disabled:hover:bg-red-600"
            disabled={secureCode2FA.length !== 6}
          >
            {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
            {loginDictionary?.confirmCode}
          </Button>
          {active2fa?.find((item) => item.twoFaTypeId === HARDWARE) && (
            <LinkButton
              data-testid="use-hardware-2fa-button"
              className="mt-9 flex items-center gap-x-1 text-base font-semibold"
              onClick={() => sendAuth('USE_HARDWARE_2FA')}
            >
              {loginDictionary?.useHw2fa}
              <ArrowRightIcon className="size-5" />
            </LinkButton>
          )}
        </div>
      </div>
    ),
    [
      secureCode2FA,
      isLoading,
      active2fa,
      displayError,
      getAlignmentClasses,
      getTextAlignment,
      loginDictionary,
      sendAuth,
      onSubmitSecureCode2FA,
      setSecure2FACode,
    ],
  );

  const NewDeviceStep = useMemo(
    () => (
      <div>
        <div className={`flex w-full flex-col ${getAlignmentClasses}`}>
          <span
            className={`font-poppins text-alr-grey mb-5 mt-14 text-[1.75rem] font-bold ${getTextAlignment}`}
          >
            {loginDictionary?.newDevice}
          </span>
          <span className={`text-alr-grey mb-3 w-[23.75rem] font-medium ${getTextAlignment}`}>
            {loginDictionary?.verifyEmailDescription}
          </span>
          <span className={`mb-5 font-bold ${getTextAlignment}`}>{getValuesEmail('email')}</span>
          <div className="mb-5 h-44 w-full">
            {/* {newDeviceInfo?.coordinates && (
              <Map
                coordinates={
                  newDeviceInfo?.coordinates as unknown as LatLngTuple
                }
              />
            )} */}
          </div>
          <div className="mb-6 flex">
            <InputOTP
              className="child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9"
              value={secureCodeEmail}
              onChange={(value) => setSecureCodeEmail(value)}
              data-testid="secure-code-email"
              inputLength={6}
              errorMessage={
                displayError?.includes('Wrong code') ? loginDictionary?.wrongCode : undefined
              }
            />
          </div>
          <Button
            data-testid="secure-code-email-submit"
            onClick={() => onSubmitSecureCodeEmail()}
            className="bg-alr-red hover:bg-alr-dark-red group relative mb-6 flex w-full items-center justify-center rounded-lg border border-transparent p-0.5 text-center font-medium text-white duration-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-red-300 enabled:hover:bg-red-700 disabled:hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:enabled:hover:bg-red-700 dark:disabled:hover:bg-red-600"
            disabled={secureCodeEmail.length !== 6}
          >
            {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
            {loginDictionary?.confirmCode}
          </Button>
          <LinkButton
            data-testid="resend-code-button"
            onClick={() => resendSecureCode()}
            disabled={sendEmailCooldown > 0}
            className={twMerge(`text-base`, sendEmailCooldown > 0 ? 'opacity-50' : 'opacity-100')}
          >
            {`${loginDictionary?.resendCode}${sendEmailCooldown ? ` (${sendEmailCooldown}s)` : ''}`}
          </LinkButton>
        </div>
      </div>
    ),
    [
      secureCodeEmail,
      sendEmailCooldown,
      isLoading,
      newDeviceInfo,
      displayError,
      getAlignmentClasses,
      getTextAlignment,
      loginDictionary,
      getValuesEmail,
      onSubmitSecureCodeEmail,
      resendSecureCode,
      setSecureCodeEmail,
    ],
  );

  // Create custom styles object for the Card component
  const cardCustomStyles = useMemo(() => {
    if (!customStyles) return {};

    const styles: React.CSSProperties = {};

    if (customStyles.borderRadius) styles.borderRadius = customStyles.borderRadius;
    if (customStyles.borderWidth) styles.borderWidth = customStyles.borderWidth;
    if (customStyles.borderColor) styles.borderColor = customStyles.borderColor;
    if (customStyles.backgroundColor) styles.backgroundColor = customStyles.backgroundColor;
    if (customStyles.padding) styles.padding = customStyles.padding;
    if (customStyles.boxShadow) styles.boxShadow = customStyles.boxShadow;

    return styles;
  }, [customStyles]);

  if (authState.matches('active.login.successfulLogin')) return null;

  return (
    <div
      // min-h-full, not min-h-screen: this renders inside the consuming app's
      // own card, and a viewport-height floor stretches that card to the window.
      className={`flex size-full min-h-full flex-col items-center justify-center ${titleSpacing}`}
      data-testid="login-page"
    >
      {forgeId ? (
        <div className="flex flex-col">
          <span className="font-poppins text-alr-grey text-center text-2xl font-black">
            Tardezinha com Thiaguinho
          </span>
          <div className="flex w-full flex-row items-center justify-center gap-2">
            <span className="font-inter text-sm font-medium text-gray-900">
              {dictionary?.auth.poweredBy}
            </span>
            <img
              src={aloreLogoBlack}
              alt="alore logo"
              width="60"
            />
          </div>
        </div>
      ) : (
        <div
          className={`mx-5 flex min-w-80 flex-col gap-3 px-6 md:mx-7 md:w-96 ${getAlignmentClasses} ${logoContainerClassName || ''}`}
        >
          {logoImage || (
            <img
              src={aloreLogoBlack}
              alt="alore logo"
              width={authState.matches('active.login.newDevice') ? 153 : 201}
            />
          )}
          {title &&
            (authState.matches('active.login.idle') ||
              authState.matches('active.login.googleLogin') ||
              authState.matches('active.login.retrievingSalt') ||
              authState.matches('active.login.verifyingRegisterPublicKeyCredential')) && (
              <h2 className={titleClassName}>{title}</h2>
            )}
        </div>
      )}
      <Card
        className={twMerge(
          `md:child:!px-9 mx-5 flex min-w-[20rem] !rounded-2xl border-gray-200 px-2 py-4 md:mx-7 md:w-96`,
          isLoading ? 'pointer-events-none opacity-50' : '',
          customClassName,
        )}
        style={cardCustomStyles}
      >
        {isLoading ? (
          <Spinner className="my-20 !h-14 w-full !fill-[var(--primary-color)]" />
        ) : (
          <>
            {forgeId && authState.matches('active.web3Connector') && 'TODO'}
            {(authState.matches('active.login.idle') ||
              authState.matches('active.login.googleLogin') ||
              authState.matches('active.login.retrievingSalt') ||
              authState.matches('active.login.verifyingRegisterPublicKeyCredential')) &&
              IdleStep}
            {(authState.matches('active.login.loginMethodSelection') ||
              authState.matches('active.login.signingCredentialRCR') ||
              authState.matches('active.login.retrievingCredentialRCR')) &&
              SelectLoginMethod}
            {(authState.matches('active.login.inputPassword') ||
              authState.matches('active.login.verifyingGoogleLogin') ||
              authState.matches('active.login.verifyingLogin')) &&
              PasswordInputStep}
            {(authState.matches('active.login.email2fa') ||
              authState.matches('active.login.resendingEmailCode') ||
              authState.matches('active.login.verifyingEmail2fa')) &&
              VerifyEmail}
            {/* Kept mounted while the second call is in flight, so the screen
                does not blink away mid-submit and back again on a wrong code. */}
            {(authState.matches('active.login.socialEmailCode') ||
              (authState.matches('active.login.socialLogin') && !!socialChallenge)) &&
              VerifySocialEmail}
            {(authState.matches('active.login.hardware2fa') ||
              authState.matches('active.login.verifyingHwAuth')) &&
              VerifyHw2FAStep}
            {(authState.matches('active.login.software2fa') ||
              authState.matches('active.login.verifying2faCode')) &&
              VerifySw2FAStep}
            {(authState.matches('active.login.newDevice') ||
              authState.matches('active.login.verifyingCode') ||
              authState.matches('active.login.resendingConfirmationEmail')) &&
              NewDeviceStep}
          </>
        )}
      </Card>

      {/* {authState.matches('active.login.idle') && (
        <Link
          href="/login"
          className="mt-4 flex cursor-pointer items-center gap-x-1 text-base font-semibold text-alr-red"
        >
          Continue with SSO
          <ArrowRightIcon className="h-5 w-5" />
        </Link>
      )} */}
    </div>
  );
};

export default Login;
