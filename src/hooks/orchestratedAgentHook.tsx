// orchestratedAgentHook.tsx
"use client";

import { getAccessToken } from "@privy-io/react-auth";
import { useState } from "react";

import { useAccount } from "wagmi"; // or your wallet/account hook

interface RequestFields {
  agentName: string;
  userId: string;
  message: string;
  threadId: string;
  isTransaction: boolean;
}

interface OrchestratedAgentResponse {
  // define fields as per your API response
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
        "https://agentify-dev-hegke2etdyb3fefj.centralus-01.azurewebsites.net/api/multi-agent-chat",
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
