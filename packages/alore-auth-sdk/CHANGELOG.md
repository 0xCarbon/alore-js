# @alore/auth-react-sdk

## 1.1.0-alpha.13

### Patch Changes

- e1c11e1: Fix passkey signup freeze and un-gate PRF from passkey-only deployments (JOO-1792 / joori#2670)

  - register: handle `PASSKEY_NOT_SUPPORTED` in `localRCRSign` — the account is already created at this point, so the machine now lands on `passkeyCreatedButNotAuthenticated` instead of freezing on the spinner
  - register/login: request PRF/largeBlob extensions and require a wallet secret only when `enableWalletCreation` is enabled; wallet-less deployments now register/log in normally with passkeys that lack PRF support
  - extract shared `buildWalletExtensions`/`resolveWalletSecret` helpers (Safari largeBlob quirk preserved)
  - add vitest suite for the auth machine and extension helpers (first tests in the repo)
  - upgrade `@simplewebauthn/browser` 7.4.0 -> 13.3.0 (object-form `startAuthentication`), drop unused dep from example

## 1.1.0-alpha.12

### Minor Changes

- Add device trust flag for email 2FA.

## 1.1.0-alpha.11

### Patch Changes

- 09a0454: password reset functionality

## 1.1.0-alpha.10

### Minor Changes

- 86634cb: Added sessionId again

## 1.1.0-alpha.9

### Patch Changes

- 6029d70: fix local url logic

## 1.1.0-alpha.8

### Minor Changes

- c5c6370: Removed session_id

## 1.1.0-alpha.7

### Minor Changes

- 0ff983c: provider config handle from backend

## 1.1.0-alpha.6

### Patch Changes

- 02934ec: improved error handling

## 1.1.0-alpha.5

### Patch Changes

- 410c803: fix cf header

## 1.1.0-alpha.4

### Patch Changes

- 4d2a1db: enhance error handling

## 1.1.0-alpha.3

### Patch Changes

- bf69bad: fix packages build

## 1.1.0-alpha.2

### Patch Changes

- 2efdf28: fix build

## 1.1.0-alpha.1

### Patch Changes

- c0ae06e: .

## 1.1.0-alpha.0

### Minor Changes

- 2bbea48: optional domain restriction
