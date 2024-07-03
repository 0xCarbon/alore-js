import React, { useEffect, useState } from 'react';
import InitialStep from './Steps/InitialStep';
import { SessionUser } from '../machine/types';
import RegistrationSteps from './Steps/RegistrationSteps';
import useAuthServiceInstance from '../hooks/useAuthServiceInstance';
import { stepStyles } from './Steps/styles';
import { RecursivePartial } from '../types';
import { mergeStyles } from '../helpers';
import { Toast } from 'react-native-ui-lib/src/incubator';
import useDictionary from '../hooks/useDictionary';
import { useActor } from '@xstate/react';
import LoginSteps from './Steps/LoginSteps';

export interface AuthProps {
  styles?: RecursivePartial<typeof stepStyles>;
  onSuccess?: (sessionUser: SessionUser) => void;
  toast?: boolean;
  cryptoUtils: {
    hashUserInfo: (userInfo: string) => string;
    generateSecureHash: (
      data: string,
      salt: string,
      keyDerivationFunction: 'argon2d' | 'pbkdf2',
    ) => Promise<string>;
  };
}

const Auth = ({ styles, onSuccess, toast = true, cryptoUtils }: AuthProps) => {
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const { sessionUser, error: authError, locale } = authState.context;

  const dictionary = useDictionary(locale);

  const [showToast, setShowToast] = useState(false);

  const mergedStyles = mergeStyles(stepStyles, styles || {});

  const returnErrorMessage = () => {
    let errorMessage = dictionary?.errors?.somethingWrong;

    if (authError?.includes('Invalid credentials')) {
      errorMessage = dictionary?.errors?.invalidEmailPassword;
    } else if (authError?.includes('Wrong')) {
      errorMessage = dictionary?.errors?.wrongCode;
    }

    return errorMessage;
  };

  useEffect(() => {
    if (authError) {
      setShowToast(true);
    }
  }, [authError]);

  useEffect(() => {
    sendAuth([{ type: 'INITIALIZE' }]);
  }, []);

  useEffect(() => {
    if (authState.matches('active.signedOn') && sessionUser) {
      onSuccess?.(sessionUser);
    }
  }, [sessionUser]);

  return (
    <>
      {authState.matches('active.initial') && (
        <InitialStep styles={mergedStyles} />
      )}
      {authState.matches('active.register') && (
        <RegistrationSteps
          toast={toast}
          styles={mergedStyles}
          cryptoUtils={cryptoUtils}
        />
      )}
      {authState.matches('active.login') && (
        <LoginSteps
          toast={toast}
          styles={mergedStyles}
          cryptoUtils={cryptoUtils}
        />
      )}
      {toast && (
        <Toast
          visible={showToast}
          position={'bottom'}
          autoDismiss={5000}
          onDismiss={() => setShowToast(false)}
          preset="failure"
          message={returnErrorMessage()}
        />
      )}
    </>
  );
};

export default Auth;
