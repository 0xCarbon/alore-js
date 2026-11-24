// The fake Alore server (PR-C4):
// 1. Every body it sends validates against the pinned contract; a wrong fixture fails.
// 2. Its routes, scenarios and behaviours are read from the contract, never copied.
// 3. Webhooks carry a valid envelope and a Standard Webhooks signature.
// 4. Two runs with the same inputs give byte-identical output.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ContractViolationError, createFake, loadFakeContract, SCENARIOS } from '../fake/index.mjs';
import { call, receiver, started } from './fake-helpers.mjs';
import { contract, loadFixtures, loadSchemas, operations } from './helpers.mjs';

const model = loadFakeContract();
const fixtures = loadFixtures();

// ---------------------------------------------------------------- the validator

test('the validator accepts every accepted contract fixture and rejects every rejected one', () => {
  for (const f of fixtures.filter((x) => x.schema)) {
    const errors = model.validateSchema(f.schema, f.instance);
    assert.equal(errors === null, f.valid, `${f.file}: ${JSON.stringify(errors)}`);
  }
});

test('a deliberately wrong fixture fails validation', () => {
  const wrong = {
    type: 'rate_limited',
    title: 'Rate limited',
    status: 429,
    error: { type: 'rate_limited', message: 'x', code: 'rate_limited' },
    trace: 'closed outputs reject an unknown member',
  };
  assert.throws(() => model.assertSchema('problem.schema.json', wrong), ContractViolationError);
  assert.throws(
    () => model.assertSchema('meta.schema.json', { contract: 'one', features: [] }),
    ContractViolationError,
  );
  assert.throws(
    () => model.assertResponse('retrieveFile', 200, { id: 'file-1', object: 'file' }),
    ContractViolationError,
    'OpenAIFile requires bytes, created_at, filename and purpose',
  );
  assert.throws(() => model.assertSchema('nope.schema.json', {}), /unknown schema/);
});

test('a fake built on a wrong fixture refuses to start', () => {
  assert.throws(
    () => createFake({ fixtures: { meta: { contract: '0.1.0', features: 'files.status' } } }),
    ContractViolationError,
  );
  assert.throws(
    () => createFake({ fixtures: { problems: { rate_limited: { type: 'rate_limited' } } } }),
    ContractViolationError,
  );
});

// ---------------------------------------------------------------- no drift from the contract

test('the route table is the contract: every operation of openapi.yaml, nothing else', () => {
  const expected = [...operations(contract().merged)]
    .map(({ method, path, op }) => `${method.toUpperCase()} ${path} ${op.operationId}`)
    .sort();
  const actual = model.operations.map((o) => `${o.method} ${o.path} ${o.operationId}`).sort();
  assert.deepEqual(actual, expected);
  assert.equal(model.version, contract().version);
});

test('every behaviour, scenario and problem type names something the contract defines', () => {
  const ids = new Set(model.operations.map((o) => o.operationId));
  for (const id of createFake().behaviours) assert.ok(ids.has(id), `unknown operation ${id}`);
  const types = loadSchemas()['problem.schema.json'].properties.type.enum;
  assert.deepEqual(
    Object.values(SCENARIOS)
      .map((s) => s.type)
      .filter((t) => !types.includes(t)),
    [],
  );
  assert.deepEqual(Object.keys(SCENARIOS).sort(), [
    'expired',
    'not_implemented',
    'rate_limited',
    'unavailable',
  ]);
});

test('the served meta contract is the package version', async () => {
  const { baseURL } = await started();
  const res = await call(baseURL, 'GET', '/meta');
  assert.equal(res.status, 200);
  assert.equal(res.json.contract, contract().version);
  assert.equal(model.validateSchema('meta.schema.json', res.json), null);
});

// ---------------------------------------------------------------- responses conform

test('meta lists the features the fake was started with', async () => {
  const { baseURL } = await started({ features: ['files.status', 'conversations.fork'] });
  const res = await call(baseURL, 'GET', '/meta');
  assert.deepEqual(res.json.features, ['files.status', 'conversations.fork']);
  assert.equal(res.headers.get('content-type'), 'application/json');
});

test('files: seed, retrieve, list and delete validate against the pinned OpenAIFile schema', async () => {
  const { baseURL, fake } = await started({ features: ['files.status'] });
  const a = fake.seedFile({ filename: 'a.pdf', status: 'extracting' });
  const b = fake.seedFile({ filename: 'b.pdf', purpose: 'user_data', status: 'ready' });
  assert.deepEqual([a.id, b.id], ['file-fake-0001', 'file-fake-0002']);

  const one = await call(baseURL, 'GET', `/files/${a.id}`);
  assert.equal(one.status, 200);
  model.assertResponse('retrieveFile', 200, one.json);
  assert.equal(one.json.x_alore.status, 'extracting');

  const list = await call(baseURL, 'GET', '/files?purpose=user_data');
  model.assertResponse('listFiles', 200, list.json);
  assert.deepEqual(
    list.json.data.map((f) => f.id),
    [b.id],
  );
  const all = await call(baseURL, 'GET', '/files?order=asc&limit=1');
  assert.deepEqual(
    all.json.data.map((f) => f.id),
    [a.id],
  );
  assert.equal(all.json.has_more, true);

  const del = await call(baseURL, 'DELETE', `/files/${a.id}`);
  model.assertResponse('deleteFile', 200, del.json);
  assert.equal((await call(baseURL, 'GET', `/files/${a.id}`)).status, 404);
  assert.equal((await call(baseURL, 'GET', '/files/file-unknown')).status, 404);
});

test('x_alore is emitted only when files.status is negotiated', async () => {
  const off = await started();
  const file = off.fake.seedFile({ status: 'ready' });
  const res = await call(off.baseURL, 'GET', `/files/${file.id}`);
  assert.equal('x_alore' in res.json, false);
  model.assertResponse('retrieveFile', 200, res.json);
});

test('an empty list still conforms', async () => {
  const { baseURL } = await started();
  const res = await call(baseURL, 'GET', '/files');
  model.assertResponse('listFiles', 200, res.json);
  assert.deepEqual(res.json.data, []);
});

test('unknown routes answer 404 not_found; unserved bodies answer 501 not_implemented', async () => {
  const { baseURL } = await started();
  const missing = await call(baseURL, 'GET', '/no/such/route');
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('content-type'), 'application/problem+json');
  model.assertSchema('problem.schema.json', missing.json);
  assert.equal(missing.json.type, 'not_found');

  // a live route whose body schema a later release defines
  const presign = await call(baseURL, 'POST', '/files/presign', { body: {} });
  assert.equal(presign.status, 501);
  assert.equal(presign.json.type, 'not_implemented');
  model.assertSchema('problem.schema.json', presign.json);

  // a contract stub answers 501, whatever upstream says
  const stub = await call(baseURL, 'POST', '/embeddings', { body: {} });
  assert.equal(stub.status, 501);
  assert.match(stub.json.detail, /embeddings|createEmbedding/i);
});

test('a static path wins over a parameter path', async () => {
  const { baseURL } = await started();
  // /files/presign is a route; /files/{file_id} must not capture it
  const res = await call(baseURL, 'POST', '/files/presign', { body: {} });
  assert.equal(res.json.type, 'not_implemented');
});

// ---------------------------------------------------------------- scenarios

const SCENARIO_CASES = [
  ['rate_limited', 429, 'rate_limited'],
  ['unavailable', 503, 'unavailable'],
  ['not_implemented', 501, 'not_implemented'],
  ['expired', 404, 'not_found'],
];

test('X-Fake-Scenario answers a conforming problem, on any route, built from the error fixtures', async () => {
  const { baseURL } = await started();
  for (const [scenario, status, type] of SCENARIO_CASES) {
    for (const [method, path] of [
      ['GET', '/meta'],
      ['GET', '/files'],
      ['POST', '/files/presign'],
      ['GET', '/no/such/route'],
    ]) {
      const res = await call(baseURL, method, path, {
        headers: { 'x-fake-scenario': scenario },
        body: method === 'POST' ? {} : undefined,
      });
      assert.equal(res.status, status, `${scenario} ${path}`);
      assert.equal(res.headers.get('content-type'), 'application/problem+json');
      model.assertSchema('problem.schema.json', res.json);
      assert.equal(res.json.type, type);
      assert.equal(res.json.status, status);
      assert.equal(res.json.error.type, res.json.type);
    }
  }
  const fixture = fixtures.find((f) => f.file === 'errors/rate_limited.json').instance;
  const limited = await call(baseURL, 'GET', '/meta', {
    headers: { 'x-fake-scenario': 'rate_limited' },
  });
  assert.equal(limited.json.title, fixture.title);
  assert.equal(limited.headers.get('retry-after'), '1');
  const expired = await call(baseURL, 'GET', '/meta', {
    headers: { 'x-fake-scenario': 'expired' },
  });
  assert.equal(expired.json.error.code, 'expired');
});

test('an unknown scenario is an invalid_request problem, not a silent pass', async () => {
  const { baseURL } = await started();
  const res = await call(baseURL, 'GET', '/meta', { headers: { 'x-fake-scenario': 'on_fire' } });
  assert.equal(res.status, 400);
  assert.equal(res.json.type, 'invalid_request');
  model.assertSchema('problem.schema.json', res.json);
});

test('a scenario does not leak into the next request', async () => {
  const { baseURL } = await started();
  await call(baseURL, 'GET', '/meta', { headers: { 'x-fake-scenario': 'unavailable' } });
  assert.equal((await call(baseURL, 'GET', '/meta')).status, 200);
});

// ---------------------------------------------------------------- request log

test('the request log keeps tenancy headers and redacts credentials', async () => {
  const { baseURL, fake } = await started();
  await call(baseURL, 'GET', '/meta?x=1', {
    headers: {
      authorization: 'Bearer very-secret',
      'x-api-key': 'also-secret',
      'x-alore-org': 'org-1',
      'x-fake-scenario': 'unavailable',
    },
  });
  const [entry] = fake.requests;
  assert.equal(entry.method, 'GET');
  assert.equal(entry.path, '/ai/v1/meta');
  assert.equal(entry.scenario, 'unavailable');
  assert.equal(entry.status, 503);
  assert.equal(entry.headers['x-alore-org'], 'org-1');
  assert.equal(entry.headers.authorization, '[redacted]');
  assert.equal(entry.headers['x-api-key'], '[redacted]');
  assert.doesNotMatch(JSON.stringify(fake.requests), /secret/);
});

// ---------------------------------------------------------------- webhooks

const SECRET = `whsec_${Buffer.from('test-secret').toString('base64')}`;
function expectedSignature(headers, body) {
  const key = Buffer.from(SECRET.slice('whsec_'.length), 'base64');
  const signed = `${headers['webhook-id']}.${headers['webhook-timestamp']}.${body}`;
  return `v1,${createHmac('sha256', key).update(signed).digest('base64')}`;
}

test('a file status change emits a valid, signed webhook to the configured URL', async () => {
  const hook = await receiver();
  const { fake } = await started({
    webhookUrl: hook.url,
    webhookSecret: SECRET,
    client: 'joori-dev',
    orgRef: 'org-1',
  });
  const file = fake.seedFile({ status: 'received' });
  await fake.setFileStatus(file.id, 'text_ready');
  await fake.setFileStatus(file.id, 'indexing'); // no event: not a delivery milestone
  await fake.setFileStatus(file.id, 'ready');

  assert.equal(hook.got.length, 2);
  const types = hook.got.map((g) => JSON.parse(g.body).type);
  assert.deepEqual(types, ['file.text_ready', 'file.ready']);
  for (const { headers, body } of hook.got) {
    model.assertSchema('webhook-envelope.schema.json', JSON.parse(body));
    assert.equal(headers['webhook-signature'], expectedSignature(headers, body));
    assert.equal(headers['content-type'], 'application/json');
  }
  const [first, second] = hook.got.map((g) => JSON.parse(g.body));
  assert.equal(first.client, 'joori-dev');
  assert.equal(first.org_ref, 'org-1');
  assert.deepEqual(first.subject, { kind: 'file', id: file.id });
  assert.equal(second.seq, first.seq + 1, 'seq counts per subject');
  assert.notEqual(first.id, second.id);
  assert.equal(fake.deliveries.length, 2);
  assert.equal(fake.deliveries[0].status, 200);
});

test('a redelivery repeats the webhook id and the body (at least once)', async () => {
  const hook = await receiver();
  const { fake } = await started({ webhookUrl: hook.url, webhookSecret: SECRET });
  const file = fake.seedFile({});
  await fake.setFileStatus(file.id, 'ready');
  await fake.redeliver(fake.events[0].id);
  assert.equal(hook.got.length, 2);
  assert.equal(hook.got[0].headers['webhook-id'], hook.got[1].headers['webhook-id']);
  assert.equal(hook.got[0].body, hook.got[1].body);
  for (const { headers, body } of hook.got)
    assert.equal(headers['webhook-signature'], expectedSignature(headers, body));
});

test('an event can be emitted directly, and a wrong envelope is refused before sending', async () => {
  const hook = await receiver();
  const { fake } = await started({ webhookUrl: hook.url, webhookSecret: SECRET });
  const event = await fake.emit('job.progress', {
    subject: { kind: 'job', id: 'job-1' },
    data: { done: 1, total: 4 },
  });
  assert.equal(event.type, 'job.progress');
  await assert.rejects(
    () => fake.emit('job.exploded', { subject: { kind: 'job', id: 'job-1' } }),
    ContractViolationError,
  );
  assert.equal(hook.got.length, 1);
});

test('a failing receiver is recorded, not thrown, and the event is kept for redelivery', async () => {
  const hook = await receiver(500);
  const { fake } = await started({ webhookUrl: hook.url, webhookSecret: SECRET });
  const file = fake.seedFile({});
  await fake.setFileStatus(file.id, 'failed');
  assert.equal(fake.deliveries[0].status, 500);
  assert.equal(fake.events.length, 1);
});

test('deleting a file through the API emits file.deleted', async () => {
  const hook = await receiver();
  const { fake, baseURL } = await started({ webhookUrl: hook.url, webhookSecret: SECRET });
  const file = fake.seedFile({});
  await call(baseURL, 'DELETE', `/files/${file.id}`);
  await fake.flush(); // a handler does not wait for the receiver
  assert.equal(JSON.parse(hook.got[0].body).type, 'file.deleted');
});

test('without a webhook URL events are only recorded', async () => {
  const { fake } = await started();
  const file = fake.seedFile({});
  await fake.setFileStatus(file.id, 'ready');
  assert.equal(fake.events.length, 1);
  assert.equal(fake.deliveries.length, 0);
});

// ---------------------------------------------------------------- control surface

test('the HTTP control surface seeds files, changes status and reads the logs', async () => {
  const hook = await receiver();
  const { origin, baseURL } = await started({
    webhookUrl: hook.url,
    webhookSecret: SECRET,
    features: ['files.status'],
  });
  const seeded = await call(origin, 'POST', '/__fake/files', { body: { filename: 'c.pdf' } });
  assert.equal(seeded.status, 201);
  const id = seeded.json.id;
  const moved = await call(origin, 'POST', `/__fake/files/${id}/status`, {
    body: { status: 'ready' },
  });
  assert.equal(moved.status, 200);
  assert.equal((await call(baseURL, 'GET', `/files/${id}`)).json.x_alore.status, 'ready');
  assert.equal((await call(origin, 'GET', '/__fake/events')).json.length, 1);
  assert.ok((await call(origin, 'GET', '/__fake/requests')).json.length >= 1);
  const bad = await call(origin, 'POST', `/__fake/files/${id}/status`, {
    body: { status: 'melting' },
  });
  assert.equal(bad.status, 400);
  const reset = await call(origin, 'POST', '/__fake/reset');
  assert.equal(reset.status, 204);
  assert.equal((await call(baseURL, 'GET', '/files')).json.data.length, 0);
});

// ---------------------------------------------------------------- determinism

async function transcript() {
  const hook = await receiver();
  const { fake, baseURL } = await started({
    webhookUrl: hook.url,
    webhookSecret: SECRET,
    features: ['files.status'],
  });
  const out = [];
  const file = fake.seedFile({ filename: 'x.pdf', status: 'received' });
  const record = async (method, path, init) => {
    const res = await call(baseURL, method, path, init);
    const { date, ...headers } = Object.fromEntries(res.headers);
    out.push({ method, path, status: res.status, headers, text: res.text, hadDate: Boolean(date) });
  };
  await record('GET', '/meta');
  await record('GET', `/files/${file.id}`);
  await record('GET', '/files');
  await record('GET', '/files', { headers: { 'x-fake-scenario': 'rate_limited' } });
  await record('POST', '/files/presign', { body: {} });
  await fake.setFileStatus(file.id, 'text_ready');
  await fake.setFileStatus(file.id, 'ready');
  fake.advance(5000);
  await fake.emit('org.erased', { subject: { kind: 'org', id: 'org-1' } });
  await record('DELETE', `/files/${file.id}`);
  await fake.flush();
  const hooks = hook.got.map(({ headers, body }) => ({
    id: headers['webhook-id'],
    ts: headers['webhook-timestamp'],
    sig: headers['webhook-signature'],
    body,
  }));
  return JSON.stringify({ out, hooks, requests: fake.requests, events: fake.events });
}

test('two runs with the same inputs give byte-identical output', async () => {
  const a = await transcript();
  const b = await transcript();
  assert.equal(a, b);
  assert.ok(a.length > 1000);
});

test('no response carries a wall-clock Date header', async () => {
  const { baseURL } = await started();
  const res = await call(baseURL, 'GET', '/meta');
  assert.equal(res.headers.get('date'), null);
});

// ---------------------------------------------------------------- command line

test('the CLI serves the fake on loopback and stops on SIGTERM', async () => {
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL('../fake/cli.mjs', import.meta.url)), '--feature', 'files.status'],
    {
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  const exited = new Promise((ok) => child.once('exit', (code, signal) => ok({ code, signal })));
  try {
    const line = await new Promise((ok, fail) => {
      child.stdout.once('data', (d) => ok(String(d)));
      child.once('error', fail);
    });
    const [, baseURL] = /^listening (\S+)/.exec(line);
    assert.match(baseURL, /^http:\/\/127\.0\.0\.1:\d+\/ai\/v1$/);
    const res = await call(baseURL, 'GET', '/meta');
    assert.deepEqual(res.json.features, ['files.status']);
  } finally {
    child.kill('SIGTERM');
  }
  assert.equal((await exited).code, 0);
});
