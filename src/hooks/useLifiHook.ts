import { useState } from "react";
import { convertQuoteToRoute, executeRoute, getQuote, getChains, getConnections, getTools, getTokenBalance, getToken, updateRouteExecution, getRoutes } from "@lifi/sdk";
import { useAccount } from "wagmi";

// import { customSwitchNetwork } from "../wagmiConfig"; // Uncomment if network switching is needed

const useLifiHook = () => {
    const { address, isConnected } = useAccount();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTransactionLinks = (route: any) => {
        route.steps.forEach((step: any, index: any) => {
            step.execution?.process.forEach((process: any) => {
                if (process.txHash) {
                    console.log(
                        `Transaction Hash for Step ${index + 1}, Process ${process.type}:`,
                        process.txHash
                    )
                }
            })
        })
    }

    // ✅ Validate Token Balance
    const validateTokenBalance = async (chainId: any, tokenAddress: any, amount: any) => {
        if (!address) {
            return;
        }
        try {
            console.log(chainId, tokenAddress, amount)
            const token = await getToken(chainId, tokenAddress.address);
            console.log("Token:", token)
            const tokenBalance = await getTokenBalance(address, token);
            console.log("bal", tokenBalance);
            const userBalance = BigInt(tokenBalance?.amount || "0");
            const requiredAmount = BigInt(amount);
            console.log("Step1", tokenBalance, userBalance, requiredAmount)
            if (userBalance < requiredAmount) {
                console.log("Step2")
                setError("Insufficient token balance. Please check your wallet balance");
                return false;
            }
            console.log("Step3")
            return true;
        } catch (err) {
            console.log("Step4", err)
            setError("Failed to fetch token balance. Please try again.");
            return false;
        }
    };

    // ✅ Validate Available Chains
    const validateChains = async (fromChain: any, toChain: any) => {
        try {
            const chains = await getChains();
            if (!chains.some((chain: any) => chain.id === fromChain) || !chains.some((chain: any) => chain.id === toChain)) {
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
    const validateConnections = async (fromChain: any, fromToken: any, toChain: any, toToken: any) => {
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
    const validateTools = async (chainId: any) => {
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
        } catch (err: any) {
            setError(err?.message || "Failed to fetch a quote. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Execute swap & bridge
    const executeLifi = async ({ quote }: { quote: any }) => {
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
                executeRoute(quote, { // route
                    updateRouteHook(updatedRoute: any) {
                        updatedRoute.steps.forEach((step: any) => {
                            step.execution?.process.forEach((process: any) => {
                                if (process.txHash && process.status === "PENDING") {
                                    console.log("Transaction sent! TX Hash:", process.txHash);

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
                    .then(resolve) // Ensure promise resolves if execution completes
                    .catch((err: any) => {
                        console.log("Err ---> 1 :", err)
                        // ✅ Properly catch errors and set error message
                        if (err.message?.includes("User denied transaction signature") || err.name === "UserRejectedRequestError") {
                            setError("Transaction rejected by the user.");
                        } else if (err.name === "BalanceError" || err.message?.includes("balance is too low")) {
                            setError("Insufficient balance. Please check your wallet and try again.");
                        } else if (err.name === "TransactionExecutionError") {
                            setError("Transaction execution failed. Please try again.");
                        } else {
                            setError(err.message || "An unexpected error occurred.");
                        }

                        reject(err); // Reject promise so caller knows execution failed
                    });
            });

        } catch (err: any) {
            console.log("Err ---> 2 :", err)
            if (err.message?.includes("User denied transaction signature") || err.name === "UserRejectedRequestError") {
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
