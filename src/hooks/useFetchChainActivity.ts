import { useState } from "react";
import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";

const AGENTIFY_API_URL = PYTHON_SERVER_URL;

type ChainCount = {
  chainName: string;
  count: number;
};

const useFetchChainActivity = () => {
  const [chainActivity, setChainActivity] = useState<ChainCount[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChainActivity = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({ user_id: userId });
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${AGENTIFY_API_URL}/api/dashboard/chainActivity?${query.toString()}`,
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

      const result: ChainCount[] = await response.json();
      setChainActivity(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error fetching chain activity:", error);
      setError(error.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    chainActivity,
    loading,
    error,
    fetchChainActivity,
  };
};

export default useFetchChainActivity;
