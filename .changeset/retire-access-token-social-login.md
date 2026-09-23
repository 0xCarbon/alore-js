---
'@alore/auth-react-sdk': minor
'@alore/auth-react-ui': minor
---

Retire the access-token social login flow

`googleLogin` and `verifyGoogleLogin` are removed from the SDK, along with the `GOOGLE_LOGIN` and `COMPLETE_GOOGLE_SIGN_IN` events, the `googleLogin`/`verifyingGoogleLogin` machine states, and the `googleOtpCode`/`googleUser` context fields. The backend routes they called — `/auth/v1/google-login` and `/auth/v1/google-2fa-verification` — are removed in the same release.

They sent a provider **access token**, which carries no audience the backend can verify, so a token minted for any other application was accepted as proof of identity; the Microsoft branch additionally trusted Graph's `mail`, which a tenant administrator sets freely. The endpoint also returned the OTP code in its own response body, so the step that followed added nothing.

`socialLogin` replaces it. It sends an OIDC `id_token`, whose audience the backend checks against the project's configured client id.

Register's forge fallback now renders the same verified-`id_token` Google button as the configured path, so the flow behind it is identical everywhere. It needs no new configuration: the client id comes from `<Auth googleId>`, which is independent of `socialProviders`.

**Breaking:** any consumer calling `googleLogin`/`verifyGoogleLogin` directly, or sending `GOOGLE_LOGIN`/`COMPLETE_GOOGLE_SIGN_IN` to the machine, must move to `SOCIAL_LOGIN` with an `id_token`.
