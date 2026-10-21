---
'@alore/auth-react-ui': minor
---

feat(ui): let consumers choose Google button wording and Register's email placeholder

- `<Auth loginGoogleButtonText registerGoogleButtonText>` (and `googleButtonText` on `<Login>` / `<Register>`) pick GSI's `text`: `'signin_with' | 'signup_with' | 'continue_with' | 'signin'`. Defaults are unchanged: Login `continue_with`, Register `signup_with`. The Microsoft button beside it follows the same choice (new `signinMicrosoft` dictionary key for the sign-in options).
- `<Auth registerEmailInputLabel>` (and `emailInputLabel` on `<Register>`) overrides Register's email placeholder, as `emailInputLabel` already does on Login. Invited users keep the invite hint. Unset, the dictionary text is used as before.
- `GoogleButtonText` is exported as a type.
