// 'use client';

// import { ReactNode } from 'react';
// import { createConfig, WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
// import { PrivyProvider } from '@privy-io/react-auth';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { http } from 'viem';
// import { mainnet, sepolia } from 'viem/chains';
// import { ChainType, EVM, config as lifiConfig, createConfig as createLifiConfig, getChains } from '@lifi/sdk';
// import { useQuery } from '@tanstack/react-query';
// import { getWalletClient, switchChain } from '@wagmi/core';

// // Define Wagmi Config via @privy-io/wagmi
// const wagmiConfig = createConfig({
//   chains: [mainnet, sepolia],
//   transports: {
//     [mainnet.id]: http(),
//     [sepolia.id]: http(),
//   },
// });

// // Configure LiFi SDK using the same wagmi config
// createLifiConfig({
//   integrator: 'Agentifytt',
//   providers: [
//     EVM({
//       getWalletClient: () => getWalletClient(wagmiConfig),
//       switchChain: async (chainId: number) => {
//         const validChainId = chainId as 1 | 11155111;
//         const chain = await switchChain(wagmiConfig, { chainId: validChainId });
//         return getWalletClient(wagmiConfig, { chainId: chain.id });
//       },
//     }),
//   ],
//   preloadChains: false,
// });

// const privyConfig = {
//     embeddedWallets: {
//       createOnLogin: 'users-without-wallets',
//       requireUserPasswordOnCreate: true,
//     },
//     loginMethods: [
//       'wallet',
//       'email',
//       'sms',
//       'google',
//     ] as Array<
//       'wallet' | 'email' | 'sms' | 'google' | 'twitter' | 'discord' | 'github' |
//       'linkedin' | 'spotify' | 'instagram' | 'tiktok' | 'apple' | 'farcaster' | 'telegram'
//     >,
//     appearance: {
//       showWalletLoginFirst: true,
//     },
//   };
  

// // ChainFetcher to update LiFi chains dynamically
// function ChainFetcher({ children }: { children: ReactNode }) {
//   useQuery({
//     queryKey: ['chains'],
//     queryFn: async () => {
//       const chains = await getChains({ chainTypes: [ChainType.EVM] });
//       console.log('Chains: ', chains);
//       lifiConfig.setChains(chains); // Update LiFi SDK dynamically
//       return chains;
//     },
//   });

//   return <>{children}</>;
// }

// const queryClient = new QueryClient();

// export default function UnifiedProvider({ children }: { children: ReactNode }) {
//   return (
//     <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string} config={privyConfig}>
//       <QueryClientProvider client={queryClient}>
//         <PrivyWagmiProvider config={wagmiConfig} reconnectOnMount={false}>
//           <ChainFetcher>{children}</ChainFetcher>
//         </PrivyWagmiProvider>
//       </QueryClientProvider>
//     </PrivyProvider>
//   );
// }
