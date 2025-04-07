'use client';

import { generateSecureHash, hashUserInfo } from '@alore/auth-react-sdk';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useActor } from '@xstate/react';
import { Spinner } from 'flowbite-react';
import React, { Suspense, useEffect, useState } from 'react';

import { Login } from '../auth/Login';
import { Register } from '../auth/Register';
import useAuthServiceInstance from '../hooks/useAuthServiceInstance';
import { SessionUser } from '../machine/types';

export interface AuthProps {
  googleId: string;
  forgeId?: string;
  logoImage?: React.ReactNode;
  inviteToken?: string;
  keyshareWorker?: Worker | null;
  onSuccess?: (_sessionUser: SessionUser) => void;
  _onError?: (_error: string) => void;
}

const Auth = ({
  googleId,
  forgeId,
  logoImage,
  inviteToken,
  keyshareWorker,
  onSuccess,
  _onError,
}: AuthProps) => {
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const { googleUser, sessionUser, registerUser, authProviderConfigs } = authState.context;
  const { locale } = authProviderConfigs || {};

  const [isClient, setIsClient] = useState(false);

  const msalConfig = {
    auth: {
      clientId: process.env.NEXT_PUBLIC_MICROSOFT_ID || '',
      authority: 'https://login.microsoftonline.com/common',
    },
  };

  const msalInstance = new PublicClientApplication(msalConfig);

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
    } else sendAuth([{ type: 'INITIALIZE', forgeId }, 'LOGIN']);

    return () => {
      sendAuth('RESET');
    };
  }, []);

  useEffect(() => {
    if (registerUser) {
      sendAuth(['RESET', { type: 'INITIALIZE', forgeId }, 'SIGN_UP', 'ADVANCE_TO_PASSWORD']);
    }
  }, [registerUser]);

  useEffect(() => {
    if (
      (authState.matches('active.login.successfulLogin') ||
        authState.matches('active.register.userCreated')) &&
      sessionUser
    ) {
      onSuccess?.(sessionUser);
    }
  }, [sessionUser]);

  return (
    isClient && (
      <GoogleOAuthProvider clientId={googleId}>
        <MsalProvider instance={msalInstance}>
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
        </MsalProvider>
      </GoogleOAuthProvider>
    )
  );
};

export default Auth;
