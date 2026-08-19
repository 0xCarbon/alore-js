---
'@alore/auth-react-ui': patch
'@alore/auth-react-sdk': patch
---

Fix passkey signup freeze and un-gate PRF from passkey-only deployments (JOO-1792 / joori#2670)

- register: handle `PASSKEY_NOT_SUPPORTED` in `localRCRSign` — the account is already created at this point, so the machine now lands on `passkeyCreatedButNotAuthenticated` instead of freezing on the spinner
- register/login: request PRF/largeBlob extensions and require a wallet secret only when `enableWalletCreation` is enabled; wallet-less deployments now register/log in normally with passkeys that lack PRF support
- extract shared `buildWalletExtensions`/`resolveWalletSecret` helpers (Safari largeBlob quirk preserved)
- add vitest suite for the auth machine and extension helpers (first tests in the repo)
- upgrade `@simplewebauthn/browser` 7.4.0 -> 13.3.0 (object-form `startAuthentication`), drop unused dep from example
