
import React from "react";
import { 
  ArrowLeftRight, 
  Layers, 
  ShieldPlus, 
  Gift, 
  DollarSign, 
  LogOut,
  ArrowRightLeft,
  Clock
} from "lucide-react";

import { format } from "date-fns";
import { StatusBadge } from "../../StatusBadge/StatusBadge";

const transactionLogsData = [
    {
      id: "tx-1",
      type: "swap",
      description: "Swapped 0.5 ETH to 942.32 USDC",
      chain: "Arbitrum",
      time: "2025-04-22T08:30:00",
      amount: "0.5 ETH",
      status: "success" as const,
      hash: "0x3a8d...b4e2",
      gas: "0.0015 ETH",
    },
    {
      id: "tx-2",
      type: "bridge",
      description: "Bridged 500 USDT from Ethereum to Optimism",
      chain: "Ethereum → Optimism",
      time: "2025-04-21T14:15:00",
      amount: "500 USDT",
      status: "success" as const,
      hash: "0x7c2e...9f01",
      gas: "0.0032 ETH",
    },
    {
      id: "tx-3",
      type: "lend",
      description: "Supplied 1000 USDC to Aave",
      chain: "Arbitrum",
      time: "2025-04-21T09:45:00",
      amount: "1000 USDC",
      status: "pending" as const,
      hash: "0x5d1a...2c18",
      gas: "0.0009 ETH",
    },
    {
      id: "tx-4",
      type: "swap",
      description: "Swapped 2000 USDC to 0.037 wBTC",
      chain: "Polygon",
      time: "2025-04-20T17:20:00",
      amount: "2000 USDC",
      status: "success" as const,
      hash: "0x91f4...8a76",
      gas: "0.0004 MATIC",
    },
    {
      id: "tx-5",
      type: "reward",
      description: "Claimed 23.5 OP tokens from staking",
      chain: "Optimism",
      time: "2025-04-20T11:35:00",
      amount: "23.5 OP",
      status: "failed" as const,
      hash: "0xe67b...3d92",
      gas: "0.0001 ETH",
    },
    {
      id: "tx-6",
      type: "borrow",
      description: "Borrowed 500 DAI against ETH collateral",
      chain: "Ethereum",
      time: "2025-04-19T13:50:00",
      amount: "500 DAI",
      status: "success" as const,
      hash: "0x2c8d...f7e4",
      gas: "0.0028 ETH",
    },
    {
      id: "tx-7",
      type: "swap",
      description: "Swapped 100 USDC to 100 BUSD",
      chain: "BSC",
      time: "2025-04-19T10:25:00",
      amount: "100 USDC",
      status: "success" as const,
      hash: "0x8a3f...c6b2",
      gas: "0.0003 BNB",
    },
    {
      id: "tx-8",
      type: "bridge",
      description: "Bridged 1.5 ETH from Ethereum to Arbitrum",
      chain: "Ethereum → Arbitrum",
      time: "2025-04-18T16:40:00",
      amount: "1.5 ETH",
      status: "success" as const,
      hash: "0xf19a...7e2d",
      gas: "0.0045 ETH",
    },
    {
      id: "tx-9",
      type: "stake",
      description: "Staked 50 MATIC in validator",
      chain: "Polygon",
      time: "2025-04-18T09:15:00",
      amount: "50 MATIC",
      status: "success" as const,
      hash: "0x4d7e...9c35",
      gas: "0.0006 MATIC",
    },
    {
      id: "tx-10",
      type: "withdraw",
      description: "Withdrew 500 USDC from Aave",
      chain: "Arbitrum",
      time: "2025-04-17T14:30:00",
      amount: "500 USDC",
      status: "pending" as const,
      hash: "0xb23a...5f81",
      gas: "0.0008 ETH",
    },
  ];
  
// Helper function to get the appropriate icon based on transaction type
const getTransactionIcon = (type: string) => {
  switch (type) {
    case "swap":
      return <ArrowLeftRight className="h-4 w-4" />;
    case "bridge":
      return <Layers className="h-4 w-4" />;
    case "lend":
      return <ShieldPlus className="h-4 w-4" />;
    case "reward":
      return <Gift className="h-4 w-4" />;
    case "borrow":
      return <DollarSign className="h-4 w-4" />;
    case "withdraw":
      return <LogOut className="h-4 w-4" />;
    case "stake":
      return <ArrowRightLeft className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export const TransactionLogs: React.FC<{ limit?: number }> = ({ limit = 5 }) => {
  // Get the most recent transactions up to the limit
  const transactions = transactionLogsData.slice(0, limit);

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between p-3 bg-card hover:bg-accent/10 rounded-md transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
              {getTransactionIcon(tx.type)}
            </div>
            <div>
              <h4 className="text-sm font-medium">{tx.description}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{tx.chain}</span>
                <span>•</span>
                <span>{format(new Date(tx.time), "MMM d, h:mm a")}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">{tx.amount}</span>
            <StatusBadge status={tx.status} />
          </div>
        </div>
      ))}
    </div>
  );
};
