---
'@alore/auth-react-ui': patch
---

Fix the silent resend button and tell expired codes apart from wrong ones

**Resend.** `resendSecureCode` returned early when the salt was missing, but still armed the 15-second cooldown — so the button reported success, started counting down, and never sent a request. It now sends when it can, arms the cooldown only after a request goes out, and says what is wrong when it cannot: resending re-runs login verification, so it needs the password to rebuild the hash. The e-mail falls back to `credentialEmail` when the e-mail form is no longer mounted.

**Error copy.** An expired code and a wrong code are different problems with different remedies, and the header collapsed both into the generic failure message while the field below showed the specific one. Each now has its own title and description, and neither shows a raw error code.

The matching backend change raises the emailed-code lifetime to 10 minutes.
