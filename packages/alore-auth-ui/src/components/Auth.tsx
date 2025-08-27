'use client';

import { generateSecureHash, hashUserInfo } from '@alore/auth-react-sdk';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useActor } from '@xstate/react';
import { createTheme, Spinner, ThemeProvider } from 'flowbite-react';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { StateValue } from 'xstate';

import Login from '../auth/Login';
import Register from '../auth/Register';
import { darkenHexColor } from '../helpers';
import useAuthServiceInstance from '../hooks/useAuthServiceInstance';
import { SessionUser } from '../machine/types';
import { buttonTheme, checkboxTheme, textInputTheme } from '../styles/themes';

export type AuthError = {
  code?: string;
  message?: string;
  email?: string;
  data?: any;
};

export interface AuthProps {
  googleId?: string;
  forgeId?: string;
  styles?: {
    primaryColor: string;
    logoImage?: React.ReactNode;
  };
  inviteToken?: string;
  keyshareWorker?: Worker | null;
  onLogin?: (_sessionUser: SessionUser) => void;
  onRegister?: (_sessionUser: SessionUser) => void;
  onError?: (_error: string | AuthError) => void;
  onGoBack?: () => void;
}

const Auth = ({
  googleId,
  forgeId,
  styles,
  inviteToken,
  keyshareWorker,
  onLogin,
  onRegister,
  // eslint-disable-next-line no-unused-vars
  onError,
  onGoBack,
}: AuthProps) => {
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const { googleUser, sessionUser, authProviderConfigs, socialProviderRegisterUser } =
    authState.context;
  const { locale } = authProviderConfigs || {};

  const [isClient, setIsClient] = useState(false);

  const msalConfig = {
    auth: {
      clientId: process.env.NEXT_PUBLIC_MICROSOFT_ID || '',
      authority: 'https://login.microsoftonline.com/common',
    },
  };

  const msalInstance = new PublicClientApplication(msalConfig);

  const primaryColor = styles?.primaryColor || '#090909';
  const primaryColorHover = darkenHexColor(primaryColor, 25);

  const customTheme = useMemo(
    () =>
      createTheme({
        button: buttonTheme,
        checkbox: checkboxTheme,
        textInput: textInputTheme,
      }),
    [primaryColor, primaryColorHover],
  );

  const cryptoUtils = {
    generateSecureHash,
    hashUserInfo,
  };

  useEffect(() => {
    setIsClient(true);

    if (googleUser) {
      sendAuth([{ type: 'INITIALIZE', forgeId }, 'LOGIN', 'ADVANCE_TO_PASSWORD']);
      return;
    }

    if (!sessionUser) {
      sendAuth(['CLEAR_ERROR', 'RESET', 'INITIALIZE']);
    }

    return () => {
      sendAuth(['CLEAR_ERROR']);
    };
  }, []);

  useEffect(() => {
    sendAuth(['CLEAR_ERROR', 'RESET', 'INITIALIZE']);
  }, [authProviderConfigs]);

  useEffect(() => {
    if (socialProviderRegisterUser) {
      sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'SIGN_UP', 'ADVANCE_TO_PASSWORD']);
    }
  }, [socialProviderRegisterUser]);

  // Fire callbacks only when transitioning from a verifying state to success (not on hydration)
  const prevStateValueRef = React.useRef(authState.value);
  useEffect(() => {
    const matchesValue = (value: StateValue, path: string): boolean => {
      const parts = path.split('.');
      let current = value;
      for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i];
        if (typeof current === 'string') {
          return current === part && i === parts.length - 1;
        }
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return false;
        }
      }
      return true;
    };

    const prev = prevStateValueRef.current;

    const cameFromLoginVerification =
      matchesValue(prev, 'active.login.verifyingLogin') ||
      matchesValue(prev, 'active.login.verifyingEmail2fa') ||
      matchesValue(prev, 'active.login.verifyingHwAuth') ||
      matchesValue(prev, 'active.login.verifying2faCode') ||
      matchesValue(prev, 'active.login.verifyingCode') ||
      matchesValue(prev, 'active.login.verifyingRegisterPublicKeyCredential') ||
      matchesValue(prev, 'active.login.verifyingGoogleLogin');

    if (
      sessionUser &&
      authState.matches('active.login.successfulLogin') &&
      cameFromLoginVerification
    ) {
      onLogin?.(sessionUser);
      prevStateValueRef.current = authState.value;
      return;
    }

    const cameFromRegisterVerification =
      matchesValue(prev, 'active.register.completingRegistration') ||
      matchesValue(prev, 'active.register.sendingAuthPublicCredential') ||
      matchesValue(prev, 'active.register.sendingPublicCredential');

    if (
      sessionUser &&
      authState.matches('active.register.userCreated') &&
      cameFromRegisterVerification
    ) {
      onRegister?.(sessionUser);
    }

    prevStateValueRef.current = authState.value;
  }, [authState.value, sessionUser]);

  useEffect(() => {
    if (authState.event.type === 'BACK') {
      onGoBack?.();
    }
    if (typeof onError === 'function') {
      const err = authState.context.error;
      const info = (authState.context as any).errorInfo as AuthError | undefined;
      if (info && (info.code || info.message)) {
        onError(info);
      } else if (err && typeof err === 'string') {
        onError({ message: err });
      }
    }
  }, [authState.event, onGoBack]);

  return isClient ? (
    <div
      style={
        {
          '--primary-color': primaryColor,
          '--primary-hover': primaryColorHover,
        } as React.CSSProperties
      }
    >
      <GoogleOAuthProvider clientId={googleId || ''}>
        <MsalProvider instance={msalInstance}>
          <ThemeProvider
            theme={customTheme}
            props={{
              button: {
                pill: true,
              },
            }}
          >
            <Suspense
              fallback={
                <div className="flex size-full min-h-screen flex-col items-center justify-center">
                  <Spinner className="m-auto !h-12 w-full !fill-gray-300" />
                </div>
              }
            >
              {authState.matches('active.login') && (
                <Login
                  locale={locale}
                  authServiceInstance={authServiceInstance}
                  forgeId={forgeId}
                  cryptoUtils={cryptoUtils}
                  keyshareWorker={keyshareWorker}
                  logoImage={styles?.logoImage}
                />
              )}
              {authState.matches('active.register') && (
                <Register
                  locale={locale}
                  authServiceInstance={authServiceInstance}
                  forgeId={forgeId}
                  inviteToken={inviteToken}
                  cryptoUtils={cryptoUtils}
                  keyshareWorker={keyshareWorker}
                  logoImage={styles?.logoImage}
                />
              )}
            </Suspense>
          </ThemeProvider>
        </MsalProvider>
      </GoogleOAuthProvider>
    </div>
  ) : null;
};

export default Auth;
