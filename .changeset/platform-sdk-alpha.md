---
'@alore/platform-sdk': minor
---

First alpha prerelease of `@alore/platform-sdk`, a thin typed layer over the official `openai` SDK for the Alore `/ai/v1` API.

- Requires `TenancyContext` at compile time and runtime (`X-Alore-Org`, `X-USER-ID`, `X-Alore-Data-Class`, optional `X-Alore-Grant`) and provides `deriveDataClass()`.
- Supports `Authorization: Bearer` (default) and `X-API-KEY` transition (`authMode: 'api-key'`).
- Adds typed `x-alore` extension fields and helpers (`files`, `search`, `ocr`, `decisions`, `jobs`, `conversations`, `responses.readOnly`, `meta`) routed through the official `openai` SDK's generic HTTP methods.
- Enforces retry gating (idempotent methods or explicit `Idempotency-Key`), RFC 9457 `application/problem+json` typed error mapping extending `OpenAI.APIError`, once-per-process `meta()` contract semver verification, and Standard Webhooks verification for `alore.evt/1`.
