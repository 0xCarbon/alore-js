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
                },
              },

              usernameStep: {
                on: {
                  BACK: { target: '#authMachine.active.register.emailStep' },
                  START_PASSKEY_REGISTER: {
                    target: '#authMachine.active.register.passkeyStep',
                  },
                },
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
      startRegisterPasskey: async (_, event) => {
        throw new Error('Not implemented');
      },
      // finishRegisterPasskey: async (_, event) => {
      //   throw new Error('Not implemented');
      // },
      userInputRegisterPasskey: async (_, event) => {
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
        guards: {},
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
