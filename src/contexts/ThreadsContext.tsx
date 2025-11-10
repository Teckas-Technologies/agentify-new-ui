"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { useGetThreadHistory } from '@/hooks/useGetThreadHistory';

export interface Thread {
  thread_id: string;
  preview: string;
  last_activity: number;
  message_count: number;
}

interface ThreadsContextType {
  threads: Thread[];
  isLoading: boolean;
  isRefreshing: boolean;
  refreshThreads: () => void;
  removeThread: (threadId: string) => void;
}

const ThreadsContext = createContext<ThreadsContextType | undefined>(undefined);

export const ThreadsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const { user } = usePrivy();
  const { getThreadHistory } = useGetThreadHistory();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prevAddress, setPrevAddress] = useState<string | undefined>(undefined);
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);

  const fetchThreads = useCallback(async (isManualRefresh = false) => {
    const isAddressChange = prevAddress !== undefined && prevAddress !== address;
    const isFirstFetch = prevAddress === undefined;

    // Skip fetch if we've already fetched and address hasn't changed (unless manual refresh)
    if (!isManualRefresh && hasInitiallyFetched && !isAddressChange) {
      return;
    }

    // Show spinner for manual refresh, skeleton for first load
    if (isManualRefresh && threads.length > 0) {
      setIsRefreshing(true);
    } else if (threads.length === 0 || isFirstFetch) {
      setIsLoading(true);
    }

    try {
      const res = await getThreadHistory(user?.id ?? "");
      if (res.success && Array.isArray(res.message)) {
        setThreads(res.message);
      }
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setPrevAddress(address);
      setHasInitiallyFetched(true);
    }
  }, [address, user?.id, prevAddress, hasInitiallyFetched, threads.length, getThreadHistory]);

  // Auto-fetch on address change
  useEffect(() => {
    if (address && user?.id) {
      fetchThreads();
    }
  }, [address, user?.id]);

  const refreshThreads = useCallback(() => {
    fetchThreads(true);
  }, [fetchThreads]);

  const removeThread = useCallback((threadId: string) => {
    setThreads(prev => prev.filter(t => t.thread_id !== threadId));
  }, []);

  return (
    <ThreadsContext.Provider value={{ threads, isLoading, isRefreshing, refreshThreads, removeThread }}>
      {children}
    </ThreadsContext.Provider>
  );
};

export const useThreads = () => {
  const context = useContext(ThreadsContext);
  if (context === undefined) {
    throw new Error('useThreads must be used within a ThreadsProvider');
  }
  return context;
};
