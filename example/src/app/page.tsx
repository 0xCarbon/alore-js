'use client';

import KeyshareWorkerProvider, {
  KeyshareWorkerContext,
} from './KeyshareWorker';
import {
  AloreAuth,
  hashUserInfo,
  generateSecureHash,
} from '@0xcarbon/alore-auth-sdk';
import dynamic from 'next/dynamic';

const Auth = dynamic(
  () => import('@0xcarbon/alore-auth-ui').then((mod) => mod),
  {
    ssr: false,
  }
);

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
          googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
          cloudflareKey={process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY || ''}
          cryptoUtils={{ hashUserInfo, generateSecureHash }}
          locale='pt'
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
