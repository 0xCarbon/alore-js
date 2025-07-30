'use client';

import Auth, { AuthProvider, AuthProviderConfig, useAuthService } from '@alore/auth-react-ui';
import { useSearchParams } from 'next/navigation';

import KeyshareWorkerProvider, { keyshareWorker } from './KeyshareWorkerProvider';

const CLIENT_ID = process.env.NEXT_PUBLIC_ALORE_CLIENT_ID || '';
const ENDPOINT = process.env.NEXT_PUBLIC_ALORE_BACKEND_URL || 'https://api.bealore.com/v1';

const defaultAloreConfigs: AuthProviderConfig = {
  locale: 'pt',
  enablePasskeys: true,
  enablePasswords: false,
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

const LoggedState = () => {
  const [authState, sendAuth] = useAuthService();
  const { sessionUser } = authState.context;

  const logout = () => {
    sendAuth(['RESET_CONTEXT', 'RESET', 'INITIALIZE']);
  };

  if (!sessionUser) {
    return null;
  }

  return (
    <button
      type="button"
      data-testid="logout-button"
      className="rounded-md bg-red-500 p-3 text-white"
      onClick={logout}
    >
      Logout
    </button>
  );
};

export default function Home() {
  const searchParams = useSearchParams();

  const aloreConfigs = searchParams.get('aloreConfigs')
    ? JSON.parse(searchParams.get('aloreConfigs') as string)
    : defaultAloreConfigs;

  return (
    <KeyshareWorkerProvider>
      <AuthProvider
        clientId={CLIENT_ID}
        aloreBaseUrl={ENDPOINT}
        config={aloreConfigs}
      >
        <Auth
          keyshareWorker={keyshareWorker}
          styles={{
            primaryColor: '#E64848',
          }}
          googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
          onSuccess={(user) => {
            console.info('User logged in:', user);
          }}
        />
        <LoggedState />
      </AuthProvider>
    </KeyshareWorkerProvider>
  );
}
