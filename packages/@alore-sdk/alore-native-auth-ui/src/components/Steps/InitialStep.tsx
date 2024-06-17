import React from "react";
import { View } from "react-native";
import useDictionary from "../../hooks/useDictionary";
import { useActor } from "@xstate/react";
import useAuthServiceInstance from "../../hooks/useAuthServiceInstance";
import { Button, Text } from "react-native-ui-lib";
import { stepStyles } from "./styles";
import { mergeStyles } from "../../helpers";
import { RecursivePartial } from "../../types";

interface InitialStepProps {
  styles?: RecursivePartial<(typeof stepStyles)["initialStep"]>;
}

export const InitialStep: React.FC<InitialStepProps> = ({ styles }) => {
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const dictionary = useDictionary(authState.context.locale);
  const mergedStyles = mergeStyles(stepStyles["initialStep"], styles || {});

  const onCreateStep = () => {
    sendAuth(["REGISTER_STEP"]);
  };

  const onLoginStep = async () => {
    sendAuth(["LOGIN_STEP"]);
  };

  return (
    <View style={mergedStyles.container}>
      <View style={mergedStyles.card}>
        <View style={mergedStyles.cardContainer}>
          <Button
            onPress={onLoginStep}
            label={dictionary?.start}
            labelProps={{ style: mergedStyles.enterButtonLabel }}
            style={mergedStyles.enterButton}
          />
          <Text style={mergedStyles.text}>{dictionary?.registerCta}</Text>
          <Button
            onPress={onCreateStep}
            label={dictionary?.createAccount}
            labelProps={{
              style: mergedStyles.createAccountButtonLabel,
            }}
            style={mergedStyles.createAccountButton}
          />
        </View>
      </View>
    </View>
  );
};

export default InitialStep;
