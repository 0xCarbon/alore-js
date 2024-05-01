'use client';

import React, { createContext } from 'react';

const keyshareWorker =
  typeof window !== 'undefined'
    ? new Worker(new URL('./worker.ts', import.meta.url))
    : null;

const KeyshareWorkerContext = createContext(keyshareWorker);

const KeyshareWorkerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <KeyshareWorkerContext.Provider value={keyshareWorker}>
    {children}
  </KeyshareWorkerContext.Provider>
);

export { KeyshareWorkerContext, keyshareWorker };
export default KeyshareWorkerProvider;
