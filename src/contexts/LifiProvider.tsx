'use client'

import { ChainType, EVM, config, createConfig, getChains } from '@lifi/sdk';
// import { useSyncWagmiConfig } from '@lifi/wallet-management';
import { useQuery } from '@tanstack/react-query';
import { getWalletClient, switchChain } from '@wagmi/core';
import { ReactNode } from 'react';
import { createClient, http } from 'viem';
import { mainnet, bsc, arbitrum, base, blast, avalanche, polygon, scroll, optimism, linea, zksync, gnosis, fantom, moonriver, moonbeam, fuse, boba, mode, metis, lisk, unichain, aurora, sei, immutableZkEvm, sonic, gravity, taiko, soneium, cronos, fraxtal, abstract, rootstock, celo, worldchain, mantle, ink, berachain, kaia, sepolia } from 'viem/chains';
import { WagmiProvider, createConfig as createWagmiConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

// List of Wagmi connectors
const connectors = [injected()];

// Create Wagmi config with default chain and without connectors
const wagmiConfig = createWagmiConfig({
    chains: [mainnet, bsc, arbitrum, base, blast, avalanche, polygon, scroll, optimism, linea, zksync, gnosis, fantom, moonriver, moonbeam, fuse, boba, mode, metis, lisk, unichain, aurora, sei, immutableZkEvm, sonic, gravity, taiko, soneium, cronos, fraxtal, abstract, rootstock, celo, worldchain, mantle, ink, berachain, kaia, sepolia],
    client({ chain }) {
        return createClient({ chain, transport: http() });
    },
});

// Create SDK config using Wagmi actions and configuration
createConfig({
    integrator: 'Agentifytt',
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

export const CustomWagmiProvider = ({ children }: { children: ReactNode }) => {
    // Load EVM chains from LI.FI API using getChains action from LI.FI SDK
    const { data: chains } = useQuery({
        queryKey: ['chains'],
        queryFn: async () => {
            const chains = await getChains({
                chainTypes: [ChainType.EVM],
            });
            console.log("Chains: ", chains)
            // Update chain configuration for LI.FI SDK
            config.setChains(chains);
            return chains;
        },
    });

    // Synchronize fetched chains with Wagmi config and update connectors
    //   useSyncWagmiConfig(wagmiConfig, connectors, chains);

    return (
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
            {children}
        </WagmiProvider>
    );
};
