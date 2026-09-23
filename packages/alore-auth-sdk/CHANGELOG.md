# @alore/auth-react-sdk

## 1.1.0-alpha.15

### Minor Changes

- 14e6ba8: feat(auth): finish Microsoft sign-in and sign-up

  MSAL's client id now comes from the project's own `social_login_providers`
  row (carried on `socialProviders`, beside Google's) instead of
  `NEXT_PUBLIC_MICROSOFT_ID`, so one deployment's build env no longer outranks
  per-project configuration. The `PublicClientApplication` is built once per
  client id rather than on every render, `redirectUri` is pinned to the origin
  (MSAL otherwise sends the current page and Entra answers AADSTS50011), the
  requested scopes are the OIDC set including `email`, and `MsalProvider`
  mounts only where Microsoft is configured.

  Where the provider does not vouch for the address, the backend emails a code
  and answers 403 with a session; `socialLogin` reads that as a step rather
  than a failure and parks in `login.socialEmailCode` holding the id_token,
  which the code screen sends back with the code. A wrong code returns to that
  screen with the challenge intact. A token with no address at all surfaces as
  `SOCIAL_EMAIL_MISSING` with copy that explains it, in both locales.

  Register gains the Microsoft button, and the provider map branches on
  `providerName` explicitly — its `else` rendered the Microsoft button for any
  non-Google provider.

## 1.1.0-alpha.14

### Patch Changes

- c3d62ce: Passwordless social login over a verified id_token (JOO social-login)

  The existing `googleLogin` flow posts a provider **access token**. An access token carries no audience a relying party can verify, so the backend could not distinguish a token minted for this app from one minted for any other Google application. The new `/auth/v1/social-login` endpoint takes an OIDC **id_token**, verifies it against the provider's published keys (signature, `iss`, `aud`, `exp`, `nonce`), and returns a full session — no OTP round trip and no password step.

  - `sdk`: new `socialLogin` service posting `{ idToken, provider }`, reporting `isNewUser` from a `201`
  - `ui`: `socialLogin` machine state — `201` targets `register.userCreated` so `onRegister` fires, anything else lands in `successfulLogin` for `onLogin`
  - `ui`: `active.login.socialLogin` added to **both** callback allowlists in `Auth.tsx`; a state missing from either means neither callback fires and the user is bounced back to the login screen holding valid tokens
  - `ui`: Google now uses the rendered `<GoogleLogin>` button, because its `credential` **is** the id_token — `useGoogleLogin` only yields an access token. Microsoft keeps its existing button and sends `response.idToken`, which MSAL already returns
  - `ui`: Portuguese copy overrides that Joori carried as a `dist/` patch are now in the package, so that patch can be deleted
  - tests: the 200/201 split is pinned in the machine suite

  The legacy `googleLogin` / `verifyGoogleLogin` pair is untouched and still password-backed.

  **Consumer note:** a project must have social login enabled and a provider `client_id` configured on the Alore side before `/auth/v1/social-login` will answer; it returns `403 SOCIAL_LOGIN_DISABLED` or `403 SOCIAL_PROVIDER_NOT_CONFIGURED` otherwise. A Microsoft token can currently only sign in an already-linked subject — Microsoft documents its `email` claim as mutable and not for authorization, so it cannot be used to find or create an account.

- 7559e22: Expose the social provider's profile photo on the session user

  `SessionUser` gains `picture` (the provider-hosted photo URL, always https, or
  `null`), so a consuming app can seed an avatar from the first social sign-in.
  `nickname` is typed `string | null` to match what the server actually returns —
  a social account with no `name` claim, and any passwordless account, has none.

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
