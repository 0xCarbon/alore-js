import { State, assign, createMachine, interpret } from 'xstate';
import {
  AuthMachineContext,
  AuthMachineEvents,
  AuthMachineServices,
} from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Passkey } from 'react-native-passkey';

const initialContext: AuthMachineContext = {
  locale: 'en',
  authMethods: {
    google: false,
    passkey: false,
    password: false,
  },
};

export const authMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiACwAmADQgAnogCc+gHQCAzAHZzANgCsA-ao03TARgC+b7Wiy4CJMEYk+LIAbuQAkuzh9OEAggAy4QBaVIIiSCCS0rLyiioIpvpWRqZWLvrm+jYujuo25tp6CDaqLka2quZ16hqV+qYeXhg4+ESkRsGEYYHEMoTIADaBEAvk1ADi4TRcFIzbVAAKaYpZc7kZ+fWqRnYCAnYAHPoC5RaNiHU1Jg9WD+plVg0D3cnhA3hGfnGk2mJDmi2WqzI8VYm3Yey4R2EJykZwUFzUd3MJWeqieplJpNMWl0iCsAgeJXM5Jsvxcr3UA1B4N8YwC0ICsNk8MIK3I21iFCYB1iNBoAGkqABNRjI1HHDKnHJ40D5QoVYkCUn9CkPKnvZo2Bks+xWZ6GFzWfSDMHDHn+CZ4UIBBYSKAkIxgAC2yEICxo6DAYjIACFYsw5erxDitXlEOZVGUSmUfuYHqbcy5zdYia0evofvoXK56s7uaN3fyjD6-cQA8HQ+HI2QAGIMZgACT2CX4WI1ybk2uUajqNm+LKKTzMAmpTUqRJcy7KudUetMD1rrvrUM9U29vv9QZDYYjUfFksY0tlCuVqsiicy4-OOsQ1XpRksAhWP8LKmOS5obuYbTpi0bIWKodj9AePhHnyJ7TM2-oAE5gOgmGEGAIQkFANCLOgZAQPIArECEEgANZ8oekKoV6Tbnq22G4fhhHEMRpEICQNF4MgWppO+moTqmCAaPBc62r8zymMu4FmNcVaWACLjqOWHJIRCvIeixGHsTheEEURJELGRYCYZhEiYUYYgLMJABmdmBhMjH6Y2RlGBxpncbxln8dREhCSJwhiZ+k75E4s70vO8lLiuBitP+PzqFWTwPKoDi6W6x6GWxDnILAsAAO52RAnZRrG8aRdkEn4lJDwsiY5jOHS6h3BuqjgbBRg9JaHI2Ma855ShBmnqxLbFaVFWYVVN5kAAalQFDhN2L4om+o5Jg1X5TlJPTqAN9IuCyNSmkBfX-EYRqKf06jpuYhrjUxk3oUVYR4c5OhEfEbHkZRMw0fRHnIe93lfdZhC-f9bHBYJwkTqJu0fvt0XThop3AhdlLXTSCA1F1RgOnYpJmBlhJvV5aFnjN32w39PEAy2ZDWbZ9mOS5bng3pDZ09N-qM3DLMIwJoXI-IqPpHtuKSU4J1dbjZT48lRM9MUTw2Drrimtlpo0wLhUzZeobqM5yCULQVDsAAIiwrB26kaPiQdMWWgINzGu1DztfBVjgfUxTqH8PQZlYTJ1EbBVTT5ZsLBbVuretm2MFQ2CxOE8SMOo3axPV8tNQHXsjeSvv+yy4GQQyjhAQ8dwOCyLUx8xcdFQnScxnGCau1FCsjaXPuWpXgeE5lVqQVSL2tPY6jqK3H308LMOi1AVDtonltA+MEtg3WkOCz5IvM+vm9J4jkvhUIhcpk1z1tKULg5nmFjAuafvGKBVRXD0rz7lyTyxt24M1XqfDeV4u4czsg5Jy6BXKYXcgfWmJsV4-XAefS2l8woowin3DGA8Xre3LiPFoVdx5AWKPYToVI9x3AbiCIYEMUEgKwnAMAxAIBEQgaGZgEgIDkAorvEK+8gGx0+jNbCsAOFcJ4jwhYfCBHYKlsQGW2ICHF0HsQzopCA7gUpEYfogEihVFDqUKwi8oYzTECVWA9EdDVSMLAdAyBMJkSEVRUGDFmHAIkf6GxpV7GOOca49Ayjr630at+ZoW4jAN0gjYOoVhChsnAvoJ63sMrpnnk9colij5FQCXYsADibxOJcW49mNkYHc3gbzZBvjl6tiKUEspIS3HhNwTffBRdonpkzE-F++Z37j1zKYQxGhChMiqK4DQ+TUHNNsa0yMCJyAAFU6C7EiAcNZUoZTyiVCqba7BInux-Okk6XQnj-EMBYWwaTSRxK3IaeephLQ63mawxZgSSmONQNIzC4RiBiAwDvTxdFvH83EU02axTSkrP+dZIFIKwkSxwdLPBst0a9MOoCYETzTHzw3AhB5bQG5+ysICcsiT7ifL8d8uFfyAXItBdArmcCEFILEW3elsLlliCMIiwFwKMCdIxd0rFbtMYIH6Y-bMkdX4FnAhSga-Qm4bnLMuGwdKYUtN+WUoVLL0A0FQHgPAcBYA9kiFsQcj4DlbTVD0u+0TbSAUMUyK6et4ppOSW1P4RQcr9D9jqoWDL+V8pKRQOAqBLJgpBhCvm+UeW6qWfqlZeqdBRtgDG1FIV0WqMxeonF+RZVZmfgq4ZhZCZdTpIYiohp7h7ksLlQBPjoWhojfCgVGas05qqZzWBPNEGJomlY-xqau2dt7UFNFKi1Fjg0X0zocry25krT6hkgIWjpL+BoZ4ACmFQuTb5MAfpnHWTbFeaq3c6pOqiYdCwrUdz2iJTuh05p55VBMD0UoGViWaVUCG7CZ6Iz2QTte9gPARySv7vfS0A0NUWEsOdPMVamgOg3Kq20eYlzWENq2o9S8T0gYveBpa6xWAoniFQI5jqYOLsOnhhD9gkMJNQx+lwkc2ryX9WUOogGCNJqI8Bwg577JCuIMgQMYBr21V7vR4tiA2SqC9luww89sqVjecqxS-5KZ6z9jUCxgnR2CxE2JwVALJPSevXQe2jANhbHoBQWIMQODp0ztnU50q2RELUxczTVYbD6Nuk3RwZhOOhyA6e0ToGnEyO4ZvONe9IVCcbOZuL0jOGJavGKgtEqi3OsOr51T8F1OhxykFm6ZKn4vCXOklo0WSP2Sy7Is+V5+01I5fU7lwmYsWdazl0MeX51yyK-kWCXtXCFESYpRw-sg7OHaC8X48FALlGXE12LpHN7LUWCKFR16U4bWVBnLO8RvOSRK+0MrAXKvafHopYozhKwBpGs8BeJnD4sQyztq8e2FgHa1LJnul2mqcYsDcAQlRKWPUNPocCdQvaOHgnN9qkFWhbYswnAHQOJzXuoHZh2bBnZg+iYuOJ51AKAmsOHXqhM8xEipPcB0eZXvkix3Fk+Q2FjJZEal0zP3+tc7ATzkbhaF2KYQGUYwtx7j0meK8Bo49Q6zhuZStTZhLSc4vdzuRSWPHxtEW249v37J6-a8N2dESXAKfG0p861xyzP0rIBPMOVTAfuhydO4hRgSccMNTL7LDphm6MBb+RnX2VDq5SbvrzXw+i-17l63XSyfFYdKV97Gn7vBZV18Z+1hSTQVaHuHXXNbHzUWl2OT6eJt0nGTuf4ik6h-FtMqhuNxzqQSqIYRXnJD1pbM8Li9RSq-XrYNgA41GuAOaoJsbYLm3MnLvWcomDe7pUmSVqtvCPq1-3aPUDDth-jBuD404j237J4AkIGRyOEiJRpA5hFRfOvEju+1NMPN+7+rFkDxJ-WLF-LUcXArSXe3AodqYoZ9SsV9UOd9ffZcdoK5GoQoTqUocvIwH-e-f-KAQA5xYAicKPQdOpYdBpdtb-W-HAx-YXQg+QUAuvJTDfJvbfVvG5DjHKEoe4ICQoPccoH4TAqRBLAA2glRSPQ3FLD-EPAIMPIQ7LEQ5-MQzeBg1faVCnXGanToICFHc0fodcUCO4a0coI0QQ9heQvA0QrUSPNlEgzlKQi-WQswtrfA3CJQlPPNOdCXMbe9fIdQqnSlLQunZSLSO6bKXWVwQECwTAqACQX0VYFw6yN-BNcg03EfeyGIuIsABIzCFQu3Hwh3FoQxYEJ4DcX4TTT3atTja4N5HWUOd3PcJ0c-CgtIowDIqAeItI4g2pOwlI+PK-Vo2I9orItI3IwrfIomR3Iol3Uo93foNJSoQ-H9ZkGCHoTAjNYJCpdxYGSQ3o9LFo9YtpTY0Y8A8Y9Ja4DkCoCkdHKsc0EaWcBwLqF6BuDqRowfQXL-fYidDY0JLo7rMg3rPYhPA4lZdpXNJGCJVQySKkfUMwPMI-CoLSBA1cGSQETocLVwBwJ4NYr4spEUREDZNaRgbZXZB8fZZ8OfBfHYRgjWIoEoHKTcSrMwCoW4jMUmLSS0B6f4KsYzN4z-UPT4n5SdPEsUegCUPZJ8Q5RzfYCgaks4gaKZK4o-CopoFoYoTSKoU0OeMoDApo1IoEnEhFZlEVLY4Rd-XY4ffUwUplJFY0447wtfDbNoJ6M6W0ObTodWX8G7ckYEToNnLXbEq0g1I0lFX4mPew5oy0xlIMm0lFO07FCA6EokWElqHvLoSsZXJoWwcZLSDE5JB0DMRhF0OPQE-o4EgVQ1Y0k1M1C1K1KIGgW1MkyU+fJzNaakjkbGCoWHWoNAn4W41wQxKsF4GoNcFkcwAMqM9NCdadE08FY3QjEsizMsqdaNGdDwiEvItfUOXMUmCoFqPc6oIoMeJoHKaAm5ewH4BvN5cc8NHtFcqyapaPUg2Peci00sg07tKcu8uMqVKErSJMvcFM8oNMpEn8WtBwKon4ZcBEsc3Uvoxc98pxU1c1UqMgO8cU+1WjHaDc6VR9aAvUTSDKN9DMpTQzf8QiqkTjXMEaGC3k6QpxQgKAUgCAVgYgJEFEVgXZaktAstCoKoGoJwdMD+R+T9DDKA00RCWCxsaQRiyAFisgSIOMGIZaVzGjAkmUyEpqBuVkmldSNkOkAmJoOUxSHWD7aHaHToENIINCZGHiNZAFJIucofFiKy0IGyqAOy6yb82DcnanOJRJKObvILPPJoDJHcP4P4aoJkGoQCbVSSwWFyqYNyjyzCUMp88M49BKkIJKgFLyhjXwv9Q-ZJP9FTeCYiomSmEwQ0cogw1UjwUEYgfhOARQFIsYtfAAWiPMQDapGjiWymSQzA5Ow1itovdEyrAFaulXbJKCe2gmfheA-lnHqC0kAi0hUyZFAh1Qmskk9Ll0eEVz0OVJIqJDxUcE0mDjeRbjiuctmCFAWC2vvinjiUNA6haki3uHNFsC9nLWoQzHIoHyLJfOurhCWGFPur6WsDJWetKFeqAnesJm3BKELycC0P6GGoBqcq+TBofUMGqJJDJBNDNHhvsH-DXH4qKFzFpSuq+UvQ7BvCxpiiKDimop7OMOCpShOlcHnktD43uE+xGvbR8j8i4nMlInpoJGxkKCquNANkJqaGBC9ipnqyyUaypt5TH0qmqjFqkltFl0sBamcCWqKD6k0hJvqFcC6HKE1hDWPiTygFZhIC1pKo5rxulspHVjZE4ziQ5E5sUheGcGto7kwWQEdtaDJQirZwcHW30WflOjZDMrsEsDmVVphQjyDsduLEMQsCekfVoTKoh0fhU3lr1GynOgDskScJ50UXGpOLXy0IVsjn3QtsdzZqJiNFJjw0i3LGLz5vRveLVvfK1ucFKDIs0jMFtH4zQyU0sCJFP25vOg5CeB5N7r5JTUDJBM2MHr3GuAtq6lKAa1aDSTZDuhWwww5CjjLvHTXoFVBprulSGlnHTGpUqEcDeU6qJgcGMGXC9WBAhqrAvrDTTXLODIwC1qAi+GBAygCJMWcDSTqHaGflPsSR1gEOTo7SXIrJRSrOQvgFvskkjg5DSlKHJB3FmXdqKGzKmSZBY1LCXvNIWU7UcVvOzUsi1oSWzIgmSUgngLIcKDiXLmSUSSujMHL0Hvg12oVxeD0I-XTHdSC2ylAgxIPWXrorDzI0jFAeJvEcXCVw41Ai4PJHsF7y3DRroY+ITwkykxkzptwaalfuuHpEUm1l-Fp1JRu1dWsHW1RMwMG2T1DFAfKCh0MIkZ0fHiC0zqKCXA3HuCUdMf5ITxx32wgEO2sftJ81Osp3UjCruBKsR04MuNuDLj9piYBNfIs1TqvC1sjtJj4KpFyUej33Q2dK4IV1sDpHuBrFQbD3VoWk1pseiX4raFRrOtaFVJAoQAyk6Gms439Wbi6EwOwL-xoMUKKx-PBwrC9M9m32cA0A4z9j01njxRHksFMJ8YsOWYnHkX8dlzuHl20akcJle3aEiJGl+EAlKBouUYcJaLaI6Oa0qcSR3OcAyhnB-oaY+EHL4YvNhOqE0g+diZkIFInLEA0eexub2skbeEJl-VVQ0C3GeNAj-s6cRfDVBNAcKK0f2sxZVI7LpCDQNtDkrGvMAdWS1rZEMCzEMCuFaDzLftVNVWJQXEpUKAE35r1LfKvssxjJAb6eK1iTKBdzGWoRgcJkSROjzHlb-ReXpCZcnQwYwCwYtS1oyh6tzCpTqElrqD7J93TFJHiTfmjiJcjJvM-OYfQCNezGJGniegZbuA9L-FhxaHhygK3p1eCSQsNZld1DZDVZGnnl9ZUxZHpxVM9tVgaPgiyiZBDWkqYpYtYfTEhtR1+GqFhpbqeC-iRv40dA2tQcyuyusi1obipGW2eIcC3B3CLF01yVNbWrnkaI8CAA */
    id: 'authMachine',

    predictableActionArguments: true,
    tsTypes: {} as import('./index.typegen').Typegen0,

    schema: {
      context: {} as AuthMachineContext,
      services: {} as AuthMachineServices,
      events: {} as AuthMachineEvents,
    },

    states: {
      inactive: {
        on: {
          INITIALIZE: ['active'],
        },
        entry: [
          assign({
            sessionUser: () => undefined,
            CCRPublicKey: () => undefined,
            error: () => undefined,
            googleOtpCode: () => undefined,
            googleUser: () => undefined,
            RCRPublicKey: () => undefined,
            salt: () => undefined,
            sessionId: () => undefined,
            userEmail: () => undefined,
            passkeyLoginResult: () => undefined,
            passkeyRegistrationResult: () => undefined,
            registerUser: () => undefined,
          }),
          () => AsyncStorage.removeItem('authState'),
        ],
      },

      active: {
        states: {
          initial: {
            states: {
              idle: {
                on: {
                  REGISTER_STEP: '#authMachine.active.register',
                  LOGIN_STEP: '#authMachine.active.login',
                  START_PASSKEY_LOGIN: {
                    target: '#authMachine.active.login.passkeyStep',
                  },
                },
              },
            },
            entry: assign({
              sessionUser: () => undefined,
              CCRPublicKey: () => undefined,
              googleOtpCode: () => undefined,
              googleUser: () => undefined,
              RCRPublicKey: () => undefined,
              salt: () => undefined,
              sessionId: () => undefined,
              userEmail: () => undefined,
              passkeyLoginResult: () => undefined,
              passkeyRegistrationResult: () => undefined,
              registerUser: () => undefined,
            }),

            initial: 'idle',
          },

          login: {
            states: {
              emailStep: {
                on: {
                  BACK: { target: '#authMachine.active.initial' },
                  FETCH_SALT: {
                    target: '#authMachine.active.login.retrievingSalt',
                    actions: assign({
                      googleOtpCode: () => undefined,
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      sessionId: () => undefined,
                    }),
                  },
                  START_PASSKEY_LOGIN: {
                    target: '#authMachine.active.login.passkeyStep',
                  },
                },
                exit: assign({
                  error: () => undefined,
                }),
              },

              retrievingSalt: {
                invoke: {
                  src: 'retrieveSalt',
                  onDone: {
                    target: '#authMachine.active.login.passwordStep',
                    actions: assign({
                      salt: (_context, event) => event.data?.salt,
                      error: () => undefined,
                    }),
                  },
                  onError: {
                    target: '#authMachine.active.login.emailStep',
                    actions: assign({
                      error: (_context, event) => event.data?.error,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              passwordStep: {
                on: {
                  BACK: {
                    target: '#authMachine.active.login.emailStep',
                    actions: assign({
                      googleUser: () => undefined,
                      registerUser: () => undefined,
                      error: () => undefined,
                    }),
                  },

                  VERIFY_LOGIN: '#authMachine.active.login.verifyingLogin',
                },
                exit: assign({
                  error: () => undefined,
                }),
              },

              verifyingLogin: {
                invoke: {
                  src: 'verifyLogin',
                  onDone: [
                    {
                      target: 'email2fa',
                      actions: assign({
                        sessionId: (_, event) => event.data.sessionId,
                        error: () => undefined,
                      }),
                    },
                  ],
                  onError: {
                    target: '#authMachine.active.login.passwordStep',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              email2fa: {
                on: {
                  RESEND_CODE: '#authMachine.active.login.resendingEmailCode',
                  VERIFY_EMAIL_2FA:
                    '#authMachine.active.login.verifyingEmail2fa',
                  BACK: {
                    target: '#authMachine.active.login.passwordStep',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                },
                exit: assign({
                  error: () => undefined,
                }),
              },

              verifyingEmail2fa: {
                invoke: {
                  src: 'verifyEmail2fa',

                  onError: {
                    target: '#authMachine.active.login.email2fa',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },

                  onDone: {
                    target: '#authMachine.active.signedOn',
                    actions: assign({
                      sessionUser: (_, event) => event.data,
                      error: () => undefined,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              resendingEmailCode: {
                invoke: {
                  src: 'verifyLogin',
                  onDone: {
                    target: '#authMachine.active.login.email2fa',
                    actions: assign({
                      sessionId: (_, event) => event.data.sessionId,
                      error: () => undefined,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              passkeyStep: {
                states: {
                  start: {
                    invoke: {
                      src: 'startPasskeyAuth',

                      onDone: {
                        target: '#authMachine.active.login.passkeyStep.idle',
                        actions: assign({
                          RCRPublicKey: (_context, event) =>
                            event.data.requestChallengeResponse,
                          sessionId: (_, event) => event.data.sessionId,
                          error: () => undefined,
                        }),
                      },

                      onError: {
                        target: '#authMachine.active.initial',
                        actions: assign({
                          error: (_context, event) =>
                            event.data?.error ||
                            event.data?.message ||
                            event.data,
                        }),
                      },
                    },
                  },
                  idle: {
                    on: {
                      USER_INPUT_PASSKEY_LOGIN:
                        '#authMachine.active.login.passkeyStep.userInput',
                    },
                  },
                  userInput: {
                    invoke: {
                      src: 'userInputLoginPasskey',
                      onDone: {
                        target:
                          '#authMachine.active.login.passkeyStep.userInputSuccess',
                        actions: assign({
                          passkeyLoginResult: (_context, event) => event.data,
                          error: () => undefined,
                        }),
                      },
                      onError: {
                        target: '#authMachine.active.initial',
                        actions: assign({
                          error: (_context, event) =>
                            event.data?.error ||
                            event.data?.message ||
                            event.data,
                        }),
                      },
                    },
                  },
                  userInputSuccess: {
                    on: {
                      FINISH_PASSKEY_LOGIN:
                        '#authMachine.active.login.passkeyStep.passkeyResult',
                    },
                  },
                  passkeyResult: {
                    invoke: {
                      src: 'finishPasskeyAuth',
                      onDone: {
                        target: '#authMachine.active.signedOn',
                        actions: assign({
                          sessionUser: (_context, event) => event.data,
                          error: () => undefined,
                        }),
                      },
                      onError: {
                        target: '#authMachine.active.initial',
                        actions: assign({
                          error: (_context, event) =>
                            event.data?.error ||
                            event.data?.message ||
                            event.data,
                        }),
                      },
                    },
                  },
                },
                exit: assign({
                  CCRPublicKey: () => undefined,
                  passkeyLoginResult: () => undefined,
                  passkeyRegistrationResult: () => undefined,
                  RCRPublicKey: () => undefined,
                }),
                initial: 'start',
              },
            },

            initial: 'emailStep',
          },

          register: {
            states: {
              emailStep: {
                on: {
                  BACK: { target: '#authMachine.active.initial' },
                  NEXT: { target: '#authMachine.active.register.usernameStep' },
                  GOOGLE_LOGIN: {
                    target: '#authMachine.active.register.googleRegister',
                  },
                },
                exit: assign({
                  error: () => undefined,
                }),
              },

              usernameStep: {
                on: {
                  BACK: { target: '#authMachine.active.register.emailStep' },
                  SEND_REGISTRATION_EMAIL: {
                    target: '#authMachine.active.register.sendingEmail',
                  },
                },
                exit: assign({
                  error: () => undefined,
                }),
              },

              sendingEmail: {
                invoke: {
                  src: 'sendConfirmationEmail',
                  onDone: {
                    target: '#authMachine.active.register.emailValidationStep',
                    actions: assign({
                      salt: (_context, event) => event.data?.salt,
                      sessionId: (_context, event) => event.data?.sessionId,
                      error: () => undefined,
                    }),
                  },
                  onError: {
                    target: '#authMachine.active.register.usernameStep',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                  sessionId: () => undefined,
                }),
              },

              emailValidationStep: {
                on: {
                  VERIFY_EMAIL: 'verifyingEmail',
                  BACK: {
                    target: '#authMachine.active.register.usernameStep',
                    actions: assign({
                      error: () => undefined,
                    }),
                  },
                  RESEND_CODE:
                    '#authMachine.active.register.resendingRegistrationEmail',
                },
                exit: assign({
                  error: () => undefined,
                }),
              },

              verifyingEmail: {
                invoke: {
                  src: 'verifyEmail',
                  onDone: [
                    {
                      target: '#authMachine.active.register.passkeyStep.idle',
                      actions: assign({
                        error: () => undefined,
                      }),
                      cond: 'isPasskeyMethod',
                    },
                    {
                      target: '#authMachine.active.register.passwordStep',
                      actions: assign({
                        error: () => undefined,
                      }),
                    },
                  ],

                  onError: {
                    target: '#authMachine.active.register.emailValidationStep',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              passwordStep: {
                on: {
                  BACK: {
                    target: '#authMachine.active.register.usernameStep',
                  },
                  COMPLETE_REGISTRATION:
                    '#authMachine.active.register.completingRegistration',
                },
                exit: assign({
                  error: () => undefined,
                }),
              },

              completingRegistration: {
                invoke: {
                  src: 'completeRegistration',
                  onDone: {
                    target: '#authMachine.active.signedOn',
                    actions: assign({
                      sessionUser: (_, event) => event.data,
                      error: () => undefined,
                    }),
                  },
                  onError: {
                    target: '#authMachine.active.register.passwordStep',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                }),
              },

              resendingRegistrationEmail: {
                invoke: {
                  src: 'sendConfirmationEmail',
                  onDone: {
                    target: '#authMachine.active.register.emailValidationStep',
                    actions: assign({
                      salt: (_context, event) => event.data?.salt,
                      sessionId: (_context, event) => event.data?.sessionId,
                      error: () => undefined,
                    }),
                  },
                  onError: {
                    target: '#authMachine.active.register.emailValidationStep',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message,
                    }),
                  },
                },
                entry: assign({
                  error: () => undefined,
                  sessionId: () => undefined,
                }),
              },

              // TODO: add google register
              googleRegister: {
                invoke: {
                  src: 'googleLogin',
                  onDone: [
                    {
                      target: '#authMachine.active.register.passwordStep',

                      actions: assign({
                        registerUser: (_, event) => event.data?.registerUser,
                      }),

                      cond: 'isNewUser',
                    },
                    // {
                    //   target: 'idle',
                    //   actions: assign({
                    //     googleOtpCode: (_, event) => event.data.googleOtpCode,
                    //     salt: (_, event) => event.data.salt,
                    //     googleUser: (_, event) => event.data.googleUser,
                    //   }),
                    // },
                  ],
                  onError: {
                    target: '#authMachine.active.register.usernameStep',
                    actions: assign({
                      error: (_context, event) =>
                        event.data?.error || event.data?.message || event.data,
                    }),
                  },
                },

                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                }),
              },

              passkeyStep: {
                states: {
                  start: {
                    invoke: {
                      src: 'startRegisterPasskey',

                      onDone: {
                        target: '#authMachine.active.register.passkeyStep.idle',
                        actions: assign({
                          CCRPublicKey: (_context, event) => event.data.ccr,
                          sessionId: (_, event) => event.data.sessionId,
                          error: () => undefined,
                        }),
                      },

                      onError: {
                        target: '#authMachine.active.register.usernameStep',
                        actions: assign({
                          error: (_context, event) =>
                            event.data?.error ||
                            event.data?.message ||
                            event.data,
                        }),
                      },
                    },
                  },
                  idle: {
                    on: {
                      USER_INPUT_PASSKEY_REGISTER:
                        '#authMachine.active.register.passkeyStep.userInput',
                      START_PASSKEY_REGISTER: {
                        target:
                          '#authMachine.active.register.passkeyStep.start',
                      },
                    },
                  },
                  userInput: {
                    invoke: {
                      src: 'userInputRegisterPasskey',
                      onDone: {
                        target:
                          '#authMachine.active.register.passkeyStep.userInputSuccess',
                        actions: assign({
                          passkeyRegistrationResult: (_context, event) =>
                            event.data,
                          error: () => undefined,
                        }),
                      },
                      onError: {
                        target: '#authMachine.active.register.usernameStep',
                        actions: assign({
                          error: (_context, event) =>
                            event.data?.error ||
                            event.data?.message ||
                            event.data,
                        }),
                      },
                    },
                  },
                  userInputSuccess: {
                    on: {
                      FINISH_PASSKEY_REGISTER:
                        '#authMachine.active.register.passkeyStep.passkeyResult',
                    },
                  },
                  passkeyResult: {
                    invoke: {
                      src: 'finishRegisterPasskey',
                      onDone: {
                        target:
                          '#authMachine.active.register.passkeyStep.success',
                        actions: assign({
                          error: () => undefined,
                        }),
                      },
                      onError: {
                        target: '#authMachine.active.register.usernameStep',
                        actions: assign({
                          error: (_context, event) =>
                            event.data?.error ||
                            event.data?.message ||
                            event.data,
                        }),
                      },
                    },
                  },
                  success: {
                    type: 'final',
                    on: {
                      START_PASSKEY_LOGIN: {
                        target: '#authMachine.active.login.passkeyStep',
                        actions: assign({
                          userEmail: (context, event) =>
                            event.payload
                              ? event.payload.email
                              : context.userEmail,
                          isFirstLogin: () => true,
                        }),
                      },
                    },
                  },
                },
                exit: assign({
                  error: () => undefined,
                  CCRPublicKey: () => undefined,
                  passkeyLoginResult: () => undefined,
                  passkeyRegistrationResult: () => undefined,
                  RCRPublicKey: () => undefined,
                }),
                initial: 'start',
              },
            },

            initial: 'emailStep',
          },

          signedOn: {
            type: 'final',
            entry: assign({
              googleUser: () => undefined,
              registerUser: () => undefined,
              CCRPublicKey: () => undefined,
              RCRPublicKey: () => undefined,
              error: () => undefined,
              googleOtpCode: () => undefined,
              passkeyRegistrationResult: () => undefined,
              salt: () => undefined,
              userEmail: () => undefined,
              passkeyLoginResult: () => undefined,
              sessionId: () => undefined,
            }),
            on: {
              LOGOUT: {
                target: '#authMachine.inactive',
                actions: assign({
                  sessionUser: () => undefined,
                  CCRPublicKey: () => undefined,
                  error: () => undefined,
                  googleOtpCode: () => undefined,
                  googleUser: () => undefined,
                  RCRPublicKey: () => undefined,
                  salt: () => undefined,
                  sessionId: () => undefined,
                  userEmail: () => undefined,
                  passkeyLoginResult: () => undefined,
                  passkeyRegistrationResult: () => undefined,
                  registerUser: () => undefined,
                }),
              },

              INACTIVATE_USER: 'inactivatingUser',
            },
          },

          inactivatingUser: {
            invoke: {
              src: 'inactivateUser',
              onDone: {
                target: '#authMachine.inactive',
                actions: assign({
                  sessionUser: () => undefined,
                  CCRPublicKey: () => undefined,
                  error: () => undefined,
                  googleOtpCode: () => undefined,
                  googleUser: () => undefined,
                  RCRPublicKey: () => undefined,
                  salt: () => undefined,
                  sessionId: () => undefined,
                  userEmail: () => undefined,
                  passkeyLoginResult: () => undefined,
                  passkeyRegistrationResult: () => undefined,
                  registerUser: () => undefined,
                }),
              },
              onError: {
                target: '#authMachine.active.signedOn',
                actions: assign({
                  error: (_context, event) =>
                    event.data?.error || event.data?.message || event.data,
                }),
              },
            },
          },
        },

        initial: 'initial',
      },
    },

    initial: 'inactive',

    on: {
      RESET_CONTEXT: {
        target: '#authMachine.inactive',
        actions: assign({
          sessionUser: () => undefined,
          CCRPublicKey: () => undefined,
          error: () => undefined,
          googleOtpCode: () => undefined,
          googleUser: () => undefined,
          RCRPublicKey: () => undefined,
          salt: () => undefined,
          sessionId: () => undefined,
          userEmail: () => undefined,
          passkeyLoginResult: () => undefined,
          passkeyRegistrationResult: () => undefined,
          registerUser: () => undefined,
        }),
      },
    },
  },
  {
    services: {
      startPasskeyAuth: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      userInputLoginPasskey: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      finishPasskeyAuth: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      completeRegistration: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      sendConfirmationEmail: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      startRegisterPasskey: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      retrieveSalt: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      finishRegisterPasskey: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      userInputRegisterPasskey: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      googleLogin: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      verifyEmail: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      verifyLogin: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      verifyEmail2fa: async (_context, _event) => {
        throw new Error('Not implemented');
      },
      inactivateUser: async (_context, _event) => {
        throw new Error('Not implemented');
      },
    },
    guards: {},
    actions: {},
  }
);

export const getResolvedState = async () => {
  const state = await AsyncStorage.getItem('authState');
  let resolvedState;

  if (state) {
    const stateDefinition = JSON.parse(state);
    const previousState = State.create(stateDefinition);
    // @ts-ignore
    resolvedState = authMachine.resolveState(previousState);
  }

  return resolvedState;
};

export const authService = (
  services: {},
  context: AuthMachineContext,
  resolvedState?: Awaited<ReturnType<typeof getResolvedState>>
) => {
  const mergedContext = {
    ...authMachine.context,
    ...initialContext,
    ...context,
  };

  return interpret(
    authMachine.withConfig(
      {
        services,
        guards: {
          // @ts-ignore
          isNewUser: (_, event) => !!event.data.isNewUser,
          // @ts-ignore
          isPasskeyMethod: (context, _) =>
            !!context.authMethods.passkey && Passkey.isSupported(),
        },
        actions: {},
      },
      mergedContext
    )
  )
    .onTransition(async (state) => {
      if (state.changed && state.matches('active.signedOn')) {
        await AsyncStorage.setItem('authState', JSON.stringify(state));
      }
    })
    .start(resolvedState);
};
