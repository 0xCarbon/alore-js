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
  googleId?: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  machineServices,
  children,
  locale = 'en',
  googleId,
}) => {
  const authServiceInstance = useMemo(
    () => authService(machineServices, { locale, googleId }),
    [machineServices],
  );

  return (
    <AuthContext.Provider value={authServiceInstance}>
      {children}
    </AuthContext.Provider>
  );
};
