import { generateSecureHash, hashUserInfo } from '@alore/auth-react-sdk';
import Auth, { useAuthService } from '@alore/auth-react-ui';
import { useContext } from 'react';

import { KeyshareWorkerContext } from './KeyshareWorker';

export default function AuthComponent() {
  const keyshareWorker: null | Worker = useContext(KeyshareWorkerContext);
  const [state, actor] = useAuthService();

  console.log('state', state);
  console.log('actor', actor);

  return (
    <Auth
      locale="pt"
      googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
      cryptoUtils={{ hashUserInfo, generateSecureHash }}
      keyshareWorker={keyshareWorker}
      onSuccess={(user) => {
        console.log('User logged in:', user);
      }}
    />
  );
}
