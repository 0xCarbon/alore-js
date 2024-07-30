'use client';

import React, { createContext, useMemo } from 'react';
import { authService } from '../machine';

export const AuthContext = createContext<ReturnType<typeof authService> | null>(
  null
);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  machineServices: {};
}> = ({ machineServices, children }) => {
  const authServiceInstance = useMemo(
    () => authService(machineServices),
    [machineServices]
  );

  return (
    <AuthContext.Provider value={authServiceInstance}>
      {children}
    </AuthContext.Provider>
  );
};
