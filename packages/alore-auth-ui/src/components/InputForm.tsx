'use client';

import { HelperText, Label, TextInput, TextInputProps, TextInputTheme } from 'flowbite-react';
import React from 'react';
import { Control, Controller, FieldErrorsImpl, FieldValues } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import InputErrorHelperText from './InputErrorHelperText';

const textInputTheme: TextInputTheme = {
  base: 'flex',
  addon:
    'inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-200 px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400',
  field: {
    base: 'relative w-full',
    icon: {
      base: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4',
      svg: 'h-5 w-5 text-gray-500 dark:text-gray-400',
    },
    rightIcon: {
      base: 'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3',
      svg: 'h-5 w-5 text-gray-500 dark:text-gray-400',
    },
    input: {
      base: 'block w-full bg-gray-100 !px-11 !rounded-full border-0 disabled:cursor-not-allowed disabled:opacity-50',
      sizes: {
        sm: 'p-2 sm:text-xs',
        md: 'p-2.5 text-sm',
        lg: 'sm:text-md p-4',
      },
      colors: {
        gray: 'duration-300 !bg-gray-100 text-gray-900 outline-none border-0 focus:border-0 focus:ring-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500',
        info: 'border-cyan-500 bg-cyan-50 text-cyan-900 placeholder-cyan-700 focus:border-cyan-500 focus:ring-cyan-500 dark:border-cyan-400 dark:bg-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500',
        failure:
          'border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-100 dark:focus:border-red-500 dark:focus:ring-red-500',
        warning:
          'border-yellow-500 bg-yellow-50 text-yellow-900 placeholder-yellow-700 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-400 dark:bg-yellow-100 dark:focus:border-yellow-500 dark:focus:ring-yellow-500',
        success:
          'border-green-500 bg-green-50 text-green-900 placeholder-green-700 focus:border-green-500 focus:ring-green-500 dark:border-green-400 dark:bg-green-100 dark:focus:border-green-500 dark:focus:ring-green-500',
      },
      withRightIcon: {
        on: 'pr-10',
        off: '',
      },
      withIcon: {
        on: 'pl-10',
        off: '',
      },
      withAddon: {
        on: 'rounded-r-lg',
        off: 'rounded-lg',
      },
      withShadow: {
        on: 'shadow-sm dark:shadow-sm-light',
        off: '',
      },
    },
  },
};

interface Props extends TextInputProps {
  control?: Control<FieldValues>;
  errors: Partial<FieldErrorsImpl>;
  name: string;
  label?: string;
  type?: string;
  'data-testid'?: string;
  className?: string;
}

const infoIcon = () => <i className="fa-solid fa-circle-info text-alr-red" />;

const InputForm = ({
  control,
  name,
  label,
  errors,
  type = 'text',
  'data-testid': dataTest,
  className,
  ...rest
}: Props) => {
  console.log(errors);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={twMerge('flex flex-col', className)}>
          {label && (
            <Label
              className="mb-2 font-medium !text-gray-500"
              htmlFor={field.name}
            >
              {label}
            </Label>
          )}
          <TextInput
            {...field}
            {...rest}
            type={type}
            color={errors[field.name] ? 'failure' : 'gray'}
            rightIcon={errors[field.name] && infoIcon}
            data-testid={dataTest}
            theme={textInputTheme}
          />
          <HelperText>
            {errors[field.name] && (
              <InputErrorHelperText
                id={dataTest}
                message={String(errors?.[field.name]?.message)}
              />
            )}
          </HelperText>
        </div>
      )}
    />
  );
};

export default InputForm;
