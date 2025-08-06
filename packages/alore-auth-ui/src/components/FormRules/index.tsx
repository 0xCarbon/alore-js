'use client';

import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import React from 'react';
import { FieldValues } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { Locale } from '../../get-dictionary';
import useDictionary from '../../hooks/useDictionary';
import { passwordRules, ruleValidation } from './helpers';

interface FormRulesProps {
  locale: Locale;
  passwordValues: FieldValues;
  userValues?: FieldValues;
  className?: string;
}

const FormRules = ({ locale, passwordValues, userValues, className }: FormRulesProps) => {
  const dictionary = useDictionary(locale);

  return (
    <ul
      data-testid="password-rules"
      className={twMerge('my-1 flex flex-col gap-y-2', className)}
    >
      {passwordRules.map((rule) => (
        <li
          key={rule.name}
          className="flex items-center gap-x-2"
        >
          {ruleValidation(rule, passwordValues, userValues) ? (
            <CheckIcon
              className="size-3 text-green-400 md:size-5"
              aria-label="valid"
              role="img"
            />
          ) : (
            <XMarkIcon
              className="text-alr-red size-3 md:size-5"
              aria-label="invalid"
              role="img"
            />
          )}
          <span className="text-[11px] text-gray-500 md:text-xs">
            {dictionary?.passwordRules[rule.key as keyof (typeof dictionary)['passwordRules']]}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default FormRules;
