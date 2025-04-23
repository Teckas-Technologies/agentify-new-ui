// app/[transaction]/page.tsx
"use client";

import Navbar from "@/Components/NewDesign/Dashboard/Navbar/Navbar";
import Transaction from "@/Components/Transaction/Transaction";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ClientLayout = dynamic(() => import("../../Components/ClientLayout"), {
  ssr: false,
});

const TransactionsPage = () => {
  const params = useParams(); // Extract the dynamic [transaction] path parameter
  const searchParams = useSearchParams(); // Extract the query parameters like agentName

  const id = params?.transaction; // Extract dynamic ID from the route (the [transaction] part)
  const agentName = searchParams?.get("agentName"); // Extract agentName query parameter

  // Debugging
  console.log("ID:", id); // Ensure this prints the correct ID from the URL
  console.log("Agent Name:", agentName); // Ensure this prints the agentName query parameter

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("isCollapsed") || "false");
    }
    return false;
  });

  const [isMobileNavVisible, setIsMobileNavVisible] = useState(false);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("isCollapsed", JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  const agentToTabMap: Record<string, "Swap" | "Bridge" | "Lend" | "Borrow"> = {
    "Swap Agent": "Swap",
    "Bridge Agent": "Bridge",
    "Lending Agent": "Lend",
    "Borrow Agent": "Borrow",
  };

  const initialTab = agentToTabMap[agentName || ""] || "Swap";
  console.log("Tab---", initialTab);

  return (
    <ClientLayout>
      <div className="h-screen flex overflow-hidden bg-black">
        {/* Sidebar Navbar */}
        <Navbar
          isCollapsed={isCollapsed}
          isMobileNavVisible={isMobileNavVisible}
          onMobileNavToggle={() => setIsMobileNavVisible(!isMobileNavVisible)}
        />
        <div className="flex-1 h-screen overflow-auto">
          <Transaction
            initialTab={initialTab}
            onToggle={() => setIsCollapsed((prev) => !prev)}
            onMobileNavToggle={() => setIsMobileNavVisible(!isMobileNavVisible)}
          />
        </div>
      </div>
    </ClientLayout>
  );
};

export default TransactionsPage;
