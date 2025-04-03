'use client';

import { AuthProvider, AuthProviderConfig } from '@alore/auth-react-ui';

import AuthComponent from '@/components/AuthComponent';

import KeyshareWorkerProvider from '../components/KeyshareWorkerProvider';

export const clientId = process.env.NEXT_PUBLIC_ALORE_CLIENT_ID || '';
export const endpoint = process.env.NEXT_PUBLIC_ALORE_BACKEND_URL || 'https://api.bealore.com/v1';

const aloreConfigs: AuthProviderConfig = {
  locale: 'pt',
  enablePasskeys: false,
  rpDomain: 'http://localhost:3000',
  requireEmailVerification: true,
  requireUsername: false,
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
          <AuthComponent />
        </AuthProvider>
      </KeyshareWorkerProvider>
    </main>
  );
}
