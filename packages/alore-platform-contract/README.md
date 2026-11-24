# @alore/platform-contract

The contract of the Alore AI API under `/ai/v1`: the upstream OpenAI OpenAPI spec, pinned and cut to the
routes Alore serves, plus an `x-alore` overlay, JSON Schemas, fixtures and the webhook envelope.

This repository is public. Keep the package to the contract: no handler paths, internal hostnames,
customer data, credentials or call-site details.

Status: alpha prerelease (changesets pre mode, tag `alpha`). Nothing consumes the package yet. The conformance runner and the SDK
layer are separate packages or later releases. The fake server ships here as `@alore/platform-contract/fake`.

## Layout

| Path                             | What it is                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `openapi/upstream/openapi.yaml`  | the official spec at one commit of `github.com/openai/openai-openapi` (MIT, see `LICENSE`)      |
| `openapi/upstream/PIN.json`      | repository, commit, URL, sha256 and spec version of that file                                   |
| `openapi/openai.pinned.yaml`     | generated: the upstream spec cut to the routes Alore serves                                     |
| `openapi/x-alore.overlay.yaml`   | OpenAPI Overlay 1.0: the only hand-written part of the OpenAPI document                         |
| `openapi/openapi.yaml`           | generated: pinned plus overlay. Never edited by hand                                            |
| `asyncapi/asyncapi.yaml`         | AsyncAPI 3.0, webhook envelope only                                                             |
| `schemas/*.schema.json`          | JSON Schema 2020-12 for Alore-owned objects. Outputs are closed (`additionalProperties: false`) |
| `fixtures/<area>/<case>.json`    | `{ schema, valid, instance }` examples. Every enum value appears in an accepted fixture         |
| `routes/served.yaml`             | the 91 routes the router serves: method, path, class, family, upstream flag, stub status        |
| `routes/planned.yaml`            | routes the contract promises and Alore does not serve yet                                       |
| `rules/.spectral.yaml`, `rules/` | Spectral rules, custom functions, the vendor-name deny list                                     |
| `fake/`                          | the fake Alore server, built from the files above (see Fake Alore)                              |
| `scripts/`                       | `cut.mjs`, `generate.mjs`, `lint.mjs` and `lib/`                                                |
| `test/`                          | node:test suites; `test/negative/` holds the negative controls                                  |

## Commands

Run them in the repository devcontainer.

```sh
pnpm install --frozen-lockfile
pnpm -F @alore/platform-contract generate   # cut upstream, apply the overlay, write both YAML files
pnpm -F @alore/platform-contract run lint   # overlay rules, Spectral, generated files up to date
pnpm -F @alore/platform-contract run test   # fixtures, generate, routes, negative controls, AsyncAPI
```

`pnpm -F @alore/platform-contract lint test` would pass `test` to the lint script as an argument, so the CI
workflow (`.github/workflows/contract-ci.yml`) runs the two scripts one after the other.

Set `CONTRACT_BASE_REF` (or pass `--base <ref>`) to lint to also compare the contract with a base commit.
CI does this on every pull request.

## How the OpenAPI document is built

1. `scripts/cut.mjs` keeps, from the pinned upstream spec, every operation of `routes/served.yaml` and of
   `routes/planned.yaml` that upstream defines, plus the components they reach. It sets `servers` to the
   `/ai/v1` base, drops `x-oaiMeta` documentation metadata, drops OpenAI's own `info.termsOfService`,
   `info.contact` and `info.license`, and changes nothing else. The cut is built from the
   route tables, never from a generated server spec, because a generated spec can omit routes the router serves.
2. The overlay is applied with a small Overlay 1.0 engine (`scripts/lib/overlay.mjs`). Targets use a JSONPath
   subset; `remove` actions are rejected.
3. `info.version` and `x-alore-contract.version` are set to the package version. `changeset version` bumps the
   package, so the release workflow runs `pnpm run version-packages` (`changeset version`, then `generate`);
   running only `changeset version` leaves a stale stamp that lint and the tests reject.

The overlay sets Alore's `info.contact`. The document has no `termsOfService`. The MIT attribution of the
upstream spec stays in `openapi/upstream/LICENSE` and the `x-upstream` block.

Paths in the document are relative to the `/ai/v1` server, as in upstream. Matching a served route to an
upstream operation ignores path-parameter names (`/responses/{id}` is `/responses/{response_id}`).

## Rules, enforced by `pnpm run lint`

- The overlay only adds, and what it may add to a node the pinned spec defines is an allowlist: `description`,
  `title`, `example`/`examples`, `x-` marks and new entries under `properties`, plus whole new paths,
  operations and components. An upstream stub can also add an `AloreProblem` response for HTTP 501. Any other key on an upstream node (`enum`, `minProperties`, `propertyNames`,
  `multipleOf`, `discriminator`, `requestBody`, a `type`, ...) fails, as does a changed or removed value, a
  required field that was optional, a required parameter, or a value added to an OpenAI-defined enum. Alore-owned
  enums live in `schemas/`, not in the overlay.
- A property the overlay adds to an upstream schema carries `x-alore-feature` (rule `feature-gate`): a client that
  did not negotiate the feature never sees it.
- Upstream first. A path, operation or schema name is defined by the overlay only where the pinned spec has no
  equivalent, comparing paths with parameter names erased and `-` read as `_`. Where upstream has one, the overlay
  marks its status and Alore implements the upstream shape. The check runs against the whole upstream document,
  not only the cut. The five `/fine-tuning/jobs*` stubs are the one closed exception (see Known gaps): they carry
  `x-upstream-equivalent`, not the `x-alore` tag, and a new near-duplicate path fails.
- Every operation has `x-status`: `live`, `stub`, `planned` or `legacy-replaced`. A deprecation adds
  `x-deprecated-since`; the Assistants and Threads emulation carries it on every route. Every stub carries
  `x-stub-response: 501` and `responses['501']` referencing `AloreProblem`. The contract answer of a stub is
  501 `not_implemented`. Stubs backed by an upstream operation keep the upstream responses in the document. `routes/served.yaml`
  (`stub_returns`) records what the router answers today, a constant `200` for most stubs, until INC-202 turns them
  into 501. A conformance run expects 501 and lists the stubs that still answer 200 as expected failures.
- Alore-owned outputs are closed. Inputs ignore unknown fields, except a field that narrows a grant, a search
  or a scope: that one is strict or feature-negotiated. Reviewer-only: no check tells an input from an output.
- No model, worker or vendor name appears in a schema, the overlay or the event spec, except `model` enums that
  list aliases (`anga-1-mirim`, `anga-1-saci`). The deny list is `rules/vendor-names.json`.
- Errors are `application/problem+json` with a `type` from the closed list (`not_found`, `invalid_request`,
  `rate_limited`, `unavailable`, `conflict`, `payload_too_large`, `unsupported_media_type`, `contract_version`,
  `not_implemented`) and the OpenAI-style `error{type, message, code}` object.
- Ids are plain strings: no `uuid` format, no pattern.
- Every change to a schema, the overlay, the event spec, the route tables or the pin needs a new classified
  changeset (next section). `lint` compares with `CONTRACT_BASE_REF` and fails on a ref git does not know.

Reviewer checklist for a contract change: is there an upstream equivalent at the pin; does the change keep a
standard OpenAI client working with every extension ignored; is a new optional field on a closed output gated by
a negotiated feature or the contract version; does the changeset say which class it is.

## Changing the contract

Add a changeset for `@alore/platform-contract` (`pnpm changeset`). `changeset version` writes it into
`CHANGELOG.md`, which changesets own. Its summary starts with the class:

- `additive:` a new optional field, a new enum value on an Alore-owned enum, a new path or a new status mark.
  A new optional field on a closed output is additive only when it is gated by the contract version or a
  negotiated feature; without the gate it is breaking. Additive changes need a minor version bump.
- `deprecating:` adds `x-deprecated-since` and needs a minor version bump. The route or field keeps working
  for at least one minor version.
- `breaking:` anything else. It needs a new major version.

`pnpm run lint` fails when the contract surface differs from the base and the pull request adds no changeset
for this package with the corresponding bump. Changesets already consumed by a prerelease do not count.

## Fake Alore

`@alore/platform-contract/fake` is a deterministic stand-in for `/ai/v1`, for Joori and crawler integration specs, ui-lab and
handoff units. It is never deployed. It has no dependency beyond the package's own (`ajv`, `ajv-formats`, `yaml`) and only
listens on loopback.

```js
import { createFake } from '@alore/platform-contract/fake';

const fake = createFake({
  features: ['files.status'], // what GET /meta lists; x_alore is emitted when files.status is on
  webhookUrl: 'http://127.0.0.1:3000/webhooks/alore/v1', // optional; events are always recorded
  client: 'joori-dev',
  orgRef: 'org-1',
});
const { baseURL } = await fake.listen(); // http://127.0.0.1:<port>/ai/v1
const file = fake.seedFile({ filename: 'a.pdf', status: 'extracting' });
await fake.setFileStatus(file.id, 'text_ready'); // emits file.text_ready, signed, to webhookUrl
await fake.close();
```

As a process: `alore-fake --port 4010 --feature files.status --webhook-url <url>` (the secret is read from the variable
named by `--webhook-secret-env`, else a published fake secret is used). The first output line is `listening <baseURL>`.

Nothing is copied from the contract into the fake:

- The route table is the operations of `openapi/openapi.yaml`. A request is matched on method and path template, static
  paths before parameter paths. An unknown route answers `404 not_found`.
- A route answers a fixture only where the contract already types the response: `GET /meta`, `GET /files`,
  `GET /files/{id}` and `DELETE /files/{id}`. Every other operation answers `501 not_implemented` naming its `operationId`
  and `x-status`; the live extension routes gain behaviour when a later contract release types their bodies.
- Every body the fake sends is validated before it leaves, against the response schema of its operation (pinned OpenAI
  schemas and the `schemas/` objects) or `problem.schema.json`. The fake refuses to start when a fixture it builds on
  (`fixtures/meta/basic.json`, `fixtures/errors/<type>.json`) does not validate. A body that fails answers 500
  `fake-alore: ...` so a spec cannot pass on it.
- Problems are the `fixtures/errors/*.json` instances with a specific `detail`, as `application/problem+json`.
- `GET /meta` serves `fixtures/meta/basic.json` with `contract` set to the package version and `features` set by the option.
- OpenAI's deprecated `status` is required on the pinned file object, so the fake maps Alore's status onto it: `ready` and
  `deleted` are `processed`, `failed` is `error`, anything else is `uploaded`.

`X-Fake-Scenario` makes any request under `/ai/v1` fail on demand, before routing:

| value             | answer                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `rate_limited`    | 429 `rate_limited`, with `Retry-After: 1`                                                    |
| `unavailable`     | 503 `unavailable`                                                                            |
| `not_implemented` | 501 `not_implemented`                                                                        |
| `expired`         | 404 `not_found` with `error.code` `expired` (the closed problem list has no type of its own) |

An unknown value answers `400 invalid_request`. The header applies to one request only.

Webhooks use the `alore.evt/1` envelope and Standard Webhooks headers (`webhook-id`, `webhook-timestamp`,
`webhook-signature`, HMAC-SHA256 over `id.timestamp.body`). `emit(type, { subject, data })` validates the envelope against
`webhook-envelope.schema.json` before sending, numbers `seq` per subject and records the event. `setFileStatus` emits for
`received`, `text_ready`, `ready`, `failed` and `deleted`; `DELETE /files/{id}` emits `file.deleted`. A receiver that fails
is recorded in `fake.deliveries`, not thrown; `redeliver(eventId)` repeats the same `webhook-id` and body, so receivers can
test their dedupe.

Determinism: the clock is fixed (`now`, default `2026-01-01T12:00:00.000Z`) and moves only with `advance(ms)`; ids are
counters (`file-fake-0001`, `evt-0001`); no response has a `Date` header; no randomness. Two runs with the same inputs give
byte-identical responses, events and request logs (`test/fake.test.mjs`). `fake.requests` logs method, path, query, body,
scenario, status and the `x-*`, `idempotency-key`, `content-type` and `openai-*` headers, with `authorization`, `x-api-key` and
`cookie` redacted, so a spec can assert that tenancy headers were sent.

A control surface sits outside the contract at `/__fake` for specs that drive the fake over HTTP: `GET /__fake/requests`,
`/__fake/events`, `/__fake/deliveries`, `POST /__fake/reset`, `POST /__fake/files`, `POST /__fake/files/{id}/status` and
`POST /__fake/events`.

The fake does not authenticate: it accepts `Authorization: Bearer` and `X-API-KEY` alike, or neither.

## Bumping the upstream pin

A pin bump is its own reviewed pull request with a diff report, and never rides along with a feature change:
download `openapi.yaml` at the new commit into `openapi/upstream/`, update `PIN.json` (commit, URL, sha256,
spec version), run `generate`, and attach the diff of `openai.pinned.yaml`. The lint then shows every overlay
action that no longer applies and every extension the new spec now covers.

## Known gaps in this release

- Live extension routes are seeded with their status only. Their request and response bodies are typed by later
  releases.
- The router serves the fine-tuning stubs under `/fine-tuning/jobs`; upstream defines `/fine_tuning/jobs`. That
  is an Alore router bug (INC-202). The overlay records the five served paths with `x-upstream-equivalent` and
  `x-status: stub`; they are not Alore extensions. Once the router is fixed, the overlay paths and the lint
  allowlist (`ROUTER_SPELLINGS` in `scripts/lib/checks.mjs`) go away.
- `GET /realtime` is not in the document: the planned list has 25 routes, not 26. INC-703 pins the Realtime
  revision first.
- The document declares `ApiKeyAuth` (bearer). Alore still requires `X-API-KEY` until INC-120, so a conformance
  run against the real service fails authentication until then.
- `POST /decisions` is planned as the upstream operation at the pin (`createDecision`). A decisions helper waits
  for that shape to be confirmed.
- A second drift check, between the server's generated spec and pinned plus overlay, runs in the server
  repository (INC-102) and is not part of this package. The pinned and overlay files and the route tables are
  exported for it.
