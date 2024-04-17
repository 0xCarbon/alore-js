import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { FieldValues } from 'react-hook-form';
import { passwordRules, ruleValidation } from './helpers';
import useDictionary from '../../hooks/useDictionary';
import { Locale } from '../../../get-dictionary';
import React from 'react';

interface FormRulesProps {
  locale: Locale;
  passwordValues: FieldValues;
  userValues?: FieldValues;
  className?: string;
}

const FormRules = ({
  locale,
  passwordValues,
  userValues,
  className,
}: FormRulesProps) => {
  const dictionary = useDictionary(locale);

  return (
    <div className={classNames(className, 'my-1 flex flex-col gap-y-2')}>
      {passwordRules.map((rule) => (
        <div key={rule.name} className='flex items-center gap-x-2'>
          {ruleValidation(rule, passwordValues, userValues) ? (
            <CheckIcon className='h-3 w-3 text-green-400 md:h-5 md:w-5' />
          ) : (
            <XMarkIcon className='h-3 w-3 text-alr-red md:h-5 md:w-5' />
          )}
          <span className='text-[11px] text-gray-500 md:text-xs'>
            {
              dictionary?.passwordRules[
                rule.key as keyof (typeof dictionary)['passwordRules']
              ]
            }
          </span>
        </div>
      ))}
    </div>
  );
};

export default FormRules;
