import { AuthProviderConfig } from '@alore/auth-react-sdk';

import Login from './auth/Login';
import Register from './auth/Register';
import Auth, { AuthError, AuthProps } from './components/Auth';
import { AuthProvider } from './components/AuthProvider';
import useAuthService from './hooks/useAuthService';
import { LocalStorageAuthState } from './machine/LocalStorageAuthState';
import { SessionUser } from './machine/types';
import { GoogleButtonText } from './utils/socialButtonText';

export type {
  AuthProps,
  SessionUser,
  AuthProviderConfig,
  LocalStorageAuthState,
  AuthError,
  GoogleButtonText,
};
export { useAuthService, AuthProvider, Auth, Login, Register };
