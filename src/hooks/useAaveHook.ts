"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { Pool, ERC20Service, ERC20_2612Service, EthereumTransactionTypeExtended, InterestRate } from "@aave/contract-helpers";
import { BigNumber } from "ethers";
// import { useAppKitProvider } from "@reown/appkit/react";
import { marketConfigs } from "@/utils/markets";
import { MarketType } from "@/types/types";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { switchNetwork } from "@/utils/switchNetwork";
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
    amount: string; // can be "-1" to repay max
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
    const supplyToAave = async ({ market, tokenSymbol, amount, onBehalfOf }: LendingData) => {
        const selectedMarket = marketConfigs[market];

        if (!selectedMarket) {
            setError(`Market "${market}" not supported.`);
            return { success: false, message: `Sorry, the market '${market}' is not supported at the moment.` };
        }

        const poolAddress = selectedMarket.pool;
        const wTokenGateWay = selectedMarket.wethGateway;
        const reserve = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets]?.UNDERLYING;
        const chainId = selectedMarket.chainId;

        if (!reserve) {
            setError(`Token "${tokenSymbol}" not supported in market "${market}".`);
            return { success: false, message: `The token '${tokenSymbol}' is not supported in the '${market}' market at the moment.` };
        }

        try {
            if (wallet && chainId && parseInt(wallet.chainId.split(":")[1]) !== chainId) {
                await switchNetwork(chainId);
            }

            const provider = await getProvider();
            if (!provider) {
                console.error("[supplyToAave] Provider not found");
                setError("Provider not found");
                return { success: false, message: `We're unable to initialize the provider at the moment. Please try again later.` };
            }

            const signer = await provider.getSigner();

            if (!isConnected || !address || !signer) {
                setError("Wallet not connected. Please connect your wallet first.");
                return { success: false, message: `Your wallet is not connected. Please connect your wallet first to proceed.` };
            }

            if (!amount) {
                setError("Amount is missing.");
                return { success: false, message: `The amount is missing. Please provide the required amount to proceed.` };
            }

            const user = address;
            const onBehalf = onBehalfOf || user;

            setLoading(true);
            setError(null);
            setStatus("approve");

            // Step 1: Check allowance
            const tokenContract = new ethers.Contract(reserve, erc20Abi, signer);
            const currentAllowance = await tokenContract.allowance(user, poolAddress);

            const supplyAmount = ethers.utils.parseUnits(amount.toString(), 18); // Make sure the amount has the correct decimal places
            if (currentAllowance.lt(supplyAmount)) {
                // Step 2: Increase allowance if needed
                const approvalTx = await tokenContract.approve(poolAddress, supplyAmount);
                await approvalTx.wait();
            }

            // Step 3: Proceed with the supply with permit
            const pool = new Pool(provider, {
                POOL: poolAddress,
                WETH_GATEWAY: wTokenGateWay,
            });

            const deadline = Math.floor(Date.now() / 1000 + 3600).toString();
            const signatureData = await generateSupplySignatureRequest(user, reserve, amount, deadline, poolAddress, provider);
            const signerAddress = await signer.getAddress();

            const signature = await provider.send("eth_signTypedData_v4", [
                signerAddress,
                signatureData,
            ]);

            const txs = await pool.supplyWithPermit({
                user,
                reserve,
                amount,
                signature,
                onBehalfOf: onBehalf,
                deadline,
            });

            const txHashes = [];
            for (const tx of txs) {
                const extendedTxData = await tx.tx();
                const { from, ...txData } = extendedTxData;
                const txResponse = await signer.sendTransaction({
                    ...txData,
                    value: txData.value ? BigNumber.from(txData.value) : undefined,
                });
                txHashes.push(txResponse.hash);

                // Wait for transaction to be mined
                await txResponse.wait();
            }

            return { success: true, txHashes };
        } catch (err) {
            console.error("Err:", err);
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
        amount: string; // can pass "-1" to withdraw max
        onBehalfOf?: string;
    }) => {
        const selectedMarket = marketConfigs[market];

        if (!selectedMarket) {
            setError(`Market "${market}" not supported.`);
            return { success: false, message: `Sorry, the market '${market}' is not supported at the moment.` };
        }

        const poolAddress = selectedMarket.pool;
        const wTokenGateWay = selectedMarket.wethGateway;
        const reserve = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets]?.UNDERLYING;
        const aTokenAddress = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets]?.A_TOKEN;
        const chainId = selectedMarket.chainId;

        if (!reserve || !aTokenAddress) {
            setError(`Token "${tokenSymbol}" not supported in market "${market}".`);
            return { success: false, message: `The token '${tokenSymbol}' is not supported in the '${market}' market at the moment.` };
        }

        try {
            if (wallet && chainId && parseInt(wallet.chainId.split(":")[1]) !== chainId) {
                await switchNetwork(chainId);
            }

            const provider = await getProvider();
            if (!provider) {
                console.error("[supplyToAave] Provider not found");
                setError("Provider not found");
                return { success: false, message: `We're unable to initialize the provider at the moment. Please try again later.` };
            }
            const signer = await provider.getSigner();

            if (!isConnected || !address || !signer) {
                setError("Wallet not connected. Please connect your wallet first.");
                return { success: false, message: `Your wallet is not connected. Please connect your wallet first to proceed.` };
            }

            if (!amount) {
                setError("Withdrawal amount is missing.");
                return { success: false, message: `The amount is missing. Please provide the required amount to proceed.` };
            }

            const user = address;
            const onBehalf = onBehalfOf || user;

            setLoading(true);
            setError(null);

            const pool = new Pool(provider, {
                POOL: poolAddress,
                WETH_GATEWAY: wTokenGateWay,
            });

            const txs: EthereumTransactionTypeExtended[] = await pool.withdraw({
                user,
                reserve,
                amount,
                aTokenAddress: aTokenAddress,
                onBehalfOf: onBehalf,
            });

            const txHashes: string[] = [];

            for (const tx of txs) {
                const extendedTxData = await tx.tx();
                const { from, ...txData } = extendedTxData;
                const txResponse = await signer.sendTransaction({
                    ...txData,
                    value: txData.value ? BigNumber.from(txData.value) : undefined,
                });
                txHashes.push(txResponse.hash);
            }

            return { success: true, txHashes: txHashes };
        } catch (error: unknown) {
            const err = error as TransactionError;
            if (
                err.message?.includes("User denied transaction signature") ||
                err.name === "UserRejectedRequestError"
            ) {
                setError("Transaction rejected by the user.");
                return { success: false, message: "You have rejected the transaction." };
            } else if (err.name === "TransactionExecutionError") {
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
            return { success: false, message: `Sorry, the market '${market}' is not supported at the moment.` };
        }

        const poolAddress = selectedMarket.pool;
        const wTokenGateWay = selectedMarket.wethGateway;
        const reserve = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets]?.UNDERLYING;
        const chainId = selectedMarket.chainId;

        if (!reserve) {
            const errorMsg = `Token "${tokenSymbol}" not supported in market "${market}".`;
            console.error(errorMsg);
            setError(errorMsg);
            return {
                success: false,
                message: `The token '${tokenSymbol}' is not supported in the '${market}' market at the moment.`,
            };
        }

        try {
            if (wallet && chainId) {
                const currentChainId = parseInt(wallet.chainId.split(":")[1]);
                if (currentChainId !== chainId) {
                    await switchNetwork(chainId);
                }
            }

            const provider = await getProvider();

            if (!provider) {
                const errorMsg = "Provider not found";
                console.error("[borrowToAave]", errorMsg);
                setError(errorMsg);
                return {
                    success: false,
                    message: `We're unable to initialize the provider at the moment. Please try again later.`,
                };
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
                return { success: false, message: `The amount is missing. Please provide the required amount to proceed.` };
            }

            const user = address;
            const onBehalf = onBehalfOf || user;

            setLoading(true);
            setError(null);

            const pool = new Pool(provider, {
                POOL: poolAddress,
                WETH_GATEWAY: wTokenGateWay,
            });
            const txs: EthereumTransactionTypeExtended[] = await pool.borrow({
                user,
                reserve,
                amount,
                interestRateMode: InterestRate.Variable,
                onBehalfOf: onBehalf,
            });

            const txHashes: string[] = [];

            for (const tx of txs) {
                const extendedTxData = await tx.tx();

                const { from, ...txData } = extendedTxData;
                const txResponse = await signer.sendTransaction({
                    ...txData,
                    value: txData.value ? BigNumber.from(txData.value) : undefined,
                });
                txHashes.push(txResponse.hash);
            }

            return { success: true, txHashes: txHashes };
        } catch (error: unknown) {
            const err = error as TransactionError;
            if (err.message?.includes("User denied transaction signature") || err.name === "UserRejectedRequestError") {
                const errorMsg = "Transaction rejected by the user.";
                setError(errorMsg);
                return { success: false, message: "You have rejected the transaction." };
            } else if (err.name === "TransactionExecutionError") {
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
        const provider = await getProvider();
        if (!provider) {
            console.error("[supplyToAave] Provider not found");
            setError("Provider not found");
            return { success: false, message: `We're unable to initialize the provider at the moment. Please try again later.` };
        }
        const signer = await provider.getSigner();

        if (!isConnected || !address || !signer) {
            setError("Wallet not connected. Please connect your wallet first.");
            return { success: false, message: `Your wallet is not connected. Please connect your wallet first to proceed.` };
        }

        const selectedMarket = marketConfigs[market];

        if (!selectedMarket) {
            setError(`Market "${market}" not supported.`);
            return { success: false, message: `Sorry, the market '${market}' is not supported at the moment.` };
        }

        const poolAddress = selectedMarket.pool;
        const wTokenGateWay = selectedMarket.wethGateway;
        const variableDebtTokenAddress = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets].V_TOKEN;
        const reserve = selectedMarket.assets[tokenSymbol as keyof typeof selectedMarket.assets]?.UNDERLYING;

        if (!reserve || !variableDebtTokenAddress) {
            setError(`Token "${tokenSymbol}" not supported in market "${market}".`);
            return;
        }

        if (!amount) {
            setError("amount is missing.");
            return { success: false, message: `The amount is missing. Please provide the required amount to proceed.` };
        }

        const user = address;
        const onBehalf = onBehalfOf || user;

        try {
            setLoading(true);
            setError(null);

            const pool = new Pool(provider, {
                POOL: poolAddress,
                WETH_GATEWAY: wTokenGateWay,
            });

            const deadline = Math.floor(Date.now() / 1000 + 3600).toString();
            const signatureData = await generateSupplySignatureRequest(user, variableDebtTokenAddress, amount, deadline, poolAddress, provider);
            const signerAddress = await signer.getAddress();
            const signature: string = await provider.send("eth_signTypedData_v4", [
                signerAddress,
                signatureData,
            ]);

            let repayAmount = amount;
            if (amount !== "-1") {
                const tokenERC20Service = new ERC20Service(provider);
                const { decimals } = await tokenERC20Service.getTokenData(variableDebtTokenAddress);
                repayAmount = ethers.utils.parseUnits(amount, decimals).toString();
            } else {
                // console.log("Full repay mode (amount = -1)");
            }

            const txs: EthereumTransactionTypeExtended[] = await pool.repayWithPermit({
                user,
                amount: repayAmount,
                reserve,
                signature,
                interestRateMode: InterestRate.Variable,
                onBehalfOf: onBehalf,
                deadline
            });

            const txHashes: string[] = [];

            for (const tx of txs) {
                const extendedTxData = await tx.tx();
                const { from, ...txData } = extendedTxData;
                const txResponse = await signer.sendTransaction({
                    ...txData,
                    value: txData.value ? BigNumber.from(txData.value) : undefined,
                });

                txHashes.push(txResponse.hash);
            }

            return txHashes;
        } catch (error: unknown) {
            const err = error as TransactionError;
            console.error("Error in repayToAave:", err); // 🔍 full error

            if (
                err.message?.includes("User denied transaction signature") ||
                err.name === "UserRejectedRequestError"
            ) {
                setError("Transaction rejected by the user.");
            } else if (err.name === "TransactionExecutionError") {
                setError("Transaction execution failed. Please try again.");
            } else {
                setError(err.message || "An unexpected error occurred.");
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
    amount: string,
    deadline: string,
    spender: string, // poolAddress
    provider: ethers.providers.Web3Provider
): Promise<string> {
    const tokenERC20Service = new ERC20Service(provider);
    const tokenERC2612Service = new ERC20_2612Service(provider);

    const { name, decimals } = await tokenERC20Service.getTokenData(token);
    const { chainId } = await provider.getNetwork();
    const convertedAmount = ethers.utils.parseUnits(amount, decimals).toString();
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
