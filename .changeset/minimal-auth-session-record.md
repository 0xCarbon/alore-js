---
'@alore/auth-react-ui': patch
---

Persist a minimal session record instead of the XState snapshot

`localStorage.authState` used to hold `JSON.stringify(state)`. After a password login that snapshot kept the `VERIFY_LOGIN` event in `event`, `_event` and `history`, and with it the client-side Argon2 `passwordHash`, which the server accepts as the password. It outlived logout and token revocation.

The key now holds only `{ v: 2, rpDomain?, context: { sessionUser } }`, with the session user's identity fields and tokens. The `context.sessionUser` path is unchanged, so apps that read the tokens from it keep working. A signed-in state writes the record; the login screen, a reset and logout remove the key.

On load, an old snapshot that holds a session is rewritten as the minimal record (the user stays signed in) and one that does not, including a half-finished login, is deleted.
