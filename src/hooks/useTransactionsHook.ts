import { PYTHON_SERVER_URL } from '@/config/constants';
import { useState } from 'react';
import {RequestFields,RequestFieldsv2 } from "@/types/types";
import { getAccessToken } from '@privy-io/react-auth';

export const useTransactions = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = async (userId:any,search_query:any,skip:any,limit:any,activityType = "") => {
        setLoading(true);
        setError(null)
        const accessToken = await getAccessToken();
        try {
            const filterQuery = activityType ? `&filter=${activityType}` : "";
            const response = await fetch(
                `${PYTHON_SERVER_URL}/api/transactions/?skip=${skip}&limit=${limit}&user_id=${userId}&search_query=${search_query}${filterQuery}`,
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
        } catch (err: any) {
            setError(err.message || "An error occurred");
            return { success: false, message: err.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };

    const createTransactions = async (data:RequestFields) => {
        setLoading(true);
        setError(null)
        const accessToken = await getAccessToken();
        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/api/transactions/`,{
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
        } catch (err: any) {
            setError(err.message || "An error occurred");
            return { success: false, message: err.message || "An error occurred" };
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

    console.log("🧾 Payload field types:");
    for (const [key, value] of Object.entries(requestBody)) {
        console.log(`- ${key}:`, value, `(${typeof value})`);
    }

    try {
        console.log("🔍 Sending transaction request to:", `${PYTHON_SERVER_URL}/api/transactions/hash/`);
        const response = await fetch(`${PYTHON_SERVER_URL}/api/transactions/hash/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(requestBody),
        });

        console.log("📥 Response Status:", response.status);
        
        // First try to read as text
        const responseText = await response.text();
        let result;
        
        try {
            // Then try to parse as JSON
            result = JSON.parse(responseText);
            console.log("✅ Response Body:", result);
        } catch (jsonError) {
            // If not JSON, use the text as the error message
            console.log("⚠️ Non-JSON Response:", responseText);
            if (!response.ok) {
                throw new Error(responseText || `HTTP error! Status: ${response.status}`);
            }
            result = responseText;
        }

        if (!response.ok) {
            throw new Error(result.message || responseText || `HTTP error! Status: ${response.status}`);
        }

        return { success: true, data: result };

    } catch (err: any) {
        console.error("❌ Error occurred:", err);
        setError(err.message || "An error occurred");
        return { success: false, message: err.message || "An error occurred" };
    } finally {
        setLoading(false);
    }
};



    return { loading, error, fetchTransactions,createTransactions,createTransactionsv2 };
};