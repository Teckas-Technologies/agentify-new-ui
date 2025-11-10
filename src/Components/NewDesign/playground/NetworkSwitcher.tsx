"use client";

import { useState, useEffect } from "react";
import { useChainId, useAccount } from "wagmi";
import { X, ChevronDown, Check, Loader2 } from "lucide-react";
import { switchNetwork } from "@/utils/switchNetwork";
import { getChains, ExtendedChain } from "@lifi/sdk";

interface Network {
  chainId: number;
  name: string;
  logoURI: string;
  nativeToken: {
    symbol: string;
    decimals: number;
  };
}

export const NetworkSwitcher: React.FC = () => {
  const currentChainId = useChainId();
  const { isConnected } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch supported chains from LiFi SDK
  useEffect(() => {
    const fetchChains = async () => {
      try {
        setLoading(true);
        const chains = await getChains();

        // Map to our Network interface
        const mappedNetworks: Network[] = chains.map((chain: ExtendedChain) => ({
          chainId: chain.id,
          name: chain.name,
          logoURI: chain.logoURI || '',
          nativeToken: {
            symbol: chain.nativeToken.symbol,
            decimals: chain.nativeToken.decimals,
          },
        }));

        setNetworks(mappedNetworks);
      } catch (error) {
        console.error("Failed to fetch chains:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChains();
  }, []);

  const currentNetwork = networks.find((n) => n.chainId === currentChainId) || {
    chainId: currentChainId,
    name: "Unknown Network",
    logoURI: "",
    nativeToken: { symbol: "???", decimals: 18 },
  };

  const handleNetworkSwitch = async (chainId: number) => {
    if (chainId === currentChainId) {
      setIsModalOpen(false);
      return;
    }

    setSwitching(true);
    try {
      await switchNetwork(chainId);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
    } finally {
      setSwitching(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <>
      {/* Network Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={loading}
        className="w-full bg-[#18181B] hover:bg-[#1f1f23] rounded-lg p-3 flex items-center justify-between transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-800">
            {currentNetwork.logoURI ? (
              <img
                src={currentNetwork.logoURI}
                alt={currentNetwork.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xs text-gray-400">?</span>
            )}
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400">Network</p>
            <p className="text-sm font-medium text-white">{currentNetwork.name}</p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        )}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[#101014] border-t sm:border border-[#1d1d20] rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col animate-slide-up sm:animate-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-4 border-b border-[#1d1d20]">
              <h2 className="text-base sm:text-lg font-semibold text-white">Select Network</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Networks List */}
            <div className="overflow-y-auto flex-1 p-3 sm:p-2 custom-scroll">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : networks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>No networks available</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-1">
                  {networks.map((network) => {
                    const isActive = network.chainId === currentChainId;
                    return (
                      <button
                        key={network.chainId}
                        onClick={() => handleNetworkSwitch(network.chainId)}
                        disabled={switching}
                        className={`w-full p-4 sm:p-3 rounded-lg flex items-center justify-between transition-all active:scale-95 ${
                          isActive
                            ? "bg-[#1a142a] border border-purple-500/20"
                            : "bg-[#18181B] hover:bg-[#1f1f23] active:bg-[#1f1f23] border border-transparent"
                        } ${switching ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-800 flex-shrink-0">
                            {network.logoURI ? (
                              <img
                                src={network.logoURI}
                                alt={network.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = `<span class="text-xs text-gray-400">${network.name.charAt(0)}</span>`;
                                }}
                              />
                            ) : (
                              <span className="text-xs text-gray-400">{network.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{network.name}</p>
                            <p className="text-xs text-gray-400">
                              {network.nativeToken.symbol}
                            </p>
                          </div>
                        </div>
                        {isActive && <Check className="w-5 h-5 text-purple-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="p-4 border-t border-[#1d1d20] bg-[#0a0a0a]">
              <p className="text-xs text-gray-400 text-center">
                Switching networks will update your wallet connection
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
