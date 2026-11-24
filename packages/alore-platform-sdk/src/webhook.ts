import { createHmac, timingSafeEqual } from 'node:crypto';

import { AloreWebhookVerificationError, getHeaderValue, type HeaderBag } from './errors.js';
import { ALORE_EVENT_TYPES, type AloreEvent } from './types.js';

export interface VerifyWebhookOptions {
  /** Allowed clock skew / replay window in seconds (default: 300 = 5 minutes). */
  toleranceSeconds?: number;
  /** Override current time in Unix seconds (intended for deterministic tests). */
  nowSeconds?: number;
}

const DEFAULT_TOLERANCE_SECONDS = 300;
const EVENT_TYPE_SET = new Set<string>(ALORE_EVENT_TYPES);
const ALLOWED_EVENT_KEYS = new Set([
  'id',
  'type',
  'time',
  'client',
  'org_ref',
  'subject',
  'seq',
  'data',
]);
const ALLOWED_SUBJECT_KEYS = new Set(['kind', 'id']);
const STRICT_BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

function decodeSecret(secret: string): Buffer {
  if (typeof secret !== 'string' || secret.trim().length === 0) {
    throw new AloreWebhookVerificationError('invalid_secret', 'Webhook secret must be non-empty.');
  }
  const encoded = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  if (encoded.length === 0 || encoded.length % 4 !== 0 || !STRICT_BASE64_RE.test(encoded)) {
    throw new AloreWebhookVerificationError(
      'invalid_secret',
      'Webhook secret must be valid base64 (optionally prefixed with whsec_).',
    );
  }
  const key = Buffer.from(encoded, 'base64');
  if (key.length === 0) {
    throw new AloreWebhookVerificationError(
      'invalid_secret',
      'Webhook secret decoded to zero bytes.',
    );
  }
  return key;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertAloreEvent(value: unknown): asserts value is AloreEvent {
  if (!isPlainObject(value)) {
    throw new AloreWebhookVerificationError(
      'invalid_payload',
      'Webhook payload must be a JSON object.',
    );
  }
  for (const key of Object.keys(value)) {
    if (!ALLOWED_EVENT_KEYS.has(key)) {
      throw new AloreWebhookVerificationError(
        'invalid_payload',
        `Unexpected field in alore.evt/1 envelope: ${key}.`,
      );
    }
  }
  if (typeof value.id !== 'string' || value.id.length === 0) {
    throw new AloreWebhookVerificationError(
      'invalid_payload',
      'Webhook envelope field "id" must be a non-empty string.',
    );
  }
  if (typeof value.type !== 'string' || !EVENT_TYPE_SET.has(value.type)) {
    throw new AloreWebhookVerificationError(
      'invalid_payload',
      `Unknown webhook event type: ${String(value.type)}.`,
    );
  }
  if (typeof value.time !== 'string' || Number.isNaN(Date.parse(value.time))) {
    throw new AloreWebhookVerificationError(
      'invalid_payload',
      'Webhook envelope field "time" must be an ISO 8601 date-time string.',
    );
  }
  if (typeof value.client !== 'string' || value.client.length === 0) {
    throw new AloreWebhookVerificationError(
      'invalid_payload',
      'Webhook envelope field "client" must be a non-empty string.',
    );
  }
  if (value.org_ref !== null && typeof value.org_ref !== 'string') {
    throw new AloreWebhookVerificationError(
      'invalid_payload',
      'Webhook envelope field "org_ref" must be a string or null.',
    );
  }
  if (!isPlainObject(value.subject)) {
    throw new AloreWebhookVerificationError(
      'invalid_payload',
      'Webhook envelope field "subject" must be an object.',
    );
  }
  for (const key of Object.keys(value.subject)) {
    if (!ALLOWED_SUBJECT_KEYS.has(key)) {
      throw new AloreWebhookVerificationError(
        'invalid_payload',
        `Unexpected field in webhook subject: ${key}.`,
      );
    }
  }
  if (
    typeof value.subject.kind !== 'string' ||
    value.subject.kind.length === 0 ||
    typeof value.subject.id !== 'string' ||
    value.subject.id.length === 0
  ) {
    throw new AloreWebhookVerificationError(
      'invalid_payload',
      'Webhook envelope "subject" must contain non-empty "kind" and "id" strings.',
    );
  }
  if (typeof value.seq !== 'number' || !Number.isInteger(value.seq) || value.seq < 0) {
    throw new AloreWebhookVerificationError(
      'invalid_payload',
      'Webhook envelope field "seq" must be a non-negative integer.',
    );
  }
  if (!isPlainObject(value.data)) {
    throw new AloreWebhookVerificationError(
      'invalid_payload',
      'Webhook envelope field "data" must be a JSON object.',
    );
  }
}

/**
 * Verify a Standard Webhooks delivery (`webhook-id`, `webhook-timestamp`, `webhook-signature`)
 * and parse the closed `alore.evt/1` event envelope.
 *
 * Accepts a single secret or an array of secrets to support zero-downtime key rotation.
 */
export function verifyWebhook(
  rawBody: string | Uint8Array,
  headers: HeaderBag,
  secret: string | readonly string[],
  options: VerifyWebhookOptions = {},
): AloreEvent {
  const secretList = Array.isArray(secret) ? secret : [secret];
  if (secretList.length === 0) {
    throw new AloreWebhookVerificationError('invalid_secret', 'At least one secret is required.');
  }
  const keys = secretList.map((s) => decodeSecret(s));

  const webhookId = getHeaderValue(headers, 'webhook-id')?.trim();
  const webhookTimestamp = getHeaderValue(headers, 'webhook-timestamp')?.trim();
  const webhookSignature = getHeaderValue(headers, 'webhook-signature')?.trim();

  if (!webhookId) {
    throw new AloreWebhookVerificationError('missing_header', 'Missing webhook-id header.');
  }
  if (!webhookTimestamp) {
    throw new AloreWebhookVerificationError('missing_header', 'Missing webhook-timestamp header.');
  }
  if (!webhookSignature) {
    throw new AloreWebhookVerificationError('missing_header', 'Missing webhook-signature header.');
  }

  if (!/^\d+$/.test(webhookTimestamp)) {
    throw new AloreWebhookVerificationError(
      'invalid_timestamp',
      'webhook-timestamp must be an integer Unix timestamp in seconds.',
    );
  }
  const timestamp = Number(webhookTimestamp);
  if (!Number.isSafeInteger(timestamp)) {
    throw new AloreWebhookVerificationError(
      'invalid_timestamp',
      'webhook-timestamp is out of safe integer range.',
    );
  }

  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > tolerance) {
    throw new AloreWebhookVerificationError(
      'timestamp_outside_tolerance',
      `webhook-timestamp ${timestamp} is outside tolerance (${tolerance}s) of ${nowSeconds}.`,
    );
  }

  const bodyText = typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody).toString('utf8');
  const signedPayload = `${webhookId}.${webhookTimestamp}.${bodyText}`;

  const candidateSignatures: Buffer[] = [];
  for (const token of webhookSignature.split(/\s+/)) {
    const comma = token.indexOf(',');
    if (comma > 0) {
      const version = token.slice(0, comma);
      const signatureBase64 = token.slice(comma + 1);
      if (
        version === 'v1' &&
        signatureBase64.length > 0 &&
        STRICT_BASE64_RE.test(signatureBase64)
      ) {
        candidateSignatures.push(Buffer.from(signatureBase64, 'base64'));
      }
    }
  }

  let matched = false;
  for (const key of keys) {
    const expected = createHmac('sha256', key).update(signedPayload).digest();
    for (const candidate of candidateSignatures) {
      if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) {
        matched = true;
      }
    }
  }

  if (!matched) {
    throw new AloreWebhookVerificationError(
      'invalid_signature',
      'No valid v1 webhook signature matched.',
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    throw new AloreWebhookVerificationError('invalid_payload', 'Webhook body is not valid JSON.');
  }
  assertAloreEvent(parsed);
  return parsed;
}
