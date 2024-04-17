import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './Login';
export const Auth = ({ locale = 'pt', machineServices, cloudflareKey, googleId, forgeId, cryptoUtils, }) => {
    return (React.createElement(GoogleOAuthProvider, { clientId: googleId },
        React.createElement(Login, { locale: locale, machineServices: machineServices, cloudflareKey: cloudflareKey, forgeId: forgeId, cryptoUtils: cryptoUtils })));
};
