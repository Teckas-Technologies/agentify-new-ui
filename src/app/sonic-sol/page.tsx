// SONIC TO SOLANA TESTING

"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { useEffect, useState } from "react";
import { WarpCore, HyperlaneContractsMap, MultiProvider, MultiProtocolProvider, HyperlaneCore, Token, TokenAmount, TokenStandard, WarpTypedTransaction } from "@hyperlane-xyz/sdk";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { warpCore } from "@/lib/warpcore";

const solanaRpcUrl = "https://mainnet.helius-rpc.com/?api-key=72355e0a-3db0-4c8b-98f6-426d805d5bb6"; // "https://solana-mainnet.g.alchemy.com/v2/H-LqusqbIhSz4K9KE8vQ9i8C4PQPGD-K"
const sonicRpcUrl = "https://sonic.helius-rpc.com"; // "https://api.mainnet-alpha.sonic.game"; 

export default function TestPage3() {
    const { connectWallet, user, ready } = usePrivy();
    const [isConnected, setIsConnected] = useState(false);

    const { wallets } = useSolanaWallets();

    console.log("Wallets:", wallets[0])
    console.log("User:", user)

    const check = async () => {
        setIsConnected(await wallets[0].isConnected())
    }

    useEffect(() => {
        if (wallets.length > 0) {
            check();
        }
    }, [wallets.length])

    const checkLinked = async () => {
        if (wallets.length === 0) {
            return;
        }
        const linked = await wallets[0].linked;
        console.log("Linked: ", linked);
        if (!linked) {
            const res = await wallets[0].loginOrLink();
            console.log("RES:", res)
        }
    }

    useEffect(() => {
        if (wallets.length > 0) {
            checkLinked()
        }
    }, [wallets.length])

    const handleDisconnect = async () => {
        if (wallets.length === 0) {
            return;
        }
        setIsConnected(false);
        await wallets[0].disconnect();
    }

    console.log("Tokens:", warpCore.tokens)

    const bridgeToken = async () => {
        if (!wallets.length) return alert("No wallet connected!");

        const solanaWallet = wallets[0]; // Phantom wallet from Privy
        const solanaAddress = solanaWallet.address;
        const connection = new Connection(sonicRpcUrl);

        try {
            const amount = "1";
            const destination = "solanamainnet";
            const recipient = "FwZjhNohnECbt6s9nJcmuPo8hGyQVTGmqz8m16D83Pi9";  // phantom address
            const originToken = warpCore.tokens[0];  // sonicsvm sol
            const sender = wallets[0].address;
            const parsedAmt = 0.01 * 10 ** 9;
            const originTokenAmount = originToken.amount(parsedAmt.toString());

            console.log("Org Token:", originToken)
            console.log("Org Token Amt:", originTokenAmount)

            const txs: WarpTypedTransaction[] = await warpCore.getTransferRemoteTxs({
                originTokenAmount,
                destination,
                sender,
                recipient
            });

            console.log("Transactions to Sign:", txs);

            for (const tx of txs) {
                // ✅ Ensure the transaction is a valid Solana transaction before adding it
                if (tx.transaction instanceof TransactionInstruction || tx.transaction instanceof Transaction) {
                    const signedTx = await solanaWallet.signTransaction(tx.transaction as Transaction);
                    console.log("Signed by first signer:", signedTx.signatures);

                    const txId = await connection.sendRawTransaction(signedTx.serialize());
                    console.log(`Transaction Sent: https://explorer.solana.com/tx/${txId}`);
                } else {
                    console.warn("Skipping non-Solana transaction:", tx.transaction);
                }
            }

            alert("Token bridging to Sonic initiated!");
        } catch (error) {
            console.error("Bridging failed:", error);
            alert("Failed to bridge tokens. Check console.");
        }
    };

    return (
        <div className="w-full h-full bg-red-50">
            <div className="header w-full bg-black h-[6rem] flex items-center justify-between px-[4rem]">
                <h2 className="text-white">Sonic Agents</h2>
                <div className="btns flex items-center gap-4">
                    {isConnected && <h4 className="text-white">{wallets[0].address}</h4>}
                    {!isConnected && <button className="px-6 py-2 rounded-md bg-green-300 text-white" onClick={connectWallet}>Connect Wallet</button>}
                    {isConnected && <button className="px-6 py-2 rounded-md bg-red-300 text-white" onClick={handleDisconnect}>Disconnect</button>}
                </div>
            </div>

            <div className="main w-full h-full p-6">
                <button onClick={bridgeToken} className="px-6 py-2 rounded-md bg-blue-500 text-white">
                    Bridge 0.1 Sonic to SOL
                </button>
            </div>
        </div>
    );
}
