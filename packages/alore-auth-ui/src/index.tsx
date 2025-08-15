import { AuthProviderConfig } from '@alore/auth-react-sdk';

import Login from './auth/Login';
import Register from './auth/Register';
import Auth, { AuthError, AuthProps } from './components/Auth';
import { AuthProvider } from './components/AuthProvider';
import useAuthService from './hooks/useAuthService';
import { LocalStorageAuthState } from './machine/LocalStorageAuthState';
import { SessionUser } from './machine/types';

export type { AuthProps, SessionUser, AuthProviderConfig, LocalStorageAuthState, AuthError };
export { useAuthService, AuthProvider, Auth, Login, Register };
