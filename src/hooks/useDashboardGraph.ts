import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";
import { useState, useCallback } from "react";

const useFetchGraphData = (userId: string, agentId: string, year: number) => {
  const [graphData, setGraphData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const AGENTIFY_AI = PYTHON_SERVER_URL;
  const fetchGraphData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${AGENTIFY_AI}/api/transactions/graph/?user_id=${userId}&agent_id=${agentId}&year=${year}`,
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
      console.log("response ---",result);
      
      setGraphData(result);
    } catch (err: any) {
      console.error("Error occurred:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [userId, agentId, year]);

  return {
    graphData,
    loading,
    error,
    fetchGraphData,
  };
};

export default useFetchGraphData;
