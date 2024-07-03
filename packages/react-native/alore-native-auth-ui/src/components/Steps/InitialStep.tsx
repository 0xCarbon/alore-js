import React from 'react';
import { View } from 'react-native';
import useDictionary from '../../hooks/useDictionary';
import { useActor } from '@xstate/react';
import useAuthServiceInstance from '../../hooks/useAuthServiceInstance';
import { Button, Text } from 'react-native-ui-lib';
import { stepStyles } from './styles';
import { RecursivePartial } from '../../types';

interface InitialStepProps {
  styles: RecursivePartial<typeof stepStyles>;
}

export const InitialStep: React.FC<InitialStepProps> = ({ styles }) => {
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const dictionary = useDictionary(authState.context.locale);

  const onCreateStep = () => {
    sendAuth(['REGISTER_STEP']);
  };

  const onLoginStep = async () => {
    sendAuth(['LOGIN_STEP']);
  };

  return (
    <View style={styles.initialStep?.container}>
      <View style={styles.initialStep?.card}>
        <View style={styles.initialStep?.cardContainer}>
          <Button
            onPress={onLoginStep}
            label={dictionary?.start}
            labelProps={{ style: styles.common?.nextButtonLabel }}
            style={styles.common?.nextButton}
          />
          <Text style={styles.initialStep?.text}>
            {dictionary?.registerCta}
          </Text>
          <Button
            onPress={onCreateStep}
            label={dictionary?.createAccount}
            labelProps={{
              style: styles.initialStep?.createAccountButtonLabel,
            }}
            style={styles.initialStep?.createAccountButton}
          />
        </View>
      </View>
    </View>
  );
};

export default InitialStep;
