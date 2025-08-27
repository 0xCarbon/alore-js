'use client';

import { AuthProvider, AuthProviderConfig } from '@alore/auth-react-ui';

import AuthComponent from '@/components/AuthComponent';

import KeyshareWorkerProvider from '../components/KeyshareWorkerProvider';

const clientId = process.env.NEXT_PUBLIC_ALORE_CLIENT_ID || '';
const endpoint = process.env.NEXT_PUBLIC_ALORE_BACKEND_URL || 'https://api.bealore.com/v1';

const aloreConfigs: AuthProviderConfig = {
  locale: 'pt',
  enablePasskeys: true,
  rpDomain: 'http://localhost:3000',
  requireEmailVerification: true,
  requireUsername: false,
  passwordMinLength: 8,
  enablePasswords: true,
  // Example: restrict to a domain or multiple
  allowedEmailDomains: ['gmail.com'],
  allowedDomainBypassEmails: ['cadu@bealore.com'],
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
