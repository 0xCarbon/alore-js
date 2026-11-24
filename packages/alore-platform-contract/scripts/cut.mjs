#!/usr/bin/env node
// Cut the pinned upstream OpenAI spec to the routes Alore serves.
// Deterministic: it reads only files in this package and writes openapi/openai.pinned.yaml.
import { loadPin, loadRoutes, render, upstreamRoutes, verifyPin } from './lib/contract.mjs';
import { cutUpstream } from './lib/cut.mjs';
import { readYaml, writeIfChanged } from './lib/io.mjs';
import { FILES } from './lib/paths.mjs';

export function cut() {
  const pin = loadPin();
  verifyPin(pin);
  const upstream = readYaml(FILES.upstream);
  const routes = upstreamRoutes(loadRoutes());
  const { doc, missing } = cutUpstream(upstream, routes, pin);
  const out = render.pinned(doc);
  writeIfChanged(FILES.pinned, out);
  return { doc, missing };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { missing } = cut();
  if (missing.length) {
    console.log(`${missing.length} route(s) have no upstream operation (overlay-defined):`);
    missing.forEach((m) => console.log(`  ${m}`));
  }
}
