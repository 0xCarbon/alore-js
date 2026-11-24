// Contract checks. Pure functions over in-memory trees, so the negative controls can
// feed them broken input. Every violation is { rule, where, message }.
import { parse } from 'yaml';

import { canonPath, METHODS } from './cut.mjs';
import { parseTarget } from './overlay.mjs';

export const X_STATUSES = ['live', 'stub', 'planned', 'legacy-replaced'];
export const PROBLEM_TYPES = [
  'not_found',
  'invalid_request',
  'rate_limited',
  'unavailable',
  'conflict',
  'payload_too_large',
  'unsupported_media_type',
  'contract_version',
  'not_implemented',
];
export const CLASS_STATUS = {
  openai: 'live',
  'x-alore-live': 'live',
  'legacy-kept': 'live',
  'legacy-replaced': 'legacy-replaced',
  stub: 'stub',
};
export const PROBLEM_RESPONSE_REF = '#/components/responses/AloreProblem';

const v = (rule, where, message) => ({ rule, where, message });
const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What the overlay may add to a node the pinned spec already defines. Anything else is
 * a change to what OpenAI defines (an `enum`, `minProperties`, `requestBody`, a
 * `discriminator`, ...), so this is an allowlist, never a denylist of known keywords.
 */
const ANNOTATIONS = new Set(['description', 'title', 'example', 'examples']);
export const FEATURE_GATE = 'x-alore-feature';

/** Where the overlay is adding: a node, the property map of a schema, `paths`, and so on. */
const childKind = (kind, key, node) => {
  if (kind === 'root') return { paths: 'paths', components: 'components' }[key] ?? 'node';
  if (kind === 'paths') return 'pathItem';
  if (kind === 'pathItem' && METHODS.includes(key)) return 'operation';
  if (kind === 'operation' && key === 'responses' && node['x-status'] === 'stub')
    return 'stubResponses';
  if (kind === 'components') return 'componentMap';
  if (kind === 'props' || kind === 'componentMap') return 'node';
  return key === 'properties' ? 'props' : 'node';
};

/** A key present in the merged node and missing from the pinned one. */
function addedKeyAllowed(kind, key, value) {
  if (kind === 'stubResponses' && key === '501') return same(value, { $ref: PROBLEM_RESPONSE_REF });
  if (ANNOTATIONS.has(key) || key.startsWith('x-')) return true;
  if (kind === 'props' || kind === 'paths' || kind === 'components' || kind === 'componentMap') {
    return true; // a new optional property, path or component
  }
  return kind === 'pathItem' && METHODS.includes(key); // a new operation on an existing path
}

/**
 * The overlay only adds. Compare the pinned document with pinned plus overlay and
 * report any change to what the pinned spec defines. A property the overlay adds to an
 * upstream schema must also carry `x-alore-feature` (rule `feature-gate`).
 */
export function checkOnlyAdds(pinned, merged) {
  const out = [];
  const walk = (p, m, ptr, kind) => {
    if (Array.isArray(p) !== Array.isArray(m) || isObject(p) !== isObject(m)) {
      out.push(v('overlay-only-adds', ptr, 'changes the type of an upstream-defined value'));
      return;
    }
    if (Array.isArray(p)) {
      const key = ptr.split('/').pop();
      if (key === 'enum') {
        if (!same(p, m.slice(0, p.length))) {
          out.push(v('overlay-only-adds', ptr, 'reorders or removes upstream enum values'));
        } else if (m.length > p.length) {
          out.push(v('overlay-only-adds', ptr, 'adds enum values to an OpenAI-defined enum'));
        }
      } else if (key === 'parameters') {
        if (!same(p, m.slice(0, p.length))) {
          out.push(v('overlay-only-adds', ptr, 'changes upstream parameters'));
        }
        m.slice(p.length).forEach((extra, i) => {
          if (extra?.required === true) {
            out.push(v('overlay-only-adds', `${ptr}/${p.length + i}`, 'adds a required parameter'));
          }
        });
      } else if (ptr === '#/tags') {
        if (!same(p, m.slice(0, p.length)))
          out.push(v('overlay-only-adds', ptr, 'changes upstream tags'));
      } else if (!same(p, m)) {
        out.push(
          v(
            'overlay-only-adds',
            ptr,
            key === 'required'
              ? 'changes the required list of an OpenAI-defined schema'
              : 'changes an upstream-defined list',
          ),
        );
      }
      return;
    }
    if (isObject(p)) {
      for (const key of Object.keys(p)) {
        if (ptr === '#' && (key === 'info' || key === 'servers')) continue;
        if (!(key in m)) {
          out.push(v('overlay-only-adds', `${ptr}/${key}`, 'removes an upstream-defined key'));
          continue;
        }
        walk(p[key], m[key], `${ptr}/${key}`, childKind(kind, key, m));
      }
      for (const key of Object.keys(m)) {
        if (key in p) continue;
        if (ptr === '#' && (key === 'info' || key === 'servers')) continue;
        if (key === 'required') {
          const added = m[key] === true || (Array.isArray(m[key]) && m[key].length > 0);
          if (added)
            out.push(
              v(
                'overlay-only-adds',
                `${ptr}/required`,
                'makes an optional upstream field required',
              ),
            );
        } else if (!addedKeyAllowed(kind, key, m[key])) {
          out.push(
            v(
              'overlay-only-adds',
              `${ptr}/${key}`,
              `adds ${key} to an upstream-defined node; the overlay may add only descriptions, titles, examples, x- marks, new properties and the AloreProblem 501 response on stubs`,
            ),
          );
        } else if (kind === 'props' && !(isObject(m[key]) && FEATURE_GATE in m[key])) {
          out.push(
            v(
              'feature-gate',
              `${ptr}/${key}`,
              `a property added to an upstream schema must carry ${FEATURE_GATE}`,
            ),
          );
        }
      }
      return;
    }
    if (p !== m) out.push(v('overlay-only-adds', ptr, 'changes an upstream-defined value'));
  };
  walk(pinned, merged, '#', 'root');
  return out;
}

export function* operations(doc) {
  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    for (const method of METHODS) {
      if (item?.[method]) yield { path, method, op: item[method] };
    }
  }
}

/**
 * The router spells five fine-tuning paths with a hyphen where upstream uses an underscore
 * (`/fine-tuning/jobs`, upstream `/fine_tuning/jobs`). That is an Alore router bug, tracked as
 * INC-202. The contract records the served spelling as the upstream operation under another
 * name (`x-upstream-equivalent`), not as an Alore extension. The list is closed: any other
 * overlay path that matches an upstream one once `-` and `_` are ignored fails upstream-first.
 */
export const ROUTER_SPELLINGS = new Map([
  ['post /fine-tuning/jobs', '/fine_tuning/jobs'],
  ['get /fine-tuning/jobs', '/fine_tuning/jobs'],
  ['get /fine-tuning/jobs/{fine_tuning_job_id}', '/fine_tuning/jobs/{fine_tuning_job_id}'],
  [
    'post /fine-tuning/jobs/{fine_tuning_job_id}/cancel',
    '/fine_tuning/jobs/{fine_tuning_job_id}/cancel',
  ],
  [
    'get /fine-tuning/jobs/{fine_tuning_job_id}/events',
    '/fine_tuning/jobs/{fine_tuning_job_id}/events',
  ],
]);

/** Path with parameter names erased and `-` read as `_`: spelling variants compare equal. */
const looseCanon = (path) => canonPath(path).replace(/-/g, '_');

/**
 * Upstream first: a path or schema is Alore-defined only where the pinned spec
 * (the whole upstream document, not only the cut) has no equivalent.
 */
export function checkUpstreamFirst(pinned, merged, upstream) {
  const out = [];
  const upstreamIndex = new Map(Object.keys(upstream.paths).map((k) => [looseCanon(k), k]));
  for (const { path, method, op } of operations(merged)) {
    if (pinned.paths[path]?.[method]) continue;
    const where = `${method.toUpperCase()} ${path}`;
    const equivalent = op['x-upstream-equivalent'];
    const known = ROUTER_SPELLINGS.get(`${method} ${path}`);
    if (known) {
      if (equivalent !== known || !upstream.paths[known]?.[method]) {
        out.push(
          v(
            'upstream-first',
            where,
            `must carry x-upstream-equivalent: ${known}, an upstream path`,
          ),
        );
      }
      if ((op.tags ?? []).includes('x-alore')) {
        out.push(
          v(
            'xalore-tag',
            where,
            'a router spelling of an upstream route is not an Alore extension',
          ),
        );
      }
      continue;
    }
    if (equivalent !== undefined) {
      out.push(
        v('upstream-first', where, 'x-upstream-equivalent is only for the known router spellings'),
      );
    }
    const key = upstreamIndex.get(looseCanon(path));
    if (key && upstream.paths[key][method]) {
      out.push(
        v(
          'upstream-first',
          where,
          `the pinned upstream spec already defines this operation at ${key}`,
        ),
      );
    }
    if (!(op.tags ?? []).includes('x-alore')) {
      out.push(v('xalore-tag', where, 'a path added by the overlay must carry the x-alore tag'));
    }
  }
  for (const name of Object.keys(merged.components?.schemas ?? {})) {
    if (pinned.components?.schemas?.[name]) continue;
    if (upstream.components?.schemas?.[name]) {
      out.push(
        v(
          'upstream-first',
          `#/components/schemas/${name}`,
          'redefines a schema the pinned upstream spec already defines',
        ),
      );
    }
  }
  return out;
}

export function checkStatuses(merged) {
  const out = [];
  for (const { path, method, op } of operations(merged)) {
    const where = `${method.toUpperCase()} ${path}`;
    if (!X_STATUSES.includes(op['x-status'])) {
      out.push(v('x-status', where, `x-status must be one of ${X_STATUSES.join(', ')}`));
    }
    if (op['x-status'] === 'stub' && op['x-stub-response'] !== 501) {
      out.push(v('x-status', where, 'a stub must carry x-stub-response: 501'));
    } else if (op['x-status'] !== 'stub' && op['x-stub-response'] !== undefined) {
      out.push(v('x-status', where, 'x-stub-response belongs to stubs only'));
    }
    if (op['x-status'] === 'stub' && !same(op.responses?.['501'], { $ref: PROBLEM_RESPONSE_REF })) {
      out.push(v('x-status', where, 'a stub must declare a 501 response referencing AloreProblem'));
    }
    const since = op['x-deprecated-since'];
    if (since !== undefined && !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(since)) {
      out.push(v('x-status', where, 'x-deprecated-since must be a semver version'));
    }
  }
  return out;
}

export function checkOverlayShape(overlay) {
  const out = [];
  if (overlay.overlay !== '1.0.0')
    out.push(v('overlay-shape', 'overlay', 'must declare overlay: 1.0.0'));
  (overlay.actions ?? []).forEach((action, n) => {
    const where = `actions[${n}]`;
    try {
      parseTarget(action.target);
    } catch (error) {
      out.push(v('overlay-shape', where, error.message));
    }
    if (action.remove)
      out.push(v('overlay-shape', where, 'the overlay only adds: remove is not allowed'));
    if (action.update === undefined)
      out.push(v('overlay-shape', where, 'an action needs an update'));
  });
  return out;
}

const compile = (names) =>
  new RegExp(
    `(?<![A-Za-z0-9])(?:${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![A-Za-z0-9])`,
    'i',
  );

/** No model, worker or vendor name in Alore-owned documents; `model` enums list aliases only. */
export function checkVendorNames(documents, { deny, modelAliases }) {
  const out = [];
  const re = compile(deny);
  const walk = (node, where) => {
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${where}[${i}]`));
    } else if (isObject(node)) {
      for (const [key, value] of Object.entries(node)) {
        if (re.test(key))
          out.push(
            v(
              'vendor-names',
              `${where}.${key}`,
              `name "${key.match(re)[0]}" is not allowed in a schema`,
            ),
          );
        if (key === 'model' && isObject(value) && Array.isArray(value.enum)) {
          for (const alias of value.enum) {
            if (!modelAliases.includes(alias)) {
              out.push(v('vendor-names', `${where}.model.enum`, `"${alias}" is not a model alias`));
            }
          }
          walk({ ...value, enum: undefined }, `${where}.model`);
        } else {
          walk(value, `${where}.${key}`);
        }
      }
    } else if (typeof node === 'string' && re.test(node)) {
      out.push(v('vendor-names', where, `name "${node.match(re)[0]}" is not allowed in a schema`));
    }
  };
  for (const [name, doc] of Object.entries(documents)) walk(doc, name);
  return out;
}

/** Ids are plain strings: no uuid format, no pattern, no non-string type. */
export function checkIds(schemas) {
  const out = [];
  const walk = (node, where) => {
    if (Array.isArray(node)) return node.forEach((item, i) => walk(item, `${where}[${i}]`));
    if (!isObject(node)) return;
    for (const [name, prop] of Object.entries(node.properties ?? {})) {
      if ((name === 'id' || name.endsWith('_id')) && isObject(prop)) {
        const types = [].concat(prop.type ?? []);
        if (!same(types, ['string']))
          out.push(v('ids', `${where}.${name}`, 'an id must be a plain string'));
        if (prop.format !== undefined || prop.pattern !== undefined) {
          out.push(v('ids', `${where}.${name}`, 'an id must not carry a format or pattern'));
        }
      }
    }
    Object.entries(node).forEach(([key, value]) => walk(value, `${where}.${key}`));
  };
  for (const [name, schema] of Object.entries(schemas)) walk(schema, name);
  return out;
}

/** Alore-owned outputs are closed; a schema marked x-alore-input ignores unknown fields. */
export function checkClosedOutputs(schemas) {
  const out = [];
  const walk = (node, where, input) => {
    if (Array.isArray(node)) return node.forEach((item, i) => walk(item, `${where}[${i}]`, input));
    if (!isObject(node)) return;
    if (node.properties && !input && node.additionalProperties !== false) {
      out.push(
        v(
          'closed-outputs',
          where,
          'an Alore-owned output object needs additionalProperties: false',
        ),
      );
    }
    Object.entries(node).forEach(([key, value]) => walk(value, `${where}.${key}`, input));
  };
  for (const [name, schema] of Object.entries(schemas))
    walk(schema, name, schema['x-alore-input'] === true);
  return out;
}

/** Errors are problem+json with a type from the closed list. */
export function checkProblemSchema(schemas) {
  const problem = schemas['problem.schema.json'];
  if (!problem) return [v('problem-type', 'problem.schema.json', 'the problem schema is missing')];
  return same(problem.properties?.type?.enum, PROBLEM_TYPES)
    ? []
    : [
        v(
          'problem-type',
          'problem.schema.json',
          `type must enumerate exactly: ${PROBLEM_TYPES.join(', ')}`,
        ),
      ];
}

export function checkProblemResponses(pinned, merged) {
  const out = [];
  for (const { path, method, op } of operations(merged)) {
    if (pinned.paths[path]?.[method]) continue;
    for (const [code, response] of Object.entries(op.responses ?? {})) {
      if (/^[23]/.test(code)) continue;
      const ok =
        response?.$ref === PROBLEM_RESPONSE_REF ||
        response?.content?.['application/problem+json'] !== undefined;
      if (!ok)
        out.push(
          v(
            'problem-json',
            `${method.toUpperCase()} ${path} ${code}`,
            'errors must be application/problem+json',
          ),
        );
    }
  }
  return out;
}

/** Every served route is in the document with the status its class implies. */
export function checkServedRoutes(merged, served, planned) {
  const out = [];
  const index = new Map();
  for (const { path, method, op } of operations(merged))
    index.set(`${method} ${canonPath(path)}`, op);
  for (const route of served) {
    const rel = route.path.replace(/^\/ai\/v1/, '');
    const op = index.get(`${route.method.toLowerCase()} ${canonPath(rel)}`);
    const where = `${route.method} ${route.path}`;
    if (!op) {
      out.push(v('served-routes', where, 'served route is missing from openapi.yaml'));
    } else if (op['x-status'] !== CLASS_STATUS[route.class]) {
      out.push(
        v(
          'served-routes',
          where,
          `class ${route.class} requires x-status ${CLASS_STATUS[route.class]}, found ${op['x-status']}`,
        ),
      );
    }
  }
  for (const route of planned) {
    const rel = route.path.replace(/^\/ai\/v1/, '');
    const op = index.get(`${route.method.toLowerCase()} ${canonPath(rel)}`);
    if (!op || op['x-status'] !== 'planned') {
      out.push(
        v(
          'served-routes',
          `${route.method} ${route.path}`,
          'planned route must be present with x-status planned',
        ),
      );
    }
  }
  return out;
}

const ENTRY = /^\s*[-*]\s+(?:[0-9a-f]{7,40}:\s+)?(additive|deprecating|breaking)\b/i;
const CHANGESET_ENTRY = /^(additive|deprecating|breaking):/i;
export const PACKAGE_NAME = '@alore/platform-contract';

/** A changeset with a classified summary and the corresponding package bump. */
export function classifiedChangeset(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!match) return false;
  const kind = CHANGESET_ENTRY.exec(match[2].trim())?.[1].toLowerCase();
  if (!kind) return false;
  try {
    const releases = parse(match[1]);
    return (
      isObject(releases) && releases[PACKAGE_NAME] === (kind === 'breaking' ? 'major' : 'minor')
    );
  } catch {
    return false;
  }
}

const SURFACE = (tree) => ({
  ...Object.fromEntries(
    Object.entries(tree.schemas ?? {}).map(([k, val]) => [`schemas/${k}`, val]),
  ),
  overlay: tree.overlay,
  asyncapi: tree.asyncapi,
  served: tree.served,
  planned: tree.planned,
  pin: tree.pin,
});

/**
 * A change to the contract surface needs a classified entry that is new against the base: either a
 * new `.changeset/*.md` for this package whose summary starts `additive:`, `deprecating:` or
 * `breaking:`, or a new classified line in CHANGELOG.md (what `changeset version` writes).
 * Pending changesets must match the classified bump and be unused in the current prerelease.
 * `prev` is null for the first release of the package.
 */
export function checkChangelog(prev, next) {
  const before = prev ? SURFACE(prev) : {};
  const after = SURFACE(next);
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => before[key] !== after[key])
    .sort();
  if (changed.length === 0) return [];
  const seen = new Set((prev?.changelog ?? '').split('\n'));
  const added = (next.changelog ?? '')
    .split('\n')
    .filter((line) => !seen.has(line) && ENTRY.test(line));
  if (added.length > 0) return [];
  const known = prev?.changesets ?? {};
  const consumed = new Set(next.consumedChangesetIds);
  const fresh = Object.entries(next.changesets ?? {}).some(
    ([name, text]) =>
      known[name] !== text &&
      !consumed.has(name.slice(0, -'.md'.length)) &&
      classifiedChangeset(text),
  );
  if (fresh) return [];
  return [
    v(
      'changelog',
      '.changeset',
      `contract surface changed (${changed.join(', ')}) without a new, unconsumed changeset for ${PACKAGE_NAME} classified as additive: or deprecating: (minor), or breaking: (major)`,
    ),
  ];
}
