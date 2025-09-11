"use client";

import { PrivyProvider, PrivyClientConfig } from "@privy-io/react-auth";
import { ReactNode, useEffect, useState } from "react";
import { forceCleanPrivySession } from "@/utils/forceCleanPrivySession";

interface CleanPrivyProviderProps {
  children: ReactNode;
  appId: string;
  config: PrivyClientConfig;
}

export const CleanPrivyProvider: React.FC<CleanPrivyProviderProps> = ({
  children,
  appId,
  config,
}) => {
  const [isCleanedUp, setIsCleanedUp] = useState(false);

  useEffect(() => {
    // Force cleanup before initializing Privy
    forceCleanPrivySession();
    
    // Small delay to ensure cleanup is complete
    const timer = setTimeout(() => {
      setIsCleanedUp(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Don't render Privy until cleanup is complete
  if (!isCleanedUp) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={config}
    >
      {children}
    </PrivyProvider>
  );
};