import type OpenAI from 'openai';

export const DATA_CLASSES = ['customer', 'public', 'synthetic'] as const;
export type DataClass = (typeof DATA_CLASSES)[number];

export const DATA_SOURCES = [
  'customer-upload',
  'case-capture',
  'public-corpus',
  'synthetic-fixture',
  'user-feedback',
  'support',
] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

/**
 * Derive the C7 admission data class from a closed source type.
 * Only credential-less public corpora map to `public`; synthetic fixtures map to `synthetic`;
 * all customer, feedback and support inputs map conservatively to `customer`.
 */
export function deriveDataClass(source: DataSource): DataClass {
  switch (source) {
    case 'public-corpus':
      return 'public';
    case 'synthetic-fixture':
      return 'synthetic';
    case 'customer-upload':
    case 'case-capture':
    case 'user-feedback':
    case 'support':
      return 'customer';
    default: {
      const exhaustive: never = source;
      throw new TypeError(`Unsupported DataSource: ${String(exhaustive)}`);
    }
  }
}

export interface TenancyContext {
  /** Registered organization reference, or `null` for clients without org refs (such as crawlers). */
  orgRef: string | null;
  /** Acting user reference (sent via `X-USER-ID`), or `null` when system-initiated. */
  subjectRef: string | null;
  /** C7 admission data class (`customer` | `public` | `synthetic`). */
  dataClass: DataClass;
  /** Optional short-lived signed scope grant sent as `X-Alore-Grant`. */
  grant?: string;
}

export type AloreAuthMode = 'bearer' | 'api-key';

export interface AloreClientConfig {
  /** Alore API base URL (for example `https://api.bealore.com/ai/v1`). */
  baseURL: string;
  /** Static client key. */
  apiKey: string;
  /** Minimum contract semver the caller requires (checked against `GET /meta`). */
  minContract: string;
  /**
   * Authentication header mode:
   * - `'bearer'` (default): sends `Authorization: Bearer <apiKey>` (OpenAI-compatible; requires INC-120 on Alore).
   * - `'api-key'`: sends `X-API-KEY: <apiKey>` and omits `Authorization` (transition mode for legacy middleware).
   */
  authMode?: AloreAuthMode;
  timeout?: number;
  maxRetries?: number;
  defaultHeaders?: Record<string, string | null | undefined>;
  fetch?: typeof globalThis.fetch;
  dangerouslyAllowBrowser?: boolean;
}

export const ALORE_FILE_STATUSES = [
  'uploading',
  'received',
  'extracting',
  'text_ready',
  'indexing',
  'ready',
  'failed',
  'deleted',
] as const;
export type AloreFileStatusValue = (typeof ALORE_FILE_STATUSES)[number];

export interface AloreFileExtension {
  status: AloreFileStatusValue;
}

export type AloreFileObject = OpenAI.Files.FileObject & {
  x_alore?: AloreFileExtension;
};

export interface AloreMeta {
  contract: string;
  features: string[];
}

export const ALORE_PROBLEM_TYPES = [
  'not_found',
  'invalid_request',
  'rate_limited',
  'unavailable',
  'conflict',
  'payload_too_large',
  'unsupported_media_type',
  'contract_version',
  'not_implemented',
] as const;
export type AloreProblemType = (typeof ALORE_PROBLEM_TYPES)[number];

export interface AloreOpenAIErrorObject {
  type: string;
  message: string;
  code: string | null;
  param?: string | null;
}

export interface AloreProblem {
  type: AloreProblemType;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  error: AloreOpenAIErrorObject;
}

export const ALORE_EVENT_TYPES = [
  'file.received',
  'file.text_ready',
  'file.ready',
  'file.failed',
  'file.deleted',
  'vector_store.file_ready',
  'job.progress',
  'job.completed',
  'job.failed',
  'job.cancelled',
  'job.expired',
  'response.completed',
  'response.verified',
  'usage.recorded',
  'org.erased',
] as const;
export type AloreEventType = (typeof ALORE_EVENT_TYPES)[number];

export interface AloreEventSubject {
  kind: string;
  id: string;
}

export interface AloreEvent<TData extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: AloreEventType;
  time: string;
  client: string;
  org_ref: string | null;
  subject: AloreEventSubject;
  seq: number;
  data: TData;
}

export interface AloreRequestOptions {
  headers?: Record<string, string | null | undefined>;
  signal?: AbortSignal;
  timeout?: number;
  maxRetries?: number;
}

export interface AloreWriteOptions extends AloreRequestOptions {
  idempotencyKey?: string;
}

export interface AloreMetaOptions extends AloreRequestOptions {
  /** Force a fresh `GET /meta` call instead of returning the per-process cached result. */
  refresh?: boolean;
}

export interface FileFromUrlRequest {
  url: string;
  sha256: string;
  filename: string;
  purpose?: string;
}

export interface FileRegisterRequest {
  storageRef: string;
  sha256: string;
  filename: string;
  purpose?: string;
}

export interface SearchRequest {
  vector_store_ids: readonly string[];
  query: string;
  mode?: 'hybrid' | 'vector' | 'keyword';
  rerank?: boolean;
  facets?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  k?: number;
}

export interface SearchHit {
  file_id: string;
  vector_store_id?: string;
  chunk_id?: string;
  score: number;
  text: string;
  page?: number;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  hits: SearchHit[];
}

export interface OcrRequest {
  file_id: string;
  pages?: readonly number[];
  model?: string;
  options?: Record<string, unknown>;
}

export interface OcrPage {
  page: number;
  text: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface OcrResponse {
  file_id: string;
  pages: OcrPage[];
}

export type DecisionChoiceOption<C extends string = string> = C | { id: C; label: string };

export interface DecisionRequest<C extends string = string> {
  task: string;
  input: unknown;
  choices: readonly DecisionChoiceOption<C>[];
  metadata?: Record<string, unknown>;
}

export interface Decision<C extends string = string> {
  id: string;
  task: string;
  choice: C | null;
  confidence: number;
  reason_code: string | null;
  metadata?: Record<string, unknown>;
}

export interface DecisionTaskInfo {
  id: string;
  description?: string;
  version?: string;
}

export interface DecisionTasksResponse {
  tasks: DecisionTaskInfo[];
}

export type JobType = 'ocr' | 'extract' | 'asr' | 'tts' | 'embed' | 'llm';
export type JobClass = 'interactive' | 'normal' | 'batch';
export type JobStatus =
  | 'queued'
  | 'running'
  | 'cancel_requested'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface JobRequest<T extends JobType = JobType> {
  type: T;
  class: JobClass;
  model_alias?: string;
  not_after?: string;
  input_ref: Record<string, unknown>;
}

export interface Job<T extends JobType = JobType> {
  id: string;
  type: T;
  class: JobClass;
  model_alias?: string | null;
  status: JobStatus;
  attempts?: number;
  not_after?: string | null;
  result_ref?: Record<string, unknown> | null;
  error?: AloreProblem | null;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationForkRequest {
  itemId?: string;
  metadata?: Record<string, string>;
  inheritSources?: boolean;
}

export interface ForkedConversation {
  id: string;
  object?: string;
  metadata?: Record<string, string>;
  x_alore: {
    forked_from: {
      conversation_id: string;
      item_id: string;
    };
    vector_store_ids?: string[];
  };
}

export interface ReadOnlyResponseRequest {
  model: string;
  conversation: string;
  input?: unknown;
  baseItemId?: string;
  store?: boolean;
  instructions?: string;
  tools?: unknown[];
  text?: Record<string, unknown>;
  metadata?: Record<string, string>;
  x_alore?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AloreClient {
  /** Configured official `openai` SDK client for all standard OpenAI surfaces. */
  openai: OpenAI;
  /** Tenancy context bound to this client instance. */
  readonly tenancy: Readonly<TenancyContext>;
  files: {
    retrieve(id: string, opts?: AloreRequestOptions): Promise<AloreFileObject>;
    status(id: string, opts?: AloreRequestOptions): Promise<AloreFileExtension>;
    text(id: string, opts?: AloreRequestOptions): Promise<string>;
    fromUrl(req: FileFromUrlRequest, opts?: AloreWriteOptions): Promise<AloreFileObject>;
    register(req: FileRegisterRequest, opts?: AloreWriteOptions): Promise<AloreFileObject>;
    reprocess(id: string, opts?: AloreWriteOptions): Promise<AloreFileObject>;
  };
  search(req: SearchRequest, opts?: AloreRequestOptions): Promise<SearchResponse>;
  ocr(req: OcrRequest, opts?: AloreWriteOptions): Promise<OcrResponse>;
  conversations: {
    sources: {
      list(convId: string, opts?: AloreRequestOptions): Promise<string[]>;
      attach(convId: string, vectorStoreId: string, opts?: AloreWriteOptions): Promise<void>;
      detach(convId: string, vectorStoreId: string, opts?: AloreRequestOptions): Promise<void>;
    };
    fork(
      convId: string,
      opts?: ConversationForkRequest,
      reqOpts?: AloreWriteOptions,
    ): Promise<ForkedConversation>;
    persist(
      convId: string,
      responseId: string,
      opts?: { allowAdvanced?: boolean },
      reqOpts?: AloreWriteOptions,
    ): Promise<void>;
  };
  responses: {
    readOnly<T = Record<string, unknown>>(
      req: ReadOnlyResponseRequest,
      opts?: AloreWriteOptions,
    ): Promise<T>;
  };
  decisions: {
    create<C extends string>(
      req: DecisionRequest<C>,
      opts?: AloreWriteOptions,
    ): Promise<Decision<C>>;
    feedback(id: string, correctChoice: string, opts?: AloreWriteOptions): Promise<void>;
    tasks(opts?: AloreRequestOptions): Promise<DecisionTasksResponse>;
  };
  jobs: {
    submit<T extends JobType = JobType>(
      req: JobRequest<T>,
      idempotencyKey: string,
      opts?: Omit<AloreWriteOptions, 'idempotencyKey'>,
    ): Promise<Job<T>>;
    get<T extends JobType = JobType>(id: string, opts?: AloreRequestOptions): Promise<Job<T>>;
    cancel(id: string, opts?: AloreRequestOptions): Promise<void>;
  };
  meta(opts?: AloreMetaOptions): Promise<AloreMeta>;
}

const DATA_CLASS_SET = new Set<string>(DATA_CLASSES);

function assertNonEmptyHeaderValue(name: string, value: string): void {
  if (value.trim().length === 0 || /[\r\n]/.test(value)) {
    throw new TypeError(`Invalid TenancyContext.${name}: must be a non-empty single-line string`);
  }
}

/**
 * Validate a `TenancyContext` and build the corresponding Alore request headers.
 * `subjectRef` maps onto `X-USER-ID` (never a duplicate `X-Alore-Subject` header).
 */
export function buildTenancyHeaders(tenancy: TenancyContext): Record<string, string> {
  if (!tenancy || typeof tenancy !== 'object') {
    throw new TypeError('TenancyContext is required');
  }
  if (!DATA_CLASS_SET.has(tenancy.dataClass)) {
    throw new TypeError(
      `Invalid TenancyContext.dataClass: expected one of ${DATA_CLASSES.join(', ')}`,
    );
  }
  if (tenancy.orgRef !== null && typeof tenancy.orgRef !== 'string') {
    throw new TypeError('Invalid TenancyContext.orgRef: expected string or null');
  }
  if (tenancy.subjectRef !== null && typeof tenancy.subjectRef !== 'string') {
    throw new TypeError('Invalid TenancyContext.subjectRef: expected string or null');
  }
  if (tenancy.grant !== undefined && typeof tenancy.grant !== 'string') {
    throw new TypeError('Invalid TenancyContext.grant: expected string or undefined');
  }

  const headers: Record<string, string> = {
    'X-Alore-Data-Class': tenancy.dataClass,
  };

  if (tenancy.orgRef !== null) {
    assertNonEmptyHeaderValue('orgRef', tenancy.orgRef);
    headers['X-Alore-Org'] = tenancy.orgRef;
  }
  if (tenancy.subjectRef !== null) {
    assertNonEmptyHeaderValue('subjectRef', tenancy.subjectRef);
    headers['X-USER-ID'] = tenancy.subjectRef;
  }
  if (tenancy.grant !== undefined) {
    assertNonEmptyHeaderValue('grant', tenancy.grant);
    headers['X-Alore-Grant'] = tenancy.grant;
  }

  return headers;
}
