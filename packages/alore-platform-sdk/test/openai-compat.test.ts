import { loadFakeContract } from '@alore/platform-contract/fake';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import OpenAI, {
  APIError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
  toFile,
} from 'openai';

import { ALORE_PROBLEM_TYPES, type AloreProblem } from '../src/index.js';
import { startFake, startStubServer } from './helpers.js';

const contract = loadFakeContract();

// ---------------------------------------------------------------- A-23 parse test

test('A-23: official OpenAI SDK parses every RFC 9457 problem+json fixture with its OpenAI error object', async () => {
  const stub = await startStubServer((req) => {
    const type = req.path.replace('/ai/v1/problem/', '');
    const fixture = contract.fixtures[`errors/${type}.json`] as
      | { instance: AloreProblem }
      | undefined;
    if (!fixture) return { status: 404 };
    return {
      status: fixture.instance.status,
      headers: { 'content-type': 'application/problem+json' },
      body: fixture.instance,
    };
  });

  const stock = new OpenAI({
    baseURL: stub.baseURL,
    apiKey: 'stock-key',
    maxRetries: 0,
  });

  const expectedByStatus = (status: number) => {
    if (status === 400) return BadRequestError;
    if (status === 404) return NotFoundError;
    if (status === 409) return ConflictError;
    if (status === 429) return RateLimitError;
    if (status >= 500) return InternalServerError;
    return APIError;
  };

  for (const type of ALORE_PROBLEM_TYPES) {
    const fixture = contract.fixtures[`errors/${type}.json`] as { instance: AloreProblem };
    await assert.rejects(
      () => stock.get(`/problem/${type}`),
      (err: unknown) => {
        const expectedClass = expectedByStatus(fixture.instance.status);
        assert.ok(err instanceof expectedClass, `${type}: expected ${expectedClass.name}`);
        assert.equal(err.status, fixture.instance.status);
        assert.equal(err.type, fixture.instance.error.type);
        assert.equal(err.code, fixture.instance.error.code);
        assert.ok(
          err.message.includes(fixture.instance.error.message),
          `${type}: expected message to include "${fixture.instance.error.message}", got "${err.message}"`,
        );
        return true;
      },
    );
  }
});

test('A-23: official OpenAI SDK parses problem+json errors returned directly by fake Alore', async () => {
  const { baseURL, fake } = await startFake();
  const stock = new OpenAI({ baseURL, apiKey: 'stock-key', maxRetries: 0 });

  // 404 not_found
  await assert.rejects(
    () => stock.files.retrieve('missing-file'),
    (err: unknown) =>
      err instanceof NotFoundError &&
      err.status === 404 &&
      err.type === 'not_found' &&
      err.code === 'not_found' &&
      err.param === null,
  );

  // 400 invalid_request with param
  await assert.rejects(
    () => stock.uploads.create({ filename: 'a.pdf' } as never),
    (err: unknown) =>
      err instanceof BadRequestError &&
      err.status === 400 &&
      err.type === 'invalid_request' &&
      typeof err.param === 'string',
  );

  // 409 conflict on duplicate vector store file attach
  const seeded = fake.seedFile({ filename: 'dup.pdf' });
  const store = await stock.vectorStores.create({ name: 'dup-test', file_ids: [seeded.id] });
  await assert.rejects(
    () => stock.vectorStores.files.create(store.id, { file_id: seeded.id }),
    (err: unknown) => err instanceof ConflictError && err.status === 409 && err.type === 'conflict',
  );

  // 429 rate_limited via X-Fake-Scenario
  await assert.rejects(
    () => stock.files.list(undefined, { headers: { 'x-fake-scenario': 'rate_limited' } }),
    (err: unknown) =>
      err instanceof RateLimitError && err.status === 429 && err.type === 'rate_limited',
  );

  // 501 not_implemented via stub / scenario
  await assert.rejects(
    () => stock.embeddings.create({ model: 'text-embedding-3-small', input: 'hi' }),
    (err: unknown) =>
      err instanceof InternalServerError && err.status === 501 && err.type === 'not_implemented',
  );
});

// ---------------------------------------------------------------- plain OpenAI SDK parity on fake

test('plain new OpenAI({ baseURL }) passes the same fixtures on fake Alore without extension headers', async () => {
  const { fake, baseURL } = await startFake({
    features: ['files.status'],
    chatReply: () => 'stock-ok',
  });
  const stock = new OpenAI({ baseURL, apiKey: 'stock-key' });

  // Chat completion
  const completion = await stock.chat.completions.create({
    model: 'anga-1-saci',
    messages: [{ role: 'user', content: 'ping' }],
  });
  assert.equal(completion.choices[0]?.message.content, 'stock-ok');

  // Multipart file upload, retrieve, list, content, delete
  const content = Buffer.from('plain-openai-file-bytes');
  const file = await stock.files.create({
    file: await toFile(content, 'draft.txt', { type: 'text/plain' }),
    purpose: 'assistants',
  });
  assert.equal(typeof file.id, 'string');
  assert.equal((await stock.files.retrieve(file.id)).id, file.id);
  const listed = await stock.files.list();
  assert.ok(listed.data.some((f) => f.id === file.id));
  const downloaded = Buffer.from(await (await stock.files.content(file.id)).arrayBuffer());
  assert.equal(downloaded.toString('utf8'), 'plain-openai-file-bytes');

  // Multipart Uploads API (create -> parts -> complete)
  const uploadBytes = Buffer.from('part-one-and-part-two');
  const upload = await stock.uploads.create({
    filename: 'large.txt',
    purpose: 'assistants',
    bytes: uploadBytes.length,
    mime_type: 'text/plain',
  });
  const part1 = await stock.uploads.parts.create(upload.id, {
    data: await toFile(uploadBytes.subarray(0, 9), 'part1'),
  });
  const part2 = await stock.uploads.parts.create(upload.id, {
    data: await toFile(uploadBytes.subarray(9), 'part2'),
  });
  const completed = await stock.uploads.complete(upload.id, {
    part_ids: [part1.id, part2.id],
    md5: createHash('md5').update(uploadBytes).digest('hex'),
  });
  assert.equal(completed.status, 'completed');
  assert.ok(completed.file?.id);

  // Vector store create, attach, list, retrieve, detach (file retained), delete
  const vs = await stock.vectorStores.create({ name: 'stock-vs' });
  await stock.vectorStores.files.create(vs.id, { file_id: file.id });
  assert.ok((await stock.vectorStores.files.list(vs.id)).data.some((f) => f.id === file.id));
  assert.equal((await stock.vectorStores.files.retrieve(vs.id, file.id)).id, file.id);
  await stock.vectorStores.files.del(vs.id, file.id);
  assert.equal((await stock.files.retrieve(file.id)).id, file.id);
  assert.equal((await stock.vectorStores.del(vs.id)).deleted, true);
  assert.equal((await stock.files.del(file.id)).deleted, true);

  // Confirm plain OpenAI client sent no Alore tenancy headers
  for (const req of fake.requests) {
    assert.equal(req.headers['x-alore-org'], undefined);
    assert.equal(req.headers['x-user-id'], undefined);
    assert.equal(req.headers['x-alore-data-class'], undefined);
  }
});
