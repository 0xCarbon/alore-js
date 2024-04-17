import { CheckboxProps } from 'flowbite-react';
import React, { ReactNode } from 'react';
import { Control, FieldValues } from 'react-hook-form';
interface Props extends CheckboxProps {
    control?: Control<FieldValues>;
    name: string;
    label?: ReactNode;
    'data-test'?: string;
    className?: string;
}
declare const CheckboxForm: ({ className, control, name, label, "data-test": dataTest, ...rest }: Props) => React.JSX.Element;
export default CheckboxForm;
