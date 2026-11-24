---
'@alore/platform-contract': minor
---

additive: first prerelease of the platform contract. The upstream OpenAI OpenAPI spec is pinned and cut to the
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
