import { State, assign, createMachine, interpret } from 'xstate';
import {
  AuthMachineContext,
  AuthMachineEvents,
  AuthMachineServices,
} from './types';

const initialContext: AuthMachineContext = {
  locale: 'en',
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

    context: initialContext,

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
                    target: '#authMachine.active.login.successfulLogin',
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

              successfulLogin: {
                type: 'final',

                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                }),

                on: {
                  REFRESH_ACCESS_TOKEN: {
                    target: '#authMachine.active.login.successfulLogin',
                    actions: assign({
                      sessionUser: (context, event) => ({
                        ...context.sessionUser!,
                        accessToken: event.newAccessToken,
                      }),
                    }),
                  },
                },
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
                    target: '#authMachine.active.register.userCreated',
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

              userCreated: {
                type: 'final',

                entry: assign({
                  googleUser: () => undefined,
                  registerUser: () => undefined,
                }),

                on: {
                  REFRESH_ACCESS_TOKEN: {
                    target: 'userCreated',
                    actions: assign({
                      sessionUser: (context, event) => ({
                        ...context.sessionUser!,
                        accessToken: event.newAccessToken,
                      }),
                    }),
                  },
                },
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
                },
                entry: assign({
                  error: () => undefined,
                  sessionId: () => undefined,
                }),
              },

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
                        actions: (_context, event) =>
                          assign({
                            error:
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
                          '#authMachine.active.register.passkeyStep.passkeyResult',
                        actions: (_context, event) => console.log(event.data),
                      },

                      onError: {
                        target: '#authMachine.active.register.usernameStep',
                        actions: (_context, event) =>
                          assign({
                            error:
                              event.data?.error ||
                              event.data?.message ||
                              event.data,
                          }),
                      },
                    },
                  },
                  passkeyResult: {},
                },
                initial: 'start',
              },
            },

            initial: 'emailStep',
          },
        },

        initial: 'initial',

        on: {
          RESET: { target: 'inactive', actions: ['clearContext'] },
        },
      },
    },

    initial: 'inactive',

    on: {
      RESET_CONTEXT: {
        target: '.inactive',
        actions: ['clearContext'],
      },
    },
  },
  {
    services: {
      completeRegistration: async (context, event) => {
        throw new Error('Not implemented');
      },
      sendConfirmationEmail: async (context, event) => {
        throw new Error('Not implemented');
      },
      startRegisterPasskey: async (_, event) => {
        throw new Error('Not implemented');
      },
      retrieveSalt: async (context, event) => {
        throw new Error('Not implemented');
      },
      // finishRegisterPasskey: async (_, event) => {
      //   throw new Error('Not implemented');
      // },
      userInputRegisterPasskey: async (_, event) => {
        throw new Error('Not implemented');
      },
      googleLogin: async (_, event) => {
        throw new Error('Not implemented');
      },
      verifyEmail: async (_, event) => {
        throw new Error('Not implemented');
      },
      verifyLogin: async (_, event) => {
        throw new Error('Not implemented');
      },
      verifyEmail2fa: async (context, event) => {
        throw new Error('Not implemented');
      },
    },
    guards: {},
    actions: {
      clearContext: assign({
        sessionUser: undefined,
      }),
    },
  },
);

let stateDefinition;

// @ts-ignore
// if (typeof window !== 'undefined') {
//   let authState = localStorage.getItem('authState');
//   if (authState) {
//     stateDefinition = JSON.parse(authState);
//   }
// }

let resolvedState: any;
if (stateDefinition) {
  const previousState = State.create(stateDefinition);

  // @ts-ignore
  resolvedState = authMachine.resolveState(previousState);
}

export const authService = (services: {}, context: AuthMachineContext) =>
  interpret(
    authMachine.withConfig(
      {
        services,
        guards: {
          // @ts-ignore
          isNewUser: (_, event) => !!event.data.isNewUser,
        },
        actions: {},
      },
      { ...authMachine.context, ...context },
    ),
  )
    .onTransition(state => {
      // if (state.changed && typeof window !== 'undefined') {
      //   localStorage.setItem('authState', JSON.stringify(state));
      // }
    })
    .start();
