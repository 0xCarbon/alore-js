// 3. `generate` is deterministic and the committed files equal the generated ones.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { buildContract, render, upstreamRoutes } from '../scripts/lib/contract.mjs';
import { cutUpstream } from '../scripts/lib/cut.mjs';
import { contract, FILES } from './helpers.mjs';

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

test('the contract version is the package version', () => {
  const c = contract();
  assert.equal(c.merged.info.version, c.version);
  assert.equal(c.version, '0.1.0-alpha.0');
});
