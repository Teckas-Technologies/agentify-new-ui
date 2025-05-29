
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/Components/ui/pagination";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";
import { Input } from "@/Components/ui/input";
import { useEffect, useState } from "react";
import Navbar from '../Dashboard/Navbar/Navbar';
import { useTransactions } from "@/hooks/useTransactionsHook";
import { useAccount } from "wagmi";
import { LoadingSkeleton } from "@/Components/shared/LoadingSkeleton";
import { EmptyState } from "@/Components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { isNull } from "util";

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

const filterOptions = [
  { value: "", label: "All Activities" },
  { value: "SWAP", label: "Swaps" },
  { value: "BRIDGE", label: "Bridges" },
  { value: "LEND", label: "Lending" },
  { value: "REPAY", label: "Repay" },
  { value: "BORROW", label: "Borrowing" },
  { value: "WITHDRAW", label: "Withdrawals" }
];

const ActivityPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const {error,loading,fetchTransactions} = useTransactions();
  const [transactionData,setTransactionData] = useState<Transaction[]>([]);
  const [skip, setSkip] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState("");
  const limit = 5;
  const {address} = useAccount();
  const fetchTransactionData = async(skip: number,limit: number)=>{
    if(!address) return;
    const response = await fetchTransactions(searchQuery, skip, limit, filterType);
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

  const handleFilterChange = (value: string) => {
    setFilterType(value);
  };

  useEffect(() => {
    fetchTransactionData((currentPage - 1) * limit, limit);
  }, [filterType]);
  
  const getShortenedChainName = (chain: string) => {
    if (chain === "Ethereum Mainnet" || chain === "EthereumCore") {
      return "Ethereum";
    }
    return chain; // return the original name for other chains
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-background/50 border-white/10">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline-block">
                      {filterOptions.find(f => f.value === filterType)?.label || "All Activities"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-black/80 text-white backdrop-blur-md border border-white/10"
                >
                     {filterOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleFilterChange(option.value)}
                      className={`cursor-pointer ${
                        filterType === option.value ? "bg-primary/10 text-white" : ""
                      }`}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
         
          {/* Transactions Table */}
          <Card className="neumorphic border-none mb-16">
  
  {/* ✅ CHANGE p-0 → p-1 (small padding) */}
  <CardContent className="p-2"> 
    {loading ? (
      <LoadingSkeleton rows={5} />
    ) : filteredTransactions.length > 0 ? (
      <div className="w-full overflow-x-auto">
        
        {/* Table stays the same */}
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Type</TableHead>
              <TableHead className="w-[250px]">Description</TableHead>
              <TableHead className="w-[120px]">Chain</TableHead>
              <TableHead className="w-[200px]">Time</TableHead>
              <TableHead className="w-[150px]">Amount</TableHead>
              <TableHead className="w-[150px]">Gas</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[150px]">TX Hash</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx._id}>
                <TableCell className="w-[180px]">
                  <div className="flex items-center">
                    <span className="bg-primary/10 p-1 rounded-full mr-2 text-primary">
                      {getTransactionIcon(tx.transaction_type.toLowerCase())}
                    </span>
                    <span className="capitalize">{tx.transaction_type}</span>
                  </div>
                </TableCell>
                <TableCell className="w-[250px]">{tx.description}</TableCell>
                <TableCell className="w-[120px]"> {tx.chain}</TableCell>
                <TableCell className="w-[200px]">{format(new Date(tx.time), "MMM d, h:mm a")}</TableCell>
                <TableCell className="w-[150px]">{tx.amount}</TableCell>
                <TableCell className="w-[150px]">{tx.gasUSD}</TableCell>
                <TableCell className="w-[120px]">
                  <StatusBadge status={mapStatus(tx.status)} />
                </TableCell>
                <TableCell className="w-[150px]">
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
      </div>
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
  <div className="fixed bottom-0 left-0 w-full bg-black bg-opacity-20 backdrop-blur-sm py-4 flex justify-center items-center z-50">
    <Pagination>
      <PaginationContent>
        {/* Previous Button */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={() => {
              if (currentPage > 1) {
                handlePrevious();
              }
            }}
            className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "hover:bg-accent/80"}
            size="sm"
          />
        </PaginationItem>

        {/* Page Numbers with Ellipsis */}
        {(() => {
          const items = [];
          const maxVisiblePages = 5; // Max number of visible pages
          const totalPageCount = totalPages;

          items.push(
            <PaginationItem key={1}>
              <PaginationLink
                href="#"
                isActive={currentPage === 1}
                onClick={() => {
                  setCurrentPage(1);
                  const newSkip = 0;
                  setSkip(newSkip);
                  fetchTransactionData(newSkip, limit);
                }}
                className="min-w-[40px]"
              >
                1
              </PaginationLink>
            </PaginationItem>
          );

          if (totalPageCount <= maxVisiblePages) {
            for (let i = 2; i <= totalPageCount; i++) {
              items.push(
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === i}
                    onClick={() => {
                      setCurrentPage(i);
                      const newSkip = (i - 1) * limit;
                      setSkip(newSkip);
                      fetchTransactionData(newSkip, limit);
                    }}
                    className="min-w-[40px]"
                  >
                    {i}
                  </PaginationLink>
                </PaginationItem>
              );
            }
          } else {
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPageCount - 1, currentPage + 1);

            if (currentPage <= 3) {
              startPage = 2;
              endPage = 4;
            } else if (currentPage >= totalPageCount - 2) {
              startPage = totalPageCount - 3;
              endPage = totalPageCount - 1;
            }

            if (startPage > 2) {
              items.push(
                <PaginationItem key="ellipsis-start">
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            for (let i = startPage; i <= endPage; i++) {
              items.push(
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === i}
                    onClick={() => {
                      setCurrentPage(i);
                      const newSkip = (i - 1) * limit;
                      setSkip(newSkip);
                      fetchTransactionData(newSkip, limit);
                    }}
                    className="min-w-[40px]"
                  >
                    {i}
                  </PaginationLink>
                </PaginationItem>
              );
            }

            if (endPage < totalPageCount - 1) {
              items.push(
                <PaginationItem key="ellipsis-end">
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            items.push(
              <PaginationItem key={totalPageCount}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === totalPageCount}
                  onClick={() => {
                    setCurrentPage(totalPageCount);
                    const newSkip = (totalPageCount - 1) * limit;
                    setSkip(newSkip);
                    fetchTransactionData(newSkip, limit);
                  }}
                  className="min-w-[40px]"
                >
                  {totalPageCount}
                </PaginationLink>
              </PaginationItem>
            );
          }

          return items;
        })()}

        {/* Next Button */}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={() => {
              if (currentPage < totalPages) {
                handleNext();
              }
            }}
            className={currentPage >= totalPages ? "cursor-not-allowed opacity-50" : "hover:bg-accent/80"}
            size="sm"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>
)}


      </div>
  );
};

export default ActivityPage;