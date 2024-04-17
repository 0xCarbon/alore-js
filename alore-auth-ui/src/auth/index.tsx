import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Locale } from '../../get-dictionary';
import Login from './Login';

export interface AuthProps {
  locale?: Locale;
  machineServices: {};
  cloudflareKey: string;
  googleId: string;
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

export const Auth = ({
  locale = 'pt',
  machineServices,
  cloudflareKey,
  googleId,
  forgeId,
  cryptoUtils,
}: AuthProps) => {
  return (
    <GoogleOAuthProvider clientId={googleId}>
      <Login
        locale={locale}
        machineServices={machineServices}
        cloudflareKey={cloudflareKey}
        forgeId={forgeId}
        cryptoUtils={cryptoUtils}
      />
    </GoogleOAuthProvider>
  );
};
