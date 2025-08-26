"use client";

import { getAccessToken } from "@privy-io/react-auth";
import { useState } from "react";
import { useAccount } from "wagmi";

interface ConversationMessage {
  role: "human" | "ai" | "tool";
  message: string;
  message_id?: string | null;
}

interface HistoryResponse {
  success: boolean;
  status?: number;
  message?: ConversationMessage[];
}
const PYTHON_SERVER_URL = process.env.NEXT_PUBLIC_NEW_PYTHON_SERVER_URL;
export const useGetHistory = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getHistory = async (
    threadId: string,
    userId: string // 👈 add userId param
  ): Promise<HistoryResponse> => {
    if (!address) {
      return { success: false, message: [] };
    }

    if (!userId) {
      return { success: false, message: [] };
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
          method: "GET",
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
      console.log("history result --", result);

      return {
        success: true,
        status: result.status ?? response.status,
        message: result.message ?? [],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return { success: false, message: [] };
    } finally {
      setLoading(false);
    }
  };

  return {
    getHistory,
    loading,
    error,
  };
};
