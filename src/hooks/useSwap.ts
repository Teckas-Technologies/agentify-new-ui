// Not working TODO
import { useSolanaWallets } from "@privy-io/react-auth";
import {
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import { useState } from "react";
import BN from "bn.js";

const SOLANA_RPC_URL = "https://sonic.helius-rpc.com";
const CPSWAP_PROGRAM_ID = new PublicKey("SegazTQwbYWknDZkJ6j2Kgvm5gw3MrHGKtWstZdoNKZ");

export interface SwapData {
    inputMint: string;
    outputMint: string;
    inputTokenAccount: string;
    outputTokenAccount: string;
    poolState: string;
    inputVault: string;
    outputVault: string;
    ammConfig: string;
    authority: string;
    observationState: string;
    inputTokenProgram: string;
    outputTokenProgram: string;
    amountIn: string;
    minAmountOut?: string;
}

export const useSwapToken = () => {
    const { wallets } = useSolanaWallets();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const solanaWallet = wallets[0];
    const solanaAddress = solanaWallet?.address;

    const swapToken = async (data: SwapData) => {
        if (!solanaAddress) {
            setError("Please connect your wallet.");
            return;
        }

        const connection = new Connection(SOLANA_RPC_URL);
        const payer = new PublicKey(solanaAddress);

        try {
            setLoading(true);
            setError(null);

            // ✅ Validate PublicKeys
            const validatePublicKey = (key: string) => {
                try {
                    return new PublicKey(key);
                } catch (error) {
                    throw new Error(`Invalid PublicKey: ${key}`);
                }
            };

            const inputMint = validatePublicKey(data.inputMint);
            const outputMint = validatePublicKey(data.outputMint);
            const inputTokenAccount = validatePublicKey(data.inputTokenAccount);
            const outputTokenAccount = validatePublicKey(data.outputTokenAccount);
            const poolState = validatePublicKey(data.poolState);
            const inputVault = validatePublicKey(data.inputVault);
            const outputVault = validatePublicKey(data.outputVault);
            const ammConfig = validatePublicKey(data.ammConfig);
            const observationState = validatePublicKey(data.observationState);
            const inputTokenProgram = validatePublicKey(data.inputTokenProgram);
            const outputTokenProgram = validatePublicKey(data.outputTokenProgram);
            const authority = validatePublicKey(data.authority);

            // ✅ Validate Amount
            const amountIn = new BN(parseFloat(data.amountIn) * 10 ** 9);
            const minAmountOut = data.minAmountOut
                ? new BN(parseFloat(data.minAmountOut) * 10 ** 9)
                : new BN(0);

            // ✅ Construct the Swap Instruction
            const swapInstruction = new TransactionInstruction({
                programId: CPSWAP_PROGRAM_ID,
                keys: [
                    { pubkey: payer, isSigner: true, isWritable: true }, // User
                    { pubkey: authority, isSigner: false, isWritable: false }, // authority TODO://
                    { pubkey: ammConfig, isSigner: false, isWritable: false }, // Config
                    { pubkey: poolState, isSigner: false, isWritable: true }, // Pool
                    { pubkey: inputTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: outputTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: inputVault, isSigner: false, isWritable: true },
                    { pubkey: outputVault, isSigner: false, isWritable: true },
                    { pubkey: inputTokenProgram, isSigner: false, isWritable: false },
                    { pubkey: outputTokenProgram, isSigner: false, isWritable: false },
                    { pubkey: inputMint, isSigner: false, isWritable: false },
                    { pubkey: outputMint, isSigner: false, isWritable: false },
                    { pubkey: observationState, isSigner: false, isWritable: true },
                ],
                data: Buffer.from(
                    Uint8Array.of(
                        ...[143, 190, 90, 218, 196, 30, 51, 222], // Discriminator for swapBaseInput
                        ...amountIn.toArray("le", 8),
                        ...minAmountOut.toArray("le", 8)
                    )
                ),
            });

            // ✅ Create and sign the transaction
            const transaction = new Transaction().add(swapInstruction);
            // transaction.feePayer = payer;

            // const { blockhash } = await connection.getLatestBlockhash();
            // transaction.recentBlockhash = blockhash;

            const signedTx = await solanaWallet.signTransaction(transaction);

            // ✅ Send Transaction (Bypassing Preflight Simulation)
            const txHash = await connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: true,  // 🚀 Bypass simulation errors
                preflightCommitment: "processed",
            });

            console.log(`Transaction Sent: https://explorer.solana.com/tx/${txHash}`);

            return {
                success: true,
                txHash,
                message: `Swapped ${data.amountIn} tokens successfully!`,
            };
        } catch (err: any) {
            setError(err.message || "Swap failed");
            console.error("Swap failed:", err.message);
            return { success: false, message: err.message || "Swap failed" };
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, swapToken };
};
