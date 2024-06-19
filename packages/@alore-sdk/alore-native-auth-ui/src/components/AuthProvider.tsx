import React, { createContext, useEffect, useState } from 'react';
import { authService, getResolvedState } from '../machine';
import { Locale } from '../helpers/get-dictionary';

export const AuthContext = createContext<ReturnType<typeof authService> | null>(
  null,
);

interface AuthProviderProps {
  children: React.ReactNode;
  machineServices: {};
  locale?: Locale;
  googleId?: string;
  authMethods: {
    password?: boolean;
    passkey?: boolean;
    google?: boolean;
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  machineServices,
  children,
  locale = 'pt',
  googleId,
  authMethods,
}) => {
  const [authServiceInstance, setAuthServiceInstance] = useState<ReturnType<
    typeof authService
  > | null>(null);

  useEffect(() => {
    const fetchResolvedState = async () => {
      const resolvedState = await getResolvedState();
      const auth = authService(
        machineServices,
        { locale, googleId, authMethods },
        resolvedState,
      );

      setAuthServiceInstance(auth);
    };

    fetchResolvedState();
  }, [machineServices]);

  return authServiceInstance !== null ? (
    <AuthContext.Provider value={authServiceInstance}>
      {children}
    </AuthContext.Provider>
  ) : null;
};
