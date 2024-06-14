import React from 'react';
<<<<<<< Updated upstream
import { View, StyleSheet, Text, Button } from 'react-native';
=======
import { View, StyleSheet } from 'react-native';
>>>>>>> Stashed changes
import useDictionary from '../../hooks/useDictionary';
import { useActor } from '@xstate/react';
import useAuthServiceInstance from '../../hooks/useAuthServiceInstance';
import { Colors } from '../../constants/Colors';
<<<<<<< Updated upstream
=======
import { Button, Text } from 'react-native-ui-lib';
>>>>>>> Stashed changes

interface InitialStepProps {
  styles?: Partial<typeof defaultStyles>;
}

export const defaultStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignContent: 'center',
  },
  card: {
    paddingVertical: 40,
    minHeight: 100,
    width: '100%',
  },
  cardContainer: {
    gap: 16,
    marginLeft: 24,
    marginRight: 24,
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.gray[900],
    marginTop: 4,
  },
  enterButton: {
    backgroundColor: '#E64848',
    height: 48,
    paddingHorizontal: 20,
  },
  enterButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountButton: {
    backgroundColor: 'transparent',
    height: 48,
    paddingHorizontal: 20,
    borderColor: Colors.gray[900],
    borderWidth: 1,
  },
  createAccountButtonLabel: {
    color: Colors.gray[900],
    fontSize: 16,
    fontWeight: '600',
  },
});

export const InitialStep: React.FC<InitialStepProps> = ({ styles }) => {
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const dictionary = useDictionary(authState.context.locale);
  const mergedStyles = StyleSheet.flatten([defaultStyles, styles || {}]);

  const onCreateStep = () => {
    sendAuth(['REGISTER_STEP']);
  };

  const onLoginStep = async () => {
    sendAuth(['LOGIN_STEP']);
  };

  return (
    <View style={mergedStyles.container}>
      <View style={mergedStyles.card}>
        <View style={mergedStyles.cardContainer}>
          <Button
            onPress={onLoginStep}
<<<<<<< Updated upstream
            // label={dictionary?.startWithPasskey}
            // labelProps={{ style: mergedStyles.enterButtonLabel }}
            // style={mergedStyles.enterButton}
            title={dictionary?.startWithPasskey!}
=======
            label={dictionary?.start}
            labelProps={{ style: mergedStyles.enterButtonLabel }}
            style={mergedStyles.enterButton}
>>>>>>> Stashed changes
          />
          <Text style={mergedStyles.text}>{dictionary?.registerCta}</Text>
          <Button
            onPress={onCreateStep}
<<<<<<< Updated upstream
            // label={dictionary?.createAccount}
            // labelProps={{ style: mergedStyles.createAccountButtonLabel }}
            // style={mergedStyles.createAccountButton}
            title={dictionary?.createAccount!}
=======
            label={dictionary?.createAccount}
            labelProps={{ style: mergedStyles.createAccountButtonLabel }}
            style={mergedStyles.createAccountButton}
>>>>>>> Stashed changes
          />
        </View>
      </View>
    </View>
  );
};

export default InitialStep;
