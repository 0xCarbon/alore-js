'use client';

import React from 'react';
import { Button, Card, Spinner } from 'flowbite-react';
import { FieldValues, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowRightIcon, EnvelopeIcon } from '@heroicons/react/20/solid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useActor } from '@xstate/react';
import { LatLngTuple } from 'leaflet';
import { Turnstile } from '@marsidev/react-turnstile';
import { InputOTP, InputForm, BackButton, Map } from '../components';
import { useGoogleLogin } from '@react-oauth/google';
import { CaptchaStatus, NewDeviceInfo, verifyEmptyValues } from '../helpers';
import useDictionary from '../hooks/useDictionary';
import { Locale } from '../../get-dictionary';
import { AuthInstance } from '../machine/types';
// import { KeyshareWorkerContext } from '../../keyshareWorker'; // TODO

const envelopIcon = () => <EnvelopeIcon className='h-4 w-4 text-gray-500' />;

const HARDWARE = 1;
const SOFTWARE = 2;

export interface LoginProps {
  locale?: Locale;
  authServiceInstance: AuthInstance;
  cloudflareKey: string;
  forgeId?: string;
  cryptoUtils: {
    hashUserInfo: (userInfo: string) => string;
    generateSecureHash: (
      data: string,
      salt: string,
      keyDerivationFunction: 'argon2d' | 'pbkdf2'
    ) => Promise<string>;
  };
}

export const Login = ({
  locale = 'pt',
  authServiceInstance,
  cloudflareKey,
  forgeId,
  cryptoUtils,
}: LoginProps) => {
  const { hashUserInfo, generateSecureHash } = cryptoUtils;
  const dictionary = useDictionary(locale);
  const loginDictionary = dictionary?.auth.login;

  // const keyshareWorker: Worker | null = useContext(KeyshareWorkerContext);
  const [secureCode2FA, setSecure2FACode] = useState('');
  const [secureCodeEmail, setSecureCodeEmail] = useState('');
  const [authState, sendAuth] = useActor(authServiceInstance);
  const {
    salt,
    error: authError,
    active2fa,
    registerUser,
    googleOtpCode,
    googleUser,
    sessionUser,
  } = authState.context;
  const [currentDevice, setCurrentDevice] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendEmailCooldown, setSendEmailCooldown] = useState(0);
  const [cooldownMultiplier, setCooldownMultiplier] = useState(1);
  const [newDeviceInfo, setNewDeviceInfo] = useState<NewDeviceInfo>();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      resetEmail();
      sendAuth({
        type: 'GOOGLE_LOGIN',
        googleToken: tokenResponse.access_token,
      });
    },
  });

  const [captchaStatus, setCaptchaStatus] = useState<CaptchaStatus>('idle');
  const [captchaToken, setCaptchaToken] = useState('');

  const handleLogin = () => login();

  console.log({ value: authState.value });
  useEffect(() => {
    console.log({ authState });
    if (authState.matches('active.login.idle')) setCaptchaStatus('idle');
  }, [authState.value]);

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
      authState.matches('active.login.verifyingGoogleLogin') ||
      authState.matches('active.login.resendingConfirmationEmail') ||
      authState.matches('active.web3Connector.verifyingClaimNftEmail2fa') ||
      authState.matches('active.web3Connector.verifyingEmailEligibility'),
    [authState.value]
  );

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
    [active2fa]
  );
  const activeSw2fa = useMemo(
    () => active2fa?.find((item) => item.twoFaTypeId === SOFTWARE),
    [active2fa]
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

  async function startHwAuth(index: number) {
    setLoading(true);
    const { email } = getValuesEmail();
    const { password } = getValuesPassword();
    if (salt && active2fa) {
      const secureHashArgon2d = await generateSecureHash(
        password,
        salt,
        'argon2d'
      );
      const hardwares2fa = active2fa.filter(
        (item) => item.twoFaTypeId === HARDWARE
      );

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
  }

  async function onSubmitEmail(data: typeof emailDefaultValues) {
    setLoading(true);

    const { email } = data;

    // await signOut({ redirect: false });
    sendAuth({ type: 'NEXT', payload: { email } });
    setLoading(false);
  }

  // TODO
  async function derivePasswordAndGetKeyshares(
    password: string,
    email: string
  ) {
    // if (keyshareWorker) {
    //   // eslint-disable-next-line react/destructuring-assignment
    //   keyshareWorker.postMessage({
    //     method: 'derive-password',
    //     payload: { password, email },
    //   });
    // }
  }

  async function onSubmitLogin(data: typeof passwordDefaultValues) {
    setLoading(true);
    const { password } = data;
    const email = getValuesEmail('email') || googleUser?.email;

    if (salt && email) {
      derivePasswordAndGetKeyshares(password, email);
      const secureHashArgon2d = await generateSecureHash(
        password,
        salt,
        'argon2d'
      );

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
      } else {
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
  }

  async function onSubmitSecureCode2FA() {
    setLoading(true);
    const { email } = getValuesEmail();
    const { password } = getValuesPassword();
    if (salt) {
      derivePasswordAndGetKeyshares(password, email);
      const secureHashArgon2d = await generateSecureHash(
        password,
        salt,
        'argon2d'
      );

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
  }

  async function onClickSecureCodeSubmit() {
    setLoading(true);
    const { password } = getValuesPassword();
    const { email } = getValuesEmail();

    if (salt) {
      derivePasswordAndGetKeyshares(password, email);
      const secureHashArgon2d = await generateSecureHash(
        password,
        salt,
        'argon2d'
      );

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
  }

  async function resendSecureCode() {
    setLoading(true);
    const { email } = getValuesEmail();
    const { password } = getValuesPassword();
    if (salt) {
      derivePasswordAndGetKeyshares(password, email);
      const secureHashArgon2d = await generateSecureHash(
        password,
        salt,
        'argon2d'
      );
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
    intervalRef.current = setInterval(
      () => setSendEmailCooldown((state) => state - 1),
      1000
    );
    setCooldownMultiplier((state) => state + 1);
  }

  async function onSubmitSecureCodeEmail() {
    setLoading(true);
    const { email } = getValuesEmail();
    const { password } = getValuesPassword();
    if (salt) {
      derivePasswordAndGetKeyshares(password, email);
      const secureHashArgon2d = await generateSecureHash(
        password,
        salt,
        'argon2d'
      );
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
  }

  const isLoginSubmitDisabled = useMemo(
    () => verifyEmptyValues({ ...getValuesEmail(), ...getValuesPassword() }),
    [
      { ...getValuesEmail(), ...getValuesPassword() },
      { ...emailDirtyFields, ...passwordDirtyFields },
    ]
  );

  const EmailInputStep = useMemo(
    () => (
      <>
        {authError ? (
          <div className='flex flex-col items-center justify-center gap-5'>
            <img src='/assets/auth-error.svg' alt='alore logo' width={70} />
            {authError?.includes('beta') ? (
              <span className='text-center font-poppins text-xl font-bold text-alr-red'>
                {authError}
              </span>
            ) : (
              <>
                <span className='text-center font-poppins text-xl font-bold text-alr-red'>
                  {authError?.includes('Invalid credentials')
                    ? loginDictionary?.invalidEmailPassword
                    : loginDictionary?.somethingWrong}
                </span>
                <span className='text-center font-medium text-alr-grey'>
                  {authError?.includes('Invalid credentials')
                    ? loginDictionary?.invalidEmailPasswordDescription
                    : loginDictionary?.defaultError}
                </span>
              </>
            )}
          </div>
        ) : (
          <h1 className='text-center font-inter text-lg font-bold text-gray-700'>
            {forgeId
              ? loginDictionary?.forgeLogin
              : loginDictionary?.loginAccount}
          </h1>
        )}
        <form
          className='flex flex-col gap-y-5'
          onSubmit={handleSubmitEmail((data) => onSubmitEmail(data))}
        >
          <InputForm
            className='my-1'
            control={emailControl}
            errors={emailErrors}
            name='email'
            placeholder={loginDictionary?.enterEmail}
            data-test='login-email'
            icon={envelopIcon}
          />
          {/* <Link // TODO removed from beta
            href="/forgot-password"
            className="cursor-pointer self-end text-xs font-medium text-alr-red"
            data-test="forgot-password"
          >
            Forgot your password?
          </Link> */}
          <Button
            type='submit'
            data-test='login-button'
            disabled={verifyEmptyValues(getValuesEmail('email'))}
          >
            {isLoading && (
              <Spinner className='mr-3 !h-5 w-full !fill-gray-300' />
            )}
            {loginDictionary?.login}
          </Button>
          <div className='h-[0.5px] w-full bg-gray-300' />
          <Button color='light' onClick={handleLogin} outline>
            <div className='flex flex-row items-center justify-center gap-2'>
              <img src='/assets/google.svg' alt='google logo' width={16} />
              {dictionary?.auth.continueGoogle}
            </div>
          </Button>
          {forgeId && (
            <Button
              color='light'
              onClick={() => sendAuth('LOGIN_WITH_WEB3CONNECTOR')}
              outline
            >
              <div className='flex flex-row items-center justify-center gap-2'>
                <div className='relative flex flex-row'>
                  <img
                    src='/assets/metamask-logo.svg'
                    alt='metamask logo'
                    width={20}
                    className='absolute right-3'
                  />
                  <img
                    src='/assets/wallet-connect-logo.svg'
                    alt='walletconnect logo'
                    width={20}
                  />
                </div>
                Metamask/WalletConnect
              </div>
            </Button>
          )}
          <span className='text-center text-sm font-medium'>
            {loginDictionary?.dontHaveAccount}
            <div
              className='cursor-pointer text-alr-red'
              onClick={() => {
                sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'SIGN_UP']);
              }}
            >
              {loginDictionary?.singUp}
            </div>
          </span>
        </form>
      </>
    ),
    [
      getValuesEmail(),
      isLoginSubmitDisabled,
      emailErrors,
      emailControl,
      isLoading,
    ]
  );

  const PasswordInputStep = useMemo(
    () => (
      <>
        <BackButton className='mb-2.5' onClick={() => sendAuth('BACK')}>
          {getValuesEmail('email') || googleUser?.email}
        </BackButton>
        {authError && (
          <div className='flex flex-col items-center justify-center gap-5'>
            <img src='/assets/auth-error.svg' alt='alore logo' width={70} />
            <span className='text-center font-poppins text-xl font-bold text-alr-red'>
              {authError?.includes('Invalid credentials')
                ? loginDictionary?.invalidEmailPassword
                : loginDictionary?.somethingWrong}
            </span>
            <span className='text-center font-medium text-alr-grey'>
              {authError?.includes('Invalid credentials')
                ? loginDictionary?.invalidEmailPasswordDescription
                : loginDictionary?.defaultError}
            </span>
          </div>
        )}
        <form
          onSubmit={handleSubmitPassword((data) => onSubmitLogin(data))}
          className='flex flex-col gap-y-5'
          data-test='login-password-step'
        >
          <InputForm
            control={passwordControl}
            errors={passwordErrors}
            name='password'
            placeholder={loginDictionary?.enterPassword}
            type='password'
            label={dictionary?.password}
            data-test='login-password'
          />
          {/* <Link // TODO removed from beta
            href="/forgot-password"
            className="cursor-pointer self-end text-xs font-medium text-alr-red"
            data-test="forgot-password"
          >
            Forgot your password?
          </Link> */}
          <Turnstile
            siteKey={cloudflareKey}
            options={{ theme: 'light', language: locale, retry: 'never' }}
            onSuccess={(token: string) => {
              setCaptchaToken(token);
              setCaptchaStatus('success');
            }}
            onError={() => {
              setCaptchaStatus('error');
            }}
            onExpire={() => setCaptchaStatus('expired')}
          />
          <Button
            type='submit'
            data-test='login-submit'
            disabled={
              verifyEmptyValues(getValuesPassword('password')) ||
              captchaStatus !== 'success'
            }
          >
            {isLoading && (
              <Spinner className='mr-3 !h-5 w-full !fill-gray-300' />
            )}
            {loginDictionary?.login}
          </Button>
          <span className='text-sm font-medium'>
            {loginDictionary?.dontHaveAccount}
            <div
              className='cursor-pointer text-alr-red'
              onClick={() => {
                sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'SIGN_UP']);
              }}
            >
              {loginDictionary?.singUp}
            </div>
          </span>
        </form>
      </>
    ),
    [
      getValuesPassword(),
      isLoginSubmitDisabled,
      passwordErrors,
      passwordControl,
      isLoading,
    ]
  );

  const VerifyEmail = useMemo(
    () => (
      <div className='pb-10 pt-4'>
        <BackButton disabled={isLoading} onClick={() => sendAuth('BACK')} />
        <div
          className='flex w-full flex-col items-center'
          data-test='login-verify-email-step'
        >
          <span className='mb-10 mt-[4.5rem] font-poppins text-[1.75rem] font-bold text-alr-grey'>
            {loginDictionary?.verifyEmail}
          </span>
          <span className='mb-12 w-[23.75rem] text-center font-medium text-alr-grey'>
            {loginDictionary?.verifyEmailDescription}
          </span>

          <div className='mb-6 flex'>
            <InputOTP
              className='child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9'
              value={secureCode2FA}
              onChange={(value) => setSecure2FACode(value)}
              inputLength={6}
              data-test='secure-code'
              errorMessage={
                authError?.includes('wrong')
                  ? loginDictionary?.wrongCode
                  : undefined
              }
              disabled={isLoading}
            />
          </div>
          <Button
            data-test='secure-code-submit'
            onClick={() => onClickSecureCodeSubmit()}
            className='mb-6 w-full'
            disabled={secureCode2FA.length !== 6 || isLoading}
          >
            {isLoading && (
              <Spinner className='mr-3 !h-5 w-full !fill-gray-300' />
            )}
            {loginDictionary?.confirmCode}
          </Button>
          <span
            onClick={() => resendSecureCode()}
            className={`${
              sendEmailCooldown > 0
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer opacity-100 hover:text-alr-red'
            } text-base font-medium duration-300`}
          >
            {`${loginDictionary?.resendCode}${
              sendEmailCooldown ? ` (${sendEmailCooldown}s)` : ''
            }`}
          </span>
        </div>
      </div>
    ),
    [secureCode2FA, sendEmailCooldown, isLoading, authState]
  );

  const VerifyHw2FAStep = useMemo(
    () => (
      <div>
        <BackButton onClick={() => sendAuth('BACK')} />
        {authError?.includes('Failed authenticating with hardware key') ? (
          <div className='mt-6 flex w-full flex-col items-center gap-6'>
            <img alt='fingerprint error' src='/assets/fingerprint-error.svg' />
            <span className='text-center font-poppins text-[1.3rem] font-bold text-alr-red'>
              {loginDictionary?.cantVerify2fa}
            </span>
            <Button className='w-full' onClick={() => startHwAuth(0)}>
              {loginDictionary?.tryAgain}
            </Button>
            {activeHw2fa?.length > 1 && (
              <>
                <span>{loginDictionary?.tryHardware}</span>
                <div
                  className='flex cursor-pointer items-center gap-x-1 text-base font-semibold text-alr-red'
                  onClick={() => startHwAuth(1)}
                >
                  {loginDictionary?.useAnotherHardware}
                  <ArrowRightIcon className='h-5 w-5' />
                </div>
              </>
            )}
            {activeSw2fa && (
              <div
                className='flex cursor-pointer items-center gap-x-1 text-base font-semibold text-alr-red'
                onClick={() => sendAuth('USE_SOFTWARE_2FA')}
              >
                {loginDictionary?.useSw2fa}
                <ArrowRightIcon className='h-5 w-5' />
              </div>
            )}
          </div>
        ) : (
          <div className='flex w-full flex-col items-center'>
            <span className='mb-10 mt-[3rem] text-center font-poppins text-[1.3rem] font-bold text-alr-grey'>
              {loginDictionary?.touchHardware}
            </span>
            <span className='mb-10 w-[15rem] text-sm font-normal text-alr-grey'>
              {loginDictionary?.touchHardwareDescription}
            </span>
            <img alt='usb indicator' src='/assets/fingerprint.png' />
            {activeSw2fa && (
              <div
                className='mt-9 flex cursor-pointer items-center gap-x-1 text-base font-semibold text-alr-red'
                onClick={() => sendAuth('USE_SOFTWARE_2FA')}
              >
                {loginDictionary?.useSw2fa}
                <ArrowRightIcon className='h-5 w-5' />
              </div>
            )}
          </div>
        )}
      </div>
    ),
    [isLoading, active2fa]
  );

  const VerifySw2FAStep = useMemo(
    () => (
      <div>
        <BackButton onClick={() => sendAuth('BACK')} />
        <div className='flex w-full flex-col items-center'>
          <span className='mb-10 mt-[3rem] text-center font-poppins text-[1.3rem] font-bold text-alr-grey'>
            {loginDictionary?.inform2FACode}
          </span>

          <div className='mb-6 flex'>
            <InputOTP
              className='child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9'
              value={secureCode2FA}
              onChange={(value) => setSecure2FACode(value)}
              data-test='secure-code-2FA'
              inputLength={6}
              errorMessage={
                authError?.includes('Invalid 2FA code')
                  ? loginDictionary?.wrongCode
                  : undefined
              }
            />
          </div>
          <Button
            data-test='secure-code-2FA-submit'
            onClick={() => onSubmitSecureCode2FA()}
            className='mb-6 w-full'
            disabled={secureCode2FA.length !== 6}
          >
            {isLoading && (
              <Spinner className='mr-3 !h-5 w-full !fill-gray-300' />
            )}
            {loginDictionary?.confirmCode}
          </Button>
          {active2fa?.find((item) => item.twoFaTypeId === HARDWARE) && (
            <div
              className='mt-9 flex cursor-pointer items-center gap-x-1 text-base font-semibold text-alr-red'
              onClick={() => sendAuth('USE_HARDWARE_2FA')}
            >
              {loginDictionary?.useHw2fa}
              <ArrowRightIcon className='h-5 w-5' />
            </div>
          )}
        </div>
      </div>
    ),
    [secureCode2FA, isLoading, active2fa]
  );

  const NewDeviceStep = useMemo(
    () => (
      <div>
        <div className='flex w-full flex-col items-center'>
          <span className='mb-5 mt-14 font-poppins text-[1.75rem] font-bold text-alr-grey'>
            {loginDictionary?.newDevice}
          </span>
          <span className='mb-3 w-[23.75rem] text-center font-medium text-alr-grey'>
            {loginDictionary?.verifyEmailDescription}
          </span>
          <span className='mb-5 font-bold'>{getValuesEmail('email')}</span>
          <div className='mb-5 h-44 w-full'>
            {newDeviceInfo?.coordinates && (
              <Map
                coordinates={
                  newDeviceInfo?.coordinates as unknown as LatLngTuple
                }
              />
            )}
          </div>
          <div className='mb-6 flex'>
            <InputOTP
              className='child:gap-x-3 md:child:gap-x-5 [&>div>input]:!h-9 [&>div>input]:!w-9'
              value={secureCodeEmail}
              onChange={(value) => setSecureCodeEmail(value)}
              data-test='secure-code-email'
              inputLength={6}
              errorMessage={
                authError?.includes('Wrong code')
                  ? loginDictionary?.wrongCode
                  : undefined
              }
            />
          </div>
          <Button
            data-test='secure-code-email-submit'
            onClick={() => onSubmitSecureCodeEmail()}
            className='mb-6 w-full'
            disabled={secureCodeEmail.length !== 6}
          >
            {isLoading && (
              <Spinner className='mr-3 !h-5 w-full !fill-gray-300' />
            )}
            {loginDictionary?.confirmCode}
          </Button>
          <span
            onClick={() => resendSecureCode()}
            className={`${
              sendEmailCooldown > 0
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer opacity-100 hover:text-alr-red'
            } text-base font-medium duration-300`}
          >
            {`${loginDictionary?.resendCode}${
              sendEmailCooldown ? ` (${sendEmailCooldown}s)` : ''
            }`}
          </span>
        </div>
      </div>
    ),
    [secureCodeEmail, sendEmailCooldown, isLoading, newDeviceInfo]
  );

  return (
    <div
      className='flex h-full min-h-screen w-full flex-col items-center justify-center gap-y-2 sm:gap-y-7'
      data-test='login-page'
    >
      {forgeId ? (
        <div className='flex flex-col'>
          <span className='text-center font-poppins text-2xl font-black text-alr-grey'>
            Tardezinha com Thiaguinho
          </span>
          <div className='flex w-full flex-row items-center justify-center gap-2'>
            <span className='font-inter text-sm font-medium text-gray-900'>
              {dictionary?.auth.poweredBy}
            </span>
            <img
              src='/assets/alore-logo-black.svg'
              alt='alore logo'
              width='60'
            />
          </div>
        </div>
      ) : (
        <img
          src='/assets/alore-logo-black.svg'
          alt='alore logo'
          width={authState.matches('active.login.newDevice') ? 153 : 201}
        />
      )}
      <Card
        className={`flex min-w-[20rem] md:w-96 ${
          isLoading ? 'pointer-events-none opacity-50' : ''
        } mx-5 py-2 md:mx-7 md:child:!px-9`}
      >
        {forgeId && authState.matches('active.web3Connector') && 'TODO'}
        {(authState.matches('active.login.idle') ||
          authState.matches('active.login.googleLogin') ||
          authState.matches('active.login.retrievingSalt')) &&
          EmailInputStep}
        {(authState.matches('active.login.inputPassword') ||
          authState.matches('active.login.verifyingGoogleLogin') ||
          authState.matches('active.login.verifyingLogin')) &&
          PasswordInputStep}
        {(authState.matches('active.login.email2fa') ||
          authState.matches('active.login.resendingEmailCode') ||
          authState.matches('active.login.verifyingEmail2fa')) &&
          VerifyEmail}
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
        {authState.matches('active.login.successfulLogin') && (
          <div className='flex flex-row gap-2 justify-center items-center'>
            <span>Login complete for</span>
            <span className='font-semibold'>{sessionUser?.nickname}</span>
          </div>
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
