---
'@alore/platform-contract': minor
---

additive: fake Alore server at `@alore/platform-contract/fake` and the `alore-fake` command, built from the contract's own files. It serves
non-streaming chat completions, files (multipart), multipart uploads, vector stores and their files from schema-checked fixtures, and answers
`X-Fake-Scenario` failures and signed webhooks deterministically. Problem bodies are checked against the response each operation declares.
`error.param` (nullable) is added to the problem schema's `error` object: the pinned OpenAI error object requires it, so an OpenAI client can
parse every problem the fake sends. `ajv`, `ajv-formats` and `yaml` move from dev to runtime dependencies.
