import { StyleSheet } from 'react-native';
import { PasswordRule } from '../types';

export const validateEmailPattern = (email: string) => {
  const emailPattern = /\S+@\S+\.\S+/;

  return emailPattern.test(email);
};

export const passwordRules: PasswordRule[] = [
  {
    name: 'special_character',
    label: 'Use at least one special character (@!#%&*)',
    regex: /[^a-zA-Z0-9]/g,
    key: 'specialCharacter',
  },
  {
    name: 'uppercase_letter',
    label: 'Use at least one uppercase letter',
    regex: /[A-Z]/g,
    key: 'uppercaseLetter',
  },
  {
    name: 'minimum_eight_characters',
    label: 'Your password must have at least 8 characters',
    regex: /[^ ]{8,}$/,
    key: 'minimumEightCharacters',
  },
  {
    name: 'password_match',
    label: 'Password must match',
    key: 'passwordMatch',
  },
  {
    name: 'dont_use_your_name_or_email',
    label: 'Don’t use your name or e-mail',
    key: 'dontUseYourNameOrEmail',
  },
];

export function ruleValidation(
  rule: PasswordRule,
  passwordValues: { password: string; confirmPassword: string },
  userInfoValues?: { email: string; nickname: string },
) {
  if (passwordValues.password.length) {
    if (rule.name === 'password_match') {
      return passwordValues.password === passwordValues.confirmPassword;
    }
    if (rule.name === 'dont_use_your_name_or_email') {
      if (!userInfoValues) return true;
      return !passwordValues.password
        .toLowerCase()
        .match(
          new RegExp(`${userInfoValues.nickname}|${userInfoValues.email}`),
        );
    }
    return (
      (rule?.regex && !!passwordValues.password.match(rule.regex)) || false
    );
  }

  return false;
}

function isPlainObject(obj: any): boolean {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

function mergeValues(defaultValue: any, customValue: any): any {
  if (Array.isArray(defaultValue) || Array.isArray(customValue)) {
    return StyleSheet.flatten([defaultValue, customValue]);
  }
  return customValue !== undefined ? customValue : defaultValue;
}

export function mergeStyles(defaultStyles: any, customStyles?: any): any {
  const mergedStyles: any = {};

  for (const key in defaultStyles) {
    if (defaultStyles.hasOwnProperty(key)) {
      const defaultStyle = defaultStyles[key];
      const customStyle = customStyles?.[key];

      if (isPlainObject(defaultStyle)) {
        mergedStyles[key] = mergeStyles(defaultStyle, customStyle);
      } else {
        mergedStyles[key] = mergeValues(defaultStyle, customStyle);
      }
    }
  }

  for (const key in customStyles) {
    if (
      customStyles.hasOwnProperty(key) &&
      !defaultStyles.hasOwnProperty(key)
    ) {
      mergedStyles[key] = customStyles[key];
    }
  }

  return mergedStyles;
}
