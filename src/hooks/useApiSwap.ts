import { useSolanaWallets } from "@privy-io/react-auth";
import {
    Connection,
    PublicKey,
    Transaction,
    VersionedTransaction
} from "@solana/web3.js";
import { useState } from "react";

const SOLANA_RPC_URL = "https://sonic.helius-rpc.com";

export const useApiSwapToken = () => {
    const { wallets } = useSolanaWallets();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    const solanaWallet = wallets[0];
    const solanaAddress = solanaWallet?.address;

    const swapToken = async (transactionData: string) => {
        if (!solanaWallet || !solanaAddress) {
            setError("Please connect your wallet.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const connection = new Connection(SOLANA_RPC_URL, "confirmed");

            // Decode transaction from base64
            const decodedTx = Buffer.from(transactionData, "base64");
            console.log("Decoded Tx:", decodedTx);
            // const transaction = Transaction.from(decodedTx);
            const versionedTransaction = VersionedTransaction.deserialize(decodedTx);
            console.log("Tx:", versionedTransaction)
            const { blockhash } = await connection.getLatestBlockhash();
            versionedTransaction.message.recentBlockhash = blockhash;

            // Request signing from the connected wallet
            const signedTx = await solanaWallet.signTransaction(versionedTransaction);

            const txHash = await connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: true,
                preflightCommitment: "processed",
            });

            console.log(`Transaction Sent: https://explorer.solana.com/tx/${txHash}`);

            setTxSignature(txHash);
            console.log("Transaction successful with signature:", txHash);

            return { success: true, txHash: txHash, message: `Swap executed successfully!` }
        } catch (err: any) {
            console.error("Error swapping token:", err);
            setError("Transaction failed. Please try again.");
            return { success: false, message: err.message || "An error occurred" };
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, txSignature, swapToken };
};
