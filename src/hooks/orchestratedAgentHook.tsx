// orchestratedAgentHook.tsx
"use client";

import { getAccessToken } from "@privy-io/react-auth";
import { useState } from "react";
import { useAccount } from "wagmi";
const PYTHON_SERVER_URL = process.env.NEXT_PUBLIC_NEW_PYTHON_SERVER_URL;
interface RequestFields {
  agentName: string;
  userId: string;
  message: string; // already a JSON string
  threadId: string;
  walletAddress: string;
  isTransaction: boolean;
}

interface OrchestratedAgentResponse {
  success?: boolean;
  data?: any;
  message?: string;
}

export const useOrchestratedAgent = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const orchestratedAgentChat = async (
    data: RequestFields
  ): Promise<OrchestratedAgentResponse> => {
    if (!address) {
      return { success: false, message: "Wallet address not connected" };
    }

    setLoading(true);
    setError(null);

    const accessToken = await getAccessToken();

    try {
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            agentName: data.agentName, // "orchestratedAgent"
            userId: data.userId,
            message: data.message,
            threadId: data.threadId,
            walletAddress: data.walletAddress ?? address, // fallback to connected address
            isTransaction: data.isTransaction,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
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
    orchestratedAgentChat,
    loading,
    error,
  };
};
