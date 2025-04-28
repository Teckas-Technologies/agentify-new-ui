import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";
import { useState } from "react";

const AGENTIFY_AI = PYTHON_SERVER_URL; // Replace with your actual base URL

export const useFetchDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboard = async (agentId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${AGENTIFY_AI}/api/dashboard/${agentId}/${userId}`,
        {
          method: "GET",
          // Uncomment and customize if you need headers:
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
      setDashboardData(result);
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
    fetchDashboard,
    loading,
    error,
    dashboardData,
  };
};
