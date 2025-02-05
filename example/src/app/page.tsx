'use client';

import { AuthProvider } from '@alore/auth-react-ui';

import AuthComponent from '@/components/AuthComponent';
import { aloreAuth } from '@/config/authInstance';

import KeyshareWorkerProvider from '../components/KeyshareWorker';

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
