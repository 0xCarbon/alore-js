# @alore/platform-contract

The contract of the Alore AI API under `/ai/v1`: the upstream OpenAI OpenAPI spec, pinned and cut to the
routes Alore serves, plus an `x-alore` overlay, JSON Schemas, fixtures and the webhook envelope.

This repository is public. Keep the package to the contract: no handler paths, internal hostnames,
customer data, credentials or call-site details.

Status: `0.1.0-alpha.0`. Nothing consumes the package yet. The conformance runner, SDK layer and fake
server are separate packages or later releases.

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
   `/ai/v1` base, drops `x-oaiMeta` documentation metadata, and changes nothing else. The cut is built from the
   route tables, never from a generated server spec, because a generated spec can omit routes the router serves.
2. The overlay is applied with a small Overlay 1.0 engine (`scripts/lib/overlay.mjs`). Targets use a JSONPath
   subset; `remove` actions are rejected.
3. `info.version` is set to the package version.

Paths in the document are relative to the `/ai/v1` server, as in upstream. Matching a served route to an
upstream operation ignores path-parameter names (`/responses/{id}` is `/responses/{response_id}`).

## Rules, enforced by `pnpm run lint`

- The overlay only adds. It may add optional fields, enum values on Alore-owned enums (an extended enum carries
  `x-alore-enum-extension: true`), `x-` marks and new `/ai/v1` paths tagged `x-alore`. It never changes the type,
  requiredness or meaning of a field OpenAI defines, and it never adds a value to an OpenAI-defined enum.
- Upstream first. A path, operation or schema name is defined by the overlay only where the pinned spec has no
  equivalent. Where upstream has one, the overlay marks its status and Alore implements the upstream shape. The
  check runs against the whole upstream document, not only the cut.
- Every operation has `x-status`: `live`, `stub`, `planned` or `legacy-replaced`. A deprecation adds
  `x-deprecated-since`. A stub answers 501 `not_implemented` and never 200.
- Alore-owned outputs are closed. Inputs ignore unknown fields, except a field that narrows a grant, a search
  or a scope: that one is strict or feature-negotiated.
- A new optional field on a closed output is gated by `x-alore-feature`, and the change is additive only with the gate.
- No model, worker or vendor name appears in a schema, the overlay or the event spec, except `model` enums that
  list aliases (`anga-1-mirim`, `anga-1-saci`). The deny list is `rules/vendor-names.json`.
- Errors are `application/problem+json` with a `type` from the closed list (`not_found`, `invalid_request`,
  `rate_limited`, `unavailable`, `conflict`, `payload_too_large`, `unsupported_media_type`, `contract_version`,
  `not_implemented`) and the OpenAI-style `error{type, message, code}` object.
- Ids are plain strings: no `uuid` format, no pattern.
- Every change to a schema, the overlay, the event spec, the route tables or the pin needs a classified entry in
  `CHANGELOG.md` (`additive`, `deprecating` or `breaking`).

Reviewer checklist for a contract change: is there an upstream equivalent at the pin; does the change keep a
standard OpenAI client working with every extension ignored; is a new optional field on a closed output gated;
does the CHANGELOG entry say which class it is.

## Bumping the upstream pin

A pin bump is its own reviewed pull request with a diff report, and never rides along with a feature change:
download `openapi.yaml` at the new commit into `openapi/upstream/`, update `PIN.json` (commit, URL, sha256,
spec version), run `generate`, and attach the diff of `openai.pinned.yaml`. The lint then shows every overlay
action that no longer applies and every extension the new spec now covers.

## Known gaps in this release

- Live extension routes are seeded with their status only. Their request and response bodies are typed by later
  releases.
- The router serves the fine-tuning stubs under `/fine-tuning/jobs`; upstream defines `/fine_tuning/jobs`. The
  overlay records the served path.
- A second drift check, between the server's generated spec and pinned plus overlay, runs in the server
  repository and is not part of this package.
