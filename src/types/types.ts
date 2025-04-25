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

export type Message = {
    role: "ai" | "human" | "tool";
    message: string;
    txHash?: string;
}

export type RequestFields = {
    transaction_id: string;
    user_id: string;
    wallet_address: string;
    agent_id: string;
    transaction_type: string;
    status: string;
    transaction_volume: string;
    explorer_link: string;

}
