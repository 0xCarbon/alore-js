/* eslint-disable no-unused-vars */
import Auth, { useAuthService } from '@alore/auth-react-ui';

export default function AuthComponent() {
  const [state, actor] = useAuthService();

  console.info('Current State:', state.value);
  console.info('Context', state.context);

  return (
    <Auth
      googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
      onSuccess={(user) => {
        console.info('User logged in:', user);
      }}
    />
  );
}
