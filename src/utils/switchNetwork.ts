import { wagmiConfig } from "@/contexts/CustomWagmiProvider";
import { switchChain } from "@wagmi/core";

export const switchNetwork = async (chainId: number) => {
    try {
        const chain = await switchChain(wagmiConfig, {
            chainId,
        } as any);
        console.log("Switched to:", chain.name);
    } catch (error) {
        console.error("Failed to switch network", error);
    }
};