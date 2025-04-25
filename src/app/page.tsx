"use client";
import Dashboard from "@/Components/NewDesign/Dashboard/Dashboard";
import { PYTHON_SERVER_URL } from "@/config/constants";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function Page() {
  const { address } = useAccount();

  // let stats = [];
  // let chainActivity = [];
  // let gasDetails = [];
  // let agentUsage = [];
  // let recentActivity = [];
  // let savedCommands = [];
  // let transactionLogs = [];
  // if (address) {
  //   const query = new URLSearchParams({ user_id: address });

  //   const endpoints = {
  //     stats: `${PYTHON_SERVER_URL}/api/dashboard/stats?${query.toString()}`,
  //     chainActivity: `${PYTHON_SERVER_URL}/api/dashboard/chainActivity?${query.toString()}`,
  //     gasDetails: `${PYTHON_SERVER_URL}/api/dashboard/gasDetails?${query.toString()}`,
  //     agentUsage: `${PYTHON_SERVER_URL}/api/dashboard/agentUsage?${query.toString()}`,
  //     recentActivity: `${PYTHON_SERVER_URL}/api/transactions/?${query.toString()}`,
  //     savedCommands: `${PYTHON_SERVER_URL}/api/agentCommands/?${query.toString()}`,
  //     transactionLogs: `${PYTHON_SERVER_URL}/api/transactions/?${query.toString()}`,
  //   };

  //   try {
  //     const [
  //       statsRes,
  //       chainActivityRes,
  //       gasDetailsRes,
  //       agentUsageRes,
  //       recentActivityRes,
  //       savedCommandsRes,
  //       transactionLogsRes,
  //     ] = await Promise.all([
  //       fetch(endpoints.stats, { cache: "no-store" }),
  //       fetch(endpoints.chainActivity, { cache: "no-store" }),
  //       fetch(endpoints.gasDetails, { cache: "no-store" }),
  //       fetch(endpoints.agentUsage, { cache: "no-store" }),
  //       fetch(endpoints.recentActivity, { cache: "no-store" }),
  //       fetch(endpoints.savedCommands, { cache: "no-store" }),
  //       fetch(endpoints.transactionLogs, { cache: "no-store" }),
  //     ]);

  //     const [
  //       statsData,
  //       chainActivityData,
  //       gasDetailsData,
  //       agentUsageData,
  //       recentActivityData,
  //       savedCommandsData,
  //       transactionLogsData,
  //     ] = await Promise.all([
  //       statsRes.json(),
  //       chainActivityRes.json(),
  //       gasDetailsRes.json(),
  //       agentUsageRes.json(),
  //       recentActivityRes.json(),
  //       savedCommandsRes.json(),
  //       transactionLogsRes.json(),
  //     ]);

  //     stats = statsData.data || [];
  //     chainActivity = chainActivityData.data || [];
  //     gasDetails = gasDetailsData.data || [];
  //     agentUsage = agentUsageData.data || [];
  //     recentActivity = recentActivityData.data || [];
  //     savedCommands = savedCommandsData.data || [];
  //     transactionLogs = transactionLogsData.data || [];
  //   } catch (error) {
  //     console.error("Failed to fetch dashboard data:", error);
  //   }
  // }
  const router = useRouter();

  useEffect(() => {
    if (!address) {
      // Redirect to home page if address is not available
      router.push("/");
    }
  }, [address, router]);
  return (
    <main className="min-h-screen bg-[var(--bg-dark)] text-white">
      <Dashboard />
    </main>
  );
}
