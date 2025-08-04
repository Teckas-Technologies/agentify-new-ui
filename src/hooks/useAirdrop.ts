import { usePrivy } from '@privy-io/react-auth';
import { useCallback } from 'react';
import { useAccount } from 'wagmi';

const API_BASE = `${process.env.NEXT_PUBLIC_AIRDROP_API_URL}/api/onboarding`;

export function useAirdrop() {
    const { user } = usePrivy();
    const { address } = useAccount();

    const createUser = useCallback(async (data: {
        privyId: string;
        name?: string;
        email?: string;
        referredBy?: string;
    }) => {
        try {
            console.log("Creating user with data:", data);
            const requestBody = {
                ...data,
                walletAddress: address || null,
                referralCode: data?.privyId?.replace("did:privy:", "")
            };
            console.log("Request body for user creation:", requestBody);

            const res = await fetch(`${API_BASE}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            return await res.json();
        } catch (error) {
            console.error("Error creating user:", error);
            return null;
        }
    }, [address]);

    const getAllUsers = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/all`);
            return await res.json();
        } catch (error) {
            console.error("Error fetching all users:", error);
            return [];
        }
    }, []);

    const getUserByPrivyId = useCallback(async (privyId: string) => {
        try {
            const res = await fetch(`${API_BASE}/privy/${privyId}`);
            return await res.json();
        } catch (error) {
            console.error(`Error fetching user by privyId (${privyId}):`, error);
            return null;
        }
    }, []);

    const getUserByWallet = useCallback(async (walletAddress: string) => {
        try {
            const res = await fetch(`${API_BASE}/wallet/${walletAddress}`);
            return await res.json();
        } catch (error) {
            console.error(`Error fetching user by wallet (${walletAddress}):`, error);
            return null;
        }
    }, []);

    const loginUser = useCallback(async (payload: {
        email?: string;
        walletAddress?: string;
    }) => {
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            return await res.json();
        } catch (error) {
            console.error("Error logging in user:", error);
            return null;
        }
    }, []);

    const completeTask = useCallback(async ({
        taskName,
        identifier,
    }: {
        taskName: 'telegram' | 'twitter' | 'discord' | 'github';
        identifier: string;
    }) => {
        try {
            const res = await fetch(`${API_BASE}/task/${taskName}/${identifier}`, {
                method: 'PATCH',
            });
            return await res.json();
        } catch (error) {
            console.error(`Error completing task "${taskName}" for ${identifier}:`, error);
            return null;
        }
    }, []);

    const completeTasksBatch = useCallback(async ({
        identifier,
        tasks,
    }: {
        identifier: string;
        tasks: Partial<{
            telegram: boolean;
            twitter: boolean;
            discord: boolean;
            github: boolean;
        }>;
    }) => {
        try {
            const res = await fetch(`${API_BASE}/tasks/${identifier}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks }),
            });
            return await res.json();
        } catch (error) {
            console.error(`Error completing tasks batch for ${identifier}:`, error);
            return null;
        }
    }, []);

    const deleteUser = useCallback(async (identifier: string) => {
        try {
            const res = await fetch(`${API_BASE}/${identifier}`, {
                method: 'DELETE',
            });
            return await res.json();
        } catch (error) {
            console.error(`Error deleting user with identifier ${identifier}:`, error);
            return null;
        }
    }, []);

    return {
        createUser,
        getAllUsers,
        getUserByPrivyId,
        getUserByWallet,
        loginUser,
        completeTask,
        completeTasksBatch,
        deleteUser,
    };
}
