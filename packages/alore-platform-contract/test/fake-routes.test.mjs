// The fake's behaviour on the routes Joori and the crawler call, and its failure handling:
// 1. Every operation fixture and every body the fake sends validates against its operation.
// 2. Every problem, from every scenario on every route, validates against the response the
//    operation declares for its status (else problem.schema.json).
// 3. Webhooks verify with a real Standard Webhooks check when signed with the wall clock.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createFake, loadFakeContract, SCENARIOS } from '../fake/index.mjs';
import { call, receiver, started, verifyStandardWebhook } from './fake-helpers.mjs';
import { loadFixtures } from './helpers.mjs';

const model = loadFakeContract();
const SECRET = `whsec_${Buffer.from('routes-secret').toString('base64')}`;

const concrete = (path) => path.replace(/\{[^}]+\}/g, 'x');

/** A problem conforms to problem.schema.json and to the operation's declared response, if any. */
function assertProblem(res, operationId, status, type) {
  const body = typeof res.json === 'object' && res.json ? res.json : JSON.parse(res.text);
  assert.equal(res.status, status, `${operationId}: ${res.text}`);
  assert.equal(body.type, type, `${operationId}: ${res.text}`);
  assert.equal(model.validateSchema('problem.schema.json', body), null);
  if (model.declaresResponse(operationId, status))
    assert.equal(
      model.validateResponse(operationId, status, body),
      null,
      `${operationId} ${status} vs the declared response`,
    );
  return body;
}

const form = (fields, file) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.append(k, v);
  if (file) data.append(file.name, new Blob([file.content]), file.filename);
  return data;
};

// ---------------------------------------------------------------- fixtures and error bodies

test('every operation fixture names an operation and validates against its response', () => {
  const fixtures = loadFixtures().filter((f) => f.file.startsWith('openai/'));
  assert.ok(fixtures.length >= 9);
  for (const f of fixtures) {
    assert.equal(f.file, `openai/${f.operation}-${f.status}.json`);
    assert.ok(model.operation(f.operation), `${f.file}: unknown operation`);
    assert.equal(model.validateResponse(f.operation, f.status, f.instance), null, f.file);
  }
});

test('every scenario on every operation answers a problem its operation declares', () => {
  const fake = createFake();
  let declared = 0;
  return Promise.all(
    model.operations.flatMap((op) =>
      Object.entries(SCENARIOS).map(async ([name, scenario]) => {
        const out = await fake.handle({
          method: op.method,
          url: `/ai/v1${concrete(op.path)}`,
          headers: { 'x-fake-scenario': name },
        });
        const status = { rate_limited: 429, unavailable: 503, not_implemented: 501, expired: 404 }[
          name
        ];
        assertProblem(
          { status: out.status, text: out.text },
          op.operationId,
          status,
          scenario.type,
        );
        if (model.declaresResponse(op.operationId, status)) declared += 1;
      }),
    ),
  ).then(() => assert.ok(declared > 150, `only ${declared} declared responses were compared`));
});

test('the problems the routes answer on their own validate against the declared response', async () => {
  const { fake } = await started();
  const cases = [
    ['GET', '/files/x', 'retrieveFile', 404, 'not_found'],
    ['DELETE', '/files/x', 'deleteFile', 404, 'not_found'],
    ['GET', '/files/x/content', 'downloadFile', 404, 'not_found'],
    ['GET', '/files?limit=0', 'listFiles', 400, 'invalid_request'],
    ['POST', '/files', 'createFile', 415, 'unsupported_media_type', { json: {} }],
    ['POST', '/chat/completions', 'createChatCompletion', 400, 'invalid_request', { json: {} }],
    ['POST', '/uploads', 'createUpload', 400, 'invalid_request', { json: {} }],
    ['POST', '/uploads/x/parts', 'addUploadPart', 404, 'not_found'],
    ['POST', '/uploads/x/complete', 'completeUpload', 404, 'not_found', { json: { part_ids: [] } }],
    ['POST', '/uploads/x/cancel', 'cancelUpload', 404, 'not_found'],
    ['POST', '/vector_stores', 'createVectorStore', 400, 'invalid_request', { json: { nope: 1 } }],
    ['GET', '/vector_stores?limit=0', 'listVectorStores', 400, 'invalid_request'],
    ['GET', '/vector_stores/x', 'getVectorStore', 404, 'not_found'],
    ['DELETE', '/vector_stores/x', 'deleteVectorStore', 404, 'not_found'],
    [
      'POST',
      '/vector_stores/x/files',
      'createVectorStoreFile',
      404,
      'not_found',
      { json: { file_id: 'f' } },
    ],
    ['GET', '/vector_stores/x/files', 'listVectorStoreFiles', 404, 'not_found'],
    ['GET', '/vector_stores/x/files/y', 'getVectorStoreFile', 404, 'not_found'],
    ['DELETE', '/vector_stores/x/files/y', 'deleteVectorStoreFile', 404, 'not_found'],
    ['GET', '/no/such/route', undefined, 404, 'not_found'],
  ];
  for (const [method, path, operationId, status, type, extra] of cases) {
    const out = await fake.handle({
      method,
      url: `/ai/v1${path}`,
      headers: extra?.json ? { 'content-type': 'application/json' } : {},
      body: extra?.json ?? null,
    });
    const res = { status: out.status, text: out.text };
    if (operationId) assertProblem(res, operationId, status, type);
    else assert.equal(model.validateSchema('problem.schema.json', JSON.parse(out.text)), null);
    assert.equal(res.status, status, `${method} ${path}`);
  }
});

test('error.param is on every problem, and is a string for a bad parameter', async () => {
  const { baseURL } = await started();
  const missing = await call(baseURL, 'GET', '/files/x');
  assert.equal(missing.json.error.param, null);
  const bad = await call(baseURL, 'POST', '/uploads', { body: { filename: 'a.pdf' } });
  assert.equal(bad.status, 400);
  assert.equal(typeof bad.json.error.param, 'string');
  assert.equal(model.validateSchema('problem.schema.json', bad.json), null);
});

test('a malformed percent-encoding in a path answers 400 invalid_request, not 500', async () => {
  const { baseURL, origin } = await started();
  for (const url of [`${baseURL}/files/%E0%A4%A`, `${baseURL}/vector_stores/%/files/x`]) {
    const res = await call(url, 'GET', '');
    assert.equal(res.status, 400, url);
    assert.equal(res.json.type, 'invalid_request');
  }
  const control = await call(origin, 'POST', '/__fake/files/%E0%A4%A/status', {
    body: { status: 'ready' },
  });
  assert.equal(control.status, 400);
});

test('a body over the limit answers 413 payload_too_large from the fixture, and the server lives on', async () => {
  const { baseURL, fake } = await started({ maxBodyBytes: 2048 });
  const big = 'x'.repeat(100_000);
  const json = await call(baseURL, 'POST', '/chat/completions', { body: { messages: [big] } });
  const body = assertProblem(json, 'createChatCompletion', 413, 'payload_too_large');
  assert.equal(
    body.title,
    loadFixtures().find((f) => f.file === 'errors/payload_too_large.json').instance.title,
  );
  const multipart = await call(baseURL, 'POST', '/files', {
    form: form({ purpose: 'assistants' }, { name: 'file', filename: 'big.bin', content: big }),
  });
  assert.equal(multipart.status, 413);
  assert.equal((await call(baseURL, 'GET', '/meta')).status, 200);
  assert.deepEqual(
    fake.requests.map((r) => r.status),
    [413, 413, 200],
  );
});

test('malformed JSON and multipart bodies answer 400 and are logged', async () => {
  const { baseURL, fake } = await started();
  const json = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
  assert.equal(json.status, 400);
  const multipart = await fetch(`${baseURL}/files`, {
    method: 'POST',
    headers: { 'content-type': 'multipart/form-data; boundary=x' },
    body: 'not multipart',
  });
  assert.equal(multipart.status, 400);
  assert.equal(fake.requests.length, 2);
});

test('a stub answers the status its x-stub-response declares', async () => {
  const { fake } = await started();
  const stubs = model.operations.filter((o) => o.status === 'stub');
  assert.ok(stubs.length >= 17);
  for (const op of stubs) {
    const out = await fake.handle({ method: op.method, url: `/ai/v1${concrete(op.path)}` });
    assert.equal(out.status, Number(op.op['x-stub-response']), op.operationId);
  }
});

test('the x_alore gate is the overlay feature on OpenAIFile.x_alore', async () => {
  const gate = model.doc.components.schemas.OpenAIFile.properties.x_alore['x-alore-feature'];
  const on = await started({ features: [gate] });
  const file = on.fake.seedFile({ status: 'ready' });
  assert.equal((await call(on.baseURL, 'GET', `/files/${file.id}`)).json.x_alore.status, 'ready');
  const off = await started({ features: ['conversations.fork'] });
  const other = off.fake.seedFile({});
  assert.equal('x_alore' in (await call(off.baseURL, 'GET', `/files/${other.id}`)).json, false);
});

test('the request log redacts credential-like tenancy headers and keeps ids', async () => {
  const { baseURL, fake } = await started();
  await call(baseURL, 'GET', '/meta', {
    headers: {
      'x-alore-grant': 'signed.grant.value',
      'x-alore-org': 'org-1',
      'x-alore-subject': 'user-1',
      'idempotency-key': 'k-1',
      'x-session-token': 'tok',
    },
  });
  const [entry] = fake.requests;
  assert.equal(entry.headers['x-alore-grant'], '[redacted]');
  assert.equal(entry.headers['x-session-token'], '[redacted]');
  assert.equal(entry.headers['x-alore-org'], 'org-1');
  assert.equal(entry.headers['x-alore-subject'], 'user-1');
  assert.equal(entry.headers['idempotency-key'], 'k-1');
  assert.doesNotMatch(JSON.stringify(fake.requests), /signed\.grant|tok"/);
});

// ---------------------------------------------------------------- chat completions

test('a non-streaming chat completion validates and is deterministic', async () => {
  const { baseURL, fake } = await started({ chatReply: (req) => `echo ${req.messages.length}` });
  const request = { model: 'anga-1-mirim', messages: [{ role: 'user', content: 'hi' }] };
  const a = await call(baseURL, 'POST', '/chat/completions', { body: request });
  assert.equal(a.status, 200);
  model.assertResponse('createChatCompletion', 200, a.json);
  assert.equal(a.json.id, 'chatcmpl-fake-0001');
  assert.equal(a.json.model, 'anga-1-mirim');
  assert.equal(a.json.choices[0].message.content, 'echo 1');
  const b = await call(baseURL, 'POST', '/chat/completions', { body: request });
  assert.equal(b.json.id, 'chatcmpl-fake-0002');
  assert.equal(fake.requests[0].body.model, 'anga-1-mirim');
});

test('a streaming chat completion is refused as not_implemented', async () => {
  const { baseURL } = await started();
  const res = await call(baseURL, 'POST', '/chat/completions', {
    body: { model: 'm', messages: [{ role: 'user', content: 'hi' }], stream: true },
  });
  assertProblem(res, 'createChatCompletion', 501, 'not_implemented');
});

// ---------------------------------------------------------------- files, uploads

test('POST /files takes multipart, stores the bytes and serves them back', async () => {
  const hook = await receiver();
  const { baseURL, fake } = await started({
    features: ['files.status'],
    webhookUrl: hook.url,
    webhookSecret: SECRET,
  });
  const res = await call(baseURL, 'POST', '/files', {
    form: form({ purpose: 'assistants' }, { name: 'file', filename: 'a.txt', content: 'hello' }),
  });
  assert.equal(res.status, 200);
  model.assertResponse('createFile', 200, res.json);
  assert.deepEqual(
    { name: res.json.filename, bytes: res.json.bytes, purpose: res.json.purpose },
    { name: 'a.txt', bytes: 5, purpose: 'assistants' },
  );
  assert.equal(res.json.x_alore.status, 'ready');
  const content = await call(baseURL, 'GET', `/files/${res.json.id}/content`);
  assert.equal(content.text, 'hello');
  assert.equal(content.headers.get('content-type'), 'application/octet-stream');
  assert.deepEqual(fake.requests[0].body.multipart.files, [
    { name: 'file', filename: 'a.txt', bytes: 5 },
  ]);
  await fake.flush();
  assert.equal(JSON.parse(hook.got[0].body).type, 'file.ready');
});

test('POST /files refuses a body without a file or with an unknown purpose', async () => {
  const { baseURL } = await started();
  const none = await call(baseURL, 'POST', '/files', { form: form({ purpose: 'assistants' }) });
  assertProblem(none, 'createFile', 400, 'invalid_request');
  const bad = await call(baseURL, 'POST', '/files', {
    form: form({ purpose: 'nope' }, { name: 'file', filename: 'a', content: 'x' }),
  });
  assertProblem(bad, 'createFile', 400, 'invalid_request');
});

async function upload(baseURL, content = ['abc', 'defg']) {
  const bytes = content.join('').length;
  const created = await call(baseURL, 'POST', '/uploads', {
    body: { filename: 'big.pdf', purpose: 'assistants', bytes, mime_type: 'application/pdf' },
  });
  const ids = [];
  for (const chunk of content) {
    const part = await call(baseURL, 'POST', `/uploads/${created.json.id}/parts`, {
      form: form({}, { name: 'data', filename: 'part', content: chunk }),
    });
    ids.push(part.json.id);
  }
  return { created, ids };
}

test('multipart uploads: create, parts, complete yield a file; every body validates', async () => {
  const { baseURL } = await started();
  const { created, ids } = await upload(baseURL);
  model.assertResponse('createUpload', 200, created.json);
  assert.equal(created.json.status, 'pending');
  assert.equal(created.json.file, null);
  assert.deepEqual(ids, ['part-fake-0001', 'part-fake-0002']);
  const md5 = createHash('md5').update('abcdefg').digest('hex');
  const done = await call(baseURL, 'POST', `/uploads/${created.json.id}/complete`, {
    body: { part_ids: ids, md5 },
  });
  assert.equal(done.status, 200);
  model.assertResponse('completeUpload', 200, done.json);
  assert.equal(done.json.status, 'completed');
  assert.equal(done.json.file.bytes, 7);
  const content = await call(baseURL, 'GET', `/files/${done.json.file.id}/content`);
  assert.equal(content.text, 'abcdefg');
  const again = await call(baseURL, 'POST', `/uploads/${created.json.id}/complete`, {
    body: { part_ids: ids },
  });
  assertProblem(again, 'completeUpload', 400, 'invalid_request');
});

test('multipart uploads: wrong size, wrong md5, foreign part, cancel and expiry are problems', async () => {
  const { baseURL, fake } = await started();
  const { created, ids } = await upload(baseURL);
  const path = `/uploads/${created.json.id}`;
  const short = await call(baseURL, 'POST', `${path}/complete`, { body: { part_ids: [ids[0]] } });
  assertProblem(short, 'completeUpload', 400, 'invalid_request');
  const md5 = await call(baseURL, 'POST', `${path}/complete`, {
    body: { part_ids: ids, md5: '0'.repeat(32) },
  });
  assertProblem(md5, 'completeUpload', 400, 'invalid_request');
  const foreign = await call(baseURL, 'POST', `${path}/complete`, {
    body: { part_ids: ['part-x'] },
  });
  assertProblem(foreign, 'completeUpload', 400, 'invalid_request');

  const cancelled = await call(baseURL, 'POST', `${path}/cancel`);
  model.assertResponse('cancelUpload', 200, cancelled.json);
  assert.equal(cancelled.json.status, 'cancelled');
  assertProblem(
    await call(baseURL, 'POST', `${path}/cancel`),
    'cancelUpload',
    400,
    'invalid_request',
  );

  const second = await upload(baseURL);
  fake.advance(2 * 3600 * 1000);
  const late = await call(baseURL, 'POST', `/uploads/${second.created.json.id}/complete`, {
    body: { part_ids: second.ids },
  });
  const problem = assertProblem(late, 'completeUpload', 404, 'not_found');
  assert.equal(problem.error.code, 'expired');
});

// ---------------------------------------------------------------- vector stores

test('vector stores: create, attach, list, get, update attributes, detach, delete', async () => {
  const { baseURL, fake } = await started();
  const a = fake.seedFile({ filename: 'a.pdf', bytes: 100 });
  const b = fake.seedFile({ filename: 'b.pdf', bytes: 50 });

  const created = await call(baseURL, 'POST', '/vector_stores', {
    body: { name: 'case', file_ids: [a.id], metadata: { org: 'o1' } },
  });
  assert.equal(created.status, 200);
  model.assertResponse('createVectorStore', 200, created.json);
  const id = created.json.id;
  assert.equal(id, 'vs-fake-0001');
  assert.deepEqual(created.json.file_counts, {
    in_progress: 0,
    completed: 1,
    failed: 0,
    cancelled: 0,
    total: 1,
  });
  assert.equal(created.json.usage_bytes, 100);
  assert.deepEqual(created.json.metadata, { org: 'o1' });

  const attached = await call(baseURL, 'POST', `/vector_stores/${id}/files`, {
    body: { file_id: b.id, attributes: { page: 1 } },
  });
  assert.equal(attached.status, 200);
  model.assertResponse('createVectorStoreFile', 200, attached.json);
  assert.equal(attached.json.vector_store_id, id);
  assert.equal(attached.json.usage_bytes, 50);
  assertProblem(
    await call(baseURL, 'POST', `/vector_stores/${id}/files`, { body: { file_id: b.id } }),
    'createVectorStoreFile',
    409,
    'conflict',
  );
  assertProblem(
    await call(baseURL, 'POST', `/vector_stores/${id}/files`, { body: { file_id: 'nope' } }),
    'createVectorStoreFile',
    404,
    'not_found',
  );

  const list = await call(baseURL, 'GET', `/vector_stores/${id}/files?order=asc&limit=1`);
  model.assertResponse('listVectorStoreFiles', 200, list.json);
  assert.deepEqual(
    list.json.data.map((f) => f.id),
    [a.id],
  );
  assert.equal(list.json.has_more, true);
  const next = await call(baseURL, 'GET', `/vector_stores/${id}/files?order=asc&after=${a.id}`);
  assert.deepEqual(
    next.json.data.map((f) => f.id),
    [b.id],
  );

  const updated = await call(baseURL, 'POST', `/vector_stores/${id}/files/${b.id}`, {
    body: { attributes: { page: 2 } },
  });
  model.assertResponse('updateVectorStoreFileAttributes', 200, updated.json);
  assert.deepEqual(
    (await call(baseURL, 'GET', `/vector_stores/${id}/files/${b.id}`)).json.attributes,
    {
      page: 2,
    },
  );

  const renamed = await call(baseURL, 'POST', `/vector_stores/${id}`, {
    body: { name: 'renamed' },
  });
  model.assertResponse('modifyVectorStore', 200, renamed.json);
  assert.equal(renamed.json.name, 'renamed');
  const stores = await call(baseURL, 'GET', '/vector_stores');
  model.assertResponse('listVectorStores', 200, stores.json);
  assert.equal(stores.json.data.length, 1);

  const detached = await call(baseURL, 'DELETE', `/vector_stores/${id}/files/${a.id}`);
  model.assertResponse('deleteVectorStoreFile', 200, detached.json);
  assert.equal((await call(baseURL, 'GET', `/files/${a.id}`)).status, 200, 'the file itself stays');
  assert.equal((await call(baseURL, 'GET', `/vector_stores/${id}`)).json.file_counts.total, 1);

  await call(baseURL, 'DELETE', `/files/${b.id}`);
  assert.equal((await call(baseURL, 'GET', `/vector_stores/${id}`)).json.file_counts.total, 0);

  const deleted = await call(baseURL, 'DELETE', `/vector_stores/${id}`);
  model.assertResponse('deleteVectorStore', 200, deleted.json);
  assert.equal(deleted.json.deleted, true);
  assert.equal((await call(baseURL, 'GET', `/vector_stores/${id}`)).status, 404);
});

test('a vector store naming an unknown file, or breaking its closed request, is refused', async () => {
  const { baseURL } = await started();
  assertProblem(
    await call(baseURL, 'POST', '/vector_stores', { body: { file_ids: ['nope'] } }),
    'createVectorStore',
    404,
    'not_found',
  );
  assertProblem(
    await call(baseURL, 'POST', '/vector_stores', { body: { unknown_member: 1 } }),
    'createVectorStore',
    400,
    'invalid_request',
  );
});

// ---------------------------------------------------------------- files and the status API

test('setFileStatus deleted removes the file, as DELETE does', async () => {
  const hook = await receiver();
  const { baseURL, fake } = await started({ webhookUrl: hook.url, webhookSecret: SECRET });
  const file = fake.seedFile({});
  const snapshot = await fake.setFileStatus(file.id, 'deleted');
  assert.equal(snapshot.id, file.id);
  assert.equal((await call(baseURL, 'GET', `/files/${file.id}`)).status, 404);
  assert.equal(JSON.parse(hook.got[0].body).type, 'file.deleted');
});

// ---------------------------------------------------------------- webhooks

test('a handler answers before the receiver does; flush waits for the delivery', async () => {
  const hook = await receiver(200, 400);
  const { baseURL, fake } = await started({ webhookUrl: hook.url, webhookSecret: SECRET });
  const file = fake.seedFile({});
  const begun = Date.now();
  assert.equal((await call(baseURL, 'DELETE', `/files/${file.id}`)).status, 200);
  assert.ok(Date.now() - begun < 300, 'the response did not wait for the receiver');
  assert.equal(fake.deliveries.length, 0);
  await fake.flush();
  assert.equal(fake.deliveries.length, 1);
  assert.equal(fake.deliveries[0].status, 200);
});

test('deliveries keep event order', async () => {
  const hook = await receiver();
  const { fake } = await started({ webhookUrl: hook.url, webhookSecret: SECRET });
  const file = fake.seedFile({ status: 'received' });
  for (const status of ['text_ready', 'ready']) void fake.setFileStatus(file.id, status);
  await fake.flush();
  assert.deepEqual(
    hook.got.map((g) => JSON.parse(g.body).seq),
    [1, 2],
  );
});

test('the default webhook clock is fixed: byte-identical, and outside a verifier tolerance', async () => {
  const hook = await receiver();
  const { fake } = await started({ webhookUrl: hook.url, webhookSecret: SECRET });
  await fake.emit('org.erased', { subject: { kind: 'org', id: 'o' } });
  const [{ headers, body }] = hook.got;
  assert.equal(headers['webhook-timestamp'], String(Date.parse('2026-01-01T12:00:00Z') / 1000));
  assert.equal(
    verifyStandardWebhook({
      headers,
      body,
      secret: SECRET,
      nowSeconds: Math.floor(Date.now() / 1000),
    }),
    'timestamp outside tolerance',
  );
  assert.equal(
    verifyStandardWebhook({
      headers,
      body,
      secret: SECRET,
      nowSeconds: Date.parse('2026-01-01T12:00:00Z') / 1000,
    }),
    null,
  );
});

test('with the wall webhook clock a delivery passes a Standard Webhooks check with the default tolerance', async () => {
  const hook = await receiver();
  const { fake } = await started({
    webhookUrl: hook.url,
    webhookSecret: SECRET,
    webhookClock: 'wall',
  });
  const file = fake.seedFile({});
  await fake.setFileStatus(file.id, 'ready');
  await fake.redeliver(fake.events[0].id);
  assert.equal(hook.got.length, 2);
  for (const { headers, body } of hook.got)
    assert.equal(
      verifyStandardWebhook({
        headers,
        body,
        secret: SECRET,
        nowSeconds: Math.floor(Date.now() / 1000),
      }),
      null,
    );
  // The envelope time stays on the fake clock; only the header timestamp follows the wall clock.
  assert.equal(JSON.parse(hook.got[0].body).time, '2026-01-01T12:00:00.000Z');
});

test('webhookClock also takes a function, and refuses anything else', async () => {
  const hook = await receiver();
  const { fake } = await started({
    webhookUrl: hook.url,
    webhookSecret: SECRET,
    webhookClock: () => 1_900_000_000,
  });
  await fake.emit('org.erased', { subject: { kind: 'org', id: 'o' } });
  assert.equal(hook.got[0].headers['webhook-timestamp'], '1900000000');
  assert.throws(() => createFake({ webhookClock: 'tomorrow' }), /invalid webhookClock/);
});

test('the CLI with --webhook-wall-clock delivers webhooks a real verifier accepts', async () => {
  const hook = await receiver();
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(new URL('../fake/cli.mjs', import.meta.url)),
      '--webhook-url',
      hook.url,
      '--webhook-secret-env',
      'FAKE_ROUTES_SECRET',
      '--webhook-wall-clock',
    ],
    { stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, FAKE_ROUTES_SECRET: SECRET } },
  );
  try {
    const line = await new Promise((ok, fail) => {
      child.stdout.once('data', (d) => ok(String(d)));
      child.once('error', fail);
    });
    const origin = /^listening (\S+)\/ai\/v1/.exec(line)[1];
    const seeded = await call(origin, 'POST', '/__fake/files', { body: {} });
    await call(origin, 'POST', `/__fake/files/${seeded.json.id}/status`, {
      body: { status: 'ready' },
    });
    assert.equal((await call(origin, 'POST', '/__fake/flush')).status, 204);
    assert.equal(hook.got.length, 1);
    const [{ headers, body }] = hook.got;
    assert.equal(
      verifyStandardWebhook({
        headers,
        body,
        secret: SECRET,
        nowSeconds: Math.floor(Date.now() / 1000),
      }),
      null,
    );
  } finally {
    child.kill('SIGTERM');
  }
});

test('the CLI --now sets the fake clock', async () => {
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL('../fake/cli.mjs', import.meta.url)), '--now', '2030-05-05T00:00:00Z'],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  );
  try {
    const line = await new Promise((ok) => child.stdout.once('data', (d) => ok(String(d))));
    const origin = /^listening (\S+)\/ai\/v1/.exec(line)[1];
    const seeded = await call(origin, 'POST', '/__fake/files', { body: {} });
    assert.equal(seeded.json.created_at, Date.parse('2030-05-05T00:00:00Z') / 1000);
  } finally {
    child.kill('SIGTERM');
  }
});

// ---------------------------------------------------------------- determinism on the new routes

async function transcript() {
  const { fake, baseURL } = await started({ features: ['files.status'] });
  const out = [];
  const record = async (method, path, init) => {
    const res = await call(baseURL, method, path, init);
    out.push({ method, path, status: res.status, text: res.text });
    return res;
  };
  await record('POST', '/chat/completions', {
    body: { model: 'anga-1-mirim', messages: [{ role: 'user', content: 'oi' }] },
  });
  const file = await record('POST', '/files', {
    form: form({ purpose: 'assistants' }, { name: 'file', filename: 'a.txt', content: 'hello' }),
  });
  const { created, ids } = await upload(baseURL);
  await record('POST', `/uploads/${created.json.id}/complete`, { body: { part_ids: ids } });
  const store = await record('POST', '/vector_stores', {
    body: { name: 's', file_ids: [file.json.id] },
  });
  await record('GET', `/vector_stores/${store.json.id}/files`);
  await record('DELETE', `/vector_stores/${store.json.id}`);
  return JSON.stringify({ out, requests: fake.requests });
}

test('two runs over chat, files, uploads and vector stores give byte-identical output', async () => {
  const a = await transcript();
  const b = await transcript();
  assert.equal(a, b);
  assert.ok(a.length > 2000);
});
