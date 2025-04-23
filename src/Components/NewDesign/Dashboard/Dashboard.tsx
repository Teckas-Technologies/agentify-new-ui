'use client'
import React from 'react';

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
import { useRouter } from 'next/navigation'; 

import { cn } from "@/lib/utils";
import Navbar from '../Navbar/Navbar';
import { Button } from '@/Components/ui/button';
import { StatCard } from '../StatCard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';
import { Tabs } from '@radix-ui/react-tabs';
import { TabsContent, TabsList, TabsTrigger } from '../Tabs/Tabs';
import { ActivityItem } from '../ActivityItem/ActivityItem';
import { ChainBadge } from '../ChainBadge/ChainBadge';
import { SavedCommand } from '../SavedCommand/SavedCommand';

const Index = () => {
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
            onClick={() => router.push('/playground')}
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
                <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground text-xs"
                  onClick={() => router.push('/activity')}
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
                  <CardTitle className="text-lg font-bold">Agent Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center bg-gray-100 rounded">
                    <p className="text-muted-foreground">Agent Usage Chart</p>
                  </div>
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
                      <p className="text-xl font-bold">1.42 ETH</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg per Tx</p>
                      <p className="text-xl font-bold">0.012 ETH</p>
                    </div>
                  </div>
                  <div className="h-[150px] flex items-center justify-center bg-gray-100 rounded">
                    <p className="text-muted-foreground">Gas Usage Chart</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions and Chain Activity Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Actions Section */}
              <Card className="neumorphic border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto p-3"
                      onClick={() => router.push('/playground')}
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <Repeat2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium">Quick Swap</h4>
                        <p className="text-xs text-muted-foreground">Swap tokens with minimal clicks</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto p-3"
                      onClick={() => router.push('/commands')}
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <Terminal className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium">Command History</h4>
                        <p className="text-xs text-muted-foreground">View your recent commands</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto p-3"
                      onClick={() => router.push('/playground')}
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <PlayCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium">Run Last Command</h4>
                        <p className="text-xs text-muted-foreground">Execute your most recent transaction</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Chain Activity */}
              <Card className="neumorphic border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">Chain Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <ChainBadge
                      name="Ethereum"
                      count="42"
                      color="bg-primary/20"
                    />
                    <ChainBadge
                      name="Arbitrum"
                      count="28"
                      color="bg-accent/20"
                    />
                    <ChainBadge
                      name="Polygon"
                      count="15"
                      color="bg-success/20"
                    />
                    <ChainBadge
                      name="Optimism"
                      count="9"
                      color="bg-secondary"
                    />
                    <ChainBadge
                      name="Avalanche"
                      count="5"
                      color="bg-secondary"
                    />
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
                <CardTitle className="text-lg font-bold">Saved Commands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <SavedCommand
                    title="Swap ETH to USDC"
                    command="swap eth usdc --amount 0.5"
                    icon={<PlayCircle className="h-4 w-4" />}
                  />
                  <SavedCommand
                    title="Bridge USDC to Arbitrum"
                    command="bridge usdc arbitrum --amount 500"
                    icon={<PlayCircle className="h-4 w-4" />}
                  />
                  <SavedCommand
                    title="Deposit to AAVE"
                    command="deposit aave eth --amount 1.2"
                    icon={<PlayCircle className="h-4 w-4" />}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    size="sm"
                    onClick={() => router.push('/commands')}
                  >
                    View All Commands
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Logs */}
            <Card className="neumorphic border-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Transaction Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="neumorphic-inset p-1 mb-4">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="swap" className="text-xs">Swaps</TabsTrigger>
                    <TabsTrigger value="bridge" className="text-xs">Bridges</TabsTrigger>
                    <TabsTrigger value="lend" className="text-xs">Lending</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="m-0">
                    <div className="space-y-4">
                      <div className="p-3 border rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">ETH → DAI</span>
                          <span className="text-sm text-muted-foreground">10 min ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">0.5 ETH → 1250 DAI</p>
                      </div>
                      <div className="p-3 border rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">USDC Bridge</span>
                          <span className="text-sm text-muted-foreground">25 min ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">500 USDC to Arbitrum</p>
                      </div>
                      <div className="p-3 border rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">AAVE Deposit</span>
                          <span className="text-sm text-muted-foreground">2 hrs ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">1.2 ETH deposited</p>
                      </div>
                      <Button 
                        className="glow w-full" 
                        onClick={() => router.push('/transactions')}
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

export default Index;