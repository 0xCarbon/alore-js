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
      title="Bem-vindo!"
      logoContainerClassName="[&>img]:max-w-[75px] [&>img]:mb-3 pl-7"
      titleClassName="text-4xl text-[#333333] font-medium"
      customClassName="border-none shadow-none [&>div]:!py-0 pt-2"
      contentAlignment="left"
      loginTitle="Insira o seu email para continuar"
      loginTitleClassName="text-[#252525] text-gray-700"
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
    />
  );
}
