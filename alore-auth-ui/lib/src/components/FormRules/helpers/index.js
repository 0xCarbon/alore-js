export const passwordRules = [
    {
        name: 'special_character',
        label: 'Use at leat one special character (@!#%&*)',
        regex: /[^a-zA-Z0-9]/g,
        key: 'specialCharacter',
    },
    {
        name: 'uppercase_letter',
        label: 'Use at least one uppercase letter',
        regex: /[A-Z]/g,
        key: 'uppercaseLetter',
    },
    {
        name: 'minimum_eight_characters',
        label: 'Your password must have at least 8 character’s',
        regex: /[^ ]{8,}$/,
        key: 'minimumEightCharacters',
    },
    {
        name: 'password_match',
        label: 'Password must match',
        key: 'passwordMatch',
    },
    {
        name: 'dont_use_your_name_or_email',
        label: 'Don’t use your name or e-mail',
        key: 'dontUseYourNameOrEmail',
    },
];
export function ruleValidation(rule, passwordValues, userInfoValues) {
    if (passwordValues.password.length) {
        if (rule.name === 'password_match') {
            return passwordValues.password === passwordValues.confirmPassword;
        }
        if (rule.name === 'dont_use_your_name_or_email') {
            if (!userInfoValues)
                return true;
            return !passwordValues.password
                .toLowerCase()
                .match(new RegExp(`${userInfoValues.nickname}|${userInfoValues.email}`));
        }
        return ((rule === null || rule === void 0 ? void 0 : rule.regex) && !!passwordValues.password.match(rule.regex)) || false;
    }
    return false;
}
export default { ruleValidation };
