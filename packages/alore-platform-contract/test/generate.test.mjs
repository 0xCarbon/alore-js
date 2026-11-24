// 3. `generate` is deterministic and the committed files equal the generated ones.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';

import { buildContract, render, upstreamRoutes } from '../scripts/lib/contract.mjs';
import { cutUpstream } from '../scripts/lib/cut.mjs';
import { contract, FILES, operations } from './helpers.mjs';

const text = (file) => readFileSync(file, 'utf8');

test('the pin matches the committed upstream spec', () => {
  const { pin } = contract();
  assert.equal(createHash('sha256').update(readFileSync(FILES.upstream)).digest('hex'), pin.sha256);
  assert.match(pin.commit, /^[0-9a-f]{40}$/);
  assert.equal(pin.repository, 'https://github.com/openai/openai-openapi');
  assert.ok(pin.url.includes(pin.commit), 'the URL names the pinned commit, not a branch');
  assert.ok(pin.url.endsWith(`/${pin.file}`));
});

test('generate run twice gives byte-identical output', () => {
  const c = contract();
  const again = buildContract({
    upstream: c.upstream,
    routes: c.routes,
    pin: c.pin,
    overlay: c.overlay,
    version: c.version,
  });
  assert.equal(render.pinned(again.pinned), render.pinned(c.pinned));
  assert.equal(render.openapi(again.merged), render.openapi(c.merged));
});

test('the cut is deterministic and needs no input but upstream and routes', () => {
  const c = contract();
  const a = cutUpstream(c.upstream, upstreamRoutes(c.routes), c.pin);
  const b = cutUpstream(c.upstream, upstreamRoutes(c.routes), c.pin);
  assert.equal(render.pinned(a.doc), render.pinned(b.doc));
});

test('the committed openai.pinned.yaml and openapi.yaml equal the generated ones', () => {
  const c = contract();
  assert.equal(
    text(FILES.pinned),
    render.pinned(c.pinned),
    'openai.pinned.yaml is stale: run generate',
  );
  assert.equal(
    text(FILES.openapi),
    render.openapi(c.merged),
    'openapi.yaml is stale: run generate',
  );
});

test('the contract version is the package version, in both places it is stamped', () => {
  const c = contract();
  const published = parse(text(FILES.openapi));
  assert.equal(c.merged.info.version, c.version);
  assert.equal(published.info.version, c.version);
  assert.equal(published['x-alore-contract'].version, c.version);
  assert.match(c.version, /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/);
});

test('the document names Alore, not OpenAI, as its owner', () => {
  const { info } = parse(text(FILES.openapi));
  assert.equal(info.title, 'Alore AI API');
  assert.equal(info.termsOfService, undefined);
  assert.equal(info.license, undefined);
  assert.ok(!/openai/i.test(JSON.stringify(info.contact)), JSON.stringify(info.contact));
  assert.ok(info.contact.email);
  const published = parse(text(FILES.openapi));
  assert.equal(published['x-upstream'].license, 'MIT', 'the MIT attribution stays in x-upstream');
  assert.ok(text(FILES.upstream.replace('openapi.yaml', 'LICENSE')).includes('MIT License'));
});

test('x-deprecated-since never names a version the package has not reached or published', () => {
  const c = contract();
  const marks = new Set(
    [...operations(c.merged)].map(({ op }) => op['x-deprecated-since']).filter(Boolean),
  );
  assert.deepEqual([...marks], ['0.1.0-alpha.1'], 'one published alpha, used consistently');
});

test('published standard errors add problem JSON alongside the OpenAI response variants', () => {
  const { pinned, merged } = contract();
  const problem = { schema: { $ref: '#/components/schemas/AloreProblem' } };
  const inline = pinned.paths['/files/{file_id}'].get.responses['404'];
  const referenced = pinned.components.responses.InferenceRateLimited;
  const audio = merged.paths['/audio/speech'].post.responses;

  assert.deepEqual(merged.paths['/files/{file_id}'].get.responses['404'], {
    ...inline,
    content: { ...inline.content, 'application/problem+json': problem },
  });
  assert.deepEqual(audio['429'], {
    ...referenced,
    content: { ...referenced.content, 'application/problem+json': problem },
  });
  assert.deepEqual(merged.components.responses.InferenceRateLimited, referenced);
  assert.deepEqual(audio['200'], pinned.paths['/audio/speech'].post.responses['200']);
  assert.equal(merged.paths['/files/{file_id}'].get.responses['401'], undefined);
});
