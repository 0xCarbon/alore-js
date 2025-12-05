'use client';

/* eslint-disable @next/next/no-img-element */
import {
  ArrowRightIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserCircleIcon,
} from '@heroicons/react/20/solid';
import { KeyIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { yupResolver } from '@hookform/resolvers/yup';
import { useGoogleLogin } from '@react-oauth/google';
import { useActor } from '@xstate/react';
import { randomBytes } from 'crypto';
import { Button, Card, Spinner } from 'flowbite-react';
import { Locale } from 'get-dictionary';
import jwt_decode from 'jwt-decode';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FieldValues, useForm, useWatch } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';
import * as yup from 'yup';

import { passwordRules, ruleValidation } from '../components/FormRules/helpers';
import { base64UrlToArrayBuffer, verifyEmptyValues } from '../helpers';
import useDictionary from '../hooks/useDictionary';
import { AuthInstance } from '../machine/types';
import { aloreLogoBlack, authErrorImage, google, metamaskLogo, walletConnectLogo } from '../utils';

/* eslint-disable @next/next/no-img-element */

const InputForm = React.lazy(() => import('../components/InputForm'));
const InputOTP = React.lazy(() => import('../components/InputOTP'));
const BackButton = React.lazy(() => import('../components/BackButton'));
const CheckboxForm = React.lazy(() => import('../components/CheckboxForm'));
const TermsModal = React.lazy(() => import('../components/TermsModal'));
const FormRules = React.lazy(() => import('../components/FormRules'));

const envelopIcon = () => <EnvelopeIcon className="size-5 text-gray-500" />;
const userIcon = () => <UserCircleIcon className="size-5 text-gray-500" />;
const lockClosedIcon = () => <LockClosedIcon className="size-4 text-gray-500" />;

export interface RegisterProps {
  locale?: Locale;
  authServiceInstance: AuthInstance;
  forgeId?: string;
  logoImage?: React.ReactNode;
  inviteToken?: string;
  keyshareWorker?: Worker | null;
  cryptoUtils: {
    hashUserInfo: (_userInfo: string) => string;
    generateSecureHash: (
      _data: string,
      _salt: string,
      _keyDerivationFunction: 'argon2d' | 'pbkdf2',
    ) => Promise<string>;
  };
  // Content alignment and styling props
  contentAlignment?: 'left' | 'center' | 'right';
  titleSpacing?: string;
  customClassName?: string;
  customStyles?: {
    borderRadius?: string;
    borderWidth?: string;
    borderColor?: string;
    backgroundColor?: string;
    padding?: string;
    boxShadow?: string;
  };
  logoContainerClassName?: string;
}

const Register = ({
  locale = 'pt',
  authServiceInstance,
  forgeId,
  logoImage,
  inviteToken,
  keyshareWorker,
  cryptoUtils,
  contentAlignment = 'center',
  titleSpacing = 'gap-y-2 sm:gap-y-7',
  customClassName,
  customStyles,
  logoContainerClassName,
}: RegisterProps) => {
  const { hashUserInfo, generateSecureHash } = cryptoUtils;
  const dictionary = useDictionary(locale);
  const registerDictionary = dictionary?.auth.register;

  const [secureCode, setSecureCode] = useState('');
  const [sendEmailCooldown, setSendEmailCooldown] = useState(0);
  const [cooldownMultiplier, setCooldownMultiplier] = useState(1);
  const [authState, sendAuth] = useActor(authServiceInstance);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const {
    salt,
    error: errorObj,
    registerUser,
    googleUser,
    CCRPublicKey,
    RCRPublicKey,
    authProviderConfigs,
    socialProviderRegisterUser,
  } = authState.context;

  const displayError = errorObj?.message || '';
  const hasDisplayError = !!displayError;

  const { requireUsername, requireEmailVerification, enablePasskeys, enableWalletCreation } =
    authProviderConfigs || {};

  const [userSalt, setUserSalt] = useState('');
  const [registrationMethod, setRegistrationMethod] = useState('password');

  const otpError = useMemo(() => {
    const lower = displayError.toLowerCase?.();
    let errorMessage = '';

    if (lower?.includes('wrong')) {
      errorMessage = `${registerDictionary?.wrongCode}`;
    } else if (lower?.includes('expired')) {
      errorMessage = `${registerDictionary?.codeExpired}`;
    }

    return errorMessage;
  }, [displayError]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      resetUserInfo();
      sendAuth({
        type: 'GOOGLE_LOGIN',
        payload: {
          accessToken: tokenResponse.access_token,
          providerName: 'google',
        },
      });
    },
  });

  const selectRegisterMethod = () => {
    if (registrationMethod === 'password') {
      sendAuth('SELECT_PASSWORD');
    } else {
      const nickname = registerUser ? registerUser.nickname : userInfoGetValues('nickname');
      const email = registerUser ? registerUser.email : userInfoGetValues('email');
      const device = hashUserInfo(window.navigator.userAgent);
      sendAuth({
        type: 'START_PASSKEY_REGISTER',
        payload: {
          email,
          nickname,
          device,
        },
      });
    }
  };

  const finishPasskeyRegistration = async () => {
    const publicKey = CCRPublicKey?.publicKey;

    if (!publicKey || !navigator.credentials) {
      sendAuth({
        type: 'PASSKEY_NOT_SUPPORTED',
        payload: { error: registerDictionary?.passkeyNotSupported! },
      });
      return;
    }

    const email = registerUser ? registerUser.email : userInfoGetValues('email');
    const nickname = registerUser ? registerUser.nickname : userInfoGetValues('nickname');
    const device = hashUserInfo(window.navigator.userAgent);

    let extensions: {
      prf?: { eval: { first: Uint8Array } };
      largeBlob?: { support: string };
    } | null = null;

    if (enableWalletCreation) {
      extensions = {
        prf: {
          eval: {
            first: new TextEncoder().encode('Alore'),
          },
        },
        largeBlob: {
          support: 'preferred',
        },
      };
    }

    // eslint-disable-next-line no-undef
    const credentialCreationOptions: CredentialCreationOptions = {
      publicKey: {
        ...publicKey,
        // @ts-ignore
        challenge: base64UrlToArrayBuffer(publicKey.challenge),
        user: {
          // @ts-ignore
          id: crypto.getRandomValues(new Uint8Array(32)),
          name: email,
          displayName: nickname || email || '',
        },
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
          residentKey: 'required',
          userVerification: 'required',
        },
        timeout: 120000,
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7,
          },
          {
            type: 'public-key',
            alg: -257,
          },
        ],
        // @ts-ignore
        extensions,
      },
    };

    try {
      const _registerCredential = await navigator.credentials
        .create(credentialCreationOptions)
        .catch((err) => {
          console.error('Error creating passkey credential:', err);
        });

      if (!_registerCredential) {
        sendAuth({
          type: 'PASSKEY_NOT_SUPPORTED',
          payload: { error: registerDictionary?.passkeyNotSupported! },
        });
        return;
      }

      const registerCredential = _registerCredential as PublicKeyCredential;

      // TODO: verify this when user needs web3 module at this library
      // eslint-disable-next-line no-undef
      const extensionResults = registerCredential.getClientExtensionResults();
      // @ts-ignore
      const prfSupported = !!extensionResults?.prf?.enabled;
      // @ts-ignore
      const largeBlobSupported = !!extensionResults?.largeBlob?.supported;

      if (enableWalletCreation && !prfSupported && !largeBlobSupported) {
        sendAuth({
          type: 'PASSKEY_NOT_SUPPORTED',
          payload: { error: registerDictionary?.passkeyNotSupported! },
        });
      } else {
        sendAuth([
          {
            type: 'FINISH_PASSKEY_REGISTER',
            payload: {
              passkeyRegistration: {
                id: registerCredential.id,
                rawId: Buffer.from(registerCredential.rawId).toString('base64'),
                response: {
                  attestationObject: Buffer.from(
                    // eslint-disable-next-line no-undef
                    (registerCredential.response as AuthenticatorAttestationResponse)
                      .attestationObject,
                  ).toString('base64'),
                  clientDataJSON: Buffer.from(
                    // eslint-disable-next-line no-undef
                    (registerCredential.response as AuthenticatorAttestationResponse)
                      .clientDataJSON,
                  ).toString('base64'),
                },
                type: 'public-key',
              },
              email,
              device,
              nickname,
            },
          },
        ]);
      }
    } catch (_err) {
      sendAuth({
        type: 'PASSKEY_NOT_SUPPORTED',
        payload: { error: registerDictionary?.passkeyNotSupported! },
      });
    }
  };

  const finishPasskeyFirstAuth = async () => {
    const publicKey = RCRPublicKey?.publicKey;

    if (!publicKey || !navigator.credentials) {
      sendAuth('BACK_TO_IDLE');
      return;
    }

    const largeBlob = new Uint8Array(randomBytes(32));

    // Prepare the allowCredentials list by decoding the IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allowCredentialsList = publicKey.allowCredentials?.map((cred: any) => ({
      ...cred,
      id: Buffer.from(cred.id, 'base64'),
    }));

    const extensions: {
      prf?: { eval: { first: Uint8Array } };
      largeBlob?: { write?: Uint8Array }; // Make write optional here
    } = {
      prf: { eval: { first: new TextEncoder().encode('Alore') } },
    };

    // Conditionally add largeBlob.write only if exactly one credential is allowed
    if (allowCredentialsList?.length === 1) {
      extensions.largeBlob = {
        write: largeBlob,
      };
    }

    try {
      const firstLoginCredential = (await navigator.credentials.get({
        publicKey: {
          ...publicKey,
          // @ts-ignore
          challenge: base64UrlToArrayBuffer(publicKey.challenge),
          allowCredentials: allowCredentialsList, // Use the prepared list
          timeout: 120000,
          extensions: {
            ...publicKey.extensions, // Include extensions from the server challenge
            // @ts-ignore - Spread our potentially modified extensions object
            ...extensions,
          },
        },
        // eslint-disable-next-line no-undef
      })) as PublicKeyCredential;

      if (!firstLoginCredential) {
        sendAuth('BACK_TO_IDLE');
        return;
      }
      const extensionResults = firstLoginCredential.getClientExtensionResults();

      // @ts-ignore
      const prfWritten = !!extensionResults?.prf?.results?.first;
      // @ts-ignore
      const blobWritten = !!extensionResults?.largeBlob?.written;
      let secretFromCredential;

      if (prfWritten) {
        // @ts-ignore
        secretFromCredential = extensionResults?.prf?.results?.first;
      } else if (blobWritten) {
        secretFromCredential = largeBlob;
      }

      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (blobWritten && isSafari) {
        secretFromCredential = largeBlob;
      }

      if (!secretFromCredential) {
        sendAuth({
          type: 'PASSKEY_NOT_SUPPORTED',
          payload: { error: registerDictionary?.passkeyNotSupported! },
        });

        return;
      }

      sendAuth({
        type: 'FINISH_PASSKEY_AUTH',
        payload: {
          passkeyAuth: {
            id: firstLoginCredential.id,
            rawId: Buffer.from(firstLoginCredential.rawId).toString('base64'),
            response: {
              authenticatorData: Buffer.from(
                // eslint-disable-next-line no-undef
                (firstLoginCredential.response as AuthenticatorAssertionResponse).authenticatorData,
              ).toString('base64'),
              clientDataJSON: Buffer.from(
                // eslint-disable-next-line no-undef
                (firstLoginCredential.response as AuthenticatorAssertionResponse).clientDataJSON,
              ).toString('base64'),
              signature: Buffer.from(
                // eslint-disable-next-line no-undef
                (firstLoginCredential.response as AuthenticatorAssertionResponse).signature,
              ).toString('base64'),
              userHandle: Buffer.from(
                // @ts-ignore
                firstLoginCredential.response.userHandle || [0],
              ).toString('base64'),
            },
            type: 'public-key',
          },
        },
      });

      if (keyshareWorker) {
        keyshareWorker.postMessage({
          method: 'derive-password',
          payload: {
            password: new TextDecoder().decode(secretFromCredential),
            email: firstLoginCredential.id,
          },
        });
      }
    } catch (_err) {
      sendAuth('USER_CREATE_ACCOUNT_BUT_NOT_LOGIN');
    }
  };

  useEffect(() => {
    if (
      authState.matches('active.register.registerMethodSelection') &&
      !requireEmailVerification &&
      enablePasskeys
    ) {
      const device = hashUserInfo(window.navigator.userAgent);

      sendAuth({
        type: 'START_PASSKEY_REGISTER',
        payload: {
          device,
        },
      });
    }
  }, [authState.matches('active.register.registerMethodSelection')]);

  useEffect(() => {
    if (authState.matches('active.register.localCCRSign')) {
      finishPasskeyRegistration();
    }
  }, [authState.matches('active.register.localCCRSign')]);

  useEffect(() => {
    if (authState.matches('active.register.localRCRSign')) {
      finishPasskeyFirstAuth();
    }
  }, [authState.matches('active.register.localRCRSign')]);

  useEffect(() => {
    if (authState.matches('active.register.waitingForRCR')) {
      sendAuth({
        type: 'START_PASSKEY_LOGIN',
        payload: {
          email: registerUser ? registerUser.email : userInfoGetValues('email'),
        },
      });
    }
  }, [authState.matches('active.register.waitingForRCR')]);

  const userInfoFormSchema = yup
    .object({
      email: yup
        .string()
        .required(dictionary?.formValidation.required)
        .email(dictionary?.formValidation.invalidEmail),
      nickname: requireUsername
        ? yup
            .string()
            .matches(/^[a-zA-Z].*$/, dictionary?.formValidation.validName)
            .max(40)
            .required(dictionary?.formValidation.required)
        : yup.string().nullable(),
      agreedWithTerms: yup.boolean().isTrue(dictionary?.formValidation.agreeTerms),
    })
    .required();

  const passwordFormSchema = yup
    .object({
      password: yup.string().required(dictionary?.formValidation.required),
      confirmPassword: yup.string().required(dictionary?.formValidation.required),
    })
    .required();

  const userInfoDefaultValues: FieldValues = {
    email: '',
    nickname: '',
    agreedWithTerms: false,
  };
  const {
    control: userInfoControl,
    formState: { errors: userInfoErrors, dirtyFields: userInfoDirtyFields },
    handleSubmit: userInfoHandleSubmit,
    setValue: userInfoSetValue,
    getValues: userInfoGetValues,
    reset: resetUserInfo,
  } = useForm({
    resolver: yupResolver(userInfoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: userInfoDefaultValues,
  });
  useWatch({ control: userInfoControl, name: 'agreedWithTerms' });

  const passwordDefaultValues: FieldValues = {
    password: '',
    confirmPassword: '',
  };
  const {
    control: passwordControl,
    formState: { errors: passwordErrors, dirtyFields: passwordDirtyFields },
    handleSubmit: passwordHandleSubmit,
    getValues: passwordGetValues,
  } = useForm({
    resolver: yupResolver(passwordFormSchema),
    defaultValues: passwordDefaultValues,
  });
  useWatch({ control: passwordControl, name: 'password' });
  useWatch({ control: passwordControl, name: 'confirmPassword' });

  const isLoading = useMemo(
    () =>
      authState.matches('active.register.completingRegistration') ||
      authState.matches('active.register.sendingEmail') ||
      authState.matches('active.register.verifyingEmail') ||
      authState.matches('active.register.resendingRegistrationEmail') ||
      authState.matches('active.register.googleLogin') ||
      authState.matches('active.register.localCCRSign') ||
      authState.matches('active.register.localRCRSign') ||
      authState.matches('active.register.waitingForRCR') ||
      authState.matches('active.register.sendingPublicCredential') ||
      authState.matches('active.register.sendingAuthPublicCredential') ||
      authState.matches('active.web3Connector.verifyingClaimNftEmail2fa') ||
      authState.matches('active.web3Connector.verifyingEmailEligibility'),
    [authState.value],
  );

  useEffect(() => {
    if (inviteToken) {
      try {
        const decoded: { email: string; nickname: string; salt: string } = jwt_decode(inviteToken);
        const { email, nickname } = decoded;

        userInfoSetValue('email', email);
        userInfoSetValue('nickname', nickname);
        setUserSalt(decoded.salt);
      } catch (err) {
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
    const nickname = registerUser ? registerUser.nickname : userInfoGetValues('nickname');
    const email = registerUser ? registerUser.email : userInfoGetValues('email');
    const device = hashUserInfo(window.navigator.userAgent);

    sendAuth({
      type: 'VERIFY_EMAIL',
      payload: { secureCode, registerUser: { email, nickname, device } },
    });
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

  async function onSubmitUserData(data: typeof userInfoDefaultValues) {
    if (inviteToken) {
      sendAuth('ADVANCE_TO_PASSWORD');
    } else {
      const { email, nickname } = data;

      sendAuth({
        type: 'SEND_REGISTRATION_EMAIL',
        payload: {
          email,
          nickname: nickname || null,
          isForgeClaim: !!forgeId,
          locale,
        },
      });
    }
  }

  async function onSubmitPassword(data: typeof passwordDefaultValues) {
    const { password } = data;
    const email = registerUser
      ? registerUser.email
      : socialProviderRegisterUser?.email || userInfoGetValues('email');
    const nickname = registerUser
      ? registerUser.nickname
      : socialProviderRegisterUser?.nickname || userInfoGetValues('nickname');
    const { userAgent } = window.navigator;
    const device = hashUserInfo(userAgent);
    const saltWallet = salt || socialProviderRegisterUser?.salt || registerUser?.salt || userSalt;

    if (saltWallet) {
      if (keyshareWorker) {
        keyshareWorker.postMessage({
          method: 'derive-password',
          payload: { password, email },
        });
      }
      const secureHashArgon2d = await generateSecureHash(password, saltWallet, 'argon2d');

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
  }

  const isUserInfoSubmitDisabled = useMemo(() => {
    const values = userInfoGetValues();

    if (!values) return true;

    if (!requireUsername) {
      delete values.nickname;
    }

    return verifyEmptyValues(values) || !values.agreedWithTerms;
  }, [userInfoGetValues(), userInfoDirtyFields, requireUsername]);

  const isPasswordSubmitDisabled = useMemo(() => {
    const passwordValues = passwordGetValues();
    const userInfoValues = registerUser || socialProviderRegisterUser || userInfoGetValues();
    let isValid = true;

    passwordRules.forEach((rule) => {
      if (!ruleValidation(rule, passwordValues, userInfoValues)) {
        isValid = false;
      }
    });

    return !isValid;
  }, [passwordGetValues(), passwordDirtyFields]);

  // Get alignment classes based on contentAlignment prop
  const getAlignmentClasses = useMemo(() => {
    const alignmentMap = {
      left: 'items-start text-left',
      center: 'items-center text-center',
      right: 'items-end text-right',
    };
    return alignmentMap[contentAlignment];
  }, [contentAlignment]);

  // Helper function for text alignment only
  const getTextAlignmentClass = useMemo(() => {
    const textAlignmentMap = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };
    return textAlignmentMap[contentAlignment];
  }, [contentAlignment]);

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

  const UserInfo = useMemo(
    () => (
      <div data-testid="register-user-info-step">
        {inviteToken ? (
          <div className={`flex flex-col gap-2.5 ${getAlignmentClasses}`}>
            <h1 className={`text-alr-grey mb-1 text-[1.75rem] font-bold ${getTextAlignmentClass}`}>
              {registerDictionary?.welcome}
            </h1>
            <div className={`mb-5 text-gray-600 ${getTextAlignmentClass}`}>
              {registerDictionary?.invitedBy}
              <span className="font-semibold"> 0xCarbon </span>
              {registerDictionary?.toJoin}
              <span className="text-alr-red"> Alore.</span>
            </div>
          </div>
        ) : (
          <h1 className={`font-inter text-xl font-bold text-gray-700 ${getTextAlignmentClass}`}>
            {forgeId ? registerDictionary?.forgeTitle : registerDictionary?.title}
          </h1>
        )}
        {displayError?.includes('beta') && (
          <span className={`font-poppins text-alr-red text-xl font-bold ${getTextAlignmentClass}`}>
            {displayError}
          </span>
        )}
        {hasDisplayError && !displayError.includes('beta') && (
          <div className={`my-3 flex flex-col gap-1 ${getAlignmentClasses}`}>
            <img
              src={authErrorImage}
              alt="alore logo"
              width={70}
            />
            {displayError === 'EMAIL_NOT_ALLOWED' ? (
              <span
                className={`font-poppins text-alr-red text-xl font-bold ${getTextAlignmentClass}`}
              >
                {dictionary?.auth?.emailDomainNotAllowed}
              </span>
            ) : (
              <>
                <span
                  className={`font-poppins text-alr-red text-xl font-bold ${getTextAlignmentClass}`}
                >
                  {dictionary?.auth.login?.somethingWrong}
                </span>
                <span className={`text-alr-grey font-medium ${getTextAlignmentClass}`}>
                  {dictionary?.auth.login?.defaultError}
                </span>
              </>
            )}
            {errorObj?.code && (
              <span
                className={`mt-1 text-xs text-gray-500 ${getTextAlignmentClass}`}
              >{`${registerDictionary?.errorCode} ${errorObj.code}`}</span>
            )}
          </div>
        )}
        <form
          onSubmit={userInfoHandleSubmit((data) => onSubmitUserData(data))}
          className="mb-1 mt-4 flex flex-col gap-y-5"
          data-testid="register-user-info-form"
        >
          <InputForm
            control={userInfoControl}
            errors={userInfoErrors}
            name="email"
            type="email"
            placeholder={
              inviteToken
                ? `${registerDictionary?.emailInvitePlaceholder}`
                : `${registerDictionary?.emailLabel}`
            }
            data-testid="register-email-input"
            icon={envelopIcon}
            autoFocus
            disabled={isLoading || !!inviteToken}
          />

          {requireUsername && (
            <InputForm
              control={userInfoControl}
              errors={userInfoErrors}
              name="nickname"
              type="text"
              icon={userIcon}
              placeholder={registerDictionary?.nicknameLabel}
              data-testid="register-nickname-input"
              disabled={isLoading}
            />
          )}
          <CheckboxForm
            className="flex items-center justify-center"
            control={userInfoControl}
            name="agreedWithTerms"
            data-testid="register-agreed-with-terms-checkbox"
            label={
              <div
                onClick={() =>
                  userInfoSetValue('agreedWithTerms', !userInfoGetValues('agreedWithTerms'))
                }
                className="flex flex-row items-center justify-center gap-1"
              >
                <span className="text-xs font-light text-gray-400 md:text-sm md:font-normal">
                  {registerDictionary?.agreeTermsPart1}
                </span>
                <span
                  onClick={() => sendAuth('SHOW_TERMS_MODAL')}
                  className="cursor-pointer text-[var(--primary-color)] underline hover:text-[var(--primary-hover)]"
                  data-testid="terms-of-service"
                >
                  {registerDictionary?.agreeTermsPart2}
                </span>
              </div>
            }
          />

          <Button
            data-testid="register-user-info-submit"
            type="submit"
            disabled={isUserInfoSubmitDisabled || isLoading}
          >
            {isLoading && <Spinner className="mr-2 !h-5 w-6 !fill-gray-300" />}
            {registerDictionary?.buttonStart}
          </Button>
        </form>
        <div
          data-testid="sign-in-button"
          className={`group mt-4 flex w-full cursor-pointer flex-row gap-1.5 text-sm text-gray-500 ${getAlignmentClasses}`}
          onClick={() => {
            sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'LOGIN']);
          }}
        >
          <span className="font-inter font-semibold duration-300 group-hover:text-[var(--primary-hover)]">
            {registerDictionary?.alreadyHaveAccount}
          </span>
          <ArrowRightIcon className="size-4 duration-300 group-hover:text-[var(--primary-hover)]" />
        </div>
        {forgeId && (
          <>
            <div className="h-[0.5px] w-full bg-gray-300" />
            <Button
              color="light"
              onClick={() => handleGoogleLogin()}
              outline
            >
              <div className="flex flex-row items-center justify-center gap-2">
                <img
                  src={google}
                  alt="google logo"
                  width={16}
                />
                {dictionary?.auth.continueGoogle}
              </div>
            </Button>
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
                Metamask/WalletConnect
              </div>
            </Button>
          </>
        )}
      </div>
    ),
    [
      isUserInfoSubmitDisabled,
      userInfoControl,
      userInfoErrors,
      userInfoGetValues(),
      userInfoDirtyFields,
      isLoading,
      displayError,
      getAlignmentClasses,
      getTextAlignmentClass,
    ],
  );

  const PasskeyCreatedButNotAuthenticated = useMemo(
    () => (
      <div
        data-testid="passkey-created-but-not-authenticated-step"
        className={`flex flex-col ${getAlignmentClasses}`}
      >
        <h1
          className={`font-inter mb-3 text-xl font-semibold text-gray-900 ${getTextAlignmentClass}`}
        >
          {registerDictionary?.passkeyCreatedButNotAuthenticated}
        </h1>
        <p className={`text-alr-grey mb-6 w-full ${getTextAlignmentClass}`}>
          {registerDictionary?.passkeyCreatedButNotAuthenticatedDescription}
        </p>
        <Button
          className="flex w-full items-center justify-center"
          onClick={() => sendAuth('BACK_TO_IDLE')}
        >
          {registerDictionary?.backToLogin}
        </Button>
      </div>
    ),
    [getAlignmentClasses, getTextAlignmentClass, registerDictionary, sendAuth],
  );

  const VerifyEmail = useMemo(
    () => (
      <div data-testid="register-verify-email-step">
        <BackButton
          className="mb-4"
          disabled={isLoading}
          onClick={() => sendAuth('BACK')}
        >
          {dictionary?.back}
        </BackButton>

        <div
          className={`flex w-full flex-col ${getAlignmentClasses}`}
          data-testid="register-verify-email-step"
        >
          <span
            className={`font-poppins text-alr-grey mb-6 text-2xl font-bold md:text-[1.75rem] ${getTextAlignmentClass}`}
          >
            {registerDictionary?.verifyEmail}
          </span>
          <span className={`text-alr-grey mb-6 w-full font-medium ${getTextAlignmentClass}`}>
            {registerDictionary?.informCode}
          </span>

          <div className="mb-6 flex">
            <InputOTP
              className="child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9"
              value={secureCode}
              onChange={(value) => setSecureCode(value)}
              inputLength={6}
              data-testid="secure-code-input"
              errorMessage={otpError}
              disabled={isLoading}
            />
          </div>
          <Button
            data-testid="secure-code-submit-button"
            onClick={() => onClickSecureCodeSubmit()}
            className="mb-6 flex w-full items-center justify-center"
            disabled={secureCode.length !== 6 || isLoading}
          >
            {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
            {registerDictionary?.confirmCode}
          </Button>
          <span
            onClick={() => resendSecureCode()}
            className={twMerge(
              `text-base font-medium duration-300`,
              sendEmailCooldown > 0
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer opacity-100 hover:text-[--primary-hover]',
            )}
          >
            {`${registerDictionary?.resendCode}${
              sendEmailCooldown ? ` (${sendEmailCooldown}s)` : ''
            }`}
          </span>
        </div>
      </div>
    ),
    [
      secureCode,
      sendEmailCooldown,
      isLoading,
      otpError,
      getAlignmentClasses,
      getTextAlignmentClass,
      dictionary,
      registerDictionary,
      sendAuth,
      onClickSecureCodeSubmit,
      resendSecureCode,
    ],
  );

  const SelectRegisterMethod = useMemo(
    () => (
      <div>
        <BackButton
          className="mb-4"
          disabled={isLoading}
          onClick={() => sendAuth('BACK')}
        >
          {dictionary?.back}
        </BackButton>
        <div
          className={`mt-2 flex w-full flex-col ${getAlignmentClasses}`}
          data-testid="register-method-selection-step"
        >
          {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
          {displayError.toLowerCase?.().includes('passkey') && (
            <span
              className={`font-poppins text-alr-red mb-4 text-xl font-bold ${getTextAlignmentClass}`}
            >
              {registerDictionary?.passkeyNotSupported}
            </span>
          )}
          <span
            className={`font-poppins text-alr-grey mb-6 text-2xl font-bold md:text-[1.75rem] ${getTextAlignmentClass}`}
          >
            {registerDictionary?.selectMethodTitle}
          </span>
          <span className={`text-alr-grey mb-6 w-full font-medium ${getTextAlignmentClass}`}>
            {registerDictionary?.selectMethodDescription}
          </span>
          <div className="flex flex-col gap-5">
            <div className="flex w-full gap-2">
              <Button
                data-testid="register-method-selection-password"
                onClick={() => setRegistrationMethod('password')}
                color="light"
                className={`${
                  registrationMethod === 'password'
                    ? '!border-[--primary-color]'
                    : '!border-gray-300'
                } child:h-full !h-fit w-full cursor-pointer items-start rounded-lg border-2 !bg-white p-4 duration-300 hover:!bg-gray-100 focus:ring-0`}
              >
                <div className="flex flex-col items-start justify-center gap-2">
                  <LockOpenIcon
                    className={`${
                      registrationMethod === 'password' ? 'text-[--primary-color]' : 'text-gray-500'
                    } size-7 duration-300`}
                  />
                  <span className="font-semibold text-gray-900">
                    {registerDictionary?.password}
                  </span>
                  <span className="text-start text-xs font-normal text-gray-600">
                    {registerDictionary?.selectMethodPassword}
                  </span>
                </div>
              </Button>
              <Button
                disabled={typeof window.PublicKeyCredential === 'undefined'}
                data-testid="register-method-selection-passkey"
                onClick={() => setRegistrationMethod('passkey')}
                className={`${
                  registrationMethod === 'passkey'
                    ? '!border-[--primary-color]'
                    : '!border-gray-300'
                } child:h-full !h-fit w-full cursor-pointer items-start rounded-lg border-2 !bg-white p-4 duration-300 hover:!bg-gray-100 focus:ring-0`}
              >
                <div className="flex flex-col items-start justify-center gap-2">
                  <KeyIcon
                    className={`${
                      registrationMethod === 'passkey' ? 'text-[--primary-color]' : 'text-gray-500'
                    } size-7 duration-300`}
                  />
                  <span className="font-semibold text-gray-900">{registerDictionary?.passkey}</span>
                  <span className="text-start text-xs font-normal text-gray-600">
                    {registerDictionary?.selectMethodPasskey}
                  </span>
                </div>
              </Button>
            </div>
            <Button
              data-testid="register-method-selection-submit"
              onClick={() => selectRegisterMethod()}
              // className="mb-6 w-full"
            >
              {registerDictionary?.continue}
            </Button>
          </div>
        </div>
      </div>
    ),
    [
      isLoading,
      registrationMethod,
      displayError,
      getAlignmentClasses,
      getTextAlignmentClass,
      dictionary,
      registerDictionary,
      sendAuth,
      setRegistrationMethod,
      selectRegisterMethod,
    ],
  );

  const Password = useMemo(
    () => (
      <div data-testid="register-password-step">
        <BackButton
          className="mb-4"
          disabled={isLoading}
          onClick={() => sendAuth(inviteToken || registerUser ? 'BACK_TO_IDLE' : 'BACK')}
        >
          {userInfoGetValues('email')}
        </BackButton>

        <div
          className={`flex w-full flex-col ${getAlignmentClasses}`}
          data-testid="register-password-step"
        >
          <span className={`font-poppins text-alr-grey mb-5 font-bold ${getTextAlignmentClass}`}>
            {registerDictionary?.createPassword}
          </span>
          <form
            onSubmit={passwordHandleSubmit((data) => onSubmitPassword(data))}
            className="flex flex-col gap-y-4"
          >
            <InputForm
              control={passwordControl}
              errors={passwordErrors}
              name="password"
              autoFocus
              icon={lockClosedIcon}
              placeholder={registerDictionary?.passwordPlaceholder}
              label={registerDictionary?.passwordLabel}
              type="password"
              data-testid="register-password-input"
              disabled={isLoading}
            />

            <InputForm
              control={passwordControl}
              errors={passwordErrors}
              name="confirmPassword"
              placeholder={registerDictionary?.passwordConfirmPlaceholder}
              label={registerDictionary?.passwordConfirmLabel}
              icon={lockClosedIcon}
              type="password"
              data-testid="register-confirm-password-input"
              disabled={isLoading}
            />

            <FormRules
              locale={locale}
              className="!gap-y-1 md:!gap-y-2"
              passwordValues={passwordGetValues()}
              userValues={registerUser || socialProviderRegisterUser || userInfoGetValues()}
            />

            <Button
              data-testid="password-submit-button"
              type="submit"
              disabled={isPasswordSubmitDisabled || isLoading}
            >
              {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
              {dictionary?.next}
            </Button>
          </form>
        </div>
      </div>
    ),
    [
      isPasswordSubmitDisabled,
      passwordControl,
      passwordErrors,
      passwordGetValues(),
      passwordDirtyFields,
      isLoading,
      registerUser,
      getAlignmentClasses,
      getTextAlignmentClass,
    ],
  );

  if (authState.matches('active.register.userCreated')) return null;

  return (
    <div
      className={`flex size-full min-h-screen flex-col items-center justify-center ${titleSpacing}`}
      data-testid="register-page"
    >
      <TermsModal
        locale={locale}
        show={authState.matches('active.register.termsModal')}
        onClose={() => sendAuth('CLOSE_TERMS_MODAL')}
        onSubmit={() => {
          userInfoSetValue('agreedWithTerms', true);
          sendAuth('CLOSE_TERMS_MODAL');
        }}
      />

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
        </div>
      )}
      <Card
        className={twMerge(
          `md:child:!px-9 mx-5 flex min-w-[20rem] !rounded-2xl border-gray-200 px-2 py-4 md:mx-7 md:w-96`,
          isLoading ? 'pointer-events-none opacity-50' : '',
          customClassName,
        )}
        style={cardCustomStyles}
        data-testid="register-card"
      >
        {isLoading ? (
          <Spinner className="my-20 !h-14 w-full !fill-[var(--primary-color)]" />
        ) : (
          <>
            {forgeId && authState.matches('active.web3Connector') && 'TODO'}
            {(authState.matches('active.register.idle') ||
              authState.matches('active.register.termsModal') ||
              authState.matches('active.register.googleLogin') ||
              authState.matches('active.register.sendingEmail')) &&
              UserInfo}
            {(authState.matches('active.register.emailValidation') ||
              authState.matches('active.register.verifyingEmail') ||
              authState.matches('active.register.resendingRegistrationEmail')) &&
              VerifyEmail}
            {(authState.matches('active.register.registerMethodSelection') ||
              authState.matches('active.register.localCCRSign') ||
              authState.matches('active.register.localRCRSign') ||
              authState.matches('active.register.waitingForRCR') ||
              authState.matches('active.register.sendingAuthPublicCredential') ||
              authState.matches('active.register.sendingPublicCredential')) &&
              SelectRegisterMethod}
            {(authState.matches('active.register.createPassword') ||
              authState.matches('active.register.completingRegistration')) &&
              Password}
            {authState.matches('active.register.passkeyCreatedButNotAuthenticated') &&
              PasskeyCreatedButNotAuthenticated}
          </>
        )}
      </Card>
    </div>
  );
};

export default Register;
