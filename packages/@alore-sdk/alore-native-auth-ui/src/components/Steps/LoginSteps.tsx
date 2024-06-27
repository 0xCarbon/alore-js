import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, View } from 'react-native';
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
import { Path, Svg } from 'react-native-svg';
import BackButton from '../BackButton';
import { stepStyles } from './styles';
import DeviceInfo from 'react-native-device-info';
import { RecursivePartial } from '../../types';

const GoogleIcon = () => (
  <Svg width="25" height="25" viewBox="0 0 25 25" fill="none">
    <Path
      d="M23.06 12.6958C23.06 11.9158 22.99 11.1658 22.86 10.4458H12.5V14.7058H18.42C18.16 16.0758 17.38 17.2358 16.21 18.0158V20.7858H19.78C21.86 18.8658 23.06 16.0458 23.06 12.6958Z"
      fill="#4285F4"
    />
    <Path
      d="M12.5 23.4458C15.47 23.4458 17.96 22.4658 19.78 20.7858L16.21 18.0158C15.23 18.6758 13.98 19.0758 12.5 19.0758C9.63999 19.0758 7.20999 17.1458 6.33999 14.5458H2.67999V17.3858C4.48999 20.9758 8.19999 23.4458 12.5 23.4458Z"
      fill="#34A853"
    />
    <Path
      d="M6.34 14.5358C6.12 13.8758 5.99 13.1758 5.99 12.4458C5.99 11.7158 6.12 11.0158 6.34 10.3558V7.51581H2.68C1.93 8.99581 1.5 10.6658 1.5 12.4458C1.5 14.2258 1.93 15.8958 2.68 17.3758L5.53 15.1558L6.34 14.5358Z"
      fill="#FBBC05"
    />
    <Path
      d="M12.5 5.8258C14.12 5.8258 15.56 6.3858 16.71 7.4658L19.86 4.3158C17.95 2.5358 15.47 1.4458 12.5 1.4458C8.19999 1.4458 4.48999 3.9158 2.67999 7.5158L6.33999 10.3558C7.20999 7.7558 9.63999 5.8258 12.5 5.8258Z"
      fill="#EA4335"
    />
  </Svg>
);

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
      authState.matches('active.login.resendingEmailCode'),
    [authState.value],
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const onBack = () => {
    sendAuth(['BACK']);
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
      sendAuth([
        {
          type: 'START_PASSKEY_LOGIN',
          payload: {
            email,
          },
        },
      ]);
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
            keyboardType="email-address"
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
            keyboardType="default"
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
            errorMessage={
              error?.includes('code') ? `${dictionary?.wrongCode}` : undefined
            }
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
