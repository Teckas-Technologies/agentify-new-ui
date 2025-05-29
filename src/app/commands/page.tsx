"use client";
import CommandsPage from "@/Components/NewDesign/Commands/Commands";
import Navbar from "@/Components/NewDesign/Dashboard/Navbar/Navbar";
import { PYTHON_SERVER_URL } from "@/config/constants";
import React from "react";
import { useAccount } from "wagmi";

export default function Page() {
  const { address } = useAccount();
  //   let commands = [];
  //   if (address) {
  //     const query = new URLSearchParams({ user_id: address });

  //     const endpoints = {
  //       commands: `${PYTHON_SERVER_URL}/api/dashboard/stats?${query.toString()}`,
  //     };

  //     try {
  //       const [commandsRes] = await Promise.all([
  //         fetch(endpoints.commands, { cache: "no-store" }),
  //       ]);

  //       const [commandsData] = await Promise.all([commandsRes.json()]);

  //       commands = commandsData.data || [];
  //     } catch (error) {
  //       console.error("Failed to fetch dashboard data:", error);
  //     }
  //   }
  return (
    <main className="min-h-screen bg-[var(--bg-dark)] text-white">
    {/* <Navbar/> */}
      <CommandsPage />
    </main>
  );
}
