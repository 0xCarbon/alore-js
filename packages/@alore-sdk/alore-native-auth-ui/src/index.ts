import Auth, { AuthProps } from './components/Auth';
import { SessionUser } from './machine/types';
import useAuthService from './hooks/useAuthService';
import { AuthProvider } from './components/AuthProvider';
import './styles';

export type { AuthProps, SessionUser };
export { useAuthService, AuthProvider };
export default Auth;
