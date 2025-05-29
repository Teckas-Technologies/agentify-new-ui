import { PYTHON_SERVER_URL } from "@/config/constants";
import { useIdentityToken, usePrivy } from "@privy-io/react-auth";
import { useState } from "react";

const AGENTIFY_API_URL = PYTHON_SERVER_URL;

type AgentUsageStats = {
  totalTransaction: number;
  transactionDifference: number;
  mostUsedAgent: string;
  transactionVolume: number;
  volumeDifference: number;
  chainsInteracted: number;
  chainsDifference: number;
};

const useFetchDashboardHeader = () => {
  const [dashboardStats, setDashboardStats] = useState<AgentUsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { identityToken } = useIdentityToken();
  const { user, getAccessToken } = usePrivy();

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // const query = new URLSearchParams({
      //   user_id: userId,
      // });
      const accessToken = await getAccessToken();


      const response = await fetch(`${AGENTIFY_API_URL}/api/dashboard/stats`, { // ?${query.toString()}
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      setDashboardStats(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error occurred while fetching dashboard stats:", error);
      setError(error.message || "Something went wrong");
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

export default useFetchDashboardHeader;
