// Fake Alore: a deterministic, network-free (loopback only) stand-in for the /ai/v1 API.
// Routes, response schemas, problem bodies and the webhook envelope all come from the contract
// package (see model.mjs). The fake adds behaviour only where the contract already has a body.
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';

import { ContractViolationError, loadFakeContract } from './model.mjs';
import { multipartRequestObject, parseMultipart } from './multipart.mjs';
import { DEFAULT_WEBHOOK_SECRET, postWebhook } from './webhooks.mjs';

export const API_PREFIX = '/ai/v1';
export const CONTROL_PREFIX = '/__fake';
export const SCENARIO_HEADER = 'x-fake-scenario';
const PROBLEM_MEDIA = 'application/problem+json';
const DEFAULT_NOW = '2026-01-01T12:00:00.000Z';
const DEFAULT_MAX_BODY = 16 * 1024 * 1024;
const UPLOAD_TTL_SECONDS = 3600;

/** Operations whose 200 body the fake builds from `fixtures/openai/<operationId>-200.json`. */
const FIXTURE_OPERATIONS = [
  'createChatCompletion',
  'createFile',
  'createUpload',
  'addUploadPart',
  'completeUpload',
  'createVectorStore',
  'deleteVectorStore',
  'createVectorStoreFile',
  'deleteVectorStoreFile',
];

/**
 * X-Fake-Scenario values. Each answers a problem from the contract's closed type list, built on the
 * matching error fixture. `expired` has no type of its own in the closed list: it is a not_found
 * with error.code "expired".
 */
export const SCENARIOS = {
  rate_limited: {
    type: 'rate_limited',
    detail: 'Too many requests. Retry after the delay in Retry-After.',
    headers: { 'retry-after': '1' },
  },
  expired: { type: 'not_found', code: 'expired', detail: 'The resource has expired.' },
  unavailable: { type: 'unavailable', detail: 'The service is temporarily unavailable.' },
  not_implemented: { type: 'not_implemented', detail: 'The route is not implemented.' },
};

/** File statuses that are delivery milestones, and the event each one emits. */
const FILE_STATUS_EVENTS = {
  received: 'file.received',
  text_ready: 'file.text_ready',
  ready: 'file.ready',
  failed: 'file.failed',
  deleted: 'file.deleted',
};

/** Headers worth keeping in the request log; credentials are redacted, the rest dropped. */
const LOGGED = /^(x-.+|idempotency-key|content-type|openai-.+)$/;
const SECRET_HEADERS = new Set(['authorization', 'proxy-authorization', 'cookie']);
// Credential-like extension headers (x-api-key, a signed x-alore-grant, ...). Tenancy ids stay readable.
const SECRET_EXTENSION = /^x-.*(api-key|secret|token|grant|signature|credential|password)/;

const pad = (n) => String(n).padStart(4, '0');
const clone = (v) => structuredClone(v);

/**
 * @param {object} [options]
 * @param {string[]} [options.features] what GET /meta lists; `x_alore` is emitted when the feature
 *   the contract gates it with is on
 * @param {string} [options.now] ISO start of the fake clock; it moves only with `advance(ms)`
 * @param {'fixed'|'wall'|(() => number)} [options.webhookClock] where `webhook-timestamp` comes from:
 *   the fake clock (default, byte-identical deliveries), the wall clock (a real Standard Webhooks
 *   verifier accepts it, headers differ per run), or a function returning Unix seconds
 * @param {number} [options.maxBodyBytes] request body limit; a larger body answers 413
 * @param {string} [options.createdFileStatus] Alore status of a file created through the API
 * @param {(request: object) => string} [options.chatReply] content of a chat completion
 */
export function createFake(options = {}) {
  const model = loadFakeContract();
  const {
    features = [],
    client = 'fake-client',
    orgRef = 'fake-org',
    webhookUrl = null,
    webhookSecret = DEFAULT_WEBHOOK_SECRET,
    webhookClock = 'fixed',
    now = DEFAULT_NOW,
    maxBodyBytes = DEFAULT_MAX_BODY,
    createdFileStatus = 'ready',
    chatReply = null,
    fixtures: overrides = {},
  } = options;
  const startTime = Date.parse(now);
  if (Number.isNaN(startTime)) throw new Error(`invalid now: ${now}`);
  if (!['fixed', 'wall'].includes(webhookClock) && typeof webhookClock !== 'function')
    throw new Error(`invalid webhookClock: ${String(webhookClock)}`);
  model.assertSchema('file-extension.schema.json', { status: createdFileStatus });

  // ---- fixtures: the contract's own examples, validated before anything starts
  const basicMeta = model.fixtures['meta/basic.json'].instance;
  // The served contract is the package version, so the fixture cannot drift behind a release.
  const metaBody = overrides.meta
    ? clone(overrides.meta)
    : { ...clone(basicMeta), contract: model.version, features: [...features] };
  const problemTypes = model.doc.components.schemas.AloreProblem.properties.type.enum;
  const problems = Object.fromEntries(
    problemTypes.map((type) => [
      type,
      overrides.problems?.[type] ?? model.fixtures[`errors/${type}.json`].instance,
    ]),
  );
  model.assertSchema('meta.schema.json', metaBody);
  for (const [type, instance] of Object.entries(problems)) {
    model.assertSchema('problem.schema.json', instance);
    if (instance.type !== type) throw new ContractViolationError(`problem fixture ${type}`, []);
  }
  const operationFixtures = Object.fromEntries(
    FIXTURE_OPERATIONS.map((id) => {
      const fixture =
        overrides.operations?.[id] ?? model.fixtures[`openai/${id}-200.json`]?.instance;
      if (!fixture) throw new Error(`no fixture fixtures/openai/${id}-200.json`);
      model.assertResponse(id, 200, fixture);
      return [id, fixture];
    }),
  );
  const fromFixture = (id) => clone(operationFixtures[id]);
  // The gate for `x_alore` is the overlay's own mark, not a copy of its name.
  const fileFeature =
    model.doc.components.schemas.OpenAIFile.properties.x_alore?.['x-alore-feature'];
  if (!fileFeature) throw new Error('OpenAIFile.x_alore has no x-alore-feature in the contract');

  // ---- state; reset() restores it
  let clock;
  let eventSeq;
  let requestSeq;
  let generation = 0;
  let seq; // per-resource counters
  let files;
  let uploads;
  let parts;
  let stores;
  let subjectSeq;
  let server = null;
  let queue = Promise.resolve(); // webhook deliveries run one at a time, in event order
  const events = [];
  const deliveries = [];
  const requests = [];
  const reset = () => {
    generation += 1;
    clock = startTime;
    eventSeq = 0;
    requestSeq = 0;
    seq = { file: 0, upload: 0, part: 0, store: 0, chat: 0 };
    files = new Map();
    uploads = new Map();
    parts = new Map();
    stores = new Map();
    subjectSeq = new Map();
    events.length = 0;
    deliveries.length = 0;
    requests.length = 0;
  };
  reset();

  const isoNow = () => new Date(clock).toISOString();
  const unixNow = () => Math.floor(clock / 1000);
  const webhookTimestamp = () =>
    typeof webhookClock === 'function'
      ? webhookClock()
      : webhookClock === 'wall'
        ? Math.floor(Date.now() / 1000)
        : unixNow();
  const nextId = (kind, prefix) => {
    seq[kind] += 1;
    return `${prefix}-fake-${pad(seq[kind])}`;
  };

  // ---- problems
  function problem(type, { detail, code, instance, headers, status } = {}) {
    const base = problems[type];
    const body = {
      type: base.type,
      title: base.title,
      status: status ?? base.status,
      detail: detail ?? base.detail,
      ...(instance ? { instance } : {}),
      // OpenAI's error object requires `param`; the pinned spec declares it on every error response.
      error: {
        ...base.error,
        param: base.error.param ?? null,
        message: detail ?? base.error.message,
        ...(code ? { code } : {}),
      },
    };
    model.assertSchema('problem.schema.json', body);
    return {
      status: body.status,
      headers: { 'content-type': PROBLEM_MEDIA, ...headers },
      body,
    };
  }
  const notFound = (what, id) => problem('not_found', { detail: `No such ${what}: ${id}.` });
  const expired = (what, id) =>
    problem('not_found', { code: 'expired', detail: `The ${what} has expired: ${id}.` });
  const problemTypeFor = (status) => problemTypes.find((t) => problems[t].status === status);

  /** invalid_request problem built from the operation's own request schema, or null when it conforms. */
  function invalidRequest(operationId, value) {
    const errors = model.validateRequest(operationId, value);
    if (!errors) return null;
    const first = errors.slice(0, 3).map((e) => `${e.instancePath || '/'} ${e.message}`);
    const param = errors[0].instancePath.split('/')[1] || errors[0].params?.missingProperty;
    const out = problem('invalid_request', { detail: `Invalid request: ${first.join('; ')}.` });
    if (param) out.body.error.param = param;
    return out;
  }
  const needJson = (body) =>
    body && typeof body === 'object' && !Array.isArray(body)
      ? null
      : problem('invalid_request', { detail: 'Send a JSON object body.' });
  const needForm = (form) =>
    form ? null : problem('unsupported_media_type', { detail: 'Send multipart/form-data.' });

  // ---- files
  // OpenAI's deprecated `status` is required by the pinned schema; Alore's richer status maps onto it.
  const OPENAI_STATUS = { ready: 'processed', deleted: 'processed', failed: 'error' };
  const fileObject = (rec) => ({
    id: rec.id,
    object: 'file',
    bytes: rec.bytes,
    created_at: rec.created_at,
    filename: rec.filename,
    purpose: rec.purpose,
    status: OPENAI_STATUS[rec.status] ?? 'uploaded',
    ...(features.includes(fileFeature) ? { x_alore: { status: rec.status } } : {}),
  });

  function addFile({ id, filename, bytes, purpose, status, content }) {
    model.assertSchema('file-extension.schema.json', { status });
    const rec = {
      id: id ?? nextId('file', 'file'),
      filename,
      bytes,
      purpose,
      status,
      content: content ?? null,
      created_at: unixNow(),
    };
    files.set(rec.id, rec);
    return rec;
  }

  function seedFile({
    id,
    filename = 'document.pdf',
    bytes = 1024,
    purpose = 'assistants',
    status = 'ready',
  } = {}) {
    return fileObject(addFile({ id, filename, bytes, purpose, status }));
  }

  /** Remove a file, and its attachment to every vector store. */
  function removeFile(id) {
    files.delete(id);
    for (const store of stores.values()) store.files.delete(id);
  }

  // ---- events and webhooks
  async function deliver(event, gen) {
    if (!webhookUrl) return;
    const attempt = deliveries.filter((d) => d.eventId === event.id).length + 1;
    const result = await postWebhook({
      url: webhookUrl,
      event,
      secret: webhookSecret,
      timestamp: webhookTimestamp(),
    });
    if (gen === generation) deliveries.push({ eventId: event.id, attempt, ...result });
  }

  /** Queue a delivery behind the earlier ones; the returned promise settles when it is done. */
  function enqueue(event) {
    const gen = generation;
    const run = queue.then(() => deliver(event, gen));
    queue = run.catch(() => {});
    return run;
  }

  /** Validate, number and record an event, and queue its delivery. Nothing waits for the receiver. */
  function record(type, { subject, data = {}, org } = {}) {
    const next = (subjectSeq.get(`${subject?.kind}:${subject?.id}`) ?? 0) + 1;
    const event = {
      id: `evt-${pad(eventSeq + 1)}`,
      type,
      time: isoNow(),
      client,
      org_ref: org === undefined ? orgRef : org,
      subject,
      seq: next,
      data,
    };
    model.assertSchema('webhook-envelope.schema.json', event); // refused before anything is sent
    eventSeq += 1;
    subjectSeq.set(`${subject.kind}:${subject.id}`, next);
    events.push(event);
    return { event, delivered: enqueue(event) };
  }

  /** Emit an event and wait until its delivery has finished. */
  async function emit(type, options) {
    const { event, delivered } = record(type, options);
    await delivered;
    return clone(event);
  }

  /** Wait for every queued delivery. HTTP handlers do not wait for receivers; specs call this. */
  async function flush() {
    let pending;
    do {
      pending = queue;
      await pending;
    } while (pending !== queue);
  }

  async function redeliver(eventId) {
    const event = events.find((e) => e.id === eventId);
    if (!event) throw new Error(`unknown event ${eventId}`);
    await enqueue(event);
  }

  /** Set a status; a deleted file leaves the store, as with DELETE. Returns the delivery promise. */
  function applyFileStatus(id, status) {
    model.assertSchema('file-extension.schema.json', { status });
    const rec = files.get(id);
    if (!rec) throw new Error(`unknown file ${id}`);
    rec.status = status;
    const snapshot = fileObject(rec);
    if (status === 'deleted') removeFile(id);
    const type = FILE_STATUS_EVENTS[status];
    return {
      snapshot,
      delivered: type ? record(type, { subject: { kind: 'file', id } }).delivered : null,
    };
  }

  async function setFileStatus(id, status) {
    const { snapshot, delivered } = applyFileStatus(id, status);
    await delivered;
    return snapshot;
  }

  // ---- uploads, vector stores
  const uploadObject = (rec) => {
    if (rec.status === 'pending' && unixNow() >= rec.expires_at) rec.status = 'expired';
    return {
      ...fromFixture('createUpload'),
      id: rec.id,
      bytes: rec.bytes,
      created_at: rec.created_at,
      expires_at: rec.expires_at,
      filename: rec.filename,
      purpose: rec.purpose,
      status: rec.status,
      file: rec.file ? fileObject(files.get(rec.file) ?? rec.fileSnapshot) : null,
    };
  };

  const storeObject = (rec) => {
    const attached = [...rec.files.values()];
    return {
      ...fromFixture('createVectorStore'),
      id: rec.id,
      name: rec.name,
      created_at: rec.created_at,
      last_active_at: rec.last_active_at,
      usage_bytes: attached.reduce((sum, f) => sum + (files.get(f.id)?.bytes ?? 0), 0),
      file_counts: {
        in_progress: 0,
        completed: attached.length,
        failed: 0,
        cancelled: 0,
        total: attached.length,
      },
      status: 'completed',
      ...(rec.expires_after
        ? {
            expires_after: rec.expires_after,
            expires_at: rec.last_active_at + rec.expires_after.days * 86400,
          }
        : {}),
      metadata: rec.metadata,
    };
  };

  const storeFileObject = (store, entry) => ({
    ...fromFixture('createVectorStoreFile'),
    id: entry.id,
    usage_bytes: files.get(entry.id)?.bytes ?? 0,
    created_at: entry.created_at,
    vector_store_id: store.id,
    attributes: entry.attributes,
    ...(entry.chunking_strategy ? { chunking_strategy: entry.chunking_strategy } : {}),
  });

  function attach(store, fileId, { attributes, chunking_strategy } = {}) {
    store.files.set(fileId, {
      id: fileId,
      created_at: unixNow(),
      attributes: attributes ?? {},
      chunking_strategy,
    });
  }

  /** OpenAI-style cursor page over records already in ascending creation order. */
  function page(list, query, map, key = (r) => r.id) {
    const order = query.get('order') ?? 'desc';
    const limit = query.has('limit') ? Number(query.get('limit')) : 20;
    if (!['asc', 'desc'].includes(order))
      return { error: problem('invalid_request', { detail: 'order must be asc or desc.' }) };
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      return {
        error: problem('invalid_request', { detail: 'limit must be an integer from 1 to 100.' }),
      };
    let items = order === 'desc' ? [...list].reverse() : [...list];
    if (query.has('after')) {
      const at = items.findIndex((r) => key(r) === query.get('after'));
      items = at < 0 ? [] : items.slice(at + 1);
    }
    if (query.has('before')) {
      const at = items.findIndex((r) => key(r) === query.get('before'));
      items = at < 0 ? items : items.slice(0, at);
    }
    const shown = items.slice(0, limit);
    return {
      body: {
        object: 'list',
        data: shown.map(map),
        first_id: shown[0] ? key(shown[0]) : '',
        last_id: shown.length ? key(shown.at(-1)) : '',
        has_more: items.length > shown.length,
      },
    };
  }
  const ok = (body) => ({ status: 200, body });

  // ---- behaviours: operationId -> handler. Only operations whose response the contract types.
  const behaviours = new Map();
  behaviours.set('alore_get_meta', () => ok(clone(metaBody)));

  behaviours.set('listFiles', ({ query }) => {
    const order = query.get('order') ?? 'desc';
    const limit = query.has('limit') ? Number(query.get('limit')) : 10000;
    if (!['asc', 'desc'].includes(order))
      return problem('invalid_request', { detail: 'order must be asc or desc.' });
    if (!Number.isInteger(limit) || limit < 1 || limit > 10000)
      return problem('invalid_request', { detail: 'limit must be an integer from 1 to 10000.' });
    let list = [...files.values()].filter(
      (f) => !query.has('purpose') || f.purpose === query.get('purpose'),
    );
    if (order === 'desc') list.reverse();
    if (query.has('after')) {
      const at = list.findIndex((f) => f.id === query.get('after'));
      list = at < 0 ? [] : list.slice(at + 1);
    }
    const shown = list.slice(0, limit);
    return ok({
      object: 'list',
      data: shown.map(fileObject),
      first_id: shown[0]?.id ?? '',
      last_id: shown.at(-1)?.id ?? '',
      has_more: list.length > shown.length,
    });
  });
  behaviours.set('retrieveFile', ({ params }) => {
    const rec = files.get(params[0]);
    return rec ? ok(fileObject(rec)) : notFound('file', params[0]);
  });
  behaviours.set('downloadFile', ({ params }) => {
    const rec = files.get(params[0]);
    if (!rec) return notFound('file', params[0]);
    return {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
      raw: rec.content ?? Buffer.from(`Fake content of ${rec.filename}\n`),
    };
  });
  behaviours.set('deleteFile', ({ params }) => {
    const rec = files.get(params[0]);
    if (!rec) return notFound('file', params[0]);
    applyFileStatus(rec.id, 'deleted');
    return ok({ id: rec.id, object: 'file', deleted: true });
  });
  behaviours.set('createFile', ({ form }) => {
    const refused =
      needForm(form) ?? invalidRequest('createFile', multipartRequestObject(form, 'file'));
    if (refused) return refused;
    const upload = form.files.find((f) => f.name === 'file');
    const rec = addFile({
      filename: upload.filename,
      bytes: upload.data.length,
      purpose: form.fields.purpose,
      status: createdFileStatus,
      content: upload.data,
    });
    const type = FILE_STATUS_EVENTS[rec.status];
    if (type) record(type, { subject: { kind: 'file', id: rec.id } });
    return ok({ ...fromFixture('createFile'), ...fileObject(rec) });
  });

  behaviours.set('createChatCompletion', ({ body }) => {
    const refused = needJson(body) ?? invalidRequest('createChatCompletion', body);
    if (refused) return refused;
    if (body.stream)
      return problem('not_implemented', {
        detail: 'Streaming chat completions are not served by this fake.',
      });
    const out = fromFixture('createChatCompletion');
    out.id = nextId('chat', 'chatcmpl');
    out.created = unixNow();
    out.model = body.model;
    if (chatReply) out.choices[0].message.content = String(chatReply(clone(body)));
    return ok(out);
  });

  behaviours.set('createUpload', ({ body }) => {
    const refused = needJson(body) ?? invalidRequest('createUpload', body);
    if (refused) return refused;
    const rec = {
      id: nextId('upload', 'upload'),
      bytes: body.bytes,
      filename: body.filename,
      purpose: body.purpose,
      mime_type: body.mime_type,
      created_at: unixNow(),
      expires_at: unixNow() + UPLOAD_TTL_SECONDS,
      status: 'pending',
      parts: [],
      file: null,
    };
    uploads.set(rec.id, rec);
    return ok(uploadObject(rec));
  });
  const pendingUpload = (id) => {
    const rec = uploads.get(id);
    if (!rec) return { error: notFound('upload', id) };
    uploadObject(rec); // applies expiry
    if (rec.status === 'expired') return { error: expired('upload', id) };
    if (rec.status !== 'pending')
      return {
        error: problem('invalid_request', { detail: `The upload is ${rec.status}, not pending.` }),
      };
    return { rec };
  };
  behaviours.set('addUploadPart', ({ params, form }) => {
    const { rec, error } = pendingUpload(params[0]);
    if (error) return error;
    const refused =
      needForm(form) ?? invalidRequest('addUploadPart', multipartRequestObject(form, 'data'));
    if (refused) return refused;
    const data = form.files.find((f) => f.name === 'data').data;
    const part = { id: nextId('part', 'part'), upload_id: rec.id, created_at: unixNow(), data };
    parts.set(part.id, part);
    rec.parts.push(part.id);
    return ok({
      ...fromFixture('addUploadPart'),
      id: part.id,
      created_at: part.created_at,
      upload_id: rec.id,
    });
  });
  behaviours.set('completeUpload', ({ params, body }) => {
    const { rec, error } = pendingUpload(params[0]);
    if (error) return error;
    const refused = needJson(body) ?? invalidRequest('completeUpload', body);
    if (refused) return refused;
    const unknown = body.part_ids.find((id) => !rec.parts.includes(id));
    if (unknown)
      return problem('invalid_request', {
        detail: `Part ${unknown} does not belong to the upload.`,
      });
    const content = Buffer.concat(body.part_ids.map((id) => parts.get(id).data));
    if (content.length !== rec.bytes)
      return problem('invalid_request', {
        detail: `The parts hold ${content.length} bytes; the upload declared ${rec.bytes}.`,
      });
    if (body.md5 && createHash('md5').update(content).digest('hex') !== body.md5)
      return problem('invalid_request', { detail: 'The md5 does not match the parts.' });
    const file = addFile({
      filename: rec.filename,
      bytes: content.length,
      purpose: rec.purpose,
      status: createdFileStatus,
      content,
    });
    const type = FILE_STATUS_EVENTS[file.status];
    if (type) record(type, { subject: { kind: 'file', id: file.id } });
    rec.status = 'completed';
    rec.file = file.id;
    rec.fileSnapshot = file;
    return ok(uploadObject(rec));
  });
  behaviours.set('cancelUpload', ({ params }) => {
    const { rec, error } = pendingUpload(params[0]);
    if (error) return error;
    rec.status = 'cancelled';
    return ok(uploadObject(rec));
  });

  behaviours.set('createVectorStore', ({ body }) => {
    const refused = needJson(body ?? {}) ?? invalidRequest('createVectorStore', body ?? {});
    if (refused) return refused;
    const missing = (body?.file_ids ?? []).find((id) => !files.has(id));
    if (missing) return notFound('file', missing);
    const rec = {
      id: nextId('store', 'vs'),
      name: body?.name ?? '',
      metadata: body?.metadata ?? {},
      expires_after: body?.expires_after ?? null,
      created_at: unixNow(),
      last_active_at: unixNow(),
      files: new Map(),
    };
    for (const id of new Set(body?.file_ids ?? []))
      attach(rec, id, { chunking_strategy: body.chunking_strategy });
    stores.set(rec.id, rec);
    return ok(storeObject(rec));
  });
  behaviours.set('listVectorStores', ({ query }) => {
    const out = page([...stores.values()], query, storeObject);
    return out.error ?? ok(out.body);
  });
  behaviours.set('getVectorStore', ({ params }) => {
    const rec = stores.get(params[0]);
    return rec ? ok(storeObject(rec)) : notFound('vector store', params[0]);
  });
  behaviours.set('modifyVectorStore', ({ params, body }) => {
    const rec = stores.get(params[0]);
    if (!rec) return notFound('vector store', params[0]);
    const refused = needJson(body) ?? invalidRequest('modifyVectorStore', body);
    if (refused) return refused;
    if ('name' in body) rec.name = body.name ?? '';
    if ('metadata' in body) rec.metadata = body.metadata ?? {};
    if ('expires_after' in body) rec.expires_after = body.expires_after;
    return ok(storeObject(rec));
  });
  behaviours.set('deleteVectorStore', ({ params }) => {
    const rec = stores.get(params[0]);
    if (!rec) return notFound('vector store', params[0]);
    stores.delete(rec.id);
    return ok({ ...fromFixture('deleteVectorStore'), id: rec.id });
  });

  behaviours.set('createVectorStoreFile', ({ params, body }) => {
    const store = stores.get(params[0]);
    if (!store) return notFound('vector store', params[0]);
    const refused = needJson(body) ?? invalidRequest('createVectorStoreFile', body);
    if (refused) return refused;
    if (!files.has(body.file_id)) return notFound('file', body.file_id);
    if (store.files.has(body.file_id))
      return problem('conflict', { detail: `File ${body.file_id} is already in the store.` });
    attach(store, body.file_id, body);
    return ok(storeFileObject(store, store.files.get(body.file_id)));
  });
  behaviours.set('listVectorStoreFiles', ({ params, query }) => {
    const store = stores.get(params[0]);
    if (!store) return notFound('vector store', params[0]);
    if (query.has('filter') && query.get('filter') !== 'completed') {
      const empty = page([], query, () => null);
      return empty.error ?? ok(empty.body); // every attached file is completed
    }
    const out = page([...store.files.values()], query, (e) => storeFileObject(store, e));
    return out.error ?? ok(out.body);
  });
  behaviours.set('getVectorStoreFile', ({ params }) => {
    const store = stores.get(params[0]);
    const entry = store?.files.get(params[1]);
    if (!store) return notFound('vector store', params[0]);
    return entry ? ok(storeFileObject(store, entry)) : notFound('vector store file', params[1]);
  });
  behaviours.set('updateVectorStoreFileAttributes', ({ params, body }) => {
    const store = stores.get(params[0]);
    const entry = store?.files.get(params[1]);
    if (!store) return notFound('vector store', params[0]);
    if (!entry) return notFound('vector store file', params[1]);
    const refused = needJson(body) ?? invalidRequest('updateVectorStoreFileAttributes', body);
    if (refused) return refused;
    entry.attributes = body.attributes ?? {};
    return ok(storeFileObject(store, entry));
  });
  behaviours.set('deleteVectorStoreFile', ({ params }) => {
    const store = stores.get(params[0]);
    if (!store) return notFound('vector store', params[0]);
    if (!store.files.has(params[1])) return notFound('vector store file', params[1]);
    store.files.delete(params[1]);
    return ok({ ...fromFixture('deleteVectorStoreFile'), id: params[1] });
  });

  // ---- request handling
  function logRequest(entry) {
    requestSeq += 1;
    requests.push({ seq: requestSeq, ...entry });
  }

  function loggedHeaders(headers) {
    const out = {};
    for (const name of Object.keys(headers).sort()) {
      if (SECRET_HEADERS.has(name) || SECRET_EXTENSION.test(name)) out[name] = '[redacted]';
      // The multipart boundary is random per client request; it would make the log differ per run.
      else if (LOGGED.test(name))
        out[name] = String(headers[name]).replace(/(multipart\/[\w.+-]+);.*$/i, '$1');
    }
    return out;
  }

  const loggedBody = (body, form) =>
    form
      ? {
          multipart: {
            fields: form.fields,
            files: form.files.map((f) => ({
              name: f.name,
              filename: f.filename,
              bytes: f.data.length,
            })),
          },
        }
      : body;

  /** Every problem is checked against the operation's declared response, else problem.schema.json. */
  function checkBody(entry, result) {
    if (!result.body) return;
    if (result.status < 400) {
      if (entry) model.assertResponse(entry.operationId, result.status, result.body);
      return;
    }
    model.assertSchema('problem.schema.json', result.body);
    const mediaType = result.headers?.['content-type'];
    if (mediaType !== PROBLEM_MEDIA)
      throw new ContractViolationError('problem response', [
        { message: `expected ${PROBLEM_MEDIA}, received ${mediaType ?? 'no content type'}` },
      ]);
    if (!entry || !model.hasResponse(entry.operationId, result.status)) return;
    model.assertResponse(entry.operationId, result.status, result.body, mediaType);
    // Preserve validation against the OpenAI JSON envelope when one is documented.
    if (model.declaresResponse(entry.operationId, result.status, 'application/json'))
      model.assertResponse(entry.operationId, result.status, result.body, 'application/json');
  }

  async function handleApi({ method, path, url, headers, body, form, fault }) {
    const instance = `${API_PREFIX}${path}`;
    const scenarioName = headers[SCENARIO_HEADER] || null;
    const base = {
      method,
      path: instance,
      query: url.search.slice(1),
      scenario: scenarioName,
      headers: loggedHeaders(headers),
      body: loggedBody(body, form),
    };
    const entry = model.match(method, path);
    let result;
    if (scenarioName) {
      const scenario = SCENARIOS[scenarioName];
      result = scenario
        ? problem(scenario.type, { ...scenario, instance })
        : problem('invalid_request', {
            detail: `Unknown ${SCENARIO_HEADER}. Use one of: ${Object.keys(SCENARIOS).join(', ')}.`,
            instance,
          });
    } else if (fault) {
      result = problem(fault.type, { detail: fault.detail, instance });
    } else if (!entry) {
      result = problem('not_found', { detail: `No route ${method} ${path}.`, instance });
    } else {
      const behaviour = behaviours.get(entry.operationId);
      if (!behaviour) {
        const stub = entry.status === 'stub' ? entry.op['x-stub-response'] : undefined;
        const type = stub === undefined ? 'not_implemented' : problemTypeFor(Number(stub));
        if (!type)
          throw new Error(`${entry.operationId}: x-stub-response ${stub} has no problem type`);
        result = problem(type, {
          detail: `${entry.operationId} (x-status ${entry.status}): this fake serves no fixture for the route.`,
          instance,
        });
      } else {
        let params;
        try {
          params = (entry.regex.exec(path) ?? []).slice(1).map(decodeURIComponent);
        } catch {
          params = null;
        }
        result = params
          ? await behaviour({ params, query: url.searchParams, body, form })
          : problem('invalid_request', {
              detail: 'The path has a malformed percent-encoding.',
              instance,
            });
      }
    }
    checkBody(entry, result);
    logRequest({ ...base, status: result.status });
    return result;
  }

  async function handleControl({ method, path, body }) {
    const route = `${method} ${path}`;
    if (route === 'GET /requests') return { status: 200, body: clone(requests) };
    if (route === 'GET /events') return { status: 200, body: clone(events) };
    if (route === 'GET /deliveries') return { status: 200, body: clone(deliveries) };
    if (route === 'POST /flush') {
      await flush();
      return { status: 204 };
    }
    if (route === 'POST /reset') {
      reset();
      return { status: 204 };
    }
    try {
      if (route === 'POST /files') return { status: 201, body: seedFile(body ?? {}) };
      if (route === 'POST /events') {
        const { event } = record(body?.type, {
          subject: body?.subject,
          data: body?.data,
          org: body?.org_ref,
        });
        return { status: 201, body: clone(event) };
      }
      const status = /^POST \/files\/([^/]+)\/status$/.exec(route);
      if (status) {
        const id = decodeURIComponent(status[1]);
        if (!files.has(id)) return problem('not_found', { detail: 'No such file.' });
        return { status: 200, body: applyFileStatus(id, body?.status).snapshot };
      }
    } catch (error) {
      if (error instanceof ContractViolationError || error instanceof URIError)
        return problem('invalid_request', { detail: error.message });
      throw error;
    }
    return problem('not_found', { detail: `No control route ${route}.` });
  }

  async function handle({
    method,
    url: rawUrl,
    headers = {},
    body = null,
    form = null,
    fault = null,
  }) {
    let url;
    try {
      url = new URL(rawUrl, 'http://fake.invalid');
    } catch {
      return finish(problem('invalid_request', { detail: 'The request target is malformed.' }));
    }
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
    let result;
    if (path === API_PREFIX || path.startsWith(`${API_PREFIX}/`)) {
      result = await handleApi({
        method,
        path: path.slice(API_PREFIX.length) || '/',
        url,
        headers,
        body,
        form,
        fault,
      });
    } else if (path.startsWith(`${CONTROL_PREFIX}/`)) {
      result = fault
        ? problem(fault.type, { detail: fault.detail })
        : await handleControl({ method, path: path.slice(CONTROL_PREFIX.length), body });
    } else {
      result = problem('not_found', { detail: `Outside ${API_PREFIX}.`, instance: path });
    }
    return finish(result);
  }

  function finish(result) {
    const text = result.body === undefined ? '' : JSON.stringify(result.body);
    const bytes = result.raw ?? Buffer.from(text);
    return {
      status: result.status,
      headers: { ...(text ? { 'content-type': 'application/json' } : {}), ...result.headers },
      text: result.raw ? '' : text,
      bytes,
    };
  }

  // ---- HTTP
  // A body over the limit is read to the end and dropped, so the client gets its 413 and no reset.
  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      req.on('data', (chunk) => {
        size += chunk.length;
        if (size <= maxBodyBytes) chunks.push(chunk);
        else chunks.length = 0;
      });
      req.on('end', () =>
        resolve(size > maxBodyBytes ? { tooLarge: true } : { buffer: Buffer.concat(chunks) }),
      );
      req.on('error', reject);
    });
  }

  async function onRequest(req, res) {
    res.sendDate = false; // no wall-clock header: outputs are byte-identical across runs
    let out;
    try {
      const { buffer, tooLarge } = await readBody(req);
      const type = req.headers['content-type'] ?? '';
      let body = null;
      let form = null;
      let fault = null;
      if (tooLarge) {
        fault = { type: 'payload_too_large', detail: `The body exceeds ${maxBodyBytes} bytes.` };
      } else if (buffer.length && /json/.test(type)) {
        try {
          body = JSON.parse(buffer.toString('utf8'));
        } catch {
          fault = { type: 'invalid_request', detail: 'The body is not valid JSON.' };
        }
      } else if (buffer.length && /^multipart\/form-data/i.test(type)) {
        try {
          form = parseMultipart(buffer, type);
        } catch (error) {
          fault = {
            type: 'invalid_request',
            detail: `The multipart body is malformed: ${error.message}.`,
          };
        }
      }
      out = await handle({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body,
        form,
        fault,
      });
    } catch (error) {
      const text = `fake-alore: ${error instanceof Error ? error.message : error}`;
      out = { status: 500, headers: { 'content-type': 'text/plain' }, bytes: Buffer.from(text) };
    }
    res.writeHead(out.status, { ...out.headers, 'content-length': out.bytes.length });
    res.end(out.bytes);
  }

  async function listen({ port = 0, host = '127.0.0.1' } = {}) {
    if (server) throw new Error('already listening');
    server = createServer((req, res) => void onRequest(req, res));
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, resolve);
    });
    const actual = server.address().port;
    const origin = `http://${host}:${actual}`;
    return { origin, baseURL: `${origin}${API_PREFIX}`, port: actual };
  }

  async function close() {
    await flush();
    if (!server) return;
    const closing = server;
    server = null;
    closing.closeAllConnections();
    await new Promise((resolve) => closing.close(resolve));
  }

  return {
    listen,
    close,
    handle,
    reset,
    flush,
    seedFile,
    setFileStatus,
    emit,
    redeliver,
    advance: (ms) => {
      clock += ms;
    },
    get behaviours() {
      return [...behaviours.keys()];
    },
    get requests() {
      return requests;
    },
    get events() {
      return events;
    },
    get deliveries() {
      return deliveries;
    },
  };
}
