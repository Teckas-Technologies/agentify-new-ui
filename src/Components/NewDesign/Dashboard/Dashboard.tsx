"use client";
import React, { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowRight,
  CircleDollarSign,
  Globe,
  PlayCircle,
  Repeat2,
  Terminal,
  Lightbulb,
  Bell,
  MessageSquareOff,
  Hourglass,
  PieChart,
  Database,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import Navbar from "./Navbar/Navbar";
import { Button } from "@/Components/ui/button";
import { StatCard } from "./StatCard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "./Card/Card";
import { Tabs } from "@radix-ui/react-tabs";
import { TabsContent, TabsList, TabsTrigger } from "./Tabs/Tabs";
import { ActivityItem } from "./ActivityItem/ActivityItem";
import { ChainBadge } from "./ChainBadge/ChainBadge";
import { SavedCommand } from "./SavedCommand/SavedCommand";
import { BarChartComponent } from "./BarChart/BharChartComponent";
import { AgentUsageChart } from "./AgentUsageChart/AgentUsageChart";
import { TransactionLogs } from "./TransactionLogs/TransactionLogs";
import { useAccount } from "wagmi";
import useFetchDashboardHeader from "@/hooks/useFetchDashboardHeader";
import useFetchChainActivity from "@/hooks/useFetchChainActivity";
import { EmptyState } from "./EmptyState/EmptyState";
import useFetchGasDetails from "@/hooks/useFetchGasDetails";
import useFetchAgentChart from "@/hooks/useFetchAgentChart";
import useFetchTransactions from "@/hooks/useFetchTransactions";
import { Skeleton } from "@/Components/ui/skeleton";
import { PreConnectState } from "./PreConnectState/PreConnectState";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import useFetchSavedCommands from "@/hooks/useFetchSavedCommands";
import { usePrivy } from "@privy-io/react-auth";

// export const agentUsageData = [
//   { name: "Swap", value: 62, color: "hsl(262, 83.3%, 57.8%)" },
//   { name: "Bridge", value: 26, color: "hsl(12, 76.4%, 64.7%)" },
//   { name: "Lend/Borrow", value: 12, color: "hsl(142, 76.2%, 36.3%)" },
// ];
type GasHistory = {
  day: string;
  gas: number;
};

// export const chainActivityData = [
//   { name: "Arbitrum", count: 58 },
//   { name: "Polygon", count: 42 },
//   { name: "Optimism", count: 37 },
//   { name: "Ethereum", count: 26 },
//   { name: "Base", count: 15 },
// ];

// export const gasUsageData = {
//   totalGas: "0.138 ETH",
//   avgGas: "0.0006 ETH",
// };

// export const gasHistoryData = [
//   { day: "Mon", value: 0 },
//   { day: "Tue", value: 0 },
//   { day: "Wed", value: 0 },
//   { day: "Thu", value: 0 },
//   { day: "Fri", value: 0 },
//   { day: "Sat", value: 0 },
//   { day: "Sun", value: 0 },
// ];

const quickActions = [
  {
    title: "Quick Swap",
    description: "Swap tokens with minimal clicks",
    icon: Repeat2,
    action: "/playground",
  },
  {
    title: "Command History",
    description: "View your recent commands",
    icon: Terminal,
    action: "/commands",
  },
  {
    title: "Run Last Command",
    description: "Execute your most recent transaction",
    icon: PlayCircle,
    action: "/playground",
  },
];
// const savedCommandsData = [
//   {
//     id: 1,
//     title: "ETH to USDC Swap",
//     command: "swap 0.1 ETH to USDC on Arbitrum",
//   },
//   {
//     id: 2,
//     title: "Bridge to Optimism",
//     command: "bridge 100 USDC to Optimism",
//   },
//   {
//     id: 3,
//     title: "Lend on Aave",
//     command: "lend 500 USDC on Arbitrum Aave",
//   },
// ];
// interface DashboardPageProps {
//   stats?: any[];
//   chainActivity?: any[];
//   gasDetails?: any[];
//   agentUsage?: any[];
//   recentActivity?: any[];
//   savedCommands?: any[];
//   transactionLogs?: any[];
// }

const Dashboard = () => {
  
  const router = useRouter();
  const { address } = useAccount();
  const { user } = usePrivy();
  const { handleWalletConnect } = useWalletConnect();
  const { dashboardStats, loading, error, fetchDashboardStats } =
    useFetchDashboardHeader();
  const fetchDashboardStatsMemoized = useCallback(async () => {
    if (address) {
      await fetchDashboardStats(address);
    }
  }, [address]);

  // useEffect now calls the memoized function
  useEffect(() => {
    if (address) {
      fetchDashboardStatsMemoized();
    }
  }, [address]);
  const stats = {
    commandsExecuted: dashboardStats?.totalTransaction ?? 0,
    mostUsedAgent:
      dashboardStats?.mostUsedAgent === "N/A"
        ? "None"
        : dashboardStats?.mostUsedAgent ?? "None",
    transactionVolume: dashboardStats?.transactionVolume
      ? `$${dashboardStats.transactionVolume}`
      : "$0",
    chainsInteracted: dashboardStats?.chainsInteracted ?? 0,
    transactionDifference: dashboardStats?.transactionDifference ?? 0,
    volumeDifference: dashboardStats?.volumeDifference ?? 0,
    chainsDifference: dashboardStats?.chainsDifference ?? 0,
  };
  const {
    chainActivity,
    fetchChainActivity,
    loading: chainLoading,
  } = useFetchChainActivity();

  const fetchChainActivityMemoized = useCallback(async () => {
    if (address) {
      await fetchChainActivity(address);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchChainActivityMemoized();
    }
  }, [address]);
  const {
    gasDetails,
    fetchGasDetails,
    loading: gasDetailsLoading,
  } = useFetchGasDetails();
  const [localData, setLocalData] = useState<{
    totalGas: number;
    avgGas: number;
    history: GasHistory[];
  }>({
    totalGas: 0,
    avgGas: 0,
    history: [],
  });

  const loadGasData = useCallback(async () => {
    if (!address) return;
    const data = await fetchGasDetails(address);
    if (data) {
      console.log("Gas Usage History:", data.data);
      setLocalData({
        totalGas: data.totalGas || 0,
        avgGas: data.average || 0,
        history: data.data || [],
      });
    }
  }, [address]);

  useEffect(() => {
    loadGasData();
  }, [address]);

  const isEmpty =
    !address || !gasDetails || !gasDetails.data || gasDetails.data.length === 0;

  const { fetchAgentChart, loading: chartLoading } = useFetchAgentChart();
  const [agentUsageData, setAgentUsageData] = useState([]);

  const loadAgentData = useCallback(async () => {
    if (!address) return; // early return if no address
    const data = await fetchAgentChart(address);
    if (data) {
      console.log("Agent Usage Data:", data);
      setAgentUsageData(data);
    }
  }, [address]); // make sure to include `address` in dependencies

  useEffect(() => {
    loadAgentData();
  }, [address]);
  // For Recent Activity — always fetch without agentId
  const {
    transactions: recentTransactions,
    fetchTransactions: fetchRecentTransactions,
    isLoading: recentLoading,
  } = useFetchTransactions();

  // For Transaction Logs — filtered by tab (swap, bridge, lend)
  const {
    transactions: tabbedTransactions,
    fetchTransactions: fetchTabbedTransactions,
    isLoading: tabbedLoading,
  } = useFetchTransactions();

  const [tab, setTab] = useState("all");
  // Always load 4 recent transactions regardless of tab
  const loadRecentTransactions = useCallback(() => {
    if (address) {
      fetchRecentTransactions({
        userId: address,
        limit: 4,
      });
    }
  }, [address, fetchRecentTransactions]);
  console.log(
    "...........................................",
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // 🔁 useCallback for fetching tab-specific transactions (with agentId)
  const loadTabbedTransactions = useCallback(() => {
    if (address) {
      const agentMap: Record<string, string> = {
        swap: "swapAgent",
        bridge: "bridgeAgent",
        lend: "lendingBorrowingAgent",
      };

      const params: { userId: string; agentId?: string; limit: number } = {
        userId: address,
        limit: 4,
      };

      if (tab !== "all") {
        params.agentId = agentMap[tab];
      }

      fetchTabbedTransactions(params);
    }
  }, [address, tab, fetchTabbedTransactions]);

  // 👇 useEffect to trigger memoized fetches
  useEffect(() => {
    loadRecentTransactions();
  }, [address]);

  useEffect(() => {
    loadTabbedTransactions();
  }, [address, tab]);
  const {
    savedCommands,
    fetchSavedCommands,
    loading: savedCmdLoading,
  } = useFetchSavedCommands();
  const [savedCommandsData, setSavedCommandsData] = useState<any[]>([]);

  // useCallback to memoize fetch function
  const loadSavedCommands = useCallback(async () => {
    if (address) {
      const res = await fetchSavedCommands(address);
      if (res?.data) {
        setSavedCommandsData(res.data);
      }
    }
  }, [address]);
  const lastCommand =
    savedCommandsData.length > 0 ? savedCommandsData[0] : null;

  // Generate the action URL for the last command
  const getLastCommandUrl = () => {
    if (lastCommand) {
      const agentId = lastCommand.agent_id; // Assuming the last command has the 'agentId' field
      const command = encodeURIComponent(lastCommand.command); // Assuming the last command has the 'command' field
      return `/playground?agent=${agentId}&message=${command}`;
    }
    return "/playground"; // Fallback URL
  };
  useEffect(() => {
    loadSavedCommands();
  }, [address]);
  const normalizeStatus = (
    status: string
  ): "success" | "failed" | "pending" => {
    switch (status.toLowerCase()) {
      case "success":
        return "success";
      case "failed":
        return "failed";
      case "pending":
        return "pending";
      default:
        return "pending"; // fallback for unknown statuses
    }
  };
  const formatTransactionType = (type: string) => {
    const mapping: Record<string, string> = {
      SWAP: "Swap",
      BRIDGE: "Bridge",
      LEND: "Lend",
    };
    return mapping[type] || type;
  };
  const convertToISTDate = (time: string): Date => {
    const utcDate = new Date(time.endsWith("Z") ? time : `${time}Z`);
    // toLocaleString to convert to IST and parse back to Date
    const istString = utcDate.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    return new Date(istString);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Title */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            className="neumorphic-sm flex items-center gap-2"
            onClick={() => router.push("/playground")}
          >
            <Terminal className="h-4 w-4" />
            Go to Playground
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Execution Summary */}
        {address && user ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Transaction Executed"
                icon={<Terminal className="h-5 w-5" />}
                value={
                  !user || !address || loading ? (
                    <Skeleton className="w-16 h-5 bg-white/10 rounded" />
                  ) : (
                    stats.commandsExecuted.toString()
                  )
                }
                trend={{
                  value:
                    !user || !address || loading ? (
                      <Skeleton className="w-12 h-4 bg-white/10 rounded" />
                    ) : (
                      <>
                        {stats.transactionDifference >= 0 ? " ↑" : " ↓"}
                        <span>{stats.transactionDifference}%</span>
                      </>
                    ),
                  isPositive: stats.transactionDifference >= 0,
                }}
              />

              <StatCard
                title="Most Used Agent"
                icon={<Repeat2 className="h-5 w-5" />}
                value={
                  !address || loading ? (
                    <Skeleton className="w-20 h-5 bg-white/10 rounded" />
                  ) : (
                    stats.mostUsedAgent
                  )
                }
              />

              <StatCard
                title="Transaction Volume"
                icon={<CircleDollarSign className="h-5 w-5" />}
                value={
                  !address || loading ? (
                    <Skeleton className="w-20 h-5 bg-white/10 rounded" />
                  ) : (
                    `$${Number(
                      stats.transactionVolume.toString().replace("$", "") || 0
                    ).toFixed(4)}`
                  )
                }
                trend={{
                  value:
                    !address || loading ? (
                      <Skeleton className="w-12 h-4 bg-white/10 rounded" />
                    ) : (
                      <>
                        {stats.volumeDifference >= 0 ? " ↑" : " ↓"}
                        <span>{stats.volumeDifference}%</span>
                      </>
                    ),
                  isPositive: stats.volumeDifference >= 0,
                }}
              />

              <StatCard
                title="Chains Interacted"
                icon={<Globe className="h-5 w-5" />}
                value={
                  !address || loading ? (
                    <Skeleton className="w-10 h-5 bg-white/10 rounded" />
                  ) : (
                    stats.chainsInteracted.toString()
                  )
                }
                trend={{
                  value:
                    !address || loading ? (
                      <Skeleton className="w-12 h-4 bg-white/10 rounded" />
                    ) : (
                      <>
                        {stats.chainsDifference >= 0 ? " ↑" : " ↓"}
                        <span>{stats.chainsDifference}%</span>
                      </>
                    ),
                  isPositive: stats.chainsDifference >= 0,
                }}
              />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Activity Timeline */}
                <Card className="neumorphic border-none">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold">
                      Recent Activity
                    </CardTitle>
                    {user && address && !recentLoading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground text-xs"
                        onClick={() => router.push("/activity")}
                      >
                        View All
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {!user || !address || recentLoading ? (
                      <div className="space-y-2">
                        <div className="h-[79px]">
                          <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                        </div>
                        <div className="h-[79px]">
                          <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                        </div>
                        <div className="h-[79px]">
                          <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                        </div>
                      </div>
                    ) : recentTransactions.length === 0 ? (
                      <EmptyState
                        title="No Recent Activity"
                        description="Your recent transactions and activities will appear here once you start using the platform."
                        icon={
                          <Activity className="h-12 w-12 text-muted-foreground/50" />
                        }
                      />
                    ) : (
                      <div className="space-y-0">
                        {[...recentTransactions].slice(0, 4).map((tx) => (
                          <ActivityItem
                            key={tx._id}
                            title={formatTransactionType(tx.transaction_type)}
                            description={tx.description}
                            timestamp={`${formatDistanceToNow(
                              new Date(tx.time),
                              {
                                addSuffix: true,
                              }
                            )}`}
                            status={normalizeStatus(tx.status)}
                            icon={<Activity className="h-4 w-4" />}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Agent Usage Chart */}
                  <Card className="neumorphic border-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold">
                        Agent Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!user || chartLoading || !address ? (
                        <Skeleton className="h-[250px] bg-white/10 rounded-md" />
                      ) : agentUsageData.length === 0 ? (
                        <EmptyState
                          title="No Agent Usage"
                          description="Agent usage statistics will appear here once you start using agents."
                          icon={
                            <PieChart className="h-12 w-12 text-muted-foreground/50" />
                          }
                        />
                      ) : (
                        <AgentUsageChart data={agentUsageData} />
                      )}
                    </CardContent>
                  </Card>

                  {/* Gas Usage Chart */}
                  <Card className="neumorphic border-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold">
                        Gas Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!user || !address || gasDetailsLoading ? (
                        <>
                          <div className="flex justify-between mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Total Gas
                              </p>
                              <Skeleton className="w-20 h-[27px] bg-white/10 rounded-md mt-1" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Avg per Tx
                              </p>
                              <Skeleton className="w-20 h-[27px] bg-white/10 rounded-md mt-1" />
                            </div>
                          </div>
                          <Skeleton className="w-full h-[200px] bg-white/10 rounded-md" />
                        </>
                      ) : !localData ||
                        !localData.history?.length ||
                        localData.history.every((item) => item.gas === 0) ? (
                        <EmptyState
                          title="No Gas Usage"
                          description="Your gas usage statistics will appear here once you start making transactions."
                          icon={
                            <Database className="h-12 w-12 text-muted-foreground/50" />
                          }
                        />
                      ) : (
                        <>
                          <div className="flex justify-between mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Total Gas
                              </p>
                              <p className="text-xl font-bold">
                                {localData.totalGas.toFixed(2)} USD
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Avg per Tx
                              </p>
                              <p className="text-xl font-bold">
                                {localData.avgGas.toFixed(2)} USD
                              </p>
                            </div>
                          </div>
                          <BarChartComponent
                            data={localData.history}
                            barColor="hsl(var(--primary))"
                          />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions and Chain Activity Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quick Actions Section */}
                  <Card className="neumorphic border-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold">
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {!user || !address ? (
                          <>
                            <Skeleton className="h-[50px] w-full rounded-md bg-white/10" />
                            <Skeleton className="h-[50px] w-full rounded-md bg-white/10" />
                            <Skeleton className="h-[50px] w-full rounded-md bg-white/10" />
                          </>
                        ) : (
                          quickActions.map((action, index) => {
                            if (
                              action.title === "Run Last Command" &&
                              lastCommand
                            ) {
                              return (
                                <Button
                                  key={index}
                                  variant="outline"
                                  className="w-full justify-start gap-3 h-auto p-3"
                                  onClick={() =>
                                    router.push(getLastCommandUrl())
                                  } // Use the dynamic URL for last command
                                >
                                  <div className="p-2 rounded-full bg-primary/10">
                                    <action.icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="text-left">
                                    <h4 className="font-medium">
                                      {action.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {lastCommand.description ||
                                        "Execute the most recent transaction"}
                                    </p>
                                  </div>
                                </Button>
                              );
                            }

                            return (
                              <Button
                                key={index}
                                variant="outline"
                                className="w-full justify-start gap-3 h-auto p-3"
                                onClick={() => router.push(action.action)} // Default action for other buttons
                              >
                                <div className="p-2 rounded-full bg-primary/10">
                                  <action.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-left">
                                  <h4 className="font-medium">
                                    {action.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {action.description}
                                  </p>
                                </div>
                              </Button>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chain Activity */}
                  <Card className="neumorphic border-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold">
                        Chain Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!user || !address || chainLoading ? (
                        <div className="flex flex-wrap gap-2">
                          <div className="h-[25px] w-[100px]">
                            <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                          </div>
                          <div className="h-[25px] w-[100px]">
                            <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                          </div>
                          <div className="h-[25px] w-[100px]">
                            <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                          </div>
                        </div>
                      ) : chainActivity?.length === 0 ||
                        chainActivity === null ? (
                        <EmptyState
                          title="No Chain Activity Yet"
                          description="Once on-chain activity is detected for this address, it will be displayed here."
                          icon={
                            <Hourglass className="h-12 w-12 text-muted-foreground/50" />
                          }
                        />
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {chainActivity.map((chain, index) => (
                            <ChainBadge
                              key={chain.chainName}
                              name={chain.chainName}
                              count={chain.count}
                              color={
                                index === 0
                                  ? "bg-primary/20"
                                  : index === 1
                                  ? "bg-accent/20"
                                  : index === 2
                                  ? "bg-success/20"
                                  : "bg-secondary"
                              }
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Saved Commands */}
                <Card className="neumorphic border-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">
                      Saved Commands
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Loading Skeleton */}
                    {!user || !address || savedCmdLoading ? (
                      <div className="flex flex-wrap gap-2">
                        <div className="h-[50px] w-full">
                          <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                        </div>
                      </div>
                    ) : savedCommandsData.length === 0 ? (
                      // Empty State
                      <EmptyState
                        title="No Saved Commands"
                        description="Your frequently used and saved commands will appear here."
                        icon={
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                        }
                      />
                    ) : (
                      <div className="space-y-3">
                        {savedCommandsData.slice(0, 3).map((command) => (
                          <SavedCommand
                            key={command._id}
                            title={command.agent_name}
                            command={command.command}
                            agentId={command.agent_id}
                            icon={<PlayCircle className="h-4 w-4" />}
                          />
                        ))}
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          size="sm"
                          onClick={() => router.push("/commands")}
                        >
                          View All Commands
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transaction Logs */}
                <Card className="neumorphic border-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">
                      Transaction Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={tab} onValueChange={setTab}>
                      <TabsList className="neumorphic-inset p-1 mb-4">
                        <TabsTrigger
                          value="all"
                          className="text-xs data-[state=active]:bg-[#f0f0f0] data-[state=active]:font-semibold data-[state=active]:text-black rounded-md px-3 py-1"
                        >
                          All
                        </TabsTrigger>
                        <TabsTrigger
                          value="swap"
                          className="text-xs data-[state=active]:bg-[#f0f0f0] data-[state=active]:font-semibold data-[state=active]:text-black rounded-md px-3 py-1"
                        >
                          Swaps
                        </TabsTrigger>
                        <TabsTrigger
                          value="bridge"
                          className="text-xs data-[state=active]:bg-[#f0f0f0] data-[state=active]:font-semibold data-[state=active]:text-black rounded-md px-3 py-1"
                        >
                          Bridges
                        </TabsTrigger>
                        <TabsTrigger
                          value="lend"
                          className="text-xs data-[state=active]:bg-[#f0f0f0] data-[state=active]:font-semibold data-[state=active]:text-black rounded-md px-3 py-1"
                        >
                          Lending & Borrow
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value={tab} className="m-0">
                        <div className="space-y-4">
                          {!user || !address || tabbedLoading ? (
                            <>
                              <div className="h-[50px]">
                                <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                              </div>
                              <div className="h-[50px]">
                                <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                              </div>
                              <div className="h-[50px]">
                                <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                              </div>
                            </>
                          ) : tabbedTransactions.length === 0 ? (
                            <EmptyState
                              title="No Transactions"
                              description="Your transaction logs will appear here once you start making transactions."
                              icon={
                                <Activity className="h-12 w-12 text-muted-foreground/50" />
                              }
                            />
                          ) : (
                            <>
                              <TransactionLogs
                                transactions={tabbedTransactions.slice(0, 3)}
                              />
                              <Button
                                className="glow w-full"
                                onClick={() => router.push("/activity")}
                              >
                                View All Transactions
                              </Button>
                            </>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <PreConnectState onConnect={handleWalletConnect} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
