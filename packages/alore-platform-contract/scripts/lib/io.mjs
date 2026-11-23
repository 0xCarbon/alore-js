import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';

export const readText = (file) => readFileSync(file, 'utf8');
export const readYaml = (file) => parse(readText(file), { maxAliasCount: -1 });
export const readJson = (file) => JSON.parse(readText(file));
export const sha256 = (data) => createHash('sha256').update(data).digest('hex');

// Fixed serialisation options keep generated files byte-identical across runs.
export function toYaml(doc, header = '') {
  const body = stringify(doc, {
    lineWidth: 0,
    indent: 2,
    aliasDuplicateObjects: false,
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN',
  });
  return `${header}${body}`;
}

export function writeIfChanged(file, content) {
  let current = null;
  try {
    current = readFileSync(file, 'utf8');
  } catch {
    // missing file
  }
  if (current !== content) writeFileSync(file, content);
}

export function walkFiles(dir, accept = () => true) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full, accept));
    else if (accept(full)) out.push(full);
  }
  return out;
}

export const clone = (value) => structuredClone(value);
