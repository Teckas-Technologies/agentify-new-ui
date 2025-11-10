"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface TokenBalanceRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const TokenBalanceRefreshContext = createContext<TokenBalanceRefreshContextType | undefined>(undefined);

export const TokenBalanceRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <TokenBalanceRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </TokenBalanceRefreshContext.Provider>
  );
};

export const useTokenBalanceRefresh = () => {
  const context = useContext(TokenBalanceRefreshContext);
  if (context === undefined) {
    throw new Error('useTokenBalanceRefresh must be used within a TokenBalanceRefreshProvider');
  }
  return context;
};
