import { NavigationMenuViewportProps } from "@radix-ui/react-navigation-menu";

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
    role: "ai" | "human";
    message: string;
    txHash?: string;
}

export type TransactionType = "SWAP" | "BRIDGE" | "LEND" | "BORROW" | "REPAY" | "WITHDRAW";
export type TransactionStatus = "SUCCESS" | "FAILED" | "INITIATED";

export interface RequestFields {
    user_id: string;
    agent_id: string;
    transaction_type: TransactionType;
    description: string;
    chain: string;
    time: Date;
    crypto: string;
    amount: number;
    transaction_hash: string;
    explorer_url: string;
    status: TransactionStatus;
    amountUSD: number;
    gasUSD: number;
    agent_name: string;
}


export interface RequestFieldsv2 {
    user_id: string;
    agent_id: string;
    transaction_type: TransactionType;
    description: string;
    chain: string;
    time: Date;
    crypto: string;
    amount: number;
    transaction_hash: string;
    explorer_url: string;
    status: TransactionStatus;
    rpcUrl:string;
    symbol:string;
    decimal:number;
    agent_name: string;
}
