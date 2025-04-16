"use client";
import { useState } from "react";
import InlineSVG from "react-inlinesvg";
import { MdKeyboardArrowRight } from "react-icons/md";

interface Props {
  onToggle: () => void;
  onMobileNavToggle: () => void;
}

type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

interface Transaction {
  transaction_id: string;
  user_id: string;
  wallet_address: string;
  agent_id: string;
  transaction_type: string;
  status: TransactionStatus;
  time?: string;
}

export default function Transaction({ onToggle, onMobileNavToggle }: Props) {
  const [activeTab, setActiveTab] = useState("All");
  
  // Dummy data based on TransactionCreate model
  const dummyTransactions: Transaction[] = [
    {
      transaction_id: "txn_123456789",
      user_id: "user_987654321",
      wallet_address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      agent_id: "agent_555555",
      transaction_type: "DEPOSIT",
      status: "COMPLETED",
      time: "2023-05-15T10:30:00Z"
    },
    {
      transaction_id: "txn_987654321",
      user_id: "user_123456789",
      wallet_address: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
      agent_id: "agent_444444",
      transaction_type: "WITHDRAWAL",
      status: "PENDING",
      time: "2023-05-16T14:45:00Z"
    },
    {
      transaction_id: "txn_555555555",
      user_id: "user_111111111",
      wallet_address: "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
      agent_id: "agent_333333",
      transaction_type: "TRANSFER",
      status: "FAILED",
      time: "2023-05-17T09:15:00Z"
    },
    {
      transaction_id: "txn_777777777",
      user_id: "user_222222222",
      wallet_address: "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB",
      agent_id: "agent_222222",
      transaction_type: "DEPOSIT",
      status: "COMPLETED",
      time: "2023-05-18T16:20:00Z"
    },
    {
      transaction_id: "txn_999999999",
      user_id: "user_333333333",
      wallet_address: "0x617F2E2fD72FD9D5503197092aC168c91465E7f2",
      agent_id: "agent_111111",
      transaction_type: "WITHDRAWAL",
      status: "COMPLETED",
      time: "2023-05-19T11:10:00Z"
    }
  ];

  const filteredTransactions = activeTab === "All" 
    ? dummyTransactions 
    : dummyTransactions.filter(txn => txn.transaction_type === activeTab.toUpperCase());

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case "COMPLETED": return "text-green-500";
      case "PENDING": return "text-yellow-500";
      case "FAILED": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="relative flex flex-col items-center h-screen w-full bg-black">
      {/* Top Navigation */}
      <div
        className="top-nav p-4 flex items-center md:gap-5 gap-3 w-full bg-black"
        style={{ fontFamily: "orbitron" }}
      >
        <button
          onClick={() => {
            onToggle();
            if (window.innerWidth < 768) {
              onMobileNavToggle();
            }
          }}
          className="focus:outline-none"
        >
          <InlineSVG
            src="icons/Toggle.svg"
            className="w-5 h-5 cursor-pointer text-[#21201C]"
          />
        </button>

        <div className="xxl:text-lg xl:text-base text-[#21201C] font-semibold">
          TRANSACTIONS
        </div>

        <MdKeyboardArrowRight className="w-6 h-6 text-[#21201C]" />

        {/* Tab Navigation */}
        <div className="flex gap-4 text-sm font-medium">
          {["All", "Deposit", "Withdrawal", "Transfer"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === tab
                  ? "bg-[#4dd092] text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-4 md:p-8 bg-gray-100 w-full flex-grow">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center pb-4">
            <h2 className="text-xl font-semibold">Transaction History</h2>
          </div>

          <div className="w-full text-center max-h-[calc(100vh-220px)] overflow-y-auto sm:overflow-x-auto scroll-d">
            <div className="w-full min-w-[700px]">
              <table className="w-full bg-white rounded-lg overflow-hidden block md:table">
                <thead className="bg-gray-100 text-gray-700 text-sm">
                  <tr>
                    <th className="py-2 md:px-4 px-1 whitespace-nowrap">Txn ID</th>
                    <th className="py-2 md:px-4 px-1 whitespace-nowrap">User ID</th>
                    <th className="py-2 md:px-4 px-1 whitespace-nowrap">Wallet Address</th>
                    <th className="py-2 md:px-4 px-1 whitespace-nowrap">Agent ID</th>
                    <th className="py-2 md:px-4 px-1 whitespace-nowrap">Type</th>
                    <th className="py-2 md:px-4 px-1 whitespace-nowrap">Status</th>
                    <th className="py-2 md:px-4 px-1 whitespace-nowrap">Time</th>
                  </tr>
                </thead>

                <tbody className="text-sm">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.transaction_id} className="border-b">
                      <td className="py-3 md:px-4 px-1 text-gray-700 whitespace-nowrap">
                        {transaction.transaction_id.substring(0, 8)}...
                      </td>
                      <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                        {transaction.user_id.substring(0, 8)}...
                      </td>
                      <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                        {transaction.wallet_address.substring(0, 6)}...{transaction.wallet_address.substring(38)}
                      </td>
                      <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                        {transaction.agent_id}
                      </td>
                      <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                        {transaction.transaction_type}
                      </td>
                      <td className={`py-3 md:px-4 px-1 font-semibold whitespace-nowrap ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </td>
                      <td className="py-3 md:px-4 px-1 whitespace-nowrap">
                        {formatDate(transaction.time)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}