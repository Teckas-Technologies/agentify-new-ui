
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";

import { Wallet, Command, Activity, PieChart } from "lucide-react";
import { EmptyState } from "./EmptyState";

export const PreConnectState = ({ onConnect }: { onConnect?: () => void }) => {
  return (
    <div className="space-y-8">
      {/* Main connect prompt */}
      <Card className="neumorphic border-none overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="p-4 rounded-full bg-primary/10 ring-1 ring-primary/20">
                <Wallet className="h-12 w-12 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Connect your wallet to access your dashboard, execute commands, and manage your crypto assets.
                </p>
                <Button 
                  size="lg" 
                  className="neumorphic-sm font-medium"
                  onClick={onConnect}
                >
                  <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features preview grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="neumorphic border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Command Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Execute Commands"
              description="Run transactions and interact with DeFi protocols using simple commands."
              icon={<Command className="h-12 w-12 text-muted-foreground/50" />}
            />
          </CardContent>
        </Card>

        <Card className="neumorphic border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Track Activities"
              description="Monitor your transaction history and activities across different chains."
              icon={<Activity className="h-12 w-12 text-muted-foreground/50" />}
            />
          </CardContent>
        </Card>

        <Card className="neumorphic border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="View Analytics"
              description="Get insights into your portfolio with detailed analytics and charts."
              icon={<PieChart className="h-12 w-12 text-muted-foreground/50" />}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
