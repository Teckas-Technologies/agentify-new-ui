// context/Web3Provider.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  WagmiProvider,
  createConfig,
  http,
  Config,
} from "wagmi";
import { mainnet, sepolia, polygon } from "wagmi/chains";
import { coinbaseWallet, walletConnect, injected } from "wagmi/connectors";
import Web3AuthConnectorInstance from "./Web3authContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
}

export default function Web3Provider({ children }: Props) {
  const [wagmiConfig, setWagmiConfig] = useState<Config | null>(null);

  useEffect(() => {
    const init = async () => {
      const web3AuthConnector = await Web3AuthConnectorInstance([
        mainnet,
        sepolia,
        polygon,
      ]);

      const config = createConfig({
        chains: [mainnet, sepolia, polygon],
        transports: {
          [mainnet.id]: http(),
          [sepolia.id]: http(),
          [polygon.id]: http(),
        },
        connectors: [
          injected(),
          walletConnect({
            projectId: "3314f39613059cb687432d249f1658d2", // replace with actual ID
            showQrModal: true,
          }),
          coinbaseWallet({ appName: "YourApp" }),
          web3AuthConnector, // ✅ Add Web3Auth connector
        ],
      });

      setWagmiConfig(config);
    };

    init();
  }, []);

  if (!wagmiConfig) return <div></div>;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
