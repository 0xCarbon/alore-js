import React from 'react';
import { Locale } from '../../get-dictionary';
import { SessionUser } from '../machine/types';
export interface AuthProps {
    locale?: Locale;
    machineServices: {};
    cloudflareKey: string;
    googleId: string;
    forgeId?: string;
    inviteToken?: string;
    keyshareWorker: Worker | null;
    cryptoUtils: {
        hashUserInfo: (userInfo: string) => string;
        generateSecureHash: (data: string, salt: string, keyDerivationFunction: 'argon2d' | 'pbkdf2') => Promise<string>;
    };
    onSuccess?: (sessionUser: SessionUser) => void;
}
export declare const Auth: ({ locale, machineServices, cloudflareKey, googleId, forgeId, inviteToken, keyshareWorker, cryptoUtils, onSuccess, }: AuthProps) => React.JSX.Element;
