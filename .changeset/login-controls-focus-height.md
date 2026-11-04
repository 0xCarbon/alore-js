---
'@alore/auth-react-ui': patch
---

fix(ui): keyboard-only focus rings on buttons and checkboxes; 40px text inputs

- Buttons and checkboxes ring only on `:focus-visible` (2px primary ring, 2px white offset), never on a mouse click. The email-code, social-email-code and 2FA submit buttons carried flowbite's `focus:ring-2 focus:ring-red-300`, which flashed a pink ring on every click; the checkbox theme and the "trust this device" checkbox rang on click too. The shared class is exported from the themes as `FOCUS_RING`. Text fields keep their ring on `:focus`.
- The primary-colour email-code and social-email-code submit buttons no longer turn red on hover (leftover `enabled:hover:bg-red-700`).
- Text inputs are explicitly `h-10` (40px) at the default size, matching the default button height.
