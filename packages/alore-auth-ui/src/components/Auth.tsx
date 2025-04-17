'use client';

import { generateSecureHash, hashUserInfo } from '@alore/auth-react-sdk';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useActor } from '@xstate/react';
import { createTheme, Spinner, ThemeProvider } from 'flowbite-react';
import React, { Suspense, useEffect, useMemo, useState } from 'react';

import Login from '../auth/Login';
import Register from '../auth/Register';
import { darkenHexColor } from '../helpers';
import useAuthServiceInstance from '../hooks/useAuthServiceInstance';
import { SessionUser } from '../machine/types';
import { buttonTheme, checkboxTheme, textInputTheme } from '../styles/themes';

export interface AuthProps {
  googleId: string;
  forgeId?: string;
  styles?: {
    primaryColor: string;
  };
  logoImage?: React.ReactNode;
  inviteToken?: string;
  keyshareWorker?: Worker | null;
  onSuccess?: (_sessionUser: SessionUser) => void;
  onError?: (_error: string) => void;
}

const Auth = ({
  googleId,
  forgeId,
  styles,
  logoImage,
  inviteToken,
  keyshareWorker,
  onSuccess,
  // eslint-disable-next-line no-unused-vars
  onError,
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
  }, []);

  useEffect(() => {
    if (googleUser) {
      sendAuth([{ type: 'INITIALIZE', forgeId }, 'LOGIN', 'ADVANCE_TO_PASSWORD']);
    }

    if (!sessionUser) {
      sendAuth(['RESET', 'INITIALIZE', 'LOGIN']);
    }
  }, []);

  useEffect(() => {
    if (socialProviderRegisterUser) {
      sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'SIGN_UP', 'ADVANCE_TO_PASSWORD']);
    }
  }, [socialProviderRegisterUser]);

  useEffect(() => {
    if (
      (authState.matches('active.login.successfulLogin') ||
        authState.matches('active.register.userCreated')) &&
      sessionUser
    ) {
      onSuccess?.(sessionUser);
    }
  }, [sessionUser]);

  return isClient ? (
    <div
      style={
        {
          '--primary-color': primaryColor,
          '--primary-hover': primaryColorHover,
        } as React.CSSProperties
      }
    >
      <GoogleOAuthProvider clientId={googleId}>
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
                  logoImage={logoImage}
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
                  logoImage={logoImage}
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
