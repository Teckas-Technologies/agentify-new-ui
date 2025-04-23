export enum MarketType {
    EthereumCore = "EthereumCore",
    // EthereumPrime = "EthereumPrime",
    EthereumEtherFi = "EthereumEtherFi",
    Polygon = "Polygon",
    Avalanche = "Avalanche",
    Arbitrum = "Arbitrum",
    Optimism = "Optimism",
    // Harmony = "Harmony",
    // Fantom = "Fantom",
    // Metis = "Metis",
    Base = "Base",
    Gnosis = "Gnosis",
    Scroll = "Scroll",
    BNB = "BNB",
    ZKsync = "ZKsync",
    Linea = "Linea",
    // Celo = "Celo",
    Sepolia = "Sepolia"
}

export type Agent = {
    agentId: string;
    name: string;
    description: string;
    tags: string[];
    is_favourite: boolean;
    is_hidden: boolean;
};
