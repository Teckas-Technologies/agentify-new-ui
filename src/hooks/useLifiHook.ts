import { useState } from "react";
import { convertQuoteToRoute, executeRoute, getQuote, getChains, getConnections, getTools, getTokenBalance, getToken, updateRouteExecution, getRoutes } from "@lifi/sdk";
import { useAccount } from "wagmi";

// import { customSwitchNetwork } from "../wagmiConfig"; // Uncomment if network switching is needed

const useLifiHook = () => {
    const { address, isConnected } = useAccount();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    console.log("Address ----------",address);
    
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
            console.warn("[validateTokenBalance] No wallet address found.");
            return;
        }
    
        try {
            console.log("========== VALIDATING TOKEN BALANCE ==========");
            console.log("[Input] Chain ID:", chainId);
            console.log("[Input] Token Address Object:", tokenAddress);
            console.log("[Input] Required Amount:", amount);
    
            const token = await getToken(chainId, tokenAddress.address);
            console.log("[Token Info] Retrieved Token:", token);
    
            const tokenBalance = await getTokenBalance(address, token);
            console.log("[Token Balance] Raw Token Balance:", tokenBalance);
    
            const userBalance = BigInt(tokenBalance?.amount || "0");
            const requiredAmount = BigInt(amount);
    
            console.log("[Parsed Balances] User Balance:", userBalance.toString());
            console.log("[Parsed Balances] Required Amount:", requiredAmount.toString());
    
            if (userBalance < requiredAmount) {
                console.warn("[Validation Result] ❌ Insufficient balance.");
                setError("Insufficient token balance. Please check your wallet balance.");
                return false;
            }
    
            console.log("[Validation Result] ✅ Sufficient balance.");
            return true;
    
        } catch (err) {
            console.error("[Error] Failed during token balance validation:", err);
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

  

    // Execute swap & bridge
    const executeLifi = async ({ quote }: { quote: any }) => {
        console.log("========== Executing LiFi ==========");
        console.log("[Input] Quote:", quote);
    
        if (!quote || !quote.action) {
            console.warn("[Validation] Invalid quote. Missing quote or quote.action.");
            setError("Invalid quote. Please fetch a new quote before proceeding.");
            return;
        }
    
        const { fromChainId, fromToken, toChainId, toToken, fromAmount } = quote.action;
    
        console.log("[Quote Details]");
        console.log(" - From Chain ID:", fromChainId);
        console.log(" - From Token:", fromToken);
        console.log(" - To Chain ID:", toChainId);
        console.log(" - To Token:", toToken);
        console.log(" - From Amount (raw):", fromAmount);
    
        if (!(await validateChains(fromChainId, toChainId))) {
            console.warn("[Validation] Chain validation failed.");
            return;
        }
    
        if (!(await validateTools(fromChainId))) {
            console.warn("[Validation] Tool validation failed.");
            return;
        }
    
        if (!address) {
            console.warn("[Validation] No wallet address connected.");
            setError("Wallet not connected. Please connect your wallet first.");
            return;
        }
    
        console.log("[Validation] Checking token balance...");
        if (!(await validateTokenBalance(fromChainId, fromToken, fromAmount))) {
            console.warn("[Validation] Token balance insufficient or failed.");
            return;
        }
    
        try {
            console.log("[Execution] Preparing to execute route...");
            setLoading(true);
            setError(null);
    
            const route = convertQuoteToRoute(quote);
            console.log("[Route] Converted route object:", route);
    
            return new Promise((resolve, reject) => {
                console.log("[Execution] Starting route execution...");
    
                executeRoute(route, {
                    updateRouteHook(updatedRoute: any) {
                        console.log("[Hook] Route updated:", updatedRoute);
    
                        updatedRoute.steps.forEach((step: any) => {
                            step.execution?.process.forEach((process: any) => {
                                console.log("[Step Process] Checking process:", process);
    
                                if (process.txHash && process.status === "PENDING") {
                                    console.log("✅ Transaction sent! TX Hash:", process.txHash);
    
                                    // ✅ Push execution to background
                                    updateRouteExecution(updatedRoute, { executeInBackground: true });
    
                                    // ✅ Resolve immediately with TX hash
                                    resolve({ txHash: process.txHash });
    
                                    return;
                                }
                            });
                        });
                    },
                })
                    .then((res: any) => {
                        console.log("✅ Execution completed successfully:", res);
                        resolve(res);
                    })
                    .catch((err: any) => {
                        console.error("❌ Execution failed with error:", err);
    
                        if (err.message?.includes("User denied transaction signature") || err.name === "UserRejectedRequestError") {
                            setError("Transaction rejected by the user.");
                        } else if (err.name === "BalanceError" || err.message?.includes("balance is too low")) {
                            setError("Insufficient balance. Please check your wallet and try again.");
                        } else if (err.name === "TransactionExecutionError") {
                            setError("Transaction execution failed. Please try again.");
                        } else {
                            setError(err.message || "An unexpected error occurred.");
                        }
    
                        reject(err);
                    });
            });
    
        } catch (err: any) {
            console.error("❌ Unexpected error in executeLifi:", err);
    
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
            console.log("[Cleanup] Route execution ended. Resetting loading state.");
            setLoading(false);
        }
    };
    

    return { loading, error, executeLifi, validateTokenBalance };
};

export default useLifiHook;
