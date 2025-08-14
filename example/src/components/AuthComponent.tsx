/* eslint-disable no-unused-vars */
import { Auth, useAuthService } from '@alore/auth-react-ui';

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
      }}
    />
  );
}
