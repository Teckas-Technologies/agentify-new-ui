import { wagmiConfig } from "@/contexts/CustomWagmiProvider";
import { ChainId } from "@/types/types";
import { switchChain } from "@wagmi/core";

export const switchNetwork = async (chainId: number) => {
    try {
        const chain = await switchChain(wagmiConfig, {
            chainId: chainId as ChainId,
        });
    } catch (error) {
        console.error("Failed to switch network", error);
    }
};