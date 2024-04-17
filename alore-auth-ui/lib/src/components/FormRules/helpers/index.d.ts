import { FieldValues } from 'react-hook-form';
export interface PasswordRule {
    name: string;
    label: string;
    regex?: RegExp;
    key: string;
}
export declare const passwordRules: PasswordRule[];
export declare function ruleValidation(rule: PasswordRule, passwordValues: FieldValues, userInfoValues?: FieldValues): boolean;
declare const _default: {
    ruleValidation: typeof ruleValidation;
};
export default _default;
