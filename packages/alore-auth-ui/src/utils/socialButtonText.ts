/**
 * Wording of Google's GSI-rendered button. GSI localises each value itself
 * (e.g. `continue_with` → "Continuar com o Google" in pt-BR), so these are
 * the only choices a consumer has over that button's text.
 */
export type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with' | 'signin';

/** Login has always rendered `continue_with`; kept as the default. */
export const DEFAULT_LOGIN_GOOGLE_BUTTON_TEXT: GoogleButtonText = 'continue_with';

/** Register has always rendered `signup_with`; kept as the default. */
export const DEFAULT_REGISTER_GOOGLE_BUTTON_TEXT: GoogleButtonText = 'signup_with';

type MicrosoftLabels = {
  continueMicrosoft?: string;
  signupMicrosoft?: string;
  signinMicrosoft?: string;
};

/**
 * The Microsoft button is ours, not GSI's, and copies the Google button beside
 * it — so it follows the same wording choice rather than reading as a
 * different action ("Continue with Google" next to "Sign up with Microsoft").
 */
export const microsoftButtonLabel = (
  text: GoogleButtonText,
  labels: MicrosoftLabels | undefined,
): string | undefined => {
  switch (text) {
    case 'signup_with':
      return labels?.signupMicrosoft;
    case 'signin_with':
    case 'signin':
      return labels?.signinMicrosoft;
    case 'continue_with':
    default:
      return labels?.continueMicrosoft;
  }
};

/**
 * Placeholder of Register's email field. An invited user's address is
 * prefilled and locked, so the invite hint wins over any override; otherwise a
 * consumer override replaces the dictionary text, as on Login.
 */
export const registerEmailPlaceholder = ({
  inviteToken,
  emailInputLabel,
  emailLabel,
  emailInvitePlaceholder,
}: {
  inviteToken?: string;
  emailInputLabel?: string;
  emailLabel?: string;
  emailInvitePlaceholder?: string;
}): string => {
  if (inviteToken) return `${emailInvitePlaceholder}`;
  return emailInputLabel || `${emailLabel}`;
};
