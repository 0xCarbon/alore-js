import { FieldValues } from 'react-hook-form';
import { Locale } from '../../../get-dictionary';
import React from 'react';
interface FormRulesProps {
    locale: Locale;
    passwordValues: FieldValues;
    userValues?: FieldValues;
    className?: string;
}
declare const FormRules: ({ locale, passwordValues, userValues, className, }: FormRulesProps) => React.JSX.Element;
export default FormRules;
