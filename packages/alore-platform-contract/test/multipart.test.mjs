import assert from 'node:assert/strict';
import { test } from 'node:test';

import { multipartRequestObject } from '../fake/multipart.mjs';

test('the schema projection requires a binary part for the binary field', () => {
  const form = { fields: { label: 'example', attachment: 'example.txt' }, files: [] };
  assert.deepEqual(multipartRequestObject(form, 'attachment'), { label: 'example' });
});

test('the schema projection represents a binary part by its filename', () => {
  const form = {
    fields: { label: 'example' },
    files: [{ name: 'attachment', filename: 'example.txt', data: Buffer.alloc(0) }],
  };
  assert.deepEqual(multipartRequestObject(form, 'attachment'), {
    label: 'example',
    attachment: 'example.txt',
  });
});
