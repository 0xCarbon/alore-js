'use client';

import Auth, { AuthProvider, AuthProviderConfig } from '@alore/auth-react-ui';
import { Usable, use } from 'react';

import KeyshareWorkerProvider, { keyshareWorker } from './KeyshareWorkerProvider';

export const clientId = process.env.NEXT_PUBLIC_ALORE_CLIENT_ID || '';
export const endpoint = process.env.NEXT_PUBLIC_ALORE_BACKEND_URL || 'https://api.bealore.com/v1';

const defaultAloreConfigs: AuthProviderConfig = {
  locale: 'pt',
  enablePasskeys: false,
  enablePasswords: true,
  rpDomain: 'http://localhost:3000',
  requireEmailVerification: true,
  requireUsername: true,
  passwordMinLength: 8,
  socialProviders: [
    {
      id: 'google',
      providerName: 'google',
      clientId: process.env.NEXT_PUBLIC_GOOGLE_ID || '',
    },
    {
      id: 'microsoft',
      providerName: 'microsoft',
      clientId: process.env.NEXT_PUBLIC_MICROSOFT_ID || '',
    },
  ],
};

interface SearchParams {
  aloreConfigs?: string;
}

export default function Home({ searchParams }: { searchParams: Usable<SearchParams> }) {
  const resolvedSearchParams = use(searchParams);

  const aloreConfigs = resolvedSearchParams.aloreConfigs
    ? JSON.parse(resolvedSearchParams.aloreConfigs)
    : defaultAloreConfigs;

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
              console.info('User logged in:', user);
            }}
          />
        </AuthProvider>
      </KeyshareWorkerProvider>
    </main>
  );
}
