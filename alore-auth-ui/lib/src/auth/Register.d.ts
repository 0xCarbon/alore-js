import React from 'react';
import { Locale } from '../../get-dictionary';
import { AuthInstance } from '../machine/types';
export interface RegisterProps {
    locale?: Locale;
    authServiceInstance: AuthInstance;
    cloudflareKey: string;
    forgeId?: string;
    inviteToken?: string;
    keyshareWorker: Worker | null;
    cryptoUtils: {
        hashUserInfo: (userInfo: string) => string;
        generateSecureHash: (data: string, salt: string, keyDerivationFunction: 'argon2d' | 'pbkdf2') => Promise<string>;
    };
}
export declare const Register: ({ locale, authServiceInstance, cloudflareKey, forgeId, inviteToken, keyshareWorker, cryptoUtils, }: RegisterProps) => React.JSX.Element;
