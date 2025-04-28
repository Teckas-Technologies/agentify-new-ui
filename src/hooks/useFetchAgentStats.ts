import { useState } from "react";
import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";

const useFetchDashboardStats = () => {
  const [dashboardStats, setDashboardStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const AGENTIFY_AI = PYTHON_SERVER_URL;

  const fetchDashboardStats = async (agentId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        agent_id: agentId,
        user_id: userId,
      });
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${AGENTIFY_AI}/api/dashboard/stats?${query.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`, // ✅ added Authorization header
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Dashboard stats response ---", result); // Log the response
      setDashboardStats(result);
      return result;
    } catch (err: any) {
      console.error("Error occurred while fetching dashboard stats:", err);
      setError(err.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    dashboardStats,
    loading,
    error,
    fetchDashboardStats,
  };
};

export default useFetchDashboardStats;
