import { Locale } from '../helpers/get-dictionary';
import { Text } from 'react-native-ui-lib';
import LoginSteps from './Steps/LoginSteps';
import { useActor } from '@xstate/react';
import React, { useEffect } from 'react';
import InitialStep from './Steps/InitialStep';
import { SessionUser } from '../machine/types';
import RegistrationSteps from './Steps/RegistrationSteps';
import useAuthServiceInstance from '../hooks/useAuthServiceInstance';

export interface AuthProps {
  onSuccess?: (sessionUser: SessionUser) => void;
  cryptoUtils: {
    hashUserInfo: (userInfo: string) => string;
    generateSecureHash: (
      data: string,
      salt: string,
      keyDerivationFunction: 'argon2d' | 'pbkdf2',
    ) => Promise<string>;
  };
}

const Auth = ({ onSuccess, cryptoUtils }: AuthProps) => {
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);

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
      {authState.matches('active.initial') && <InitialStep />}
      {authState.matches('active.register') && (
        <RegistrationSteps cryptoUtils={cryptoUtils} />
      )}
    </>
  );
};

export default Auth;
