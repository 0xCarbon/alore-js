import React, { useEffect, useMemo } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Locale } from '../../get-dictionary';
import { Login } from './Login';
import { authService } from '../machine';
import { useActor } from '@xstate/react';
import { Register } from './Register';
import { SessionUser } from '../machine/types';

export interface AuthProps {
  locale?: Locale;
  machineServices: {};
  cloudflareKey: string;
  googleId: string;
  forgeId?: string;
  inviteToken?: string;
  keyshareWorker: Worker | null;
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

export const Auth = ({
  locale = 'pt',
  machineServices,
  cloudflareKey,
  googleId,
  forgeId,
  inviteToken,
  keyshareWorker,
  cryptoUtils,
  onSuccess,
}: AuthProps) => {
  const authServiceInstance = useMemo(
    () => authService(machineServices),
    [machineServices]
  );
  const [authState, sendAuth] = useActor(authServiceInstance);
  const { googleUser, sessionUser } = authState.context;

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
    <GoogleOAuthProvider clientId={googleId}>
      {authState.matches('active.login') && (
        <Login
          locale={locale}
          authServiceInstance={authServiceInstance}
          cloudflareKey={cloudflareKey}
          forgeId={forgeId}
          cryptoUtils={cryptoUtils}
          keyshareWorker={keyshareWorker}
        />
      )}
      {authState.matches('active.register') && (
        <Register
          locale={locale}
          authServiceInstance={authServiceInstance}
          cloudflareKey={cloudflareKey}
          forgeId={forgeId}
          inviteToken={inviteToken}
          cryptoUtils={cryptoUtils}
          keyshareWorker={keyshareWorker}
        />
      )}
    </GoogleOAuthProvider>
  );
};
