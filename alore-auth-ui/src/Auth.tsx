'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Login } from './auth/Login';
import { useActor } from '@xstate/react';
import { Register } from './auth/Register';
import { SessionUser } from './machine/types';
import { Locale } from 'get-dictionary';
import { Spinner } from 'flowbite-react';
import useAuthServiceInstance from './hooks/useAuthServiceInstance';

const TURNSTILE_PUBLIC_SITE_KEY = '0x4AAAAAAANlE5h6quNYoHFV';

export interface AuthProps {
  locale?: Locale;
  googleId: string;
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
  onSuccess?: (sessionUser: SessionUser) => void;
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
  const { googleUser, sessionUser } = authState.context;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (googleUser) {
      sendAuth([
        { type: 'INITIALIZE', forgeId },
        'LOGIN',
        'ADVANCE_TO_PASSWORD',
      ]);
    } else sendAuth([{ type: 'INITIALIZE', forgeId }, 'LOGIN']);

    return () => {
      sendAuth('RESET');
    };
  }, []);

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
            <div className='flex h-full min-h-screen w-full flex-col items-center justify-center'>
              <Spinner className='m-auto !h-12 w-full !fill-gray-300' />
            </div>
          }
        >
          {authState.matches('active.login') && (
            <Login
              locale={locale}
              authServiceInstance={authServiceInstance}
              cloudflareKey={TURNSTILE_PUBLIC_SITE_KEY}
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
              cloudflareKey={TURNSTILE_PUBLIC_SITE_KEY}
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
