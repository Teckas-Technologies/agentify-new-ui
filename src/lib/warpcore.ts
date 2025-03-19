import { chainMetadata, eclipsemainnet, eclipsemainnetAddresses, warpRouteConfigs, solanamainnet, solanamainnetAddresses, sonicsvm, sonicsvmAddresses } from "@hyperlane-xyz/registry";
import { ChainMap, ChainMetadata, MultiProtocolProvider, WarpCore } from "@hyperlane-xyz/sdk";
import { Address } from "viem";

const chains: ChainMap<ChainMetadata & { mailbox?: Address }> = {
    solanamainnet: {
        ...solanamainnet,
        rpcUrls: [
            { http: "https://mainnet.helius-rpc.com/?api-key=72355e0a-3db0-4c8b-98f6-426d805d5bb6" }
        ],
        mailbox: solanamainnetAddresses.mailbox as Address,
    },
    sonicsvm: {
        // ...chainMetadata.sonicsvm,
        ...sonicsvm,
        rpcUrls: [
            { http: "https://sonic.helius-rpc.com" }
        ],
        mailbox: sonicsvmAddresses.mailbox as Address
    },
};
const multiProvider = new MultiProtocolProvider(chains);
export const warpCore = WarpCore.FromConfig(multiProvider, {
    // tokens: warpRouteConfigs["SOL/solanamainnet-sonicsvm"].tokens,
    tokens: [
        ...warpRouteConfigs["SOL/solanamainnet-sonicsvm"].tokens,
        ...warpRouteConfigs["SONIC/solanamainnet-sonicsvm"].tokens,
        ...warpRouteConfigs["sonicSOL/solanamainnet-sonicsvm"].tokens,
        ...warpRouteConfigs["USDT/solanamainnet-sonicsvm"].tokens,
        ...warpRouteConfigs["USDC/solanamainnet-sonicsvm"].tokens,
        ...warpRouteConfigs["sSOL/solanamainnet-sonicsvm"].tokens,
        ...warpRouteConfigs["lrtsSOL/solanamainnet-sonicsvm"].tokens,
    ],
});