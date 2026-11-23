import { clone } from './io.mjs';

export const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
export const BASE = '/ai/v1';
export const SERVER_DESCRIPTION = 'Alore AI API. Paths in this document are relative to this base.';

/** Path with parameter names erased, so `/x/{id}` equals `/x/{response_id}`. */
export const canonPath = (path) => path.replace(/\{[^}]+\}/g, '{}');

export const relativePath = (path) => {
  if (!path.startsWith(`${BASE}/`)) throw new Error(`route outside ${BASE}: ${path}`);
  return path.slice(BASE.length);
};

function stripKey(node, key) {
  if (Array.isArray(node)) {
    node.forEach((item) => stripKey(item, key));
  } else if (node && typeof node === 'object') {
    delete node[key];
    Object.values(node).forEach((value) => stripKey(value, key));
  }
}

function collectRefs(node, found) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectRefs(item, found));
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string' && value.startsWith('#/components/')) {
        found.add(value);
      } else {
        collectRefs(value, found);
      }
    }
  }
}

/** Index of upstream operations by canonical path and method. */
export function indexUpstream(upstream) {
  const index = new Map();
  for (const key of Object.keys(upstream.paths)) index.set(canonPath(key), key);
  return index;
}

/**
 * Cut the upstream spec to the given routes.
 * Pure and deterministic: same upstream and routes give the same document.
 * Differences from upstream, all documented in the README:
 *  - `servers` is the Alore base path;
 *  - `x-oaiMeta` documentation metadata is dropped;
 *  - only reachable components, used tags and the listed operations remain.
 */
export function cutUpstream(upstream, routes, pin) {
  const index = indexUpstream(upstream);
  const paths = {};
  const missing = [];
  for (const route of routes) {
    const rel = relativePath(route.path);
    const upstreamKey = index.get(canonPath(rel));
    const method = route.method.toLowerCase();
    const item = upstreamKey ? upstream.paths[upstreamKey] : undefined;
    if (!item || !item[method]) {
      missing.push(`${route.method} ${route.path}`);
      continue;
    }
    if (!paths[upstreamKey]) {
      paths[upstreamKey] = {};
      for (const [k, v] of Object.entries(item)) {
        if (!METHODS.includes(k)) paths[upstreamKey][k] = clone(v);
      }
    }
    paths[upstreamKey][method] = clone(item[method]);
  }

  // Components reachable from the kept operations, followed transitively.
  const refs = new Set();
  const work = [];
  const enqueue = (node) => {
    const found = new Set();
    collectRefs(node, found);
    found.forEach((ref) => {
      if (!refs.has(ref)) {
        refs.add(ref);
        work.push(ref);
      }
    });
  };
  enqueue(paths);
  while (work.length) {
    const [, , kind, name] = work.pop().split('/');
    const target = upstream.components?.[kind]?.[name];
    if (target === undefined)
      throw new Error(`unresolved upstream reference #/components/${kind}/${name}`);
    enqueue(target);
  }
  const components = {};
  for (const [kind, entries] of Object.entries(upstream.components ?? {})) {
    if (kind === 'securitySchemes') {
      components[kind] = clone(entries);
      continue;
    }
    for (const [name, value] of Object.entries(entries)) {
      if (refs.has(`#/components/${kind}/${name}`)) {
        (components[kind] ??= {})[name] = clone(value);
      }
    }
  }

  const usedTags = new Set();
  for (const item of Object.values(paths)) {
    for (const method of METHODS) (item[method]?.tags ?? []).forEach((t) => usedTags.add(t));
  }

  const doc = {
    openapi: upstream.openapi,
    info: clone(upstream.info),
    servers: [{ url: BASE, description: SERVER_DESCRIPTION }],
    security: clone(upstream.security),
    tags: (upstream.tags ?? []).filter((t) => usedTags.has(t.name)).map(clone),
    paths,
    components,
  };
  if (pin) {
    doc['x-upstream'] = {
      repository: pin.repository,
      commit: pin.commit,
      spec_version: pin.spec_version,
      sha256: pin.sha256,
    };
  }
  stripKey(doc, 'x-oaiMeta');
  return { doc, missing };
}
