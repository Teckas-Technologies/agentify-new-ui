'use client'

import { wagmiAdapter, projectId } from '@/config/wagmiAdapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, sepolia, polygon } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
    throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
    name: 'Agentify',
    description: 'Agentify',
    url: 'https://request-protocol-bot.vercel.app/', // origin must match your domain & subdomain
    icons: ['images/logo.png']
}

const networks = [mainnet, arbitrum, sepolia, polygon];

// Create the modal
const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [mainnet, arbitrum, polygon, sepolia],
    defaultNetwork: mainnet,
    metadata: metadata,
    allWallets: "SHOW",
    features: {
        analytics: true, // Optional - defaults to your Cloud configuration
        email: false,
        socials: [],
        allWallets: true,
        emailShowWallets: true,
        swaps: false,
    },
    featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
    ],
    excludeWalletIds: [
        'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393' // Phantom
    ],
    themeMode: "dark"
})

export const customSwitchNetwork = (targetChainId: string) => {
    const targetChain = networks.find((chain) => chain.id.toString() === targetChainId);

    if (targetChain) {
        // Dynamically switch to the target network
        modal.switchNetwork(targetChain);
        console.log(`Successfully switched to ${targetChain.name}`);
    } else {
        console.warn("Unsupported network selected.");
        return;
    }
}

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    )
}

export default ContextProvider