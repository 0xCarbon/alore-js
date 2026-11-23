---
'@alore/auth-react-ui': minor
---

Persist a minimal session record instead of the XState snapshot

`localStorage.authState` used to hold `JSON.stringify(state)`. After a password login that snapshot kept the `VERIFY_LOGIN` event in `event`, `_event` and `history`, and with it the client-side Argon2 `passwordHash`, which the server accepts as the password. It outlived logout and token revocation.

The key now holds only `{ v: 2, rpDomain?, context: { sessionUser } }`, with the session user's identity fields and tokens. The `context.sessionUser` path is unchanged, so apps that read the tokens from it keep working. A signed-in state writes the record; logout removes the key.

Behaviour change: `RESET` and the login screen now drop a stored session that used to survive. `RESET` targets `inactive` and does not clear the in-memory context, so the old code wrote the `inactive` or `active.login.idle` snapshot with `sessionUser` and both tokens still in it. The key is now removed in every state except a signed-in one. `<Auth>` sends `['CLEAR_ERROR', 'RESET', 'INITIALIZE']` on mount and whenever `authProviderConfigs` changes, and the Login and Register links send `RESET`, `INITIALIZE`, then `LOGIN` or `SIGN_UP`, so a signed-in user who reaches a screen that mounts `<Auth>` loses the stored tokens. An app that mounts `<Auth>` for a user who should stay signed in must not do so, or must restore the session itself.

The passkey rule is unchanged: a stored session is not restored when its `rpDomain` differs from the configured one, including when the stored one has none and the config has one.

On load, an old snapshot that holds a session is rewritten as the minimal record (the user stays signed in) and one that does not, including a half-finished login, is deleted.
