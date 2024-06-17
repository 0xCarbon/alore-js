import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Button } from "react-native-ui-lib";
import useDictionary from "../../hooks/useDictionary";
import { useActor } from "@xstate/react";
import useAuthServiceInstance from "../../hooks/useAuthServiceInstance";
import StyledTextField from "../StyledTextField";
import { EnvelopeIcon, UserIcon } from "react-native-heroicons/solid";
import {
  mergeStyles,
  passwordRules,
  ruleValidation,
  validateEmailPattern,
} from "../../helpers";
import DeviceInfo from "react-native-device-info";
import { Path, Svg } from "react-native-svg";
import FormRules from "../FormRules";
import BackButton from "../BackButton";
import { stepStyles } from "./styles";
import { RecursivePartial } from "../../types";

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

interface RegistrationStepsProps {
  styles: RecursivePartial<typeof stepStyles>;
  cryptoUtils: {
    hashUserInfo: (userInfo: string) => string;
    generateSecureHash: (
      data: string,
      salt: string,
      keyDerivationFunction: "argon2d" | "pbkdf2",
    ) => Promise<string>;
  };
}

export const RegistrationSteps: React.FC<RegistrationStepsProps> = ({
  styles,
  cryptoUtils,
}) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureCode, setSecureCode] = useState("");
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const locale = authState.context.locale;
  const dictionary = useDictionary(locale);
  const isEmailValid = validateEmailPattern(email);
  const isLoadingUsernameStep = authState.matches(
    "active.register.sendingEmail",
  );
  const isLoadingEmailValidationStep =
    authState.matches("active.register.resendingRegistrationEmail") ||
    authState.matches("active.register.verifyingEmail");
  const isLoadingPasswordStep = authState.matches(
    "active.register.completingRegistration",
  );
  const { CCRPublicKey, googleId, error, salt } = authState.context;
  const { generateSecureHash, hashUserInfo } = cryptoUtils;

  useEffect(() => {
    const fetchDeviceAndProceed = async () => {
      if (!CCRPublicKey) return;

      const device = await DeviceInfo.getUserAgent();

      sendAuth({
        type: "USER_INPUT_PASSKEY_REGISTER",
        payload: {
          CCRPublicKey,
          userAgent: device,
          withSecurityKey: true,
        },
      });
    };

    if (authState.matches("active.register.passkeyStep.idle")) {
      fetchDeviceAndProceed();
    }
  }, [authState.matches("active.register.passkeyStep.idle")]);

  const isPasswordValid = useMemo(
    () =>
      passwordRules.reduce(
        (isValid, rule) =>
          isValid &&
          ruleValidation(
            rule,
            { password, confirmPassword },
            { email, nickname: username },
          ),
        true,
      ),
    [password, confirmPassword, email, username],
  );

  const onBack = () => {
    sendAuth(["BACK"]);
  };

  const onNext = () => {
    sendAuth({ type: "NEXT" });
  };

  const onResendEmail = () => {
    sendAuth({
      type: "RESEND_CODE",
      payload: { email, locale, nickname: username },
    });
  };

  const onStartPasskey = async () => {
    const device = await DeviceInfo.getUserAgent();

    sendAuth([
      {
        type: "START_PASSKEY_REGISTER",
        payload: {
          device,
          email,
          nickname: username,
        },
      },
    ]);
  };

  const onGoogleRegister = () => {}; // TODO: implement

  const onFinish = () => {
    sendAuth({
      type: "SEND_REGISTRATION_EMAIL",
      payload: { email, nickname: username, locale },
    });
  };

  const onClickSecureCodeSubmit = () => {
    sendAuth({ type: "VERIFY_EMAIL", payload: { secureCode } });
  };

  const onCompleteRegistration = async () => {
    if (!salt) return;

    const hashedPassword = await generateSecureHash(password, salt, "argon2d");
    const userAgent = await DeviceInfo.getUserAgent();
    const device = hashUserInfo(userAgent);

    sendAuth({
      type: "COMPLETE_REGISTRATION",
      payload: {
        nickname: username,
        passwordHash: hashedPassword,
        email,
        device,
      },
    });
  };

  const emailStep = () => (
    <View style={styles.emailStep?.container}>
      <Card style={styles.emailStep?.card}>
        <View style={styles.emailStep?.cardContainer}>
          <BackButton onClick={onBack} />
          <Text style={styles.emailStep?.title}>{dictionary?.emailLabel}</Text>
          <StyledTextField
            placeholder={dictionary?.emailPlaceholder}
            value={email}
            onChangeText={setEmail}
            icon={<EnvelopeIcon color="rgb(107 114 128)" size={16} />}
            maxLength={320}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
          <Button
            onPress={onNext}
            label={dictionary?.next}
            labelProps={{ style: styles.emailStep?.nextButtonLabel }}
            style={{
              ...styles.emailStep?.nextButton,
              opacity: isEmailValid ? 1 : 0.5,
            }}
            disabled={!isEmailValid}
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

  const usernameStep = () => (
    <View style={styles.usernameStep?.container}>
      <Card style={styles.usernameStep?.card}>
        <View style={styles.usernameStep?.cardContainer}>
          <BackButton onClick={onBack} />
          <Text style={styles.usernameStep?.title}>
            {dictionary?.createUsername}
          </Text>
          <StyledTextField
            placeholder={dictionary?.enterUsername}
            value={username}
            onChangeText={setUsername}
            icon={<UserIcon color="rgb(107 114 128)" size={16} />}
            maxLength={320}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
          <Button
            onPress={onFinish}
            label={dictionary?.createAccount}
            labelProps={{ style: styles.usernameStep?.nextButtonLabel }}
            style={{
              ...styles.usernameStep?.nextButton,
              opacity:
                username === "" || username.length < 4 || isLoadingUsernameStep
                  ? 0.5
                  : 1,
            }}
            disabled={
              username === "" || username.length < 4 || isLoadingUsernameStep
            }
          />
        </View>
      </Card>
    </View>
  );

  const emailValidationStep = () => (
    <View
      style={styles.verifyEmailStep?.container}
      data-test="register-verify-email-step"
    >
      <View style={styles.verifyEmailStep?.cardContainer}>
        <BackButton onClick={onBack} />
        <Text style={styles.verifyEmailStep?.title}>
          {dictionary?.verifyEmailStep.verifyEmail}
        </Text>
        <Text style={styles.verifyEmailStep?.subtitle}>
          {dictionary?.verifyEmailStep.verifyEmailDescription}
        </Text>
        <View style={styles.verifyEmailStep?.inputContainer}>
          <StyledTextField
            value={secureCode}
            onChangeText={setSecureCode}
            maxLength={6}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            errorMessage={
              error?.includes("code") ? `${dictionary?.wrongCode}` : undefined
            }
          />
        </View>
        <Button
          onPress={onClickSecureCodeSubmit}
          label={dictionary?.confirmCode}
          disabled={secureCode.length !== 6 || isLoadingEmailValidationStep}
          style={{
            ...styles.verifyEmailStep?.submitButton,
            opacity:
              secureCode.length === 6 || !isLoadingEmailValidationStep
                ? 1
                : 0.5,
          }}
        />
        <Button
          onPress={onResendEmail}
          label={dictionary?.resendCode}
          labelProps={{
            style: styles.verifyEmailStep?.resendEmailButton,
          }}
          style={styles.verifyEmailStep?.resendEmailButton}
          disabled={isLoadingEmailValidationStep}
        />
      </View>
    </View>
  );

  const passwordStep = () => (
    <View style={styles.passwordStep?.container}>
      <Card style={styles.passwordStep?.card}>
        <View style={styles.passwordStep?.cardContainer}>
          <BackButton onClick={onBack} disabled={isLoadingPasswordStep} />
          <Text style={styles.passwordStep?.title}>
            {dictionary?.register.createPassword}
          </Text>
          <StyledTextField
            secureTextEntry
            label={dictionary?.register.passwordLabel}
            placeholder={dictionary?.register.enterPassword}
            value={password}
            onChangeText={setPassword}
            maxLength={320}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
          <StyledTextField
            secureTextEntry
            label={dictionary?.register.passwordConfirmLabel}
            placeholder={dictionary?.register.enterPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            maxLength={320}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
          <FormRules
            locale={locale}
            passwordValues={{ password, confirmPassword }}
            userValues={{ email, nickname: username }}
          />
          <Button
            onPress={onCompleteRegistration}
            label={dictionary?.next}
            labelProps={{ style: styles.passwordStep?.nextButtonLabel }}
            style={{
              ...styles.passwordStep?.nextButton,
              opacity: isPasswordValid ? 1 : 0.5,
            }}
            disabled={!isPasswordValid || isLoadingPasswordStep}
          />
        </View>
      </Card>
    </View>
  );

  return (
    <>
      {authState.matches("active.register.emailStep") && emailStep()}
      {(authState.matches("active.register.usernameStep") ||
        authState.matches("active.register.sendingEmail")) &&
        usernameStep()}
      {(authState.matches("active.register.emailValidationStep") ||
        authState.matches("active.register.resendingRegistrationEmail") ||
        authState.matches("active.register.verifyingEmail")) &&
        emailValidationStep()}
      {(authState.matches("active.register.passwordStep") ||
        authState.matches("active.register.completingRegistration")) &&
        passwordStep()}
    </>
  );
};

export default RegistrationSteps;
