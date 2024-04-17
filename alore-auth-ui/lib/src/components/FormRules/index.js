import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { passwordRules, ruleValidation } from './helpers';
import useDictionary from '../../hooks/useDictionary';
import React from 'react';
const FormRules = ({ locale, passwordValues, userValues, className, }) => {
    const dictionary = useDictionary(locale);
    return (React.createElement("div", { className: classNames(className, 'my-1 flex flex-col gap-y-2') }, passwordRules.map((rule) => (React.createElement("div", { key: rule.name, className: 'flex items-center gap-x-2' },
        ruleValidation(rule, passwordValues, userValues) ? (React.createElement(CheckIcon, { className: 'h-3 w-3 text-green-400 md:h-5 md:w-5' })) : (React.createElement(XMarkIcon, { className: 'h-3 w-3 text-alr-red md:h-5 md:w-5' })),
        React.createElement("span", { className: 'text-[11px] text-gray-500 md:text-xs' }, dictionary === null || dictionary === void 0 ? void 0 : dictionary.passwordRules[rule.key]))))));
};
export default FormRules;
