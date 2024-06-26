'use client';

import React from 'react';
import { Button, Card, Spinner } from 'flowbite-react';
import { FieldValues, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useActor } from '@xstate/react';
import { ArrowRightIcon, EnvelopeIcon } from '@heroicons/react/20/solid';
import jwt_decode from 'jwt-decode';
import { KeyIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { randomBytes } from 'crypto';
import { passwordRules, ruleValidation } from '../components/FormRules/helpers';
import { useGoogleLogin } from '@react-oauth/google';
import { verifyEmptyValues } from '../helpers';
import useDictionary from '../hooks/useDictionary';
import { AuthInstance } from '../machine/types';
import {
  aloreLogoBlack,
  google,
  metamaskLogo,
  walletConnectLogo,
} from '../utils';
import { Locale } from 'get-dictionary';
import { twMerge } from 'tailwind-merge';

const InputForm = React.lazy(() => import('../components/InputForm'));
const InputOTP = React.lazy(() => import('../components/InputOTP'));
const BackButton = React.lazy(() => import('../components/BackButton'));
const CheckboxForm = React.lazy(() => import('../components/CheckboxForm'));
const TermsModal = React.lazy(() => import('../components/TermsModal'));
const FormRules = React.lazy(() => import('../components/FormRules'));

const envelopIcon = () => <EnvelopeIcon className='h-4 w-4 text-gray-500' />;

export interface RegisterProps {
  locale?: Locale;
  authServiceInstance: AuthInstance;
  forgeId?: string;
  logoImage?: React.ReactNode;
  inviteToken?: string;
  keyshareWorker?: Worker | null;
  cryptoUtils: {
    hashUserInfo: (userInfo: string) => string;
    generateSecureHash: (
      data: string,
      salt: string,
      keyDerivationFunction: 'argon2d' | 'pbkdf2'
    ) => Promise<string>;
  };
}

export const Register = ({
  locale = 'pt',
  authServiceInstance,
  forgeId,
  logoImage,
  inviteToken,
  keyshareWorker,
  cryptoUtils,
}: RegisterProps) => {
  const { hashUserInfo, generateSecureHash } = cryptoUtils;
  const dictionary = useDictionary(locale);
  const registerDictionary = dictionary?.auth.register;
  const [secureCode, setSecureCode] = useState('');
  const [sendEmailCooldown, setSendEmailCooldown] = useState(0);
  const [cooldownMultiplier, setCooldownMultiplier] = useState(1);
  const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false);
  const [credentialExtensionsOnCreate, setCredentialExtensionsOnCreate] =
    useState({});
  const [credentialExtensionsOnGet, setCredentialExtensionsOnGet] = useState(
    {}
  );
  const [blobToWriteInPasskey, setBlobToWriteInPasskey] =
    useState<ArrayBuffer | null>(null);
  const [authState, sendAuth] = useActor(authServiceInstance);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const {
    salt,
    error: authError,
    registerUser,
    googleUser,
    sessionUser,
    CCRPublicKey,
    RCRPublicKey,
  } = authState.context;
  const [userSalt, setUserSalt] = useState('');
  const [registrationMethod, setRegistrationMethod] = useState('password');
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      resetUserInfo();
      sendAuth({
        type: 'GOOGLE_LOGIN',
        googleToken: tokenResponse.access_token,
      });
    },
  });

  const handleLogin = () => login();

  const isIPhone = (userAgent: string) => {
    if (userAgent.toLowerCase().match(/iphone/i)) {
      setCredentialExtensionsOnCreate({
        largeBlob: {
          support: 'required',
        },
      });
      const blob = new Uint8Array(randomBytes(32));
      setBlobToWriteInPasskey(blob);
      setCredentialExtensionsOnGet({
        largeBlob: {
          write: blob,
        },
      });
      return true;
    }
    return false;
  };

  const isAndroid = (userAgent: string) => {
    if (userAgent.toLowerCase().match(/android/i)) {
      setCredentialExtensionsOnCreate({
        prf: {},
      });
      setCredentialExtensionsOnGet({
        prf: { eval: { first: new TextEncoder().encode('Alore') } },
      });
      return true;
    }
    return false;
  };

  const hasPasskeySupportWithPRFOrLargeBlob = () => {
    const { userAgent } = window.navigator;
    if (
      window.PublicKeyCredential &&
      // eslint-disable-next-line no-undef
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
      // eslint-disable-next-line no-undef
      PublicKeyCredential.isConditionalMediationAvailable
    ) {
      Promise.all([
        // eslint-disable-next-line no-undef
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
        // eslint-disable-next-line no-undef
        PublicKeyCredential.isConditionalMediationAvailable(),
      ]).then((results) => {
        if (
          results.every((r) => r === true) &&
          (isIPhone(userAgent) || isAndroid(userAgent))
        ) {
          setIsPasskeyEnabled(true);
        }
      });
    }
  };

  const selectRegisterMethod = () => {
    if (registrationMethod === 'password') {
      sendAuth('SELECT_PASSWORD');
    } else {
      const nickname = registerUser
        ? registerUser.nickname
        : userInfoGetValues('nickname');
      const email = registerUser
        ? registerUser.email
        : userInfoGetValues('email');
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
    if (authState.matches('active.register.localSigningPasskeyRegister')) {
      const email = registerUser
        ? registerUser.email
        : userInfoGetValues('email');
      const nickname = registerUser
        ? registerUser.nickname
        : userInfoGetValues('nickname');
      const device = hashUserInfo(window.navigator.userAgent);

      const publicKey = CCRPublicKey?.publicKey;

      if (publicKey) {
        const registerCredential = (await navigator.credentials
          .create({
            publicKey: {
              challenge: Buffer.from(publicKey.challenge, 'base64'),
              rp: {
                name: publicKey.rp.name,
              },
              user: {
                id: Buffer.from(publicKey.user.id, 'base64'),
                name: email,
                displayName: nickname,
              },
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
              authenticatorSelection: {
                authenticatorAttachment: 'platform',
                requireResidentKey: true,
              },
              extensions: credentialExtensionsOnCreate,
            },
          })
          .catch(() => {
            sendAuth('BACK');
            // eslint-disable-next-line no-undef
          })) as PublicKeyCredential;

        if (registerCredential) {
          if (
            // @ts-ignore
            !registerCredential?.publicKey?.extensions?.prf &&
            // @ts-ignore
            registerCredential?.publicKey?.extensions?.largeBlob
          ) {
            sendAuth({
              type: 'FORCE_PASSWORD_METHOD',
              payload: {
                email,
              },
            });
          } else {
            sendAuth({
              type: 'FINISH_PASSKEY_REGISTER',
              payload: {
                passkeyRegistration: {
                  id: registerCredential.id,
                  rawId: Buffer.from(registerCredential.rawId).toString(
                    'base64'
                  ),
                  response: {
                    attestationObject: Buffer.from(
                      // eslint-disable-next-line no-undef
                      (
                        registerCredential.response as AuthenticatorAttestationResponse
                      ).attestationObject
                    ).toString('base64'),
                    clientDataJSON: Buffer.from(
                      // eslint-disable-next-line no-undef
                      (
                        registerCredential.response as AuthenticatorAttestationResponse
                      ).clientDataJSON
                    ).toString('base64'),
                  },
                  type: 'public-key',
                },
                email,
                device,
                nickname,
              },
            });
          }
        }
      }
    }
  };

  const finishPasskeyFirstAuth = async () => {
    if (authState.matches('active.register.localSigningPasskeyAuth')) {
      const publicKey = RCRPublicKey?.publicKey;

      if (publicKey) {
        const firstLoginCredential = (await navigator.credentials
          .get({
            publicKey: {
              challenge: Buffer.from(publicKey.challenge, 'base64'),
              rpId: publicKey.rpId,
              extensions: credentialExtensionsOnGet,
            },
          })
          .catch(() => {
            sendAuth('BACK');
            // eslint-disable-next-line no-undef
          })) as PublicKeyCredential;

        if (firstLoginCredential) {
          const email = registerUser
            ? registerUser.email
            : userInfoGetValues('email');

          sendAuth({
            type: 'FINISH_PASSKEY_AUTH',
            payload: {
              passkeyAuth: {
                id: firstLoginCredential.id,
                rawId: Buffer.from(firstLoginCredential.rawId).toString(
                  'base64'
                ),
                response: {
                  authenticatorData: Buffer.from(
                    // eslint-disable-next-line no-undef
                    (
                      firstLoginCredential.response as AuthenticatorAssertionResponse
                    ).authenticatorData
                  ).toString('base64'),
                  clientDataJSON: Buffer.from(
                    // eslint-disable-next-line no-undef
                    (
                      firstLoginCredential.response as AuthenticatorAssertionResponse
                    ).clientDataJSON
                  ).toString('base64'),
                  signature: Buffer.from(
                    // eslint-disable-next-line no-undef
                    (
                      firstLoginCredential.response as AuthenticatorAssertionResponse
                    ).signature
                  ).toString('base64'),
                  userHandle: Buffer.from(
                    // @ts-ignore
                    firstLoginCredential.response.userHandle || [0]
                  ).toString('base64'),
                },
                type: 'public-key',
              },
            },
          });
          if (keyshareWorker) {
            const secretFromCredential =
              // @ts-ignore
              firstLoginCredential.getClientExtensionResults().prf
                ? // @ts-ignore
                  firstLoginCredential.getClientExtensionResults().prf.results
                    .first
                : blobToWriteInPasskey;

            keyshareWorker.postMessage({
              method: 'derive-password',
              payload: {
                password: new TextDecoder().decode(secretFromCredential),
                email,
              },
            });
          }
        }
      }
    }
  };

  useEffect(() => {
    finishPasskeyFirstAuth();
  }, [authState.matches('active.register.localSigningPasskeyAuth')]);

  const userInfoFormSchema = yup
    .object({
      email: yup
        .string()
        .required(dictionary?.formValidation.required)
        .email(dictionary?.formValidation.invalidEmail),
      nickname: yup
        .string()
        .matches(/^[a-zA-Z].*$/, dictionary?.formValidation.validName)
        .max(40)
        .required(dictionary?.formValidation.required),
      agreedWithTerms: yup
        .boolean()
        .isTrue(dictionary?.formValidation.agreeTerms),
    })
    .required();

  const passwordFormSchema = yup
    .object({
      password: yup.string().required(dictionary?.formValidation.required),
      confirmPassword: yup
        .string()
        .required(dictionary?.formValidation.required),
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
    defaultValues: userInfoDefaultValues,
  });

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
      authState.matches('active.register.localSigningPasskeyRegister') ||
      authState.matches('active.register.localSigningPasskeyAuth') ||
      authState.matches('active.register.retrievingCCR') ||
      authState.matches('active.register.retrievingRCR') ||
      authState.matches('active.register.sendingPublicCredential') ||
      authState.matches('active.register.sendingAuthPublicCredential') ||
      authState.matches('active.web3Connector.verifyingClaimNftEmail2fa') ||
      authState.matches('active.web3Connector.verifyingEmailEligibility'),
    [authState.value]
  );

  useEffect(() => {
    if (registerUser) {
      sendAuth([
        { type: 'INITIALIZE', forgeId },
        'SIGN_UP',
        'ADVANCE_TO_PASSWORD',
      ]);
    } else sendAuth([{ type: 'INITIALIZE', forgeId }, 'SIGN_UP']);

    if (typeof window !== 'undefined') hasPasskeySupportWithPRFOrLargeBlob();
  }, []);

  useEffect(() => {
    finishPasskeyRegistration();
  }, [authState.matches('active.register.localSigningPasskeyRegister')]);

  useEffect(() => {
    if (inviteToken) {
      try {
        const decoded: { email: string; nickname: string; salt: string } =
          jwt_decode(inviteToken);
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
    intervalRef.current = setInterval(
      () => setSendEmailCooldown((state) => state - 1),
      1000
    );
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
          nickname,
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
      : userInfoGetValues('email');
    const nickname = registerUser
      ? registerUser.nickname
      : userInfoGetValues('nickname');
    const { userAgent } = window.navigator;
    const device = hashUserInfo(userAgent);
    const saltWallet = registerUser ? registerUser.salt : salt || userSalt;

    if (saltWallet) {
      if (keyshareWorker) {
        keyshareWorker.postMessage({
          method: 'derive-password',
          payload: { password, email },
        });
        const secureHashArgon2d = await generateSecureHash(
          password,
          saltWallet,
          'argon2d'
        );

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
  }

  const isUserInfoSubmitDisabled = useMemo(
    () => verifyEmptyValues(userInfoGetValues()),
    [userInfoGetValues(), userInfoDirtyFields]
  );

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

  const UserInfo = useMemo(
    () => (
      <>
        {inviteToken ? (
          <div className='flex flex-col gap-2.5'>
            <h1 className='mb-1 text-center text-[1.75rem] font-bold text-alr-grey'>
              {registerDictionary?.welcome}
            </h1>
            <div className='mb-5 text-gray-600'>
              {registerDictionary?.invitedBy}
              <span className='font-semibold'> 0xCarbon </span>
              {registerDictionary?.toJoin}
              <span className='text-alr-red'> Alore.</span>
            </div>
          </div>
        ) : (
          <h1 className='mb-1 text-center font-inter font-semibold text-gray-600 md:text-lg'>
            {forgeId
              ? registerDictionary?.forgeTitle
              : registerDictionary?.title}
          </h1>
        )}
        {authError?.includes('beta') && (
          <span className='text-center font-poppins text-xl font-bold text-alr-red'>
            {authError}
          </span>
        )}
        <form
          onSubmit={userInfoHandleSubmit((data) => onSubmitUserData(data))}
          className='mb-1 flex flex-col gap-y-5'
          data-test='register-new-account-step'
        >
          <InputForm
            control={userInfoControl}
            errors={userInfoErrors}
            name='email'
            type='email'
            placeholder={
              inviteToken
                ? `${registerDictionary?.emailInvitePlaceholder}`
                : `${registerDictionary?.emailLabel}`
            }
            data-test='register-email'
            icon={envelopIcon}
            autoFocus
            disabled={isLoading || !!inviteToken}
          />

          <InputForm
            control={userInfoControl}
            errors={userInfoErrors}
            name='nickname'
            type={'text'}
            placeholder={registerDictionary?.nicknameLabel}
            data-test='register-first-name'
            disabled={isLoading}
          />
          <CheckboxForm
            className='flex items-center justify-center'
            control={userInfoControl}
            name='agreedWithTerms'
            data-test='register-agreed-with-terms'
            label={
              <span className='text-xs font-light text-gray-400 md:text-sm md:font-normal'>
                {registerDictionary?.agreeTermsPart1}
                <span
                  onClick={() => sendAuth('SHOW_TERMS_MODAL')}
                  className='cursor-pointer text-alr-red underline'
                  data-test='terms-of-service'
                >
                  {registerDictionary?.agreeTermsPart2}
                </span>
              </span>
            }
          />

          <Button
            data-test='register-button'
            type='submit'
            disabled={isUserInfoSubmitDisabled || isLoading}
            className='group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white duration-300 bg-alr-red hover:bg-alr-dark-red border border-transparent focus:ring-red-300 disabled:hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:disabled:hover:bg-red-600 rounded-lg focus:ring-2 enabled:hover:bg-red-700 dark:enabled:hover:bg-red-700'
          >
            {isLoading && (
              <Spinner className='mr-3 !h-5 w-full !fill-gray-300' />
            )}
            {registerDictionary?.buttonStart}
          </Button>
        </form>
        <div
          className='flex w-full cursor-pointer flex-row items-center justify-center gap-1.5 text-sm text-gray-500'
          onClick={() => {
            sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'LOGIN']);
          }}
        >
          <span className='font-inter font-semibold'>
            {registerDictionary?.alreadyHaveAccount}
          </span>
          <ArrowRightIcon className='h-4 w-4' />
        </div>
        {forgeId && (
          <>
            <div className='h-[0.5px] w-full bg-gray-300' />
            <Button color='light' onClick={handleLogin} outline>
              <div className='flex flex-row items-center justify-center gap-2'>
                <img src={google} alt='google logo' width={16} />
                {dictionary?.auth.continueGoogle}
              </div>
            </Button>
            <Button
              color='light'
              onClick={() => sendAuth('LOGIN_WITH_WEB3CONNECTOR')}
              outline
            >
              <div className='flex flex-row items-center justify-center gap-2'>
                <div className='relative flex flex-row'>
                  <img
                    src={metamaskLogo}
                    alt='metamask logo'
                    width={20}
                    className='absolute right-3'
                  />
                  <img
                    src={walletConnectLogo}
                    alt='walletconnect logo'
                    width={20}
                  />
                </div>
                Metamask/WalletConnect
              </div>
            </Button>
          </>
        )}
      </>
    ),
    [
      isUserInfoSubmitDisabled,
      userInfoControl,
      userInfoErrors,
      userInfoGetValues(),
      userInfoDirtyFields,
      isLoading,
    ]
  );

  const VerifyEmail = useMemo(
    () => (
      <>
        <BackButton disabled={isLoading} onClick={() => sendAuth('BACK')} />

        <div
          className='flex w-full flex-col items-center'
          data-test='register-verify-email-step'
        >
          <span className='mb-6 font-poppins text-2xl font-bold text-alr-grey md:text-[1.75rem]'>
            {registerDictionary?.verifyEmail}
          </span>
          <span className='mb-6 w-full text-center font-medium text-alr-grey'>
            {registerDictionary?.informCode}
          </span>

          <div className='mb-6 flex'>
            <InputOTP
              className='child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9'
              value={secureCode}
              onChange={(value) => setSecureCode(value)}
              inputLength={6}
              data-test='secure-code'
              errorMessage={
                authError?.includes('wrong')
                  ? `${registerDictionary?.wrongCode}`
                  : undefined
              }
              disabled={isLoading}
            />
          </div>
          <Button
            data-test='secure-code-submit'
            onClick={() => onClickSecureCodeSubmit()}
            className='group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white duration-300 bg-alr-red hover:bg-alr-dark-red border border-transparent focus:ring-red-300 disabled:hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:disabled:hover:bg-red-600 rounded-lg focus:ring-2 enabled:hover:bg-red-700 dark:enabled:hover:bg-red-700 mb-6 w-full'
            disabled={secureCode.length !== 6 || isLoading}
          >
            {isLoading && (
              <Spinner className='mr-3 !h-5 w-full !fill-gray-300' />
            )}
            {registerDictionary?.confirmCode}
          </Button>
          <span
            onClick={() => resendSecureCode()}
            className={twMerge(
              `text-base font-medium duration-300`,
              sendEmailCooldown > 0
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer opacity-100 hover:text-alr-red'
            )}
          >
            {`${registerDictionary?.resendCode}${
              sendEmailCooldown ? ` (${sendEmailCooldown}s)` : ''
            }`}
          </span>
        </div>
      </>
    ),
    [secureCode, sendEmailCooldown, isLoading]
  );

  const SelectRegisterMethod = useMemo(
    () => (
      <div>
        <BackButton disabled={isLoading} onClick={() => sendAuth('BACK')} />
        <div
          className='flex w-full flex-col items-center'
          data-test='register-method-selection-step'
        >
          {isLoading && <Spinner className='mr-3 !h-5 w-full !fill-gray-300' />}
          <span className='mb-6 font-poppins text-2xl font-bold text-alr-grey md:text-[1.75rem]'>
            {registerDictionary?.selectMethodTitle}
          </span>
          <span className='mb-6 w-full text-center font-medium text-alr-grey'>
            {registerDictionary?.selectMethodDescription}
          </span>
          <div className='flex flex-col gap-5'>
            <div className='flex w-full gap-2'>
              <Button
                data-test='register-method-selection-password'
                onClick={() => setRegistrationMethod('password')}
                color='light'
                className={`${
                  registrationMethod === 'password'
                    ? '!border-alr-red'
                    : '!border-gray-500'
                } w-full cursor-pointer items-start border focus:ring-0 child:h-full`}
              >
                <div className='flex flex-col items-start justify-center gap-2'>
                  <LockOpenIcon
                    className={`${
                      registrationMethod === 'password'
                        ? 'text-alr-red'
                        : 'text-gray-500'
                    } h-7 w-7`}
                  />
                  <span className='font-semibold text-gray-900'>
                    {registerDictionary?.password}
                  </span>
                  <span className='text-start text-xs font-normal text-gray-600'>
                    {registerDictionary?.selectMethodPassword}
                  </span>
                </div>
              </Button>
              <Button
                data-test='register-method-selection-passkey'
                disabled
                onClick={() => setRegistrationMethod('passkey')}
                color='light'
                className={`${
                  registrationMethod === 'passkey'
                    ? '!border-alr-red'
                    : '!border-gray-500'
                } w-full cursor-pointer items-start border focus:ring-0 child:h-full`}
              >
                <div className='flex flex-col items-start justify-center gap-2'>
                  <KeyIcon
                    className={`${
                      registrationMethod === 'passkey'
                        ? 'text-alr-red'
                        : 'text-gray-500'
                    } h-7 w-7`}
                  />
                  <span className='font-semibold text-gray-900'>
                    {registerDictionary?.passkey}
                  </span>
                  <span className='text-start text-xs font-normal text-gray-600'>
                    {registerDictionary?.selectMethodPasskey}
                  </span>
                </div>
              </Button>
            </div>
            <Button
              data-test='register-method-selection-submit'
              onClick={() => selectRegisterMethod()}
              className='mb-6 flex w-full cursor-pointer items-center bg-alr-red text-alr-white'
            >
              {registerDictionary?.continue}
            </Button>
          </div>
        </div>
      </div>
    ),
    [isLoading, registrationMethod]
  );

  const Password = useMemo(
    () => (
      <>
        <BackButton
          disabled={isLoading}
          onClick={() =>
            sendAuth(inviteToken || registerUser ? 'BACK_TO_IDLE' : 'BACK')
          }
        >
          {userInfoGetValues('email')}
        </BackButton>

        <div
          className='flex w-full flex-col'
          data-test='register-password-step'
        >
          <span className='mb-5 text-center font-poppins font-bold text-alr-grey'>
            {registerDictionary?.createPassword}
          </span>
          <form
            onSubmit={passwordHandleSubmit((data) => onSubmitPassword(data))}
            className='flex flex-col gap-y-4'
          >
            <InputForm
              control={passwordControl}
              errors={passwordErrors}
              name='password'
              autoFocus
              placeholder={registerDictionary?.passwordPlaceholder}
              label={registerDictionary?.passwordLabel}
              type='password'
              data-test='register-password'
              disabled={isLoading}
            />

            <InputForm
              control={passwordControl}
              errors={passwordErrors}
              name='confirmPassword'
              placeholder={registerDictionary?.passwordConfirmPlaceholder}
              label={registerDictionary?.passwordConfirmLabel}
              type='password'
              data-test='register-confirm-password'
              disabled={isLoading}
            />

            <FormRules
              locale={locale}
              className='!gap-y-1 md:!gap-y-2'
              passwordValues={passwordGetValues()}
              userValues={registerUser || userInfoGetValues()}
            />

            <Button
              data-test='password-submit'
              type='submit'
              className='group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white duration-300 bg-alr-red hover:bg-alr-dark-red border border-transparent focus:ring-red-300 disabled:hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:disabled:hover:bg-red-600 rounded-lg focus:ring-2 enabled:hover:bg-red-700 dark:enabled:hover:bg-red-700'
              disabled={isPasswordSubmitDisabled || isLoading}
            >
              {isLoading && (
                <Spinner className='mr-3 !h-5 w-full !fill-gray-300' />
              )}
              {dictionary?.next}
            </Button>
          </form>
        </div>
      </>
    ),
    [
      isPasswordSubmitDisabled,
      passwordControl,
      passwordErrors,
      passwordGetValues(),
      passwordDirtyFields,
      isLoading,
      registerUser,
    ]
  );

  return (
    <div
      className='flex h-full min-h-screen w-full flex-col items-center justify-center gap-y-2 sm:gap-y-7'
      data-test='register-page'
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
        <div className='flex flex-col'>
          <span className='text-center font-poppins text-2xl font-black text-alr-grey'>
            Tardezinha com Thiaguinho
          </span>
          <div className='flex w-full flex-row items-center justify-center gap-2'>
            <span className='font-inter text-sm font-medium text-gray-900'>
              {dictionary?.auth.poweredBy}
            </span>
            <img src={aloreLogoBlack} alt='alore logo' width='60' />
          </div>
        </div>
      ) : (
        logoImage || (
          <img
            src={aloreLogoBlack}
            alt='alore logo'
            width={authState.matches('active.login.newDevice') ? 153 : 201}
          />
        )
      )}
      <Card
        className={twMerge(
          `flex min-w-[20rem] md:w-96 mx-5 py-2 md:mx-7 md:child:!px-9`,
          isLoading ? 'pointer-events-none opacity-50' : ''
        )}
      >
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
          authState.matches('active.register.localSigningPasskeyRegister') ||
          authState.matches('active.register.localSigningPasskeyAuth') ||
          authState.matches('active.register.retrievingCCR') ||
          authState.matches('active.register.retrievingRCR') ||
          authState.matches('active.register.sendingAuthPublicCredential') ||
          authState.matches('active.register.sendingPublicCredential')) &&
          SelectRegisterMethod}
        {(authState.matches('active.register.createPassword') ||
          authState.matches('active.register.completingRegistration')) &&
          Password}
        {authState.matches('active.register.userCreated') && (
          <div className='flex flex-col justify-center items-center gap-4'>
            <div className='flex flex-row gap-2 justify-center items-center'>
              <span>Registration complete for</span>
              <span className='font-semibold'>{sessionUser?.nickname}</span>
            </div>
            <Button
              className='group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white duration-300 bg-alr-red hover:bg-alr-dark-red border border-transparent focus:ring-red-300 disabled:hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:disabled:hover:bg-red-600 rounded-lg focus:ring-2 enabled:hover:bg-red-700 dark:enabled:hover:bg-red-700'
              onClick={() => sendAuth(['RESET_CONTEXT', 'INITIALIZE'])}
            >
              LOGOUT
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
