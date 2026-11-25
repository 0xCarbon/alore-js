import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { afterEach, describe, it } from 'node:test';

import {
  AloreAuth,
  AloreAuthError,
  type CustomerStepUpResult,
  ErrorTypes,
  type StepUpFactorsResponse,
} from '../src/index';

function buildTestJwt(header: Record<string, string>, payload: string, sig = 'sig'): string {
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  return `${encodedHeader}.${payload}.${sig}`;
}

const CLIENT_ID = 'pk-test-client';
const BASE_URL = 'https://api.bealore.com';
const ACCESS_TOKEN = buildTestJwt({ alg: 'RS256' }, 'access-secret-token');

type FetchCall = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
};

const originalFetch = globalThis.fetch;

function mockFetchSequence(
  handlers: Array<
    // eslint-disable-next-line no-unused-vars
    (call: FetchCall) => {
      status: number;
      body?: unknown;
      headers?: Record<string, string>;
    }
  >,
) {
  const calls: FetchCall[] = [];
  let idx = 0;

  // eslint-disable-next-line no-undef
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const rawHeaders = (init?.headers ?? {}) as Record<string, string>;
    const headers: Record<string, string> = {};
    Object.entries(rawHeaders).forEach(([k, v]) => {
      headers[k.toLowerCase()] = String(v);
    });
    const parsedBody =
      typeof init?.body === 'string' ? JSON.parse(init.body) : (init?.body ?? undefined);

    const call: FetchCall = {
      url,
      method: init?.method ?? 'GET',
      headers,
      body: parsedBody,
    };
    calls.push(call);

    const handler = handlers[idx];
    idx += 1;
    if (!handler) {
      throw new Error(`Unexpected fetch call #${idx} to ${url}`);
    }
    const spec = handler(call);
    const responseHeaders = new Headers({
      'content-type': 'application/json',
      ...(spec.headers ?? {}),
    });

    return new Response(spec.body !== undefined ? JSON.stringify(spec.body) : null, {
      status: spec.status,
      headers: responseHeaders,
    });
  }) as typeof fetch;

  return calls;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('AloreAuth step-up and customer re-auth SDK helpers (INC-1124)', () => {
  it('getStepUpFactors sends Bearer + X-CLIENT-ID and returns typed customer and staff factors', async () => {
    const expected: StepUpFactorsResponse = {
      enrolled: true,
      totp: true,
      passkey: false,
      hardwareKey: false,
      methods: ['totp'],
      password: true,
      emailCode: true,
      customerMethods: ['password_totp', 'email_code'],
    };

    const calls = mockFetchSequence([
      () => ({
        status: 200,
        body: expected,
      }),
    ]);

    const auth = new AloreAuth(CLIENT_ID, BASE_URL);
    const factors = await auth.getStepUpFactors(ACCESS_TOKEN);

    assert.deepEqual(factors, expected);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `${BASE_URL}/auth/v1/step-up/factors`);
    assert.equal(calls[0].method, 'GET');
    assert.equal(calls[0].headers.authorization, `Bearer ${ACCESS_TOKEN}`);
    assert.equal(calls[0].headers['x-client-id'], CLIENT_ID);
  });

  it('requestCustomerReauthEmailCode and stepUp(email_code) return scoped reauthToken + expiresAt + amr', async () => {
    const calls = mockFetchSequence([
      () => ({
        status: 200,
        body: {
          method: 'email_code',
          sessionId: 'sess-email-1',
          expiresAt: 1764000600,
        },
      }),
      () => ({
        status: 200,
        body: {
          reauthToken: buildTestJwt({ alg: 'RS256', typ: 'reauth+jwt' }, 'payload'),
          purpose: 'customer_reauth',
          scope: 'support_access_grant',
          amr: ['email_otp'],
          authTime: 1764000100,
          expiresAt: 1764000400,
          jti: '11111111-1111-4111-8111-111111111111',
        },
      }),
    ]);

    const auth = new AloreAuth(CLIENT_ID, BASE_URL);
    const challenge = await auth.requestCustomerReauthEmailCode(ACCESS_TOKEN, { locale: 'pt' });
    assert.equal(challenge.method, 'email_code');
    assert.equal(challenge.sessionId, 'sess-email-1');
    assert.equal(challenge.expiresAt, 1764000600);

    const result: CustomerStepUpResult = await auth.stepUp(ACCESS_TOKEN, {
      method: 'email_code',
      emailCode: '482910',
      sessionId: challenge.sessionId,
      scope: 'support_access_grant',
    });

    assert.equal(result.purpose, 'customer_reauth');
    assert.equal(result.scope, 'support_access_grant');
    assert.deepEqual(result.amr, ['email_otp']);
    assert.equal(result.expiresAt, 1764000400);
    assert.equal(result.authTime, 1764000100);
    assert.equal(result.jti, '11111111-1111-4111-8111-111111111111');
    assert.ok(result.reauthToken.length > 10);

    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, `${BASE_URL}/auth/v1/step-up/challenge`);
    assert.deepEqual(calls[0].body, {
      method: 'email_code',
      purpose: 'customer_reauth',
      locale: 'pt',
    });
    assert.equal(calls[1].url, `${BASE_URL}/auth/v1/step-up/customer`);
    assert.deepEqual(calls[1].body, {
      method: 'email_code',
      emailCode: '482910',
      sessionId: 'sess-email-1',
      scope: 'support_access_grant',
    });
  });

  it('stepUp(password) fetches salt and derives Argon2d hash when plaintext password + email is supplied, and includes optional TOTP', async () => {
    const calls = mockFetchSequence([
      () => ({
        status: 200,
        body: 'deterministic-salt-hex',
      }),
      () => ({
        status: 200,
        body: {
          reauthToken: 'reauth.jwt.pwd-totp',
          purpose: 'customer_reauth',
          scope: 'support_access_grant',
          amr: ['pwd', 'otp'],
          authTime: 1764000200,
          expiresAt: 1764000500,
          jti: '22222222-2222-4222-8222-222222222222',
        },
      }),
    ]);

    let receivedPassword = '';
    let receivedSalt = '';
    const auth = new AloreAuth(CLIENT_ID, BASE_URL);
    const result = await auth.stepUp(ACCESS_TOKEN, {
      method: 'password',
      email: 'customer@example.com',
      password: 'SuperSecretPassword!123',
      otp: '654321',
      scope: 'support_access_grant',
      hashPassword: async (password, salt) => {
        receivedPassword = password;
        receivedSalt = salt;
        return '$argon2d$v=19$m=32768,t=3,p=2$derived$hash';
      },
    });

    assert.equal(receivedPassword, 'SuperSecretPassword!123');
    assert.equal(receivedSalt, 'deterministic-salt-hex');
    assert.deepEqual(result.amr, ['pwd', 'otp']);
    assert.equal(result.expiresAt, 1764000500);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, `${BASE_URL}/auth/v1/salt/customer%40example.com`);
    assert.equal(calls[1].url, `${BASE_URL}/auth/v1/step-up/customer`);
    assert.deepEqual(calls[1].body, {
      method: 'password',
      passwordHash: '$argon2d$v=19$m=32768,t=3,p=2$derived$hash',
      otp: '654321',
      scope: 'support_access_grant',
    });
  });

  it('stepUp(passkey) runs challenge -> WebAuthn assertion -> /auth/v1/step-up/customer when credential is not pre-supplied', async () => {
    const publicKeyOptions = { challenge: 'webauthn-challenge-b64', rpId: 'app.joori.ai' };
    const signedCredential = {
      id: 'cred-1',
      rawId: 'cred-1',
      type: 'public-key',
      response: {
        authenticatorData: 'auth-data',
        clientDataJSON: 'client-data',
        signature: 'sig',
      },
    };

    const calls = mockFetchSequence([
      () => ({
        status: 200,
        body: {
          method: 'passkey',
          sessionId: 'sess-pk-1',
          requestChallengeResponse: { publicKey: publicKeyOptions },
          expiresAt: 1764000120,
        },
      }),
      () => ({
        status: 200,
        body: {
          reauthToken: 'reauth.jwt.passkey',
          purpose: 'customer_reauth',
          scope: 'customer_reauth',
          amr: ['hwk'],
          authTime: 1764000300,
          expiresAt: 1764000600,
          jti: '33333333-3333-4333-8333-333333333333',
        },
      }),
    ]);

    let receivedOptions: unknown;
    const auth = new AloreAuth(CLIENT_ID, BASE_URL);
    const result = await auth.stepUp(ACCESS_TOKEN, {
      method: 'passkey',
      rpOrigin: 'https://app.joori.ai',
      authenticatePasskey: async (optionsJSON) => {
        receivedOptions = optionsJSON;
        return signedCredential;
      },
    });

    assert.deepEqual(receivedOptions, publicKeyOptions);
    assert.deepEqual(result.amr, ['hwk']);
    assert.equal(result.reauthToken, 'reauth.jwt.passkey');
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].body, {
      method: 'passkey',
      purpose: 'customer_reauth',
      rpOrigin: 'https://app.joori.ai',
    });
    assert.deepEqual(calls[1].body, {
      method: 'passkey',
      credential: signedCredential,
      sessionId: 'sess-pk-1',
      rpOrigin: 'https://app.joori.ai',
    });
  });

  it('staffStepUp posts to /auth/v1/step-up and returns refreshed staff session tokens', async () => {
    const calls = mockFetchSequence([
      () => ({
        status: 200,
        body: {
          accessToken: 'new-staff-access',
          refreshToken: 'new-staff-refresh',
          amr: ['pwd', 'otp'],
          authTime: 1764000500,
          expiresAt: 1764001400,
        },
      }),
    ]);

    const auth = new AloreAuth(CLIENT_ID, BASE_URL);
    const res = await auth.staffStepUp(ACCESS_TOKEN, { method: 'totp', otp: '112233' });

    assert.equal(res.accessToken, 'new-staff-access');
    assert.equal(res.refreshToken, 'new-staff-refresh');
    assert.deepEqual(res.amr, ['pwd', 'otp']);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `${BASE_URL}/auth/v1/step-up`);
  });

  it('maps 429, 401, and 403 errors to typed AloreAuthError without leaking secrets or OTP codes', async () => {
    const secretPassword = 'MyUltraSecretPassword#99';
    const secretHash = '$argon2d$v=19$m=32768,t=3,p=2$secret$secret-hash-value';
    const secretOtp = '918273';
    const secretEmailCode = '746582';

    mockFetchSequence([
      () => ({
        status: 429,
        headers: { 'retry-after': '120' },
        body: {
          message: `Too many step-up attempts for ${secretPassword} ${secretOtp} ${ACCESS_TOKEN}`,
        },
      }),
      () => ({
        status: 401,
        body: {
          message: `Invalid OTP ${secretEmailCode}`,
        },
      }),
      () => ({
        status: 403,
        body: {
          message: 'TOTP_REQUIRED: Enrolled TOTP code is required alongside password',
        },
      }),
      () => ({
        status: 403,
        body: {
          message: 'No password configured for this account',
        },
      }),
    ]);

    const auth = new AloreAuth(CLIENT_ID, BASE_URL);

    // 1) 429 Too Many Requests
    await assert.rejects(
      () =>
        auth.stepUp(ACCESS_TOKEN, {
          method: 'password',
          passwordHash: secretHash,
          otp: secretOtp,
        }),
      (err: unknown) => {
        assert.ok(err instanceof AloreAuthError);
        assert.equal(err.type, ErrorTypes.TOO_MANY_REQUESTS);
        assert.equal(err.code, 429);
        const serialized = JSON.stringify({ message: err.message, data: (err as any).data });
        assert.ok(!serialized.includes(secretPassword));
        assert.ok(!serialized.includes(secretHash));
        assert.ok(!serialized.includes(secretOtp));
        assert.ok(!serialized.includes(ACCESS_TOKEN));
        assert.equal((err as any).data?.retryAfterSeconds, 120);
        return true;
      },
    );

    // 2) 401 Invalid factor
    await assert.rejects(
      () =>
        auth.stepUp(ACCESS_TOKEN, {
          method: 'email_code',
          emailCode: secretEmailCode,
          sessionId: 'sess-1',
        }),
      (err: unknown) => {
        assert.ok(err instanceof AloreAuthError);
        assert.equal(err.type, ErrorTypes.STEP_UP_INVALID_FACTOR);
        assert.equal(err.code, 401);
        const serialized = JSON.stringify({ message: err.message, data: (err as any).data });
        assert.ok(!serialized.includes(secretEmailCode));
        assert.ok(!serialized.includes(ACCESS_TOKEN));
        return true;
      },
    );

    // 3) 403 TOTP_REQUIRED
    await assert.rejects(
      () =>
        auth.stepUp(ACCESS_TOKEN, {
          method: 'password',
          passwordHash: secretHash,
        }),
      (err: unknown) => {
        assert.ok(err instanceof AloreAuthError);
        assert.equal(err.type, ErrorTypes.STEP_UP_TOTP_REQUIRED);
        assert.equal(err.code, 403);
        const serialized = JSON.stringify({ message: err.message, data: (err as any).data });
        assert.ok(!serialized.includes(secretHash));
        assert.ok(!serialized.includes(ACCESS_TOKEN));
        return true;
      },
    );

    // 4) 403 Forbidden (other)
    await assert.rejects(
      () =>
        auth.stepUp(ACCESS_TOKEN, {
          method: 'password',
          passwordHash: secretHash,
        }),
      (err: unknown) => {
        assert.ok(err instanceof AloreAuthError);
        assert.equal(err.type, ErrorTypes.STEP_UP_FORBIDDEN);
        assert.equal(err.code, 403);
        return true;
      },
    );
  });

  it('rejects empty accessToken immediately without performing a network request', async () => {
    const calls = mockFetchSequence([]);
    const auth = new AloreAuth(CLIENT_ID, BASE_URL);

    await assert.rejects(
      () => auth.stepUp('', { method: 'email_code', emailCode: '123456', sessionId: 's1' }),
      (err: unknown) => {
        assert.ok(err instanceof AloreAuthError);
        assert.equal(err.code, 401);
        return true;
      },
    );
    assert.equal(calls.length, 0);
  });
});
