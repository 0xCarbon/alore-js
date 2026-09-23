---
'@alore/auth-react-ui': minor
'@alore/auth-react-sdk': minor
---

feat(auth): finish Microsoft sign-in and sign-up

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
