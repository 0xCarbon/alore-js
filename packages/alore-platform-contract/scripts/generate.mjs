#!/usr/bin/env node
// generate = cut the pinned upstream spec, then apply the x-alore overlay.
// Writes openapi/openai.pinned.yaml and openapi/openapi.yaml. Deterministic.
import { buildContract, loadPin, loadRoutes, render, verifyPin } from './lib/contract.mjs';
import { readJson, readYaml, writeIfChanged } from './lib/io.mjs';
import { FILES } from './lib/paths.mjs';

export function generate() {
  const pin = loadPin();
  verifyPin(pin);
  const { pinned, merged, missing } = buildContract({
    upstream: readYaml(FILES.upstream),
    routes: loadRoutes(),
    pin,
    overlay: readYaml(FILES.overlay),
    version: readJson(FILES.pkg).version,
  });
  const out = { pinned: render.pinned(pinned), openapi: render.openapi(merged) };
  writeIfChanged(FILES.pinned, out.pinned);
  writeIfChanged(FILES.openapi, out.openapi);
  return { ...out, missing };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { missing } = generate();
  console.log(
    `generated openapi/openai.pinned.yaml and openapi/openapi.yaml (${missing.length} overlay-defined routes)`,
  );
}
