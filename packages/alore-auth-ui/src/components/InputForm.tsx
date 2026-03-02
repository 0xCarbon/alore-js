'use client';

import { HelperText, Label, TextInput, TextInputProps } from 'flowbite-react';
import React, { useState } from 'react';
import { Control, Controller, FieldErrorsImpl, FieldValues } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/20/solid';
import { twMerge } from 'tailwind-merge';

import InputErrorHelperText from './InputErrorHelperText';

interface Props extends TextInputProps {
  control?: Control<FieldValues>;
  errors: Partial<FieldErrorsImpl>;
  name: string;
  label?: string;
  type?: string;
  'data-testid'?: string;
  className?: string;
  inputClassName?: string;
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
  inputClassName,
  ...rest
}: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={twMerge('flex flex-col', className)}>
          {label && (
            <Label
              className="mb-2 self-start text-left font-medium !text-gray-500"
              htmlFor={field.name}
            >
              {label}
            </Label>
          )}
          <div className="relative">
            <TextInput
              {...field}
              {...rest}
              type={isPassword && showPassword ? 'text' : type}
              color={errors[field.name] ? 'failure' : 'gray'}
              rightIcon={errors[field.name] && infoIcon}
              data-testid={dataTest}
              className={inputClassName}
            />
            {isPassword && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                data-testid={dataTest ? `${dataTest}-toggle-visibility` : undefined}
              >
                {showPassword ? (
                  <EyeSlashIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            )}
          </div>
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
