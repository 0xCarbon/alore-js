import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

import { readJson, readText } from './io.mjs';
import { FILES, PKG_ROOT } from './paths.mjs';

const REL = 'packages/alore-platform-contract';
const CHANGESETS = '.changeset';
const isChangeset = (name) => name.endsWith('.md') && name !== 'README.md';

export const git = (...args) =>
  execFileSync('git', args, { cwd: PKG_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function readChangesets() {
  if (!existsSync(FILES.changesetDir)) return {};
  return Object.fromEntries(
    readdirSync(FILES.changesetDir)
      .filter(isChangeset)
      .sort()
      .map((name) => [name, readText(`${FILES.changesetDir}/${name}`)]),
  );
}

/** The contract surface, CHANGELOG and pending changesets of the working tree, as text. */
export function readTree() {
  const prePath = `${FILES.changesetDir}/pre.json`;
  const pre = existsSync(prePath) ? readJson(prePath) : null;
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
    changesets: readChangesets(),
    consumedChangesetIds: pre?.changesets ?? [],
  };
}

/** Fail on a ref git does not know: an unknown base must never read as "no package at base". */
export function verifyRef(ref) {
  try {
    git('rev-parse', '--verify', '--quiet', `${ref}^{tree}`);
  } catch {
    throw new Error(
      `base ref "${ref}" is not a git object in this checkout (fetch it, or fix the ref)`,
    );
  }
}

/**
 * The same surface at a git ref, or null when the package does not exist there yet (the first
 * release). An unknown ref throws; only a missing package path means "first release".
 */
export function treeFromGit(ref) {
  verifyRef(ref);
  const listed = git('ls-tree', '--full-tree', '--name-only', ref, `${REL}/package.json`).trim();
  if (!listed) return null;
  const show = (path) => git('show', `${ref}:${path}`);
  const pkg = (path) => show(`${REL}/${path}`);
  const changelog = pkg('CHANGELOG.md');
  const names = git('ls-tree', '--full-tree', '--name-only', ref, `${REL}/schemas/`)
    .split('\n')
    .filter((n) => n.endsWith('.schema.json'))
    .map((n) => n.split('/').pop());
  return {
    schemas: Object.fromEntries(names.map((n) => [n, pkg(`schemas/${n}`)])),
    overlay: pkg('openapi/x-alore.overlay.yaml'),
    asyncapi: pkg('asyncapi/asyncapi.yaml'),
    served: pkg('routes/served.yaml'),
    planned: pkg('routes/planned.yaml'),
    pin: pkg('openapi/upstream/PIN.json'),
    changelog,
    changesets: Object.fromEntries(
      git('ls-tree', '--full-tree', '--name-only', ref, `${CHANGESETS}/`)
        .split('\n')
        .map((n) => n.split('/').pop())
        .filter((n) => n && isChangeset(n))
        .map((n) => [n, show(`${CHANGESETS}/${n}`)]),
    ),
  };
}
