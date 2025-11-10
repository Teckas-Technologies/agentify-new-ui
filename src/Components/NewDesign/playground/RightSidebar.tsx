"use client";

import { useState } from "react";
import { Wallet, X, Loader2 } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { getAccessToken } from "@privy-io/react-auth";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { NetworkSwitcher } from "./NetworkSwitcher";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen, onClose }) => {
  const { handleWalletConnect, disconnectAll } = useWalletConnect();
  const { user } = usePrivy();
  const { address, isConnected } = useAccount();
  const { tokens, isLoading } = useTokenBalances();

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
      className={`fixed top-0 right-0 h-screen w-80 bg-[#101014] text-white shadow-lg transform transition-transform duration-500 z-40 flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-[#1d1d20]">
        <h2 className="text-sm font-semibold text-gray-300">Wallet</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Wallet Address - Fixed */}
      <div className="flex-shrink-0 p-4 pb-3">
        <div className="bg-[#18181B] px-3 py-2 rounded-lg flex justify-center gap-3 items-center">
          <Wallet className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">
            {address && user
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "Not connected"}
          </span>
        </div>
      </div>

      {/* Network Switcher - Fixed */}
      {address && user && (
        <div className="flex-shrink-0 px-4 pb-3">
          <NetworkSwitcher />
        </div>
      )}

      {/* Tokens Section - Scrollable */}
      <div className="flex-1 overflow-hidden px-4 flex flex-col min-h-0">
        <h3 className="text-xs text-gray-400 mb-3 flex-shrink-0">Tokens</h3>

        {!address || !user ? (
          <div className="flex-shrink-0">
            <Button className="w-full bg-[#0a0a0a] text-gray-300 hover:bg-[#0a0a0a] rounded py-2 text-sm">
              Connect your wallet to get started
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading tokens...</span>
          </div>
        ) : tokens.length > 0 ? (
          <div className="flex-1 overflow-y-auto custom-scroll pr-1 min-h-0">
            <div className="space-y-2 pb-2">
              {tokens.map((token, index) => (
                <div
                  key={`${token.address}-${index}`}
                  className="bg-[#18181B] rounded-lg p-3 flex items-center gap-3 hover:bg-[#1f1f23] transition-colors w-full"
                >
                  {/* Token Logo */}
                  <div className="w-8 h-8 rounded-full bg-[#2a2a2e] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {token.logoURI ? (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = token.symbol.charAt(0);
                        }}
                      />
                    ) : (
                      <span className="text-xs text-gray-400 font-semibold">
                        {token.symbol.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{token.symbol}</p>
                    <p className="text-xs text-gray-400 truncate">{token.name}</p>
                  </div>

                  {/* Token Balance */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-white">
                      {parseFloat(token.balance) >= 0.000001
                        ? parseFloat(token.balance).toFixed(6)
                        : parseFloat(token.balance).toExponential(2)}
                    </p>
                    {token.priceUSD && (
                      <p className="text-xs text-gray-400">
                        ${(parseFloat(token.balance) * parseFloat(token.priceUSD)).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400 text-center py-2">
            No tokens to display
          </div>
        )}
      </div>

      {/* Connect/Disconnect Button - Fixed */}
      <div className="flex-shrink-0 p-4 pt-3">
        <Button
          className="glow-border relative overflow-hidden w-full
         bg-[#1d1d20] hover:bg-[#1a142a]
         text-white rounded-lg py-2 text-sm
         shadow-md transition-all duration-300"
          onClick={handleClick}
        >
          {address && user ? "Disconnect" : "Connect"}
        </Button>
      </div>
    </div>
  );
};
