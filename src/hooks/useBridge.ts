import { useSolanaWallets } from '@privy-io/react-auth';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { useState } from 'react';
import { warpCore } from "@/lib/warpcore";
import { WarpTypedTransaction } from '@hyperlane-xyz/sdk';

export interface BridgeData {
    fromChain: "solanamainnet" | "sonicsvm";
    amount: string;
    tokenSymbol: string;
    recipientAddress?: string;
}

const solanaRpcUrl = "https://mainnet.helius-rpc.com/?api-key=72355e0a-3db0-4c8b-98f6-426d805d5bb6";
const sonicsvmRpcUrl = "https://sonic.helius-rpc.com";

export const useBridgeToken = () => {
    const { wallets } = useSolanaWallets();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const solanaWallet = wallets[0];
    const solanaAddress = solanaWallet?.address;

    const getTokenBalance = async (tokenMint: string, userAddress: string, rpcUrl: string) => {
        try {
            const connection = new Connection(rpcUrl);
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                new PublicKey(userAddress),
                { mint: new PublicKey(tokenMint) }
            );

            if (tokenAccounts.value.length === 0) return 0; // No balance

            return parseFloat(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount);
        } catch (error) {
            console.error("Error fetching token balance:", error);
            return 0;
        }
    };

    const bridgeToken = async (data: BridgeData) => {
        if (!solanaAddress) {
            console.log("Please connect your wallet.")
            return;
        }

        const connection = data.fromChain === "solanamainnet" ? new Connection(solanaRpcUrl) : new Connection(sonicsvmRpcUrl);

        const destination = data.fromChain === "solanamainnet" ? "sonicsvm" : "solanamainnet";
        const recipient = data?.recipientAddress ? data.recipientAddress : solanaAddress;
        // const originToken = data.fromChain === "solanamainnet" ? warpCore.tokens[1] : warpCore.tokens[0];

        const originToken = warpCore.tokens.find(
            token => token.symbol === data.tokenSymbol && token.chainName === data.fromChain
        );

        if (!originToken) {
            console.log(`Token ${data.tokenSymbol} not found for bridging from ${data.fromChain}.`);
            return;
        }

        const sender = solanaAddress;
        const parsedAmt = parseFloat(data.amount) * 10 ** originToken.decimals; // 0.02 * 10 ** 9
        const originTokenAmount = originToken.amount(parsedAmt.toString());

        console.log("Recipient:", recipient)
        console.log("Origin Token:", originToken)
        console.log("Amount:", originTokenAmount)
        console.log("Desination:", destination)

        setLoading(true);
        setError(null);

        try {
            const txs: WarpTypedTransaction[] = await warpCore.getTransferRemoteTxs({
                originTokenAmount,
                destination,
                sender,
                recipient,
            });
            console.log(txs)

            let txHash;

            for (const tx of txs) {
                if (tx.transaction instanceof TransactionInstruction || tx.transaction instanceof Transaction) {
                    const signedTx = await solanaWallet.signTransaction(tx.transaction as Transaction);
                    console.log("Signed Transaction:", signedTx);

                    txHash = await connection.sendRawTransaction(signedTx.serialize());
                    console.log(`Transaction Sent: https://explorer.solana.com/tx/${txHash}`);
                } else {
                    console.warn("Skipping non-Solana transaction:", tx.transaction);
                }
            }

            return { success: true, txHash: txHash, message: `Bridge from ${data.fromChain === "solanamainnet" ? "Solana" : "SONIC SVM"} to ${data.fromChain === "solanamainnet" ? "SONIC SVM" : "Solana"} successfully!` }
        } catch (err: any) {
            setError(err.message || "An error occurred");
            return { success: false, message: err.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, bridgeToken };
};