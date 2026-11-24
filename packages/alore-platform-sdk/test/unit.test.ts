import {
  DEFAULT_WEBHOOK_SECRET,
  loadFakeContract,
  signWebhook,
} from '@alore/platform-contract/fake';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';

import {
  ALORE_EVENT_TYPES,
  ALORE_FILE_STATUSES,
  ALORE_PROBLEM_TYPES,
  aloreClient,
  AloreConflictError,
  AloreContractVersionError,
  AloreInvalidRequestError,
  AloreNotFoundError,
  AloreNotImplementedError,
  AlorePayloadTooLargeError,
  type AloreProblem,
  AloreProblemError,
  AloreRateLimitError,
  AloreUnavailableError,
  AloreUnsupportedMediaTypeError,
  AloreWebhookVerificationError,
  assertCompatibleContract,
  buildTenancyHeaders,
  compareSemver,
  type DataSource,
  deriveDataClass,
  deriveIdempotencyKey,
  generateIdempotencyKey,
  isAloreProblem,
  problemToError,
  resetMetaCache,
  type TenancyContext,
  verifyWebhook,
} from '../src/index.js';
import { startStubServer } from './helpers.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const pkgRoot = testDir.endsWith('/build/test') ? join(testDir, '..', '..') : join(testDir, '..');
const contract = loadFakeContract();

// ---------------------------------------------------------------- tenancy & compile-time guard

test('buildTenancyHeaders maps orgRef, subjectRef -> X-USER-ID, dataClass and grant', () => {
  const full = buildTenancyHeaders({
    orgRef: 'org-123',
    subjectRef: 'user-456',
    dataClass: 'customer',
    grant: 'signed.grant.token',
  });
  assert.deepEqual(full, {
    'X-Alore-Org': 'org-123',
    'X-USER-ID': 'user-456',
    'X-Alore-Data-Class': 'customer',
    'X-Alore-Grant': 'signed.grant.token',
  });
  assert.equal('X-Alore-Subject' in full, false);

  const crawler = buildTenancyHeaders({
    orgRef: null,
    subjectRef: null,
    dataClass: 'public',
  });
  assert.deepEqual(crawler, {
    'X-Alore-Data-Class': 'public',
  });
  assert.equal('X-Alore-Org' in crawler, false);
  assert.equal('X-USER-ID' in crawler, false);
  assert.equal('X-Alore-Grant' in crawler, false);
});

test('aloreClient requires TenancyContext at compile time and validates it at runtime', () => {
  // Compile-time check: omitting TenancyContext must be a type error.
  if (false as boolean) {
    // @ts-expect-error TenancyContext is required
    aloreClient({
      baseURL: 'http://127.0.0.1:4010/ai/v1',
      apiKey: 'key',
      minContract: '0.1.0-alpha.0',
    });
  }

  const baseCfg = {
    baseURL: 'http://127.0.0.1:4010/ai/v1',
    apiKey: 'key',
    minContract: '0.1.0-alpha.0',
  };

  assert.throws(
    () => aloreClient(baseCfg, undefined as unknown as TenancyContext),
    /TenancyContext/,
  );
  assert.throws(
    () =>
      aloreClient(baseCfg, {
        orgRef: '',
        subjectRef: null,
        dataClass: 'customer',
      }),
    /orgRef/,
  );
  assert.throws(
    () =>
      aloreClient(baseCfg, {
        orgRef: 'org-1',
        subjectRef: '   ',
        dataClass: 'customer',
      }),
    /subjectRef/,
  );
  assert.throws(
    () =>
      aloreClient(baseCfg, {
        orgRef: 'org-1',
        subjectRef: null,
        dataClass: 'sealed' as never,
      }),
    /dataClass/,
  );
  assert.throws(
    () =>
      aloreClient(
        { ...baseCfg, apiKey: '' },
        { orgRef: 'org-1', subjectRef: null, dataClass: 'customer' },
      ),
    /apiKey/,
  );
  assert.throws(
    () =>
      aloreClient(
        { ...baseCfg, minContract: 'not-semver' },
        { orgRef: 'org-1', subjectRef: null, dataClass: 'customer' },
      ),
    /minContract/,
  );
});

test('deriveDataClass maps every DataSource conservatively', () => {
  const cases: Array<[DataSource, string]> = [
    ['customer-upload', 'customer'],
    ['case-capture', 'customer'],
    ['user-feedback', 'customer'],
    ['support', 'customer'],
    ['public-corpus', 'public'],
    ['synthetic-fixture', 'synthetic'],
  ];
  for (const [source, expected] of cases) {
    assert.equal(deriveDataClass(source), expected);
  }
});

// ---------------------------------------------------------------- authMode (alore-11)

test('authMode supports bearer (default) and api-key (pre-INC-120 X-API-KEY transition)', async () => {
  const stub = await startStubServer(() => ({
    status: 200,
    body: { contract: '0.1.0-alpha.0', features: [] },
  }));

  resetMetaCache();
  const bearerClient = aloreClient(
    {
      baseURL: stub.baseURL,
      apiKey: 'secret-bearer-key',
      minContract: '0.1.0-alpha.0',
    },
    { orgRef: 'org-1', subjectRef: 'user-1', dataClass: 'synthetic' },
  );
  await bearerClient.meta({ refresh: true });

  const apiKeyClient = aloreClient(
    {
      baseURL: stub.baseURL,
      apiKey: 'secret-legacy-key',
      minContract: '0.1.0-alpha.0',
      authMode: 'api-key',
    },
    { orgRef: 'org-1', subjectRef: 'user-1', dataClass: 'synthetic' },
  );
  await apiKeyClient.meta({ refresh: true });

  assert.equal(stub.requests.length, 2);
  assert.equal(stub.requests[0]?.headers.authorization, 'Bearer secret-bearer-key');
  assert.equal(stub.requests[0]?.headers['x-api-key'], undefined);

  assert.equal(stub.requests[1]?.headers['x-api-key'], 'secret-legacy-key');
  assert.equal(stub.requests[1]?.headers.authorization, undefined);
});

// ---------------------------------------------------------------- semver & meta compatibility

test('compareSemver follows SemVer 2.0 prerelease precedence', () => {
  const ordered = [
    '0.1.0-alpha.0',
    '0.1.0-alpha.1',
    '0.1.0-alpha.2',
    '0.1.0-alpha.10',
    '0.1.0-beta.0',
    '0.1.0',
    '0.2.0-alpha.0',
    '0.2.0',
    '1.0.0-alpha.0',
    '1.0.0',
    '1.1.0',
    '2.0.0',
  ];
  for (let i = 0; i < ordered.length; i += 1) {
    assert.equal(compareSemver(ordered[i]!, ordered[i]!), 0);
    for (let j = i + 1; j < ordered.length; j += 1) {
      assert.ok(
        compareSemver(ordered[i]!, ordered[j]!) < 0,
        `expected ${ordered[i]} < ${ordered[j]}`,
      );
      assert.ok(
        compareSemver(ordered[j]!, ordered[i]!) > 0,
        `expected ${ordered[j]} > ${ordered[i]}`,
      );
    }
  }
});

test('assertCompatibleContract allows >= minContract and rejects older or breaking major', () => {
  assert.doesNotThrow(() => assertCompatibleContract('0.1.0-alpha.0', '0.1.0-alpha.0'));
  assert.doesNotThrow(() => assertCompatibleContract('0.1.0-alpha.3', '0.1.0-alpha.0'));
  assert.doesNotThrow(() => assertCompatibleContract('0.2.0', '0.1.0-alpha.0'));
  assert.doesNotThrow(() => assertCompatibleContract('1.3.0', '1.2.0'));

  assert.throws(
    () => assertCompatibleContract('0.1.0-alpha.0', '0.1.0-alpha.1'),
    AloreContractVersionError,
  );
  assert.throws(
    () => assertCompatibleContract('0.1.0-alpha.0', '0.1.0'),
    AloreContractVersionError,
  );
  assert.throws(() => assertCompatibleContract('2.0.0', '1.0.0'), AloreContractVersionError);
});

// ---------------------------------------------------------------- idempotency keys

test('idempotency helpers generate unique keys and deterministic receipt keys', () => {
  const a = generateIdempotencyKey();
  const b = generateIdempotencyKey();
  assert.notEqual(a, b);
  assert.ok(a.length >= 32);

  const prefixed = generateIdempotencyKey('job');
  assert.match(prefixed, /^job_[0-9a-f-]{36}$/);

  const d1 = deriveIdempotencyKey('jobs.submit', ['org-1', 'receipt-42', 1]);
  const d2 = deriveIdempotencyKey('jobs.submit', ['org-1', 'receipt-42', 1]);
  const d3 = deriveIdempotencyKey('jobs.submit', ['org-1', 'receipt-42', 2]);
  assert.equal(d1, d2);
  assert.notEqual(d1, d3);
  assert.match(d1, /^jobs\.submit:[0-9a-f]{64}$/);
});

// ---------------------------------------------------------------- contract enum alignment & problems

test('SDK enum lists match @alore/platform-contract schemas exactly', () => {
  const problemEnum = contract.doc.components.schemas.AloreProblem.properties.type.enum as string[];
  assert.deepEqual([...ALORE_PROBLEM_TYPES], problemEnum);

  const fileStatusEnum = contract.doc.components.schemas.AloreFileExtension.properties.status
    .enum as string[];
  assert.deepEqual([...ALORE_FILE_STATUSES], fileStatusEnum);

  const validEventTypes = Object.entries(contract.fixtures)
    .filter(([k, v]) => k.startsWith('events/') && v.valid)
    .map(([, v]) => (v.instance as { type: string }).type)
    .sort();
  assert.deepEqual([...ALORE_EVENT_TYPES].sort(), [...new Set(validEventTypes)].sort());
});

test('problemToError maps every contract error fixture to its typed AloreProblemError subclass', () => {
  const expectedClass: Record<string, new (...args: never[]) => AloreProblemError> = {
    not_found: AloreNotFoundError,
    invalid_request: AloreInvalidRequestError,
    rate_limited: AloreRateLimitError,
    unavailable: AloreUnavailableError,
    conflict: AloreConflictError,
    payload_too_large: AlorePayloadTooLargeError,
    unsupported_media_type: AloreUnsupportedMediaTypeError,
    contract_version: AloreContractVersionError,
    not_implemented: AloreNotImplementedError,
  };

  for (const type of ALORE_PROBLEM_TYPES) {
    const fixture = contract.fixtures[`errors/${type}.json`] as {
      valid: boolean;
      instance: AloreProblem;
    };
    assert.equal(fixture.valid, true);
    assert.equal(isAloreProblem(fixture.instance), true, `expected ${type} to be AloreProblem`);

    const err = problemToError(
      fixture.instance,
      type === 'rate_limited' ? { 'retry-after': '3' } : undefined,
    );
    assert.ok(err instanceof AloreProblemError);
    assert.ok(err instanceof OpenAI.APIError);
    assert.ok(err instanceof expectedClass[type]!);
    assert.equal(err.problemType, type);
    assert.equal(err.status, fixture.instance.status);
    assert.equal(err.title, fixture.instance.title);
    assert.equal(err.code, fixture.instance.error.code);
    if (err instanceof AloreRateLimitError) {
      assert.equal(err.retryAfter, '3');
      assert.equal(err.retryAfterMs, 3000);
    }
  }

  // Expired not_found detection
  const expiredErr = problemToError({
    type: 'not_found',
    title: 'Not found',
    status: 404,
    detail: 'The resource has expired.',
    error: {
      type: 'not_found',
      message: 'The resource has expired.',
      code: 'expired',
      param: null,
    },
  });
  assert.ok(expiredErr instanceof AloreNotFoundError);
  assert.equal(expiredErr.isExpired, true);

  // Invalid contract error fixtures must be rejected by isAloreProblem
  for (const invalidFile of [
    'errors/extra-field.json',
    'errors/missing-openai-error.json',
    'errors/unknown-type.json',
  ]) {
    const fixture = contract.fixtures[invalidFile] as { valid: boolean; instance: unknown };
    assert.equal(fixture.valid, false);
    assert.equal(isAloreProblem(fixture.instance), false, `${invalidFile} must not match`);
  }
});

// ---------------------------------------------------------------- webhook verifier

test('verifyWebhook validates every valid contract event fixture signed with Standard Webhooks', () => {
  const now = 1_700_000_000;
  const eventFixtures = Object.entries(contract.fixtures).filter(
    ([name, f]) => name.startsWith('events/') && f.valid,
  );
  assert.ok(eventFixtures.length >= 15);

  for (const [name, fixture] of eventFixtures) {
    const instance = fixture.instance as { id: string };
    const rawBody = JSON.stringify(instance);
    const headers = signWebhook({
      id: instance.id,
      timestamp: now,
      body: rawBody,
      secret: DEFAULT_WEBHOOK_SECRET,
    });
    const verified = verifyWebhook(rawBody, headers, DEFAULT_WEBHOOK_SECRET, { nowSeconds: now });
    assert.deepEqual(verified, instance, name);

    // Also accepts Uint8Array body and Web Headers
    const verifiedBytes = verifyWebhook(
      new TextEncoder().encode(rawBody),
      new Headers(headers),
      DEFAULT_WEBHOOK_SECRET,
      { nowSeconds: now },
    );
    assert.deepEqual(verifiedBytes, instance, `${name} bytes`);
  }
});

test('verifyWebhook supports multiple signatures and rotated secrets, and rejects tampering/skew/invalid payloads', () => {
  const now = 1_700_000_000;
  const oldSecret = `whsec_${Buffer.from('old-secret').toString('base64')}`;
  const newSecret = `whsec_${Buffer.from('new-secret').toString('base64')}`;
  const event = (contract.fixtures['events/file-ready.json'] as { instance: { id: string } })
    .instance;
  const rawBody = JSON.stringify(event);
  const signed = signWebhook({
    id: event.id,
    timestamp: now,
    body: rawBody,
    secret: newSecret,
  });

  // Multiple space-separated signatures (Standard Webhooks format)
  const multiSignatureHeaders = {
    ...signed,
    'webhook-signature': `v1,${Buffer.from('wrong').toString('base64')} ${signed['webhook-signature']}`,
  };
  assert.deepEqual(
    verifyWebhook(rawBody, multiSignatureHeaders, [oldSecret, newSecret], { nowSeconds: now }),
    event,
  );

  // Missing header
  assert.throws(
    () =>
      verifyWebhook(
        rawBody,
        { 'webhook-id': event.id, 'webhook-timestamp': String(now) },
        newSecret,
        { nowSeconds: now },
      ),
    (err: unknown) =>
      err instanceof AloreWebhookVerificationError && err.reason === 'missing_header',
  );

  // Malformed timestamp
  assert.throws(
    () =>
      verifyWebhook(rawBody, { ...signed, 'webhook-timestamp': 'not-a-number' }, newSecret, {
        nowSeconds: now,
      }),
    (err: unknown) =>
      err instanceof AloreWebhookVerificationError && err.reason === 'invalid_timestamp',
  );

  // Timestamp outside 5-minute tolerance (replay / clock skew)
  assert.throws(
    () => verifyWebhook(rawBody, signed, newSecret, { nowSeconds: now + 301 }),
    (err: unknown) =>
      err instanceof AloreWebhookVerificationError && err.reason === 'timestamp_outside_tolerance',
  );

  // Tampered body
  assert.throws(
    () => verifyWebhook(`${rawBody} `, signed, newSecret, { nowSeconds: now }),
    (err: unknown) =>
      err instanceof AloreWebhookVerificationError && err.reason === 'invalid_signature',
  );

  // Wrong secret
  assert.throws(
    () => verifyWebhook(rawBody, signed, oldSecret, { nowSeconds: now }),
    (err: unknown) =>
      err instanceof AloreWebhookVerificationError && err.reason === 'invalid_signature',
  );

  // Extra top-level property rejected (closed alore.evt/1 envelope)
  const extraBody = JSON.stringify({ ...event, unexpected: true });
  const extraSigned = signWebhook({
    id: event.id,
    timestamp: now,
    body: extraBody,
    secret: newSecret,
  });
  assert.throws(
    () => verifyWebhook(extraBody, extraSigned, newSecret, { nowSeconds: now }),
    (err: unknown) =>
      err instanceof AloreWebhookVerificationError && err.reason === 'invalid_payload',
  );

  // Empty secret rejected
  assert.throws(
    () => verifyWebhook(rawBody, signed, '', { nowSeconds: now }),
    (err: unknown) =>
      err instanceof AloreWebhookVerificationError && err.reason === 'invalid_secret',
  );
});

test('verifyWebhook rejects NaN, negative, or non-finite toleranceSeconds and nowSeconds', () => {
  const signedAt = 1_700_000_000;
  const expiredNow = signedAt + 10_000;
  const event = (contract.fixtures['events/file-ready.json'] as { instance: { id: string } })
    .instance;
  const rawBody = JSON.stringify(event);
  const signed = signWebhook({
    id: event.id,
    timestamp: signedAt,
    body: rawBody,
    secret: DEFAULT_WEBHOOK_SECRET,
  });

  for (const badTolerance of [Number.NaN, -1, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(
      () =>
        verifyWebhook(rawBody, signed, DEFAULT_WEBHOOK_SECRET, {
          nowSeconds: expiredNow,
          toleranceSeconds: badTolerance,
        }),
      RangeError,
      `expected RangeError for toleranceSeconds=${String(badTolerance)}`,
    );
  }

  for (const badNow of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(
      () =>
        verifyWebhook(rawBody, signed, DEFAULT_WEBHOOK_SECRET, {
          nowSeconds: badNow,
        }),
      RangeError,
      `expected RangeError for nowSeconds=${String(badNow)}`,
    );
  }
});

test('defaultHeaders and per-request headers cannot spoof or override tenancy headers', async () => {
  const stub = await startStubServer(() => ({
    status: 200,
    body: { contract: '0.1.0-alpha.0', features: [] },
  }));

  resetMetaCache();
  // Omitted orgRef / subjectRef (crawler mode) must not be spoofed via defaultHeaders or opts.headers
  const crawler = aloreClient(
    {
      baseURL: stub.baseURL,
      apiKey: 'crawler-key',
      minContract: '0.1.0-alpha.0',
      defaultHeaders: {
        'x-org-id': 'spoofed-org',
        'X-Alore-Org': 'spoofed-org',
        'x-user-id': 'spoofed-user',
        'X-Alore-Subject': 'spoofed-subject',
        'X-Alore-Data-Class': 'synthetic',
        'x-alore-grant': 'spoofed-grant',
        'X-Custom-Default': 'kept-default',
      },
    },
    { orgRef: null, subjectRef: null, dataClass: 'public' },
  );

  await crawler.meta({
    refresh: true,
    headers: {
      'X-ORG-ID': 'req-spoofed-org',
      'x-alore-org': 'req-spoofed-org',
      'X-USER-ID': 'req-spoofed-user',
      'x-alore-subject': 'req-spoofed-subject',
      'x-alore-data-class': 'customer',
      'X-Alore-Grant': 'req-spoofed-grant',
      'X-Custom-Request': 'kept-request',
    },
  });

  // Also test direct client.openai.* calls with per-request spoof/null-out attempts
  const delegated = aloreClient(
    {
      baseURL: stub.baseURL,
      apiKey: 'delegated-key',
      minContract: '0.1.0-alpha.0',
    },
    { orgRef: 'org-real', subjectRef: 'user-real', dataClass: 'customer' },
  );
  await delegated.openai.get('/meta', {
    headers: {
      'x-alore-org': null,
      'X-ORG-ID': 'evil-org',
      'x-user-id': 'evil-user',
      'x-alore-data-class': 'public',
      'X-Trace-Id': 'trace-1',
    },
  });

  assert.equal(stub.requests.length, 2);

  const crawlerReq = stub.requests[0]!;
  assert.equal(crawlerReq.headers['x-org-id'], undefined);
  assert.equal(crawlerReq.headers['x-alore-org'], undefined);
  assert.equal(crawlerReq.headers['x-user-id'], undefined);
  assert.equal(crawlerReq.headers['x-alore-subject'], undefined);
  assert.equal(crawlerReq.headers['x-alore-grant'], undefined);
  assert.equal(crawlerReq.headers['x-alore-data-class'], 'public');
  assert.equal(crawlerReq.headers['x-custom-default'], 'kept-default');
  assert.equal(crawlerReq.headers['x-custom-request'], 'kept-request');

  const delegatedReq = stub.requests[1]!;
  assert.equal(delegatedReq.headers['x-alore-org'], 'org-real');
  assert.equal(delegatedReq.headers['x-org-id'], undefined);
  assert.equal(delegatedReq.headers['x-user-id'], 'user-real');
  assert.equal(delegatedReq.headers['x-alore-data-class'], 'customer');
  assert.equal(delegatedReq.headers['x-trace-id'], 'trace-1');
});

// ---------------------------------------------------------------- alore-js-09 boundary check

test('alore-js-09: @alore/platform-sdk stays auth-free and delegates OpenAI surfaces to the official SDK', () => {
  const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const allDeps = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
  assert.equal(allDeps.has('@alore/auth-react-sdk'), false);
  assert.equal(allDeps.has('@alore/auth-react-ui'), false);
  assert.equal(allDeps.has('react'), false);
  assert.equal(allDeps.has('xstate'), false);
  assert.ok(pkg.peerDependencies?.openai);

  const client = aloreClient(
    {
      baseURL: 'http://127.0.0.1:4010/ai/v1',
      apiKey: 'test-key',
      minContract: '0.1.0-alpha.0',
    },
    { orgRef: 'org-1', subjectRef: null, dataClass: 'synthetic' },
  );
  assert.ok(client.openai instanceof OpenAI);
});
