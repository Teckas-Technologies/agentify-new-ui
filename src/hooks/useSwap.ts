import { useState, useEffect } from "react";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { useWeb3Auth } from "@/contexts/Web3authContext";

interface SwapParams {
  fromToken?: string;
  toToken?: string;
  fromValue?: string;
  toAddress?: string;
}

export const useSwap = () => {
  const { web3Auth } = useWeb3Auth(); // Use context to access web3Auth
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPlugin | null>(null);
  const [pluginConnected, setPluginConnected] = useState(false);

  useEffect(() => {
    const initializePlugin = async () => {
      if (!web3Auth || walletServicesPlugin) return;

      console.log("Waiting for web3Auth to initialize...");
      await web3Auth.initModal(); // Ensure Web3Auth is initialized

      if (!web3Auth.provider) {
        console.warn("Web3Auth is not initialized yet. Retrying...");
        return;
      }

      console.log("Web3Auth initialized. Adding WalletServicesPlugin...");
      const swapPlugin = new WalletServicesPlugin();
      web3Auth.addPlugin(swapPlugin);

      swapPlugin.on("connected", () => {
        console.log("WalletServicesPlugin connected!");
        setPluginConnected(true);
      });

      setWalletServicesPlugin(swapPlugin);
    };

    initializePlugin();
  }, [web3Auth, walletServicesPlugin]);

  const showSwapModal = async ({ fromToken, toToken, fromValue, toAddress }: SwapParams = {}) => {
    console.log("Attempting to show swap modal...");

    if (!walletServicesPlugin) {
      console.error("Wallet Services Plugin is not initialized.");
      setError("Wallet Services Plugin is not initialized.");
      return;
    }

    if (!pluginConnected) {
      console.warn("Wallet plugin is not connected yet.");
      setError("Wallet plugin is not connected yet. Please wait.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Showing swap modal...");

      await walletServicesPlugin.showSwap({
        show: true,
        fromToken,
        toToken,
        fromValue,
        toAddress,
      });

      console.log("Swap modal shown successfully.");
    } catch (err: any) {
      console.error("Swap failed:", err);
      if (err.message?.includes("User denied transaction")) {
        setError("User rejected the swap transaction.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return { showSwapModal, loading, error, pluginConnected };
};
