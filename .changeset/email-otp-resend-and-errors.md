---
'@alore/auth-react-ui': patch
---

Fix the silent resend button and tell expired codes apart from wrong ones

**Resend.** `resendSecureCode` returned early when the salt was missing, but still armed the 15-second cooldown — so the button reported success, started counting down, and never sent a request. It now sends when it can, arms the cooldown only after a request goes out, and says what is wrong when it cannot: resending re-runs login verification, so it needs the password to rebuild the hash. The e-mail falls back to `credentialEmail` when the e-mail form is no longer mounted.

**Resend cooldown.** The button is blocked for 30 seconds, and now starts blocked when the code step opens rather than only after a resend. 30 is not arbitrary: the emailed code is a 30-second TOTP, so a resend inside that window re-sends the same digits — a round trip and a second email for a code the user already has. Repeat resends escalate in multiples of it.

**Error copy.** An expired code and a wrong code are different problems with different remedies, and the header collapsed both into the generic failure message while the field below showed the specific one. Each now has its own title and description, and neither shows a raw error code.

The matching backend change raises the emailed-code lifetime to 10 minutes.
