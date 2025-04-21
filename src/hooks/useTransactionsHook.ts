import { PYTHON_SERVER_URL } from '@/config/constants';
import { useState } from 'react';

export interface RequestFields {
     transaction_id: string;
     user_id: string;
     wallet_address:string;
     agent_id: string;
     transaction_type: string;
     status: string;
     transaction_volume:string;
}

export const useTransactions = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = async (userId:any,agentId:any,skip:any,limit:any) => {
        setLoading(true);
        setError(null)
        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/api/transactions/?skip=${skip}&limit=${limit}&agent_id=${agentId}&user_id=${userId}`);

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
        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/api/transactions/`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transaction_id: data.transaction_id,
                    user_id: data.user_id,
                    wallet_address:data.wallet_address,
                    agent_id: data.agent_id,
                    transaction_type: data.transaction_type,
                    status: data.status,
                    transaction_volume: data.transaction_volume
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


    return { loading, error, fetchTransactions,createTransactions };
};