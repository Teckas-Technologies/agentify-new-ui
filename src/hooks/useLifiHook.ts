import { useState } from "react";
import { convertQuoteToRoute, executeRoute, getQuote, getChains, getConnections, getTools, getToken, updateRouteExecution, getRoutes, ChainKey, ConnectionsRequest, Route, ChainId } from "@lifi/sdk";
import { useAccount } from "wagmi";
import { TransactionError } from "./useAaveHook";
import { readContract, getBalance } from '@wagmi/core';
import { wagmiConfig } from "@/contexts/CustomWagmiProvider";
import { erc20Abi } from 'viem';

// import { customSwitchNetwork } from "../wagmiConfig"; // Uncomment if network switching is needed

// Native token addresses used by LiFi SDK (all represent native gas tokens)
const NATIVE_TOKEN_ADDRESSES = [
    '0x0000000000000000000000000000000000000000',
    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
].map(addr => addr.toLowerCase());

const useLifiHook = () => {
    const { address, isConnected } = useAccount();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // const getTransactionLinks = (route: any) => {
    //     route.steps.forEach((step: any, index: any) => {
    //         step.execution?.process.forEach((process: any) => {
    //             if (process.txHash) {
    //                 // console.log(
    //                 //     `Transaction Hash for Step ${index + 1}, Process ${process.type}:`,
    //                 //     process.txHash
    //                 // )
    //             }
    //         })
    //     })
    // }

    // ✅ Validate Token Balance - Using Wagmi instead of LiFi to avoid provider issues
    // Supports both native tokens (ETH, MATIC, BNB, etc.) and ERC20 tokens
    const validateTokenBalance = async (chainId: number, tokenAddress: { address: string }, amount: string) => {
        if (!address) {
            return false;
        }
        try {
            // Get token info from LiFi
            const token = await getToken(chainId, tokenAddress.address);

            // Check if it's a native token (ETH, MATIC, BNB, etc.)
            const isNativeToken = NATIVE_TOKEN_ADDRESSES.includes(tokenAddress.address.toLowerCase());

            let userBalance: bigint;

            if (isNativeToken) {
                // ✅ Native token: Use getBalance (ETH, MATIC, BNB, AVAX, etc.)
                const nativeBalance = await getBalance(wagmiConfig as any, {
                    address: address as `0x${string}`,
                    chainId: chainId as any,
                });
                userBalance = nativeBalance.value;
            } else {
                // ✅ ERC20 token: Use readContract with balanceOf (USDT, USDC, DAI, etc.)
                const erc20Balance = await readContract(wagmiConfig as any, {
                    address: tokenAddress.address as `0x${string}`,
                    abi: erc20Abi,
                    functionName: 'balanceOf',
                    args: [address as `0x${string}`],
                    chainId: chainId as any,
                });
                userBalance = BigInt(erc20Balance?.toString() || "0");
            }

            const requiredAmount = BigInt(amount);

            if (userBalance < requiredAmount) {
                const available = Number(userBalance) / Math.pow(10, token.decimals);
                const required = Number(requiredAmount) / Math.pow(10, token.decimals);
                setError(`You have ${available} ${token.symbol}, but you need ${required} ${token.symbol} for this transaction. Please add more funds or reduce the amount.`);
                return false;
            }

            return true;
        } catch (err) {
            const errorMessage = (err as Error).message || '';

            // Provide more specific error messages
            if (errorMessage.includes('execution reverted') || errorMessage.includes('call revert')) {
                setError("Unable to fetch token balance. The token contract may not be valid.");
            } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                setError("Network error. Please check your connection and try again.");
            } else {
                setError("Failed to fetch token balance. Please try again.");
            }
            return false;
        }
    };

    // ✅ Validate Available Chains
    const validateChains = async (fromChain: number, toChain: number) => {
        try {
            const chains = await getChains();
            if (!chains.some((chain) => chain.id === fromChain) || !chains.some((chain) => chain.id === toChain)) {
                setError("Selected blockchain is not supported. Please choose a different network.");
                return false;
            }
            return true;
        } catch (err) {
            setError("Failed to fetch supported chains. Please try again.");
            return false;
        }
    };

    // ✅ Validate Available Token Swap/Bridge Routes
    const validateConnections = async (fromChain: number, fromToken: string, toChain: number, toToken: string) => {
        try {
            const response = await getConnections({ fromChain, fromToken, toChain, toToken });
            if (!response || response?.connections.length === 0) {
                setError("Swap/bridge route not supported. Please select different tokens or chains.");
                return false;
            }
            return true;
        } catch (err) {
            setError("Failed to fetch available connections. Please try again.");
            return false;
        }
    };

    // ✅ Validate Available Bridges & Exchanges
    const validateTools = async (chainId: number) => {
        try {
            const tools = await getTools({ chains: [chainId] });
            if (!tools || tools.bridges.length === 0 || tools.exchanges.length === 0) {
                setError("No available bridges or DEXs for this chain. Please choose another network.");
                return false;
            }
            return true;
        } catch (err) {
            setError("Failed to fetch available tools. Please try again.");
            return false;
        }
    };

    const fetchRoutes = async ({ address }: { address: `0x${string}` }) => {
        if (!address) {
            console.error('Please connect your wallet');
            return;
        }

        try {
            const routesRequest = {
                fromChainId: 1, // Arbitrum
                toChainId: 137, // Optimism
                fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // USDC on Arbitrum
                toTokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // DAI on Optimism
                fromAmount: '1000000000000', // 10 USDC
                fromAddress: address.toLowerCase(),
            };

            const result = await getRoutes(routesRequest);
            const routes = result.routes;

            return routes
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    }

    // ✅ Fetch Quote with Validations
    const fetchQuote = async ({ address }: { address: `0x${string}` }) => {
        if (!address) {
            setError("Wallet address is required. Please connect your wallet.");
            return;
        }

        const fromChain = 1; // Polygon
        const toChain = 137; // Ethereum Mainnet
        const fromToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // ETH on Ethereum
        const toToken = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon

        // 🔍 Validate Chains & Connections Before Fetching Quote
        if (!(await validateChains(fromChain, toChain))) return;
        if (!(await validateConnections(fromChain, fromToken, toChain, toToken))) return;

        try {
            setLoading(true);
            setError(null);

            const quote = await getQuote({
                fromChain,
                toChain,
                fromToken,
                toToken,
                fromAmount: "1000000000000", // 5 USDT
                fromAddress: address.toLowerCase()
            });

            if (!quote || !quote.estimate || !quote.action) {
                setError("Invalid quote received. Please try again.");
                return;
            }

            return quote;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message || "Failed to fetch a quote. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Execute swap & bridge
    const executeLifi = async ({ quote }: { quote: Route }): Promise<{ txHash: string } | undefined> => {
        if (!quote || !quote?.fromChainId) {
            setError("Invalid quote. Please fetch a new quote before proceeding.");
            return;
        }

        const { fromChainId, fromToken, toChainId, toToken, fromAmount } = quote;

        if (!(await validateChains(fromChainId, toChainId))) return;
        if (!(await validateTools(fromChainId))) return;

        if (!address) {
            setError("Wallet not connected. Please connect your wallet first.");
            return;
        }

        if (!(await validateTokenBalance(fromChainId, fromToken, fromAmount))) return;

        try {
            setLoading(true);
            setError(null);

            // const route = convertQuoteToRoute(quote);

            return new Promise((resolve, reject) => {
                let resolved = false;
                executeRoute(quote, { // route
                    updateRouteHook(updatedRoute) {
                        updatedRoute.steps.forEach((step) => {
                            step.execution?.process.forEach((process) => {
                                if (process.txHash && process.status === "PENDING") {
                                    // console.log("Transaction sent! TX Hash:", process.txHash);
                                    resolved = true;

                                    // ✅ Push execution to background
                                    updateRouteExecution(updatedRoute, { executeInBackground: true });

                                    // ✅ Resolve immediately with TX hash
                                    resolve({ txHash: process.txHash });

                                    return;
                                }
                            });
                        });
                    },
                }) // If executionRoute throws, reject the promise can remove .catch(reject);
                    .then(() => {
                        if (!resolved) resolve(undefined); // fallback resolve
                    })
                    .catch((error: unknown) => {
                        const err = error as TransactionError;
                        // ✅ Properly catch errors and set error message
                        if (err.message?.includes("User denied transaction signature") || err.name === "UserRejectedRequestError") {
                            setError("Looks like you cancelled the transaction. No worries! Let me know when you're ready to try again.");
                        } else if (err.name === "BalanceError" || err.message?.includes("balance is too low")) {
                            setError("It looks like your wallet doesn't have enough balance for this transaction. Please add more funds or reduce the amount and try again.");
                        } else if (err.name === "TransactionExecutionError") {
                            setError("The transaction couldn't be completed. This might be due to network issues or gas price changes. Please try again.");
                        } else {
                            setError(err.message || "An unexpected error occurred.");
                        }

                        reject(err); // Reject promise so caller knows execution failed
                    });
            });

        } catch (error: unknown) {
            const err = error as TransactionError;
            if (err.message?.includes("User denied transaction signature") || err.name === "UserRejectedRequestError") {
                setError("Looks like you cancelled the transaction. No worries! Let me know when you're ready to try again.");
            } else if (err.name === "BalanceError" || err.message?.includes("balance is too low")) {
                setError("It looks like your wallet doesn't have enough balance for this transaction. Please add more funds or reduce the amount and try again.");
            } else if (err.name === "TransactionExecutionError") {
                setError("The transaction couldn't be completed. This might be due to network issues or gas price changes. Please try again.");
            } else {
                setError(err.message || "An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, executeLifi, fetchQuote, fetchRoutes, validateTokenBalance };
};

export default useLifiHook;
