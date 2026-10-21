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

  // What GSI renders for each `text` (headless Chrome, 2026-10-21); the
  // Microsoft label must read as the same action in the same locale.
  it.each([
    ['en', 'signin_with', 'Sign in with Google', 'Sign in with Microsoft'],
    ['en', 'signup_with', 'Sign up with Google', 'Sign up with Microsoft'],
    ['en', 'continue_with', 'Continue with Google', 'Continue with Microsoft'],
    ['en', 'signin', 'Sign in', 'Sign in'],
    ['pt', 'signin_with', 'Fazer Login com o Google', 'Fazer login com a Microsoft'],
    ['pt', 'signup_with', 'Inscrever-se no Google', 'Inscrever-se na Microsoft'],
    ['pt', 'continue_with', 'Continuar com o Google', 'Continuar com a Microsoft'],
    ['pt', 'signin', 'Fazer login', 'Fazer login'],
  ] as const)('%s %s: Google "%s" ⇒ Microsoft "%s"', (locale, text, _google, microsoft) => {
    const labels = locale === 'en' ? en.auth : pt.auth;
    expect(microsoftButtonLabel(text, labels)).toBe(microsoft);
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
