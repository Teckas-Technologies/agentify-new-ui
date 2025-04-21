import { useState } from "react";
import { PYTHON_SERVER_URL } from "@/config/constants";

const useFetchStatistics = () => {
  const [statisticsData, setStatisticsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const AGENTIFY_AI = PYTHON_SERVER_URL;

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${AGENTIFY_AI}/api/statistics/`, {
        method: "GET",
        // headers: {
        //   "Content-Type": "application/json",
        //   Authorization: `Bearer ${token}`,
        // },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Statistics response ---", result); 
      setStatisticsData(result);
      return result;
    } catch (err: any) {
      console.error("Error occurred:", err);
      setError(err.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    statisticsData,
    loading,
    error,
    fetchStatistics,
  };
};

export default useFetchStatistics;
