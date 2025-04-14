'use client';

import { AloreAuth } from '@alore/auth-react-sdk';
import React, { createContext, useEffect, useMemo, useState } from 'react';
import { AuthProviderConfig } from 'types';

import { authService } from '../machine';

export const AuthContext = createContext<ReturnType<typeof authService> | null>(null);

/**
 * Auth Provider props.
 *
 * @property children - React children.
 * @property clientId - The Alore Client ID for the authentication.
 * @property projectId - The Alore project ID of auth provider.
 * @property aloreBaseUrl - The Alore backend domain.
 * @property config - The Auth Provider configuration.
 */
interface AuthProviderProps {
  children: React.ReactNode;
  clientId: string;
  aloreBaseUrl: string;
  config?: AuthProviderConfig;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  clientId,
  aloreBaseUrl,
  config = {},
  children,
}) => {
  const [machineServices, setMachineServices] = useState<{} | null>(null);

  useEffect(() => {
    const aloreAuth = new AloreAuth(clientId, aloreBaseUrl, config);
    setMachineServices(aloreAuth.services);
  }, [clientId, aloreBaseUrl, config]);

  const authServiceInstance = useMemo(
    () => machineServices && authService(machineServices, { authProviderConfigs: config }),
    [machineServices],
  );

  return authServiceInstance !== null ? (
    <AuthContext.Provider value={authServiceInstance}>{children}</AuthContext.Provider>
  ) : null;
};
