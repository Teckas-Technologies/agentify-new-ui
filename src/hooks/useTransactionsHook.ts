import { PYTHON_SERVER_URL } from '@/config/constants';
import { useState } from 'react';
import { RequestFields, RequestFieldsv2 } from "@/types/types";
import { getAccessToken } from '@privy-io/react-auth';

export const useTransactions = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = async (search_query: string, skip: number, limit: number, activityType = "") => {
        setLoading(true);
        setError(null)
        const accessToken = await getAccessToken();
        try {
            const filterQuery = activityType ? `&filter=${activityType}` : "";
            const response = await fetch(
                `${PYTHON_SERVER_URL}/api/transactions/?skip=${skip}&limit=${limit}&search_query=${search_query}${filterQuery}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message || "An error occurred");
            return { success: false, message: error.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };

    const createTransactions = async (data: RequestFields) => {
        setLoading(true);
        setError(null)
        const accessToken = await getAccessToken();
        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/api/transactions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    user_id: data.user_id,
                    agent_id: data.agent_id,
                    transaction_type: data.transaction_type,
                    description: data.description,
                    chain: data.chain,
                    time: data.time,
                    crypto: data.crypto,
                    amount: data.amount,
                    transaction_hash: data.transaction_hash,
                    explorer_url: data.explorer_url,
                    status: data.status,
                    amountUSD: data.amountUSD,
                    gasUSD: data.gasUSD,
                    agent_name: data.agent_name,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message || "An error occurred");
            return { success: false, message: error.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    }

    const createTransactionsv2 = async (data: RequestFieldsv2) => {
        setLoading(true);
        setError(null);
        const accessToken = await getAccessToken();

        const requestBody = {
            user_id: data.user_id,
            agent_id: data.agent_id,
            transaction_type: data.transaction_type,
            description: data.description,
            chain: data.chain,
            time: data.time,
            crypto: data.crypto,
            amount: data.amount,
            transaction_hash: data.transaction_hash,
            explorer_url: data.explorer_url,
            status: data.status,
            rpcUrl: data.rpcUrl,
            symbol: data.symbol,
            decimal: data.decimal,
            agent_name: data.agent_name,
            token_symbol: data.token_symbol
        };

        // for (const [key, value] of Object.entries(requestBody)) {
        //     console.log(`- ${key}:`, value, `(${typeof value})`);
        // }

        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/api/transactions/hash/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(requestBody),
            });

            // First try to read as text
            const responseText = await response.text();
            let result;

            try {
                // Then try to parse as JSON
                result = JSON.parse(responseText);
            } catch (jsonError) {
                if (!response.ok) {
                    throw new Error(responseText || `HTTP error! Status: ${response.status}`);
                }
                result = responseText;
            }

            if (!response.ok) {
                throw new Error(result.message || responseText || `HTTP error! Status: ${response.status}`);
            }

            return { success: true, data: result };

        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message || "An error occurred");
            return { success: false, message: error.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };



    return { loading, error, fetchTransactions, createTransactions, createTransactionsv2 };
};