import { useSolanaWallets } from "@privy-io/react-auth";
import { useState } from "react";

const API_URL = "https://api.sega.so/swap/compute/swap-base-in";
const BASE_URL = "https://api.sega.so/swap";

interface SwapData {
    inputMint: string;
    outputMint: string;
    amount: string;
    inputDecimal?: number;
    slippageBps?: number
}
// 

export const useSegaApi = () => {
    const { wallets } = useSolanaWallets();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [txResponse, setTxResponse] = useState<any>(null);

    const solanaWallet = wallets[0];
    const solanaAddress = solanaWallet?.address;

    const txVersion = "V1.0.0";

    const fetchSwapCompute = async ({ inputMint, outputMint, amount, slippageBps = 50 }: SwapData) => {
        setLoading(true);
        setError(null);

        try {
            const url = `${BASE_URL}/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&txVersion=${txVersion}`;

            const response = await fetch(url, {
                method: "GET",
                headers: { "Accept": "application/json" },
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const result = await response.json();
            setData(result);
            console.log("RES:", result)
            return result;
        } catch (err: any) {
            setError(err.message || "Failed to fetch swap computation.");
            console.error("Swap API Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const submitSwapTransaction = async ({ amount, swapResponse, wrapSol = true, unwrapSol = true }: {
        amount: string;
        swapResponse: any;
        wrapSol?: boolean;
        unwrapSol?: boolean;
    }) => {
        if (!solanaAddress) {
            console.log("Please connect your wallet.")
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const url = `${BASE_URL}/transaction/swap-base-in`;

            const body = JSON.stringify({
                wallet: solanaAddress,
                computeUnitPriceMicroLamports: amount,
                swapResponse,
                txVersion: txVersion,
                wrapSol,
                unwrapSol,
                outputAccount: solanaAddress,
            });

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body,
            });

            if (!response.ok) {
                throw new Error(`Transaction request failed: ${response.statusText}`);
            }

            const result = await response.json();
            setTxResponse(result);
            return result;
        } catch (err: any) {
            setError(err.message || "Transaction failed.");
            console.error("Transaction API Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Wrapper function to handle both API calls in sequence
    const fetchSwapRawData = async ({ inputMint, outputMint, amount, inputDecimal = 9 }: SwapData) => {
        setLoading(true);
        setError(null);

        const parsedAmount = Math.floor(parseFloat(amount) * Math.pow(10, inputDecimal)); // Convert to smallest unit

        console.log(`Parsed Amount: ${parsedAmount} (${amount} * 10^${inputDecimal})`);

        try {
            // Step 1: Get Swap Computation
            const swapComputeResponse = await fetchSwapCompute({ inputMint, outputMint, amount: parsedAmount.toString() });

            if (!swapComputeResponse || !swapComputeResponse.success) {
                throw new Error("Swap computation failed.");
            }

            // Step 2: Submit Swap Transaction
            const swapTransactionResponse = await submitSwapTransaction({ amount: parsedAmount.toString(), swapResponse: swapComputeResponse });

            console.log("DATA:", swapTransactionResponse)

            return swapTransactionResponse;
        } catch (err: any) {
            setError(err.message || "Swap execution failed.");
            console.error("Swap Execution Error:", err);
        } finally {
            setLoading(false);
        }
    };


    return { data, loading, error, fetchSwapRawData };
};
