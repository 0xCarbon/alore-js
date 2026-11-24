// Helpers shared by the fake's test files: start a fake, call it, and receive its webhooks.
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { after } from 'node:test';

import { createFake } from '../fake/index.mjs';

const closers = [];
after(async () => {
  for (const close of closers) await close();
});

export async function started(options) {
  const fake = createFake(options);
  const server = await fake.listen();
  closers.push(() => fake.close());
  return { fake, ...server };
}

export const call = async (base, method, path, { headers, body, form } = {}) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  return {
    status: res.status,
    headers: res.headers,
    text,
    json: text && /json/.test(res.headers.get('content-type') ?? '') ? JSON.parse(text) : null,
  };
};

/** A receiver on loopback that records each webhook it gets, and answers after `delayMs`. */
export async function receiver(answer = 200, delayMs = 0) {
  const got = [];
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      got.push({ headers: req.headers, body: Buffer.concat(chunks).toString('utf8') });
      setTimeout(() => res.writeHead(answer).end(), delayMs);
    });
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  closers.push(() => new Promise((ok) => (server.closeAllConnections(), server.close(ok))));
  return { got, url: `http://127.0.0.1:${server.address().port}/hooks` };
}

/**
 * The check a Standard Webhooks verifier makes: the timestamp is within `toleranceSeconds` of now
 * (default 5 minutes) and one `v1,` signature matches HMAC-SHA256 over `id.timestamp.body`.
 * Returns null when the message is accepted, else the reason.
 */
export function verifyStandardWebhook({
  headers,
  body,
  secret,
  nowSeconds,
  toleranceSeconds = 300,
}) {
  const timestamp = Number(headers['webhook-timestamp']);
  if (!Number.isInteger(timestamp)) return 'invalid timestamp';
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return 'timestamp outside tolerance';
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key)
    .update(`${headers['webhook-id']}.${headers['webhook-timestamp']}.${body}`)
    .digest('base64');
  const given = String(headers['webhook-signature']).split(' ');
  return given.includes(`v1,${expected}`) ? null : 'no matching signature';
}
