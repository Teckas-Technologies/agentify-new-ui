// Updated TransactionLogs.tsx

import React from "react";
import {
  ArrowLeftRight,
  Layers,
  ShieldPlus,
  Gift,
  DollarSign,
  LogOut,
  ArrowRightLeft,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "../StatusBadge/StatusBadge";

interface Transaction {
  _id: string;
  user_id: string;
  agent_id: string;
  transaction_type: string;
  description: string;
  chain: string;
  time: string;
  crypto: string;
  amount: number;
  transaction_hash: string;
  explorer_url: string;
  status: string;
  amountUSD: number;
  gasUSD: number;
  agent_name: string;
}

interface Props {
  transactions: Transaction[];
}

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
const normalizeStatus = (status: string): "success" | "failed" | "pending" => {
  switch (status.toLowerCase()) {
    case "success":
      return "success";
    case "failed":
      return "failed";
    case "pending":
      return "pending";
    default:
      return "pending"; // fallback
  }
};

export const TransactionLogs: React.FC<Props> = ({ transactions }) => {
  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div
          key={tx._id}
          className="flex items-center justify-between p-3 bg-card hover:bg-accent/10 rounded-md transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
              {getTransactionIcon(tx.transaction_type)}
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
            <span className="text-sm font-medium">
              {tx.amount} {tx.crypto}
            </span>
            <StatusBadge status={normalizeStatus(tx.status)} />
          </div>
        </div>
      ))}
    </div>
  );
};
