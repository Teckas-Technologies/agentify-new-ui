import { useState } from "react";
import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";
import { Agent } from "@/types/types";

const useFetchAgents = (initialData: Agent[] = []) => {
  const [agentsData, setAgentsData] = useState<Agent[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const AGENTIFY_AI = PYTHON_SERVER_URL;

  const fetchAgents = async ({
    skip = 0,
    limit = 6,
    searchQuery = "",
    isFavourite = false,
    filter = "",
  }: {
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
        skip: skip.toString(),
        limit: limit.toString(),
        search_query: searchQuery,
        is_favourite: isFavourite.toString(),
      });
      
      if (filter && filter.trim() !== "") {
        query.append("filter", filter); // ✅ only if filter has a value
      }
      const url = `${AGENTIFY_AI}/api/v1/agents/list-agents/?${query.toString()}`;
    const accessToken = await getAccessToken();
    const response = await fetch(`${AGENTIFY_AI}/api/v1/agents/list-agents/?${query.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, 
      },
    });
    
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const result = await response.json();

      setAgentsData(result.data || []);
      setTotalPages(result.totalPages || 1);
      setCurrentPage(result.currentPage || 1);
      setPageSize(result.pageSize || limit);

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error occurred while fetching agents:", error);
      setError(error.message || "Something went wrong");
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
