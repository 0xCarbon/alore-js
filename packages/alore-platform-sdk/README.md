# @alore/platform-sdk

Thin typed TypeScript layer over the official [`openai`](https://www.npmjs.com/package/openai) SDK for the Alore `/ai/v1` API.

All standard OpenAI surfaces (`files`, `uploads`, `vectorStores`, `chat`, `responses`, `embeddings`, `audio`, `models`, `batches`) are delegated directly to the official `OpenAI` client exposed at `client.openai`. This package adds only what the upstream OpenAI SDK does not provide:

- Compile-time and runtime required `TenancyContext` headers (`X-Alore-Org`, `X-USER-ID`, `X-Alore-Data-Class`, optional `X-Alore-Grant`).
- Authentication mode support for standard `Authorization: Bearer <key>` (default) and legacy `X-API-KEY` transition (`authMode: 'api-key'`).
- Typed `x_alore` fields matching `@alore/platform-contract` (`AloreFileExtension`, `AloreMeta`, `AloreProblem`, `AloreEvent`).
- Extension route helpers (`files.status/text/fromUrl/register/reprocess`, `search`, `ocr`, `decisions`, `jobs`, `conversations`, `responses.readOnly`, `meta`) routed through the underlying `openai` client's generic `get`/`post`/`delete`.
- Retry gating: retries occur only on idempotent HTTP methods (`GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE`) or when an `Idempotency-Key` is provided.
- RFC 9457 `application/problem+json` mapping to typed `AloreProblemError` subclasses (extending `OpenAI.APIError`).
- Standard Webhooks signature verification (`verifyWebhook`) against the closed `alore.evt/1` envelope.
- Once-per-process `meta()` contract compatibility check against `minContract`.

## Usage

```ts
import { aloreClient, deriveDataClass, verifyWebhook } from '@alore/platform-sdk';

const client = aloreClient(
  {
    baseURL: 'https://api.bealore.com/ai/v1',
    apiKey: process.env.ALORE_CLIENT_KEY!,
    minContract: '0.1.0-alpha.0',
  },
  {
    orgRef: 'org-1',
    subjectRef: 'user-1',
    dataClass: deriveDataClass('customer-upload'),
  },
);

const meta = await client.meta();
const completion = await client.openai.chat.completions.create({
  model: 'anga-1-saci',
  messages: [{ role: 'user', content: 'Hello' }],
});
const fileStatus = await client.files.status('file-id');

// Verify incoming Standard Webhooks deliveries
const event = verifyWebhook(rawBody, req.headers, process.env.ALORE_WEBHOOK_SECRET!);
```

## Commands

```sh
pnpm -F @alore/platform-sdk run build
pnpm -F @alore/platform-sdk run typecheck
pnpm -F @alore/platform-sdk run test
```
