import React from 'react';
export type Props = {
    inputLength: number;
    value: string;
    'data-test'?: string;
    errorMessage?: string;
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
};
declare const OTPInput: ({ value, inputLength, "data-test": dataTest, errorMessage, onChange, className, disabled, }: Props) => React.JSX.Element;
export default OTPInput;
