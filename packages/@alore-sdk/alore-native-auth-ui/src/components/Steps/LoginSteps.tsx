import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Button } from "react-native-ui-lib";
import useDictionary from "../../hooks/useDictionary";
import { useActor } from "@xstate/react";
import useAuthServiceInstance from "../../hooks/useAuthServiceInstance";
import { Colors } from "../../constants/Colors";
import StyledTextField from "../StyledTextField";
import { EnvelopeIcon } from "react-native-heroicons/solid";
import { validateEmailPattern } from "../../helpers";
import DeviceInfo from "react-native-device-info";
import { Path, Svg } from "react-native-svg";
import BackButton from "../BackButton";
import { stepStyles } from "./styles";

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
  styles?: Partial<typeof stepStyles>;
}

export const LoginSteps: React.FC<LoginStepsProps> = ({ styles }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const locale = authState.context.locale;
  const dictionary = useDictionary(locale);
  const mergedStyles = StyleSheet.flatten([stepStyles, styles || {}]);
  const isEmailValid = validateEmailPattern(email);
  const { CCRPublicKey, googleId } = authState.context;

  useEffect(() => {
    const fetchDeviceAndProceed = async () => {
      if (!CCRPublicKey) return;

      const device = await DeviceInfo.getUserAgent(); // Await the promise

      sendAuth({
        type: "USER_INPUT_PASSKEY_REGISTER",
        payload: {
          CCRPublicKey,
          userAgent: device,
          withSecurityKey: true, // TODO: get from param
        },
      });
    };

    if (authState.matches("active.register.passkeyStep.idle")) {
      fetchDeviceAndProceed();
    }
  }, [authState.matches("active.register.passkeyStep.idle")]);

  const onBack = () => {
    sendAuth(["BACK"]);
  };

  const onNext = () => {
    sendAuth({ type: "NEXT" });
  };

  const onGoogleRegister = () => {}; // TODO: implement

  const emailStep = () => (
    <View style={mergedStyles.emailStep?.container}>
      <Card style={mergedStyles.emailStep?.card}>
        <View style={mergedStyles.emailStep?.cardContainer}>
          <BackButton onClick={onBack} />
          <Text style={mergedStyles.emailStep?.title}>
            {dictionary?.emailLabel}
          </Text>
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
            labelProps={{ style: mergedStyles.emailStep?.nextButtonLabel }}
            style={{
              ...mergedStyles.emailStep?.nextButton,
              opacity: isEmailValid ? 1 : 0.5,
            }}
            disabled={!isEmailValid}
          />
          {googleId && (
            <Button
              onPress={onGoogleRegister}
              style={{
                ...mergedStyles.emailStep?.googleButton,
              }}
              iconSource={() => <GoogleIcon />}
            />
          )}
        </View>
      </Card>
    </View>
  );

  const verifyEmailStep = () => (
    <View
      style={mergedStyles.verifyEmailStep?.container}
      data-test="register-verify-email-step"
    >
      <View style={mergedStyles.verifyEmailStep?.cardContainer}>
        <BackButton onClick={onBack} />
        <Text style={mergedStyles.verifyEmailStep?.title}>
          {dictionary?.verifyEmailStep.verifyEmail}
        </Text>
        <Text style={mergedStyles.verifyEmailStep?.subtitle}>
          {dictionary?.verifyEmailStep.verifyEmailDescription}
        </Text>
        <View style={mergedStyles.verifyEmailStep?.inputContainer}>
          <StyledTextField
            placeholder={dictionary?.login.enterSecureCode}
            // value={secureCode}
            // onChangeText={setSecureCode}
            maxLength={6}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            // errorMessage={
            //   authError?.includes('wrong')
            //     ? `${dictionary?.wrongCode}`
            //     : undefined
            // }
          />
        </View>
        <Button
          // onPress={onClickSecureCodeSubmit}
          label={dictionary?.verifyEmailStep.nextButton}
          // disabled={secureCode.length !== 6 || isLoading}
          style={mergedStyles.verifyEmailStep?.submitButton}
        ></Button>
        <Text
          // onPress={resendSecureCode}
          style={[
            mergedStyles.verifyEmailStep?.resendText,
            // sendEmailCooldown > 0 ? mergedStyles.verifyEmailStep?.disabledText : mergedStyles.verifyEmailStep?.enabledText,
          ]}
        >
          {/* {`${dictionary?.resendCode}${sendEmailCooldown ? ` (${sendEmailCooldown}s)` : ''}`} */}
        </Text>
      </View>
    </View>
  );

  const passwordStep = () => (
    <View style={mergedStyles.passwordStep?.container}>
      <Card style={mergedStyles.passwordStep?.card}>
        <View style={mergedStyles.passwordStep?.cardContainer}>
          <BackButton onClick={() => console.log("back")} />
          <Text style={mergedStyles.passwordStep?.title}>
            {dictionary?.login.enterPassword}
          </Text>
          <StyledTextField
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
            onPress={onNext}
            label={dictionary?.next}
            labelProps={{ style: mergedStyles.passwordStep?.nextButtonLabel }}
            style={{
              ...mergedStyles.passwordStep?.nextButton,
              opacity: isEmailValid ? 1 : 0.5,
            }}
            disabled={!isEmailValid}
          />
        </View>
      </Card>
    </View>
  );
  return (
    <>
      {/* {authState.matches("active.register.emailStep") && emailStep()}
      {authState.matches("active.register.usernameStep") && usernameStep()} */}
      {passwordStep()}
    </>
  );
};

export default LoginSteps;