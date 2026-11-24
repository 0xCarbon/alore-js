// 4. All 91 served routes appear in openapi.yaml with an x-status, and the counts match.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CLASS_STATUS, PROBLEM_RESPONSE_REF } from '../scripts/lib/checks.mjs';
import { canonPath } from '../scripts/lib/cut.mjs';
import { isStandardError, resolveResponse } from '../scripts/lib/problem-responses.mjs';
import { contract, operations } from './helpers.mjs';

const { routes, merged, pinned, overlay, upstream } = contract();
const byKey = new Map();
const pinnedByKey = new Map();
for (const { path, method, op } of operations(pinned))
  pinnedByKey.set(`${method.toUpperCase()} ${canonPath(path)}`, op);
for (const { path, method, op } of operations(merged))
  byKey.set(`${method.toUpperCase()} ${canonPath(path)}`, op);
const find = (route) =>
  byKey.get(`${route.method} ${canonPath(route.path.replace(/^\/ai\/v1/, ''))}`);
const count = (list, pick) =>
  list.reduce((acc, r) => ({ ...acc, [pick(r)]: (acc[pick(r)] ?? 0) + 1 }), {});

test('routes/served.yaml lists 91 routes with the expected class counts', () => {
  assert.equal(routes.served.length, 91);
  assert.deepEqual(
    count(routes.served, (r) => r.class),
    {
      openai: 37,
      'x-alore-live': 9,
      'legacy-replaced': 3,
      'legacy-kept': 25,
      stub: 17,
    },
  );
  const keys = routes.served.map((r) => `${r.method} ${canonPath(r.path)}`);
  assert.equal(new Set(keys).size, 91, 'no duplicate route');
});

test('the route table carries nothing but contract fields', () => {
  const allowed = new Set(['method', 'path', 'class', 'family', 'upstream_openai', 'stub_returns']);
  for (const r of [...routes.served, ...routes.planned]) {
    for (const key of Object.keys(r)) assert.ok(allowed.has(key), `unexpected field ${key}`);
    assert.ok(r.path.startsWith('/ai/v1/'));
  }
  for (const r of routes.served.filter((x) => x.class === 'stub'))
    assert.ok([200, 501].includes(r.stub_returns));
});

test('every served route is in openapi.yaml with the x-status its class implies', () => {
  for (const r of routes.served) {
    const op = find(r);
    assert.ok(op, `${r.method} ${r.path} missing from openapi.yaml`);
    assert.equal(op['x-status'], CLASS_STATUS[r.class], `${r.method} ${r.path}`);
  }
});

test('x-status counts match the class counts', () => {
  const served = routes.served.map(find);
  assert.deepEqual(
    count(served, (op) => op['x-status']),
    { live: 71, stub: 17, 'legacy-replaced': 3 },
  );
  assert.equal(
    routes.served.filter((r) => r.class === 'legacy-kept' && find(r)['x-status'] === 'live').length,
    25,
  );
});

test('every operation in openapi.yaml has an x-status', () => {
  for (const { path, method, op } of operations(merged)) {
    assert.ok(
      ['live', 'stub', 'planned', 'legacy-replaced'].includes(op['x-status']),
      `${method} ${path}`,
    );
  }
});

test('every stub answers 501 in the contract, whatever upstream says', () => {
  for (const r of routes.served.filter((x) => x.class === 'stub')) {
    const op = find(r);
    const where = `${r.method} ${r.path}`;
    assert.equal(op['x-stub-response'], 501, where);
    assert.deepEqual(op.responses?.['501'], { $ref: PROBLEM_RESPONSE_REF }, where);
    const key = `${r.method} ${canonPath(r.path.replace(/^\/ai\/v1/, ''))}`;
    const upstreamResponses = pinnedByKey.get(key)?.responses;
    for (const [code, response] of Object.entries(upstreamResponses ?? {})) {
      const upstreamResponse = resolveResponse(pinned, response);
      const expected = isStandardError(code)
        ? {
            ...upstreamResponse,
            content: {
              ...upstreamResponse.content,
              'application/problem+json': { schema: { $ref: '#/components/schemas/AloreProblem' } },
            },
          }
        : response;
      assert.deepEqual(op.responses[code], expected, `${where} response ${code}`);
    }
  }
});

test('the fine-tuning stubs are the upstream operations under a router spelling', () => {
  const spelled = routes.served.filter((r) => /\/fine-tuning\/jobs/.test(r.path));
  assert.equal(spelled.length, 5);
  for (const r of spelled) {
    const op = find(r);
    assert.match(op['x-upstream-equivalent'], /^\/fine_tuning\/jobs/, `${r.method} ${r.path}`);
    assert.ok(!(op.tags ?? []).includes('x-alore'), 'not an Alore extension');
    assert.ok(upstream.paths[op['x-upstream-equivalent']][r.method.toLowerCase()]);
  }
});

test('the planned list has 25 routes: GET /realtime is deliberately absent', () => {
  assert.equal(routes.planned.length, 25);
  assert.ok(!routes.planned.some((r) => /realtime/.test(r.path)));
});

test('the 17 stubs include the routes named in the plan', () => {
  const stubs = routes.served.filter((r) => r.class === 'stub').map((r) => `${r.method} ${r.path}`);
  for (const want of [
    'DELETE /ai/v1/models/{model}',
    'POST /ai/v1/responses/{id}/cancel',
    'POST /ai/v1/assistants/{assistant_id}/files',
    'GET /ai/v1/assistants/{assistant_id}/files',
    'GET /ai/v1/assistants/{assistant_id}/files/{file_id}',
    'DELETE /ai/v1/assistants/{assistant_id}/files/{file_id}',
    'POST /ai/v1/fine-tuning/jobs',
    'GET /ai/v1/fine-tuning/jobs',
    'GET /ai/v1/fine-tuning/jobs/{fine_tuning_job_id}',
    'POST /ai/v1/fine-tuning/jobs/{fine_tuning_job_id}/cancel',
    'GET /ai/v1/fine-tuning/jobs/{fine_tuning_job_id}/events',
  ]) {
    assert.ok(stubs.includes(want), `${want} is not a stub`);
  }
  assert.equal(stubs.length, 17);
});

test('the Assistants and Threads emulation is live and marked deprecated', () => {
  const emulation = routes.served.filter(
    (r) => r.family === 'assistants-emulation' && r.class === 'legacy-kept',
  );
  assert.equal(emulation.length, 25);
  for (const r of emulation) {
    const op = find(r);
    assert.equal(op['x-status'], 'live', `${r.method} ${r.path}`);
    assert.ok(op['x-deprecated-since'], `${r.method} ${r.path} has no x-deprecated-since`);
  }
});

test('live extension routes the router serves today are seeded', () => {
  for (const want of [
    'POST /files/presign',
    'POST /files/from_url',
    'POST /files/{}/confirm',
    'POST /files/multipart/create',
    'POST /files/multipart/sign-part',
    'POST /files/multipart/complete',
    'POST /files/multipart/abort',
    'PATCH /vector_stores/{}/files/{}/attributes',
  ]) {
    const op = byKey.get(want);
    assert.ok(op, `${want} missing`);
    assert.equal(op['x-status'], 'live');
    assert.ok(op.tags.includes('x-alore'));
  }
  const replaced = byKey.get('POST /vector_stores/{}/documents/{}/attributes');
  assert.equal(replaced['x-status'], 'legacy-replaced');
});

test('there is no files/import route and no presign flag', () => {
  assert.ok(![...byKey.keys()].some((k) => /\/files\/import/.test(k)));
  assert.ok(!JSON.stringify(overlay).includes('presign":true'));
  assert.ok(!JSON.stringify(merged).includes('"presign":true'));
});

test('planned routes are present with x-status planned', () => {
  for (const r of routes.planned)
    assert.equal(find(r)['x-status'], 'planned', `${r.method} ${r.path}`);
});

test('an upstream-defined operation is never redefined as an x-alore path', () => {
  for (const { path, method, op } of operations(merged)) {
    if (pinned.paths[path]?.[method])
      assert.ok(!(op.tags ?? []).includes('x-alore'), `${method} ${path}`);
  }
});
