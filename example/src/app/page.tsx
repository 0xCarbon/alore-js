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

  const derivePasswordAndGetKeyshares = ({
    password,
    email,
  }: {
    password: string;
    email: string;
  }) => {
    if (keyshareWorker) {
      keyshareWorker.postMessage({
        method: 'derive-password',
        payload: { password, email },
      });
    }
  };

  return (
    <main>
      <KeyshareWorkerProvider>
        <Auth
          locale='pt'
          googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
          cloudflareKey={process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY || ''}
          cryptoUtils={{ hashUserInfo, generateSecureHash }}
          machineServices={aloreAuth.services}
          derivePassword={derivePasswordAndGetKeyshares}
          onSuccess={(user) => {
            console.log('User logged in:', user);
          }}
        />
      </KeyshareWorkerProvider>
    </main>
  );
}
