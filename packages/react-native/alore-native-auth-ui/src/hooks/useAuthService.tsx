import { useActor } from '@xstate/react';
import { useContext } from 'react';
import { AuthContext } from '../components/AuthProvider';

const useAuthService = () => {
  const authServiceInstance = useContext(AuthContext);

  if (!authServiceInstance) {
    throw new Error('useAuthService must be used within an AuthProvider');
  }

  const [authState, sendAuth] = useActor(authServiceInstance);

  return [authState, sendAuth] as const;
};

export default useAuthService;
