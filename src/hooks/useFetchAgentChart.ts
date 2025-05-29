import { useState } from "react";
import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";

const AGENTIFY_API_URL = PYTHON_SERVER_URL;

type AgentUsage = {
  agentName: string;
  percentage: number;
}

const useFetchAgentChart = () => {
  const [agentChartData, setAgentChartData] = useState<AgentUsage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentChart = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({ user_id: userId });
      const accessToken = await getAccessToken(); // first, get the access token

      const response = await fetch(
        `${AGENTIFY_API_URL}/api/dashboard/agentUsage?${query.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`, 
          },
        }
      );

      const result = await response.json();
      setAgentChartData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.error("Error fetching agent chart data:", error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    agentChartData,
    loading,
    error,
    fetchAgentChart,
  };
};

export default useFetchAgentChart;
