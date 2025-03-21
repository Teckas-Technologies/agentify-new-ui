"use client";

import useAaveHook from "@/hooks/useAaveHook";
import { supplyWithSign } from "@/hooks/useSupplyExample";
import { MarketType } from "@/types/types";
import { InterestRate } from "@aave/contract-helpers";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers } from "ethers";
import { useAccount, useDisconnect } from "wagmi";

export default function TestPage() {
    const { isConnected } = useAppKitAccount();
    const { address } = useAccount();
    const { open } = useAppKit();
    const { disconnect } = useDisconnect();

    const handleConnectWallet = () => {
        open({ view: 'Connect' });
    }

    const handleDisconnect = () => {
        disconnect();
    }

    const handleViewAccount = () => {
        open({ view: 'Account' });
    }

    // const { lending } = useAaveLendingHook();

    // // // ✅ Hardcoded token address and amount
    // const hardcodedTokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC on Ethereum mainnet
    // const hardcodedAmount = '400'; // 1 USDC (6 decimals, so 1 * 10^6)

    // const handleHardcodedLend = async () => {
    //     const result = await lending({
    //         tokenAddress: hardcodedTokenAddress,
    //         amount: hardcodedAmount,
    //         usePermit: true, // or true if you want to test permit-based lending
    //     });
    //     console.log("RES:", result)

    //     if (result?.success) {
    //         alert('Hardcoded lending successful!');
    //     } else {
    //         alert(`Lending failed: ${result?.error}`);
    //     }
    // };

    // const { walletProvider } = useAppKitProvider("eip155");
    const { supplyToAave, withdrawFromAave, borrowToAave, repayToAave, error } = useAaveHook();

    const supply = async () => {
        if (!address) return;

        // const res = await repayToAave({ reserve: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357", amount: "0.05", rateMode: InterestRate.Stable, poolAddress: "0x6ae43d3271ff6888e7fc43fd7321a503ff738951", wTokenGateWay: "0x387d311e47e80b498169e6fb51d3193167d89F7D" });
        // console.log("RES:", res);

        const res = await supplyToAave({ tokenSymbol: "USDC", amount: "0.001", market: MarketType.EthereumCore });
        console.log("RES:", res);

        // const res = await borrowToAave({ tokenSymbol: "EURS", amount: "0.05", market: MarketType.Sepolia });
        // console.log("RES:", res);

        // const res = await repayToAave({ tokenSymbol: "EURS", amount: "0.01", market: MarketType.Sepolia });
        // console.log("RES:", res);

        // const res = await withdrawFromAave({ tokenSymbol: "USDC", amount: "1", market: MarketType.Sepolia });
        // console.log("RES:", res);

        // const signer = await provider.getSigner();
        // supplyWithSign({ user: address, reserve: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", amount: "1", onBehalfOf: address, provider: provider , signer: signer })
    }

    return (
        <div className="w-full h-full">
            <div className="header w-full bg-black h-[6rem] flex items-center justify-between px-[4rem]">
                <h2 className="text-white">Agentify</h2>
                <div className="btns flex items-center gap-4">
                    {isConnected && <h4 className="text-white">{address}</h4>}
                    {!isConnected && <button className="px-6 py-2 rounded-md bg-green-300 text-white" onClick={handleConnectWallet}>Connect Wallet</button>}
                    {isConnected && <button className="px-6 py-2 rounded-md bg-red-300 text-white" onClick={handleViewAccount}>View Account</button>}
                </div>
            </div>

            <div className="main w-full h-full p-6">
                <button onClick={supply} className="px-6 py-2 rounded-md bg-blue-500 text-white">
                    Lend 0.004 USDC
                </button>
            </div>
            <p className="text-red-400">Error: {error}</p>
        </div>
    );
}
