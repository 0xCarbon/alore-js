import { clone } from './io.mjs';

/**
 * Minimal OpenAPI Overlay 1.0 engine over a deliberately small JSONPath subset:
 * `$`, `.name`, `['name']`, `[*]` and `.*`. The lint rejects overlays that use
 * anything else, and rejects `remove` actions, because the overlay only adds.
 */
export function parseTarget(target) {
  if (typeof target !== 'string' || !target.startsWith('$')) {
    throw new Error(`overlay target must start with $: ${target}`);
  }
  const segments = [];
  let i = 1;
  while (i < target.length) {
    if (target[i] === '.') {
      if (target[i + 1] === '*') {
        segments.push({ wildcard: true });
        i += 2;
      } else {
        const m = /^[A-Za-z0-9_$-]+/.exec(target.slice(i + 1));
        if (!m) throw new Error(`unsupported overlay target: ${target}`);
        segments.push({ key: m[0] });
        i += 1 + m[0].length;
      }
    } else if (target.startsWith("['", i)) {
      const end = target.indexOf("']", i);
      if (end < 0) throw new Error(`unterminated segment in overlay target: ${target}`);
      segments.push({ key: target.slice(i + 2, end) });
      i = end + 2;
    } else if (target.startsWith('[*]', i)) {
      segments.push({ wildcard: true });
      i += 3;
    } else {
      throw new Error(`unsupported overlay target: ${target}`);
    }
  }
  return segments;
}

function select(doc, segments) {
  let nodes = [{ parent: null, key: null, node: doc }];
  for (const seg of segments) {
    const next = [];
    for (const { node } of nodes) {
      if (node === null || typeof node !== 'object') continue;
      if (seg.wildcard) {
        for (const key of Object.keys(node)) next.push({ parent: node, key, node: node[key] });
      } else if (Object.prototype.hasOwnProperty.call(node, seg.key)) {
        next.push({ parent: node, key: seg.key, node: node[seg.key] });
      }
    }
    nodes = next;
  }
  return nodes;
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Overlay 1.0 merge: objects merge recursively, arrays append, scalars replace. */
export function merge(target, update) {
  if (Array.isArray(target)) {
    if (Array.isArray(update)) target.push(...clone(update));
    else target.push(clone(update));
    return target;
  }
  if (isObject(target) && isObject(update)) {
    for (const [key, value] of Object.entries(update)) {
      if (!(key in target)) target[key] = clone(value);
      else if (isObject(target[key]) && isObject(value)) merge(target[key], value);
      else if (Array.isArray(target[key]) && Array.isArray(value))
        target[key].push(...clone(value));
      else target[key] = clone(value);
    }
    return target;
  }
  throw new Error('overlay update does not fit its target');
}

export function applyOverlay(base, overlay) {
  if (overlay.overlay !== '1.0.0') throw new Error('overlay must declare overlay: 1.0.0');
  const doc = clone(base);
  overlay.actions.forEach((action, n) => {
    const hits = select(doc, parseTarget(action.target));
    if (hits.length === 0) {
      throw new Error(`overlay action ${n} (${action.target}) matched nothing`);
    }
    for (const hit of hits) {
      if (action.remove === true) {
        if (Array.isArray(hit.parent)) hit.parent.splice(Number(hit.key), 1);
        else if (hit.parent) delete hit.parent[hit.key];
      }
      if (action.update !== undefined) merge(hit.node, action.update);
    }
  });
  return doc;
}
