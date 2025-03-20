"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
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

    return (
        <div className="w-full h-full bg-red-50">
            <div className="header w-full bg-black h-[6rem] flex items-center justify-between px-[4rem]">
                <h2 className="text-white">Agentify</h2>
                <div className="btns flex items-center gap-4">
                    {isConnected && <h4 className="text-white">{address}</h4>}
                    {!isConnected && <button className="px-6 py-2 rounded-md bg-green-300 text-white" onClick={handleConnectWallet}>Connect Wallet</button>}
                    {isConnected && <button className="px-6 py-2 rounded-md bg-red-300 text-white" onClick={handleDisconnect}>Disconnect</button>}
                </div>
            </div>

            {/* <div className="main w-full h-full p-6">
                <button onClick={handleBridge} className="px-6 py-2 rounded-md bg-blue-500 text-white">
                    Swap 0.1 ETH to Sonic
                </button>
            </div> */}
        </div>
    );
}
