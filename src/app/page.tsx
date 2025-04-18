"use client";

import { useState, useEffect } from "react";
// import Dashboard from "@/Components/Dashboard/Dashboard";
import Navbar from "@/Components/Navbar/Navbar";
import UserDashboard from "@/Components/UserDashboard/UserDashboard";
import UserDashboard2 from "@/Components/UserDashboard/UserDashboard2";

import dynamic from "next/dynamic";

const ClientLayout = dynamic(() => import("../Components/ClientLayout"), {
  ssr: false,
});

export default function Home() {
  // Load the initial state from localStorage
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
    <ClientLayout>
      <div className="h-screen flex overflow-hidden bg-white">
        {/* Sidebar Navbar */}
        <Navbar
          isCollapsed={isCollapsed}
          isMobileNavVisible={isMobileNavVisible}
          onMobileNavToggle={() => setIsMobileNavVisible(!isMobileNavVisible)}
        />

        {/* Main Dashboard */}
        <div className="flex-1 h-screen overflow-auto">
          <UserDashboard2
            onToggle={() => setIsCollapsed((prev) => !prev)}
            onMobileNavToggle={() => setIsMobileNavVisible(!isMobileNavVisible)}
          />
        </div>
      </div>
    </ClientLayout>
  );
}
