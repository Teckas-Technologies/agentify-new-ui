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
import { StatusBadge } from "../StatusBadge/StatusBadge";
import { format } from "date-fns";
import { parseISO } from "date-fns"; // from date-fns
import { formatInTimeZone } from "date-fns-tz"; // from date-fns-tz
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
  // Utility function to convert UTC to IST
  // const convertToIST = (time: string) => {
  //   const utcDate = new Date(time.endsWith("Z") ? time : `${time}Z`);
  //   return utcDate.toLocaleString("en-US", {
  //     timeZone: "Asia/Kolkata",
  //     hour: "numeric",
  //     minute: "numeric",
  //     hour12: true,
  //     day: "numeric",
  //     month: "short",
  //   });
  // };

    const getShortenedChainName = (chain: string) => {
      if (chain === "Ethereum Mainnet" || chain === "EthereumCore") {
        return "Ethereum";
      }
      return chain; // return the original name for other chains
    };
  return (
    <div className="space-y-4">
      {[...transactions].map((tx) => (
        <div
          key={tx._id}
          className="flex items-center justify-between md:p-3 md:pb-3 pb-2 bg-card hover:bg-accent/10 rounded-md transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
              {getTransactionIcon(tx.transaction_type)}
            </div>
            <div>
              {/* For mobile (smaller screens) */}
              <h4 className="text-sm font-medium max-w-[180px] truncate block md:hidden">
                {tx.description.length > 15
                  ? `${tx.description.slice(0, 15)}...`
                  : tx.description}
              </h4>

              {/* For md and larger screens */}
              <h4 className="text-sm font-medium max-w-[180px] truncate hidden md:block">
                {tx.description.length > 20
                  ? `${tx.description.slice(0, 20)}...`
                  : tx.description}
              </h4>

              <div className="flex items-center md:gap-2 gap-1 text-xs text-muted-foreground">
              <span>{tx.chain}</span>
                <span>•</span>
                <span>{format(new Date(tx.time), "MMM d, h:mm a")}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium">
              {tx.amount} {tx.crypto}
            </span>
            <StatusBadge status={normalizeStatus(tx.status)} />
          </div>
        </div>
      ))}
    </div>
  );
};
