// Fake Alore: a deterministic, network-free (loopback only) stand-in for the /ai/v1 API.
// Routes, response schemas, problem bodies and the webhook envelope all come from the contract
// package (see model.mjs). The fake adds behaviour only where the contract already has a body.
import { createServer } from 'node:http';

import { ContractViolationError, loadFakeContract } from './model.mjs';
import { DEFAULT_WEBHOOK_SECRET, postWebhook } from './webhooks.mjs';

export const API_PREFIX = '/ai/v1';
export const CONTROL_PREFIX = '/__fake';
export const SCENARIO_HEADER = 'x-fake-scenario';
const DEFAULT_NOW = '2026-01-01T12:00:00.000Z';
const MAX_BODY = 1024 * 1024;

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
const SECRET_HEADERS = new Set(['authorization', 'x-api-key', 'cookie']);

const pad = (n) => String(n).padStart(4, '0');
const clone = (v) => structuredClone(v);

export function createFake(options = {}) {
  const model = loadFakeContract();
  const {
    features = [],
    client = 'fake-client',
    orgRef = 'fake-org',
    webhookUrl = null,
    webhookSecret = DEFAULT_WEBHOOK_SECRET,
    now = DEFAULT_NOW,
    fixtures: overrides = {},
  } = options;
  const startTime = Date.parse(now);
  if (Number.isNaN(startTime)) throw new Error(`invalid now: ${now}`);

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

  // ---- state; reset() restores it
  let clock;
  let fileSeq;
  let eventSeq;
  let requestSeq;
  let files;
  let subjectSeq;
  let server = null;
  const events = [];
  const deliveries = [];
  const requests = [];
  const reset = () => {
    clock = startTime;
    fileSeq = 0;
    eventSeq = 0;
    requestSeq = 0;
    files = new Map();
    subjectSeq = new Map();
    events.length = 0;
    deliveries.length = 0;
    requests.length = 0;
  };
  reset();

  const isoNow = () => new Date(clock).toISOString();
  const unixNow = () => Math.floor(clock / 1000);

  // ---- problems
  function problem(type, { detail, code, instance, headers } = {}) {
    const base = problems[type];
    const body = {
      type: base.type,
      title: base.title,
      status: base.status,
      detail: detail ?? base.detail,
      ...(instance ? { instance } : {}),
      error: { ...base.error, message: detail ?? base.error.message, ...(code ? { code } : {}) },
    };
    model.assertSchema('problem.schema.json', body);
    return {
      status: body.status,
      headers: { 'content-type': 'application/problem+json', ...headers },
      body,
    };
  }

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
    ...(features.includes('files.status') ? { x_alore: { status: rec.status } } : {}),
  });

  function seedFile({
    id,
    filename = 'document.pdf',
    bytes = 1024,
    purpose = 'assistants',
    status = 'ready',
  } = {}) {
    model.assertSchema('file-extension.schema.json', { status });
    fileSeq += 1;
    const rec = {
      id: id ?? `file-fake-${pad(fileSeq)}`,
      seq: fileSeq,
      filename,
      bytes,
      purpose,
      status,
      created_at: unixNow(),
    };
    files.set(rec.id, rec);
    return fileObject(rec);
  }

  // ---- events and webhooks
  async function deliver(event) {
    const attempt = deliveries.filter((d) => d.eventId === event.id).length + 1;
    if (!webhookUrl) return;
    const result = await postWebhook({
      url: webhookUrl,
      event,
      secret: webhookSecret,
      timestamp: unixNow(),
    });
    deliveries.push({ eventId: event.id, attempt, ...result });
  }

  async function emit(type, { subject, data = {}, org } = {}) {
    const seq = (subjectSeq.get(`${subject?.kind}:${subject?.id}`) ?? 0) + 1;
    const event = {
      id: `evt-${pad(eventSeq + 1)}`,
      type,
      time: isoNow(),
      client,
      org_ref: org === undefined ? orgRef : org,
      subject,
      seq,
      data,
    };
    model.assertSchema('webhook-envelope.schema.json', event); // refused before anything is sent
    eventSeq += 1;
    subjectSeq.set(`${subject.kind}:${subject.id}`, seq);
    events.push(event);
    await deliver(event);
    return clone(event);
  }

  async function redeliver(eventId) {
    const event = events.find((e) => e.id === eventId);
    if (!event) throw new Error(`unknown event ${eventId}`);
    await deliver(event);
  }

  async function setFileStatus(id, status) {
    model.assertSchema('file-extension.schema.json', { status });
    const rec = files.get(id);
    if (!rec) throw new Error(`unknown file ${id}`);
    rec.status = status;
    const type = FILE_STATUS_EVENTS[status];
    if (type) await emit(type, { subject: { kind: 'file', id } });
    return fileObject(rec);
  }

  // ---- behaviours: operationId -> handler. Only operations whose response the contract types.
  const behaviours = new Map();
  behaviours.set('alore_get_meta', () => ({ status: 200, body: clone(metaBody) }));
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
    const page = list.slice(0, limit);
    return {
      status: 200,
      body: {
        object: 'list',
        data: page.map(fileObject),
        first_id: page[0]?.id ?? '',
        last_id: page.at(-1)?.id ?? '',
        has_more: list.length > page.length,
      },
    };
  });
  behaviours.set('retrieveFile', ({ params }) => {
    const rec = files.get(params[0]);
    return rec
      ? { status: 200, body: fileObject(rec) }
      : problem('not_found', { detail: `No such file: ${params[0]}.` });
  });
  behaviours.set('deleteFile', async ({ params }) => {
    const rec = files.get(params[0]);
    if (!rec) return problem('not_found', { detail: `No such file: ${params[0]}.` });
    files.delete(rec.id);
    await emit('file.deleted', { subject: { kind: 'file', id: rec.id } });
    return { status: 200, body: { id: rec.id, object: 'file', deleted: true } };
  });

  // ---- request handling
  function logRequest(entry) {
    requestSeq += 1;
    requests.push({ seq: requestSeq, ...entry });
  }

  function loggedHeaders(headers) {
    const out = {};
    for (const name of Object.keys(headers).sort()) {
      if (SECRET_HEADERS.has(name)) out[name] = '[redacted]';
      else if (LOGGED.test(name)) out[name] = String(headers[name]);
    }
    return out;
  }

  async function handleApi({ method, path, url, headers, body }) {
    const instance = `${API_PREFIX}${path}`;
    const scenarioName = headers[SCENARIO_HEADER] || null;
    const base = {
      method,
      path: instance,
      query: url.search.slice(1),
      scenario: scenarioName,
      headers: loggedHeaders(headers),
      body,
    };
    let result;
    if (scenarioName) {
      const scenario = SCENARIOS[scenarioName];
      result = scenario
        ? problem(scenario.type, { ...scenario, instance })
        : problem('invalid_request', {
            detail: `Unknown ${SCENARIO_HEADER}. Use one of: ${Object.keys(SCENARIOS).join(', ')}.`,
            instance,
          });
    } else {
      const entry = model.match(method, path);
      if (!entry) {
        result = problem('not_found', { detail: `No route ${method} ${path}.`, instance });
      } else {
        const behaviour = behaviours.get(entry.operationId);
        if (!behaviour) {
          result = problem('not_implemented', {
            detail: `${entry.operationId} (x-status ${entry.status}): this fake serves no fixture for the route.`,
            instance,
          });
        } else {
          const params = (entry.regex.exec(path) ?? []).slice(1).map(decodeURIComponent);
          result = await behaviour({ params, query: url.searchParams, body });
          if (result.body && result.status < 400) {
            model.assertResponse(entry.operationId, result.status, result.body);
          }
        }
      }
    }
    logRequest({ ...base, status: result.status });
    return result;
  }

  async function handleControl({ method, path, body }) {
    const route = `${method} ${path}`;
    if (route === 'GET /requests') return { status: 200, body: clone(requests) };
    if (route === 'GET /events') return { status: 200, body: clone(events) };
    if (route === 'GET /deliveries') return { status: 200, body: clone(deliveries) };
    if (route === 'POST /reset') {
      reset();
      return { status: 204 };
    }
    try {
      if (route === 'POST /files') return { status: 201, body: seedFile(body ?? {}) };
      if (route === 'POST /events') {
        const event = await emit(body?.type, {
          subject: body?.subject,
          data: body?.data,
          org: body?.org_ref,
        });
        return { status: 201, body: event };
      }
      const status = /^POST \/files\/([^/]+)\/status$/.exec(route);
      if (status) {
        if (!files.has(decodeURIComponent(status[1])))
          return problem('not_found', { detail: 'No such file.' });
        return {
          status: 200,
          body: await setFileStatus(decodeURIComponent(status[1]), body?.status),
        };
      }
    } catch (error) {
      if (error instanceof ContractViolationError)
        return problem('invalid_request', { detail: error.message });
      throw error;
    }
    return problem('not_found', { detail: `No control route ${route}.` });
  }

  async function handle({ method, url: rawUrl, headers = {}, body = null }) {
    const url = new URL(rawUrl, 'http://fake.invalid');
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
    let result;
    if (path === API_PREFIX || path.startsWith(`${API_PREFIX}/`)) {
      result = await handleApi({
        method,
        path: path.slice(API_PREFIX.length) || '/',
        url,
        headers,
        body,
      });
    } else if (path.startsWith(`${CONTROL_PREFIX}/`)) {
      result = await handleControl({ method, path: path.slice(CONTROL_PREFIX.length), body });
    } else {
      result = problem('not_found', { detail: `Outside ${API_PREFIX}.`, instance: path });
    }
    const text = result.body === undefined ? '' : JSON.stringify(result.body);
    return {
      status: result.status,
      headers: { ...(text ? { 'content-type': 'application/json' } : {}), ...result.headers },
      text,
    };
  }

  // ---- HTTP
  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_BODY) reject(new Error('body too large'));
        else chunks.push(chunk);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }

  async function onRequest(req, res) {
    res.sendDate = false; // no wall-clock header: outputs are byte-identical across runs
    let out;
    try {
      const raw = await readBody(req);
      let body = null;
      if (raw && /json/.test(req.headers['content-type'] ?? '')) {
        try {
          body = JSON.parse(raw);
        } catch {
          out = {
            status: 400,
            headers: { 'content-type': 'application/problem+json' },
            text: JSON.stringify(
              problem('invalid_request', { detail: 'The body is not valid JSON.' }).body,
            ),
          };
        }
      }
      out ??= await handle({ method: req.method, url: req.url, headers: req.headers, body });
    } catch (error) {
      out = {
        status: 500,
        headers: { 'content-type': 'text/plain' },
        text: `fake-alore: ${error instanceof Error ? error.message : error}`,
      };
    }
    res.writeHead(out.status, { ...out.headers, 'content-length': Buffer.byteLength(out.text) });
    res.end(out.text);
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
