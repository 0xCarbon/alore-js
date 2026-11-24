import { createHash, randomUUID } from 'node:crypto';

/** Generate a fresh cryptographically random idempotency key. */
export function generateIdempotencyKey(prefix?: string): string {
  const id = randomUUID();
  if (!prefix) return id;
  const trimmed = prefix.trim();
  if (trimmed.length === 0 || /[\s\r\n]/.test(trimmed)) {
    throw new TypeError('Idempotency key prefix must not be empty or contain whitespace');
  }
  return `${trimmed}_${id}`;
}

/**
 * Deterministically derive an idempotency key from a domain operation namespace and receipt parts
 * (for example `deriveIdempotencyKey('jobs.submit', [orgId, receiptId])`).
 */
export function deriveIdempotencyKey(
  namespace: string,
  parts: readonly (string | number | boolean | null | undefined)[],
): string {
  const trimmed = namespace.trim();
  if (trimmed.length === 0 || /[\s\r\n]/.test(trimmed)) {
    throw new TypeError('Idempotency key namespace must not be empty or contain whitespace');
  }
  // Preserve both the primitive type and the boundary of every receipt part.
  const tuple = parts.map((part) => {
    const value = Object.is(part, -0) ? '-0' : String(part);
    return [typeof part, value];
  });
  const digest = createHash('sha256')
    .update(JSON.stringify([trimmed, tuple]))
    .digest('hex');
  return `${trimmed}:${digest}`;
}

export function assertIdempotencyKey(key: string): string {
  if (typeof key !== 'string' || key.trim().length === 0 || /[\r\n]/.test(key)) {
    throw new TypeError('idempotencyKey must be a non-empty single-line string');
  }
  return key;
}

export function hasHeader(
  headers: Headers | Record<string, string | null | undefined> | undefined,
  name: string,
): boolean {
  if (!headers) return false;
  const target = name.toLowerCase();
  if (typeof (headers as Headers).get === 'function') {
    const value = (headers as Headers).get(target);
    return typeof value === 'string' && value.trim().length > 0;
  }
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === target) {
      return typeof v === 'string' && v.trim().length > 0;
    }
  }
  return false;
}

export function mergeHeaders(
  existing: Headers | Record<string, string | null | undefined> | undefined,
  additions: Record<string, string | null | undefined>,
): Record<string, string | null | undefined> {
  const out: Record<string, string | null | undefined> = {};
  if (existing) {
    if (typeof (existing as Headers).forEach === 'function') {
      (existing as Headers).forEach((value, key) => {
        out[key] = value;
      });
    } else {
      Object.assign(out, existing);
    }
  }
  Object.assign(out, additions);
  return out;
}
