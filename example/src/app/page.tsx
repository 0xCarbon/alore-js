'use client';

import KeyshareWorkerProvider, {
  KeyshareWorkerContext,
} from './KeyshareWorker';
import {
  AloreAuth,
  hashUserInfo,
  generateSecureHash,
} from '@0xcarbon/alore-auth-sdk';
import { Auth } from '@0xcarbon/alore-auth-ui';
import { useContext } from 'react';

export default function Home() {
  const aloreAuth = new AloreAuth('MY_API_KEY', {
    endpoint: 'http://localhost:8000/v1',
  });

  const keyshareWorker: null | Worker = useContext(KeyshareWorkerContext);

  return (
    <main>
      <KeyshareWorkerProvider>
        <Auth
          locale='pt'
          googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
          cryptoUtils={{ hashUserInfo, generateSecureHash }}
          machineServices={aloreAuth.services}
          keyshareWorker={keyshareWorker}
          onSuccess={(user) => {
            console.log('User logged in:', user);
          }}
        />
      </KeyshareWorkerProvider>
    </main>
  );
}
