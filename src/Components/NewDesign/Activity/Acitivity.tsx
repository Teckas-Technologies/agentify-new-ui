
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from '@/Components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/Components/ui/table";
import { 
  ArrowLeftRight, 
  Layers, 
  ShieldPlus, 
  Gift, 
  DollarSign, 
  LogOut,
  ArrowRightLeft,
  Clock,
  Filter,
  ExternalLink
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";
import { Input } from "@/Components/ui/input";
import { useState } from "react";
import Navbar from '../Navbar/Navbar';

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

export const transactionLogsData = [
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
const ActivityPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredTransactions = transactionLogsData.filter(tx => 
    tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.chain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="p-6">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Activity</h1>
            <Button variant="outline" onClick={() => window.history.back()}>
              Back to Dashboard
            </Button>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <Card className="neumorphic border-none">
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Gas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">TX Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="bg-primary/10 p-1 rounded-full mr-2 text-primary">
                            {getTransactionIcon(tx.type)}
                          </span>
                          <span className="capitalize">{tx.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>{tx.chain}</TableCell>
                      <TableCell>{format(new Date(tx.time), "MMM d, h:mm a")}</TableCell>
                      <TableCell>{tx.amount}</TableCell>
                      <TableCell>{tx.gas}</TableCell>
                      <TableCell>
                        <StatusBadge status={tx.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, "_blank")}
                        >
                          {tx.hash.slice(0, 6)}...
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;