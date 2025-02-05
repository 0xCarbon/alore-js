'use client';

import { Checkbox, CheckboxProps, Label } from 'flowbite-react';
import React, { ReactNode } from 'react';
import { Control, Controller, FieldValues } from 'react-hook-form';

interface Props extends CheckboxProps {
  control?: Control<FieldValues>;
  name: string;
  label?: ReactNode;
  'data-test'?: string;
  className?: string;
}

const CheckboxForm = ({
  className = '',
  control,
  name,
  label,
  'data-test': dataTest,
  ...rest
}: Props) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <div className={className}>
        <div className="mb-2 flex items-center gap-x-2">
          <Checkbox
            {...field}
            {...rest}
            value={String(field.value)}
            checked={field.value}
            data-test={dataTest}
            className="text-alr-red h-4 w-4 rounded border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-cyan-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-cyan-600 dark:focus:ring-cyan-600"
          />
          <Label
            className="text-sm font-normal text-gray-500"
            htmlFor="agreedWithTerms"
          >
            {label}
          </Label>
        </div>
      </div>
    )}
  />
);

export default CheckboxForm;
