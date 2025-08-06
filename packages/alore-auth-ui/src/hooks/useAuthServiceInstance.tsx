import { useContext } from 'react';

import { AuthContext } from '../components/AuthProvider';

const useAuthServiceInstance = () => {
  const authServiceInstance = useContext(AuthContext);
  if (!authServiceInstance) {
    throw new Error('useAuthServiceInstance must be used within an AuthProvider');
  }

  return authServiceInstance;
};

export default useAuthServiceInstance;
