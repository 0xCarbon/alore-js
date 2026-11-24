---
'@alore/platform-contract': minor
---

additive: fake Alore server at `@alore/platform-contract/fake` and the `alore-fake` command, built from the contract's own files. It answers
the routes the contract types with schema-validated bodies, `X-Fake-Scenario` failures, and signed webhooks, deterministically. `ajv`,
`ajv-formats` and `yaml` move from dev to runtime dependencies.
