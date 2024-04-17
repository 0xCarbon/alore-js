import React from 'react';
import { Locale } from '../../get-dictionary';
export interface AuthProps {
    locale?: Locale;
    machineServices: {};
    cloudflareKey: string;
    googleId: string;
    forgeId?: string;
    cryptoUtils: {
        hashUserInfo: (userInfo: string) => string;
        generateSecureHash: (data: string, salt: string, keyDerivationFunction: 'argon2d' | 'pbkdf2') => Promise<string>;
    };
}
export declare const Auth: ({ locale, machineServices, cloudflareKey, googleId, forgeId, cryptoUtils, }: AuthProps) => React.JSX.Element;
