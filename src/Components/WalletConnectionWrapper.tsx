"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

interface WalletConnectionWrapperProps {
  children: React.ReactNode;
}

export const WalletConnectionWrapper: React.FC<WalletConnectionWrapperProps> = ({ children }) => {
  const { ready, authenticated, user } = usePrivy();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (ready) {
      // Add a small delay to ensure Privy is fully initialized
      const timer = setTimeout(() => {
        setIsInitialized(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [ready]);

  // Suppress any recovery errors during initialization
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Recovery method not supported')) {
        console.warn('Suppressed recovery error during wallet initialization');
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  // Show loading state while Privy is initializing
  if (!ready || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing wallet connection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};