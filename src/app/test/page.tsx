"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { useEffect, useState } from "react";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useSwapToken } from "@/hooks/useSwap";
import { useApiSwapToken } from "@/hooks/useApiSwap";
import { useSegaApi } from "@/hooks/useSega";
import { warpCore } from "@/lib/warpcore";
import { getTokenAccountOwner, getTokenOwner } from "@/utils/fetchTokenOwner";
import { useBridgeToken } from "@/hooks/useBridge";

export default function TestPage() {
    const { connectWallet, user, ready } = usePrivy();
    const [isConnected, setIsConnected] = useState(false);

    const { wallets } = useSolanaWallets();

    // console.log("Wallets:", wallets[0])
    // console.log("User:", user)

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

    // const { loading, error, swapToken } = useSwapToken();

    // const handleSwap = async () => {
    //     const swapResult = await swapToken({
    //         authority: "9ynCweFM8pCLteyTUanyGnzUAGp4zP6bK5wLD6Ktiz6P",
    //         inputMint: "So11111111111111111111111111111111111111112",
    //         outputMint: "mrujEYaN1oyQXDHeYNxBYpxWKVkQ2XsGxfznpifu4aL",
    //         inputTokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    //         outputTokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    //         inputVault: "HzfTFD9wzZ9XEzeLNGuvd3nzYCCJtc94orxzbJZr4cK5",
    //         outputVault: "Hh3tctzki4Xn5MddEGPZVmAXaVsswrPVUmHmBWw6iTXu",
    //         ammConfig: "Bkxq43SaKWjCL7tqWKoiX9hTaCHKBw8XnLwzDa6Ckork",
    //         observationState: "s7EhZxBxVexNRrac4UKWbp7nDXa6TajkE456T5uoiQ1", // TODO
    //         poolState: "DgMweMfMbmPFChTuAvTf4nriQDWpf9XX3g66kod9nsR4",
    //         inputTokenAccount: wallets[0].address,
    //         outputTokenAccount: "FwZjhNohnECbt6s9nJcmuPo8hGyQVTGmqz8m16D83Pi9",
    //         amountIn: "0.0001", // 1.5 Tokens
    //         minAmountOut: "0.0001", // Minimum expected output (slippage protection)
    //     });

    //     if (swapResult?.success) {
    //         console.log("Swap successful:", swapResult.txHash);
    //     } else {
    //         console.error("Swap failed:", swapResult?.message);
    //     }
    // };

    // const { swapToken } = useApiSwapToken();

    // const handleSwap = async () => {
    //     const res = await swapToken("AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAKEbA5DfRWZQMedIdVxXB+NekXoot6r9fK+6VX4mRt3ZeZ/LFrY26pK/mE5d9co+zTVkuBDcdhproJuVS47qfYD+/p4gsBeexMrErH9InLeWq5eORFQlhPYDGQt7XkWche5rxhkvMiO/eykJF4NyuiqjC3l6X9e+Q9ve2IoYpJu3iD/ICTSB1F85P5DINlWoe3yL0zc7GH3kI4ncoDlYPI1Mz3/X2raBR5UJ5ZWyJpJnzNl+D1ARpj/r2hCGHP8qaQYAzWF3yT8J5tsRXvosDkSZRvOyt3AfQ5vv80TYNhz4XqAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WQt9/O3wuh41LPq1RBt0YNsJDYZVa++qPbvTRVxQ821ZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG3fbh7nWP3hhCXbzkbM3athr8TYO5DSf+vfko2KGL/AabiFf+q4GE+2h/Y0YYwDXaxDncGus7VZig8AAAAAABBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkGkiDDrfssXMtGek07Vp/PI7aK3v1jryDJrHgSRsgMWIVpIpvle23lqOp06AbcAU12NwnVo24zPmiCOfeu/EpUn9f4MxEnXOhHC8iWQsDmhqCkTFZujBDF8dhuWOZ3XYVPFmuJzds3bEJwEtR+A9MadsuLuL11QsGBEXncuSmvWggHAAUCIKEHAAcACQOghgEAAAAAAAgGAAEACQoLAQEIBgACAAwKDQEBCgIAAgwCAAAAoIYBAAAAAAANAQIBEQ4NAA8QAwIBBAUNCwwJBhiPvlraxB4z3qCGAQAAAAAAyDTmAgAAAAANAwIAAAEJAA==");
    //     console.log("RES:", res)
    // }
    const fetchOwner = async () => {
        console.log("Tokens:", warpCore.tokens)
        // const ownerAddress = await getTokenOwner("CCaj4n3kbuqsGvx4KxiXBfoQPtAgww6fwinHTAPqV5dS", wallets[0]?.address);
        const connection = new Connection("https://sonic.helius-rpc.com");
        const tokenAccount = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"; // "mrujEYaN1oyQXDHeYNxBYpxWKVkQ2XsGxfznpifu4aL"; // "CCaj4n3kbuqsGvx4KxiXBfoQPtAgww6fwinHTAPqV5dS"; // Replace with actual token account address
        const ownerAddress = await getTokenAccountOwner(connection, tokenAccount);
        console.log("OWNER:", ownerAddress)
    }

    const { fetchSwapRawData } = useSegaApi(); // inputMint=

    const handleSwap = async () => {
        const res = await fetchSwapRawData({ inputMint: "So11111111111111111111111111111111111111112", outputMint: "mrujEYaN1oyQXDHeYNxBYpxWKVkQ2XsGxfznpifu4aL", amount: "10000" })
        console.log("RES:", res)
    }

    const { bridgeToken } = useBridgeToken();

    const handleBridge = async () => {
        const res = await bridgeToken({ fromChain: "sonicsvm", amount: "0.001", tokenSymbol: "sonicSOL" });
        console.log("RES:>>>", res)
    }


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
                <button onClick={handleBridge} className="px-6 py-2 rounded-md bg-blue-500 text-white">
                    Swap 0.1 SOL to Sonic
                </button>
            </div>
        </div>
    );
}
