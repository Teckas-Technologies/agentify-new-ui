'use client';

import { ReactNode, useEffect, useState } from 'react';
import {
  WagmiProvider,
  createConfig as createWagmiConfig,
  http,
  Config,
} from 'wagmi';
import {
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  base,
  bsc,
  blast,
  avalanche,
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
} from "wagmi/chains";

import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import Web3AuthConnectorInstance from './Web3authContext';

import {
  ChainType,
  EVM,
  config as lifiConfig,
  createConfig as createLifiConfig,
  getChains,
} from '@lifi/sdk';
import { getWalletClient, switchChain } from '@wagmi/core';
import { Chain, createClient } from 'viem';

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
}

function InnerWeb3Provider({ children }: Props) {
  const [wagmiConfig, setWagmiConfig] = useState<Config | null>(null);

  // Fetch dynamic chains from LiFi
  const { data: dynamicChains } = useQuery({
    queryKey: ['chains'],
    queryFn: async () => {
      const chains = await getChains({ chainTypes: [ChainType.EVM] });
      lifiConfig.setChains(chains);
      return chains;
    },
  });

  useEffect(() => {
    const init = async () => {
      const supportedChains = [
        mainnet,
        sepolia,
        polygon,
        arbitrum,
        base,
        bsc,
        blast,
        avalanche,
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
      ] as const satisfies [Chain, ...Chain[]];

      const web3AuthConnector = await Web3AuthConnectorInstance(supportedChains);

      const config = createWagmiConfig({
        chains: supportedChains,
        connectors: [
          injected(),
          walletConnect({
            projectId: '3314f39613059cb687432d249f1658d2',
            showQrModal: true,
          }),
          coinbaseWallet({ appName: 'YourApp' }),
          web3AuthConnector,
        ],
        client({ chain }) {
          return createClient({ chain, transport: http() });
        },
      });

      // Configure LiFi SDK
      createLifiConfig({
        integrator: 'Agentifytt',
        providers: [
          EVM({
            getWalletClient: () => getWalletClient(config),
            switchChain: async (chainId: number) => {
              const chain = await switchChain(config, {
                chainId: chainId as (typeof supportedChains[number])['id'],
              });
              return getWalletClient(config, { chainId: chain.id });
            }
            
          }),
        ],
        preloadChains: false,
      });

      setWagmiConfig(config);
    };

    if (dynamicChains) init();
  }, [dynamicChains]);

  if (!wagmiConfig) return <div />;

  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
}

export default function UnifiedWeb3Provider({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerWeb3Provider>{children}</InnerWeb3Provider>
    </QueryClientProvider>
  );
}
