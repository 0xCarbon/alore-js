import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));
const pkgRoot = testDir.endsWith('/build/test') ? join(testDir, '..', '..') : join(testDir, '..');

test('published dist entrypoint and declarations exist and export the SDK surface', async () => {
  const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8')) as {
    main: string;
    types: string;
    files: string[];
  };

  const mainPath = join(pkgRoot, pkg.main);
  const typesPath = join(pkgRoot, pkg.types);
  assert.equal(existsSync(mainPath), true, `missing ${pkg.main}`);
  assert.equal(existsSync(typesPath), true, `missing ${pkg.types}`);
  assert.ok(pkg.files.includes('dist'));

  const mod = (await import(pathToFileURL(mainPath).href)) as Record<string, unknown>;
  for (const name of [
    'aloreClient',
    'verifyWebhook',
    'buildTenancyHeaders',
    'deriveDataClass',
    'generateIdempotencyKey',
    'deriveIdempotencyKey',
    'problemToError',
    'isAloreProblem',
    'compareSemver',
    'assertCompatibleContract',
    'AloreProblemError',
    'AloreNotFoundError',
    'AloreInvalidRequestError',
    'AloreRateLimitError',
    'AloreUnavailableError',
    'AloreConflictError',
    'AlorePayloadTooLargeError',
    'AloreUnsupportedMediaTypeError',
    'AloreContractVersionError',
    'AloreNotImplementedError',
    'AloreWebhookVerificationError',
  ]) {
    assert.ok(name in mod, `dist/index.js missing export ${name}`);
  }
});
