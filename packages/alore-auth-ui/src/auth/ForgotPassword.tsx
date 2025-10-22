'use client';

/* eslint-disable @next/next/no-img-element */
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/20/solid';
import { yupResolver } from '@hookform/resolvers/yup';
import { useActor } from '@xstate/react';
import { Button, Card, Spinner } from 'flowbite-react';
import { Locale } from 'get-dictionary';
import React, { useMemo } from 'react';
import { FieldValues, useForm, useWatch } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';
import * as yup from 'yup';

import { passwordRules, ruleValidation } from '../components/FormRules/helpers';
import { verifyEmptyValues } from '../helpers';
import useDictionary from '../hooks/useDictionary';
import { AuthInstance } from '../machine/types';
import { aloreLogoBlack, authErrorImage } from '../utils';

const InputForm = React.lazy(() => import('../components/InputForm'));
const BackButton = React.lazy(() => import('../components/BackButton'));
const FormRules = React.lazy(() => import('../components/FormRules'));

const envelopIcon = () => <EnvelopeIcon className="size-4 text-gray-500" />;
const lockClosedIcon = () => <LockClosedIcon className="size-4 text-gray-500" />;

export interface ForgotPasswordProps {
  locale?: Locale;
  authServiceInstance: AuthInstance;
  forgeId?: string;
  logoImage?: React.ReactNode;
  cryptoUtils: {
    hashUserInfo: (_userInfo: string) => string;
    generateSecureHash: (
      _data: string,
      _salt: string,
      _keyDerivationFunction: 'argon2d' | 'pbkdf2',
    ) => Promise<string>;
  };
}

const ForgotPassword = ({
  locale = 'pt',
  authServiceInstance,
  forgeId,
  logoImage,
  cryptoUtils,
}: ForgotPasswordProps) => {
  const { hashUserInfo, generateSecureHash } = cryptoUtils;
  const dictionary = useDictionary(locale);
  const forgotPasswordDictionary = dictionary?.auth.forgotPassword;

  const [authState, sendAuth] = useActor(authServiceInstance);
  const { error: errorObj, forgotPasswordSession } = authState.context;

  const displayError = errorObj?.message || '';
  const hasDisplayError = !!displayError;

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
      password: yup.string().required(dictionary?.formValidation.required),
      confirmPassword: yup.string().required(dictionary?.formValidation.required),
    })
    .required();

  const emailDefaultValues: FieldValues = {
    email: '',
  };

  const {
    control: emailControl,
    formState: { errors: emailErrors },
    handleSubmit: handleSubmitEmail,
    getValues: getValuesEmail,
  } = useForm({
    resolver: yupResolver(emailFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: emailDefaultValues,
  });
  useWatch({ control: emailControl, name: ['email'] });

  const passwordDefaultValues: FieldValues = {
    password: '',
    confirmPassword: '',
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
  useWatch({ control: passwordControl, name: ['confirmPassword'] });

  const isLoading = useMemo(
    () =>
      authState.matches('active.forgotPassword.sendingCode') ||
      authState.matches('active.forgotPassword.savingPassword'),
    [authState.value],
  );

  const onSubmitEmail = async (data: typeof emailDefaultValues) => {
    const { email } = data;

    sendAuth({
      type: 'SEND_CODE',
      payload: {
        email,
        locale,
      },
    });
  };

  const onSubmitPassword = async (data: typeof passwordDefaultValues) => {
    const { password } = data;
    const salt = forgotPasswordSession?.salt;
    const token = forgotPasswordSession?.token;
    const { userAgent } = window.navigator;
    const device = hashUserInfo(userAgent);

    if (salt && token) {
      const secureHashArgon2d = await generateSecureHash(password, salt, 'argon2d');

      sendAuth({
        type: 'CONFIRM_PASSWORD',
        payload: {
          salt,
          token,
          passwordHash: secureHashArgon2d,
          device,
        },
      });
    }
  };

  const isPasswordSubmitDisabled = useMemo(() => {
    const passwordValues = getValuesPassword();
    const userInfoValues = { email: getValuesEmail('email') };
    let isValid = true;

    passwordRules.forEach((rule) => {
      if (!ruleValidation(rule, passwordValues, userInfoValues)) {
        isValid = false;
      }
    });

    return !isValid;
  }, [getValuesPassword(), passwordDirtyFields]);

  const getAuthError = () => {
    let authErrorTitle = dictionary?.auth.login?.somethingWrong;
    let authErrorDescription = dictionary?.auth.login?.defaultError;

    // Check for error code first
    if (errorObj?.message) {
      switch (errorObj.message) {
        case 'INVALID_SESSION':
        case 'EXPIRED_SESSION':
          authErrorTitle = forgotPasswordDictionary?.expiredSessionTitle;
          authErrorDescription = forgotPasswordDictionary?.expiredSessionDescription;
          return { authErrorTitle, authErrorDescription };
        case 'EMAIL_NOT_ALLOWED':
          authErrorTitle = dictionary?.auth?.emailDomainNotAllowed;
          return { authErrorTitle, authErrorDescription };
        default:
          break;
      }
    }

    // Fallback to checking the message string
    const lower = displayError.toLowerCase?.();

    if (displayError === 'EMAIL_NOT_ALLOWED') {
      authErrorTitle = dictionary?.auth?.emailDomainNotAllowed;
      return { authErrorTitle, authErrorDescription };
    }

    if (lower?.includes('invalid') || lower?.includes('expired')) {
      authErrorTitle = forgotPasswordDictionary?.invalidLink;
      authErrorDescription = forgotPasswordDictionary?.invalidLinkDescription;
    }

    return { authErrorTitle, authErrorDescription };
  };

  const EmailInputStep = useMemo(() => {
    const { authErrorTitle, authErrorDescription } = getAuthError();
    return (
      <div data-testid="forgot-password-email-step">
        <BackButton
          className="mb-4"
          disabled={isLoading}
          onClick={() => {
            sendAuth('BACK');
            window.history.replaceState({}, '', window.location.pathname);
          }}
        >
          {dictionary?.back}
        </BackButton>
        {hasDisplayError ? (
          <div className="flex flex-col items-center justify-center gap-5">
            <img
              src={authErrorImage}
              alt="error"
              width={70}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="font-poppins text-alr-red text-center text-xl font-bold">
                {authErrorTitle}
              </span>
              <span className="text-alr-grey text-center font-medium">{authErrorDescription}</span>
              {errorObj?.code && (
                <span className="mt-1 text-center text-xs text-gray-500">{`Error code: ${errorObj.code}`}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="font-poppins text-alr-grey mb-5 mt-6 font-bold">
              {forgotPasswordDictionary?.resetPassword}
            </span>
            <span className="text-alr-grey mb-3 text-center font-medium">
              {forgotPasswordDictionary?.resetPasswordDescription}
            </span>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-y-5">
          <form
            className="flex flex-col gap-y-5"
            onSubmit={handleSubmitEmail((data) => onSubmitEmail(data))}
          >
            <InputForm
              className="my-1"
              control={emailControl}
              errors={emailErrors}
              name="email"
              type="text"
              placeholder={dictionary?.auth.login?.enterEmail}
              data-testid="forgot-password-email-input"
              icon={envelopIcon}
              autoFocus
            />

            <Button
              type="submit"
              data-testid="forgot-password-send-button"
              disabled={verifyEmptyValues(getValuesEmail('email'))}
            >
              {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
              {forgotPasswordDictionary?.sendCode}
            </Button>
          </form>
          <div className="h-[0.5px] w-full bg-gray-300" />
          <span className="text-center text-sm font-medium">
            {dictionary?.auth.login?.dontHaveAccount}
            <div
              data-testid="sign-up-button"
              className="cursor-pointer text-[var(--primary-color)] hover:text-[var(--primary-hover)]"
              onClick={() => {
                sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'SIGN_UP']);
              }}
            >
              {dictionary?.auth.login?.signUp}
            </div>
          </span>
        </div>
      </div>
    );
  }, [getValuesEmail(), emailErrors, emailControl, isLoading, displayError]);

  const EmailSentStep = useMemo(
    () => (
      <div data-testid="forgot-password-email-sent-step">
        <BackButton
          className="mb-4"
          disabled={isLoading}
          onClick={() => {
            sendAuth('BACK');
            window.history.replaceState({}, '', window.location.pathname);
          }}
        >
          {dictionary?.back}
        </BackButton>
        <div className="flex flex-col items-center justify-center">
          <span className="font-poppins text-alr-grey mb-5 mt-14 text-center text-xl font-bold">
            {forgotPasswordDictionary?.emailSentTitle}
          </span>
          <span className="text-alr-grey mb-6 w-full text-center font-medium">
            {forgotPasswordDictionary?.emailSentDescription}
          </span>
          <Button
            className="flex w-full items-center justify-center"
            onClick={() => {
              sendAuth('BACK');
              window.history.replaceState({}, '', window.location.pathname);
            }}
            data-testid="back-to-login-button"
          >
            {forgotPasswordDictionary?.backToLogin}
          </Button>
        </div>
      </div>
    ),
    [forgotPasswordDictionary],
  );

  const NewPasswordStep = useMemo(() => {
    const { authErrorTitle, authErrorDescription } = getAuthError();

    return (
      <div data-testid="forgot-password-new-password-step">
        <BackButton
          className="mb-4"
          disabled={isLoading}
          onClick={() => sendAuth('BACK')}
        >
          {dictionary?.back}
        </BackButton>

        {hasDisplayError && (
          <div className="mb-4 flex flex-col items-center justify-center gap-2">
            <img
              src={authErrorImage}
              alt="error"
              width={70}
            />
            <span className="font-poppins text-alr-red text-center text-xl font-bold">
              {authErrorTitle}
            </span>
            <span className="text-alr-grey text-center font-medium">{authErrorDescription}</span>
            {errorObj?.code && (
              <span className="text-center text-xs text-gray-500">{`Error code: ${errorObj.code}`}</span>
            )}
          </div>
        )}

        <div className="flex w-full flex-col">
          <span className="font-poppins text-alr-grey mb-5 text-center text-xl font-bold">
            {forgotPasswordDictionary?.newPasswordTitle}
          </span>
          <span className="text-alr-grey mb-5 text-center text-sm font-medium">
            {forgotPasswordDictionary?.newPasswordDescription}
          </span>
          <form
            onSubmit={handleSubmitPassword((data) => onSubmitPassword(data))}
            className="flex flex-col gap-y-4"
          >
            <InputForm
              control={passwordControl}
              errors={passwordErrors}
              name="password"
              autoFocus
              icon={lockClosedIcon}
              placeholder={forgotPasswordDictionary?.passwordLabel}
              label={forgotPasswordDictionary?.passwordLabel}
              type="password"
              data-testid="forgot-password-password-input"
              disabled={isLoading}
            />

            <InputForm
              control={passwordControl}
              errors={passwordErrors}
              name="confirmPassword"
              placeholder={forgotPasswordDictionary?.confirmPasswordLabel}
              label={forgotPasswordDictionary?.confirmPasswordLabel}
              icon={lockClosedIcon}
              type="password"
              data-testid="forgot-password-confirm-password-input"
              disabled={isLoading}
            />

            <FormRules
              locale={locale}
              className="!gap-y-1 md:!gap-y-2"
              passwordValues={getValuesPassword()}
              userValues={{ email: getValuesEmail('email') }}
            />

            <Button
              data-testid="forgot-password-submit-button"
              type="submit"
              disabled={isPasswordSubmitDisabled || isLoading}
            >
              {isLoading && <Spinner className="mr-3 !h-5 w-full !fill-gray-300" />}
              {forgotPasswordDictionary?.confirmButton}
            </Button>
          </form>
        </div>
      </div>
    );
  }, [
    isPasswordSubmitDisabled,
    passwordControl,
    passwordErrors,
    getValuesPassword(),
    passwordDirtyFields,
    isLoading,
    displayError,
  ]);

  const SuccessStep = useMemo(
    () => (
      <div
        data-testid="forgot-password-success-step"
        className="flex flex-col items-center justify-center"
      >
        <span className="font-poppins text-alr-grey mb-5 mt-14 text-center text-2xl font-semibold">
          {forgotPasswordDictionary?.successTitle}
        </span>
        <span className="text-alr-grey mb-6 w-full text-center font-medium">
          {forgotPasswordDictionary?.successDescription}
        </span>
        <Button
          className="flex w-full items-center justify-center"
          onClick={() => {
            sendAuth('BACK');
            window.history.replaceState({}, '', window.location.pathname);
          }}
          data-testid="back-to-login-success-button"
        >
          {forgotPasswordDictionary?.backToLogin}
        </Button>
      </div>
    ),
    [forgotPasswordDictionary],
  );

  return (
    <div
      className="flex size-full min-h-screen flex-col items-center justify-center gap-y-2 sm:gap-y-7"
      data-testid="forgot-password-page"
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
        logoImage || (
          <img
            src={aloreLogoBlack}
            alt="alore logo"
            width={201}
          />
        )
      )}
      <Card
        className={twMerge(
          `md:child:!px-9 mx-5 flex min-w-[20rem] !rounded-2xl border-gray-200 px-2 py-4 md:mx-7 md:w-96`,
          isLoading ? 'pointer-events-none opacity-50' : '',
        )}
      >
        {isLoading ? (
          <Spinner className="my-20 !h-14 w-full !fill-[var(--primary-color)]" />
        ) : (
          <>
            {authState.matches('active.forgotPassword.idle') && EmailInputStep}
            {authState.matches('active.forgotPassword.codeSent') && EmailSentStep}
            {(authState.matches('active.forgotPassword.newPassword') ||
              authState.matches('active.forgotPassword.savingPassword')) &&
              NewPasswordStep}
            {authState.matches('active.forgotPassword.passwordSaved') && SuccessStep}
          </>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
