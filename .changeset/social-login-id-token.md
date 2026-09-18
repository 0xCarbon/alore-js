---
'@alore/auth-react-ui': patch
'@alore/auth-react-sdk': patch
---

Passwordless social login over a verified id_token (JOO social-login)

The existing `googleLogin` flow posts a provider **access token**. An access token carries no audience a relying party can verify, so the backend could not distinguish a token minted for this app from one minted for any other Google application. The new `/auth/v1/social-login` endpoint takes an OIDC **id_token**, verifies it against the provider's published keys (signature, `iss`, `aud`, `exp`, `nonce`), and returns a full session — no OTP round trip and no password step.

- `sdk`: new `socialLogin` service posting `{ idToken, provider }`, reporting `isNewUser` from a `201`
- `ui`: `socialLogin` machine state — `201` targets `register.userCreated` so `onRegister` fires, anything else lands in `successfulLogin` for `onLogin`
- `ui`: `active.login.socialLogin` added to **both** callback allowlists in `Auth.tsx`; a state missing from either means neither callback fires and the user is bounced back to the login screen holding valid tokens
- `ui`: Google now uses the rendered `<GoogleLogin>` button, because its `credential` **is** the id_token — `useGoogleLogin` only yields an access token. Microsoft keeps its existing button and sends `response.idToken`, which MSAL already returns
- `ui`: Portuguese copy overrides that Joori carried as a `dist/` patch are now in the package, so that patch can be deleted
- tests: the 200/201 split is pinned in the machine suite

The legacy `googleLogin` / `verifyGoogleLogin` pair is untouched and still password-backed.

**Consumer note:** a project must have social login enabled and a provider `client_id` configured on the Alore side before `/auth/v1/social-login` will answer; it returns `403 SOCIAL_LOGIN_DISABLED` or `403 SOCIAL_PROVIDER_NOT_CONFIGURED` otherwise. A Microsoft token can currently only sign in an already-linked subject — Microsoft documents its `email` claim as mutable and not for authorization, so it cannot be used to find or create an account.
