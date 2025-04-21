import { useState } from "react";
import { PYTHON_SERVER_URL } from "@/config/constants";

const useFetchAgents = () => {
  const [agentsData, setAgentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const AGENTIFY_AI = PYTHON_SERVER_URL;

  const fetchAgents = async ({
    userId,
    skip = 0,
    limit = 2,
    searchQuery = "",
    isFavourite = false,
    filter = "",
  }: {
    userId: string;
    skip?: number;
    limit?: number;
    searchQuery?: string;
    isFavourite?: boolean;
    filter?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        user_id: userId,
        skip: skip.toString(),
        limit: limit.toString(),
        search_query: searchQuery,
        is_favourite: isFavourite.toString(),
        filter: filter, // 👈 added this
      });

      const response = await fetch(`${AGENTIFY_AI}/api/v1/agents/?${query.toString()}`);
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const result = await response.json();
      console.log("Agents response ---", result);

      setAgentsData(result.data || []);
      setTotalPages(result.totalPages || 1);
      setCurrentPage(result.currentPage || 1);
      setPageSize(result.pageSize || limit);

      return result;
    } catch (err: any) {
      console.error("Error occurred while fetching agents:", err);
      setError(err.message || "Something went wrong");
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    agentsData,
    loading,
    error,
    fetchAgents,
    totalPages,
    currentPage,
    pageSize,
  };
};

export default useFetchAgents;
