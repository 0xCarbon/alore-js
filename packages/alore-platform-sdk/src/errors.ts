import { APIError } from 'openai';

import { ALORE_PROBLEM_TYPES, type AloreProblem, type AloreProblemType } from './types.js';

export type HeaderBag = Headers | Record<string, string | string[] | null | undefined> | undefined;

const PROBLEM_TYPE_SET = new Set<string>(ALORE_PROBLEM_TYPES);
const ALLOWED_PROBLEM_KEYS = new Set(['type', 'title', 'status', 'detail', 'instance', 'error']);
const ALLOWED_ERROR_KEYS = new Set(['type', 'message', 'code', 'param']);

export function getHeaderValue(headers: HeaderBag, name: string): string | undefined {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  if (typeof (headers as Headers).get === 'function') {
    const value = (headers as Headers).get(target);
    return value === null ? undefined : value;
  }
  const record = headers as Record<string, string | string[] | null | undefined>;
  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() === target) {
      if (Array.isArray(value)) return value.join(', ');
      return value ?? undefined;
    }
  }
  return undefined;
}

export function parseRetryAfterMs(retryAfter: string | undefined): number | undefined {
  if (!retryAfter) return undefined;
  const trimmed = retryAfter.trim();
  if (trimmed.length === 0) return undefined;
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds) ? Math.max(0, Math.round(seconds * 1000)) : undefined;
  }
  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return undefined;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Runtime type guard matching `@alore/platform-contract/schemas/problem.schema.json`
 * (`additionalProperties: false` on both outer problem and inner OpenAI `error` object).
 */
export function isAloreProblem(value: unknown): value is AloreProblem {
  if (!isPlainRecord(value)) return false;
  for (const key of Object.keys(value)) {
    if (!ALLOWED_PROBLEM_KEYS.has(key)) return false;
  }
  if (typeof value.type !== 'string' || !PROBLEM_TYPE_SET.has(value.type)) return false;
  if (typeof value.title !== 'string' || value.title.length === 0) return false;
  if (
    typeof value.status !== 'number' ||
    !Number.isInteger(value.status) ||
    value.status < 400 ||
    value.status > 599
  ) {
    return false;
  }
  if (value.detail !== undefined && typeof value.detail !== 'string') return false;
  if (value.instance !== undefined && typeof value.instance !== 'string') return false;

  if (!isPlainRecord(value.error)) return false;
  for (const key of Object.keys(value.error)) {
    if (!ALLOWED_ERROR_KEYS.has(key)) return false;
  }
  if (typeof value.error.type !== 'string' || value.error.type.length === 0) return false;
  if (typeof value.error.message !== 'string') return false;
  if (value.error.code !== null && typeof value.error.code !== 'string') return false;
  if (
    value.error.param !== undefined &&
    value.error.param !== null &&
    typeof value.error.param !== 'string'
  ) {
    return false;
  }
  return true;
}

/**
 * Base typed error for RFC 9457 `application/problem+json` responses returned by Alore.
 * Extends `OpenAI.APIError` so callers catching either `AloreProblemError` or `OpenAI.APIError`
 * handle errors consistently.
 */
export class AloreProblemError extends APIError {
  readonly problemType: AloreProblemType;

  readonly title: string;

  readonly detail: string | undefined;

  readonly instance: string | undefined;

  readonly problem: AloreProblem;

  readonly retryAfter: string | undefined;

  readonly retryAfterMs: number | undefined;

  readonly isExpired: boolean;

  constructor(problem: AloreProblem, headers?: HeaderBag) {
    super(
      problem.status,
      problem.error,
      problem.detail ?? problem.error.message ?? problem.title,
      headers as never,
    );
    this.name = 'AloreProblemError';
    this.problemType = problem.type;
    this.title = problem.title;
    this.detail = problem.detail;
    this.instance = problem.instance;
    this.problem = problem;
    this.retryAfter = getHeaderValue(headers, 'retry-after');
    this.retryAfterMs = parseRetryAfterMs(this.retryAfter);
    this.isExpired = problem.type === 'not_found' && problem.error.code === 'expired';
  }
}

export class AloreNotFoundError extends AloreProblemError {
  constructor(problem: AloreProblem, headers?: HeaderBag) {
    super(problem, headers);
    this.name = 'AloreNotFoundError';
  }
}

export class AloreInvalidRequestError extends AloreProblemError {
  constructor(problem: AloreProblem, headers?: HeaderBag) {
    super(problem, headers);
    this.name = 'AloreInvalidRequestError';
  }
}

export class AloreRateLimitError extends AloreProblemError {
  constructor(problem: AloreProblem, headers?: HeaderBag) {
    super(problem, headers);
    this.name = 'AloreRateLimitError';
  }
}

export class AloreUnavailableError extends AloreProblemError {
  constructor(problem: AloreProblem, headers?: HeaderBag) {
    super(problem, headers);
    this.name = 'AloreUnavailableError';
  }
}

export class AloreConflictError extends AloreProblemError {
  constructor(problem: AloreProblem, headers?: HeaderBag) {
    super(problem, headers);
    this.name = 'AloreConflictError';
  }
}

export class AlorePayloadTooLargeError extends AloreProblemError {
  constructor(problem: AloreProblem, headers?: HeaderBag) {
    super(problem, headers);
    this.name = 'AlorePayloadTooLargeError';
  }
}

export class AloreUnsupportedMediaTypeError extends AloreProblemError {
  constructor(problem: AloreProblem, headers?: HeaderBag) {
    super(problem, headers);
    this.name = 'AloreUnsupportedMediaTypeError';
  }
}

export class AloreContractVersionError extends AloreProblemError {
  readonly servedContract: string | undefined;

  readonly minContract: string | undefined;

  constructor(
    problem: AloreProblem,
    headers?: HeaderBag,
    versions?: { servedContract?: string; minContract?: string },
  ) {
    super(problem, headers);
    this.name = 'AloreContractVersionError';
    this.servedContract = versions?.servedContract;
    this.minContract = versions?.minContract;
  }
}

export class AloreNotImplementedError extends AloreProblemError {
  constructor(problem: AloreProblem, headers?: HeaderBag) {
    super(problem, headers);
    this.name = 'AloreNotImplementedError';
  }
}

/** Map a validated RFC 9457 `AloreProblem` payload to its exact typed error subclass. */
export function problemToError(problem: AloreProblem, headers?: HeaderBag): AloreProblemError {
  switch (problem.type) {
    case 'not_found':
      return new AloreNotFoundError(problem, headers);
    case 'invalid_request':
      return new AloreInvalidRequestError(problem, headers);
    case 'rate_limited':
      return new AloreRateLimitError(problem, headers);
    case 'unavailable':
      return new AloreUnavailableError(problem, headers);
    case 'conflict':
      return new AloreConflictError(problem, headers);
    case 'payload_too_large':
      return new AlorePayloadTooLargeError(problem, headers);
    case 'unsupported_media_type':
      return new AloreUnsupportedMediaTypeError(problem, headers);
    case 'contract_version':
      return new AloreContractVersionError(problem, headers);
    case 'not_implemented':
      return new AloreNotImplementedError(problem, headers);
    default: {
      const exhaustive: never = problem.type;
      return new AloreProblemError({ ...problem, type: exhaustive }, headers);
    }
  }
}

export type WebhookVerificationFailureReason =
  | 'missing_header'
  | 'invalid_secret'
  | 'invalid_timestamp'
  | 'timestamp_outside_tolerance'
  | 'invalid_signature'
  | 'invalid_payload';

export class AloreWebhookVerificationError extends Error {
  readonly reason: WebhookVerificationFailureReason;

  constructor(reason: WebhookVerificationFailureReason, message: string) {
    super(message);
    this.name = 'AloreWebhookVerificationError';
    this.reason = reason;
  }
}
