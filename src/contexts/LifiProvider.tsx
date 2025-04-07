"use client";

import { ChainType, EVM, config, createConfig, getChains } from "@lifi/sdk";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { getWalletClient, switchChain } from "@wagmi/core";
import { ReactNode } from "react";
import { http } from "viem";
import {
  mainnet,
  polygon,
  sepolia,
} from "viem/chains";
import { WagmiProvider, createConfig as createWagmiConfig } from "wagmi";
import { coinbaseWallet, walletConnect, injected } from "wagmi/connectors";
import Web3AuthConnectorInstance from "./Web3authContext";

// Initialize outside component
const queryClient = new QueryClient();
const web3AuthConnector = await Web3AuthConnectorInstance([mainnet, sepolia, polygon]);

const wagmiConfig = createWagmiConfig({
  chains: [mainnet, sepolia, polygon],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId: "5bf8a3ccd6329b9fca26ed15efc8a3e3",
      showQrModal: true,
    }),
    coinbaseWallet({ appName: "YourApp" }),
    web3AuthConnector,
  ],
});

// Configure LiFi SDK
createConfig({
  integrator: "Agentifytt",
  providers: [
    EVM({
      getWalletClient: () => getWalletClient(wagmiConfig),
      switchChain: async (chainId: any) => {
        const chain = await switchChain(wagmiConfig, { chainId });
        return getWalletClient(wagmiConfig, { chainId: chain.id });
      },
    }),
  ],
  preloadChains: false,
});

function ChainFetcher({ children }: { children: ReactNode }) {
  useQuery({
    queryKey: ["chains"],
    queryFn: async () => {
      const chains = await getChains({ chainTypes: [ChainType.EVM] });
      console.log("Chains: ", chains);
      config.setChains(chains); // ✅ Dynamically update LiFi config
      return chains;
    },
  });

  return <>{children}</>;
}

export const CustomWagmiProvider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <ChainFetcher>{children}</ChainFetcher>
      </WagmiProvider>
    </QueryClientProvider>
  );
};
