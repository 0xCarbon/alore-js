import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-ui-lib';
import useDictionary from '../../hooks/useDictionary';
import { useActor } from '@xstate/react';
import useAuthServiceInstance from '../../hooks/useAuthServiceInstance';
import { Colors } from '../../constants/Colors';
import StyledTextField from '../StyledTextField';
import {
  ArrowLeftCircleIcon,
  EnvelopeIcon,
  UserIcon,
} from 'react-native-heroicons/solid';
import { validateEmailPattern } from '../../helpers';
import DeviceInfo from 'react-native-device-info';

interface RegistrationStepsProps {
  styles?: Partial<typeof defaultStyles>;
}

export const defaultStyles = {
  emailStep: StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignContent: 'center',
    },
    card: {
      width: '100%',
      backgroundColor: 'transparent',
    },
    cardContainer: {
      marginLeft: 30,
      marginRight: 30,
    },
    text: {
      fontWeight: '700',
      fontSize: 20,
      lineHeight: 30,
      color: Colors.gray[900],
      marginBottom: 24,
    },
    backButton: {
      backgroundColor: 'transparent',
      height: 48,
      paddingHorizontal: 0,
      marginRight: 'auto',
      marginTop: 20,
    },
    backButtonLabel: {
      color: Colors.gray[900],
      fontSize: 16,
      fontWeight: '600',
    },
    nextButton: {
      backgroundColor: '#E64848',
      height: 48,
      paddingHorizontal: 20,
      marginTop: 30,
    },
    nextButtonLabel: {
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
  }),
  usernameStep: StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignContent: 'center',
    },
    card: {
      width: '100%',
      backgroundColor: 'transparent',
    },
    cardContainer: {
      marginLeft: 30,
      marginRight: 30,
    },
    text: {
      fontWeight: '700',
      fontSize: 20,
      lineHeight: 30,
      color: Colors.gray[900],
      marginBottom: 24,
    },
    backButton: {
      backgroundColor: 'transparent',
      height: 48,
      paddingHorizontal: 0,
      marginRight: 'auto',
      marginTop: 20,
    },
    backButtonLabel: {
      color: Colors.gray[900],
      fontSize: 16,
      fontWeight: '600',
    },
    finishButton: {
      backgroundColor: '#E64848',
      height: 48,
      marginHorizontal: 'auto',
      marginTop: 30,
      width: '100%',
    },
    finishButtonLabel: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  }),
};

export const RegistrationSteps: React.FC<RegistrationStepsProps> = ({
  styles,
}) => {
  const [email, setEmail] = useState('kenny+asd@0xcarbon.org');
  const [username, setUsername] = useState('kenny');
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const dictionary = useDictionary(authState.context.locale);
  const mergedStyles = StyleSheet.flatten([defaultStyles, styles || {}]);
  const isEmailValid = validateEmailPattern(email);
  const { CCRPublicKey } = authState.context;

  useEffect(() => {
    const fetchDeviceAndProceed = async () => {
      if (!CCRPublicKey) return;

      const device = await DeviceInfo.getUserAgent(); // Await the promise

      sendAuth({
        type: 'USER_INPUT_PASSKEY_REGISTER',
        payload: {
          CCRPublicKey,
          userAgent: device,
          withSecurityKey: true, // TODO: get from param
        },
      });
    };

    if (authState.matches('active.register.passkeyStep.idle')) {
      fetchDeviceAndProceed();
    }
  }, [authState.matches('active.register.passkeyStep.idle')]);

  const onBack = () => {
    sendAuth(['BACK']);
  };

  const onNext = () => {
    sendAuth(['NEXT']);
  };

  const onStartPasskey = async () => {
    const device = await DeviceInfo.getUserAgent();

    sendAuth([
      {
        type: 'START_PASSKEY_REGISTER',
        payload: {
          device,
          email,
          nickname: username,
        },
      },
    ]);
  };

  const finishPasskeyRegistration = async () => {
    const device = await DeviceInfo.getUserAgent();

    const publicKey = CCRPublicKey?.publicKey;

    if (publicKey) {
      const registerCredential = (await navigator.credentials
        .create({
          publicKey: {
            challenge: Buffer.from(publicKey.challenge, 'base64'),
            rp: {
              name: publicKey.rp.name,
            },
            user: {
              id: Buffer.from(publicKey.user.id, 'base64'),
              name: email,
              displayName: username,
            },
            pubKeyCredParams: [
              {
                type: 'public-key',
                alg: -7,
              },
              {
                type: 'public-key',
                alg: -257,
              },
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              requireResidentKey: true,
            },
            // extensions: credentialExtensionsOnCreate,
          },
        })
        .catch(() => {
          sendAuth('BACK');
        })) as PublicKeyCredential;

      console.log(registerCredential);

      // if (registerCredential) {
      //   if (
      //     // @ts-ignore
      //     !registerCredential?.publicKey?.extensions?.prf &&
      //     // @ts-ignore
      //     registerCredential?.publicKey?.extensions?.largeBlob
      //   ) {
      //     sendAuth({
      //       type: 'FORCE_PASSWORD_METHOD',
      //       payload: {
      //         email,
      //       },
      //     });
      //   } else {
      //     sendAuth({
      //       type: 'FINISH_PASSKEY_REGISTER',
      //       payload: {
      //         passkeyRegistration: {
      //           id: registerCredential.id,
      //           rawId: Buffer.from(registerCredential.rawId).toString('base64'),
      //           response: {
      //             attestationObject: Buffer.from(
      //               // eslint-disable-next-line no-undef
      //               (
      //                 registerCredential.response as AuthenticatorAttestationResponse
      //               ).attestationObject,
      //             ).toString('base64'),
      //             clientDataJSON: Buffer.from(
      //               // eslint-disable-next-line no-undef
      //               (
      //                 registerCredential.response as AuthenticatorAttestationResponse
      //               ).clientDataJSON,
      //             ).toString('base64'),
      //           },
      //           type: 'public-key',
      //         },
      //         email,
      //         device,
      //         nickname,
      //       },
      //     });
      //   }
      // }
    }
  };

  const emailStep = () => (
    <View style={mergedStyles.emailStep?.container}>
      <Card style={mergedStyles.emailStep?.card}>
        <View style={mergedStyles.emailStep?.cardContainer}>
          <Text style={mergedStyles.emailStep?.text}>
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
            onPress={onBack}
            label={dictionary?.back}
            labelProps={{ style: mergedStyles.emailStep?.backButtonLabel }}
            style={mergedStyles.emailStep?.backButton}
            iconSource={() => (
              <ArrowLeftCircleIcon
                size={20}
                color={Colors.gray[600]}
                style={{ marginRight: 10 }}
              />
            )}
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
        </View>
      </Card>
    </View>
  );

  const usernameStep = () => (
    <View style={mergedStyles.usernameStep?.container}>
      <Card style={mergedStyles.usernameStep?.card}>
        <View style={mergedStyles.usernameStep?.cardContainer}>
          <Text style={mergedStyles.usernameStep?.text}>
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
            onPress={onBack}
            label={dictionary?.back}
            labelProps={{ style: mergedStyles.usernameStep?.backButtonLabel }}
            style={mergedStyles.usernameStep?.backButton}
            iconSource={() => (
              <ArrowLeftCircleIcon
                size={20}
                color={Colors.gray[600]}
                style={{ marginRight: 10 }}
              />
            )}
          />
          <Button
            onPress={onStartPasskey}
            label={dictionary?.createAccount}
            labelProps={{ style: mergedStyles.usernameStep?.finishButtonLabel }}
            style={{
              ...mergedStyles.usernameStep?.finishButton,
              opacity: username === '' || username.length < 4 ? 0.5 : 1,
            }}
            disabled={username === '' || username.length < 4}
          />
        </View>
      </Card>
    </View>
  );

  return (
    <>
      {authState.matches('active.register.emailStep') && emailStep()}
      {authState.matches('active.register.usernameStep') && usernameStep()}
    </>
  );
};

export default RegistrationSteps;
