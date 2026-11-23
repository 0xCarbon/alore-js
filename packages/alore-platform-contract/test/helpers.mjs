import { join } from 'node:path';

import { operations } from '../scripts/lib/checks.mjs';
import { buildContract, loadPin, loadRoutes } from '../scripts/lib/contract.mjs';
import { readJson, readYaml, walkFiles } from '../scripts/lib/io.mjs';
import { FILES, PKG_ROOT } from '../scripts/lib/paths.mjs';

export { FILES, PKG_ROOT, operations };
export const negative = (name) => join(PKG_ROOT, 'test', 'negative', name);

let cached;
/** Parsed inputs and the in-memory build, shared by the tests of one process. */
export function contract() {
  if (!cached) {
    const upstream = readYaml(FILES.upstream);
    const routes = loadRoutes();
    const pin = loadPin();
    const overlay = readYaml(FILES.overlay);
    const version = readJson(FILES.pkg).version;
    cached = {
      upstream,
      routes,
      pin,
      overlay,
      version,
      ...buildContract({ upstream, routes, pin, overlay, version }),
    };
  }
  return cached;
}

export function loadSchemas() {
  return Object.fromEntries(
    walkFiles(FILES.schemasDir, (f) => f.endsWith('.schema.json')).map((f) => [
      f.split('/').pop(),
      readJson(f),
    ]),
  );
}

export function loadFixtures() {
  return walkFiles(FILES.fixturesDir, (f) => f.endsWith('.json')).map((file) => ({
    file: file.slice(FILES.fixturesDir.length + 1),
    ...readJson(file),
  }));
}
