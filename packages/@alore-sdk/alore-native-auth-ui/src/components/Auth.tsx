import { Locale } from '../helpers/get-dictionary';
import { useActor } from '@xstate/react';
import React, { useEffect } from 'react';
import InitialStep from './Steps/InitialStep';
import { SessionUser } from '../machine/types';
import RegistrationSteps from './Steps/RegistrationSteps';
import useAuthServiceInstance from '../hooks/useAuthServiceInstance';
import { Text } from 'react-native-ui-lib';
<<<<<<< Updated upstream

export interface AuthProps {
  googleId?: string;
  onSuccess?: (sessionUser: SessionUser) => void;
}

const Auth = ({ googleId, onSuccess }: AuthProps) => {
=======
import { GoogleOAuthProvider } from '@react-oauth/google';

export interface AuthProps {
  onSuccess?: (sessionUser: SessionUser) => void;
}

const Auth = ({ onSuccess }: AuthProps) => {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      {authState.matches('active.initial') && <InitialStep />}
      {/* {authState.matches('active.login') && (
        <Login
          locale={locale}
          authServiceInstance={authServiceInstance}
          forgeId={forgeId}
          cryptoUtils={cryptoUtils}
          keyshareWorker={keyshareWorker}
          logoImage={logoImage}
        />
      )} */}
      {/* {authState.matches('active.register') && ( */}
      {/* <Register
        locale={locale}
        // cryptoUtils={cryptoUtils}
        // keyshareWorker={keyshareWorker}
        // logoImage={logoImage}
      /> */}
      {/* <InitialStep locale={locale} /> */}
      {/* {authState.matches('active.register') && <RegistrationSteps />} */}
      {/* )} */}
=======
      {/* {authState.matches('active.initial') && <InitialStep />} */}
      {/* {authState.matches('active.register') && <RegistrationSteps />} */}
      <RegistrationSteps />
>>>>>>> Stashed changes
    </>
  );
};

export default Auth;
