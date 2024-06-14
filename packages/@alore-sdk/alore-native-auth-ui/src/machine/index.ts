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
                on: {},
              },
            },

            initial: 'idle',
          },

          login: {
            states: {
              idle: {
                on: {
                  BACK: { target: '#authMachine.active.initial' },
                },
              },
            },

            initial: 'idle',
          },

          register: {
            states: {
              emailStep: {
                on: {
                  BACK: { target: '#authMachine.active.initial' },
                  NEXT: { target: '#authMachine.active.register.usernameStep' },
<<<<<<< Updated upstream
=======
                  GOOGLE_LOGIN: {
                    target: '#authMachine.active.register.googleRegister',
                  },
>>>>>>> Stashed changes
                },
              },

              usernameStep: {
                on: {
                  BACK: { target: '#authMachine.active.register.emailStep' },
                  START_PASSKEY_REGISTER: {
                    target: '#authMachine.active.register.passkeyStep',
                  },
<<<<<<< Updated upstream
                },
              },

=======
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
                }),
              },

              emailValidationStep: {
                on: {
                  VERIFY_EMAIL: 'verifyingEmail',
                  // BACK: {
                  //   target: 'idle',
                  //   actions: assign({
                  //     error: () => undefined,
                  //   }),
                  // },
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

              passwordStep: {},

              resendingRegistrationEmail: {
                invoke: {
                  src: 'sendConfirmationEmail',
                  onDone: {
                    target: '#authMachine.active.register.emailValidationStep',
                    actions: 'setSessionId',
                  },
                },
                entry: assign({
                  error: () => undefined,
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

>>>>>>> Stashed changes
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
          REGISTER_STEP: '.register',
          LOGIN_STEP: '.login',
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
<<<<<<< Updated upstream
=======
      sendConfirmationEmail: async (context, event) => {
        throw new Error('Not implemented');
      },
>>>>>>> Stashed changes
      startRegisterPasskey: async (_, event) => {
        throw new Error('Not implemented');
      },
      // finishRegisterPasskey: async (_, event) => {
      //   throw new Error('Not implemented');
      // },
      userInputRegisterPasskey: async (_, event) => {
        throw new Error('Not implemented');
      },
<<<<<<< Updated upstream
=======
      googleLogin: async (_, event) => {
        throw new Error('Not implemented');
      },
      verifyEmail: async (_, event) => {
        throw new Error('Not implemented');
      },
>>>>>>> Stashed changes
    },
    guards: {},
    actions: {
      clearContext: assign({
        sessionUser: undefined,
      }),
<<<<<<< Updated upstream
=======
      setSessionId: assign({
        sessionId: (_, event) => event.data.sessionId,
      }),
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        guards: {},
=======
        guards: {
          // @ts-ignore
          isNewUser: (_, event) => !!event.data.isNewUser,
        },
>>>>>>> Stashed changes
        actions: {},
      },
      { ...authMachine.context, ...context },
    ),
  )
    .onTransition(state => {
      //   if (state.changed && typeof window !== 'undefined') {
      //     localStorage.setItem('authState', JSON.stringify(state));
      //   }
    })
    .start();