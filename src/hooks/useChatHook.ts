import { PYTHON_SERVER_URL } from '@/config/constants';
import { useState } from 'react';
import { useAccount } from 'wagmi';

interface RequestFields {
    inputMessage: string;
    agentName: string;
    userId: string;
}

export const useChat = () => {
    const { address } = useAccount();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const chat = async (data: RequestFields) => {
        if (!address) {
            console.log("Please connect your wallet.")
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agentName: data.agentName, // "Swap Agent"
                    message: data.inputMessage,
                    threadId: data.agentName,  // "Swap Agent"
                    walletAddress: address,
                    userId: data.userId,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (err: any) {
            setError(err.message || "An error occurred");
            return { success: false, message: err.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };

    const fetchAgents = async ({
        page = 1,
        limit = 10,
        is_favourite = false,
        search_query = ""
    }: {
        page?: number;
        limit?: number;
        is_favourite?: boolean;
        search_query?: string;
    }) => {
        try {
            setLoading(true);
            setError(null);

            const skip = (page - 1) * limit;

            const queryParams = new URLSearchParams({
                user_id: address || "1",
                skip: skip.toString(),
                limit: limit.toString(),
                is_favourite: is_favourite.toString(),
                search_query,
            });

            const response = await fetch(`${PYTHON_SERVER_URL}/api/v1/agents/?${queryParams.toString()}`, {
                method: "GET",
                // headers: {
                //     "Content-Type": "application/json",
                //     Authorization: `Bearer ${token}`,
                // },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (err: any) {
            console.error("Error occurred:", err);
            setError(err.message || "Something went wrong");
            return [];
        } finally {
            setLoading(false);
        }
    };

    const fetchChatHistory = async (userId: string, agentId: string) => {
        if (!address) {
            console.log("Please connect your wallet.")
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${PYTHON_SERVER_URL}/api/history/${userId}/${agentId}`, {
                method: "GET"
            })
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const result = await response.json();
            console.log("Result:", result)
            return result;
        } catch (err: any) {
            console.error("Error occurred:", err);
            setError(err?.message || "Something went wrong");
        } finally {
            setLoading(false);
            console.log("Loading state set to false");
        }
    }

    const clearHistory = async (userId: string, agentId: string) => {
        if (!address) {
            console.log("Please connect your wallet.")
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${PYTHON_SERVER_URL}/api/history/${userId}/${agentId}`, {
                method: "DELETE"
            })
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const result = await response.json();
            console.log("Result:", result)
            return result;
        } catch (err: any) {
            console.error("Error occurred:", err);
            setError(err?.message || "Something went wrong");
        } finally {
            setLoading(false);
            console.log("Loading state set to false");
        }
    }

    return { loading, error, chat, fetchChatHistory, clearHistory, fetchAgents };
};
