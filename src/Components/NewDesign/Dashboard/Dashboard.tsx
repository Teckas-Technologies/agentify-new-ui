"use client";
import React from "react";

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
} from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import Navbar from "./Navbar/Navbar";
import { Button } from "@/Components/ui/button";
import { StatCard } from "../StatCard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "./Card/Card";
import { Tabs } from "@radix-ui/react-tabs";
import { TabsContent, TabsList, TabsTrigger } from "../Tabs/Tabs";
import { ActivityItem } from "./ActivityItem/ActivityItem";
import { ChainBadge } from "./ChainBadge/ChainBadge";
import { SavedCommand } from "../SavedCommand/SavedCommand";
import { BarChartComponent } from "./BarChart/BharChartComponent";
import { AgentUsageChart } from "./AgentUsageChart/AgentUsageChart";
import { TransactionLogs } from "./TransactionLogs/TransactionLogs";

export const agentUsageData = [
  { name: "Swap", value: 62, color: "hsl(262, 83.3%, 57.8%)" },
  { name: "Bridge", value: 26, color: "hsl(12, 76.4%, 64.7%)" },
  { name: "Lend/Borrow", value: 12, color: "hsl(142, 76.2%, 36.3%)" },
];

export const chainActivityData = [
  { name: "Arbitrum", count: 58 },
  { name: "Polygon", count: 42 },
  { name: "Optimism", count: 37 },
  { name: "Ethereum", count: 26 },
  { name: "Base", count: 15 },
];

export const gasUsageData = {
  totalGas: "0.138 ETH",
  avgGas: "0.0006 ETH",
};

export const gasHistoryData = [
  { name: "Mon", value: 0.0004 },
  { name: "Tue", value: 0.0007 },
  { name: "Wed", value: 0.0009 },
  { name: "Thu", value: 0.0005 },
  { name: "Fri", value: 0.0006 },
  { name: "Sat", value: 0.0008 },
  { name: "Sun", value: 0.0004 },
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
const Dashboard = () => {
  const router = useRouter();

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Commands Executed"
            value="142"
            icon={<Terminal className="h-5 w-5" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Most Used Agent"
            value="Swap Agent"
            icon={<Repeat2 className="h-5 w-5" />}
          />
          <StatCard
            title="Tokens Swapped"
            value="$24,589"
            icon={<CircleDollarSign className="h-5 w-5" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Chains Interacted"
            value="5"
            icon={<Globe className="h-5 w-5" />}
            trend={{ value: 2, isPositive: true }}
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
                <div className="space-y-0">
                  <ActivityItem
                    title="ETH to DAI Swap"
                    description="Swapped 0.5 ETH for 1250 DAI on Uniswap"
                    timestamp="10 minutes ago"
                    status="success"
                    icon={<Activity className="h-4 w-4" />}
                  />
                  <ActivityItem
                    title="USDC Bridge to Arbitrum"
                    description="Bridged 500 USDC to Arbitrum"
                    timestamp="25 minutes ago"
                    status="success"
                    icon={<Activity className="h-4 w-4" />}
                  />
                  <ActivityItem
                    title="AAVE Deposit"
                    description="Deposited 1.2 ETH to AAVE"
                    timestamp="2 hours ago"
                    status="success"
                    icon={<Activity className="h-4 w-4" />}
                  />
                  <ActivityItem
                    title="Failed Swap"
                    description="ETH to MATIC swap reverted"
                    timestamp="4 hours ago"
                    status="failed"
                    icon={<Activity className="h-4 w-4" />}
                  />
                </div>
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
                  <AgentUsageChart data={agentUsageData} />
                </CardContent>
              </Card>

              {/* Gas Usage Chart */}
              <Card className="neumorphic border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">Gas Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Gas</p>
                      <p className="text-xl font-bold">
                        {gasUsageData.totalGas}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Avg per Tx
                      </p>
                      <p className="text-xl font-bold">{gasUsageData.avgGas}</p>
                    </div>
                  </div>
                  <BarChartComponent
                    data={gasHistoryData}
                    barColor="hsl(var(--primary))"
                  />
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
                  <div className="flex flex-wrap gap-2">
                    {chainActivityData.map((chain, index) => (
                      <ChainBadge
                        key={chain.name}
                        name={chain.name}
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
                <Tabs defaultValue="all">
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
                  <TabsContent value="all" className="m-0">
                    <div className="space-y-4">
                      <TransactionLogs limit={3} />
                      <Button
                        className="glow w-full"
                        onClick={() => router.push("/transactions")}
                      >
                        View All Transactions
                      </Button>
                    </div>
                  </TabsContent>
                  {/* Other tab contents would be similar */}
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
