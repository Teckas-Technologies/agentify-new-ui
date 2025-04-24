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

export const agentUsageData = [
  { name: "Swap", value: 62, color: "hsl(262, 83.3%, 57.8%)" },
  { name: "Bridge", value: 26, color: "hsl(12, 76.4%, 64.7%)" },
  { name: "Lend/Borrow", value: 12, color: "hsl(142, 76.2%, 36.3%)" },
];

// export const chainActivityData = [
//   { name: "Arbitrum", count: 58 },
//   { name: "Polygon", count: 42 },
//   { name: "Optimism", count: 37 },
//   { name: "Ethereum", count: 26 },
//   { name: "Base", count: 15 },
// ];

export const gasUsageData = {
  totalGas: "0.138 ETH",
  avgGas: "0.0006 ETH",
};

export const gasHistoryData = [
  { day: "Mon", value: 0 },
  { day: "Tue", value: 0 },
  { day: "Wed", value: 0 },
  { day: "Thu", value: 0 },
  { day: "Fri", value: 0 },
  { day: "Sat", value: 0 },
  { day: "Sun", value: 0 },
];

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
const savedCommandsData = [
  {
    id: 1,
    title: "ETH to USDC Swap",
    command: "swap 0.1 ETH to USDC on Arbitrum",
  },
  {
    id: 2,
    title: "Bridge to Optimism",
    command: "bridge 100 USDC to Optimism",
  },
  {
    id: 3,
    title: "Lend on Aave",
    command: "lend 500 USDC on Arbitrum Aave",
  },
];
interface DashboardPageProps {
  stats?: any[];
  chainActivity?: any[];
  gasDetails?: any[];
  agentUsage?: any[];
}

const Dashboard = ({
  stats: initialStats = [],
  chainActivity: initialChainActivity = [],
  gasDetails: initialGasDetails = [],
  agentUsage: initialAgentUsage = [],
}: DashboardPageProps) => {
  const router = useRouter();
  const { address } = useAccount();
  const { dashboardStats, loading, error, fetchDashboardStats } =
    useFetchDashboardHeader();
  useEffect(() => {
    if (address) {
      fetchDashboardStats("user123");
    }
  }, [address]);
  const stats = {
    commandsExecuted: dashboardStats?.totalTransaction ?? 0,
    mostUsedAgent:
      dashboardStats?.mostUsedAgent === "N/A"
        ? "None"
        : dashboardStats?.mostUsedAgent ?? "None",
    tokensSwapped: dashboardStats?.transactionVolume
      ? `$${dashboardStats.transactionVolume}`
      : "$0",
    chainsInteracted: dashboardStats?.chainsInteracted ?? 0,
    transactionDifference: dashboardStats?.transactionDifference ?? 0,
    volumeDifference: dashboardStats?.volumeDifference ?? 0,
    chainsDifference: dashboardStats?.chainsDifference ?? 0,
  };
  const { chainActivity, fetchChainActivity } = useFetchChainActivity();

  useEffect(() => {
    if (address) {
      fetchChainActivity(address);
    }
  }, [address]);
  const { gasDetails, fetchGasDetails } = useFetchGasDetails();
  const [localData, setLocalData] = useState({
    totalGas: 0,
    avgGas: 0,
    history: [],
  });

  const loadGasData = useCallback(async () => {
    if (!address) return;
    const data = await fetchGasDetails("user123");
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

  const { fetchAgentChart } = useFetchAgentChart();
  const [agentUsageData, setAgentUsageData] = useState([]);

  const loadAgentData = useCallback(async () => {
    if (!address) return; // early return if no address
    const data = await fetchAgentChart("user123");
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
        userId: "user123",
        limit: 4,
      });
    }
  }, [address, fetchRecentTransactions]);

  // 🔁 useCallback for fetching tab-specific transactions (with agentId)
  const loadTabbedTransactions = useCallback(() => {
    if (address) {
      const agentMap: Record<string, string> = {
        swap: "swapAgent",
        bridge: "bridgeAgent",
        lend: "lendAgent",
      };

      const params: { userId: string; agentId?: string; limit: number } = {
        userId: "user123",
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
        {loading ? (
          <p>Loading dashboard data...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Transaction Executed"
              value={stats.commandsExecuted.toString()}
              icon={<Terminal className="h-5 w-5" />}
              trend={{
                value: stats.transactionDifference,
                isPositive: stats.transactionDifference >= 0,
              }}
            />
            <StatCard
              title="Most Used Agent"
              value={stats.mostUsedAgent}
              icon={<Repeat2 className="h-5 w-5" />}
            />
            <StatCard
              title="Transaction Volume"
              value={stats.tokensSwapped}
              icon={<CircleDollarSign className="h-5 w-5" />}
              trend={{
                value: stats.volumeDifference,
                isPositive: stats.volumeDifference >= 0,
              }}
            />
            <StatCard
              title="Chains Interacted"
              value={stats.chainsInteracted.toString()}
              icon={<Globe className="h-5 w-5" />}
              trend={{
                value: stats.chainsDifference,
                isPositive: stats.chainsDifference >= 0,
              }}
            />
          </div>
        )}

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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs"
                  onClick={() => router.push("/activity")}
                >
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {!address || recentTransactions.length === 0 ? (
                  <EmptyState
                    title="No Recent Activity"
                    description="Your recent transactions and activities will appear here once you start using the platform."
                    icon={
                      <Activity className="h-12 w-12 text-muted-foreground/50" />
                    }
                  />
                ) : (
                  <div className="space-y-0">
                    {recentTransactions.map((tx) => (
                      <ActivityItem
                        key={tx._id}
                        title={tx.transaction_type}
                        description={tx.description}
                        timestamp={`${formatDistanceToNow(new Date(tx.time), {
                          addSuffix: true,
                        })}`}
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
                  {!address || agentUsageData.length === 0 ? (
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
                  <CardTitle className="text-lg font-bold">Gas Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEmpty ? (
                    <EmptyState
                      title="No Chain Activity Yet"
                      description="Once on-chain activity is detected for this address, it will be displayed here."
                      icon={
                        <Hourglass className="h-12 w-12 text-muted-foreground/50" />
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
                            {localData.totalGas}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Avg per Tx
                          </p>
                          <p className="text-xl font-bold">
                            {localData.avgGas}
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
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto p-3"
                        onClick={() => router.push(action.action)}
                      >
                        <div className="p-2 rounded-full bg-primary/10">
                          <action.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium">{action.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </Button>
                    ))}
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
                  {chainActivity?.length === 0 || chainActivity === null ? (
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
                <div className="space-y-3">
                  {savedCommandsData.map((command) => (
                    <SavedCommand
                      key={command.id}
                      title={command.title}
                      command={command.command}
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
                    <TabsTrigger value="all" className="text-xs">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="swap" className="text-xs">
                      Swaps
                    </TabsTrigger>
                    <TabsTrigger value="bridge" className="text-xs">
                      Bridges
                    </TabsTrigger>
                    <TabsTrigger value="lend" className="text-xs">
                      Lending
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value={tab} className="m-0">
                    <div className="space-y-4">
                      <TransactionLogs
                        transactions={tabbedTransactions.slice(0, 3)}
                      />
                      <Button
                        className="glow w-full"
                        onClick={() => router.push("/transactions")}
                      >
                        View All Transactions
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
