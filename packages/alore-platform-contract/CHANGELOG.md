# @alore/platform-contract

Every change to a schema, the overlay, the event spec, the route tables or the upstream pin needs an
entry here. Start each entry with its class:

- `additive`: a new optional field, a new enum value on an Alore-owned enum, a new path or a new status mark.
  A new optional field on a closed output is additive only when it is gated by the contract version or a
  negotiated feature; without the gate it is breaking.
- `deprecating`: adds `x-deprecated-since`. The route or field keeps working for at least one minor version.
- `breaking`: anything else. It needs a new major version.

`pnpm lint` fails when the contract surface differs from the base branch and this file has no new classified entry.

## Unreleased

- additive: first release. Pins the upstream OpenAI OpenAPI spec and cuts it to the routes Alore serves
  (91 served routes: 37 OpenAI, 9 live extensions, 3 replaced, 25 legacy-kept, 17 stubs).
- additive: `x-alore.overlay.yaml` seeds today's live non-OpenAI routes as `x-status: live`, marks the replaced
  routes `legacy-replaced`, marks the Assistants and Threads emulation `live` with `x-deprecated-since`, marks the
  17 stubs `stub`, and lists the planned routes as `planned`.
- additive: JSON Schema 2020-12 schemas for the problem body (closed list of nine types), the `meta` response,
  the file status object and the webhook envelope, each with fixtures.
- additive: AsyncAPI 3.0 document with the webhook envelope only.
- additive: optional `x_alore` response field on the OpenAI file object, planned and gated by the `files.status`
  feature.
