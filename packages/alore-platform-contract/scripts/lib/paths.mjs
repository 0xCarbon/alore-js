import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REPO_ROOT = resolve(PKG_ROOT, '..', '..');
export const p = (...parts) => resolve(PKG_ROOT, ...parts);

export const FILES = {
  upstream: p('openapi/upstream/openapi.yaml'),
  pin: p('openapi/upstream/PIN.json'),
  pinned: p('openapi/openai.pinned.yaml'),
  overlay: p('openapi/x-alore.overlay.yaml'),
  openapi: p('openapi/openapi.yaml'),
  asyncapi: p('asyncapi/asyncapi.yaml'),
  served: p('routes/served.yaml'),
  planned: p('routes/planned.yaml'),
  changelog: p('CHANGELOG.md'),
  changesetDir: resolve(REPO_ROOT, '.changeset'),
  pkg: p('package.json'),
  schemasDir: p('schemas'),
  fixturesDir: p('fixtures'),
};
