import { useState } from "react";
import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";

const AGENTIFY_API_URL = PYTHON_SERVER_URL;

const useFetchAgentChart = () => {
  const [agentChartData, setAgentChartData] = useState<any[] | null>(null);
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
      console.log("Agent Chart Data ---", result);
      setAgentChartData(result);
      return result;
    } catch (err: any) {
      console.error("Error fetching agent chart data:", err);
      setError(err.message || "Something went wrong");
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
