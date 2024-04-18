import React, { useEffect, useMemo } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Login } from './Login';
import { authService } from '../machine';
import { useActor } from '@xstate/react';
import { Register } from './Register';
export const Auth = ({ locale = 'pt', machineServices, cloudflareKey, googleId, forgeId, inviteToken, keyshareWorker, cryptoUtils, onSuccess, }) => {
    const authServiceInstance = useMemo(() => authService(machineServices), [machineServices]);
    const [authState, sendAuth] = useActor(authServiceInstance);
    const { googleUser, sessionUser } = authState.context;
    useEffect(() => {
        if (googleUser) {
            sendAuth([
                { type: 'INITIALIZE', forgeId },
                'LOGIN',
                'ADVANCE_TO_PASSWORD',
            ]);
        }
        else
            sendAuth([{ type: 'INITIALIZE', forgeId }, 'LOGIN']);
        return () => {
            sendAuth('RESET');
        };
    }, []);
    useEffect(() => {
        if ((authState.matches('active.login.successfulLogin') ||
            authState.matches('active.register.userCreated')) &&
            sessionUser) {
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(sessionUser);
        }
    }, [sessionUser]);
    return (React.createElement(GoogleOAuthProvider, { clientId: googleId },
        authState.matches('active.login') && (React.createElement(Login, { locale: locale, authServiceInstance: authServiceInstance, cloudflareKey: cloudflareKey, forgeId: forgeId, cryptoUtils: cryptoUtils, keyshareWorker: keyshareWorker })),
        authState.matches('active.register') && (React.createElement(Register, { locale: locale, authServiceInstance: authServiceInstance, cloudflareKey: cloudflareKey, forgeId: forgeId, inviteToken: inviteToken, cryptoUtils: cryptoUtils, keyshareWorker: keyshareWorker }))));
};
