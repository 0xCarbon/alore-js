'use client';

import { aloreAuth } from '@/config/authInstance';
import KeyshareWorkerProvider from '../components/KeyshareWorker';
import { AuthProvider } from '@0xcarbon/alore-auth-ui';

import AuthComponent from '@/components/AuthComponent';

export default function Home() {
  return (
    <main>
      <KeyshareWorkerProvider>
        <AuthProvider machineServices={aloreAuth.services}>
          <AuthComponent />
        </AuthProvider>
      </KeyshareWorkerProvider>
    </main>
  );
}
