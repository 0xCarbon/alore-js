// 5. Negative controls: each one must turn lint red.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import {
  checkChangelog,
  checkClosedOutputs,
  checkIds,
  checkProblemSchema,
  checkVendorNames,
} from '../scripts/lib/checks.mjs';
import { readJson } from '../scripts/lib/io.mjs';
import { lint } from '../scripts/lint.mjs';
import { FILES, loadSchemas, negative, PKG_ROOT } from './helpers.mjs';

const rules = (violations) => new Set(violations.map((x) => x.rule));
const names = readJson(`${PKG_ROOT}/rules/vendor-names.json`);

test('positive control: the committed contract lints clean', () => {
  assert.deepEqual(lint({}), []);
});

test('an overlay that changes an OpenAI field type turns lint red', () => {
  const found = lint({ overlay: negative('overlay-changes-field-type.yaml') });
  assert.ok(
    found.some((x) => x.rule === 'overlay-only-adds' && /bytes/.test(x.where)),
    JSON.stringify(found.slice(0, 3)),
  );
});

test('an overlay that makes an optional upstream field required turns lint red', () => {
  const found = lint({ overlay: negative('overlay-requires-optional-field.yaml') });
  assert.ok(
    found.some((x) => x.rule === 'overlay-only-adds' && /required/.test(x.message)),
    JSON.stringify(found.slice(0, 3)),
  );
});

test('an overlay that adds a value to an OpenAI enum turns lint red', () => {
  const found = lint({ overlay: negative('overlay-adds-openai-enum-value.yaml') });
  assert.ok(
    found.some((x) => x.rule === 'overlay-only-adds' && /enum/.test(x.message)),
    JSON.stringify(found.slice(0, 3)),
  );
});

test('an x-alore path that upstream already defines turns lint red', () => {
  const found = lint({ overlay: negative('overlay-xalore-path-upstream-defines.yaml') });
  assert.ok(
    found.some((x) => x.rule === 'upstream-first' && /GET \/batches/.test(x.where)),
    JSON.stringify(found.slice(0, 3)),
  );
});

test('a vendor name inside a schema turns lint red', () => {
  const found = lint({ schemasDir: negative('vendor-schemas') });
  const vendor = found.filter((x) => x.rule === 'vendor-names');
  assert.ok(
    vendor.some((x) => /Gemini|gemini/i.test(x.message)),
    JSON.stringify(vendor),
  );
  assert.ok(
    vendor.some((x) => /gpt-4o/.test(x.message)),
    'a model enum may list aliases only',
  );
});

test('the vendor check accepts the model aliases', () => {
  const ok = { model: { type: 'string', enum: ['anga-1-mirim', 'anga-1-saci'] } };
  assert.deepEqual(checkVendorNames({ s: { properties: ok } }, names), []);
  const bad = checkVendorNames(
    { s: { properties: { model: { enum: ['anga-1-mirim', 'anga-2'] } } } },
    names,
  );
  assert.equal(bad.length, 1);
});

const surface = (over = {}) => ({
  schemas: { 'a.schema.json': '{"type":"object"}' },
  overlay: 'overlay: 1.0.0\n',
  asyncapi: 'asyncapi: 3.0.0\n',
  served: 'routes: []\n',
  planned: 'routes: []\n',
  pin: '{}',
  changelog: '# Changelog\n\n## 0.1.0\n\n- additive: first release\n',
  ...over,
});

test('a schema diff without a CHANGELOG entry turns the checker red', () => {
  const prev = surface();
  const next = surface({
    schemas: { 'a.schema.json': '{"type":"object","properties":{"x":{"type":"string"}}}' },
  });
  const found = checkChangelog(prev, next);
  assert.equal(found.length, 1);
  assert.equal(found[0].rule, 'changelog');
});

test('a CHANGELOG entry that is not classified does not count', () => {
  const prev = surface();
  const next = surface({
    schemas: { 'a.schema.json': '{"type":"integer"}' },
    changelog: `${prev.changelog}\n## 0.2.0\n\n- tweaked a schema\n`,
  });
  assert.equal(checkChangelog(prev, next).length, 1);
});

test('a classified CHANGELOG entry satisfies the checker, for every class', () => {
  for (const kind of ['additive', 'deprecating', 'breaking']) {
    const prev = surface();
    const next = surface({
      overlay: 'overlay: 1.0.0\nactions: []\n',
      changelog: `${prev.changelog}\n## 0.2.0\n\n- ${kind}: changed the overlay\n`,
    });
    assert.deepEqual(checkChangelog(prev, next), [], kind);
  }
});

test('an overlay or route change needs an entry as much as a schema change', () => {
  const prev = surface();
  for (const key of ['overlay', 'asyncapi', 'served', 'planned', 'pin']) {
    assert.equal(checkChangelog(prev, surface({ [key]: 'changed\n' })).length, 1, key);
  }
});

test('no surface change needs no entry, and the first release needs one', () => {
  assert.deepEqual(checkChangelog(surface(), surface()), []);
  assert.deepEqual(checkChangelog(surface(), surface({ changelog: 'reworded\n' })), []);
  assert.equal(checkChangelog(null, surface({ changelog: '# Changelog\n' })).length, 1);
  assert.deepEqual(checkChangelog(null, surface()), []);
});

test('the committed CHANGELOG carries a classified entry for the initial contract', () => {
  const tree = surface({ changelog: '' });
  assert.equal(checkChangelog(null, tree).length, 1);
});

test('ids must be plain strings', () => {
  const bad = checkIds({
    s: {
      properties: {
        id: { type: 'string', format: 'uuid' },
        file_id: { type: 'integer' },
        ok_id: { type: 'string' },
      },
    },
  });
  assert.equal(bad.length, 2);
  assert.deepEqual(checkIds(loadSchemas()), []);
});

test('Alore-owned outputs are closed', () => {
  assert.equal(
    checkClosedOutputs({ s: { type: 'object', properties: { a: { type: 'string' } } } }).length,
    1,
  );
  assert.equal(
    checkClosedOutputs({
      s: { 'x-alore-input': true, type: 'object', properties: { a: { type: 'string' } } },
    }).length,
    0,
  );
  assert.deepEqual(checkClosedOutputs(loadSchemas()), []);
});

test('the problem type list is closed', () => {
  const schemas = loadSchemas();
  assert.deepEqual(checkProblemSchema(schemas), []);
  const open = structuredClone(schemas);
  open['problem.schema.json'].properties.type.enum.push('teapot');
  assert.equal(checkProblemSchema(open).length, 1);
});

test('the lint command exits non-zero for a negative control and zero for the real contract', () => {
  const run = (...args) =>
    spawnSync(process.execPath, ['scripts/lint.mjs', '--skip-spectral', ...args], {
      cwd: PKG_ROOT,
      encoding: 'utf8',
    });
  assert.equal(run().status, 0);
  assert.equal(run('--overlay', negative('overlay-changes-field-type.yaml')).status, 1);
  assert.equal(run('--schemas-dir', negative('vendor-schemas')).status, 1);
});

test('the Spectral rules reject an operation without x-status', () => {
  const copy = FILES.openapi.replace('openapi.yaml', '.negative-no-status.yaml');
  const run = spawnSync(
    process.execPath,
    [
      '-e',
      `const fs=require('fs');const t=fs.readFileSync(${JSON.stringify(FILES.openapi)},'utf8');` +
        `fs.writeFileSync(${JSON.stringify(copy)},t.replace('x-status: live','x-status: unknown'));`,
    ],
    { encoding: 'utf8' },
  );
  assert.equal(run.status, 0, run.stderr);
  try {
    const spectral = spawnSync(
      `${PKG_ROOT}/node_modules/.bin/spectral`,
      ['lint', copy, '--ruleset', `${PKG_ROOT}/rules/.spectral.yaml`, '--fail-severity', 'warn'],
      { cwd: PKG_ROOT, encoding: 'utf8' },
    );
    assert.notEqual(spectral.status, 0);
    assert.match(spectral.stdout, /alore-operation-x-status/);
  } finally {
    spawnSync('rm', ['-f', copy]);
  }
});
