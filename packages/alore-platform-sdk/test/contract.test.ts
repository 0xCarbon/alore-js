import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import OpenAI, { toFile } from 'openai';

import {
  aloreClient,
  AloreContractVersionError,
  AloreNotFoundError,
  AloreNotImplementedError,
  AloreProblemError,
  AloreRateLimitError,
  AloreUnavailableError,
  parseSemver,
  resetMetaCache,
  verifyWebhook,
} from '../src/index.js';
import { startFake, startStubServer, startWebhookReceiver } from './helpers.js';

const require = createRequire(import.meta.url);
const { version: CONTRACT_VERSION } = require('@alore/platform-contract/package.json') as {
  version: string;
};

// ---------------------------------------------------------------- meta() check & caching

test('meta() validates minContract and caches once per process unless refreshed', async () => {
  resetMetaCache();
  const { fake, baseURL } = await startFake({ features: ['files.status'] });
  const client = aloreClient(
    { baseURL, apiKey: 'test-key', minContract: CONTRACT_VERSION },
    { orgRef: 'org-1', subjectRef: 'user-1', dataClass: 'synthetic' },
  );

  const first = await client.meta();
  assert.equal(first.contract, CONTRACT_VERSION);
  assert.deepEqual(first.features, ['files.status']);
  assert.equal(fake.requests.length, 1);

  // Second call in the same process uses cached result
  const second = await client.meta();
  assert.deepEqual(second, first);
  assert.equal(fake.requests.length, 1);

  // Explicit refresh hits GET /meta again
  const third = await client.meta({ refresh: true });
  assert.deepEqual(third, first);
  assert.equal(fake.requests.length, 2);

  // Higher minContract fails with AloreContractVersionError
  const higherContract = `${parseSemver(CONTRACT_VERSION).major + 1}.0.0`;
  const strictClient = aloreClient(
    { baseURL, apiKey: 'test-key', minContract: higherContract },
    { orgRef: 'org-1', subjectRef: 'user-1', dataClass: 'synthetic' },
  );
  await assert.rejects(() => strictClient.meta(), AloreContractVersionError);
});

// ---------------------------------------------------------------- fake Alore OpenAI + tenancy

test('aloreClient works end-to-end against fake Alore with tenancy headers and files.status', async () => {
  resetMetaCache();
  const { fake, baseURL } = await startFake({
    features: ['files.status'],
    createdFileStatus: 'extracting',
    chatReply: (req: { messages: Array<{ content: string }> }) => `reply:${req.messages.length}`,
  });

  const client = aloreClient(
    { baseURL, apiKey: 'delegated-key', minContract: '0.1.0-alpha.0' },
    {
      orgRef: 'org-42',
      subjectRef: 'user-7',
      dataClass: 'customer',
      grant: 'signed.grant.value',
    },
  );

  // Chat completion through official OpenAI surface
  const chat = await client.openai.chat.completions.create({
    model: 'anga-1-mirim',
    messages: [{ role: 'user', content: 'hello' }],
  });
  assert.equal(chat.choices[0]?.message.content, 'reply:1');

  // Multipart file upload + files.status (x_alore.status) + download + delete
  const payload = Buffer.from('sample-contract-body');
  const uploaded = await client.openai.files.create({
    file: await toFile(payload, 'sample.txt', { type: 'text/plain' }),
    purpose: 'assistants',
  });
  assert.equal(typeof uploaded.id, 'string');
  assert.deepEqual(await client.files.status(uploaded.id), { status: 'extracting' });

  await fake.setFileStatus(uploaded.id, 'ready');
  assert.deepEqual(await client.files.status(uploaded.id), { status: 'ready' });

  const downloaded = await (await client.openai.files.content(uploaded.id)).text();
  assert.equal(downloaded, 'sample-contract-body');

  // Vector store lifecycle
  const store = await client.openai.vectorStores.create({ name: 'case-1' });
  await client.openai.vectorStores.files.create(store.id, { file_id: uploaded.id });
  const listed = await client.openai.vectorStores.files.list(store.id);
  assert.deepEqual(
    listed.data.map((item) => item.id),
    [uploaded.id],
  );
  await client.openai.vectorStores.files.del(store.id, uploaded.id);
  await client.openai.vectorStores.del(store.id);
  const deleted = await client.openai.files.del(uploaded.id);
  assert.equal(deleted.deleted, true);

  // Every request carried tenancy headers and redacted the grant
  assert.ok(fake.requests.length >= 8);
  for (const entry of fake.requests) {
    assert.equal(entry.headers['x-alore-org'], 'org-42');
    assert.equal(entry.headers['x-user-id'], 'user-7');
    assert.equal(entry.headers['x-alore-data-class'], 'customer');
    assert.equal(entry.headers['x-alore-grant'], '[redacted]');
    assert.equal(entry.headers['openai-organization'], undefined);
    assert.equal(entry.headers['openai-project'], undefined);
  }
});

test('files.status falls back cleanly when files.status feature is not enabled', async () => {
  const { fake, baseURL } = await startFake({ features: [] });
  const seeded = fake.seedFile({ filename: 'plain.pdf', status: 'ready' });
  const client = aloreClient(
    { baseURL, apiKey: 'test-key', minContract: '0.1.0-alpha.0' },
    { orgRef: null, subjectRef: null, dataClass: 'public' },
  );
  assert.deepEqual(await client.files.status(seeded.id), { status: 'ready' });
});

// ---------------------------------------------------------------- X-Fake-Scenario -> typed errors

test('X-Fake-Scenario responses map to typed AloreProblemError subclasses', async () => {
  const { baseURL } = await startFake();
  const client = aloreClient(
    { baseURL, apiKey: 'test-key', minContract: '0.1.0-alpha.0', maxRetries: 0 },
    { orgRef: 'org-1', subjectRef: null, dataClass: 'synthetic' },
  );

  await assert.rejects(
    () =>
      client.openai.files.list(undefined, {
        headers: { 'x-fake-scenario': 'rate_limited' },
      }),
    (err: unknown) =>
      err instanceof AloreRateLimitError &&
      err instanceof AloreProblemError &&
      err instanceof OpenAI.APIError &&
      err.status === 429 &&
      err.problemType === 'rate_limited' &&
      err.retryAfter === '1',
  );

  await assert.rejects(
    () =>
      client.openai.files.list(undefined, {
        headers: { 'x-fake-scenario': 'unavailable' },
      }),
    (err: unknown) =>
      err instanceof AloreUnavailableError &&
      err.status === 503 &&
      err.problemType === 'unavailable',
  );

  await assert.rejects(
    () =>
      client.openai.files.list(undefined, {
        headers: { 'x-fake-scenario': 'not_implemented' },
      }),
    (err: unknown) =>
      err instanceof AloreNotImplementedError &&
      err.status === 501 &&
      err.problemType === 'not_implemented',
  );

  await assert.rejects(
    () =>
      client.openai.files.list(undefined, {
        headers: { 'x-fake-scenario': 'expired' },
      }),
    (err: unknown) =>
      err instanceof AloreNotFoundError &&
      err.status === 404 &&
      err.problemType === 'not_found' &&
      err.isExpired === true,
  );
});

// ---------------------------------------------------------------- retry gating & idempotency

test('retries happen on idempotent GETs and POSTs with Idempotency-Key, never on POSTs without a key', async () => {
  let postWithoutKeyAttempts = 0;
  let postWithKeyAttempts = 0;
  let getAttempts = 0;
  const seenKeys: string[] = [];

  const stub = await startStubServer((req) => {
    const unavailable = {
      status: 503,
      headers: { 'content-type': 'application/problem+json', 'retry-after-ms': '1' },
      body: {
        type: 'unavailable',
        title: 'Service unavailable',
        status: 503,
        detail: 'Temporary failure.',
        error: {
          type: 'unavailable',
          message: 'Temporary failure.',
          code: 'unavailable',
          param: null,
        },
      },
    };
    if (req.method === 'GET' && req.path === '/ai/v1/jobs/job-1') {
      getAttempts += 1;
      return getAttempts < 2
        ? unavailable
        : { status: 200, body: { id: 'job-1', type: 'ocr', class: 'normal', status: 'queued' } };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/decisions') {
      postWithoutKeyAttempts += 1;
      return unavailable;
    }
    if (req.method === 'POST' && req.path === '/ai/v1/jobs') {
      postWithKeyAttempts += 1;
      if (typeof req.headers['idempotency-key'] === 'string') {
        seenKeys.push(req.headers['idempotency-key']);
      }
      return postWithKeyAttempts < 2
        ? unavailable
        : { status: 200, body: { id: 'job-2', type: 'ocr', class: 'normal', status: 'queued' } };
    }
    return { status: 404 };
  });

  const client = aloreClient(
    { baseURL: stub.baseURL, apiKey: 'test-key', minContract: '0.1.0-alpha.0', maxRetries: 2 },
    { orgRef: 'org-1', subjectRef: null, dataClass: 'synthetic' },
  );

  // Idempotent GET retries and succeeds on 2nd attempt
  const job = await client.jobs.get('job-1');
  assert.equal(job.id, 'job-1');
  assert.equal(getAttempts, 2);

  // Non-idempotent POST without Idempotency-Key MUST NOT retry
  await assert.rejects(
    () =>
      client.decisions.create({
        task: 'flow.agent@1',
        input: { text: 'test' },
        choices: ['a', 'b'],
      }),
    AloreUnavailableError,
  );
  assert.equal(postWithoutKeyAttempts, 1);

  // POST with Idempotency-Key retries and preserves the same key across attempts
  const submitted = await client.jobs.submit(
    { type: 'ocr', class: 'normal', input_ref: { file_id: 'f-1' } },
    'idempotency-key-123',
  );
  assert.equal(submitted.id, 'job-2');
  assert.equal(postWithKeyAttempts, 2);
  assert.deepEqual(seenKeys, ['idempotency-key-123', 'idempotency-key-123']);
});

// ---------------------------------------------------------------- signed webhooks from fake Alore

test('verifyWebhook verifies live signed deliveries emitted by fake Alore', async () => {
  const secret = `whsec_${Buffer.from('sdk-contract-webhook-secret').toString('base64')}`;
  const hook = await startWebhookReceiver();
  const { fake } = await startFake({
    webhookUrl: hook.url,
    webhookSecret: secret,
    webhookClock: 'wall',
    client: 'client-dev',
    orgRef: 'org-99',
  });

  const seeded = fake.seedFile({ filename: 'filing.pdf', status: 'received' });
  await fake.setFileStatus(seeded.id, 'text_ready');
  await fake.setFileStatus(seeded.id, 'ready');
  await fake.flush();

  assert.equal(hook.received.length, 2);
  const events = hook.received.map((item) => verifyWebhook(item.rawBody, item.headers, secret));
  assert.deepEqual(
    events.map((e) => [e.type, e.seq, e.org_ref, e.subject.id]),
    [
      ['file.text_ready', 1, 'org-99', seeded.id],
      ['file.ready', 2, 'org-99', seeded.id],
    ],
  );
});

// ---------------------------------------------------------------- extension route helpers

test('extension helpers route through OpenAI generic post/get/delete with tenancy headers', async () => {
  const stub = await startStubServer((req) => {
    if (req.method === 'POST' && req.path === '/ai/v1/decisions') {
      return {
        status: 200,
        body: {
          id: 'dec-1',
          task: 'flow.agent@1',
          choice: 'route_a',
          confidence: 0.94,
          reason_code: 'matched',
        },
      };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/decisions/dec-1/feedback') {
      return { status: 204 };
    }
    if (req.method === 'GET' && req.path === '/ai/v1/decisions/tasks') {
      return { status: 200, body: { tasks: [{ id: 'flow.agent@1' }] } };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/jobs') {
      return { status: 200, body: { id: 'job-9', type: 'ocr', class: 'batch', status: 'queued' } };
    }
    if (req.method === 'DELETE' && req.path === '/ai/v1/jobs/job-9') {
      return { status: 204 };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/search') {
      return {
        status: 200,
        body: { hits: [{ file_id: 'f-1', score: 0.88, text: 'excerpt', page: 2 }] },
      };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/ocr') {
      return { status: 200, body: { file_id: 'f-1', pages: [{ page: 1, text: 'page 1' }] } };
    }
    if (req.method === 'GET' && req.path === '/ai/v1/files/f-1/text') {
      return { status: 200, headers: { 'content-type': 'text/plain' }, rawBody: 'extracted text' };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/files/from_url') {
      return {
        status: 200,
        body: {
          id: 'f-url',
          object: 'file',
          bytes: 12,
          created_at: 1700000000,
          filename: 'doc.pdf',
          purpose: 'assistants',
          status: 'uploaded',
        },
      };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/files/register') {
      return {
        status: 200,
        body: {
          id: 'f-reg',
          object: 'file',
          bytes: 20,
          created_at: 1700000000,
          filename: 'legacy.pdf',
          purpose: 'assistants',
          status: 'processed',
        },
      };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/files/f-reg/reprocess') {
      return {
        status: 200,
        body: {
          id: 'f-reg',
          object: 'file',
          bytes: 20,
          created_at: 1700000000,
          filename: 'legacy.pdf',
          purpose: 'assistants',
          status: 'uploaded',
          x_alore: { status: 'extracting' },
        },
      };
    }
    if (req.method === 'GET' && req.path === '/ai/v1/conversations/conv-1/vector_stores') {
      return { status: 200, body: { vector_store_ids: ['vs-1', 'vs-2'] } };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/conversations/conv-1/vector_stores') {
      return { status: 204 };
    }
    if (req.method === 'DELETE' && req.path === '/ai/v1/conversations/conv-1/vector_stores/vs-1') {
      return { status: 204 };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/conversations/conv-1/fork') {
      return {
        status: 200,
        body: {
          id: 'conv-2',
          object: 'conversation',
          x_alore: { forked_from: { conversation_id: 'conv-1', item_id: 'item-3' } },
        },
      };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/conversations/conv-1/items') {
      return { status: 204 };
    }
    if (req.method === 'POST' && req.path === '/ai/v1/responses') {
      return { status: 200, body: { id: 'resp-1', object: 'response', output_text: 'ok' } };
    }
    return { status: 404 };
  });

  const client = aloreClient(
    { baseURL: stub.baseURL, apiKey: 'ext-key', minContract: '0.1.0-alpha.0' },
    { orgRef: 'org-ext', subjectRef: 'subject-ext', dataClass: 'customer' },
  );

  const decision = await client.decisions.create(
    { task: 'flow.agent@1', input: { text: 'hello' }, choices: ['route_a', 'route_b'] as const },
    { idempotencyKey: 'dec-key-1' },
  );
  assert.equal(decision.choice, 'route_a');
  await client.decisions.feedback('dec-1', 'route_b');
  const tasks = await client.decisions.tasks();
  assert.equal(tasks.tasks[0]?.id, 'flow.agent@1');

  const submitted = await client.jobs.submit(
    { type: 'ocr', class: 'batch', input_ref: { file_id: 'f-1' } },
    'job-key-9',
  );
  assert.equal(submitted.id, 'job-9');
  await client.jobs.cancel('job-9');
  assert.throws(
    () => client.jobs.submit({ type: 'ocr', class: 'batch', input_ref: {} }, ''),
    /idempotencyKey/,
  );

  const search = await client.search({ vector_store_ids: ['vs-1'], query: 'deadline', k: 5 });
  assert.equal(search.hits[0]?.file_id, 'f-1');

  const ocr = await client.ocr({ file_id: 'f-1' }, { idempotencyKey: 'ocr-key-1' });
  assert.equal(ocr.pages[0]?.text, 'page 1');

  assert.equal(await client.files.text('f-1'), 'extracted text');

  const sha = createHash('sha256').update('abc').digest('hex');
  const fromUrl = await client.files.fromUrl({
    url: 'https://example.invalid/doc.pdf',
    sha256: sha,
    filename: 'doc.pdf',
  });
  assert.equal(fromUrl.id, 'f-url');

  const registered = await client.files.register({
    storageRef: 'bucket-dev/org-ext/legacy.pdf',
    sha256: sha,
    filename: 'legacy.pdf',
  });
  assert.equal(registered.id, 'f-reg');
  const regReq = stub.requests.find((r) => r.path === '/ai/v1/files/register');
  assert.deepEqual(regReq?.jsonBody, {
    storage_ref: 'bucket-dev/org-ext/legacy.pdf',
    sha256: sha,
    filename: 'legacy.pdf',
  });

  const reprocessed = await client.files.reprocess('f-reg');
  assert.equal(reprocessed.x_alore?.status, 'extracting');

  assert.deepEqual(await client.conversations.sources.list('conv-1'), ['vs-1', 'vs-2']);
  await client.conversations.sources.attach('conv-1', 'vs-3');
  await client.conversations.sources.detach('conv-1', 'vs-1');
  const forked = await client.conversations.fork('conv-1', {
    itemId: 'item-3',
    inheritSources: true,
  });
  assert.equal(forked.x_alore.forked_from.item_id, 'item-3');
  await client.conversations.persist('conv-1', 'resp-1', { allowAdvanced: true });

  await client.responses.readOnly({
    model: 'anga-1-saci',
    conversation: 'conv-1',
    input: 'summarize',
    baseItemId: 'item-2',
  });
  const respReq = stub.requests.find((r) => r.path === '/ai/v1/responses');
  assert.deepEqual(respReq?.jsonBody, {
    model: 'anga-1-saci',
    conversation: 'conv-1',
    input: 'summarize',
    store: false,
    x_alore: {
      history: 'read_only',
      base_item_id: 'item-2',
    },
  });

  // Verify tenancy headers on every single extension request
  for (const entry of stub.requests) {
    assert.equal(entry.headers['x-alore-org'], 'org-ext');
    assert.equal(entry.headers['x-user-id'], 'subject-ext');
    assert.equal(entry.headers['x-alore-data-class'], 'customer');
  }
});
