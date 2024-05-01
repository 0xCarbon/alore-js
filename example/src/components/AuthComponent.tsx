import Auth, { useAuthService } from '@0xcarbon/alore-auth-ui';
import { useContext } from 'react';
import { KeyshareWorkerContext } from './KeyshareWorker';
import { hashUserInfo, generateSecureHash } from '@0xcarbon/alore-auth-sdk';

export default function AuthComponent() {
  const keyshareWorker: null | Worker = useContext(KeyshareWorkerContext);
  const [state, actor] = useAuthService();

  console.log(state, actor);

  return (
    <Auth
      locale='pt'
      googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
      cryptoUtils={{ hashUserInfo, generateSecureHash }}
      keyshareWorker={keyshareWorker}
      onSuccess={(user) => {
        console.log('User logged in:', user);
      }}
    />
  );
}
