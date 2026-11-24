// The AsyncAPI document is valid 3.0 and holds the webhook envelope only.
import { Parser } from '@asyncapi/parser';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readText, readYaml } from '../scripts/lib/io.mjs';
import { FILES, loadSchemas } from './helpers.mjs';

test('asyncapi.yaml is AsyncAPI 3.0 with no parser errors', async () => {
  const parser = new Parser();
  const { document, diagnostics } = await parser.parse(readText(FILES.asyncapi), {
    source: FILES.asyncapi,
  });
  const errors = diagnostics.filter((d) => d.severity === 0);
  assert.deepEqual(
    errors.map((e) => `${e.code}: ${e.message}`),
    [],
  );
  assert.equal(document.version(), '3.0.0');
});

test('the envelope is the only message and it points at the envelope schema', () => {
  const doc = readYaml(FILES.asyncapi);
  assert.deepEqual(Object.keys(doc.components.messages), ['AloreEvent']);
  assert.equal(
    doc.components.messages.AloreEvent.payload.$ref,
    '../schemas/webhook-envelope.schema.json',
  );
  assert.ok(loadSchemas()['webhook-envelope.schema.json']);
  assert.deepEqual(Object.keys(doc.channels), ['clientWebhook']);
  assert.equal(doc.info.version, '0.1.0-alpha.0');
});

test('the envelope lists the event types of the contract', () => {
  const { enum: types } = loadSchemas()['webhook-envelope.schema.json'].properties.type;
  assert.equal(types.length, 15);
  assert.ok(types.includes('org.erased'));
});
