---
'@alore/auth-react-ui': patch
---

Keep the authenticated session when `authProviderConfigs` change. A new frontend
deploy bakes different env-derived values (URLs, flags) into the config object;
the persisted-state guard treated that as a reason to discard the entire
persisted auth snapshot — including the access/refresh tokens — logging every
user out on every deploy. Now a config change only resets login-flow UI state:
when the persisted snapshot is an authenticated session
(`active.login.successfulLogin` with a `sessionUser`), the session is kept and
the incoming configs are adopted.
