import { Locale } from '../helpers/get-dictionary';
import { useActor } from '@xstate/react';
import React, { useEffect } from 'react';
import InitialStep from './Steps/InitialStep';
import { SessionUser } from '../machine/types';
import RegistrationSteps from './Steps/RegistrationSteps';
import useAuthServiceInstance from '../hooks/useAuthServiceInstance';
import { Text } from 'react-native-ui-lib';
import { GoogleOAuthProvider } from '@react-oauth/google';

export interface AuthProps {
  onSuccess?: (sessionUser: SessionUser) => void;
}

const Auth = ({ onSuccess }: AuthProps) => {
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  // const { googleUser, sessionUser } = authState.context;

  useEffect(() => {
    sendAuth([{ type: 'INITIALIZE' }]);

    return () => {
      sendAuth('RESET');
    };
  }, []);

  // useEffect(() => {
  // if (
  //   (authState.matches('active.login.successfulLogin') ||
  //     authState.matches('active.register.userCreated')) &&
  //   sessionUser
  // ) {
  //   onSuccess?.(sessionUser);
  // }
  // }, [sessionUser]);

  console.log(authState.value);

  return (
    <>
      {/* {authState.matches('active.initial') && <InitialStep />} */}
      {/* {authState.matches('active.register') && <RegistrationSteps />} */}
      <RegistrationSteps />
    </>
  );
};

export default Auth;
