"use client";
import { useEffect, useState } from "react";
import InlineSVG from "react-inlinesvg";
import { MdKeyboardArrowRight } from "react-icons/md";
import { HiMenu } from "react-icons/hi";
import "./Transaction.css";
import { useTab } from "@/hooks/useTabHooks";
import { useTransactions } from "@/hooks/useTransactionsHook";
import { useAccount } from "wagmi";

interface Props {
  onToggle: () => void;
  onMobileNavToggle: () => void;
  initialTab: "Swap" | "Bridge" | "Lend" | "Borrow";
}

type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

interface Transaction {
  transaction_id: string;
  transaction_type: string;
  wallet_address: string;
  transaction_volume:string;
  agent_id: TransactionStatus;
  status: TransactionStatus;
  time?: string;
  user_id: string;
  explorer_link:string;
}

export default function Transaction({ onToggle, onMobileNavToggle, initialTab }: Props) {
  const [activeTab, setActiveTab] = useState<any>();
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [tabs, setTabs] = useState([]);
  const { address } = useAccount();
  const { loading, error, getTabs } = useTab();
  const { fetchTransactions } = useTransactions();

  const limit = 3;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [skip, setSkip] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTabs = async () => {
    const tabs = await getTabs();
    setTabs(tabs.data.agents);
    setActiveTab(tabs.data.agents[0]);
    fetchTrans(tabs.data.agents[0], 0, limit);
  };

  useEffect(() => {
    fetchTabs();
  }, []);

  const fetchTrans = async (agentId: any, skipVal: number, limitVal: number) => {
    const trans = await fetchTransactions(address, agentId, skipVal, limitVal);
    setTransactions(trans.data.data);
    setCurrentPage(trans.data.current_page - 1); 
    setTotalPages(trans.data.total_pages);
  };

  const handleTabClick = async (tab: any) => {
    setActiveTab(tab);
    setSkip(0);
    setCurrentPage(0);
    fetchTrans(tab, 0, limit);
    setShowMobileDropdown(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-500";
      case "PENDING":
        return "text-yellow-500";
      case "FAILED":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setSkip(newPage * limit);
      fetchTrans(activeTab, newPage * limit, limit);
    }
  };

  const handleNext = () => {
    if (currentPage + 1 < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setSkip(newPage * limit);
      fetchTrans(activeTab, newPage * limit, limit);
    }
  };

  return (
    <div className="relative flex flex-col items-center h-screen w-full bg-black">
      {/* Top Navigation */}
      <div className="top-nav p-4 flex items-center md:gap-5 gap-3 w-full bg-gray-900 border-b border-[#1E1E1E]">
        <button onClick={onToggle} className="focus:outline-none">
          <InlineSVG src="icons/Toggle.svg" className="w-5 h-5 cursor-pointer text-white" />
        </button>
        <div className="xxl:text-lg xl:text-base text-white font-semibold">TRANSACTIONS</div>
        <MdKeyboardArrowRight className="w-6 h-6 text-white" />
        <div className="md:flex hidden gap-4 text-sm font-medium">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`px-3 py-1 cursor-pointer rounded-md transition ${
                activeTab === tab ? "active-filter text-white" : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              {tab === "bridgeAgent"
                          ? "Bridge Assistant"
                          : tab === "swapAgent"
                            ? "Swap Assistant"
                            : tab === "lendingBorrowingAgent"
                              ? "Lend & Borrow Assistant"
                              : "Liquidity Assistant"}
            </button>
          ))}
        </div>
        <div className="ml-auto md:hidden">
          <button onClick={() => setShowMobileDropdown(!showMobileDropdown)} className="text-white">
            <HiMenu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {showMobileDropdown && (
        <div className="md:hidden w-full px-4 py-2 bg-gray-900 border-b border-[#1E1E1E]">
          <div className="flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeTab === tab ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
                }`}
              >
              {tab === "bridgeAgent"
              ? "Bridge Assistant"
              : tab === "swapAgent"
                ? "Swap Assistant"
                : tab === "lendingBorrowingAgent"
                  ? "Lend & Borrow Assistant"
                  : "Liquidity Assistant"} 
             </button>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="p-4 md:p-8 w-full flex-grow">
        <div className="bg-black p-4 md:p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex justify-between items-center pb-4">
            <h2 className="text-xl font-semibold text-white">  {activeTab === "bridgeAgent"
              ? "Bridge Assistant"
              : activeTab === "swapAgent"
                ? "Swap Assistant"
                : activeTab === "lendingBorrowingAgent"
                  ? "Lend & Borrow Assistant"
                  : "Liquidity Assistant"}  Transactions </h2>
          </div>

          <div className="w-full text-center max-h-[calc(100vh-220px)] overflow-y-auto sm:overflow-x-auto scroll-d">
            <div className="w-full min-w-[700px]">
              <table className="w-full rounded-lg overflow-hidden block md:table">
                <thead className="bg-gray-800 text-white text-sm">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">Txn Hash</th>
                    <th className="py-3 px-4 whitespace-nowrap">Type</th>
                    <th className="py-3 px-4 whitespace-nowrap">Txn Volume</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">Time</th>
                    <th className="py-3 px-4 whitespace-nowrap">View Txn</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-white">
                  {transactions.map((transaction) => (
                    <tr key={transaction.transaction_id} className="border-b border-[#2D2D2D]">
                      <td className="py-3 px-4 whitespace-nowrap">{transaction.transaction_id.substring(0, 8)}...</td>
                      <td className="py-3 px-4 whitespace-nowrap">{transaction.transaction_type}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{transaction.transaction_volume}</td>
                      <td className={`py-3 px-4 font-semibold whitespace-nowrap ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{formatDate(transaction.time)}</td>
                      <td className="flex justify-center py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                        <a
                          href={transaction.explorer_link}
                          className="approve-btn flex items-center justify-center gap-1 px-2 py-1 mt-1 min-w-[6rem] max-w-[7rem] bg-grey-700 rounded-3xl border-1 border-zinc-600 hover:border-zinc-400 cursor-pointer"
                        >
                          <h2 className="text-center dark:text-white text-sm">Check</h2>
                          <InlineSVG src="/icons/goto.svg" className="fill-current bg-transparent text-white w-2.5 h-2.8" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination-block flex justify-center items-center gap-3 my-5 pb-4">
        <button
          className={`text-white ${currentPage === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          disabled={currentPage === 0}
          onClick={handlePrevious}
        >
          &larr; Previous
        </button>

        <div className="numbers flex justify-center items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentPage(i);
                setSkip(i * limit);
                fetchTrans(activeTab, i * limit, limit);
              }}
              className={`number w-8 h-8 rounded-full flex items-center justify-center ${
                currentPage === i ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-600"
              }`}
            >
              <h2>{i}</h2>
            </button>
          ))}
        </div>

        <button
          className={`text-white ${currentPage + 1 >= totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          disabled={currentPage + 1 >= totalPages}
          onClick={handleNext}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
