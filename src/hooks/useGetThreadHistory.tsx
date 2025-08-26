"use client";

import { getAccessToken } from "@privy-io/react-auth";
import { useState } from "react";
import { useAccount } from "wagmi";

interface ThreadHistoryResponse {
  success: boolean;
  status?: number;
  message?: any; // server returns `[]` as message, so can be array or string
  total_threads?: number;
}
const PYTHON_SERVER_URL = process.env.NEXT_PUBLIC_NEW_PYTHON_SERVER_URL;
export const useGetThreadHistory = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getThreadHistory = async (
    userId: string // pass the DID or user id here
  ): Promise<ThreadHistoryResponse> => {
    if (!address) {
      return { success: false, message: "Wallet address not connected" };
    }

    setLoading(true);
    setError(null);

    const accessToken = await getAccessToken();

    try {
      const endpoint = `${PYTHON_SERVER_URL}/api/history/threads?user_id=${encodeURIComponent(
  userId
)}`;


      console.log("Fetching thread history from:", endpoint);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("thread history result--", result);

      return {
        success: result.success,
        status: result.status,
        message: result.message,
        total_threads: result.total_threads,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    getThreadHistory,
    loading,
    error,
  };
};
