'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

const solanaConnectors = toSolanaWalletConnectors({
  // By default, shouldAutoConnect is enabled
  shouldAutoConnect: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cm88qnp8y0007xnrcqokhbn5f"
      config={{
        // Customize Privy's appearance in your app
        appearance: {
          landingHeader: "Sonic SVM Agents",
          loginMessage: "Use agents on top of Sonic SVM",
          theme: 'dark',
          accentColor: '#676FFF',
          logo: 'images/sonic-logo.png',
          walletChainType: 'solana-only',
          walletList: ['bybit_wallet', 'backpack', 'phantom', 'okx_wallet',], 
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}