import React, { useEffect, useMemo } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Login } from './Login';
import { authService } from '../machine';
import { useActor } from '@xstate/react';
import { Button } from 'flowbite-react';
import { Register } from './Register';
export const Auth = ({ locale = 'pt', machineServices, cloudflareKey, googleId, forgeId, inviteToken, cryptoUtils, onSuccess, }) => {
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
        React.createElement(Button, { onClick: () => {
                sendAuth('INITIALIZE');
            } }, "INIT"),
        React.createElement(Button, { onClick: () => {
                sendAuth('RESET');
            } }, "RESET"),
        authState.matches('active.login.idle') ? 'true' : 'false',
        authState.matches('active.login') && (React.createElement(Login, { locale: locale, authServiceInstance: authServiceInstance, cloudflareKey: cloudflareKey, forgeId: forgeId, cryptoUtils: cryptoUtils })),
        authState.matches('active.register') && (React.createElement(Register, { locale: locale, authServiceInstance: authServiceInstance, cloudflareKey: cloudflareKey, forgeId: forgeId, inviteToken: inviteToken, cryptoUtils: cryptoUtils }))));
};
