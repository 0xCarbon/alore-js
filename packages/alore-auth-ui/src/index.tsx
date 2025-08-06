import { AuthProviderConfig } from '@alore/auth-react-sdk/dist/types';

import Auth, { AuthProps } from './components/Auth';
import { AuthProvider } from './components/AuthProvider';
import useAuthService from './hooks/useAuthService';
import { LocalStorageAuthState } from './machine/LocalStorageAuthState';
import { SessionUser } from './machine/types';
import Login from './auth/Login';
import Register from './auth/Register';

export type { AuthProps, SessionUser, AuthProviderConfig, LocalStorageAuthState };
export { useAuthService, AuthProvider, Auth, Login, Register };
