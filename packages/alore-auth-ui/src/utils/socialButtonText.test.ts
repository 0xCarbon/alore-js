import { describe, expect, it } from 'vitest';

import en from '../dictionaries/en.json';
import pt from '../dictionaries/pt.json';
import {
  DEFAULT_LOGIN_GOOGLE_BUTTON_TEXT,
  DEFAULT_REGISTER_GOOGLE_BUTTON_TEXT,
  microsoftButtonLabel,
  registerEmailPlaceholder,
} from './socialButtonText';

describe('Google button text defaults (unchanged for existing consumers)', () => {
  it('login keeps continue_with and register keeps signup_with', () => {
    expect(DEFAULT_LOGIN_GOOGLE_BUTTON_TEXT).toBe('continue_with');
    expect(DEFAULT_REGISTER_GOOGLE_BUTTON_TEXT).toBe('signup_with');
  });
});

describe('microsoftButtonLabel', () => {
  it('matches the previous hard-coded labels at the defaults', () => {
    expect(microsoftButtonLabel(DEFAULT_LOGIN_GOOGLE_BUTTON_TEXT, pt.auth)).toBe(
      pt.auth.continueMicrosoft,
    );
    expect(microsoftButtonLabel(DEFAULT_REGISTER_GOOGLE_BUTTON_TEXT, pt.auth)).toBe(
      pt.auth.signupMicrosoft,
    );
  });

  it('follows the Google wording choice', () => {
    expect(microsoftButtonLabel('continue_with', pt.auth)).toBe('Continuar com a Microsoft');
    expect(microsoftButtonLabel('signin_with', en.auth)).toBe('Sign in with Microsoft');
    expect(microsoftButtonLabel('signin', en.auth)).toBe('Sign in with Microsoft');
  });

  it('has a label for every option in every locale', () => {
    [en.auth, pt.auth].forEach((labels) => {
      (['signin_with', 'signup_with', 'continue_with', 'signin'] as const).forEach((text) => {
        expect(microsoftButtonLabel(text, labels)).toBeTruthy();
      });
    });
  });
});

describe('registerEmailPlaceholder', () => {
  const dict = pt.auth.register;

  it('defaults to the dictionary label', () => {
    expect(
      registerEmailPlaceholder({
        emailLabel: dict.emailLabel,
        emailInvitePlaceholder: dict.emailInvitePlaceholder,
      }),
    ).toBe('Insira seu e-mail');
  });

  it('uses the consumer override when given', () => {
    expect(
      registerEmailPlaceholder({
        emailInputLabel: 'Seu e-mail',
        emailLabel: dict.emailLabel,
        emailInvitePlaceholder: dict.emailInvitePlaceholder,
      }),
    ).toBe('Seu e-mail');
  });

  it('keeps the invite hint for invited users even with an override', () => {
    expect(
      registerEmailPlaceholder({
        inviteToken: 'tok',
        emailInputLabel: 'Seu e-mail',
        emailLabel: dict.emailLabel,
        emailInvitePlaceholder: dict.emailInvitePlaceholder,
      }),
    ).toBe(dict.emailInvitePlaceholder);
  });
});
