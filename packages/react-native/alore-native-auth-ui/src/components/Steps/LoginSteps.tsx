import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, Keyboard, View } from 'react-native';
import {
  Card,
  Text,
  Button,
  ToastProps,
  LoaderScreen,
  Toast,
} from 'react-native-ui-lib';
import useDictionary from '../../hooks/useDictionary';
import { useActor } from '@xstate/react';
import useAuthServiceInstance from '../../hooks/useAuthServiceInstance';
import StyledTextField from '../StyledTextField';
import { EnvelopeIcon } from 'react-native-heroicons/solid';
import { validateEmailPattern } from '../../helpers';
import BackButton from '../BackButton';
import { stepStyles } from './styles';
import DeviceInfo from 'react-native-device-info';
import { RecursivePartial } from '../../types';
import { GoogleIcon } from '../GoogleIcon';

interface LoginStepsProps {
  toast?: boolean;
  styles: RecursivePartial<typeof stepStyles>;
  cryptoUtils: {
    hashUserInfo: (userInfo: string) => string;
    generateSecureHash: (
      data: string,
      salt: string,
      keyDerivationFunction: 'argon2d' | 'pbkdf2',
    ) => Promise<string>;
  };
}

export const LoginSteps: React.FC<LoginStepsProps> = ({
  toast,
  styles,
  cryptoUtils,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureCode, setSecureCode] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastProps, setToastProps] = useState<ToastProps>({
    message: '',
    preset: 'general',
    position: 'bottom',
    autoDismiss: 5000,
  });
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const locale = authState.context.locale;
  const dictionary = useDictionary(locale);
  const isEmailValid = validateEmailPattern(email);
  const { generateSecureHash, hashUserInfo } = cryptoUtils;
  const {
    googleId,
    salt,
    error,
    authMethods,
    RCRPublicKey,
    passkeyLoginResult,
    userEmail,
  } = authState.context;

  useEffect(() => {
    const backAction = () => {
      sendAuth('BACK');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  useEffect(() => {
    if (authState.matches('active.login.passkeyStep.idle') && RCRPublicKey) {
      sendAuth({
        type: 'USER_INPUT_PASSKEY_LOGIN',
        payload: {
          RCRPublicKey,
          withSecurityKey: true,
        },
      });
    }
  }, [authState.matches('active.login.passkeyStep.idle')]);

  useEffect(() => {
    const finishPasskeyAuth = async () => {
      if (
        authState.matches('active.login.passkeyStep.userInputSuccess') &&
        passkeyLoginResult
      ) {
        sendAuth({
          type: 'FINISH_PASSKEY_LOGIN',
          payload: { passkeyAuth: passkeyLoginResult },
        });
      }
    };

    finishPasskeyAuth();
  }, [authState.matches('active.login.passkeyStep.userInputSuccess')]);

  const isLoading = useMemo(
    () =>
      authState.matches('active.login.retrievingSalt') ||
      authState.matches('active.login.verifyingLogin') ||
      authState.matches('active.login.verifyingEmail2fa') ||
      authState.matches('active.login.resendingEmailCode') ||
      authState.matches('active.login.passkeyStep.passkeyResult') ||
      authState.matches('active.login.passkeyStep.userInput') ||
      authState.matches('active.login.passkeyStep.start') ||
      authState.matches('active.login.passkeyStep.userInputSuccess'),
    [authState.value],
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const onBack = () => {
    sendAuth('BACK');
    dismissKeyboard();
  };

  const onVerifyLogin = async () => {
    dismissKeyboard();

    if (!salt) return;

    const hashedPassword = await generateSecureHash(password, salt, 'argon2d');
    const userAgent = await DeviceInfo.getUserAgent();
    const device = hashUserInfo(userAgent);

    sendAuth({
      type: 'VERIFY_LOGIN',
      payload: { email, passwordHash: hashedPassword, locale, device },
    });
  };

  const onFetchSalt = () => {
    if (authMethods.passkey) {
      sendAuth({
        type: 'START_PASSKEY_LOGIN',
        payload: {
          email,
        },
      });
    } else if (authMethods.password) {
      sendAuth({ type: 'FETCH_SALT', payload: { email } });
    }
    dismissKeyboard();
  };

  const onResendEmail = async () => {
    dismissKeyboard();

    if (!salt) return;

    setShowToast(true);
    setToastProps({
      message: dictionary?.verifyEmailStep?.codeSent || '',
      preset: 'general',
      position: 'bottom',
      autoDismiss: 5000,
    });

    const secureHashArgon2d = await generateSecureHash(
      password,
      salt,
      'argon2d',
    );
    const device = hashUserInfo(await DeviceInfo.getUserAgent());

    sendAuth({
      type: 'RESEND_CODE',
      payload: {
        email,
        passwordHash: secureHashArgon2d,
        device,
        nickname: email,
        locale,
      },
    });
  };

  const onClickSecureCodeSubmit = async () => {
    dismissKeyboard();

    if (!salt) return;

    const secureHashArgon2d = await generateSecureHash(
      password,
      salt,
      'argon2d',
    );

    sendAuth({
      type: 'VERIFY_EMAIL_2FA',
      payload: {
        email,
        passwordHash: secureHashArgon2d,
        secureCode,
      },
    });
  };

  const onGoogleRegister = () => {}; // TODO: implement google login

  const emailStep = () => (
    <View style={styles.emailStep?.container}>
      <Card style={styles.emailStep?.card}>
        <View style={styles.emailStep?.cardContainer}>
          <BackButton styles={styles} onClick={onBack} />
          <Text style={styles.common?.stepTitle}>{dictionary?.emailLabel}</Text>
          <StyledTextField
            styles={styles}
            placeholder={dictionary?.emailPlaceholder}
            value={email}
            onChangeText={setEmail}
            Icon={EnvelopeIcon}
            maxLength={320}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
          <Button
            onPress={onFetchSalt}
            label={dictionary?.next}
            labelProps={{ style: styles.common?.nextButtonLabel }}
            style={{
              ...styles.common?.nextButton,
              opacity: isEmailValid ? 1 : 0.5,
            }}
            disabled={
              !isEmailValid ||
              authState.matches('active.login.retrievingSalt') ||
              authState.matches('active.login.passkeyStep')
            }
          />
          {googleId && (
            <Button
              onPress={onGoogleRegister}
              style={{
                ...styles.emailStep?.googleButton,
              }}
              iconSource={() => <GoogleIcon />}
            />
          )}
        </View>
      </Card>
    </View>
  );

  const passwordStep = () => (
    <View style={styles.passwordStep?.container}>
      <Card style={styles.passwordStep?.card}>
        <View style={styles.passwordStep?.cardContainer}>
          <BackButton styles={styles} onClick={onBack} />
          <Text style={styles.common?.stepTitle}>
            {dictionary?.login.enterPassword}
          </Text>
          <StyledTextField
            styles={styles}
            secureTextEntry
            label={dictionary?.login.password}
            placeholder={dictionary?.login.passwordPlaceholder}
            value={password}
            onChangeText={setPassword}
            maxLength={320}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
          <Button
            onPress={onVerifyLogin}
            label={dictionary?.next}
            labelProps={{ style: styles.common?.nextButtonLabel }}
            style={{
              ...styles.common?.nextButton,
              opacity: password.length > 8 ? 1 : 0.5,
            }}
            disabled={
              password.length < 8 ||
              authState.matches('active.login.verifyingLogin')
            }
          />
        </View>
      </Card>
    </View>
  );

  const emailValidationStep = () => (
    <View
      style={styles.verifyEmailStep?.container}
      data-test="register-verify-email-step">
      <View style={styles.verifyEmailStep?.cardContainer}>
        <BackButton styles={styles} onClick={onBack} />
        <Text style={styles.common?.stepTitle}>
          {dictionary?.verifyEmailStep.verifyEmail}
        </Text>
        <Text style={styles.verifyEmailStep?.subtitle}>
          {dictionary?.verifyEmailStep.verifyEmailDescription}
        </Text>
        <View style={styles.verifyEmailStep?.inputContainer}>
          <StyledTextField
            styles={styles}
            value={secureCode}
            placeholder={dictionary?.verifyEmailStep?.enterSecureCode}
            onChangeText={setSecureCode}
            maxLength={6}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
        </View>
        <Button
          onPress={onClickSecureCodeSubmit}
          label={dictionary?.confirmCode}
          labelProps={{ style: styles.common?.nextButtonLabel }}
          disabled={secureCode.length !== 6 || isLoading}
          style={{
            ...styles.common?.nextButton,
            opacity: secureCode.length === 6 || !isLoading ? 1 : 0.5,
          }}
        />
        <Button
          onPress={onResendEmail}
          label={dictionary?.resendCode}
          labelProps={{
            style: styles.verifyEmailStep?.resendEmailButtonLabel,
          }}
          style={styles.verifyEmailStep?.resendEmailButton}
          disabled={isLoading}
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <LoaderScreen
        loaderColor={styles?.common?.stepTitle?.color || 'black'}
        size={48}
      />
    );
  }

  return (
    <>
      {(authState.matches('active.login.emailStep') ||
        authState.matches('active.login.retrievingSalt') ||
        authState.matches('active.login.passkeyStep')) &&
        emailStep()}
      {(authState.matches('active.login.passwordStep') ||
        authState.matches('active.login.verifyingLogin')) &&
        passwordStep()}
      {(authState.matches('active.login.email2fa') ||
        authState.matches('active.login.verifyingEmail2fa') ||
        authState.matches('active.login.resendingEmailCode')) &&
        emailValidationStep()}
      {toast && (
        <Toast
          {...toastProps}
          visible={showToast}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </>
  );
};

export default LoginSteps;
