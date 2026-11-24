// 1. Every fixture validates against its schema.
// 2. Every schema has a fixture and every enum value appears in some fixture.
import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadFixtures, loadSchemas } from './helpers.mjs';

const schemas = loadSchemas();
const fixtures = loadFixtures();

function validator() {
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  for (const [name, schema] of Object.entries(schemas)) ajv.addSchema(schema, name);
  return ajv;
}

test('there are schemas and fixtures', () => {
  assert.ok(Object.keys(schemas).length >= 4);
  assert.ok(fixtures.length >= 20);
});

test('every fixture names an existing schema and has the expected shape', () => {
  for (const f of fixtures) {
    assert.ok(schemas[f.schema], `${f.file}: unknown schema ${f.schema}`);
    assert.equal(typeof f.valid, 'boolean', `${f.file}: valid must be a boolean`);
    assert.ok('instance' in f, `${f.file}: missing instance`);
    if (f.valid === false) assert.ok(f.description, `${f.file}: a rejected fixture says why`);
  }
});

test('every fixture validates against its schema (ajv 2020)', () => {
  const ajv = validator();
  for (const f of fixtures) {
    const check = ajv.getSchema(f.schema);
    const ok = check(f.instance);
    assert.equal(
      ok,
      f.valid,
      `${f.file}: expected valid=${f.valid}, ${JSON.stringify(check.errors)}`,
    );
  }
});

test('every schema is valid JSON Schema 2020-12 and has at least one accepted fixture', () => {
  const ajv = validator();
  for (const [name, schema] of Object.entries(schemas)) {
    assert.equal(
      schema.$schema,
      'https://json-schema.org/draft/2020-12/schema',
      `${name}: $schema`,
    );
    assert.ok(ajv.validateSchema(schema), `${name}: ${JSON.stringify(ajv.errors)}`);
    assert.ok(
      fixtures.some((f) => f.schema === name && f.valid),
      `${name} has no accepted fixture`,
    );
  }
});

function enumsOf(node, found = []) {
  if (Array.isArray(node)) {
    node.forEach((n) => enumsOf(n, found));
  } else if (node && typeof node === 'object') {
    for (const [prop, sub] of Object.entries(node.properties ?? {})) {
      const values = sub.enum ?? sub.items?.enum;
      if (values) values.forEach((value) => found.push({ prop, value }));
    }
    Object.values(node).forEach((n) => enumsOf(n, found));
  }
  return found;
}

function pairsOf(node, key, found = new Set()) {
  if (Array.isArray(node)) {
    node.forEach((n) => pairsOf(n, key, found));
  } else if (node && typeof node === 'object') {
    Object.entries(node).forEach(([k, v]) => pairsOf(v, k, found));
  } else {
    found.add(`${key}=${JSON.stringify(node)}`);
  }
  return found;
}

test('every enum value appears in an accepted fixture of its schema', () => {
  for (const [name, schema] of Object.entries(schemas)) {
    const seen = new Set();
    fixtures
      .filter((f) => f.schema === name && f.valid)
      .forEach((f) => pairsOf(f.instance, '', seen));
    for (const { prop, value } of enumsOf(schema)) {
      assert.ok(
        seen.has(`${prop}=${JSON.stringify(value)}`),
        `${name}: no fixture has ${prop} = ${value}`,
      );
    }
  }
});
