import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";
import { useState } from "react";

type GasUsagePerDay = {
  day: string; // e.g., "Monday", "Tuesday", etc.
  gas: number;
};

type WeeklyGasStats = {
  totalGas: number;
  average: number;
  data: GasUsagePerDay[];
};


const useFetchGasDetails = () => {
  const [gasDetails, setGasDetails] = useState<WeeklyGasStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // ✅ Added loading

  const fetchGasDetails = async () => {
    const accessToken = await getAccessToken();
    try {
      setLoading(true); // ✅ Start loading
      setError(null);
      // const query = new URLSearchParams({ user_id: userId });
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/dashboard/gasDetails`, // ?${query.toString()}
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
      setGasDetails(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error fetching gas details:", error);
      setError(error.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false); // ✅ Stop loading
    }
  };

  return {
    gasDetails,
    error,
    loading, // ✅ Expose loading
    fetchGasDetails,
  };
};

export default useFetchGasDetails;
