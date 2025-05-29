import { useState } from "react";
import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";

const AGENTIFY_API_URL = PYTHON_SERVER_URL;

type AgentCommand = {
  _id: string;
  user_id: string;
  agent_id: string;
  agent_name: string;
  command: string;
  created_at: string; // ISO date string
};

type AgentCommandResponse = {
  data: AgentCommand[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
};


const useFetchSavedCommands = () => {
  const [savedCommands, setSavedCommands] = useState<AgentCommandResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved commands with optional skip and limit parameters
  const fetchSavedCommands = async (
    skip?: number,
    limit?: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        skip: skip !== undefined ? skip.toString() : "0", // Default to 0 if skip is not provided
        limit: limit !== undefined ? limit.toString() : "10", // Default to 10 if limit is not provided
      });
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${AGENTIFY_API_URL}/api/agentCommands/?${query.toString()}`,
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

      // Store the response with pagination metadata
      setSavedCommands({
        data: result.data,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        pageSize: result.pageSize,
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error fetching saved commands:", error);
      setError(error.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    savedCommands,
    loading,
    error,
    fetchSavedCommands,
  };
};

export default useFetchSavedCommands;
