#!/usr/bin/env node
// Contract lint. Exit code 1 when any rule fails.
//   node scripts/lint.mjs [--json] [--skip-spectral] [--base <git-ref>]  (or CONTRACT_BASE_REF)
//                         [--overlay <file>] [--schemas-dir <dir>]
// --overlay and --schemas-dir swap in other inputs (used by the negative controls);
// they skip the checks that compare against committed generated files.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';

import {
  checkChangelog,
  checkClosedOutputs,
  checkIds,
  checkOnlyAdds,
  checkOverlayShape,
  checkProblemResponses,
  checkProblemSchema,
  checkServedRoutes,
  checkStatuses,
  checkUpstreamFirst,
  checkVendorNames,
} from './lib/checks.mjs';
import { buildContract, loadPin, loadRoutes, render, verifyPin } from './lib/contract.mjs';
import { readJson, readText, readYaml, walkFiles } from './lib/io.mjs';
import { FILES, PKG_ROOT } from './lib/paths.mjs';
import { readTree, treeFromGit } from './lib/tree.mjs';

function parseArgs(argv) {
  const args = { json: false, skipSpectral: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--skip-spectral') args.skipSpectral = true;
    else if (['--base', '--overlay', '--schemas-dir'].includes(a))
      args[a.slice(2).replace(/-./g, (m) => m[1].toUpperCase())] = argv[++i];
    else throw new Error(`unknown argument ${a}`);
  }
  return args;
}

export function lint(args = {}) {
  const out = [];
  const pin = loadPin();
  verifyPin(pin);
  const overrides = Boolean(args.overlay || args.schemasDir);
  const overlay = readYaml(args.overlay ?? FILES.overlay);
  const schemaFiles = walkFiles(args.schemasDir ?? FILES.schemasDir, (f) =>
    f.endsWith('.schema.json'),
  );
  const schemas = Object.fromEntries(schemaFiles.map((f) => [basename(f), readJson(f)]));
  const upstream = readYaml(FILES.upstream);
  const routes = loadRoutes();

  out.push(...checkOverlayShape(overlay));
  let built;
  try {
    built = buildContract({ upstream, routes, pin, overlay, version: readJson(FILES.pkg).version });
  } catch (error) {
    out.push({ rule: 'overlay-apply', where: 'overlay', message: error.message });
    return out;
  }
  const { pinned, merged } = built;

  out.push(...checkOnlyAdds(pinned, merged));
  out.push(...checkUpstreamFirst(pinned, merged, upstream));
  out.push(...checkStatuses(merged));
  out.push(...checkProblemResponses(pinned, merged));
  out.push(...checkServedRoutes(merged, routes.served, routes.planned));
  out.push(...checkProblemSchema(schemas));
  out.push(...checkIds(schemas));
  out.push(...checkClosedOutputs(schemas));
  const names = readJson(join(PKG_ROOT, 'rules/vendor-names.json'));
  out.push(
    ...checkVendorNames(
      { overlay, asyncapi: readYaml(FILES.asyncapi), ...schemas },
      { deny: names.deny, modelAliases: names.modelAliases },
    ),
  );

  if (!overrides) {
    if (!existsSync(FILES.pinned) || readText(FILES.pinned) !== render.pinned(pinned)) {
      out.push({
        rule: 'generated',
        where: 'openapi/openai.pinned.yaml',
        message: 'is stale: run generate',
      });
    }
    if (!existsSync(FILES.openapi) || readText(FILES.openapi) !== render.openapi(merged)) {
      out.push({
        rule: 'generated',
        where: 'openapi/openapi.yaml',
        message: 'is stale: run generate',
      });
    }
  }
  const base = args.base ?? process.env.CONTRACT_BASE_REF;
  if (base && !/^0+$/.test(base)) {
    try {
      out.push(...checkChangelog(treeFromGit(base), readTree()));
    } catch (error) {
      out.push({ rule: 'changelog', where: `base ${base}`, message: error.message });
    }
  }
  return out;
}

function runSpectral() {
  const bin = join(PKG_ROOT, 'node_modules/.bin/spectral');
  const run = spawnSync(
    bin,
    [
      'lint',
      FILES.openapi,
      '--ruleset',
      join(PKG_ROOT, 'rules/.spectral.yaml'),
      '--fail-severity',
      'warn',
    ],
    { cwd: PKG_ROOT, encoding: 'utf8' },
  );
  return run;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const violations = lint(args);
  if (args.json) {
    console.log(JSON.stringify(violations, null, 2));
  } else {
    violations.forEach((x) => console.error(`${x.rule}: ${x.where}: ${x.message}`));
  }
  let failed = violations.length > 0;
  if (!args.skipSpectral && !args.overlay && !args.schemasDir) {
    const run = runSpectral();
    if (run.stdout) process.stderr.write(run.stdout);
    if (run.stderr) process.stderr.write(run.stderr);
    if (run.status !== 0) failed = true;
  }
  if (!failed) console.error('platform-contract lint: ok');
  process.exit(failed ? 1 : 0);
}
