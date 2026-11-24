import OpenAI, { type APIError } from 'openai';

import { type HeaderBag, isAloreProblem, problemToError } from './errors.js';
import { assertIdempotencyKey, hasHeader, mergeHeaders } from './idempotency.js';
import { assertCompatibleContract, isValidSemver } from './semver.js';
import {
  ALORE_FILE_STATUSES,
  type AloreClient,
  type AloreClientConfig,
  type AloreFileExtension,
  type AloreFileObject,
  type AloreFileStatusValue,
  type AloreMeta,
  type AloreMetaOptions,
  type AloreRequestOptions,
  type AloreWriteOptions,
  buildTenancyHeaders,
  type ConversationForkRequest,
  type Decision,
  type DecisionRequest,
  type DecisionTasksResponse,
  type FileFromUrlRequest,
  type FileRegisterRequest,
  type ForkedConversation,
  type Job,
  type JobRequest,
  type JobType,
  type OcrRequest,
  type OcrResponse,
  type ReadOnlyResponseRequest,
  type SearchRequest,
  type SearchResponse,
  type TenancyContext,
} from './types.js';

const IDEMPOTENT_METHODS = new Set(['get', 'head', 'options', 'put', 'delete']);
const FILE_STATUS_SET = new Set<string>(ALORE_FILE_STATUSES);

/** Per-process cache for `meta()` compatibility checks, keyed by normalized baseURL + minContract. */
const metaCache = new Map<string, AloreMeta>();

/** Clear the per-process `meta()` compatibility cache (useful in tests). */
export function resetMetaCache(): void {
  metaCache.clear();
}

/** Check whether a negotiated feature name is enabled in an `AloreMeta` response. */
export function hasFeature(meta: AloreMeta, feature: string): boolean {
  return meta.features.includes(feature);
}

function normalizeBaseURL(raw: string): string {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new TypeError('AloreClientConfig.baseURL must be a non-empty URL string');
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new TypeError(`Invalid AloreClientConfig.baseURL: ${raw}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TypeError(`AloreClientConfig.baseURL must use http or https: ${raw}`);
  }
  let end = raw.length;
  while (end > 0 && raw.charCodeAt(end - 1) === 47) {
    end -= 1;
  }
  return raw.slice(0, end);
}

function validateConfig(cfg: AloreClientConfig): {
  baseURL: string;
  apiKey: string;
  minContract: string;
  authMode: 'bearer' | 'api-key';
} {
  if (!cfg || typeof cfg !== 'object') {
    throw new TypeError('AloreClientConfig is required');
  }
  const baseURL = normalizeBaseURL(cfg.baseURL);
  if (typeof cfg.apiKey !== 'string' || cfg.apiKey.trim().length === 0) {
    throw new TypeError('AloreClientConfig.apiKey must be a non-empty string');
  }
  if (typeof cfg.minContract !== 'string' || !isValidSemver(cfg.minContract)) {
    throw new TypeError(`Invalid AloreClientConfig.minContract semver: ${String(cfg.minContract)}`);
  }
  const authMode = cfg.authMode ?? 'bearer';
  if (authMode !== 'bearer' && authMode !== 'api-key') {
    throw new TypeError(`Invalid AloreClientConfig.authMode: ${String(authMode)}`);
  }
  return { baseURL, apiKey: cfg.apiKey, minContract: cfg.minContract, authMode };
}

function mapLegacyOpenAIFileStatus(status: string | undefined): AloreFileStatusValue {
  if (status === 'processed') return 'ready';
  if (status === 'error') return 'failed';
  return 'received';
}

function assertAloreMeta(value: unknown): asserts value is AloreMeta {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Invalid GET /meta response: expected JSON object');
  }
  const record = value as Record<string, unknown>;
  if (typeof record.contract !== 'string' || !isValidSemver(record.contract)) {
    throw new TypeError(`Invalid GET /meta contract semver: ${String(record.contract)}`);
  }
  if (
    !Array.isArray(record.features) ||
    record.features.some((f) => typeof f !== 'string' || f.length === 0)
  ) {
    throw new TypeError('Invalid GET /meta features: expected array of non-empty strings');
  }
}

type OpenAIRequestOptions = Record<string, unknown> & {
  method?: string;
  headers?: Headers | Record<string, string | null | undefined>;
  idempotencyKey?: string;
  maxRetries?: number;
};

/**
 * Thin internal subclass of the official `OpenAI` client that adds ONLY:
 * 1. Optional `X-API-KEY` transition mode (`authMode: 'api-key'`, addressing alore-11 before INC-120).
 * 2. Strict retry gating: non-idempotent methods (`POST`/`PATCH`) retry ONLY when an `Idempotency-Key` is set.
 * 3. RFC 9457 `application/problem+json` mapping into typed `AloreProblemError` subclasses (which extend `APIError`).
 */
class AloreOpenAI extends OpenAI {
  private readonly aloreAuthMode: 'bearer' | 'api-key';

  private readonly aloreApiKey: string;

  constructor(
    options: ConstructorParameters<typeof OpenAI>[0] & {
      aloreAuthMode: 'bearer' | 'api-key';
      aloreApiKey: string;
    },
  ) {
    const { aloreAuthMode, aloreApiKey, ...openaiOpts } = options;
    super(openaiOpts);
    this.aloreAuthMode = aloreAuthMode;
    this.aloreApiKey = aloreApiKey;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected override authHeaders(opts: any): any {
    if (this.aloreAuthMode === 'api-key') {
      return { 'X-API-KEY': this.aloreApiKey };
    }
    return super.authHeaders(opts);
  }

  protected override makeStatusError(
    status: number | undefined,
    error: unknown,
    message: string | undefined,
    headers: HeaderBag,
  ): APIError {
    if (isAloreProblem(error)) {
      return problemToError(error, headers);
    }
    return super.makeStatusError(status, error as object | undefined, message, headers as never);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override request<RequestBody, ResponseBody>(options: any, remainingRetries?: number | null): any {
    const gated = Promise.resolve(options).then((opts: OpenAIRequestOptions) => {
      const method = String(opts?.method ?? 'get').toLowerCase();
      const explicitKey =
        typeof opts?.idempotencyKey === 'string' && opts.idempotencyKey.trim().length > 0
          ? opts.idempotencyKey
          : undefined;
      const hasKey = Boolean(explicitKey || hasHeader(opts?.headers, 'idempotency-key'));

      const next: OpenAIRequestOptions = { ...opts };
      if (explicitKey && !hasHeader(next.headers, 'idempotency-key')) {
        next.headers = mergeHeaders(next.headers, { 'Idempotency-Key': explicitKey });
      }
      if (!IDEMPOTENT_METHODS.has(method) && !hasKey) {
        next.maxRetries = 0;
      }
      return next;
    });
    return super.request<RequestBody, ResponseBody>(gated as never, remainingRetries);
  }
}

function toRequestOpts(opts?: AloreWriteOptions): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!opts) return out;
  if (opts.headers) out.headers = opts.headers;
  if (opts.signal) out.signal = opts.signal;
  if (opts.timeout !== undefined) out.timeout = opts.timeout;
  if (opts.maxRetries !== undefined) out.maxRetries = opts.maxRetries;
  if (opts.idempotencyKey !== undefined) {
    out.idempotencyKey = assertIdempotencyKey(opts.idempotencyKey);
  }
  return out;
}

/**
 * Construct a thin Alore platform client backed by the official `openai` SDK.
 * `TenancyContext` is required at compile time and validated at runtime.
 */
export function aloreClient(cfg: AloreClientConfig, tenancy: TenancyContext): AloreClient {
  const validated = validateConfig(cfg);
  const tenancyHeaders = buildTenancyHeaders(tenancy);
  const frozenTenancy: Readonly<TenancyContext> = Object.freeze({ ...tenancy });

  const defaultHeaders: Record<string, string | null | undefined> = {
    ...cfg.defaultHeaders,
    ...(validated.authMode === 'api-key'
      ? { Authorization: null, 'X-API-KEY': validated.apiKey }
      : {}),
    ...tenancyHeaders,
  };

  const openai = new AloreOpenAI({
    baseURL: validated.baseURL,
    apiKey: validated.apiKey,
    organization: null,
    project: null,
    timeout: cfg.timeout,
    maxRetries: cfg.maxRetries,
    defaultHeaders,
    fetch: cfg.fetch as never,
    dangerouslyAllowBrowser: cfg.dangerouslyAllowBrowser,
    aloreAuthMode: validated.authMode,
    aloreApiKey: validated.apiKey,
  });

  const metaCacheKey = `${validated.baseURL}\0${validated.minContract}`;

  return {
    openai,
    tenancy: frozenTenancy,

    files: {
      async retrieve(id: string, opts?: AloreRequestOptions): Promise<AloreFileObject> {
        return openai.get<unknown, AloreFileObject>(
          `/files/${encodeURIComponent(id)}`,
          toRequestOpts(opts),
        );
      },

      async status(id: string, opts?: AloreRequestOptions): Promise<AloreFileExtension> {
        const file = await openai.get<unknown, AloreFileObject>(
          `/files/${encodeURIComponent(id)}`,
          toRequestOpts(opts),
        );
        if (file.x_alore && FILE_STATUS_SET.has(file.x_alore.status)) {
          return { status: file.x_alore.status };
        }
        return { status: mapLegacyOpenAIFileStatus(file.status) };
      },

      async text(id: string, opts?: AloreRequestOptions): Promise<string> {
        const response = await openai
          .get<unknown, unknown>(`/files/${encodeURIComponent(id)}/text`, {
            ...toRequestOpts(opts),
            headers: mergeHeaders(opts?.headers, { Accept: 'text/plain, application/json' }),
          })
          .asResponse();
        const contentType = response.headers.get('content-type') ?? '';
        if (/json/i.test(contentType)) {
          const parsed = (await response.json()) as { text?: unknown };
          if (typeof parsed.text === 'string') return parsed.text;
        }
        return response.text();
      },

      async fromUrl(req: FileFromUrlRequest, opts?: AloreWriteOptions): Promise<AloreFileObject> {
        return openai.post<FileFromUrlRequest, AloreFileObject>('/files/from_url', {
          ...toRequestOpts(opts),
          body: req,
        });
      },

      async register(req: FileRegisterRequest, opts?: AloreWriteOptions): Promise<AloreFileObject> {
        const body = {
          storage_ref: req.storageRef,
          sha256: req.sha256,
          filename: req.filename,
          ...(req.purpose !== undefined ? { purpose: req.purpose } : {}),
        };
        return openai.post<typeof body, AloreFileObject>('/files/register', {
          ...toRequestOpts(opts),
          body,
        });
      },

      async reprocess(id: string, opts?: AloreWriteOptions): Promise<AloreFileObject> {
        return openai.post<undefined, AloreFileObject>(
          `/files/${encodeURIComponent(id)}/reprocess`,
          toRequestOpts(opts),
        );
      },
    },

    async search(req: SearchRequest, opts?: AloreRequestOptions): Promise<SearchResponse> {
      return openai.post<SearchRequest, SearchResponse>('/search', {
        ...toRequestOpts(opts),
        body: req,
      });
    },

    async ocr(req: OcrRequest, opts?: AloreWriteOptions): Promise<OcrResponse> {
      return openai.post<OcrRequest, OcrResponse>('/ocr', {
        ...toRequestOpts(opts),
        body: req,
      });
    },

    conversations: {
      sources: {
        async list(convId: string, opts?: AloreRequestOptions): Promise<string[]> {
          const res = await openai.get<
            unknown,
            { vector_store_ids?: string[]; data?: Array<{ id: string }> } | string[]
          >(`/conversations/${encodeURIComponent(convId)}/vector_stores`, toRequestOpts(opts));
          if (Array.isArray(res)) return res;
          if (Array.isArray(res.vector_store_ids)) return res.vector_store_ids;
          if (Array.isArray(res.data)) return res.data.map((entry) => entry.id);
          return [];
        },

        async attach(
          convId: string,
          vectorStoreId: string,
          opts?: AloreWriteOptions,
        ): Promise<void> {
          await openai.post<{ vector_store_id: string }, unknown>(
            `/conversations/${encodeURIComponent(convId)}/vector_stores`,
            {
              ...toRequestOpts(opts),
              body: { vector_store_id: vectorStoreId },
            },
          );
        },

        async detach(
          convId: string,
          vectorStoreId: string,
          opts?: AloreRequestOptions,
        ): Promise<void> {
          await openai.delete<unknown, unknown>(
            `/conversations/${encodeURIComponent(convId)}/vector_stores/${encodeURIComponent(vectorStoreId)}`,
            toRequestOpts(opts),
          );
        },
      },

      async fork(
        convId: string,
        forkOpts?: ConversationForkRequest,
        reqOpts?: AloreWriteOptions,
      ): Promise<ForkedConversation> {
        const opts = forkOpts ?? {};
        const body = {
          ...(opts.itemId !== undefined ? { item_id: opts.itemId } : {}),
          ...(opts.metadata !== undefined ? { metadata: opts.metadata } : {}),
          ...(opts.inheritSources !== undefined ? { inherit_sources: opts.inheritSources } : {}),
        };
        return openai.post<typeof body, ForkedConversation>(
          `/conversations/${encodeURIComponent(convId)}/fork`,
          {
            ...toRequestOpts(reqOpts),
            body,
          },
        );
      },

      async persist(
        convId: string,
        responseId: string,
        persistOpts?: { allowAdvanced?: boolean },
        reqOpts?: AloreWriteOptions,
      ): Promise<void> {
        const opts = persistOpts ?? {};
        const body = {
          x_alore: {
            from_response_id: responseId,
            ...(opts.allowAdvanced !== undefined ? { allow_advanced: opts.allowAdvanced } : {}),
          },
        };
        await openai.post<typeof body, unknown>(
          `/conversations/${encodeURIComponent(convId)}/items`,
          {
            ...toRequestOpts(reqOpts),
            body,
          },
        );
      },
    },

    responses: {
      async readOnly<T = Record<string, unknown>>(
        req: ReadOnlyResponseRequest,
        opts?: AloreWriteOptions,
      ): Promise<T> {
        const { baseItemId, x_alore: existingExt, store, ...rest } = req;
        const body = {
          ...rest,
          store: store ?? false,
          x_alore: {
            ...existingExt,
            history: 'read_only',
            ...(baseItemId !== undefined ? { base_item_id: baseItemId } : {}),
          },
        };
        return openai.post<typeof body, T>('/responses', {
          ...toRequestOpts(opts),
          body,
        });
      },
    },

    decisions: {
      async create<C extends string>(
        req: DecisionRequest<C>,
        opts?: AloreWriteOptions,
      ): Promise<Decision<C>> {
        return openai.post<DecisionRequest<C>, Decision<C>>('/decisions', {
          ...toRequestOpts(opts),
          body: req,
        });
      },

      async feedback(id: string, correctChoice: string, opts?: AloreWriteOptions): Promise<void> {
        await openai.post<{ correct_choice: string }, unknown>(
          `/decisions/${encodeURIComponent(id)}/feedback`,
          {
            ...toRequestOpts(opts),
            body: { correct_choice: correctChoice },
          },
        );
      },

      async tasks(opts?: AloreRequestOptions): Promise<DecisionTasksResponse> {
        return openai.get<unknown, DecisionTasksResponse>('/decisions/tasks', toRequestOpts(opts));
      },
    },

    jobs: {
      submit<T extends JobType = JobType>(
        req: JobRequest<T>,
        idempotencyKey: string,
        opts?: Omit<AloreWriteOptions, 'idempotencyKey'>,
      ): Promise<Job<T>> {
        const validKey = assertIdempotencyKey(idempotencyKey);
        return openai.post<JobRequest<T>, Job<T>>('/jobs', {
          ...toRequestOpts({ ...opts, idempotencyKey: validKey }),
          body: req,
        });
      },

      async get<T extends JobType = JobType>(
        id: string,
        opts?: AloreRequestOptions,
      ): Promise<Job<T>> {
        return openai.get<unknown, Job<T>>(`/jobs/${encodeURIComponent(id)}`, toRequestOpts(opts));
      },

      async cancel(id: string, opts?: AloreRequestOptions): Promise<void> {
        await openai.delete<unknown, unknown>(
          `/jobs/${encodeURIComponent(id)}`,
          toRequestOpts(opts),
        );
      },
    },

    async meta(opts?: AloreMetaOptions): Promise<AloreMeta> {
      if (!opts?.refresh) {
        const cached = metaCache.get(metaCacheKey);
        if (cached) {
          return { contract: cached.contract, features: [...cached.features] };
        }
      }
      const res = await openai.get<unknown, unknown>('/meta', toRequestOpts(opts));
      assertAloreMeta(res);
      assertCompatibleContract(res.contract, validated.minContract);
      const snapshot: AloreMeta = { contract: res.contract, features: [...res.features] };
      metaCache.set(metaCacheKey, snapshot);
      return { contract: snapshot.contract, features: [...snapshot.features] };
    },
  };
}
