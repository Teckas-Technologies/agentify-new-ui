import { PYTHON_SERVER_URL } from '@/config/constants';
import { getAccessToken } from '@privy-io/react-auth';
import { useState } from 'react';

export const useTab = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const getTabs = async () => {
        setLoading(true);
        setError(null);
        const accessToken = await getAccessToken();
        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/api/list-agents`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`, 
                },
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


    return { loading, error, getTabs };
};
