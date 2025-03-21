"use client";

import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, sepolia } from '@reown/appkit/networks';
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { PROJECT_ID } from "./constants";

export const projectId = PROJECT_ID;

if (!projectId) {
    throw new Error("Project ID is not defined!")
}

export const getProvider = async () => {
    return await EthereumProvider.init({
        projectId: PROJECT_ID,
        metadata: {
            name: 'Agentify',
            description: 'Agentify',
            url: 'https://mywebsite.com', // origin must match your domain & subdomain
            icons: ['https://avatars.githubusercontent.com/u/37784886']
        },
        showQrModal: true,
        optionalChains: [1, 137, 2020],
    })
}

export const networks = [mainnet, arbitrum, sepolia]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
    projectId,
    networks
})

export const config = wagmiAdapter.wagmiConfig