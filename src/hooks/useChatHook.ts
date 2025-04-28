import { PYTHON_SERVER_URL } from '@/config/constants';
import { Agent } from '@/types/types';
import { useState } from 'react';
import { useAccount } from 'wagmi';

interface RequestFields {
    inputMessage: string;
    agentName: string;
    userId: string;
    isTransaction: boolean;
}

export const useChat = (initialAgents: any[] = []) => {
    const { address } = useAccount();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [agents, setAgents] = useState<Agent[]>(initialAgents || []);

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
                    isTransaction: data.isTransaction
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
            setAgents(result.data || []);
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

    const updateMessage = async (userId: string, agentId: string, newMessage: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${PYTHON_SERVER_URL}/api/history/${userId}/${agentId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ newMessage }),
                }
            );

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

    const sendAgentCommand = async (
        userId: string,
        agentId: string,
        agentName: string,
        command: string
    ) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/api/agentCommands/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    agent_id: agentId,
                    agent_name: agentName,
                    command,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            return { success: false, message: err.message || 'An error occurred' };
        } finally {
            setLoading(false);
        }
    };

    const getAgentCommands = async (
        userId: string,
        agentId: string,
        skip: number = 0,
        limit: number = 10
    ) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${PYTHON_SERVER_URL}/api/agentCommands/?user_id=${userId}&agent_id=${agentId}&skip=${skip}&limit=${limit}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            return { success: false, message: err.message || 'An error occurred' };
        } finally {
            setLoading(false);
        }
    };

    const deleteAgentCommand = async ({
        userId,
        agentId,
        command,
    }: {
        userId: string;
        agentId: string;
        command: string;
    }) => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams({
                user_id: userId,
                agent_id: agentId,
                command: command,
            });

            const response = await fetch(`${PYTHON_SERVER_URL}/api/agentCommands?${queryParams.toString()}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Failed to delete agent command. Status: ${response.status}`);
            }

            return { success: true };
        } catch (err: any) {
            console.error("Error deleting agent command:", err);
            setError(err.message || "Something went wrong during deletion");
            return { success: false, message: err.message || "Something went wrong" };
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, agents, chat, fetchChatHistory, clearHistory, fetchAgents, updateMessage, sendAgentCommand, getAgentCommands, deleteAgentCommand };
};
