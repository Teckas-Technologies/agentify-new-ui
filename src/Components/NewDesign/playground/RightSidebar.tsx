"use client";

import { useState } from "react";
import { Wallet, X } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { getAccessToken } from "@privy-io/react-auth";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen, onClose }) => {
  const { handleWalletConnect, disconnectAll } = useWalletConnect();
    const { user } = usePrivy();
    const { address,isConnected } = useAccount();
const handleClick = async () => {
  if (!address || !user) {
    await handleWalletConnect();

    // ✅ Once wallet is connected, close the sidebar
    setTimeout(() => {
      onClose();
    }, 300); // small delay for smooth animation
  } else {
    disconnectAll();
    setTimeout(() => {
      onClose();
    }, 300);
  }
};

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-[#101014] text-white shadow-lg transform transition-transform duration-500 z-40 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-[#1d1d20]">
        <h2 className="text-sm font-semibold text-gray-300">Wallet</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Wallet Content */}
      <div className="p-4 space-y-6">
        {/* Wallet Address / Connection Box */}
        <div className="bg-[#18181B] px-3 py-2 rounded-lg flex justify-center gap-3 items-center">
          <Wallet className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">...</span>
        </div>

        {/* Tokens Section */}
        <div>
          <h3 className="text-xs text-gray-400 mb-2">Tokens</h3>
          <div className="space-y-3">
            <Button className="w-full bg-[#0a0a0a] text-gray-300 hover:bg-[#0a0a0a] rounded py-2 text-sm">
              Connect your wallet to get started
            </Button>
            <Button
              className="glow-border relative overflow-hidden w-full 
             bg-[#1d1d20] hover:bg-[#1a142a] 
             text-white rounded-lg py-2 text-sm 
             shadow-md transition-all duration-300" onClick={ handleClick}
            >
               {address && user ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
