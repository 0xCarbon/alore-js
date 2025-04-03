import Auth, { useAuthService } from '@alore/auth-react-ui';
import { useContext } from 'react';

import { KeyshareWorkerContext } from './KeyshareWorkerProvider';

export default function AuthComponent() {
  const keyshareWorker: null | Worker = useContext(KeyshareWorkerContext);
  // eslint-disable-next-line no-unused-vars
  const [state, actor] = useAuthService();

  console.log('Current State:', state.value);
  console.log('Context', state.context);
  console.log();

  return (
    <Auth
      googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
      keyshareWorker={keyshareWorker}
      onSuccess={(user) => {
        console.log('User logged in:', user);
      }}
    />
  );
}
