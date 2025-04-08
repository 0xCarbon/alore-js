import Auth, { useAuthService } from '@alore/auth-react-ui';

export default function AuthComponent() {
  // eslint-disable-next-line no-unused-vars
  const [state, actor] = useAuthService();

  console.log('Current State:', state.value);
  console.log('Context', state.context);
  console.log();

  return (
    <Auth
      googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
      onSuccess={(user) => {
        console.log('User logged in:', user);
      }}
    />
  );
}
