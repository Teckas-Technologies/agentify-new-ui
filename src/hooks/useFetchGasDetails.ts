import { PYTHON_SERVER_URL } from "@/config/constants";
import { useState } from "react";

const useFetchGasDetails = () => {
  const [gasDetails, setGasDetails] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // ✅ Added loading

  const fetchGasDetails = async (userId: string) => {
    try {
      setLoading(true); // ✅ Start loading
      setError(null);
      const query = new URLSearchParams({ user_id: userId });
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/dashboard/gasDetails?${query.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Gas Details ---", result);
      setGasDetails(result);
      return result;
    } catch (err: any) {
      console.error("Error fetching gas details:", err);
      setError(err.message || "Something went wrong");
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
