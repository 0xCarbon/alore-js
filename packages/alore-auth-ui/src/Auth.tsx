'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { useActor } from '@xstate/react';
import { Spinner } from 'flowbite-react';
import { Locale } from 'get-dictionary';
import React, { Suspense, useEffect, useState } from 'react';

import { Login } from './auth/Login';
import { Register } from './auth/Register';
import useAuthServiceInstance from './hooks/useAuthServiceInstance';
import { SessionUser } from './machine/types';

export interface AuthProps {
  locale?: Locale;
  googleId: string;
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
  onSuccess?: (_sessionUser: SessionUser) => void;
}

const Auth = ({
  locale = 'pt',
  googleId,
  forgeId,
  logoImage,
  inviteToken,
  keyshareWorker,
  cryptoUtils,
  onSuccess,
}: AuthProps) => {
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const { googleUser, sessionUser, registerUser } = authState.context;
  const [isClient, setIsClient] = useState(false);

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
      </GoogleOAuthProvider>
    )
  );
};

export default Auth;
