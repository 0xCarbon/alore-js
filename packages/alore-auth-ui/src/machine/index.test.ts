import { describe, expect, it } from 'vitest';
import { interpret, Interpreter } from 'xstate';

import { authMachine } from './index';

/**
 * JOO-1792 / joori#2670 regression suite.
 *
 * Freeze defect: Register.finishPasskeyFirstAuth sends PASSKEY_NOT_SUPPORTED when no
 * PRF/largeBlob secret can be derived, but register.localRCRSign had no handler for that
 * event, so the machine stayed on the localRCRSign spinner forever while the account was
 * already created server-side (create_user runs in account-registration-passkey-finish).
 */

const resolvingServices = {
  startRegisterPasskey: () => Promise.resolve({ ccr: {}, sessionId: 's1' }),
  finishRegisterPasskey: () => Promise.resolve({}),
  startPasskeyAuth: () =>
    Promise.resolve({ requestChallengeResponse: { publicKey: {} }, sessionId: 's2' }),
  finishPasskeyAuth: () =>
    Promise.resolve({ requestChallengeResponse: { publicKey: {} }, sessionId: 's3' }),
};

type Service = Interpreter<unknown>;

function startMachine(): Service {
  // Mirrors how AuthProvider mounts the machine: services injected, context seeded
  // with provider configs (passkeys on, wallets off — the Joori deployment shape).
  const service = interpret(
    authMachine
      .withConfig({
        services: resolvingServices as never,
        guards: {
          isPasskeyEnabled: () => true,
          requireEmailVerification: () => false,
          isPasswordAndPasskeyEnabled: () => true,
        } as never,
      })
      .withContext({
        authProviderConfigs: {
          enablePasskeys: true,
          enablePasswords: true,
          enableWalletCreation: false,
          requireEmailVerification: false,
        },
      } as never) as never,
  );
  service.start();
  return service;
}

const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 30);
  });

async function driveRegisterToLocalRCRSign(service: Service) {
  service.send({ type: 'INITIALIZE' } as never); // inactive -> active (login.authScreen)
  service.send({ type: 'SIGN_UP' } as never); // -> register.retrievingCCR (passkey enabled)
  await settle(); // startRegisterPasskey resolves -> localCCRSign
  service.send({ type: 'FINISH_PASSKEY_REGISTER', payload: {} } as never); // -> sendingPublicCredential
  await settle(); // finishRegisterPasskey resolves -> waitingForRCR
  service.send({ type: 'START_PASSKEY_LOGIN', payload: {} } as never); // -> retrievingRCR
  await settle(); // startPasskeyAuth resolves -> localRCRSign
}

describe('register.localRCRSign (freeze fix, JOO-1792)', () => {
  it('reaches localRCRSign', async () => {
    const service = startMachine();
    await driveRegisterToLocalRCRSign(service);
    expect(service.state.matches('active.register.localRCRSign')).toBe(true);
    service.stop();
  });

  it('does NOT freeze on PASSKEY_NOT_SUPPORTED: lands on passkeyCreatedButNotAuthenticated with the error surfaced', async () => {
    const service = startMachine();
    await driveRegisterToLocalRCRSign(service);
    expect(service.state.matches('active.register.localRCRSign')).toBe(true);
    service.send({
      type: 'PASSKEY_NOT_SUPPORTED',
      payload: { error: { code: 'PASSKEY_NOT_SUPPORTED' } },
    } as never);
    expect(service.state.matches('active.register.passkeyCreatedButNotAuthenticated')).toBe(true);
    expect(service.state.context.error).toEqual({ code: 'PASSKEY_NOT_SUPPORTED' });
    service.stop();
  });

  it('still forwards FINISH_PASSKEY_AUTH to sendingAuthPublicCredential', async () => {
    const service = startMachine();
    await driveRegisterToLocalRCRSign(service);
    service.send({ type: 'FINISH_PASSKEY_AUTH', payload: {} } as never);
    expect(service.state.matches('active.register.sendingAuthPublicCredential')).toBe(true);
    service.stop();
  });
});

describe('login.idle.localPasskeySign PASSKEY_NOT_SUPPORTED (regression lock)', () => {
  it('returns to login idle authScreen with the error surfaced', async () => {
    const service = startMachine();
    service.send({ type: 'INITIALIZE' } as never);
    service.send({ type: 'SET_CONDITIONAL_UI_PASSKEY' } as never); // authScreen -> localPasskeySign
    expect(service.state.matches('active.login.idle.localPasskeySign')).toBe(true);
    service.send({
      type: 'PASSKEY_NOT_SUPPORTED',
      payload: { error: { code: 'PASSKEY_NOT_SUPPORTED' } },
    } as never);
    expect(service.state.matches('active.login.idle.authScreen')).toBe(true);
    expect(service.state.context.error).toEqual({ code: 'PASSKEY_NOT_SUPPORTED' });
    service.stop();
  });
});

/**
 * Social login (id_token flow).
 *
 * The 200/201 split is load-bearing well beyond the machine: Auth.tsx fires
 * onLogin or onRegister based on which state the machine lands in, and the
 * consuming app creates its own user record off onRegister. If a provisioning
 * response landed in successfulLogin, a brand new user would sign in with no
 * record on the consumer's side.
 */
function startSocialMachine(isNewUser: boolean): Service {
  const service = interpret(
    authMachine
      .withConfig({
        services: {
          ...resolvingServices,
          socialLogin: () =>
            Promise.resolve({
              sessionUser: { id: 'u1', email: 'someone@example.com' },
              isNewUser,
            }),
        } as never,
        guards: {
          isPasskeyEnabled: () => true,
          requireEmailVerification: () => false,
          isPasswordAndPasskeyEnabled: () => true,
        } as never,
      })
      .withContext({
        authProviderConfigs: {
          enablePasskeys: true,
          enablePasswords: true,
          enableWalletCreation: false,
          requireEmailVerification: false,
        },
      } as never) as never,
  );
  service.start();
  return service;
}

describe('login.socialLogin (id_token flow)', () => {
  it('an existing user lands in successfulLogin, so onLogin fires', async () => {
    const service = startSocialMachine(false);
    service.send({ type: 'INITIALIZE' } as never);
    service.send({
      type: 'SOCIAL_LOGIN',
      payload: { idToken: 'header.payload.signature', providerName: 'google' },
    } as never);
    await settle();

    expect(service.state.matches('active.login.successfulLogin')).toBe(true);
    // The service resolves an { sessionUser, isNewUser } envelope. Storing that
    // envelope as the user is invisible to a state assertion but hands the
    // consuming app undefined ids, which silently strands the login.
    expect(service.state.context.sessionUser).toMatchObject({
      id: 'u1',
      email: 'someone@example.com',
    });
    service.stop();
  });

  it('a provisioned user lands in register.userCreated, so onRegister fires', async () => {
    const service = startSocialMachine(true);
    service.send({ type: 'INITIALIZE' } as never);
    service.send({
      type: 'SOCIAL_LOGIN',
      payload: { idToken: 'header.payload.signature', providerName: 'google' },
    } as never);
    await settle();

    expect(service.state.matches('active.register.userCreated')).toBe(true);
    expect(service.state.context.sessionUser).toMatchObject({
      id: 'u1',
      email: 'someone@example.com',
    });
    service.stop();
  });
});
