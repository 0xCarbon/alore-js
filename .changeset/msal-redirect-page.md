---
'@alore/auth-react-ui': patch
'@alore/auth-react-sdk': patch
---

fix(auth): let the app choose where the Microsoft popup returns

MSAL reads the token off the popup window's URL fragment. Returning to the
app's own origin works only for an app that does not navigate on load — one
with locale routing or an auth guard replaces the URL first, and the sign-in
dies with `hash_empty_error` having reached no backend at all, which is
exactly what happened on joori-dev.

`microsoftRedirectUri` on AuthProviderConfig points the popup at a page that
does not boot the app (a blank static file is the documented choice). The
default is unchanged.
