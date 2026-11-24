import { createHmac } from 'node:crypto';

/** Deterministic default: a fixed secret that anyone can read. It protects nothing. */
export const DEFAULT_WEBHOOK_SECRET = `whsec_${Buffer.from('alore-fake-webhook-secret').toString('base64')}`;

/** Standard Webhooks headers for one message: signature over `${id}.${timestamp}.${body}`. */
export function signWebhook({ id, timestamp, body, secret }) {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
  return {
    'content-type': 'application/json',
    'webhook-id': id,
    'webhook-timestamp': String(timestamp),
    'webhook-signature': `v1,${signature}`,
  };
}

/** POST one signed event. A failing receiver is a result, not an exception. */
export async function postWebhook({ url, event, secret, timestamp, timeoutMs = 5000 }) {
  const body = JSON.stringify(event);
  const headers = signWebhook({ id: event.id, timestamp, body, secret });
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    await res.arrayBuffer();
    return { status: res.status };
  } catch (error) {
    return { status: null, error: error instanceof Error ? error.message : String(error) };
  }
}
