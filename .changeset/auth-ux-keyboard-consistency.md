---
'@alore/auth-react-ui': patch
---

Keyboard operability and visual consistency across the auth screens

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
