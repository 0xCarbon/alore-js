/* eslint-disable no-unused-vars */
import { Auth, useAuthService } from '@alore/auth-react-ui';
import Image from 'next/image';

import jooriLogo from '../../public/JooriPro.png';

export default function AuthComponent() {
  const [state, actor] = useAuthService();

  console.info('Current State:', state.value);
  console.info('Context', state.context);

  return (
    <Auth
      googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
      onLogin={(user) => {
        console.info('User logged in:', user);
      }}
      onRegister={(user) => {
        console.info('User registered:', user);
      }}
      onError={(error) => {
        console.info('Error:', error);
        if (
          typeof error === 'object' &&
          'message' in error &&
          error.message === 'User not allowed to register with email'
        ) {
          // do something
        }
      }}
      styles={{
        primaryColor: '#3a3a3a',
        logoImage: (
          <Image
            data-test="alore-logo"
            src={jooriLogo}
            alt="aloreLogo"
            className="w-24"
          />
        ),
      }}
    />
  );
}
