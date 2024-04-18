import React from 'react';
import { Locale } from '../../get-dictionary';
import { AuthInstance } from '../machine/types';
export interface LoginProps {
    locale?: Locale;
    authServiceInstance: AuthInstance;
    cloudflareKey: string;
    forgeId?: string;
    keyshareWorker: Worker | null;
    cryptoUtils: {
        hashUserInfo: (userInfo: string) => string;
        generateSecureHash: (data: string, salt: string, keyDerivationFunction: 'argon2d' | 'pbkdf2') => Promise<string>;
    };
}
export declare const Login: ({ locale, authServiceInstance, cloudflareKey, forgeId, keyshareWorker, cryptoUtils, }: LoginProps) => React.JSX.Element;
