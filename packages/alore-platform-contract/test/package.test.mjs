// 6. The package manifest and the release wiring.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { FILES, PKG_ROOT } from '../scripts/lib/paths.mjs';

const pkg = JSON.parse(readFileSync(FILES.pkg, 'utf8'));
const repoRoot = join(PKG_ROOT, '..', '..');

const covered = (target) =>
  pkg.files.some((entry) => target === `./${entry}` || target.startsWith(`./${entry}/`));

test('every exported file exists and ships in `files`', () => {
  for (const [name, target] of Object.entries(pkg.exports)) {
    if (name === './package.json') continue;
    if (target.endsWith('/*')) {
      const dir = join(PKG_ROOT, target.slice(0, -2));
      assert.ok(readdirSync(dir).length > 0, `${name} matches nothing`);
      assert.ok(covered(target.slice(0, -2) + '/x'), `${name} is not in files`);
    } else {
      assert.ok(existsSync(join(PKG_ROOT, target)), `${name} -> ${target} is missing`);
      assert.ok(covered(target), `${name} -> ${target} is not in files`);
    }
  }
});

test('the route tables, the pinned spec and the overlay can be imported', () => {
  for (const name of ['./openai.pinned.yaml', './x-alore.overlay.yaml', './routes/*']) {
    assert.ok(pkg.exports[name], `${name} is not exported`);
  }
});

test('the release workflow regenerates the contract after changeset version', () => {
  const root = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  const script = root.scripts['version-packages'];
  assert.match(script, /^changeset version && /);
  assert.match(script, /@alore\/platform-contract run generate/);
  const workflow = readFileSync(join(repoRoot, '.github/workflows/release-pr.yml'), 'utf8');
  assert.match(workflow, /version: pnpm run version-packages/);
});
