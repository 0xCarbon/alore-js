// 5. Negative controls: each one must turn lint red.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  checkChangelog,
  checkClosedOutputs,
  checkIds,
  checkOnlyAdds,
  checkProblemSchema,
  checkStatuses,
  checkVendorNames,
  classifiedChangeset,
  PROBLEM_RESPONSE_REF,
} from '../scripts/lib/checks.mjs';
import { readJson } from '../scripts/lib/io.mjs';
import { readTree, treeFromGit } from '../scripts/lib/tree.mjs';
import { lint } from '../scripts/lint.mjs';
import { contract, FILES, loadSchemas, negative, PKG_ROOT } from './helpers.mjs';

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

test('an overlay that adds an enum to an OpenAI string field turns lint red', () => {
  const found = lint({ overlay: negative('overlay-adds-enum-to-openai-field.yaml') });
  assert.ok(
    found.some((x) => x.rule === 'overlay-only-adds' && /filename\/enum/.test(x.where)),
    JSON.stringify(found.slice(0, 3)),
  );
});

test('an overlay that adds a property without x-alore-feature turns lint red', () => {
  const found = lint({ overlay: negative('overlay-ungated-property.yaml') });
  assert.ok(
    found.some((x) => x.rule === 'feature-gate' && /x_extra/.test(x.where)),
    JSON.stringify(found.slice(0, 3)),
  );
});

test('an x-alore near-duplicate of an upstream path (hyphen for underscore) turns lint red', () => {
  const found = lint({ overlay: negative('overlay-near-duplicate-path.yaml') });
  assert.ok(
    found.some(
      (x) =>
        x.rule === 'upstream-first' &&
        /fine_tuning\/jobs\/\{fine_tuning_job_id\}\/pause/.test(x.message),
    ),
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

test('the committed tree carries a classified entry for the initial contract', () => {
  assert.deepEqual(checkChangelog(null, readTree()), []);
  assert.equal(checkChangelog(null, { ...readTree(), changelog: '', changesets: {} }).length, 1);
});

const changeset = (body, pkg = '@alore/platform-contract', bump = 'minor') =>
  `---\n'${pkg}': ${bump}\n---\n\n${body}\n`;

test('a new changeset for the package, classified, satisfies the checker', () => {
  const prev = surface({ changesets: {} });
  const next = (body, name = 'x.md', pkg, bump) =>
    surface({
      overlay: 'overlay: 1.0.0\nactions: []\n',
      changesets: { [name]: changeset(body, pkg, bump) },
    });
  for (const kind of ['additive', 'deprecating', 'breaking']) {
    const bump = kind === 'breaking' ? 'major' : 'minor';
    assert.deepEqual(
      checkChangelog(prev, next(`${kind}: changed the overlay`, 'x.md', undefined, bump)),
      [],
      kind,
    );
  }
  assert.equal(checkChangelog(prev, next('tweaked the overlay')).length, 1, 'not classified');
  assert.equal(
    checkChangelog(prev, next('additive: x', 'x.md', '@alore/auth-react-ui')).length,
    1,
    'a changeset for another package does not count',
  );
  const known = surface({ changesets: { 'x.md': changeset('additive: old') } });
  assert.equal(
    checkChangelog(known, { ...next('additive: old'), changesets: known.changesets }).length,
    1,
    'a changeset already at the base is not new',
  );
});

test('classifiedChangeset reads the frontmatter and the first words of the body', () => {
  assert.ok(classifiedChangeset(changeset('additive: a')));
  assert.ok(classifiedChangeset(changeset('Breaking: a', undefined, 'major')));
  assert.ok(!classifiedChangeset(changeset('additive a')));
  assert.ok(!classifiedChangeset('additive: a'));
});

test('a classified changeset requires the corresponding package bump', () => {
  for (const [kind, bump] of [
    ['additive', 'patch'],
    ['deprecating', 'patch'],
    ['breaking', 'minor'],
  ]) {
    assert.equal(
      classifiedChangeset(changeset(`${kind}: changed a schema`, undefined, bump)),
      false,
    );
  }
});

test('a consumed prerelease changeset cannot cover a contract change', () => {
  const prev = surface();
  const next = surface({
    overlay: 'overlay: 1.0.0\nactions: []\n',
    changesets: { 'used.md': changeset('additive: already released') },
    consumedChangesetIds: ['used'],
  });
  assert.equal(checkChangelog(prev, next).length, 1);
});

test('an unknown base ref fails lint instead of passing as a first release', () => {
  const found = lint({ base: 'nonexistent-ref-xyz' });
  assert.ok(
    found.some((x) => x.rule === 'changelog' && /nonexistent-ref-xyz/.test(x.message)),
    JSON.stringify(found),
  );
  assert.throws(() => treeFromGit('nonexistent-ref-xyz'), /not a git object/);
  const run = spawnSync(
    process.execPath,
    ['scripts/lint.mjs', '--skip-spectral', '--base', 'nonexistent-ref-xyz'],
    { cwd: PKG_ROOT, encoding: 'utf8' },
  );
  assert.equal(run.status, 1);
});

test('only a missing package path at a known base is a first release', (t) => {
  const root = spawnSync('git', ['rev-list', '--max-parents=0', 'HEAD'], {
    cwd: PKG_ROOT,
    encoding: 'utf8',
  })
    .stdout.trim()
    .split('\n')[0];
  if (!root || treeFromGit(root) !== null)
    return t.skip('no base without the package in this clone');
  assert.deepEqual(lint({ base: root }), []);
  assert.ok(treeFromGit('HEAD'), 'the package exists at HEAD');
  return undefined;
});

const upstreamDoc = () => ({
  paths: {
    '/things': {
      get: { operationId: 'listThings', responses: { 200: { description: 'ok' } } },
    },
  },
  components: {
    schemas: {
      Thing: {
        type: 'object',
        properties: { model: { type: 'string' }, size: { type: 'integer' } },
      },
    },
  },
});

test('the overlay may add only descriptions, titles, examples, x- marks and new properties', () => {
  const adds = (edit) => {
    const merged = upstreamDoc();
    edit(merged);
    return checkOnlyAdds(upstreamDoc(), merged);
  };
  const narrowing = {
    enum: (d) => (d.components.schemas.Thing.properties.model.enum = ['a']),
    minProperties: (d) => (d.components.schemas.Thing.minProperties = 1),
    maxProperties: (d) => (d.components.schemas.Thing.maxProperties = 1),
    propertyNames: (d) => (d.components.schemas.Thing.propertyNames = { pattern: '^a' }),
    multipleOf: (d) => (d.components.schemas.Thing.properties.size.multipleOf = 5),
    discriminator: (d) => (d.components.schemas.Thing.discriminator = { propertyName: 'model' }),
    dependentRequired: (d) => (d.components.schemas.Thing.dependentRequired = { a: ['b'] }),
    if: (d) => (d.components.schemas.Thing.if = { type: 'object' }),
    prefixItems: (d) => (d.components.schemas.Thing.prefixItems = []),
    contains: (d) => (d.components.schemas.Thing.contains = {}),
    contentMediaType: (d) => (d.components.schemas.Thing.contentMediaType = 'x/y'),
    requestBody: (d) => (d.paths['/things'].get.requestBody = { required: true }),
    pattern: (d) => (d.components.schemas.Thing.properties.model.pattern = '^a'),
  };
  for (const [name, edit] of Object.entries(narrowing)) {
    assert.ok(
      adds(edit).some((x) => x.rule === 'overlay-only-adds'),
      `${name} must fail`,
    );
  }
  const allowed = {
    description: (d) => (d.components.schemas.Thing.description = 'x'),
    title: (d) => (d.components.schemas.Thing.title = 'x'),
    example: (d) => (d.components.schemas.Thing.example = {}),
    examples: (d) => (d.components.schemas.Thing.examples = []),
    'x- mark': (d) => (d.paths['/things'].get['x-status'] = 'live'),
    'new gated property': (d) =>
      (d.components.schemas.Thing.properties.extra = { type: 'string', 'x-alore-feature': 'f' }),
    'new path': (d) => (d.paths['/other'] = { get: {} }),
    'new operation': (d) => (d.paths['/things'].post = {}),
    'new component': (d) => (d.components.schemas.Other = { type: 'object' }),
  };
  for (const [name, edit] of Object.entries(allowed)) {
    assert.deepEqual(adds(edit), [], `${name} must pass`);
  }
  const ungated = adds((d) => (d.components.schemas.Thing.properties.extra = { type: 'string' }));
  assert.deepEqual(
    ungated.map((x) => x.rule),
    ['feature-gate'],
  );
});

test('only the AloreProblem 501 response may be added to a pinned stub', () => {
  const withResponse = (status, responses) => {
    const merged = upstreamDoc();
    const op = merged.paths['/things'].get;
    op['x-status'] = status;
    Object.assign(op.responses, responses);
    return checkOnlyAdds(upstreamDoc(), merged);
  };
  const problem = { $ref: PROBLEM_RESPONSE_REF };
  assert.deepEqual(withResponse('stub', { 501: problem }), []);
  assert.equal(withResponse('live', { 501: problem }).length, 1);
  assert.equal(withResponse('stub', { 502: problem }).length, 1);
  assert.equal(withResponse('stub', { 501: { description: 'different' } }).length, 1);
  assert.ok(
    withResponse('stub', { 200: problem, 501: problem }).some((x) => x.where.includes('/200')),
  );
});

test('a property literally named properties is not a property map', () => {
  const base = () => ({
    components: { schemas: { T: { properties: { properties: { type: 'object' } } } } },
  });
  const merged = base();
  merged.components.schemas.T.properties.properties.enum = ['a'];
  assert.ok(checkOnlyAdds(base(), merged).some((x) => x.rule === 'overlay-only-adds'));
});

test('every stub carries x-stub-response 501, and only stubs do', () => {
  const { merged } = contract();
  assert.deepEqual(checkStatuses(merged), []);
  const bad = structuredClone(merged);
  bad.paths['/models/{model}'].delete['x-stub-response'] = 200;
  bad.paths['/models/{model}'].get['x-stub-response'] = 501;
  assert.equal(checkStatuses(bad).length, 2);
  const missing = structuredClone(merged);
  delete missing.paths['/models/{model}'].delete.responses['501'];
  assert.equal(checkStatuses(missing).length, 1);
  const unknown = structuredClone(merged);
  unknown.paths['/models/{model}'].get['x-status'] = 'unknown';
  assert.equal(checkStatuses(unknown).length, 1);
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

/** Run Spectral over a copy of openapi.yaml changed by `edit` (a text transform). */
function spectralOnEdited(edit) {
  const copy = FILES.openapi.replace('openapi.yaml', '.negative-spectral.yaml');
  writeFileSync(copy, edit(readFileSync(FILES.openapi, 'utf8')));
  try {
    return spawnSync(
      `${PKG_ROOT}/node_modules/.bin/spectral`,
      ['lint', copy, '--ruleset', `${PKG_ROOT}/rules/.spectral.yaml`, '--fail-severity', 'warn'],
      { cwd: PKG_ROOT, encoding: 'utf8' },
    );
  } finally {
    rmSync(copy, { force: true });
  }
}

test('the Spectral rules reject an x-alore operation without operationId', () => {
  const run = spectralOnEdited((text) => {
    const edited = text.replace('      operationId: alore_post_files_presign\n', '');
    assert.notEqual(edited, text);
    return edited;
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stdout, /alore-operation-id/);
});

test('the Spectral rules reject a non-problem error on an x-alore operation', () => {
  const run = spectralOnEdited((text) => {
    const marker = 'operationId: alore_post_files_presign';
    const at = text.indexOf(marker);
    const from = text.indexOf('        default:\n', at);
    const edited = `${text.slice(0, from)}        "400":\n          description: plain\n${text.slice(
      text.indexOf('\n', text.indexOf('$ref', from)) + 1,
    )}`;
    assert.notEqual(edited, text);
    return edited;
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stdout, /alore-problem-json/);
});
