// useDeleteThread.tsx
"use client";

import { getAccessToken } from "@privy-io/react-auth";
import { useState } from "react";
import { useAccount } from "wagmi";

interface DeleteThreadResponse {
  success: boolean;
  message?: string | boolean;
  status?: number;
}
const PYTHON_SERVER_URL = process.env.NEXT_PUBLIC_NEW_PYTHON_SERVER_URL;
export const useDeleteThread = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteThread = async (
    threadId: string,
    userId: string
  ): Promise<DeleteThreadResponse> => {
    if (!address) {
      return { success: false, message: "Wallet address not connected" };
    }

    setLoading(true);
    setError(null);

    const accessToken = await getAccessToken();

    try {
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/history/thread?thread_id=${encodeURIComponent(
          threadId
        )}&user_id=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Delete thread result:", result);

      return {
        success: result.success ?? true,
        message: result.message,
        status: result.status ?? response.status,
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
    deleteThread,
    loading,
    error,
  };
};
