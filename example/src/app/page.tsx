'use client';

import KeyshareWorkerProvider, {
  KeyshareWorkerContext,
} from './KeyshareWorker';
import { AloreAuth } from 'alore-auth-sdk';
import { Auth } from 'alore-auth-ui/src/auth';
import { hashUserInfo, generateSecureHash } from 'alore-crypto-sdk';
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
