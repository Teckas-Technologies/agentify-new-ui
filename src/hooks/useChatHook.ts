import { PYTHON_SERVER_URL } from "@/config/constants";
import { Agent } from "@/types/types";
import { getAccessToken } from "@privy-io/react-auth";
import { useState } from "react";
import { useAccount } from "wagmi";

interface RequestFields {
  inputMessage: string;
  agentName: string;
  userId: string;
  isTransaction: boolean;
}

export const useChat = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  const chat = async (data: RequestFields) => {
    if (!address) {
      return;
    }
    setLoading(true);
    setError(null);
    const accessToken = await getAccessToken();

    try {
      const response = await fetch(`${PYTHON_SERVER_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          agentName: data.agentName, // "Swap Agent"
          message: data.inputMessage,
          threadId: data.agentName, // "Swap Agent"
          walletAddress: address,
          userId: data.userId,
          isTransaction: data.isTransaction,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message || "An error occurred");
      return { success: false, message: error.message || "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async ({
    page = 1,
    limit = 10,
    is_favourite = false,
    search_query = "",
  }: {
    page?: number;
    limit?: number;
    is_favourite?: boolean;
    search_query?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const skip = (page - 1) * limit;

      const queryParams = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        is_favourite: is_favourite.toString(),
        search_query,
      });
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/v1/agents/list-agents/?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      setAgents(result.data || []);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error occurred:", error);
      setError(error.message || "Something went wrong");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (agentId: string) => {
    if (!address) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/history/${agentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const result = await response.json();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error occurred:", error);
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async ( agentId: string) => {
    if (!address) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/history/${agentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const result = await response.json();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error occurred:", error);
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const updateMessage = async (
    agentId: string,
    newMessage: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/history/${agentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ newMessage }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message || "An error occurred");
      return { success: false, message: error.message || "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const sendAgentCommand = async (
    userId: string,
    agentId: string,
    agentName: string,
    command: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`${PYTHON_SERVER_URL}/api/agentCommands/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_id: userId,
          agent_id: agentId,
          agent_name: agentName,
          command,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message || "An error occurred");
      return { success: false, message: error.message || "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const getAgentCommands = async (
    agentId: string,
    skip: number = 0,
    limit: number = 10
  ) => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/agentCommands/?agent_id=${agentId}&skip=${skip}&limit=${limit}`,
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
      return { success: true, data: result };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message || "An error occurred");
      return { success: false, message: error.message || "An error occurred" };
    }
    finally {
      setLoading(false);
    }
  };

  const deleteAgentCommand = async ({
    agentId,
    command,
  }: {
    userId: string;
    agentId: string;
    command: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        agent_id: agentId,
        command: command,
      });
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/agentCommands?${queryParams.toString()}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete agent command. Status: ${response.status}`
        );
      }

      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message || "An error occurred");
      return { success: false, message: error.message || "An error occurred" };
    }
    finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    agents,
    chat,
    fetchChatHistory,
    clearHistory,
    fetchAgents,
    updateMessage,
    sendAgentCommand,
    getAgentCommands,
    deleteAgentCommand,
  };
};
