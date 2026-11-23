import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

import { readText } from './io.mjs';
import { FILES, PKG_ROOT } from './paths.mjs';

const REL = 'packages/alore-platform-contract';

export const git = (...args) =>
  execFileSync('git', args, { cwd: PKG_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** The contract surface and CHANGELOG of the working tree, as text. */
export function readTree() {
  const schemas = {};
  for (const name of readdirSync(FILES.schemasDir).sort()) {
    if (name.endsWith('.schema.json')) schemas[name] = readText(`${FILES.schemasDir}/${name}`);
  }
  return {
    schemas,
    overlay: readText(FILES.overlay),
    asyncapi: readText(FILES.asyncapi),
    served: readText(FILES.served),
    planned: readText(FILES.planned),
    pin: readText(FILES.pin),
    changelog: readText(FILES.changelog),
  };
}

/** The same surface at a git ref, or null when the package does not exist there yet. */
export function treeFromGit(ref) {
  const show = (path) => git('show', `${ref}:${REL}/${path}`);
  let changelog;
  try {
    changelog = show('CHANGELOG.md');
  } catch {
    return null;
  }
  const names = git('ls-tree', '--full-tree', '--name-only', ref, `${REL}/schemas/`)
    .split('\n')
    .filter((n) => n.endsWith('.schema.json'))
    .map((n) => n.split('/').pop());
  return {
    schemas: Object.fromEntries(names.map((n) => [n, show(`schemas/${n}`)])),
    overlay: show('openapi/x-alore.overlay.yaml'),
    asyncapi: show('asyncapi/asyncapi.yaml'),
    served: show('routes/served.yaml'),
    planned: show('routes/planned.yaml'),
    pin: show('openapi/upstream/PIN.json'),
    changelog,
  };
}
