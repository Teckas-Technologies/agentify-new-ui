import { useState } from "react";

const GAS_DETAILS_API_URL = "https://agentify-lifi-g9f2ghedephpgkeg.canadacentral-01.azurewebsites.net/api/dashboard/gasDetails";

const useFetchGasDetails = () => {
  const [gasDetails, setGasDetails] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGasDetails = async (userId: string) => {
    try {
      setError(null);
      const query = new URLSearchParams({ user_id: userId });
      const response = await fetch(`${GAS_DETAILS_API_URL}?${query.toString()}`);

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
    }
  };

  return {
    gasDetails,
    error,
    fetchGasDetails,
  };
};

export default useFetchGasDetails;
