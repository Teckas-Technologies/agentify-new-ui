"use client";

import { ChainType, EVM, config, createConfig, getChains } from "@lifi/sdk";
// import { useSyncWagmiConfig } from '@lifi/wallet-management';
import { useQuery } from "@tanstack/react-query";
import { getWalletClient, switchChain } from "@wagmi/core";
import { ReactNode } from "react";
import { createClient, http } from "viem";
import {
  mainnet,
  bsc,
  arbitrum,
  base,
  blast,
  avalanche,
  polygon,
  scroll,
  optimism,
  linea,
  zksync,
  gnosis,
  fantom,
  moonriver,
  moonbeam,
  fuse,
  boba,
  mode,
  metis,
  lisk,
  unichain,
  aurora,
  sei,
  immutableZkEvm,
  sonic,
  gravity,
  taiko,
  soneium,
  cronos,
  fraxtal,
  abstract,
  rootstock,
  celo,
  worldchain,
  mantle,
  ink,
  berachain,
  kaia,
  sepolia,
} from "viem/chains";
import {
  WagmiProvider,
  createConfig as createWagmiConfig,
} from "@privy-io/wagmi";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyClientConfig, PrivyProvider } from "@privy-io/react-auth";
// List of Wagmi connectors
const connectors = [injected()];
const queryClient = new QueryClient();
// Create Wagmi config with default chain and without connectors
const supportedChains = [
  mainnet,
  bsc,
  arbitrum,
  base,
  blast,
  avalanche,
  polygon,
  scroll,
  optimism,
  linea,
  zksync,
  gnosis,
  fantom,
  moonriver,
  moonbeam,
  fuse,
  boba,
  mode,
  metis,
  lisk,
  unichain,
  aurora,
  sei,
  immutableZkEvm,
  sonic,
  gravity,
  taiko,
  soneium,
  cronos,
  fraxtal,
  abstract,
  rootstock,
  celo,
  worldchain,
  mantle,
  ink,
  berachain,
  kaia,
  sepolia,
]
export const wagmiConfig = createWagmiConfig({
  chains: [
    mainnet,
    bsc,
    arbitrum,
    base,
    blast,
    avalanche,
    polygon,
    scroll,
    optimism,
    linea,
    zksync,
    gnosis,
    fantom,
    moonriver,
    moonbeam,
    fuse,
    boba,
    mode,
    metis,
    lisk,
    unichain,
    aurora,
    sei,
    immutableZkEvm,
    sonic,
    gravity,
    taiko,
    soneium,
    cronos,
    fraxtal,
    abstract,
    rootstock,
    celo,
    worldchain,
    mantle,
    ink,
    berachain,
    kaia,
    sepolia,
  ],
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});
console.log("App Id --", process.env.NEXT_PUBLIC_PRIVY_APP_ID);

const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
    requireUserPasswordOnCreate: true,
  },
  defaultChain: mainnet,
  supportedChains: supportedChains,
  loginMethods: ["wallet", "email", "sms", "google"],
  appearance: {
    showWalletLoginFirst: false,
    landingHeader: 'Welcome to Agentify',
    // loginMessage: 'Sign in with your wallet or Google to swap, bridge tokens, or lend & borrow across chains with ease.',
    theme: "dark",
    accentColor: "#676FFF",
    logo: "https://gfxvsstorage.blob.core.windows.net/gfxvscontainer/agentify-logo.png",
  },
};
// Create SDK config using Wagmi actions and configuration
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
  // We disable chain preloading and will update chain configuration in runtime
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
    <PrivyProvider
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore

      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <ChainFetcher>{children}</ChainFetcher>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};
