import React, { createContext, useMemo } from 'react';
import { authService } from '../machine';
import { Locale } from '../helpers/get-dictionary';

export const AuthContext = createContext<ReturnType<typeof authService> | null>(
  null,
);

interface AuthProviderProps {
  children: React.ReactNode;
  machineServices: {};
  locale?: Locale;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  machineServices,
  children,
  locale = 'en',
}) => {
  const authServiceInstance = useMemo(
    () => authService(machineServices, { locale }),
    [machineServices],
  );

  return (
    <AuthContext.Provider value={authServiceInstance}>
      {children}
    </AuthContext.Provider>
  );
};
