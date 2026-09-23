# @alore/auth-react-ui

## 1.2.0-alpha.27

### Minor Changes

- 9a45986: Retire the access-token social login flow

  `googleLogin` and `verifyGoogleLogin` are removed from the SDK, along with the `GOOGLE_LOGIN` and `COMPLETE_GOOGLE_SIGN_IN` events, the `googleLogin`/`verifyingGoogleLogin` machine states, and the `googleOtpCode`/`googleUser` context fields. The backend routes they called — `/auth/v1/google-login` and `/auth/v1/google-2fa-verification` — are removed in the same release.

  They sent a provider **access token**, which carries no audience the backend can verify, so a token minted for any other application was accepted as proof of identity; the Microsoft branch additionally trusted Graph's `mail`, which a tenant administrator sets freely. The endpoint also returned the OTP code in its own response body, so the step that followed added nothing.

  `socialLogin` replaces it. It sends an OIDC `id_token`, whose audience the backend checks against the project's configured client id.

  Register's forge fallback now renders the same verified-`id_token` Google button as the configured path, so the flow behind it is identical everywhere. It needs no new configuration: the client id comes from `<Auth googleId>`, which is independent of `socialProviders`.

  **Breaking:** any consumer calling `googleLogin`/`verifyGoogleLogin` directly, or sending `GOOGLE_LOGIN`/`COMPLETE_GOOGLE_SIGN_IN` to the machine, must move to `SOCIAL_LOGIN` with an `id_token`.

### Patch Changes

- d0bc623: Fix the silent resend button and tell expired codes apart from wrong ones

  **Resend.** `resendSecureCode` returned early when the salt was missing, but still armed the 15-second cooldown — so the button reported success, started counting down, and never sent a request. It now sends when it can, arms the cooldown only after a request goes out, and says what is wrong when it cannot: resending re-runs login verification, so it needs the password to rebuild the hash. The e-mail falls back to `credentialEmail` when the e-mail form is no longer mounted.

  **Resend cooldown.** The button is blocked for 30 seconds, and now starts blocked when the code step opens rather than only after a resend. 30 is not arbitrary: the emailed code is a 30-second TOTP, so a resend inside that window re-sends the same digits — a round trip and a second email for a code the user already has. Repeat resends escalate in multiples of it.

  **Error copy.** An expired code and a wrong code are different problems with different remedies, and the header collapsed both into the generic failure message while the field below showed the specific one. Each now has its own title and description, and neither shows a raw error code.

  The matching backend change raises the emailed-code lifetime to 10 minutes.

- Updated dependencies [9a45986]
  - @alore/auth-react-sdk@1.1.0-alpha.17

## 1.2.0-alpha.26

### Patch Changes

- 0c0221b: fix(auth): let the app choose where the Microsoft popup returns

  MSAL reads the token off the popup window's URL fragment. Returning to the
  app's own origin works only for an app that does not navigate on load — one
  with locale routing or an auth guard replaces the URL first, and the sign-in
  dies with `hash_empty_error` having reached no backend at all, which is
  exactly what happened on joori-dev.

  `microsoftRedirectUri` on AuthProviderConfig points the popup at a page that
  does not boot the app (a blank static file is the documented choice). The
  default is unchanged.

- Updated dependencies [0c0221b]
  - @alore/auth-react-sdk@1.1.0-alpha.16

## 1.2.0-alpha.25

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

### Patch Changes

- Updated dependencies [14e6ba8]
  - @alore/auth-react-sdk@1.1.0-alpha.15

## 1.2.0-alpha.24

### Patch Changes

- 41ebe9c: Keyboard operability and visual consistency across the auth screens

  Several controls could not be reached by keyboard at all, and the two screens had drifted apart visually.

  **Keyboard**

  - Primary buttons had **no focus indicator**: `buttonTheme` carried `focus:ring-0`, which cancelled flowbite's base ring. Added a `focus-visible` ring (kept `focus:ring-0` so a mouse click stays clean).
  - `BackButton` was a `<span onClick>` — unreachable on every step that has a back action. Now a real `<button>`.
  - The password show/hide toggle had `tabIndex={-1}`, deliberately skipping it. Removed, with `aria-label`/`aria-pressed` added.
  - Forgot-password, sign-up/sign-in, resend-code and the 2FA method switches were `<div onClick>` and absent from the tab order. All are now buttons via a new `LinkButton`.
  - The terms checkbox label pointed at nothing (`htmlFor="agreedWithTerms"` against a `Checkbox` with no `id`), so clicking the label did nothing natively — which is why a wrapper `div onClick` faked it and also toggled the box when you clicked "termos de serviço". Fixed the association and removed the wrapper.
  - OTP digit inputs and text inputs gained visible focus rings.
  - Escape now triggers the same back action the visible back button does, on the steps that have one.

  **Consistency**

  - Register aligned to Login: icon sizes, form spacing, heading size on `createPassword`, and the method-selection cards now use the shared alignment helpers. The passkey card was missing `color="light"` and rendered as a filled primary button next to a light one.
  - Both footers are now centred and stacked, with the question as static text and only the call to action clickable — previously Register wrapped the whole sentence (question included) in the button, with a trailing arrow pointing forward on a link that goes back.

  **Sign up with Google**

  Register now renders the same verified-`id_token` Google button as Login, gated on the project's `socialProviders` rather than `forgeId`, and dispatches `SOCIAL_LOGIN`. The machine's register branch accepts that event, entering the same `socialLogin` state — the backend's 201-vs-200 answer already decides whether it ends in `register.userCreated` or `successfulLogin`. Google's own localised `signup_with` wording distinguishes it from Login's `continue_with`. The legacy `forgeId` access-token button now only renders when no social provider is configured, so nobody sees two Google buttons.

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

- Updated dependencies [c3d62ce]
- Updated dependencies [7559e22]
  - @alore/auth-react-sdk@1.1.0-alpha.14

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
