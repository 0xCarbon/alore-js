---
'@alore/auth-react-ui': patch
---

fix(auth-ui): prevent useEffect race resetting forgot-password state

The authProviderConfigs useEffect read forgotPasswordSession from a stale
closure, causing it to send RESET during an active password-reset flow.
Added URL param guard (salt + token) that reads directly from
window.location.search.
