import { State, assign, createMachine, interpret } from 'xstate';
import {
  AuthMachineContext,
  AuthMachineEvents,
  AuthMachineServices,
} from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      },

      active: {
        states: {
          initial: {
            states: {
              idle: {
                on: {
                  REGISTER_STEP: '#authMachine.active.register',
                  LOGIN_STEP: '#authMachine.active.login',
                },
              },
            },

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
              },

              retrievingSalt: {
                invoke: {
                  src: 'retrieveSalt',
                  onDone: {
                    target: '#authMachine.active.login.passwordStep',
                    actions: assign({
                      salt: (_context, event) => event.data?.salt,
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
              },

              verifyingLogin: {
                invoke: {
                  src: 'verifyLogin',
                  onDone: [
                    {
                      target: 'email2fa',
                      actions: assign({
                        sessionId: (_, event) => event.data.sessionId,
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
                        }),
                      },

                      onError: {
                        target: '#authMachine.active.login.emailStep',
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
                        }),
                      },
                      onError: {
                        target: '#authMachine.active.login.emailStep',
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
                        }),
                      },
                      onError: {
                        target: '#authMachine.active.login.emailStep',
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
              },

              usernameStep: {
                on: {
                  BACK: { target: '#authMachine.active.register.emailStep' },
                  START_PASSKEY_REGISTER: {
                    target: '#authMachine.active.register.passkeyStep',
                    actions: assign({
                      userEmail: (_context, event) => event.payload.email,
                    }),
                  },
                  SEND_REGISTRATION_EMAIL: {
                    target: '#authMachine.active.register.sendingEmail',
                  },
                },
              },

              sendingEmail: {
                invoke: {
                  src: 'sendConfirmationEmail',
                  onDone: {
                    target: '#authMachine.active.register.emailValidationStep',
                    actions: assign({
                      salt: (_context, event) => event.data?.salt,
                      sessionId: (_context, event) => event.data?.sessionId,
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
              },

              verifyingEmail: {
                invoke: {
                  src: 'verifyEmail',
                  onDone: '#authMachine.active.register.passwordStep',
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
                    target: '#authMachine.active.register.emailValidationStep',
                  },
                  COMPLETE_REGISTRATION:
                    '#authMachine.active.register.completingRegistration',
                },
              },

              completingRegistration: {
                invoke: {
                  src: 'completeRegistration',
                  onDone: {
                    target: '#authMachine.active.signedOn',
                    actions: assign({
                      sessionUser: (_, event) => event.data,
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
                        target: '#authMachine.active.login.passkeyStep',
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
                },
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
                actions: ['clearContext'],
              },
            },
          },
        },

        initial: 'initial',

        on: {
          RESET: { target: 'inactive' },
        },
      },
    },

    initial: 'inactive',

    on: {
      RESET_CONTEXT: {
        target: '#authMachine.inactive',
        actions: ['clearContext'],
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
    },
    guards: {},
    actions: {
      clearContext: assign({
        sessionUser: undefined,
        CCRPublicKey: undefined,
        error: undefined,
        googleOtpCode: undefined,
        googleUser: undefined,
        RCRPublicKey: undefined,
        salt: undefined,
        sessionId: undefined,
        userEmail: undefined,
        passkeyLoginResult: undefined,
        passkeyRegistrationResult: undefined,
        registerUser: undefined,
      }),
    },
  },
);

export const getResolvedState = async () => {
  const state = await AsyncStorage.getItem('authState');
  let resolvedState;

  if (state) {
    const stateDefinition = JSON.parse(state);
    const currentTime = Date.now();
    const threeHoursInMilliseconds = 3 * 60 * 60 * 1000;

    if (currentTime - stateDefinition.timestamp < threeHoursInMilliseconds) {
      const previousState = State.create(stateDefinition);

      // @ts-ignore
      resolvedState = authMachine.resolveState(previousState);
    } else {
      await AsyncStorage.removeItem('authState');
    }
  }

  return resolvedState;
};

export const authService = (
  services: {},
  context: AuthMachineContext,
  resolvedState?: Awaited<ReturnType<typeof getResolvedState>>,
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
        },
        actions: {},
      },
      mergedContext,
    ),
  )
    .onTransition(async state => {
      if (
        state.changed &&
        (state.matches('inactive') || state.matches('active.signedOn'))
      ) {
        const stateWithTimestamp = {
          ...state,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(
          'authState',
          JSON.stringify(stateWithTimestamp),
        );
      }
    })
    .start(resolvedState);
};
