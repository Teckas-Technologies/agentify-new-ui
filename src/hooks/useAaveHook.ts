"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { Pool, ERC20Service, ERC20_2612Service, EthereumTransactionTypeExtended, InterestRate, UiPoolDataProvider } from "@aave/contract-helpers";
import { BigNumber } from "ethers";
import { formatUserSummary, formatReserves } from "@aave/math-utils";
// import { useAppKitProvider } from "@reown/appkit/react";
import { marketConfigs } from "@/utils/markets";
import { MarketType } from "@/types/types";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { erc20Abi } from "viem";

interface LendingData {
    market: MarketType;
    tokenSymbol: string;
    amount: string;
    onBehalfOf?: string;
}

interface BorrowData {
    market: MarketType;
    tokenSymbol: string;
    amount: string;
    onBehalfOf?: string;
}

export interface RepayData {
    market: MarketType;
    tokenSymbol: string;
    amount: string | number; // can be "-1" string or -1 number to repay max
    onBehalfOf?: string;
}

export type TransactionError = Error & {
    code?: number | string;
    message?: string;
    name?: string;
};

const useAaveHook = () => {
    const { address, isConnected } = useAccount();
    // const { walletProvider } = useAppKitProvider("eip155");
    const { wallets } = useWallets();
    const { user } = usePrivy();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState("none");
    const wallet = wallets[0];
    const getProvider = async () => {
        // Get the user's wallet type from Privy
        const userWalletType = user?.wallet?.walletClientType;
        if (!userWalletType) {
            console.error("[getProvider] No wallet type found in user data");
            setError("No wallet connection found");
            return null;
        }

        // Find the matching wallet
        const matchedWallet = wallets.find(wallet =>
            wallet.walletClientType === userWalletType
        );

        if (!matchedWallet) {
            console.error(`[getProvider] No wallet found matching type: ${userWalletType}`);
            setError(`No ${userWalletType} wallet connected`);
            return null;
        }

        try {
            // Get the Ethers provider from the matched wallet
            const ethereumProvider = await matchedWallet.getEthereumProvider();
            const provider = new ethers.providers.Web3Provider(ethereumProvider);
            return provider;
        } catch (err) {
            console.error("[getProvider] Error getting provider:", err);
            setError("Failed to get wallet provider");
            return null;
        }
    };

    // ✅ Helper: Switch network using EIP-1193 API directly
    const switchToNetwork = async (targetChainId: number): Promise<ethers.providers.Web3Provider | null> => {
        console.log("🔄 [switchToNetwork] Starting network switch to chain:", targetChainId);

        const userWalletType = user?.wallet?.walletClientType;
        if (!userWalletType) {
            console.error("[switchToNetwork] No wallet type found");
            setError("No wallet connection found");
            return null;
        }

        const matchedWallet = wallets.find(w => w.walletClientType === userWalletType);
        if (!matchedWallet) {
            console.error("[switchToNetwork] No wallet found");
            return null;
        }

        try {
            const ethereumProvider = await matchedWallet.getEthereumProvider();
            const chainIdHex = `0x${targetChainId.toString(16)}`;

            console.log("🔄 [switchToNetwork] Requesting chain switch to:", chainIdHex);

            try {
                // Request wallet to switch chain
                await ethereumProvider.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: chainIdHex }],
                });
                console.log("✅ [switchToNetwork] Chain switch successful");
            } catch (switchError: any) {
                console.error("❌ [switchToNetwork] Chain switch error:", switchError);

                // If chain is not added to wallet (error 4902), try to add it
                if (switchError.code === 4902) {
                    console.log("⚠️ [switchToNetwork] Chain not added, attempting to add...");

                    // Chain configuration map
                    const chainConfigs: Record<number, any> = {
                        1: {
                            chainId: "0x1",
                            chainName: "Ethereum Mainnet",
                            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                            rpcUrls: ["https://eth.llamarpc.com"],
                            blockExplorerUrls: ["https://etherscan.io"],
                        },
                        137: {
                            chainId: "0x89",
                            chainName: "Polygon Mainnet",
                            nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                            rpcUrls: ["https://polygon.llamarpc.com"],
                            blockExplorerUrls: ["https://polygonscan.com"],
                        },
                        // Add more chains as needed
                    };

                    const chainConfig = chainConfigs[targetChainId];
                    if (chainConfig) {
                        await ethereumProvider.request({
                            method: "wallet_addEthereumChain",
                            params: [chainConfig],
                        });
                        console.log("✅ [switchToNetwork] Chain added successfully");
                    } else {
                        throw new Error(`Chain ${targetChainId} configuration not found`);
                    }
                } else {
                    throw switchError;
                }
            }

            // Wait a moment for the switch to complete
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Create fresh provider after switch
            console.log("🔌 [switchToNetwork] Creating fresh provider after switch...");
            const freshProvider = new ethers.providers.Web3Provider(ethereumProvider);
            const network = await freshProvider.getNetwork();

            console.log("🌐 [switchToNetwork] Fresh provider network:", {
                chainId: network.chainId,
                expectedChainId: targetChainId
            });

            if (network.chainId !== targetChainId) {
                console.error("❌ [switchToNetwork] Network mismatch after switch!", {
                    expected: targetChainId,
                    actual: network.chainId
                });
                return null;
            }

            console.log("✅ [switchToNetwork] Network switch completed successfully");
            return freshProvider;
        } catch (err) {
            console.error("❌ [switchToNetwork] Error:", err);
            setError("Failed to switch network");
            return null;
        }
    };

    // ✅ Helper: Calculate maximum withdrawable amount considering health factor
    const calculateMaxWithdrawable = async (
        provider: ethers.providers.Web3Provider,
        userAddress: string,
        reserveAddress: string,
        tokenSymbol: string,
        uiPoolDataProviderAddress: string,
        poolAddressProviderAddress: string,
        chainId: number
    ): Promise<string | null> => {
        try {
            console.log("📊 [calculateMaxWithdrawable] Starting calculation...");

            const uiPoolDataProvider = new UiPoolDataProvider({
                uiPoolDataProviderAddress,
                provider,
                chainId
            });

            // Get user reserves and pool reserves
            const [userReservesData, poolReservesData] = await Promise.all([
                uiPoolDataProvider.getUserReservesHumanized({
                    lendingPoolAddressProvider: poolAddressProviderAddress,
                    user: userAddress
                }),
                uiPoolDataProvider.getReservesHumanized({
                    lendingPoolAddressProvider: poolAddressProviderAddress
                })
            ]);

            console.log("📊 [calculateMaxWithdrawable] User reserves:", userReservesData.userReserves.length);
            console.log("📊 [calculateMaxWithdrawable] Pool reserves:", poolReservesData.reservesData.length);

            // Use the base currency data from the API response
            const baseCurrencyData = poolReservesData.baseCurrencyData;
            console.log("📊 [calculateMaxWithdrawable] Base currency data FULL:", JSON.stringify(baseCurrencyData, null, 2));

            // Format the reserves first
            const formattedReserves = formatReserves({
                reserves: poolReservesData.reservesData,
                currentTimestamp: Math.floor(Date.now() / 1000),
                marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
                marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd
            });

            console.log("📊 [calculateMaxWithdrawable] Formatted reserves sample:", formattedReserves[0]);

            // Format the data using Aave's math utils
            const formattedUserSummary = formatUserSummary({
                currentTimestamp: Math.floor(Date.now() / 1000),
                marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
                marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                userReserves: userReservesData.userReserves,
                formattedReserves: formattedReserves,
                userEmodeCategoryId: userReservesData.userEmodeCategoryId
            });

            console.log("📊 [calculateMaxWithdrawable] Health factor:", formattedUserSummary.healthFactor);
            console.log("📊 [calculateMaxWithdrawable] Available borrows:", formattedUserSummary.availableBorrowsUSD);
            console.log("📊 [calculateMaxWithdrawable] Formatted user summary FULL:", JSON.stringify({
                healthFactor: formattedUserSummary.healthFactor,
                totalLiquidityUSD: formattedUserSummary.totalLiquidityUSD,
                totalCollateralUSD: formattedUserSummary.totalCollateralUSD,
                totalBorrowsUSD: formattedUserSummary.totalBorrowsUSD,
                availableBorrowsUSD: formattedUserSummary.availableBorrowsUSD,
                currentLiquidationThreshold: formattedUserSummary.currentLiquidationThreshold
            }, null, 2));

            // Find the specific reserve user wants to withdraw
            const userReserve = userReservesData.userReserves.find(
                (reserve: any) => reserve.underlyingAsset.toLowerCase() === reserveAddress.toLowerCase()
            );

            if (!userReserve) {
                console.error("❌ [calculateMaxWithdrawable] User has no supply for this asset");
                return null;
            }

            // Find the reserve data to get decimals
            const reserveData = poolReservesData.reservesData.find(
                (reserve: any) => reserve.underlyingAsset.toLowerCase() === reserveAddress.toLowerCase()
            );

            if (!reserveData) {
                console.error("❌ [calculateMaxWithdrawable] Reserve data not found");
                return null;
            }

            const decimals = reserveData.decimals;
            console.log("📊 [calculateMaxWithdrawable] Token decimals:", decimals);

            // Get actual aToken balance (includes accrued interest) instead of scaled balance
            const aTokenAddress = (reserveData as any).aTokenAddress;
            console.log("📊 [calculateMaxWithdrawable] aToken address:", aTokenAddress);

            const aTokenContract = new ethers.Contract(aTokenAddress, erc20Abi, provider);
            const actualATokenBalance = await aTokenContract.balanceOf(userAddress);
            const actualBalance = parseFloat(ethers.utils.formatUnits(actualATokenBalance, decimals));

            console.log("📊 [calculateMaxWithdrawable] Actual aToken balance:", actualBalance, tokenSymbol);

            // ✅ FIX: Use ethers.utils.formatUnits for precision instead of division
            const scaledSupply = parseFloat(
                ethers.utils.formatUnits(userReserve.scaledATokenBalance, decimals)
            );
            console.log("📊 [calculateMaxWithdrawable] Scaled balance (for reference):", scaledSupply, `(raw: ${userReserve.scaledATokenBalance})`);

            if (actualBalance === 0) {
                console.error("❌ [calculateMaxWithdrawable] User has zero balance");
                return null;
            }

            // If user has no borrows, they can withdraw everything (use actual balance)
            if (parseFloat(formattedUserSummary.totalBorrowsUSD) === 0) {
                console.log("✅ [calculateMaxWithdrawable] No borrows, can withdraw full amount:", actualBalance);
                return actualBalance.toFixed(6);
            }

            // For calculations with borrows, use scaled supply
            const currentSupply = scaledSupply;

            // Calculate max withdrawable while maintaining HF > 1.0
            const currentHF = parseFloat(formattedUserSummary.healthFactor);
            const totalCollateralUSD = parseFloat(formattedUserSummary.totalCollateralUSD);
            const totalBorrowsUSD = parseFloat(formattedUserSummary.totalBorrowsUSD);

            console.log("📊 [calculateMaxWithdrawable] Current HF:", currentHF);
            console.log("📊 [calculateMaxWithdrawable] Current collateral USD:", totalCollateralUSD);
            console.log("📊 [calculateMaxWithdrawable] Total borrows USD:", totalBorrowsUSD);

            // Find the formatted reserve which has priceInUSD properly calculated
            const formattedReserve = formattedReserves.find(
                (reserve: any) => reserve.underlyingAsset.toLowerCase() === reserveAddress.toLowerCase()
            );

            if (!formattedReserve) {
                console.error("❌ [calculateMaxWithdrawable] Formatted reserve not found");
                return null;
            }

            console.log("📊 [calculateMaxWithdrawable] Formatted reserve:", formattedReserve);

            // Use priceInUSD from formatted reserve
            const priceInUSD = parseFloat(formattedReserve.priceInUSD);
            console.log("📊 [calculateMaxWithdrawable] Asset price USD:", priceInUSD);

            // Liquidation threshold from formatted reserve is a decimal string like "0.78"
            // BUT if it's still in basis points (> 100), we need to divide by 10000
            const liquidationThresholdRaw = parseFloat(formattedReserve.reserveLiquidationThreshold);
            const liquidationThreshold = liquidationThresholdRaw > 1
                ? liquidationThresholdRaw / 10000  // Still in basis points
                : liquidationThresholdRaw;          // Already in decimal form
            console.log("📊 [calculateMaxWithdrawable] Liquidation threshold:", liquidationThreshold, `(raw: ${liquidationThresholdRaw})`);

            // Calculate the asset value in USD
            const assetValueUSD = currentSupply * priceInUSD;
            console.log("📊 [calculateMaxWithdrawable] Asset value in USD:", assetValueUSD);

            // Aave HF formula: HF = (totalCollateral * weightedAvgLT) / totalBorrows
            // When withdrawing X_usd of this asset:
            // New weighted collateral = currentWeightedCollateral - (X_usd * assetLT)
            // We want: (currentWeightedCollateral - X_usd * assetLT) / totalBorrows >= targetHF

            const currentWeightedCollateral = totalCollateralUSD * parseFloat(formattedUserSummary.currentLiquidationThreshold);
            console.log("📊 [calculateMaxWithdrawable] Current weighted collateral:", currentWeightedCollateral);

            // Use targetHF = 1.01 (1% safety margin above liquidation at 1.0)
            const targetHF = 1.01;
            console.log("📊 [calculateMaxWithdrawable] Target HF:", targetHF);

            // Solve: X_usd <= (currentWeightedCollateral - targetHF * totalBorrowsUSD) / liquidationThreshold
            const maxWithdrawableUSD = (currentWeightedCollateral - (targetHF * totalBorrowsUSD)) / liquidationThreshold;
            console.log("📊 [calculateMaxWithdrawable] Max withdrawable USD:", maxWithdrawableUSD);

            // Convert USD to tokens
            const maxWithdrawableTokens = maxWithdrawableUSD / priceInUSD;
            console.log("📊 [calculateMaxWithdrawable] Max withdrawable tokens (before min):", maxWithdrawableTokens);

            // Ensure we don't exceed current supply
            const safeMaxWithdraw = Math.min(maxWithdrawableTokens, currentSupply);
            const finalAmount = Math.max(0, safeMaxWithdraw);

            console.log("📊 [calculateMaxWithdrawable] Final max withdrawable:", finalAmount, tokenSymbol);

            return finalAmount > 0.000001 ? finalAmount.toFixed(6) : "0";
        } catch (err) {
            console.error("❌ [calculateMaxWithdrawable] Error:", err);
            return null;
        }
    };

    // ✅ Helper: Calculate maximum borrowable amount considering health factor and available capacity
    const calculateMaxBorrowable = async (
        provider: ethers.providers.Web3Provider,
        userAddress: string,
        reserveAddress: string,
        tokenSymbol: string,
        uiPoolDataProviderAddress: string,
        poolAddressProviderAddress: string,
        chainId: number
    ): Promise<string | null> => {
        try {
            console.log("📊 [calculateMaxBorrowable] Starting calculation...");

            const uiPoolDataProvider = new UiPoolDataProvider({
                uiPoolDataProviderAddress,
                provider,
                chainId
            });

            // Get user reserves and pool reserves
            const [userReservesData, poolReservesData] = await Promise.all([
                uiPoolDataProvider.getUserReservesHumanized({
                    lendingPoolAddressProvider: poolAddressProviderAddress,
                    user: userAddress
                }),
                uiPoolDataProvider.getReservesHumanized({
                    lendingPoolAddressProvider: poolAddressProviderAddress
                })
            ]);

            console.log("📊 [calculateMaxBorrowable] User reserves:", userReservesData.userReserves.length);
            console.log("📊 [calculateMaxBorrowable] Pool reserves:", poolReservesData.reservesData.length);

            // Use the base currency data from the API response
            const baseCurrencyData = poolReservesData.baseCurrencyData;

            // Format the reserves first
            const formattedReserves = formatReserves({
                reserves: poolReservesData.reservesData,
                currentTimestamp: Math.floor(Date.now() / 1000),
                marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
                marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd
            });

            // Format the data using Aave's math utils
            const formattedUserSummary = formatUserSummary({
                currentTimestamp: Math.floor(Date.now() / 1000),
                marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
                marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                userReserves: userReservesData.userReserves,
                formattedReserves: formattedReserves,
                userEmodeCategoryId: userReservesData.userEmodeCategoryId
            });

            console.log("📊 [calculateMaxBorrowable] Health factor:", formattedUserSummary.healthFactor);
            console.log("📊 [calculateMaxBorrowable] Available borrows USD:", formattedUserSummary.availableBorrowsUSD);

            const availableBorrowsUSD = parseFloat(formattedUserSummary.availableBorrowsUSD);

            if (availableBorrowsUSD <= 0) {
                console.log("❌ [calculateMaxBorrowable] No borrowing capacity available");
                return "0";
            }

            // Find the formatted reserve to get the price
            const formattedReserve = formattedReserves.find(
                (reserve: any) => reserve.underlyingAsset.toLowerCase() === reserveAddress.toLowerCase()
            );

            if (!formattedReserve) {
                console.error("❌ [calculateMaxBorrowable] Formatted reserve not found");
                return null;
            }

            const priceInUSD = parseFloat(formattedReserve.priceInUSD);
            console.log("📊 [calculateMaxBorrowable] Token price USD:", priceInUSD);

            // Apply 2% safety buffer to account for:
            // - Interest accrual during transaction
            // - Gas estimation time
            // - Small precision differences
            const SAFETY_BUFFER = 0.98; // 2% buffer
            const safeAvailableBorrowsUSD = availableBorrowsUSD * SAFETY_BUFFER;

            console.log("📊 [calculateMaxBorrowable] Available borrows (with buffer):", safeAvailableBorrowsUSD);

            // Convert USD to tokens
            const maxBorrowableTokens = safeAvailableBorrowsUSD / priceInUSD;
            console.log("📊 [calculateMaxBorrowable] Max borrowable tokens:", maxBorrowableTokens, tokenSymbol);

            return maxBorrowableTokens > 0.000001 ? maxBorrowableTokens.toFixed(6) : "0";
        } catch (err) {
            console.error("❌ [calculateMaxBorrowable] Error:", err);
            return null;
        }
    };

    // ✅ Validation Helper: Check user's token balance
    const validateSupplyEligibility = async (
        provider: ethers.providers.Web3Provider,
        tokenAddress: string,
        amount: string,
        userAddress: string
    ): Promise<{ isValid: boolean; message?: string }> => {
        console.log("🔍 [validateSupplyEligibility] Starting validation...", {
            tokenAddress,
            amount,
            userAddress
        });

        try {
            // Check if token contract exists
            const code = await provider.getCode(tokenAddress);
            console.log("🔍 [validateSupplyEligibility] Token contract code length:", code.length);

            if (code === "0x") {
                console.error("❌ [validateSupplyEligibility] Token contract doesn't exist");
                return {
                    isValid: false,
                    message: "Hmm, I can't find this token on the current network. Please make sure you're connected to the correct blockchain."
                };
            }

            const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
            const tokenERC20Service = new ERC20Service(provider);
            const { decimals, symbol } = await tokenERC20Service.getTokenData(tokenAddress);

            console.log("🔍 [validateSupplyEligibility] Token details:", { symbol, decimals });

            const balance = await tokenContract.balanceOf(userAddress);
            const requiredAmount = ethers.utils.parseUnits(amount.toString(), decimals);

            console.log("🔍 [validateSupplyEligibility] Balance check:", {
                balance: ethers.utils.formatUnits(balance, decimals),
                required: amount,
                balanceRaw: balance.toString(),
                requiredRaw: requiredAmount.toString()
            });

            if (balance.lt(requiredAmount)) {
                const availableBalance = ethers.utils.formatUnits(balance, decimals);
                console.error("❌ [validateSupplyEligibility] Insufficient balance");
                return {
                    isValid: false,
                    message: `You don't have enough ${symbol} in your wallet. You have ${availableBalance} ${symbol}, but you're trying to supply ${amount} ${symbol}. Try supplying ${availableBalance} or less, or add more ${symbol} to your wallet.`
                };
            }

            console.log("✅ [validateSupplyEligibility] Validation passed");
            return { isValid: true };
        } catch (err) {
            console.error("❌ [validateSupplyEligibility] Validation error:", err);
            console.error("❌ [validateSupplyEligibility] Error details:", {
                message: (err as Error).message,
                stack: (err as Error).stack
            });
            return {
                isValid: false,
                message: "I couldn't verify your balance right now. Please check your connection and try again."
            };
        }
    };

    // ✅ Helper: Handle TRANSACTION_REPLACED errors properly
    const handleTransactionReplaced = async (
        err: any,
        provider: ethers.providers.Web3Provider
    ): Promise<{ isReplaced: boolean; success?: boolean; txHash?: string }> => {
        try {
            const cancelled = err.cancelled;
            const replacement = err.replacement;

            console.log("⚠️ [handleTransactionReplaced] Transaction was replaced:", {
                cancelled,
                replacementHash: replacement?.hash,
                receiptStatus: err.receipt?.status
            });

            // If cancelled, it's a failure
            if (cancelled) {
                console.log("❌ [handleTransactionReplaced] Transaction was cancelled");
                return { isReplaced: true, success: false };
            }

            // If we have a replacement transaction, wait for it and check status
            if (replacement && replacement.hash) {
                console.log("⏳ [handleTransactionReplaced] Waiting for replacement transaction...");
                const receipt = await provider.waitForTransaction(replacement.hash);

                console.log("📋 [handleTransactionReplaced] Replacement transaction receipt:", {
                    status: receipt.status,
                    hash: receipt.transactionHash
                });

                // status === 1 means success, status === 0 means failed/reverted
                if (receipt.status === 1) {
                    console.log("✅ [handleTransactionReplaced] Replacement transaction succeeded!");
                    return { isReplaced: true, success: true, txHash: receipt.transactionHash };
                } else {
                    console.log("❌ [handleTransactionReplaced] Replacement transaction failed/reverted");
                    return { isReplaced: true, success: false };
                }
            }

            // Fallback: check if receipt exists with status
            if (err.receipt && err.receipt.status === 1) {
                console.log("✅ [handleTransactionReplaced] Transaction succeeded (from receipt)");
                return { isReplaced: true, success: true, txHash: err.receipt.transactionHash };
            }

            return { isReplaced: false };
        } catch (error) {
            console.error("❌ [handleTransactionReplaced] Error handling replacement:", error);
            return { isReplaced: false };
        }
    };

    // ✅ Validation Helper: Check withdraw eligibility
    const validateWithdrawEligibility = async (
        provider: ethers.providers.Web3Provider,
        aTokenAddress: string,
        amount: string,
        userAddress: string,
        tokenSymbol: string
    ): Promise<{ isValid: boolean; message?: string }> => {
        console.log("🔍 [validateWithdrawEligibility] Starting validation...", {
            aTokenAddress,
            amount,
            userAddress,
            tokenSymbol
        });

        try {
            const aTokenContract = new ethers.Contract(aTokenAddress, erc20Abi, provider);
            const tokenERC20Service = new ERC20Service(provider);
            const { decimals } = await tokenERC20Service.getTokenData(aTokenAddress);

            console.log("🔍 [validateWithdrawEligibility] aToken details:", { tokenSymbol, decimals });

            const aTokenBalance = await aTokenContract.balanceOf(userAddress);
            console.log("🔍 [validateWithdrawEligibility] aToken balance:", ethers.utils.formatUnits(aTokenBalance, decimals));

            // Handle withdraw all (-1)
            if (amount === "-1") {
                if (aTokenBalance.isZero()) {
                    console.error("❌ [validateWithdrawEligibility] No supplied balance");
                    return {
                        isValid: false,
                        message: "It looks like you haven't supplied any assets yet, so there's nothing to withdraw. You'll need to supply some assets first before you can withdraw them."
                    };
                }
                console.log("✅ [validateWithdrawEligibility] Withdraw all validation passed");
                return { isValid: true };
            }

            const requiredAmount = ethers.utils.parseUnits(amount.toString(), decimals);

            console.log("🔍 [validateWithdrawEligibility] Balance check:", {
                available: ethers.utils.formatUnits(aTokenBalance, decimals),
                required: amount
            });

            if (aTokenBalance.lt(requiredAmount)) {
                const availableBalance = ethers.utils.formatUnits(aTokenBalance, decimals);
                console.error("❌ [validateWithdrawEligibility] Insufficient supplied balance");
                return {
                    isValid: false,
                    message: `You don't have enough supplied balance to withdraw that amount. You currently have ${availableBalance} ${tokenSymbol} supplied, but you're trying to withdraw ${amount} ${tokenSymbol}. Try withdrawing ${availableBalance} or less.`
                };
            }

            console.log("✅ [validateWithdrawEligibility] Validation passed");
            return { isValid: true };
        } catch (err) {
            console.error("❌ [validateWithdrawEligibility] Validation error:", err);
            console.error("❌ [validateWithdrawEligibility] Error details:", {
                message: (err as Error).message,
                stack: (err as Error).stack
            });
            return {
                isValid: false,
                message: "I couldn't verify your withdrawal eligibility right now. Please check your connection and try again."
            };
        }
    };

    // ✅ Validation Helper: Check repay eligibility
    const validateRepayEligibility = async (
        provider: ethers.providers.Web3Provider,
        debtTokenAddress: string,
        underlyingTokenAddress: string,
        amount: string,
        userAddress: string
    ): Promise<{ isValid: boolean; message?: string }> => {
        console.log("🔍 [validateRepayEligibility] Starting validation...", {
            debtTokenAddress,
            underlyingTokenAddress,
            amount,
            userAddress
        });

        try {
            const debtTokenContract = new ethers.Contract(debtTokenAddress, erc20Abi, provider);
            const underlyingTokenContract = new ethers.Contract(underlyingTokenAddress, erc20Abi, provider);
            const tokenERC20Service = new ERC20Service(provider);
            const { decimals, symbol } = await tokenERC20Service.getTokenData(underlyingTokenAddress);

            console.log("🔍 [validateRepayEligibility] Token details:", { symbol, decimals });

            const debtBalance = await debtTokenContract.balanceOf(userAddress);
            console.log("🔍 [validateRepayEligibility] Debt balance:", ethers.utils.formatUnits(debtBalance, decimals));

            if (debtBalance.isZero()) {
                console.error("❌ [validateRepayEligibility] No debt to repay");
                // Clean symbol (remove trailing digits if any)
                const cleanSymbol = symbol.replace(/\d+$/, '');
                return {
                    isValid: false,
                    message: `It looks like you don't have any ${cleanSymbol} debt to repay. Your balance is already clear!`
                };
            }

            // Handle repay all (-1)
            if (amount === "-1") {
                const userBalance = await underlyingTokenContract.balanceOf(userAddress);
                console.log("🔍 [validateRepayEligibility] Repay all - User balance:", ethers.utils.formatUnits(userBalance, decimals));

                if (userBalance.lt(debtBalance)) {
                    const availableBalance = ethers.utils.formatUnits(userBalance, decimals);
                    const debtAmount = ethers.utils.formatUnits(debtBalance, decimals);
                    console.error("❌ [validateRepayEligibility] Insufficient balance to repay full debt");
                    // Clean symbol (remove trailing digits if any)
                    const cleanSymbol = symbol.replace(/\d+$/, '');
                    return {
                        isValid: false,
                        message: `You don't have enough ${cleanSymbol} to repay your full debt. You have ${availableBalance} ${cleanSymbol} in your wallet, but your total debt is ${debtAmount} ${cleanSymbol}. You can repay ${availableBalance} ${cleanSymbol} now and add more later, or add more ${cleanSymbol} to your wallet first.`
                    };
                }
                console.log("✅ [validateRepayEligibility] Repay all validation passed");
                return { isValid: true };
            }

            const repayAmount = ethers.utils.parseUnits(amount.toString(), decimals);

            console.log("🔍 [validateRepayEligibility] Amount check:", {
                repayAmount: amount,
                debtAmount: ethers.utils.formatUnits(debtBalance, decimals)
            });

            if (repayAmount.gt(debtBalance)) {
                const debtAmount = ethers.utils.formatUnits(debtBalance, decimals);
                console.error("❌ [validateRepayEligibility] Repay amount exceeds debt");
                // Clean symbol (remove trailing digits if any, e.g., "USDT0" -> "USDT")
                const cleanSymbol = symbol.replace(/\d+$/, '');
                return {
                    isValid: false,
                    message: `You tried to repay ${amount} ${cleanSymbol}, but your current debt is only ${debtAmount} ${cleanSymbol}. You can repay up to ${debtAmount} ${cleanSymbol} to clear your debt completely.`
                };
            }

            const userBalance = await underlyingTokenContract.balanceOf(userAddress);
            console.log("🔍 [validateRepayEligibility] User balance:", ethers.utils.formatUnits(userBalance, decimals));

            if (userBalance.lt(repayAmount)) {
                const availableBalance = ethers.utils.formatUnits(userBalance, decimals);
                console.error("❌ [validateRepayEligibility] Insufficient balance to repay");
                // Clean symbol (remove trailing digits if any)
                const cleanSymbol = symbol.replace(/\d+$/, '');
                return {
                    isValid: false,
                    message: `You tried to repay ${amount} ${cleanSymbol}, but you only have ${availableBalance} ${cleanSymbol} in your wallet. Please repay a smaller amount or add more ${cleanSymbol} to your wallet first.`
                };
            }

            console.log("✅ [validateRepayEligibility] Validation passed");
            return { isValid: true };
        } catch (err) {
            console.error("❌ [validateRepayEligibility] Validation error:", err);
            console.error("❌ [validateRepayEligibility] Error details:", {
                message: (err as Error).message,
                stack: (err as Error).stack
            });
            return {
                isValid: false,
                message: "I couldn't verify your repayment eligibility right now. Please check your connection and try again."
            };
        }
    };

    // ✅ Validation Helper: Check borrow eligibility
    const validateBorrowEligibility = async (
        provider: ethers.providers.Web3Provider,
        userAddress: string,
        reserveAddress: string,
        amount: string,
        tokenSymbol: string,
        uiPoolDataProvider: string,
        poolAddressProvider: string,
        chainId: number
    ): Promise<{ isValid: boolean; message?: string; maxBorrowable?: string }> => {
        console.log("🔍 [validateBorrowEligibility] Starting validation...", {
            userAddress,
            reserveAddress,
            amount,
            tokenSymbol
        });

        try {
            // Get user account data using Aave SDK
            const uiPoolDataProviderInstance = new UiPoolDataProvider({
                uiPoolDataProviderAddress: uiPoolDataProvider,
                provider,
                chainId
            });

            const [userReservesData, poolReservesData] = await Promise.all([
                uiPoolDataProviderInstance.getUserReservesHumanized({
                    lendingPoolAddressProvider: poolAddressProvider,
                    user: userAddress
                }),
                uiPoolDataProviderInstance.getReservesHumanized({
                    lendingPoolAddressProvider: poolAddressProvider
                })
            ]);

            const baseCurrencyData = poolReservesData.baseCurrencyData;
            const formattedReserves = formatReserves({
                reserves: poolReservesData.reservesData,
                currentTimestamp: Math.floor(Date.now() / 1000),
                marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
                marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd
            });

            const formattedUserSummary = formatUserSummary({
                currentTimestamp: Math.floor(Date.now() / 1000),
                marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
                marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
                userReserves: userReservesData.userReserves,
                formattedReserves: formattedReserves,
                userEmodeCategoryId: userReservesData.userEmodeCategoryId
            });

            console.log("🔍 [validateBorrowEligibility] User summary:", {
                totalCollateralUSD: formattedUserSummary.totalCollateralUSD,
                availableBorrowsUSD: formattedUserSummary.availableBorrowsUSD,
                currentLoanToValue: formattedUserSummary.currentLoanToValue
            });

            // Check 1: User has supplied collateral
            const totalCollateralUSD = parseFloat(formattedUserSummary.totalCollateralUSD);
            if (totalCollateralUSD === 0) {
                console.error("❌ [validateBorrowEligibility] No collateral supplied");
                return {
                    isValid: false,
                    message: `You need to supply collateral before you can borrow. Please supply some assets first (like ${tokenSymbol}, ETH, or other supported tokens) to use as collateral for borrowing.`
                };
            }

            // Check 2: User has borrowing capacity
            const availableBorrowsUSD = parseFloat(formattedUserSummary.availableBorrowsUSD);
            if (availableBorrowsUSD <= 0) {
                console.error("❌ [validateBorrowEligibility] No borrowing capacity");
                return {
                    isValid: false,
                    message: `You don't have any borrowing capacity available right now. This might be because your supplied collateral is already fully utilized, or your health factor is too low. Try supplying more collateral first.`
                };
            }

            // Check 3: Calculate max borrowable for this specific token
            const maxBorrowable = await calculateMaxBorrowable(
                provider,
                userAddress,
                reserveAddress,
                tokenSymbol,
                uiPoolDataProvider,
                poolAddressProvider,
                chainId
            );

            if (!maxBorrowable || parseFloat(maxBorrowable) <= 0) {
                console.error("❌ [validateBorrowEligibility] Cannot calculate max borrowable");
                return {
                    isValid: false,
                    message: `I couldn't calculate your borrowing capacity for ${tokenSymbol}. This might be a temporary issue. Please try again.`
                };
            }

            console.log("🔍 [validateBorrowEligibility] Max borrowable:", maxBorrowable);

            // Check 4: Requested amount doesn't exceed max borrowable
            const requestedAmount = parseFloat(amount);
            const maxAmount = parseFloat(maxBorrowable);

            if (requestedAmount > maxAmount) {
                console.error("❌ [validateBorrowEligibility] Amount exceeds max borrowable");
                return {
                    isValid: false,
                    message: `You tried to borrow ${amount} ${tokenSymbol}, but you can only safely borrow up to ${maxBorrowable} ${tokenSymbol} with your current collateral. Please reduce the amount or supply more collateral.`,
                    maxBorrowable
                };
            }

            console.log("✅ [validateBorrowEligibility] Validation passed");
            return { isValid: true, maxBorrowable };
        } catch (err) {
            console.error("❌ [validateBorrowEligibility] Validation error:", err);
            console.error("❌ [validateBorrowEligibility] Error details:", {
                message: (err as Error).message,
                stack: (err as Error).stack
            });
            return {
                isValid: false,
                message: "I couldn't verify your borrowing eligibility right now. Please check your connection and try again."
            };
        }
    };

    const supplyToAave = async ({ market, tokenSymbol, amount, onBehalfOf }: LendingData) => {
        console.log("🚀 [supplyToAave] Starting supply operation...", {
            market,
            tokenSymbol,
            amount,
            onBehalfOf
        });

        const selectedMarket = marketConfigs[market];

        if (!selectedMarket) {
            console.error("❌ [supplyToAave] Market not supported:", market);
            setError(`Market "${market}" not supported.`);
            return { success: false, message: `I'm sorry, but I don't support the ${market} market yet. Please try another market like Ethereum, Polygon, or Arbitrum.` };
        }

        const poolAddress = selectedMarket.pool;
        const wTokenGateWay = selectedMarket.wethGateway;
        const reserve = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets]?.UNDERLYING;
        const chainId = selectedMarket.chainId;

        console.log("📋 [supplyToAave] Market configuration:", {
            poolAddress,
            wTokenGateWay,
            reserve,
            chainId
        });

        if (!reserve) {
            console.error("❌ [supplyToAave] Token not supported:", tokenSymbol);
            setError(`Token "${tokenSymbol}" not supported in market "${market}".`);
            return { success: false, message: `I'm sorry, but ${tokenSymbol} isn't available on the ${market} market right now. You might want to try a different token or market.` };
        }

        let provider: ethers.providers.Web3Provider | null = null;

        try {
            console.log("🔗 [supplyToAave] Target chain:", chainId);

            // ✅ Get provider and check current network
            provider = await getProvider();
            if (!provider) {
                console.error("❌ [supplyToAave] Provider not found");
                setError("Provider not found");
                return { success: false, message: `I'm having trouble connecting to your wallet right now. Please try again in a moment.` };
            }

            const network = await provider.getNetwork();
            console.log("🌐 [supplyToAave] Current network:", network.chainId, "| Target:", chainId);

            // ✅ Switch network if needed using EIP-1193 API directly
            if (network.chainId !== chainId) {
                console.log("🔄 [supplyToAave] Network mismatch! Switching...");
                const switchedProvider = await switchToNetwork(chainId);
                if (!switchedProvider) {
                    console.error("❌ [supplyToAave] Network switch failed");
                    return {
                        success: false,
                        message: `I couldn't switch to the required network automatically. Please switch your wallet to the correct network manually and try again.`
                    };
                }
                provider = switchedProvider;
                console.log("✅ [supplyToAave] Network switched successfully");
            } else {
                console.log("✅ [supplyToAave] Already on correct chain");
            }

            const signer = await provider.getSigner();

            if (!isConnected || !address || !signer) {
                setError("Wallet not connected. Please connect your wallet first.");
                return { success: false, message: `It looks like your wallet isn't connected yet. Please connect your wallet first, and then we can proceed with the transaction.` };
            }

            if (!amount) {
                setError("Amount is missing.");
                return { success: false, message: `Oops! It looks like you didn't specify an amount. Please let me know how much you'd like to proceed with.` };
            }

            // ✅ Validate amount is positive
            const amountNum = parseFloat(amount.toString());
            if (isNaN(amountNum) || amountNum <= 0) {
                setError("Amount must be greater than zero.");
                return { success: false, message: `The amount must be greater than zero. Please specify a valid amount to supply.` };
            }

            const userAddress = address!;
            const onBehalf = onBehalfOf || userAddress;

            // ✅ STEP 1: Validate user has sufficient balance BEFORE any transaction
            console.log("🔍 [supplyToAave] Running validation...");
            const validation = await validateSupplyEligibility(provider, reserve, amount, userAddress);
            if (!validation.isValid) {
                console.error("❌ [supplyToAave] Validation failed:", validation.message);
                setError(validation.message || "Validation failed");
                return { success: false, message: validation.message };
            }
            console.log("✅ [supplyToAave] Validation passed");

            setLoading(true);
            setError(null);
            setStatus("approve");

            // Step 2: Get correct decimals for token
            console.log("📝 [supplyToAave] Getting token data...");
            const tokenERC20Service = new ERC20Service(provider);
            const { decimals } = await tokenERC20Service.getTokenData(reserve);
            console.log("📝 [supplyToAave] Token decimals:", decimals);

            // Step 3: Check allowance
            console.log("🔒 [supplyToAave] Checking allowance...");
            const tokenContract = new ethers.Contract(reserve, erc20Abi, signer);
            const currentAllowance = await tokenContract.allowance(userAddress, poolAddress);

            const supplyAmount = ethers.utils.parseUnits(amount.toString(), decimals); // Use correct decimals
            console.log("🔒 [supplyToAave] Allowance check:", {
                current: currentAllowance.toString(),
                required: supplyAmount.toString()
            });

            if (currentAllowance.lt(supplyAmount)) {
                // ✅ USDT FIX: If current allowance is non-zero, reset to 0 first (USDT quirk on Ethereum)
                if (currentAllowance.gt(0)) {
                    console.log("⏳ [supplyToAave] Resetting allowance to 0 (USDT quirk)...");
                    // ✅ Estimate gas and add 20% buffer
                    const estimatedGas = await tokenContract.estimateGas.approve(poolAddress, 0);
                    const gasLimit = estimatedGas.mul(120).div(100);
                    console.log("⛽ [supplyToAave] Reset approval gas estimate:", estimatedGas.toString(), "with buffer:", gasLimit.toString());
                    const resetTx = await tokenContract.approve(poolAddress, 0, { gasLimit });
                    console.log("⏳ [supplyToAave] Reset tx hash:", resetTx.hash);

                    const resetReceipt = await resetTx.wait();
                    console.log("📝 [supplyToAave] Reset receipt status:", resetReceipt.status);

                    if (resetReceipt.status === 0) {
                        console.error("❌ [supplyToAave] Reset approval failed on-chain");
                        setError("Approval reset transaction failed.");
                        return {
                            success: false,
                            message: "The approval reset transaction failed. This might be due to insufficient gas or a contract error. Please try again."
                        };
                    }
                    console.log("✅ [supplyToAave] Allowance reset to 0");
                }

                // Step 4: Approve exact amount needed
                console.log("⏳ [supplyToAave] Approving tokens...");
                // ✅ Estimate gas and add 20% buffer
                const approvalEstimatedGas = await tokenContract.estimateGas.approve(poolAddress, supplyAmount);
                const approvalGasLimit = approvalEstimatedGas.mul(120).div(100);
                console.log("⛽ [supplyToAave] Approval gas estimate:", approvalEstimatedGas.toString(), "with buffer:", approvalGasLimit.toString());
                const approvalTx = await tokenContract.approve(poolAddress, supplyAmount, { gasLimit: approvalGasLimit });
                console.log("⏳ [supplyToAave] Approval tx hash:", approvalTx.hash);

                const approvalReceipt = await approvalTx.wait();
                console.log("📝 [supplyToAave] Approval receipt status:", approvalReceipt.status);

                if (approvalReceipt.status === 0) {
                    console.error("❌ [supplyToAave] Approval failed on-chain");
                    setError("Approval transaction failed.");
                    return {
                        success: false,
                        message: "The token approval failed. This could be due to insufficient gas, network issues, or the transaction was cancelled. Please try again."
                    };
                }
                console.log("✅ [supplyToAave] Approval confirmed");
            } else {
                console.log("✅ [supplyToAave] Sufficient allowance exists");
            }

            // Step 3: Proceed with the supply (standard method, no permit needed)
            console.log("🏊 [supplyToAave] Creating pool instance...");
            const pool = new Pool(provider, {
                POOL: poolAddress,
                WETH_GATEWAY: wTokenGateWay,
            });

            console.log("💰 [supplyToAave] Calling supply...");
            const txs = await pool.supply({
                user: userAddress,
                reserve,
                amount,
                onBehalfOf: onBehalf,
            });
            console.log("💰 [supplyToAave] Got transaction array, length:", txs.length);

            const txHashes = [];
            for (const tx of txs) {
                console.log("⏳ [supplyToAave] Building transaction...");
                const extendedTxData = await tx.tx();
                const { from, ...txData } = extendedTxData;
                console.log("⏳ [supplyToAave] Sending transaction...");
                // ✅ Estimate gas and add 20% buffer
                const estimatedGas = await signer.estimateGas({
                    ...txData,
                    value: txData.value ? BigNumber.from(txData.value) : undefined,
                });
                const gasLimit = estimatedGas.mul(120).div(100);
                console.log("⛽ [supplyToAave] Supply gas estimate:", estimatedGas.toString(), "with buffer:", gasLimit.toString());
                const txResponse = await signer.sendTransaction({
                    ...txData,
                    gasLimit,
                    value: txData.value ? BigNumber.from(txData.value) : undefined,
                });
                console.log("⏳ [supplyToAave] Transaction sent, hash:", txResponse.hash);
                txHashes.push(txResponse.hash);

                // Wait for transaction to be mined and check status
                console.log("⏳ [supplyToAave] Waiting for confirmation...");
                const receipt = await txResponse.wait();
                console.log("📝 [supplyToAave] Transaction receipt status:", receipt.status);

                if (receipt.status === 0) {
                    console.error("❌ [supplyToAave] Supply transaction failed on-chain");
                    setError("Supply transaction failed.");
                    return {
                        success: false,
                        message: "The lending transaction didn't go through. This could be because you don't have enough balance, the requirements weren't met, or the transaction was cancelled. Please check your wallet and try again."
                    };
                }
                console.log("✅ [supplyToAave] Transaction confirmed!");
            }

            console.log("🎉 [supplyToAave] Supply operation completed successfully!");
            return { success: true, txHashes };
        } catch (err: any) {
            const error = err as TransactionError;
            console.error("❌ [supplyToAave] ERROR CAUGHT:", err);
            console.error("❌ [supplyToAave] Error type:", typeof err);
            console.error("❌ [supplyToAave] Error name:", error.name);
            console.error("❌ [supplyToAave] Error message:", error.message);
            console.error("❌ [supplyToAave] Error code:", error.code);

            // ✅ Handle TRANSACTION_REPLACED - wait for replacement and validate success
            if (error.code === "TRANSACTION_REPLACED" && provider) {
                const result = await handleTransactionReplaced(err, provider);
                if (result.isReplaced && result.success) {
                    console.log("✅ [supplyToAave] Transaction replaced with higher gas but succeeded!");
                    return {
                        success: true,
                        txHashes: [result.txHash!]
                    };
                } else if (result.isReplaced && !result.success) {
                    console.log("❌ [supplyToAave] Replacement transaction failed");
                    setError("The replacement transaction failed. Please try again.");
                    return { success: false, message: "The transaction was replaced but failed. Please try again." };
                }
            }

            // Check if user rejected the transaction
            if (
                error.code === "ACTION_REJECTED" ||
                error.message?.includes("user rejected transaction") ||
                error.message?.includes("User denied transaction signature") ||
                error.name === "UserRejectedRequestError"
            ) {
                console.log("ℹ️ [supplyToAave] User rejected the transaction");
                setError("Transaction rejected by the user.");
                return { success: false, message: "You rejected the transaction. No worries! Let me know when you're ready to try again." };
            }

            // Log all error properties for debugging
            if (err && typeof err === 'object') {
                console.error("❌ [supplyToAave] All error properties:", Object.keys(err));
                console.error("❌ [supplyToAave] Full error object:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
            }

            setError("An error occurred. Please try again.");
            return { success: false, message: "An unexpected error occurred. Please try again." };
        } finally {
            setLoading(false);
            setStatus("none");
        }
    };

    const withdrawFromAave = async ({
        market,
        tokenSymbol,
        amount,
        onBehalfOf,
    }: {
        market: MarketType;
        tokenSymbol: string;
        amount: string | number; // can pass "-1" string or -1 number to withdraw max
        onBehalfOf?: string;
    }) => {
        const selectedMarket = marketConfigs[market];

        if (!selectedMarket) {
            setError(`Market "${market}" not supported.`);
            return { success: false, message: `I'm sorry, but I don't support the ${market} market yet. Please try another market like Ethereum, Polygon, or Arbitrum.` };
        }

        const poolAddress = selectedMarket.pool;
        const wTokenGateWay = selectedMarket.wethGateway;
        const reserve = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets]?.UNDERLYING;
        const aTokenAddress = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets]?.A_TOKEN;
        const chainId = selectedMarket.chainId;
        const uiPoolDataProvider = (selectedMarket as any).uiPoolDataProvider;
        const poolAddressesProvider = (selectedMarket as any).poolAddressesProvider;

        if (!reserve || !aTokenAddress) {
            setError(`Token "${tokenSymbol}" not supported in market "${market}".`);
            return { success: false, message: `I'm sorry, but ${tokenSymbol} isn't available on the ${market} market right now. You might want to try a different token or market.` };
        }

        let provider: ethers.providers.Web3Provider | null = null;

        try {
            console.log("🔗 [withdrawFromAave] Target chain:", chainId);

            // ✅ Get provider and check current network
            provider = await getProvider();
            if (!provider) {
                console.error("❌ [withdrawFromAave] Provider not found");
                setError("Provider not found");
                return { success: false, message: `I'm having trouble connecting to your wallet right now. Please try again in a moment.` };
            }

            const network = await provider.getNetwork();
            console.log("🌐 [withdrawFromAave] Current network:", network.chainId, "| Target:", chainId);

            // ✅ Switch network if needed using EIP-1193 API directly
            if (network.chainId !== chainId) {
                console.log("🔄 [withdrawFromAave] Network mismatch! Switching...");
                const switchedProvider = await switchToNetwork(chainId);
                if (!switchedProvider) {
                    console.error("❌ [withdrawFromAave] Network switch failed");
                    return {
                        success: false,
                        message: `I couldn't switch to the required network automatically. Please switch your wallet to the correct network manually and try again.`
                    };
                }
                provider = switchedProvider;
                console.log("✅ [withdrawFromAave] Network switched successfully");
            } else {
                console.log("✅ [withdrawFromAave] Already on correct chain");
            }

            const signer = await provider.getSigner();

            if (!isConnected || !address || !signer) {
                setError("Wallet not connected. Please connect your wallet first.");
                return { success: false, message: `It looks like your wallet isn't connected yet. Please connect your wallet first, and then we can proceed with the transaction.` };
            }

            if (!amount) {
                setError("Withdrawal amount is missing.");
                return { success: false, message: `Oops! It looks like you didn't specify an amount. Please let me know how much you'd like to proceed with.` };
            }

            // ✅ Check if this is "withdraw all" (can be -1 number or "-1" string from backend)
            const isWithdrawAll = amount === -1 || amount === "-1" || amount.toString() === "-1";

            // ✅ Validate amount is positive (skip if withdraw all)
            if (!isWithdrawAll) {
                const amountNum = parseFloat(amount.toString());
                if (isNaN(amountNum) || amountNum <= 0) {
                    setError("Amount must be greater than zero.");
                    return { success: false, message: `The amount must be greater than zero. Please specify a valid amount to withdraw.` };
                }
            }

            // ✅ Normalize amount to string for SDK (convert -1 to "-1")
            const normalizedAmount = isWithdrawAll ? "-1" : amount.toString();

            const userAddress = address!;
            const onBehalf = onBehalfOf || userAddress;

            // ✅ STEP 1: Validate user has sufficient aToken balance BEFORE transaction
            const validation = await validateWithdrawEligibility(provider, aTokenAddress, normalizedAmount, userAddress, tokenSymbol);
            if (!validation.isValid) {
                setError(validation.message || "Validation failed");
                return { success: false, message: validation.message };
            }

            // ✅ STEP 2: Validate withdrawal won't drop health factor below 1.0 BEFORE transaction
            if (uiPoolDataProvider && poolAddressesProvider) {
                console.log("🔍 [withdrawFromAave] Checking health factor impact...");
                try {
                    const maxWithdrawable = await calculateMaxWithdrawable(
                        provider,
                        userAddress,
                        reserve,
                        tokenSymbol,
                        uiPoolDataProvider,
                        poolAddressesProvider,
                        chainId
                    );

                    if (maxWithdrawable && parseFloat(maxWithdrawable) >= 0) {
                        const maxAmount = parseFloat(maxWithdrawable);

                        // For withdraw all, get actual aToken balance to validate
                        let requestedAmount: number;
                        if (isWithdrawAll) {
                            const aTokenContract = new ethers.Contract(aTokenAddress, erc20Abi, provider);
                            const tokenERC20Service = new ERC20Service(provider);
                            const { decimals } = await tokenERC20Service.getTokenData(aTokenAddress);
                            const aTokenBalance = await aTokenContract.balanceOf(userAddress);
                            requestedAmount = parseFloat(ethers.utils.formatUnits(aTokenBalance, decimals));
                            console.log("🔍 [withdrawFromAave] Withdraw all - checking full balance:", requestedAmount);
                        } else {
                            requestedAmount = parseFloat(amount.toString());
                        }

                        console.log("🔍 [withdrawFromAave] Validation check:", {
                            requested: requestedAmount,
                            maxAllowed: maxAmount,
                            isWithdrawAll: isWithdrawAll
                        });

                        if (requestedAmount > maxAmount) {
                            console.error("❌ [withdrawFromAave] Withdrawal would drop health factor below 1.0");
                            let errorMessage = isWithdrawAll
                                ? `You tried to withdraw all your ${tokenSymbol}, but withdrawing the full amount (${requestedAmount.toFixed(6)} ${tokenSymbol}) would drop your health factor below 1.0 and put you at risk of liquidation.`
                                : `You tried to withdraw ${amount} ${tokenSymbol}, but withdrawing that amount would drop your health factor below 1.0 and put you at risk of liquidation.`;

                            if (maxAmount > 0) {
                                errorMessage += `\n\n💡 You can safely withdraw up to ${maxWithdrawable} ${tokenSymbol} without dropping below health factor 1.0.`;
                            } else {
                                errorMessage += `\n\n💡 Right now, all your supplied ${tokenSymbol} is being used as collateral for your borrows. You can't withdraw any without risking liquidation.`;
                            }

                            errorMessage += "\n\nHere's what you can do:\n1. Repay some of your borrowed assets first\n2. Withdraw a smaller amount instead\n3. Supply additional collateral";

                            setError(errorMessage);
                            return { success: false, message: errorMessage };
                        }
                        console.log("✅ [withdrawFromAave] Health factor validation passed");
                    }
                } catch (calcErr) {
                    console.error("⚠️ [withdrawFromAave] Could not calculate max withdrawable (continuing with transaction):", calcErr);
                    // Don't fail the transaction if we can't calculate - gas estimation will catch it
                }
            }

            setLoading(true);
            setError(null);

            const pool = new Pool(provider, {
                POOL: poolAddress,
                WETH_GATEWAY: wTokenGateWay,
            });

            const txs: EthereumTransactionTypeExtended[] = await pool.withdraw({
                user: userAddress,
                reserve,
                amount: normalizedAmount,  // Use normalized "-1" string
                aTokenAddress: aTokenAddress,
                onBehalfOf: onBehalf,
            });

            const txHashes: string[] = [];

            for (const tx of txs) {
                const extendedTxData = await tx.tx();
                const { from, ...txData } = extendedTxData;
                // ✅ Estimate gas and add 20% buffer
                const estimatedGas = await signer.estimateGas({
                    ...txData,
                    value: txData.value ? BigNumber.from(txData.value) : undefined,
                });
                const gasLimit = estimatedGas.mul(120).div(100);
                console.log("⛽ [withdrawFromAave] Withdraw gas estimate:", estimatedGas.toString(), "with buffer:", gasLimit.toString());
                const txResponse = await signer.sendTransaction({
                    ...txData,
                    gasLimit,
                    value: txData.value ? BigNumber.from(txData.value) : undefined,
                });

                console.log("⏳ [withdrawFromAave] Transaction sent, hash:", txResponse.hash);
                console.log("⏳ [withdrawFromAave] Waiting for confirmation...");

                // Wait for transaction to be mined
                const receipt = await txResponse.wait();
                console.log("📝 [withdrawFromAave] Receipt status:", receipt.status);

                if (receipt.status === 0) {
                    console.error("❌ [withdrawFromAave] Withdrawal transaction failed on-chain");
                    setError("Withdrawal transaction failed.");
                    return {
                        success: false,
                        message: "The withdrawal didn't go through. This could be due to network issues or the transaction was reverted. Please try again."
                    };
                }

                console.log("✅ [withdrawFromAave] Withdrawal confirmed!");
                txHashes.push(txResponse.hash);
            }

            return { success: true, txHashes: txHashes };
        } catch (error: unknown) {
            const err = error as TransactionError;
            console.log('err',err);

            // ✅ Handle TRANSACTION_REPLACED - wait for replacement and validate success
            if (err.code === "TRANSACTION_REPLACED" && provider) {
                const result = await handleTransactionReplaced(err, provider);
                if (result.isReplaced && result.success) {
                    console.log("✅ [withdrawFromAave] Transaction replaced with higher gas but succeeded!");
                    return {
                        success: true,
                        txHashes: [result.txHash!]
                    };
                } else if (result.isReplaced && !result.success) {
                    console.log("❌ [withdrawFromAave] Replacement transaction failed");
                    setError("The replacement transaction failed. Please try again.");
                    return { success: false, message: "The transaction was replaced but failed. Please try again." };
                }
            }

            // ✅ Check if user rejected (check all possible rejection indicators)
            if (
                err.code === "ACTION_REJECTED" ||
                err.message?.includes("User denied transaction signature") ||
                err.message?.includes("user rejected transaction") ||
                err.name === "UserRejectedRequestError"
            ) {
                console.log("ℹ️ [withdrawFromAave] User rejected the transaction");
                setError("Transaction rejected by the user.");
                return { success: false, message: "You rejected the transaction. No worries! Let me know when you're ready to try again." };
            }

            // Check for health factor / collateral errors
            if (err.message?.includes("UNPREDICTABLE_GAS_LIMIT") || err.message?.includes("execution reverted")) {
                console.error("❌ [withdrawFromAave] Likely collateral/health factor issue");

                // Extract error data if available
                const errorData = (err as any)?.error?.data;
                console.log("Error data:", errorData);

                // Common Aave error: 0x6679996d = health factor too low
                if (errorData === "0x6679996d" || err.message?.includes("6679996d")) {
                    setError("Withdrawal would put your account at risk.");

                    // Try to calculate max withdrawable amount
                    let errorMessage = "I can't process this withdrawal because that amount is being used as collateral for your borrows. If you withdraw it, your health factor would drop below 1.0, which could put you at risk of liquidation.";

                    if (uiPoolDataProvider && poolAddressesProvider && provider && address) {
                        try {
                            const maxWithdrawable = await calculateMaxWithdrawable(
                                provider,
                                address,
                                reserve,
                                tokenSymbol,
                                uiPoolDataProvider,
                                poolAddressesProvider,
                                chainId
                            );

                            if (maxWithdrawable && parseFloat(maxWithdrawable) > 0) {
                                errorMessage += `\n\n💡 You can safely withdraw up to ${maxWithdrawable} ${tokenSymbol} without dropping below health factor 1.0.`;
                            }
                        } catch (calcErr) {
                            console.error("⚠️ [withdrawFromAave] Failed to calculate max withdrawable:", calcErr);
                        }
                    }

                    errorMessage += "\n\nHere's what you can do:\n1. Repay some of your borrowed assets first\n2. Withdraw a smaller amount instead\n3. Supply additional collateral";

                    return {
                        success: false,
                        message: errorMessage
                    };
                }

                // Generic execution reverted error
                setError("Withdrawal transaction failed.");
                return {
                    success: false,
                    message: "I couldn't complete the withdrawal. This usually happens when:\n1. The amount is being used as collateral for your borrows\n2. Withdrawing would put your account at risk of liquidation\n3. There's not enough liquidity in the pool right now\n\nPlease try withdrawing a smaller amount or consider repaying some of your borrows first."
                };
            }

            if (err.name === "TransactionExecutionError") {
                setError("Transaction execution failed. Please try again.");
                return { success: false, message: "Transaction execution failed. Please try again later." };
            } else {
                setError(err.message || "An unexpected error occurred.");
                return { success: false, message: "Oops! Something unexpected happened. Please try again." };
            }
        } finally {
            setLoading(false);
        }
    };


    const borrowToAave = async ({ market, tokenSymbol, amount, onBehalfOf }: BorrowData) => {
        const selectedMarket = marketConfigs[market];

        if (!selectedMarket) {
            const errorMsg = `Market "${market}" not supported.`;
            console.error(errorMsg);
            setError(errorMsg);
            return { success: false, message: `I'm sorry, but I don't support the ${market} market yet. Please try another market like Ethereum, Polygon, or Arbitrum.` };
        }

        const poolAddress = selectedMarket.pool;
        const wTokenGateWay = selectedMarket.wethGateway;
        const reserve = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets]?.UNDERLYING;
        const chainId = selectedMarket.chainId;
        const uiPoolDataProvider = (selectedMarket as any).uiPoolDataProvider;
        const poolAddressesProvider = (selectedMarket as any).poolAddressesProvider;

        if (!reserve) {
            const errorMsg = `Token "${tokenSymbol}" not supported in market "${market}".`;
            console.error(errorMsg);
            setError(errorMsg);
            return {
                success: false,
                message: `I'm sorry, but ${tokenSymbol} isn't available on the ${market} market right now. You might want to try a different token or market.`,
            };
        }

        let provider: ethers.providers.Web3Provider | null = null;

        try {
            console.log("🔗 [borrowToAave] Target chain:", chainId);

            // ✅ Get provider and check current network
            provider = await getProvider();
            if (!provider) {
                const errorMsg = "Provider not found";
                console.error("❌ [borrowToAave]", errorMsg);
                setError(errorMsg);
                return {
                    success: false,
                    message: `We're unable to initialize the provider at the moment. Please try again later.`,
                };
            }

            const network = await provider.getNetwork();
            console.log("🌐 [borrowToAave] Current network:", network.chainId, "| Target:", chainId);

            // ✅ Switch network if needed using EIP-1193 API directly
            if (network.chainId !== chainId) {
                console.log("🔄 [borrowToAave] Network mismatch! Switching...");
                const switchedProvider = await switchToNetwork(chainId);
                if (!switchedProvider) {
                    console.error("❌ [borrowToAave] Network switch failed");
                    return {
                        success: false,
                        message: `I couldn't switch to the required network automatically. Please switch your wallet to the correct network manually and try again.`
                    };
                }
                provider = switchedProvider;
                console.log("✅ [borrowToAave] Network switched successfully");
            } else {
                console.log("✅ [borrowToAave] Already on correct chain");
            }

            const signer = await provider.getSigner();

            if (!isConnected || !address || !signer) {
                const errorMsg = "Wallet not connected. Please connect your wallet first.";
                console.error(errorMsg);
                setError(errorMsg);
                return { success: false, message: errorMsg };
            }

            if (!amount) {
                const errorMsg = "amount is missing.";
                console.error(errorMsg);
                setError(errorMsg);
                return { success: false, message: `Oops! It looks like you didn't specify an amount. Please let me know how much you'd like to proceed with.` };
            }

            // ✅ Validate amount is positive
            const amountNum = parseFloat(amount.toString());
            if (isNaN(amountNum) || amountNum <= 0) {
                setError("Amount must be greater than zero.");
                return { success: false, message: `The amount must be greater than zero. Please specify a valid amount to borrow.` };
            }

            const userAddress = address!;
            const onBehalf = onBehalfOf || userAddress;

            // ✅ STEP 1: Validate user has collateral and borrowing capacity BEFORE transaction
            console.log("🔍 [borrowToAave] Running validation...");
            const validation = await validateBorrowEligibility(
                provider,
                userAddress,
                reserve,
                amount.toString(),
                tokenSymbol,
                uiPoolDataProvider,
                poolAddressesProvider,
                chainId
            );
            if (!validation.isValid) {
                console.error("❌ [borrowToAave] Validation failed:", validation.message);
                setError(validation.message || "Validation failed");
                return { success: false, message: validation.message };
            }
            console.log("✅ [borrowToAave] Validation passed");

            setLoading(true);
            setError(null);

            const pool = new Pool(provider, {
                POOL: poolAddress,
                WETH_GATEWAY: wTokenGateWay,
            });
            const txs: EthereumTransactionTypeExtended[] = await pool.borrow({
                user: userAddress,
                reserve,
                amount,
                interestRateMode: InterestRate.Variable,
                onBehalfOf: onBehalf,
            });

            const txHashes: string[] = [];

            for (const tx of txs) {
                const extendedTxData = await tx.tx();

                const { from, ...txData } = extendedTxData;
                // ✅ Estimate gas and add 20% buffer
                const estimatedGas = await signer.estimateGas({
                    ...txData,
                    value: txData.value ? BigNumber.from(txData.value) : undefined,
                });
                const gasLimit = estimatedGas.mul(120).div(100);
                console.log("⛽ [borrowToAave] Borrow gas estimate:", estimatedGas.toString(), "with buffer:", gasLimit.toString());
                const txResponse = await signer.sendTransaction({
                    ...txData,
                    gasLimit,
                    value: txData.value ? BigNumber.from(txData.value) : undefined,
                });

                console.log("⏳ [borrowToAave] Transaction sent, hash:", txResponse.hash);
                console.log("⏳ [borrowToAave] Waiting for confirmation...");

                // Wait for transaction to be mined
                const receipt = await txResponse.wait();
                console.log("📝 [borrowToAave] Receipt status:", receipt.status);

                if (receipt.status === 0) {
                    console.error("❌ [borrowToAave] Borrow transaction failed on-chain");
                    setError("Borrow transaction failed.");
                    return {
                        success: false,
                        message: "The borrow transaction failed on the blockchain. This could be due to network issues or the transaction was reverted. Please try again."
                    };
                }

                console.log("✅ [borrowToAave] Borrow confirmed!");
                txHashes.push(txResponse.hash);
            }

            return { success: true, txHashes: txHashes };
        } catch (error: unknown) {
            const err = error as TransactionError;
            console.log('err',err);
            console.log('err.code:', err.code);
            console.log('err.message:', err.message);

            // ✅ Handle TRANSACTION_REPLACED - wait for replacement and validate success
            if (err.code === "TRANSACTION_REPLACED" && provider) {
                const result = await handleTransactionReplaced(err, provider);
                if (result.isReplaced && result.success) {
                    console.log("✅ [borrowToAave] Transaction replaced with higher gas but succeeded!");
                    return {
                        success: true,
                        txHashes: [result.txHash!]
                    };
                } else if (result.isReplaced && !result.success) {
                    console.log("❌ [borrowToAave] Replacement transaction failed");
                    setError("The replacement transaction failed. Please try again.");
                    return { success: false, message: "The transaction was replaced but failed. Please try again." };
                }
            }

            // ✅ Check if user rejected (check all possible rejection indicators)
            if (
                err.code === "ACTION_REJECTED" ||
                err.message?.includes("User denied transaction signature") ||
                err.message?.includes("user rejected transaction") ||
                err.name === "UserRejectedRequestError"
            ) {
                console.log("ℹ️ [borrowToAave] User rejected the transaction");
                setError("Transaction rejected by the user.");
                return { success: false, message: "You rejected the transaction. No worries! Let me know when you're ready to try again." };
            }

            // Check for health factor / collateral errors
            console.log("🔍 [borrowToAave] Checking if execution reverted...");
            console.log("🔍 [borrowToAave] err.code:", err.code);
            console.log("🔍 [borrowToAave] Message includes UNPREDICTABLE_GAS_LIMIT?", err.message?.includes("UNPREDICTABLE_GAS_LIMIT"));
            console.log("🔍 [borrowToAave] Message includes execution reverted?", err.message?.includes("execution reverted"));

            if (err.code === "UNPREDICTABLE_GAS_LIMIT" || err.message?.includes("UNPREDICTABLE_GAS_LIMIT") || err.message?.includes("execution reverted")) {
                console.error("❌ [borrowToAave] Likely health factor/collateral issue");

                // Extract error data if available
                const errorData = (err as any)?.error?.data?.data || (err as any)?.error?.data;
                console.log("🔍 [borrowToAave] Error data:", errorData);
                console.log("🔍 [borrowToAave] Full error object:", JSON.stringify(err, null, 2));

                // Any execution revert during borrow is likely due to insufficient collateral
                // Error codes like 0x6679996d, 0x911ceb81, etc. all indicate collateral/borrow capacity issues
                setError("Borrowing would put your account at risk.");

                // Try to calculate max borrowable amount
                let errorMessage = "I can't process this borrow because you don't have enough collateral. Borrowing this amount would drop your health factor below 1.0, which could put you at risk of liquidation.";

                if (uiPoolDataProvider && poolAddressesProvider && provider && address) {
                    try {
                        const maxBorrowable = await calculateMaxBorrowable(
                            provider,
                            address,
                            reserve,
                            tokenSymbol,
                            uiPoolDataProvider,
                            poolAddressesProvider,
                            chainId
                        );

                        if (maxBorrowable && parseFloat(maxBorrowable) > 0) {
                            errorMessage += `\n\n💡 You can safely borrow up to ${maxBorrowable} ${tokenSymbol} with your current collateral.`;
                        } else {
                            errorMessage += `\n\n💡 Right now, you don't have any borrowing capacity available. You'll need to supply more collateral first.`;
                        }
                    } catch (calcErr) {
                        console.error("⚠️ [borrowToAave] Failed to calculate max borrowable:", calcErr);
                    }
                }

                errorMessage += "\n\nHere's what you can do:\n1. Supply more collateral first\n2. Borrow a smaller amount\n3. Check your supplied assets to see what you have available";

                return {
                    success: false,
                    message: errorMessage
                };
            }

            if (err.name === "TransactionExecutionError") {
                const errorMsg = "Transaction execution failed. Please try again.";
                setError(errorMsg);
                return { success: false, message: errorMsg };
            } else {
                const errorMsg = err.message || "An unexpected error occurred.";
                setError(errorMsg);
                return { success: false, message: "Oops! Something unexpected happened. Please try again." };
            }
        } finally {
            setLoading(false);
        }
    };


    const repayToAave = async ({ market, tokenSymbol, amount, onBehalfOf }: RepayData) => {
  const selectedMarket = marketConfigs[market];
  if (!selectedMarket) {
    setError(`Market "${market}" not supported.`);
    return { success: false, message: `Sorry, the market '${market}' is not supported at the moment.` };
  }

  const poolAddress = selectedMarket.pool;
  const wTokenGateWay = selectedMarket.wethGateway;
  const variableDebtTokenAddress = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets].V_TOKEN;
  const reserve = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets]?.UNDERLYING;
  const chainId = selectedMarket.chainId;

  let provider: ethers.providers.Web3Provider | null = null;

  try {
    console.log("🔗 [repayToAave] Target chain:", chainId);

    // ✅ Get provider and check current network
    provider = await getProvider();
    if (!provider) {
      console.error("❌ [repayToAave] Provider not found");
      setError("Provider not found");
      return { success: false, message: `We're unable to initialize the provider at the moment. Please try again later.` };
    }

    const network = await provider.getNetwork();
    console.log("🌐 [repayToAave] Current network:", network.chainId, "| Target:", chainId);

    // ✅ Switch network if needed using EIP-1193 API directly
    if (network.chainId !== chainId) {
      console.log("🔄 [repayToAave] Network mismatch! Switching...");
      const switchedProvider = await switchToNetwork(chainId);
      if (!switchedProvider) {
        console.error("❌ [repayToAave] Network switch failed");
        return {
          success: false,
          message: `Failed to switch to chain ${chainId}. Please switch your wallet network manually and try again.`
        };
      }
      provider = switchedProvider;
      console.log("✅ [repayToAave] Network switched successfully");
    } else {
      console.log("✅ [repayToAave] Already on correct chain");
    }

    const signer = await provider.getSigner();

    if (!isConnected || !address || !signer) {
      setError("Wallet not connected. Please connect your wallet first.");
      return { success: false, message: `Your wallet is not connected. Please connect your wallet first to proceed.` };
    }

    if (!reserve || !variableDebtTokenAddress) {
      setError(`Token "${tokenSymbol}" not supported in market "${market}".`);
      return { success: false, message: `Token ${tokenSymbol} not supported.` };
    }

    if (!amount) {
      setError("amount is missing.");
      return { success: false, message: `The amount is missing. Please provide the required amount to proceed.` };
    }

    // ✅ Check if this is "repay all" (can be -1 number or "-1" string from backend)
    const isRepayAll = amount === -1 || amount === "-1" || amount.toString() === "-1";

    // ✅ Validate amount is positive (skip if repay all)
    if (!isRepayAll) {
      const amountNum = parseFloat(amount.toString());
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Amount must be greater than zero.");
        return { success: false, message: `The amount must be greater than zero. Please specify a valid amount to repay.` };
      }
    }

    // ✅ Normalize amount to string for SDK (convert -1 to "-1")
    const normalizedAmount = isRepayAll ? "-1" : amount.toString();

    const userAddress = address!;
    const onBehalf = onBehalfOf || userAddress;

    // ✅ STEP 1: Validate user has debt and sufficient balance to repay BEFORE transaction
    const validation = await validateRepayEligibility(provider, variableDebtTokenAddress, reserve, normalizedAmount, userAddress);
    if (!validation.isValid) {
      setError(validation.message || "Validation failed");
      return { success: false, message: validation.message };
    }

    setLoading(true);
    setError(null);
    setStatus("approve");

    // ✅ Calculate exact repay amount for approval modification
    console.log("📝 [repayToAave] Getting token data...");
    const tokenERC20Service = new ERC20Service(provider);
    const { decimals } = await tokenERC20Service.getTokenData(reserve);
    console.log("📝 [repayToAave] Token decimals:", decimals);

    // Fetch actual debt balance for accurate approval amount
    let exactRepayAmount: ethers.BigNumber;
    if (isRepayAll) {
      console.log("📊 [repayToAave] Fetching actual debt balance for repay all...");
      const debtTokenContract = new ethers.Contract(variableDebtTokenAddress, erc20Abi, provider);
      const debtBalance = await debtTokenContract.balanceOf(userAddress);
      exactRepayAmount = debtBalance;
      console.log("📊 [repayToAave] Actual debt balance:", ethers.utils.formatUnits(debtBalance, decimals));
    } else {
      exactRepayAmount = ethers.utils.parseUnits(amount.toString(), decimals);
    }

    console.log("💰 [repayToAave] Will modify SDK approval to exact amount:", ethers.utils.formatUnits(exactRepayAmount, decimals));

    // Check if there's existing allowance - if yes, reset it so SDK generates new approval
    console.log("🔒 [repayToAave] Checking existing allowance...");
    const tokenContract = new ethers.Contract(reserve, erc20Abi, signer);
    const currentAllowance = await tokenContract.allowance(userAddress, poolAddress);
    console.log("🔒 [repayToAave] Current allowance:", ethers.utils.formatUnits(currentAllowance, decimals));

    if (currentAllowance.gt(0)) {
      console.log("⏳ [repayToAave] Resetting existing allowance to 0 so SDK generates new approval...");
      // ✅ Estimate gas and add 20% buffer
      const resetEstimatedGas = await tokenContract.estimateGas.approve(poolAddress, 0);
      const resetGasLimit = resetEstimatedGas.mul(120).div(100);
      console.log("⛽ [repayToAave] Reset approval gas estimate:", resetEstimatedGas.toString(), "with buffer:", resetGasLimit.toString());
      const resetTx = await tokenContract.approve(poolAddress, 0, { gasLimit: resetGasLimit });
      console.log("⏳ [repayToAave] Reset tx hash:", resetTx.hash);

      const resetReceipt = await resetTx.wait();
      console.log("📝 [repayToAave] Reset receipt status:", resetReceipt.status);

      if (resetReceipt.status === 0) {
        console.error("❌ [repayToAave] Reset approval failed on-chain");
        setError("Approval reset transaction failed.");
        return {
          success: false,
          message: "The approval reset transaction failed. This might be due to insufficient gas or a contract error. Please try again."
        };
      }
      console.log("✅ [repayToAave] Allowance reset to 0");
    }

    // Step 2: Proceed with repay (SDK will generate approval + repay transactions)
    console.log("💰 [repayToAave] Creating pool instance...");
    const pool = new Pool(provider, {
      POOL: poolAddress,
      WETH_GATEWAY: wTokenGateWay,
    });

    console.log("💰 [repayToAave] Calling repay...");
    const txs: EthereumTransactionTypeExtended[] = await pool.repay({
      user: userAddress,
      amount: normalizedAmount,  // Use normalized "-1" string
      reserve,
      interestRateMode: InterestRate.Variable,
      onBehalfOf: onBehalf,
    });

    console.log("📋 [repayToAave] SDK returned", txs.length, "transactions");

    const txHashes: string[] = [];

    for (const tx of txs) {
      const extendedTxData = await tx.tx();
      const { from, ...txData } = extendedTxData;

      // ✅ Modify approval transaction to use exact amount instead of unlimited
      // ERC20 approve method signature is 0x095ea7b3
      if (txData.data && typeof txData.data === 'string' && txData.data.startsWith('0x095ea7b3')) {
        console.log("🔍 [repayToAave] Found SDK approval transaction, modifying to exact amount...");

        // Create interface for ERC20 approve function
        const erc20Interface = new ethers.utils.Interface([
          "function approve(address spender, uint256 amount)"
        ]);

        // Decode the original approval data
        const decodedData = erc20Interface.decodeFunctionData("approve", txData.data);
        const spender = decodedData[0]; // Pool address

        console.log("🔄 [repayToAave] Original approval amount: unlimited");
        console.log("🔄 [repayToAave] New approval amount:", ethers.utils.formatUnits(exactRepayAmount, decimals));

        // Re-encode with exact amount
        txData.data = erc20Interface.encodeFunctionData("approve", [spender, exactRepayAmount]);

        console.log("✅ [repayToAave] Modified approval to exact amount");
        setStatus("approve");
      } else {
        console.log("📝 [repayToAave] Processing repay transaction...");
        setStatus("none");
      }

      // ✅ Estimate gas and add 20% buffer
      const estimatedGas = await signer.estimateGas({
        ...txData,
        value: txData.value ? BigNumber.from(txData.value) : undefined,
      });
      const gasLimit = estimatedGas.mul(120).div(100);
      console.log("⛽ [repayToAave] Transaction gas estimate:", estimatedGas.toString(), "with buffer:", gasLimit.toString());
      const txResponse = await signer.sendTransaction({
        ...txData,
        gasLimit,
        value: txData.value ? BigNumber.from(txData.value) : undefined,
      });

      console.log("⏳ [repayToAave] Transaction sent, hash:", txResponse.hash);
      console.log("⏳ [repayToAave] Waiting for confirmation...");

      // Wait for transaction to be mined
      const receipt = await txResponse.wait();
      console.log("📝 [repayToAave] Receipt status:", receipt.status);

      if (receipt.status === 0) {
        console.error("❌ [repayToAave] Repay transaction failed on-chain");
        setError("Repay transaction failed.");
        return {
          success: false,
          message: "The repay transaction failed on the blockchain. This could be due to network issues or the transaction was reverted. Please try again."
        };
      }

      console.log("✅ [repayToAave] Repay confirmed!");
      txHashes.push(txResponse.hash);
    }

    // ✅ FIX: return object, not raw array
    return { success: true, txHashes };
  } catch (error: unknown) {
    const err = error as TransactionError;
    console.error("Error in repayToAave:", err);

    // ✅ Handle TRANSACTION_REPLACED - wait for replacement and validate success
    if (err.code === "TRANSACTION_REPLACED" && provider) {
      const result = await handleTransactionReplaced(err, provider);
      if (result.isReplaced && result.success) {
        console.log("✅ [repayToAave] Transaction replaced with higher gas but succeeded!");
        return {
          success: true,
          txHashes: [result.txHash!]
        };
      } else if (result.isReplaced && !result.success) {
        console.log("❌ [repayToAave] Replacement transaction failed");
        setError("The replacement transaction failed. Please try again.");
        return { success: false, message: "The transaction was replaced but failed. Please try again." };
      }
    }

    // ✅ Check if user rejected (check all possible rejection indicators)
    if (
      err.code === "ACTION_REJECTED" ||
      err.message?.includes("User denied transaction signature") ||
      err.message?.includes("user rejected transaction") ||
      err.name === "UserRejectedRequestError"
    ) {
      console.log("ℹ️ [repayToAave] User rejected the transaction");
      setError("Transaction rejected by the user.");
      return { success: false, message: "You rejected the transaction. No worries! Let me know when you're ready to try again." };
    }

    if (err.name === "TransactionExecutionError") {
      setError("Transaction execution failed. Please try again.");
      return { success: false, message: "Transaction execution failed. Please try again." };
    } else {
      setError(err.message || "An unexpected error occurred.");
      return { success: false, message: err.message || "An unexpected error occurred." };
    }
  } finally {
    setLoading(false);
  }
};



    return { loading, error, status, supplyToAave, withdrawFromAave, borrowToAave, repayToAave };
};

export default useAaveHook;

async function generateSupplySignatureRequest(
    user: `0x${string}`,
    token: string,
    amount: string | number,   // allow number or string
    deadline: string,
    spender: string, // poolAddress
    provider: ethers.providers.Web3Provider
): Promise<string> {
    const tokenERC20Service = new ERC20Service(provider);
    const tokenERC2612Service = new ERC20_2612Service(provider);

    const { name, decimals } = await tokenERC20Service.getTokenData(token);
    const { chainId } = await provider.getNetwork();

    // ✅ FIX: ensure string before parseUnits
    const convertedAmount = ethers.utils.parseUnits(amount.toString(), decimals).toString();

    const nonce = await tokenERC2612Service.getNonce({
        token,
        owner: user,
    });

    if (nonce === undefined || nonce === null) {
        throw new Error('Failed to fetch token nonce. Token might not support permit.');
    }

    const data = {
        types: {
            EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" },
            ],
            Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ],
        },
        primaryType: "Permit",
        domain: {
            name,
            version: "1",
            chainId,
            verifyingContract: token,
        },
        message: {
            owner: user,
            spender,
            value: convertedAmount,
            nonce,
            deadline,
        },
    };

    return JSON.stringify(data);
}

