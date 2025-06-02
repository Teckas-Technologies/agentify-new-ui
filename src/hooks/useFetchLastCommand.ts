import { useState } from "react";
import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";

const AGENTIFY_API_URL = PYTHON_SERVER_URL;

type AgentCommandRequest = {
  command: string;
  agent_id: string;
};


const useFetchLastCommand = () => {
  const [lastCommand, setLastCommand] = useState<AgentCommandRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLastCommand = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = await getAccessToken();
      const response = await fetch(
        `${AGENTIFY_API_URL}/api/transactions/last_command/`,
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

      const result: AgentCommandRequest = await response.json();
      setLastCommand(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error fetching last command:", error);
      setError(error.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    lastCommand,
    loading,
    error,
    fetchLastCommand,
  };
};

export default useFetchLastCommand;
