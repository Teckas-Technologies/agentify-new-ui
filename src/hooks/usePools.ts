import { useState } from "react";

const API_URL = "https://api.sega.so/api/pools/key/ids";

export const usePools = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPools = async (poolIds: string[]) => {
        setLoading(true);
        setError(null);

        try {
            const url = `${API_URL}?ids=${poolIds.join(",")}`;

            const response = await fetch(url, {
                method: "GET",
                headers: { "Accept": "application/json" },
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const result = await response.json();
            setData(result);
            return result;
        } catch (err: any) {
            setError(err.message || "Failed to fetch pool data.");
            console.error("Pools API Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, fetchPools };
};
