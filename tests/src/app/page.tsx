'use client';

import Auth, { AuthProvider, AuthProviderConfig } from '@alore/auth-react-ui';

import KeyshareWorkerProvider, { keyshareWorker } from './KeyshareWorkerProvider';

export const clientId = process.env.NEXT_PUBLIC_ALORE_CLIENT_ID || '';
export const endpoint = process.env.NEXT_PUBLIC_ALORE_BACKEND_URL || 'https://api.bealore.com/v1';

const aloreConfigs: AuthProviderConfig = {
  locale: 'pt',
  enablePasskeys: true,
  enablePasswords: false,
  rpDomain: 'http://localhost:3000',
  requireEmailVerification: true,
  requireUsername: true,
  passwordMinLength: 8,
};

export default function Home() {
  return (
    <main>
      <KeyshareWorkerProvider>
        <AuthProvider
          clientId={clientId}
          aloreBaseUrl={endpoint}
          config={aloreConfigs}
        >
          <Auth
            keyshareWorker={keyshareWorker}
            googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
            onSuccess={(user) => {
              console.log('User logged in:', user);
            }}
          />
        </AuthProvider>
      </KeyshareWorkerProvider>
    </main>
  );
}
