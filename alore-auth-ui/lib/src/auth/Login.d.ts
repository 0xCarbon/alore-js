import React from 'react';
import { Locale } from '../../get-dictionary';
export interface LoginProps {
    locale?: Locale;
    machineServices: {};
    cloudflareKey: string;
    forgeId?: string;
    cryptoUtils: {
        hashUserInfo: (userInfo: string) => string;
        generateSecureHash: (data: string, salt: string, keyDerivationFunction: 'argon2d' | 'pbkdf2') => Promise<string>;
    };
}
declare const Login: ({ locale, machineServices, cloudflareKey, forgeId, cryptoUtils, }: LoginProps) => React.JSX.Element;
export default Login;
