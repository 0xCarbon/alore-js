import { createFake } from '@alore/platform-contract/fake';
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import { after } from 'node:test';

const closers: Array<() => Promise<void> | void> = [];

after(async () => {
  while (closers.length > 0) {
    const close = closers.pop();
    if (close) {
      await close();
    }
  }
});

export interface FakeHandle {
  fake: ReturnType<typeof createFake>;
  origin: string;
  baseURL: string;
  port: number;
}

export async function startFake(options?: Record<string, unknown>): Promise<FakeHandle> {
  const fake = createFake(options);
  const server = await fake.listen();
  closers.push(() => fake.close());
  return { fake, ...server };
}

export interface ReceivedWebhook {
  headers: IncomingHttpHeaders;
  rawBody: string;
}

export async function startWebhookReceiver(statusCode = 200): Promise<{
  url: string;
  received: ReceivedWebhook[];
}> {
  const received: ReceivedWebhook[] = [];
  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      received.push({
        headers: req.headers,
        rawBody: Buffer.concat(chunks).toString('utf8'),
      });
      res.writeHead(statusCode).end();
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  closers.push(
    () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  );
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind webhook receiver');
  }
  return {
    url: `http://127.0.0.1:${address.port}/webhooks/alore/v1`,
    received,
  };
}

export interface RecordedRequest {
  method: string;
  path: string;
  query: string;
  headers: IncomingHttpHeaders;
  rawBody: string;
  jsonBody: unknown;
}

export interface StubResponse {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
  rawBody?: string;
}

export type StubHandler = (req: RecordedRequest) => StubResponse | Promise<StubResponse>;

export async function startStubServer(handler: StubHandler): Promise<{
  baseURL: string;
  requests: RecordedRequest[];
}> {
  const requests: RecordedRequest[] = [];
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const processRequest = async (): Promise<void> => {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        let jsonBody: unknown;
        if (rawBody.length > 0 && /json/i.test(req.headers['content-type'] ?? '')) {
          try {
            jsonBody = JSON.parse(rawBody);
          } catch {
            jsonBody = undefined;
          }
        }
        const parsedUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
        const recorded: RecordedRequest = {
          method: req.method ?? 'GET',
          path: parsedUrl.pathname,
          query: parsedUrl.search.slice(1),
          headers: req.headers,
          rawBody,
          jsonBody,
        };
        requests.push(recorded);
        const reply = await handler(recorded);
        let payload = '';
        if (reply.rawBody !== undefined) {
          payload = reply.rawBody;
        } else if (reply.body !== undefined) {
          payload = JSON.stringify(reply.body);
        }
        const contentType =
          reply.headers?.['content-type'] ??
          reply.headers?.['Content-Type'] ??
          (reply.body !== undefined ? 'application/json' : 'text/plain');
        res.writeHead(reply.status, {
          ...(payload.length > 0 ? { 'content-type': contentType } : {}),
          ...reply.headers,
        });
        res.end(payload);
      };
      processRequest().catch((err: unknown) => {
        res.writeHead(500, { 'content-type': 'text/plain' });
        res.end(String(err));
      });
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  closers.push(
    () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  );
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind stub server');
  }
  return {
    baseURL: `http://127.0.0.1:${address.port}/ai/v1`,
    requests,
  };
}
