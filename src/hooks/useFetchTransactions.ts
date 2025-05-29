import { PYTHON_SERVER_URL } from "@/config/constants";
import { getAccessToken } from "@privy-io/react-auth";
import { useState } from "react";

const TRANSACTIONS_API_URL =
  "https://agentify-lifi-g9f2ghedephpgkeg.canadacentral-01.azurewebsites.net/api/transactions/";

const AGENTIFY_API_URL = PYTHON_SERVER_URL;

export interface Transaction {
  _id: string;
  user_id: string;
  agent_id: string;
  transaction_type: string;
  description: string;
  chain: string;
  time: string;
  crypto: string;
  amount: number;
  transaction_hash: string;
  explorer_url: string;
  status: string;
  amountUSD: number;
  gasUSD: number;
  agent_name: string;
}

interface TransactionResponse {
  data: Transaction[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

const useFetchTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async ({
    agentId,
    searchQuery,
    filter,
    skip = 0,
    limit = 10,
  }: {
    agentId?: string;
    searchQuery?: string;
    filter?: string;
    skip?: number;
    limit?: number;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });
      if (agentId) params.append("agent_id", agentId);
      if (searchQuery) params.append("search_query", searchQuery);
      if (filter) params.append("filter", filter);
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${AGENTIFY_API_URL}/api/transactions/?${params.toString()}`,
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

      const result: TransactionResponse = await response.json();
      setTransactions(result.data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error fetching transactions:", error);
      setError(error.message || "Something went wrong");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    transactions,
    error,
    isLoading,
    fetchTransactions,
  };
};

export default useFetchTransactions;
