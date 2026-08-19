# @alore/auth-react-ui

## 1.2.0-alpha.23

### Patch Changes

- e1c11e1: Fix passkey signup freeze and un-gate PRF from passkey-only deployments (JOO-1792 / joori#2670)

  - register: handle `PASSKEY_NOT_SUPPORTED` in `localRCRSign` — the account is already created at this point, so the machine now lands on `passkeyCreatedButNotAuthenticated` instead of freezing on the spinner
  - register/login: request PRF/largeBlob extensions and require a wallet secret only when `enableWalletCreation` is enabled; wallet-less deployments now register/log in normally with passkeys that lack PRF support
  - extract shared `buildWalletExtensions`/`resolveWalletSecret` helpers (Safari largeBlob quirk preserved)
  - add vitest suite for the auth machine and extension helpers (first tests in the repo)
  - upgrade `@simplewebauthn/browser` 7.4.0 -> 13.3.0 (object-form `startAuthentication`), drop unused dep from example

- Updated dependencies [e1c11e1]
  - @alore/auth-react-sdk@1.1.0-alpha.13

## 1.2.0-alpha.22

### Patch Changes

- 0154948: Keep the authenticated session when `authProviderConfigs` change. A new frontend
  deploy bakes different env-derived values (URLs, flags) into the config object;
  the persisted-state guard treated that as a reason to discard the entire
  persisted auth snapshot — including the access/refresh tokens — logging every
  user out on every deploy. Now a config change only resets login-flow UI state:
  when the persisted snapshot is an authenticated session
  (`active.login.successfulLogin` with a `sessionUser`), the session is kept and
  the incoming configs are adopted.

## 1.2.0-alpha.21

### Patch Changes

- 9568124: fix(auth-ui): prevent useEffect race resetting forgot-password state

  The authProviderConfigs useEffect read forgotPasswordSession from a stale
  closure, causing it to send RESET during an active password-reset flow.
  Added URL param guard (salt + token) that reads directly from
  window.location.search.

## 1.2.0-alpha.20

### Patch Changes

- 0a40829: Fix message of reset password final step

## 1.2.0-alpha.19

### Minor Changes

- Add device trust flag for email 2FA.

### Patch Changes

- Updated dependencies
  - @alore/auth-react-sdk@1.1.0-alpha.12

## 1.2.0-alpha.18

### Minor Changes

- 83f6aea: default alignment at the input labels changed to left

## 1.2.0-alpha.17

### Minor Changes

- 2b9373c: UI customization

## 1.2.0-alpha.16

### Minor Changes

- c87a10d: Login UI customization

## 1.2.0-alpha.15

### Patch Changes

- 09a0454: password reset functionality
- Updated dependencies [09a0454]
  - @alore/auth-react-sdk@1.1.0-alpha.11

## 1.2.0-alpha.14

### Minor Changes

- 86634cb: Added sessionId again

### Patch Changes

- Updated dependencies [86634cb]
  - @alore/auth-react-sdk@1.1.0-alpha.10

## 1.2.0-alpha.13

### Patch Changes

- Updated dependencies [6029d70]
  - @alore/auth-react-sdk@1.1.0-alpha.9

## 1.2.0-alpha.12

### Minor Changes

- c5c6370: Removed session_id

### Patch Changes

- Updated dependencies [c5c6370]
  - @alore/auth-react-sdk@1.1.0-alpha.8

## 1.2.0-alpha.11

### Minor Changes

- 0ff983c: provider config handle from backend

### Patch Changes

- Updated dependencies [0ff983c]
  - @alore/auth-react-sdk@1.1.0-alpha.7

## 1.2.0-alpha.10

### Patch Changes

- 02934ec: improved error handling
- Updated dependencies [02934ec]
  - @alore/auth-react-sdk@1.1.0-alpha.6

## 1.2.0-alpha.9

### Patch Changes

- Updated dependencies [410c803]
  - @alore/auth-react-sdk@1.1.0-alpha.5

## 1.2.0-alpha.8

### Patch Changes

- 34d2f9b: improvements in errors

## 1.2.0-alpha.7

### Patch Changes

- 1ae4c34: detailed error message

## 1.2.0-alpha.6

### Patch Changes

- 4d2a1db: enhance error handling
- Updated dependencies [4d2a1db]
  - @alore/auth-react-sdk@1.1.0-alpha.4

## 1.2.0-alpha.5

### Patch Changes

- bf69bad: fix packages build
- Updated dependencies [bf69bad]
  - @alore/auth-react-sdk@1.1.0-alpha.3

## 1.2.0-alpha.4

### Patch Changes

- 2efdf28: fix build
- Updated dependencies [2efdf28]
  - @alore/auth-react-sdk@1.1.0-alpha.2

## 1.2.0-alpha.3

### Patch Changes

- c0ae06e: .
- Updated dependencies [c0ae06e]
  - @alore/auth-react-sdk@1.1.0-alpha.1

## 1.2.0-alpha.2

### Minor Changes

- 2bbea48: optional domain restriction

### Patch Changes

- Updated dependencies [2bbea48]
  - @alore/auth-react-sdk@1.1.0-alpha.0

## 1.1.1-alpha.1

### Patch Changes

- fdf7791: .

## 1.1.1-alpha.0

### Patch Changes

- e8daf4d: .
