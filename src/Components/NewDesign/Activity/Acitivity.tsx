
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
import { useEffect, useState } from "react";
import Navbar from '../Dashboard/Navbar/Navbar';
import { useTransactions } from "@/hooks/useTransactionsHook";
import { useAccount } from "wagmi";
import { LoadingSkeleton } from "@/Components/shared/LoadingSkeleton";
import { EmptyState } from "@/Components/shared/EmptyState";

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

export interface Transaction {
  _id:string;
  user_id: string;
  agent_id: string;
  transaction_type: string;
  description: string;
  chain: string;
  time: Date;
  crypto: string;
  amount: number;
  transaction_hash: string;
  explorer_url: string;
  status: string;
  amountUSD: number;
  gasUSD: number;
  agent_name: string;
}

type StatusType = "success" | "pending" | "failed";

const ActivityPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const {error,loading,fetchTransactions} = useTransactions();
  const [transactionData,setTransactionData] = useState<Transaction[]>([]);
  const [skip, setSkip] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 8;
  const {address} = useAccount();
  const fetchTransactionData = async(skip:any,limit:any)=>{
    const response = await fetchTransactions(address,searchQuery,skip,limit);
    console.log("API Response:", response);
    setTransactionData(response.data.data);
    setCurrentPage(response.data.currentPage); 
    setTotalPages(response.data.totalPages);
  }

  useEffect(()=>{
    fetchTransactionData((currentPage - 1) * limit, limit);
  },[address]);

  useEffect(()=>{
    fetchTransactionData((currentPage - 1) * limit, limit);
  },[searchQuery]);

  const filteredTransactions = transactionData.filter(tx => 
    tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.transaction_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.chain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mapStatus = (status: string): StatusType => {
    const lower = status.toLowerCase();
    if (lower === "success" || lower === "pending" || lower === "failed") {
      return lower;
    }
    return "pending"; 
  };
  
  const handlePrevious = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      const newSkip = (newPage - 1) * limit;
      setSkip(newSkip);
      fetchTransactionData(newSkip, limit);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      const newSkip = (newPage - 1) * limit;
      setSkip(newSkip);
      fetchTransactionData(newSkip, limit);
    }
  };

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
          <Card className="neumorphic border-none mb-16">
            <CardContent>
            {loading ? (
                <LoadingSkeleton rows={5} />
              ) : filteredTransactions.length > 0 ? (
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
                    <TableRow key={tx._id}>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="bg-primary/10 p-1 rounded-full mr-2 text-primary">
                            {getTransactionIcon(tx.transaction_type.toLowerCase())}
                          </span>
                          <span className="capitalize">{tx.transaction_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>{tx.chain}</TableCell>
                      <TableCell>{format(new Date(tx.time), "MMM d, h:mm a")}</TableCell>
                      <TableCell>{tx.amount}</TableCell>
                      <TableCell>{tx.gasUSD}</TableCell>
                      <TableCell>
                      <StatusBadge status={mapStatus(tx.status)} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => window.open(`${tx.explorer_url}`, "_blank")}
                        >
                          {tx.transaction_hash.slice(0, 6)}...
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                 ) : (
                  <EmptyState 
                    title="No transactions yet" 
                    description="Start exploring and performing transactions to see your activity here." 
                  />
                )}
            </CardContent>
          </Card>
        </div>
      </div>
      {filteredTransactions.length > 0 && (
      <div className="pagination-block fixed bottom-0 left-0 w-full bg-black bg-opacity-20 backdrop-blur-sm py-4 flex justify-center items-center gap-3 z-50">
      <button
          className={`text-white ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          disabled={currentPage === 1}
          onClick={handlePrevious}
        >
          &larr; Previous
        </button>

        <div className="numbers flex justify-center items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={i}
                onClick={() => {
                  setCurrentPage(pageNum);
                  const newSkip = (pageNum - 1) * limit;
                  setSkip(newSkip);
                  fetchTransactionData(newSkip, limit);
                }}
                className={`number w-8 h-8 rounded-full flex items-center justify-center ${
                  currentPage === pageNum ? "bg-violet-900 text-white" : "text-gray-400 hover:bg-violet-600"
                }`}
              >
                <h2>{pageNum}</h2>
              </button>
            );
          })}
        </div>

        <button
          className={`text-white ${currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          disabled={currentPage >= totalPages}
          onClick={handleNext}
        >
          Next &rarr;
        </button>
      </div>
      )}
      </div>
  );
};

export default ActivityPage;