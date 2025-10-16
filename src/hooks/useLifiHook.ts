import { useState } from "react";
import { convertQuoteToRoute, executeRoute, getQuote, getChains, getConnections, getTools, getTokenBalance, getToken, updateRouteExecution, getRoutes, ChainKey, ConnectionsRequest, Route, ChainId } from "@lifi/sdk";
import { useAccount } from "wagmi";
import { TransactionError } from "./useAaveHook";

// import { customSwitchNetwork } from "../wagmiConfig"; // Uncomment if network switching is needed

// Utility to normalize error objects to prevent SDK parsing issues
const normalizeError = (error: any): any => {
    if (!error) return error;

    // If error has a cause with non-string details, normalize it
    if (error.cause && error.cause.details !== undefined && typeof error.cause.details !== 'string') {
        return {
            ...error,
            cause: {
                ...error.cause,
                details: error.cause.details ? String(error.cause.details) : ''
            }
        };
    }

    return error;
};

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

    // ✅ Validate Token Balance
    const validateTokenBalance = async (chainId: number, tokenAddress: { address: string }, amount: string) => {
        if (!address) {
            return;
        }
        try {
            const token = await getToken(chainId, tokenAddress.address);
            const tokenBalance = await getTokenBalance(address, token);
            const userBalance = BigInt(tokenBalance?.amount || "0");
            const requiredAmount = BigInt(amount);
            if (userBalance < requiredAmount) {
                setError("Insufficient token balance. Please check your wallet balance");
                return false;
            }
            return true;
        } catch (err) {
            setError("Failed to fetch token balance. Please try again.");
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

                // Wrap executeRoute with error normalization
                // Store original unhandledrejection handler
                const originalHandler = window.onunhandledrejection;
                let sdkErrorCaught = false;

                // Temporarily intercept unhandled rejections to catch SDK internal errors
                window.onunhandledrejection = (event: PromiseRejectionEvent) => {
                    const err = event.reason;

                    // Check if this is the LiFi SDK error we're trying to catch
                    if (err && err.stack && err.stack.includes('executeStep')) {
                        event.preventDefault(); // Prevent default error handling
                        sdkErrorCaught = true;

                        console.error("Caught SDK internal error:", err);

                        let errorMessage = "An unexpected error occurred.";

                        // Try to extract MetaMask error info
                        if (err?.code === 5730 || err?.message?.includes("No matching bundle found")) {
                            errorMessage = "MetaMask error: No matching bundle found. Please try again.";
                        } else if (err?.cause?.code === 5730 || err?.cause?.message?.includes("No matching bundle found")) {
                            errorMessage = "MetaMask error: No matching bundle found. Please try again.";
                        } else if (err.message) {
                            errorMessage = err.message;
                        }

                        setError(errorMessage);
                        reject(err);

                        // Restore original handler
                        window.onunhandledrejection = originalHandler;
                        return;
                    }

                    // Not our error, call original handler
                    if (originalHandler) {
                        originalHandler.call(window, event);
                    }
                };

                // Wrap executeRoute in a try-catch to handle SDK internal errors
                try {
                    const routePromise = executeRoute(quote, { // route
                        updateRouteHook(updatedRoute) {
                            try {
                                updatedRoute.steps.forEach((step) => {
                                    step.execution?.process.forEach((process) => {
                                        if (process.txHash && process.status === "PENDING") {
                                            // console.log("Transaction sent! TX Hash:", process.txHash);
                                            resolved = true;

                                            // ✅ Push execution to background
                                            updateRouteExecution(updatedRoute, { executeInBackground: true });

                                            // ✅ Resolve immediately with TX hash
                                            resolve({ txHash: process.txHash });

                                            // Restore handler
                                            window.onunhandledrejection = originalHandler;
                                            return;
                                        }
                                    });
                                });
                            } catch (hookError: any) {
                                console.error("Error in updateRouteHook:", hookError);
                                // Don't reject here, let the main catch handle it
                            }
                        },
                    });

                    routePromise
                        .then(() => {
                            // Restore handler on success
                            window.onunhandledrejection = originalHandler;
                            if (!resolved) resolve(undefined); // fallback resolve
                        })
                        .catch((error: unknown) => {
                            // Restore handler
                            window.onunhandledrejection = originalHandler;

                            const err = error as any;
                            console.error("executeRoute error:", err);

                            // ✅ Properly catch errors and set error message
                            let errorMessage = "An unexpected error occurred.";

                            // Handle MetaMask specific errors
                            if (err?.code === 5730 || err?.message?.includes("No matching bundle found")) {
                                errorMessage = "MetaMask error: No matching bundle found. Please try again.";
                            } else if (err?.cause?.code === 5730 || err?.cause?.message?.includes("No matching bundle found")) {
                                errorMessage = "MetaMask error: No matching bundle found. Please try again.";
                            } else if (err.message?.includes("User denied transaction signature") || err.name === "UserRejectedRequestError") {
                                errorMessage = "Transaction rejected by the user.";
                            } else if (err.name === "BalanceError" || err.message?.includes("balance is too low")) {
                                errorMessage = "Insufficient balance. Please check your wallet and try again.";
                            } else if (err.name === "TransactionExecutionError") {
                                errorMessage = "Transaction execution failed. Please try again.";
                            } else if (err.message) {
                                errorMessage = err.message;
                            }

                            setError(errorMessage);
                            reject(err); // Reject promise so caller knows execution failed
                        });
                } catch (syncError: any) {
                    // Restore handler
                    window.onunhandledrejection = originalHandler;

                    // Catch any synchronous errors from executeRoute
                    console.error("Synchronous error in executeRoute:", syncError);

                    let errorMessage = "An unexpected error occurred.";
                    if (syncError?.code === 5730 || syncError?.message?.includes("No matching bundle found")) {
                        errorMessage = "MetaMask error: No matching bundle found. Please try again.";
                    } else if (syncError.message) {
                        errorMessage = syncError.message;
                    }

                    setError(errorMessage);
                    reject(syncError);
                }
            });

        } catch (error: unknown) {
            const err = error as any;

            // Handle MetaMask specific errors
            if (err?.code === 5730 || err?.message?.includes("No matching bundle found")) {
                setError("MetaMask error: No matching bundle found. Please try again.");
            } else if (err.message?.includes("User denied transaction signature") || err.name === "UserRejectedRequestError") {
                setError("Transaction rejected by the user.");
            } else if (err.name === "BalanceError" || err.message?.includes("balance is too low")) {
                setError("Insufficient balance. Please check your wallet and try again.");
            } else if (err.name === "TransactionExecutionError") {
                setError("Transaction execution failed. Please try again.");
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
