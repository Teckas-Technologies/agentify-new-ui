/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/Components/Dashboard/Dashboard";
import Navbar from "@/Components/Navbar/Navbar";
import Agents from "@/Components/BrowseAgents/Agents";
import Transaction from "@/Components/Transaction/Transaction";

const Page = () => {
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

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Sidebar Navbar */}
      <Navbar
        isCollapsed={isCollapsed}
        isMobileNavVisible={isMobileNavVisible}
        onMobileNavToggle={() => setIsMobileNavVisible(!isMobileNavVisible)}
      />
      <div className="flex-1 h-screen overflow-auto">
        <Transaction
          onToggle={() => setIsCollapsed((prev) => !prev)}
          onMobileNavToggle={() => setIsMobileNavVisible(!isMobileNavVisible)}
        />
      </div>
    </div>
  );
};

export default Page;