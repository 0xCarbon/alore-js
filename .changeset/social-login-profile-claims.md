---
'@alore/auth-react-ui': patch
'@alore/auth-react-sdk': patch
---

Expose the social provider's profile photo on the session user

`SessionUser` gains `picture` (the provider-hosted photo URL, always https, or
`null`), so a consuming app can seed an avatar from the first social sign-in.
`nickname` is typed `string | null` to match what the server actually returns —
a social account with no `name` claim, and any passwordless account, has none.
