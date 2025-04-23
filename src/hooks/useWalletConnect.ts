
import { usePrivy } from '@privy-io/react-auth';
import { useCallback } from 'react';
import { useDisconnect } from 'wagmi';


export function useWalletConnect() {
    const { disconnect } = useDisconnect();
    const { user, login, logout, connectWallet } = usePrivy();

    const handleWalletConnect = useCallback(() => {
        if (!user) {
            login();
        } else {
            connectWallet();
        }
    }, [user, login, connectWallet]);

    const disconnectAll = () => {
        logout();
        disconnect();
    }

    return { handleWalletConnect, disconnectAll };
}