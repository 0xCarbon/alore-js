import classNames from 'classnames';
import { Label, TextInput, TextInputProps } from 'flowbite-react';
import React from 'react';
import {
  Control,
  Controller,
  FieldErrorsImpl,
  FieldValues,
} from 'react-hook-form';
import InputErrorHelperText from './InputErrorHelperText';

interface Props extends TextInputProps {
  control?: Control<FieldValues>;
  errors: Partial<FieldErrorsImpl>;
  name: string;
  label?: string;
  type?: string;
  'data-test'?: string;
  className?: string;
}

const infoIcon = () => <i className='fa-solid fa-circle-info text-alr-red' />;

const InputForm = ({
  control,
  name,
  label,
  errors,
  type = 'text',
  'data-test': dataTest,
  className,
  ...rest
}: Props) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <div className={classNames('flex flex-col', className)}>
        {label && (
          <Label
            className='mb-2 font-medium !text-gray-500'
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
          data-test={dataTest}
          helperText={
            errors[field.name] && (
              <InputErrorHelperText
                id={dataTest}
                message={String(errors?.[field.name]?.message)}
              />
            )
          }
        />
      </div>
    )}
  />
);

export default InputForm;
