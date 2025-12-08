"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import Navbar from "@/Components/NewDesign/Dashboard/Navbar/Navbar";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/NewDesign/Dashboard/Card/Card";
import { useHyperliquidHook } from "@/hooks/useHyperliquidHook";
import { useToast } from "@/hooks/use-toast";

export default function HyperliquidPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { toast } = useToast();

  const {
    loading,
    error,
    depositFromArbitrum,
    getAccountBalance,
    getCurrentPositions,
    getAccountSummary,
    openPerpPosition,
    closePerpPosition,
  } = useHyperliquidHook();

  const [depositAmount, setDepositAmount] = useState("");
  const [balance, setBalance] = useState<{ perpBalance: string; spotBalance: string } | null>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Trade form state
  const [tradeSymbol, setTradeSymbol] = useState("BTC");
  const [tradeSize, setTradeSize] = useState("");
  const [tradeLeverage, setTradeLeverage] = useState("1");
  const [tradeType, setTradeType] = useState<"long" | "short">("long");

  // Fetch balance and positions
  const fetchData = async () => {
    if (!address) return;

    setRefreshing(true);
    try {
      const [balanceData, positionsData] = await Promise.all([
        getAccountBalance(),
        getCurrentPositions(),
      ]);

      if (balanceData) {
        setBalance(balanceData);
      }

      if (positionsData) {
        setPositions(positionsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address]);

  // Handle deposit
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await depositFromArbitrum(parseFloat(depositAmount));

      if (result.success) {
        toast({
          title: "Deposit Successful",
          description: result.message,
        });
        setDepositAmount("");
        // Refresh balance after deposit
        setTimeout(() => fetchData(), 3000);
      } else {
        toast({
          title: "Deposit Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to process deposit",
        variant: "destructive",
      });
    }
  };

  // Handle trade placement
  const handlePlaceTrade = async () => {
    if (!tradeSize || parseFloat(tradeSize) <= 0) {
      toast({
        title: "Invalid Size",
        description: "Please enter a valid position size",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await openPerpPosition({
        symbol: tradeSymbol,
        size: parseFloat(tradeSize),
        leverage: parseInt(tradeLeverage),
        isLong: tradeType === "long",
        orderType: "market",
      });

      if (result.success) {
        toast({
          title: "Position Opened",
          description: result.message,
        });
        setTradeSize("");
        // Refresh positions after opening
        setTimeout(() => fetchData(), 2000);
      } else {
        toast({
          title: "Trade Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to open position",
        variant: "destructive",
      });
    }
  };

  // Handle position close
  const handleClosePosition = async (position: any) => {
    try {
      const result = await closePerpPosition({
        symbol: position.coin,
        percentage: 100, // Close 100% of position
      });

      if (result.success) {
        toast({
          title: "Position Closed",
          description: result.message,
        });
        // Refresh positions after closing
        setTimeout(() => fetchData(), 2000);
      } else {
        toast({
          title: "Close Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to close position",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Card className="bg-[#1a1a1a] border border-white/10 p-8 text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold mb-2 text-white">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-4">
              Please connect your wallet to access Hyperliquid trading
            </p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Balance Section */}
        <Card className="bg-[#1a1a1a] border border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl text-white">Account Balance</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              disabled={refreshing}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Perpetual Balance</p>
                <p className="text-2xl font-bold text-white">
                  ${balance?.perpBalance ? parseFloat(balance.perpBalance).toFixed(2) : "0.00"}
                </p>
              </div>
              <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Spot Balance</p>
                <p className="text-2xl font-bold text-white">
                  ${balance?.spotBalance ? parseFloat(balance.spotBalance).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Section */}
        <Card className="bg-[#1a1a1a] border border-white/10">
          <CardHeader>
            <CardTitle className="text-xl text-white">Deposit USDC from Arbitrum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Amount (minimum 5 USDC)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="5"
                step="0.01"
              />
              <Button
                onClick={handleDeposit}
                disabled={loading || !depositAmount}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Deposit
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Trading Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Trade Form */}
          <Card className="bg-[#1a1a1a] border border-white/10">
            <CardHeader>
              <CardTitle className="text-xl text-white">Open Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Symbol */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Symbol</label>
                <select
                  value={tradeSymbol}
                  onChange={(e) => setTradeSymbol(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="BTC" className="bg-[#0f0f0f]">BTC/USD</option>
                  <option value="ETH" className="bg-[#0f0f0f]">ETH/USD</option>
                  <option value="SOL" className="bg-[#0f0f0f]">SOL/USD</option>
                  <option value="ARB" className="bg-[#0f0f0f]">ARB/USD</option>
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Size (USD)</label>
                <input
                  type="number"
                  placeholder="Enter position size"
                  value={tradeSize}
                  onChange={(e) => setTradeSize(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Leverage */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Leverage: <span className="text-white">{tradeLeverage}x</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={tradeLeverage}
                  onChange={(e) => setTradeLeverage(e.target.value)}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1x</span>
                  <span>50x</span>
                </div>
              </div>

              {/* Long/Short Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setTradeType("long")}
                  variant={tradeType === "long" ? "default" : "outline"}
                  className={`${
                    tradeType === "long"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-white/10 hover:bg-white/5 text-white"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Long
                </Button>
                <Button
                  onClick={() => setTradeType("short")}
                  variant={tradeType === "short" ? "default" : "outline"}
                  className={`${
                    tradeType === "short"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "border-white/10 hover:bg-white/5 text-white"
                  }`}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Short
                </Button>
              </div>

              {/* Place Trade Button */}
              <Button
                onClick={handlePlaceTrade}
                disabled={loading || !tradeSize}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Processing..." : `Open ${tradeType === "long" ? "Long" : "Short"} Position`}
              </Button>
            </CardContent>
          </Card>

          {/* Right Side - Open Positions */}
          <Card className="bg-[#1a1a1a] border border-white/10">
            <CardHeader>
              <CardTitle className="text-xl text-white">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No open positions</p>
                  <p className="text-sm mt-2 text-gray-500">Open your first position to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {positions.map((position, index) => {
                    const isLong = parseFloat(position.szi) > 0;
                    const pnl = parseFloat(position.unrealizedPnl);
                    const isProfitable = pnl >= 0;

                    return (
                      <div
                        key={index}
                        className="p-4 bg-[#0f0f0f] border border-white/10 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg text-white">{position.coin}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  isLong
                                    ? "bg-green-600/20 text-green-400"
                                    : "bg-red-600/20 text-red-400"
                                }`}
                              >
                                {isLong ? "LONG" : "SHORT"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {position.leverage.value}x
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              Size: {Math.abs(parseFloat(position.szi)).toFixed(4)}
                            </p>
                            <p className="text-sm text-gray-400">
                              Entry: ${parseFloat(position.entryPx).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-bold ${
                                isProfitable ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {isProfitable ? "+" : ""}${pnl.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${parseFloat(position.positionValue).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleClosePosition(position)}
                          variant="outline"
                          size="sm"
                          className="w-full border-white/10 text-white hover:bg-red-600/20 hover:border-red-600/40 hover:text-red-400"
                        >
                          Close Position
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
