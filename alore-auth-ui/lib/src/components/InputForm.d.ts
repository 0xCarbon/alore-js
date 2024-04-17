import { TextInputProps } from 'flowbite-react';
import React from 'react';
import { Control, FieldErrorsImpl, FieldValues } from 'react-hook-form';
interface Props extends TextInputProps {
    control?: Control<FieldValues>;
    errors: Partial<FieldErrorsImpl>;
    name: string;
    label?: string;
    type?: string;
    'data-test'?: string;
    className?: string;
}
declare const InputForm: ({ control, name, label, errors, type, "data-test": dataTest, className, ...rest }: Props) => React.JSX.Element;
export default InputForm;
