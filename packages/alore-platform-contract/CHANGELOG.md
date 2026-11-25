# @alore/platform-contract

## 0.1.0-alpha.1

### Minor Changes

- cdd0657: additive: fake Alore server at `@alore/platform-contract/fake` and the `alore-fake` command, built from the contract's own files. It serves
  non-streaming chat completions, files (multipart), multipart uploads, vector stores and their files from schema-checked fixtures, and answers
  `X-Fake-Scenario` failures and signed webhooks deterministically. Problem bodies are checked against the response each operation declares.
  `error.param` (nullable) is added to the problem schema's `error` object: the pinned OpenAI error object requires it, so an OpenAI client can
  parse every problem the fake sends. `ajv`, `ajv-formats` and `yaml` move from dev to runtime dependencies.
- 49d89c1: additive: first prerelease of the platform contract. The upstream OpenAI OpenAPI spec is pinned and cut to the
  routes Alore serves, with an `x-alore` overlay, JSON Schema objects, fixtures and the webhook envelope.

  - Pins the upstream OpenAI OpenAPI spec and cuts it to the routes Alore serves (91 served routes: 37 OpenAI,
    9 live extensions, 3 replaced, 25 legacy-kept, 17 stubs).
  - `x-alore.overlay.yaml` seeds today's live non-OpenAI routes as `x-status: live`, marks the replaced routes
    `legacy-replaced`, marks the Assistants and Threads emulation `live` with `x-deprecated-since`, marks the 17
    stubs `stub` with `x-stub-response: 501` and an `AloreProblem` response for HTTP 501, and lists the
    planned routes as `planned`.
  - JSON Schema 2020-12 schemas for the problem body (closed list of nine types), the `meta` response, the file
    status object and the webhook envelope, each with fixtures.
  - AsyncAPI 3.0 document with the webhook envelope only.
  - Optional `x_alore` response field on the OpenAI file object, planned and gated by the `files.status` feature.
