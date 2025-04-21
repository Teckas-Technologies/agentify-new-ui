// import { EVM, createConfig } from '@lifi/sdk';
// import { getWalletClient, switchChain } from '@wagmi/core';
// import { wagmiAdapter } from './wagmiAdapter';

// // Create LI.FI SDK Configuration with Wagmi
// createConfig({
//     integrator: 'Agentify',
//     providers: [
//         EVM({
//             getWalletClient: () => getWalletClient(wagmiAdapter.wagmiConfig),
//             switchChain: async (chainId) => {
//                 const chain = await switchChain(wagmiAdapter.wagmiConfig, { chainId });
//                 return getWalletClient(wagmiAdapter.wagmiConfig, { chainId: chain.id });
//             },
//         }),
//     ],
// });
