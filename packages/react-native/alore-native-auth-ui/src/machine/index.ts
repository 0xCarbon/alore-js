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
    /** @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgWWQY0wEsA7MAYgCUBRAZSoBUB9AYQHkA5eqgDXoG0ADAF1EoAA4B7WIXSEJxUSAAeiACwAmADQgAnogCc+gHQCAzAHZzANgCsA-ao03TARgC+b7Wiy4CJMEYk+LIAbuQAkuzh9OEAggAy4QBaVIIiSCCS0rLyiioIpvpWRqZWLvrm+jYujuo25tp6CDaqLka2quZ16hqV+qYeXhg4+ESkRsGEYYHEMoTIADaBEAvk1ADi4TRcFIzbVAAKaYpZc7kZ+fWqRnYCAnYAHPoC5RaNiHU1Jg9WD+plVg0D3cnhA3hGfnGk2mJDmi2WqzI8VYm3Yey4R2EJykZwUFzUd3MJWeqieplJpNMWl0iCsAgeJXM5Jsvxcr3UA1B4N8YwC0ICsNk8MIK3I21iFCYB1iNBoAGkqABNRjI1HHDKnHJ40D5QoVYkCUn9CkPKnvZo2Bks+xWZ6GFzWfSDMHDHn+CZ4UIBBYSKAkIxgAC2yEICxo6DAYjIACFYsw5erxDitXlEOZVGUSmUfuYHqbcy5zdYia0evofvoXK56s7uaN3fyjD6-cQA8HQ+HI2QAGIMZgACT2CX4WI1ybk2uUajqNm+LKKTzMAmpTUqRJcy7KudUetMD1rrvrUM9U29vv9QZDYYjUfFksY0tlCuVqsiicy4-OOsQ1XpRksAhWP8LKmOS5obuYbTpi0bIWKodj9AePhHnyJ7TM2-oAE5gOgmGEGAIQkFANCLOgZAQPIArECEEgANZ8oekKoV6Tbnq22G4fhhHEMRpEICQNF4MgWppO+moTqmCAaPBc62r8zymMu4FmNcVaWACLjqOWHJIRCvIeixGHsTheEEURJELGRYCYZhEiYUYYgLMJABmdmBhMjH6Y2RlGBxpncbxln8dREhCSJwhiZ+k75E4s70vO8lLiuBitP+PzqFWTwPKoDi6W6x6GWxDnILAsAAO52RAnZRrG8aRdkEn4lJDwsiY5jOHS6h3BuqjgbBRg9JaHI2Ma855ShBmnqxLbFaVFWYVVN5kAAalQFDhN2L4om+o5Jg1X5TlJPTqAN9IuCyNSmkBfX-EYRqKf06jpuYhrjUxk3oUVYR4c5OhEfEbHkZRMw0fRHnIe93lfdZhC-f9bHBYJwkTqJu0fvt0XThop3AhdlLXTSCA1F1RgOnYpJmBlhJvV5aFnjN32w39PEAy2ZDWbZ9mOS5bng3pDZ09N-qM3DLMIwJoXI-IqPpHtuKSU4J1dbjZT48lRM9MUTw2Drrimtlpo0wLhUzZeobqM5yCULQVDsAAIiwrB26kaPiQdMWWgINzGu1DztfBVjgfUxTqH8PQZlYTJ1EbBVTT5ZsLBbVuretm2MFQ2CxOE8SMOo3axPV8tNQHXsjeSvv+yy4GQQyjhAQ8dwOCyLUx8xcdFQnScxnGCau1FCsjaXPuWpXgeE5lVqQVSL2tPY6jqK3H308LMOi1AVDtonltA+MEtg3WkOCz5IvM+vm9J4jkvhUIhcpk1z1tKULg5nmFjAuafvGKBVRXD0rz7lyTyxt24M1XqfDeV4u4czsg5Jy6BXKYXcgfWmJsV4-XAefS2l8woowin3DGA8Xre3LiPFoVdx5AWKPYToVI9x3AbiCIYEMUEgKwnAMAxAIBEQgaGZgEgIDkAorvEK+8gGx0+jNbCsAOFcJ4jwhYfCBHYKlsQGW2ICHF0HsQzopCA7gUpEYfogEihVFDqUKwi8oYzTECVWA9EdDVSMLAdAyBMJkSEVRUGDFmHAIkf6GxpV7GOOca49Ayjr630at+ZoW4jAN0gjYOoVhChsnAvoJ63sMrpnnk9colij5FQCXYsADibxOJcW49mNkYHc3gbzZBvjl6tiKUEspIS3HhNwTffBRdonpkzE-F++Z37j1zKYQxGhChMiqK4DQ+TUHNNsa0yMCJyAAFU6C7EiAcNZUoZTyiVCqba7BInux-JWcZLR+jnRnMkws48HBf2zPcGoGZzoWMAT48RTTZrFNKSs1A0jMLhGIGIDAO9PF0W8fzb5QtFmBJKY4wF1kQVgrCRLHB0s8Gy3Rr0w6gIigmC0pHdJwIno2HNF1HccT0n3FJOlH4ACmEwrbn4+FfykVAtReC6BXM4EIKQWI1lPyWmIrKci4FoKMCdKxd0nFbtMYIH6Y-bMkdX4FnAn7EO-Qm4bnLMuGw8zWHsuWWIIwEruXoBoKgPAeA4CwB7JELYg5HwHK2mqHpd9om2kAoYpkV09bxTScktqfwig5X6H7I1bLfmmtjSUigcBUCWQhSDKFfN8rCrhfG-5ZrRU6ETbAZN6KQqYtUdi9ReL8jKqzM-NVwz7lNC6nSQxFRDT3D3JYXKnyWVL2zfmxx+bC3FqqZzWBPNEEZomlY-xSyxUrKHUmoKGKVFqLHBovpnQVV1tzA24NDJARXNDsdZ4TKXRfKzdhP0zjrJtivNVbudVPVRMOhYVqO57Tz3KKHB0lKtJxR6KUDKG5qg9GjQEK9hAb32QTg+9gPARzyv7vfS0A09UWEsOdPMjbEAOg3ANExeYlzWENj2zNfbIPQbvR2Ja6xWAoniFQI5HqkMbsOiRtD9gMMJOw5Slwkc2ryTDWUOoqhwO+TANeiM9kJXEGQIGMAD7aq91Y1W3DNQvaHsMPPbKFyKXj1NF7F6tDn5+xqB85l5HGyUek+aoFcmFMProPbRgGwtj0AoLEGIHB06Z2zqcxVbIiFafSaHHKVZ9NNGJsUJujgzD8dDuJmzt7pGcO4ZvVNe9oVWcFsl+yqXZFnyvDK8tcrK1esOkFzT8FtNhb0zdNoV0NwbgeqJpLkmoO2YK+lq8o6an8vqUKijHWqPdbkZvEra65YVfyLBL2rhCiJMUo4f2QdnDtBeL8eCgFyjLna1J29CdlqLBFCoh9KcNrKgzlneIAXJJVfaDV0LumIvgUUsUZwlZw0jWeAvMj07csjds0dk7EAztLWU3dpq-GLA3AEJUKwtoqSGn0OBOoXtHDwWW+1SCrR9udcO5vY7CxTtagfdQZzDs2DOyh9ExccTzqAUBNYcOvVCZ5iJMj6ou6vvknx1Rk+PXQyZZEdlgHLE8tGEF+N4rK6InPrOQgMoxhbj3HpM8V4DRx6h1nP8IoiOatmEtPz2z0uivC48Wm0RF7hsHfsmb+Rk2IouFUzN9TLRDHAieBuX4unTCUvhydO4hRgT8cMNTf7h8JdA9vQ7jLvLx11MnQ02Fku4+y9Lauit661NEwdNVn7OnwumEi7hjKqktWkmgq0PcJvb1FPmotLskOFeBbpOMnc-xFJ1D+LaTVDcbjnUglUQwGvOSWfF1NSXDfKoPrYNgA4jGuCuaoJsbYnnvMnNb-d9vd0qTJINb31HhN56pVsJBSCth-hRsjyw6Yku8ASEDI5HCRFE1ScwiokXXip1R6nzH+yR-Z-VYWQHid-TrT-LUJ3MrHPN3AodqYoD9SsL9UlX9E-LqE6SOH9D9TqUoOvQAp-F-UAqAcA5xSAicPrPlCdQVG3azAAowIAogt-IHcg+QaA2nSrXfTvA-HvPXPjHKEoe4ICQoPccoH4fAiTMbEglglReRb-dNFPS9egqRGRZgj-WQibOXLpDg-IenXGJnToICTHc0fodcUCO4a0coI0CQlQtLMAmQrUOQhPWpAVX-O-CDZQ9hOw6Q9QxwzQzPeXV3F9XQ54BnOwA3FnYw8eZcYwCkXWVwQECwCQqACQX0VYUg6TeQ63XtOgu3IwFItIsADI6ydg7faHc6a4csZ+SsQCPMHKf3E-fja4EvHWUOOovcJ0W-RpCTPIgoqAdIgAygxPVwxQ23AneyPogYu3UooIxXNkD3Ko73Wov3NJSodoRJHcZkGCMDLo1PeggdNpCpdxYGLLNw7o6fOdXNcpUJGY8rYIgwHoAaKZCkHHKsc0EaWcBwLqF6BuDqToifP-e-fYy44JI4oYlwwbWgwHPIg4lZdpEtJGQIu4xXKkfUMwPMeocoLoSsLXVcGSQEToOLVwBwJ4CQ2Es1EUREDZNaRgbZXZB8fZZ8FfNfHYHQsvQlckX7AlFrCod4jMUmf9QzdJMoPA3YpQmEkEspSksUegCUPZJ8Q5NzfYCgNkhAdJa4DkCoF4zEhopoFoYoTSKoIU-4KsCzc9HI6E8YnNTlFFKVY44RH-UY3Iq08kuzW0tFW42A+4omDXAaH4sPZbTodWX8R7ckYEToPMBSQ1MUsYqjV0i1O08EgbZPIbZ0uMyUgFLlO0z06bb01EokdElqYfbEtApoWwcZLSYku5ZVMkjMs1BMtFa1W1e1R1KIGgF1RkxU1fdzNaVUjkbGCoRHBwSZBcMePU1wQxKsF4GoNcFkcwWshFK4xdItFNS3U4p0y09MxcwdS44dZdAI7Qso6JUOXMUmCoFqC86ofXc0HKRAvXewH4dvEvBcjlMpZckdZw5Mmgi06PCU7ct83cpdBEq+Q82YxVfMkwPcIsrErSUsn8FtBwJon4GIroecmMtM2zV0otZs0qMgO8eUt1ZjHaMCySN9RAvUTSDKVA3E3DMzf8KiqkfjXMEaNCgE9wpxQgKAUgCAVgYgJEFEVgXZVUwoYoJ+CoKoV5OodMD+R+eeHEsmX4EQ8TaQLiyAXisgSIOMGIZaLzJjaklUo8w6BufkxJeHawNkOkAmJodUwQnWX7eHeHTocTIINCZGHiNZIFLIsXQEqiaENyqADykorQ2VVUhuRHOJRJKOIfCLUvBADJHcP4P4bnWZQCaMti7oly0IfywKzCJM6gs42FTKqYbKoFHM3FOAv4NkdY5JYDVQQ0eoZSKkEwQ0P3cw-UjwUEYgfhOARQRQ5ExVAAWjHMQAGpGjiWynrgynJFaFYvNPIyKrCH6skn7JKHe2gmfheA-lnHqC0kAi0jqqZFAnAyWqahDNV0eA11MN1NoqJEBF70KHoS72ctmCFAWBOr6SnjiXqtKBagS3uHNFsC9mfhGg2qQNzGerhCWGlPevY3Mq+qx1+GqCAn+sJm3BKGfmyRaEdGfPQoKRbBht1EMGaJJDJBNDNFRvsH-DXHh1gg5DPQ3IWWo2vEjAJrUCKDihYpEuBCbhMOxlcHnktBE3uD+3SthR8j8i4nMlIlZqkkNBOgevujJvVmBC9ipiXHSTJjE1xsZpnwWmqhlozEMBuEsBamcB2qKD6k0ipvqFcC6G-QzHE2PjAXhnxq9MVzqr5pJuNANnJqiwsriQ5H5sUheGcEdo7kwWQANtaEaySsjIcB230WflOjZAcrsEsDmW1uNSl2dpl3NktgNuLEMQsCejfVoRoqJjuRKDqpVr1GynOjDskS8MK3kUUTAALpbX+EqHpDtoqNisumMAdFZCAnLCrxFrmsnxjXJJlucFKAI3iXTBoU0mrksAGl+DpCrzuGSQbtnX-LhKOOnr3A1P1XTsXvVnKCqrqv4zww5Cjm3pNXnQpNFGnr+FuoynLNtBag0ADzMFJiygP2eB1jvutPFSzLRRlqAi+DJX4wJVtGcDSTqHaGfmvsSR1nEMzsnrrLdMlUbJtTtVKnAa6HGTGWSUcFAmJmDQrKmSZC41LDNIZqztdPfMshloSQrIgmSUgh-TPp1TiXLmSUSSujMHwOntQ3OvVxeFMMpXTD9SCwzGrEqokNgxvHAcprEcXE1z41AkEPJHsBHy3DSvHp8p6KtNk3k0U2UbdvApZGuHpEUm1l-BZzSTP0Nvh0sqaK1tFvFKtKkPkXAfKDhwsPEY0fHgiyLqKCXA3HuHptTM3OByJ1B3BxZssfu0cEawdGsASruA9rRwEK1NuDLhDuiahN-KtPT1DBlvjtJlEKpFyUemPyiyenm3oXZrpHuBrHQY8L-PKlnwsdzLmNSaLtAxgn1LgripnNWv4zDWbi6AkMYJALUIgJURlrrWMESM9gP2cC-saL9n-ENB91JBHksBsKboWbII0KvD8ZVzuDV3UckcJi+3aDWYXEAlKFmvoaBN6NSP6KKIAIqcSTPOcAyhnGBEqE0a9n1kR3ROqE0jeZiZKa3NfKSb6cVUsoCZucureEJiAwI2ro6kDvBo6eMYRbjXhPAY9zUYxfLpaBOnCcjTNtDkrBfLjWhuSfKKNtKEMCuFaDuWGuaH5NgvuFHOSW7U8djMwswYbIwGWdiTKGqLGWoTgcJkSROjzFleAzlvpCZYfqwctSbLwfgFZePPOmMFzAJTqAerqHeKascvpXhzfmjkJYuN3rzUApXPQBlpNIZBEKeh9cXCUiVb-CHJaBRwQMPq1auOwv1ZltcCtpalCzuB6CELZz1P40QYSqbiyiZGUs4u4t4pYfTEa2+sRr+tiqeC-gxqcEMP6HH0MfYoWpKushlobiarpF+IcC3B3CLEUj9IdB+AOrnk6I8CAA */
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
