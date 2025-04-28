import { useState } from "react";
import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";

const AGENTIFY_API_URL = PYTHON_SERVER_URL;

const useFetchSavedCommands = () => {
  const [savedCommands, setSavedCommands] = useState<{
    data: any[];
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved commands with optional skip and limit parameters
  const fetchSavedCommands = async (
    userId: string,
    skip?: number,
    limit?: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        user_id: userId,
        skip: skip !== undefined ? skip.toString() : "0", // Default to 0 if skip is not provided
        limit: limit !== undefined ? limit.toString() : "10", // Default to 10 if limit is not provided
      });
      const accessToken = await getAccessToken();
      console.log("Access ...................", accessToken);

      const response = await fetch(
        `${AGENTIFY_API_URL}/api/agentCommands/?${query.toString()}`,
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
      console.log("Saved Commands Data ---", result);

      // Store the response with pagination metadata
      setSavedCommands({
        data: result.data, // the commands array
        totalPages: result.totalPages, // the total pages
      });
      return result;
    } catch (err: any) {
      console.error("Error fetching saved commands:", err);
      setError(err.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    savedCommands,
    loading,
    error,
    fetchSavedCommands,
  };
};

export default useFetchSavedCommands;
