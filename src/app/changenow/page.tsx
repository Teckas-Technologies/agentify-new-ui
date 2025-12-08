"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useWalletClient, useSendTransaction, useSwitchChain } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { RefreshCw, ArrowDownUp, Wallet, Search, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";
import Navbar from "@/Components/NewDesign/Dashboard/Navbar/Navbar";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/NewDesign/Dashboard/Card/Card";
import { useChangeNowHook } from "@/hooks/useChangeNowHook";
import { useToast } from "@/hooks/use-toast";
import { parseChangeNowTicker, parseChangeNowTickerLenient } from "@/utils/changeNowTokenMapping";
import { supportedChains } from "@/contexts/CustomWagmiProvider";
import {
  ChangeNowCurrency,
  TransactionStatusResponse,
  CreateExchangeResponse,
  ExchangeAmountResponse,
  FixedRateExchangeResponse,
  AvailableCurrenciesForResponse,
  AvailableActionsResponse,
  FixedRateMarketsResponse,
} from "@/types/changenow";

export default function ChangeNowPage() {
  const { address, isConnected, chain } = useAccount();
  const { toast } = useToast();
  const { data: walletClient } = useWalletClient();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();

  const {
    loading,
    error,
    getCurrencies,
    getEVMCurrencies,
    getCurrencyInfo,
    getAvailableCurrenciesFor,
    getMinAmount,
    getExchangeAmount,
    getFixedRateAmount,
    getExchangeRange,
    getTransactionStatus,
    getAvailableActions,
    getFixedRateMarkets,
    validateAddress,
    createExchange,
    createFixedRateExchange,
    sendToDepositAddress,
    executeExchange,
    debugLogEVMCurrencies,
  } = useChangeNowHook();

  // Currencies state
  const [currencies, setCurrencies] = useState<ChangeNowCurrency[]>([]);
  const [currencySearch, setCurrencySearch] = useState("");
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [availableToCurrencies, setAvailableToCurrencies] = useState<AvailableCurrenciesForResponse | null>(null);
  const [fixedRateMarkets, setFixedRateMarkets] = useState<FixedRateMarketsResponse | null>(null);
  const [availableActions, setAvailableActions] = useState<AvailableActionsResponse | null>(null);

  // Exchange form state
  const [fromCurrency, setFromCurrency] = useState("btc");
  const [toCurrency, setToCurrency] = useState("eth");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [refundAddress, setRefundAddress] = useState("");
  const [isFixedRate, setIsFixedRate] = useState(false);
  const [rateId, setRateId] = useState<string | null>(null);

  // Exchange info state
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);
  const [transactionSpeed, setTransactionSpeed] = useState<string | null>(null);
  const [pairStatus, setPairStatus] = useState<string | null>(null);

  // Transaction state
  const [exchangeData, setExchangeData] = useState<CreateExchangeResponse | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatusResponse | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [isPolling, setIsPolling] = useState(false);

  // Explorer links state
  const [fromCurrencyExplorer, setFromCurrencyExplorer] = useState<{
    addressMask: string;
    txMask: string;
  } | null>(null);
  const [toCurrencyExplorer, setToCurrencyExplorer] = useState<{
    addressMask: string;
    txMask: string;
  } | null>(null);

  // Load currencies and fixed-rate markets on mount
  useEffect(() => {
    fetchCurrencies();
    fetchFixedRateMarkets();
  }, []);

  // Fetch available currencies when fromCurrency changes
  useEffect(() => {
    if (fromCurrency) {
      fetchAvailableCurrencies();
    }
  }, [fromCurrency, isFixedRate]);

  // Auto-fill refund address with connected wallet
  useEffect(() => {
    if (address && !refundAddress) {
      setRefundAddress(address);
    }
  }, [address]);

  // Fetch estimate when amounts change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0 && fromCurrency && toCurrency) {
        fetchEstimate();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fromAmount, fromCurrency, toCurrency, isFixedRate]);

  // Fetch min/max when currencies change
  useEffect(() => {
    if (fromCurrency && toCurrency) {
      fetchExchangeRange();
    }
  }, [fromCurrency, toCurrency]);

  const fetchCurrencies = async () => {
    setLoadingCurrencies(true);
    // Fetch only EVM chain currencies (from our 41 supported chains)
    const data = await getEVMCurrencies(true, false);
    if (data) {
      setCurrencies(data);
    }
    setLoadingCurrencies(false);
  };

  const fetchAvailableCurrencies = async () => {
    const data = await getAvailableCurrenciesFor(fromCurrency, isFixedRate);
    if (data) {
      console.log(`Available currencies for ${fromCurrency}:`, data.length);
      setAvailableToCurrencies(data);
    }
  };

  const fetchFixedRateMarkets = async () => {
    const data = await getFixedRateMarkets();
    if (data) {
      setFixedRateMarkets(data);
    }
  };

  const fetchAvailableActionsForTransaction = async (transactionId: string) => {
    const data = await getAvailableActions(transactionId);
    if (data) {
      setAvailableActions(data);
    }
  };

  const fetchExchangeRange = async () => {
    setPairStatus(null);
    const minData = await getMinAmount(fromCurrency, toCurrency);
    if (minData) {
      setMinAmount(minData.minAmount);
      setPairStatus("active");
    } else {
      setMinAmount(null);
      setMaxAmount(null);
      setPairStatus("inactive");
      setToAmount("");
      setEstimatedAmount(null);
      return;
    }

    const rangeData = await getExchangeRange(fromCurrency, toCurrency);
    if (rangeData) {
      setMaxAmount(rangeData.maxAmount);
    }
  };

  const fetchEstimate = async () => {
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (pairStatus === "inactive") {
      setToAmount("");
      setEstimatedAmount(null);
      return;
    }

    // Check minimum amount before calling API to avoid "pair_is_inactive" errors
    if (minAmount && amount < minAmount) {
      setToAmount("");
      setEstimatedAmount(null);
      console.log(`Amount ${amount} is below minimum ${minAmount} for ${fromCurrency}/${toCurrency}`);
      return;
    }

    console.log(`Fetching estimate for pair: ${fromCurrency} → ${toCurrency}, amount: ${amount}, fixedRate: ${isFixedRate}`);

    if (isFixedRate) {
      const data = await getFixedRateAmount(amount, fromCurrency, toCurrency);
      console.log(`Fixed rate result for ${fromCurrency}/${toCurrency}:`, data);
      if (data) {
        setEstimatedAmount(data.estimatedAmount);
        setToAmount(data.estimatedAmount.toString());
        setTransactionSpeed(data.transactionSpeedForecast);
        setRateId(data.rateId);
        setPairStatus("active");
      } else {
        console.warn(`Fixed rate failed for ${fromCurrency}/${toCurrency} - could be below minimum amount`);
        setToAmount("");
        setEstimatedAmount(null);
        // Don't mark as inactive if minAmount exists - it means the pair is valid, just amount is too low
        // Only mark inactive if we don't have minAmount (which means pair truly doesn't exist)
        if (!minAmount) {
          setPairStatus("inactive");
        }
      }
    } else {
      const data = await getExchangeAmount(amount, fromCurrency, toCurrency);
      console.log(`Floating rate result for ${fromCurrency}/${toCurrency}:`, data);
      if (data) {
        setEstimatedAmount(data.estimatedAmount);
        setToAmount(data.estimatedAmount.toString());
        setTransactionSpeed(data.transactionSpeedForecast);
        setRateId(null);
        setPairStatus("active");
      } else {
        console.warn(`Floating rate failed for ${fromCurrency}/${toCurrency} - could be below minimum amount`);
        setToAmount("");
        setEstimatedAmount(null);
        // Don't mark as inactive if minAmount exists - it means the pair is valid, just amount is too low
        // Only mark inactive if we don't have minAmount (which means pair truly doesn't exist)
        if (!minAmount) {
          setPairStatus("inactive");
        }
      }
    }
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setFromAmount("");
    setToAmount("");
    setEstimatedAmount(null);
  };

  const handleCreateExchange = async () => {
    if (pairStatus === "inactive") {
      toast({
        title: "Pair Inactive",
        description: `The pair ${fromCurrency.toUpperCase()}/${toCurrency.toUpperCase()} is not available. Please select different currencies or check the network (e.g., use "usdterc20" instead of "usdt").`,
        variant: "destructive",
      });
      return;
    }

    if (!recipientAddress) {
      toast({
        title: "Missing Address",
        description: "Please enter a recipient address",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (minAmount && amount < minAmount) {
      toast({
        title: "Amount Too Low",
        description: `Minimum amount is ${minAmount} ${fromCurrency.toUpperCase()}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const params = {
        from: fromCurrency,
        to: toCurrency,
        amount,
        address: recipientAddress,
        refundAddress: refundAddress || undefined,
        ...(isFixedRate && rateId ? { rateId } : {}),
      };

      let result: CreateExchangeResponse | undefined;
      if (isFixedRate && rateId) {
        result = await createFixedRateExchange(params);
      } else {
        result = await createExchange(params);
      }

      if (result) {
        setExchangeData(result);

        // Fetch explorer links for both currencies
        const fromInfo = await getCurrencyInfo(result.fromCurrency);
        const toInfo = await getCurrencyInfo(result.toCurrency);

        if (fromInfo) {
          setFromCurrencyExplorer({
            addressMask: fromInfo.addressExplorerMask,
            txMask: fromInfo.transactionExplorerMask,
          });
        }

        if (toInfo) {
          setToCurrencyExplorer({
            addressMask: toInfo.addressExplorerMask,
            txMask: toInfo.transactionExplorerMask,
          });
        }

        toast({
          title: "Exchange Created",
          description: `Send ${fromAmount} ${result.fromCurrency.toUpperCase()} to the deposit address`,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create exchange",
        variant: "destructive",
      });
    }
  };

  const handleTrackTransaction = async () => {
    if (!trackingId) {
      toast({
        title: "Missing ID",
        description: "Please enter a transaction ID",
        variant: "destructive",
      });
      return;
    }

    const status = await getTransactionStatus(trackingId);
    if (status) {
      setTransactionStatus(status);
      // Fetch available actions (refund/push) for this transaction
      fetchAvailableActionsForTransaction(trackingId);
    }
  };

  const startPollingStatus = async (id: string) => {
    setIsPolling(true);
    // Fetch initial available actions
    fetchAvailableActionsForTransaction(id);

    const pollInterval = setInterval(async () => {
      const status = await getTransactionStatus(id);
      if (status) {
        setTransactionStatus(status);
        // Check available actions on each poll
        fetchAvailableActionsForTransaction(id);

        if (["finished", "failed", "refunded", "expired"].includes(status.status)) {
          clearInterval(pollInterval);
          setIsPolling(false);
        }
      }
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  };

  const handleSendFromWallet = async () => {
    if (!exchangeData) {
      toast({
        title: "No Exchange",
        description: "Please create an exchange first",
        variant: "destructive",
      });
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to send",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if we need to switch chains
      const requiredChainId = getRequiredChainId();
      if (requiredChainId && chain?.id !== requiredChainId) {
        const chainName = supportedChains.find(c => c.id === requiredChainId)?.name || `Chain ${requiredChainId}`;

        toast({
          title: "Switching Network",
          description: `Switching to ${chainName}...`,
        });

        try {
          await switchChainAsync({ chainId: requiredChainId });

          toast({
            title: "Network Switched",
            description: `Successfully switched to ${chainName}`,
          });

          // Wait a moment for the chain switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchErr: any) {
          toast({
            title: "Network Switch Failed",
            description: switchErr.message || "Failed to switch network. Please switch manually.",
            variant: "destructive",
          });
          return;
        }
      }

      const result = await sendToDepositAddress(
        exchangeData.payinAddress,
        parseFloat(fromAmount), // Use the amount user entered, not exchangeData.amount
        exchangeData.fromCurrency
      );

      if (result.success) {
        toast({
          title: "Transaction Sent",
          description: "Funds sent successfully! Your exchange will complete in a few minutes.",
        });

        // Automatically start tracking
        if (result.txHash) {
          setTrackingId(exchangeData.id);
          startPollingStatus(exchangeData.id);
        }
      } else {
        toast({
          title: "Transaction Failed",
          description: result.error || "Failed to send funds from wallet",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send transaction",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "finished":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "failed":
      case "refunded":
      case "expired":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "waiting":
      case "confirming":
      case "exchanging":
      case "sending":
        return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  // Check if the from currency is supported by our wallet integration
  const isFromCurrencySupported = () => {
    if (!exchangeData) return false;
    const parsed = parseChangeNowTicker(exchangeData.fromCurrency);
    // If parseChangeNowTicker returns null, the token/chain is not supported
    if (!parsed) return false;

    // Check if the chain is in our supported chains list
    return supportedChains.some(supportedChain => supportedChain.id === parsed.chainId);
  };

  // Get the required chain ID for the from currency
  const getRequiredChainId = (): number | null => {
    if (!exchangeData) return null;
    const parsed = parseChangeNowTicker(exchangeData.fromCurrency);
    return parsed ? parsed.chainId : null;
  };

  const filteredCurrencies = currencies.filter(
    (c) =>
      c.ticker.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Card className="bg-[#1a1a1a] border border-white/10 p-8 text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold mb-2 text-white">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-4">
              Please connect your wallet to access ChangeNow exchange
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
        {/* Header */}
        <div className="text-center mb-8 relative">
          <h1 className="text-3xl font-bold text-white mb-2">ChangeNow Exchange</h1>
          <p className="text-gray-400">EVM chains exchange with direct wallet integration</p>

          {/* Debug Button */}
          <Button
            onClick={async () => {
              await debugLogEVMCurrencies();
              toast({
                title: "Debug Log",
                description: "Check browser console for EVM currencies data",
              });
            }}
            variant="ghost"
            size="sm"
            className="absolute top-0 right-20 text-xs text-gray-500 hover:text-white"
          >
            🐛 Debug Log
          </Button>

          {/* Single Exchange Test Button */}
          <Button
            onClick={async () => {
              if (!address) {
                toast({
                  title: "Wallet Not Connected",
                  description: "Please connect your wallet first",
                  variant: "destructive",
                });
                return;
              }

              console.log("=== Starting Single Exchange Test ===");
              toast({
                title: "Starting Exchange",
                description: "Testing USDT (Polygon) → ETH (Arbitrum)",
              });

              const result = await executeExchange({
                fromCurrency: "usdt",
                fromChain: "polygon",
                toCurrency: "usdc",
                toChain: "arbitrum",
                amount: 4,
                recipientAddress: address,
                refundAddress: address,
                isFixedRate: false,
                autoSendFromWallet: true, // Enable automatic wallet send
                onProgress: (progress) => {
                  console.log(`[Progress] Step: ${progress.step}, Status: ${progress.status}`, progress);
                  toast({
                    title: `Step: ${progress.step}`,
                    description: progress.message || progress.status,
                  });
                },
              });

              console.log("=== Exchange Result ===", result);

              if (result.success) {
                toast({
                  title: "Exchange Created! ✅",
                  description: `Exchange ID: ${result.exchange?.id}`,
                });
              } else {
                toast({
                  title: "Exchange Failed ❌",
                  description: result.error || "Unknown error",
                  variant: "destructive",
                });
              }
            }}
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 text-xs text-green-500 hover:text-white"
            disabled={loading}
          >
            🚀 Single Exchange
          </Button>

          {/* Quick Tips */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg max-w-3xl mx-auto">
            <p className="text-sm text-blue-300 mb-2">💡 How to use:</p>
            <div className="text-xs text-blue-200 space-y-1">
              <p>• Select currencies from the dropdown menus (Featured currencies are most reliable)</p>
              <p>• Click a currency in the left panel to set as "From" currency</p>
              <p>• Right-click a currency to set as "To" currency</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Currencies List */}
          <Card className="bg-[#1a1a1a] border border-white/10 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white">Available Currencies</CardTitle>
                <p className="text-xs text-blue-400 mt-1">EVM Chains Only (41 chains)</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchCurrencies}
                disabled={loadingCurrencies}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCurrencies ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Currencies List with Scroll */}
              <div className="h-[400px] overflow-y-auto pr-2 space-y-2">
                {loadingCurrencies ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : filteredCurrencies.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No currencies found</div>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <div
                      key={currency.ticker}
                      className={`flex items-center gap-3 p-3 bg-[#0f0f0f] border rounded-lg cursor-pointer transition-colors ${
                        currency.ticker === fromCurrency || currency.ticker === toCurrency
                          ? "border-blue-500"
                          : "border-white/5 hover:border-blue-500/50"
                      }`}
                      onClick={() => {
                        if (!exchangeData) {
                          // Toggle between from and to currency
                          if (currency.ticker !== fromCurrency && currency.ticker !== toCurrency) {
                            setFromCurrency(currency.ticker);
                          }
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!exchangeData) {
                          setToCurrency(currency.ticker);
                        }
                      }}
                    >
                      {currency.image && (
                        <img
                          src={currency.image}
                          alt={currency.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {currency.ticker.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{currency.name}</p>
                      </div>
                      <div className="text-right flex flex-col gap-1">
                        {currency.featured && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                            Featured
                          </span>
                        )}
                        {currency.isStable && (
                          <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                            Stable
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {currencies.length} EVM currencies available
              </p>
            </CardContent>
          </Card>

          {/* Middle Column - Exchange Form */}
          <Card className="bg-[#1a1a1a] border border-white/10 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl text-white">Exchange</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* From Currency */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">You Send</label>
                <div className="flex gap-2">
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="w-32 px-3 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!!exchangeData}
                  >
                    {/* Show featured currencies first */}
                    {currencies.filter((c) => c.featured).length > 0 && (
                      <optgroup label="Featured" className="bg-[#0f0f0f]">
                        {currencies
                          .filter((c) => c.featured)
                          .map((c) => (
                            <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f]">
                              {c.ticker.toUpperCase()} - {c.name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    {/* Then show all other currencies */}
                    {currencies.filter((c) => !c.featured).length > 0 && (
                      <optgroup label="All Currencies" className="bg-[#0f0f0f]">
                        {currencies
                          .filter((c) => !c.featured)
                          .map((c) => (
                            <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f]">
                              {c.ticker.toUpperCase()} - {c.name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="any"
                  />
                </div>
                {minAmount && (
                  <p className="text-xs text-gray-500 mt-1">
                    Min: {minAmount} {fromCurrency.toUpperCase()}
                    {maxAmount && ` | Max: ${maxAmount}`}
                  </p>
                )}
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwapCurrencies}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <ArrowDownUp className="w-5 h-5" />
                </Button>
              </div>

              {/* To Currency */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  You Get
                  {availableToCurrencies && (
                    <span className="ml-2 text-xs text-blue-400">
                      ({availableToCurrencies.filter(c => c.isAvailable).length} available pairs)
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="w-32 px-3 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!!exchangeData}
                  >
                    {/* If we have available currencies from API, filter by them */}
                    {availableToCurrencies ? (
                      <>
                        {/* Show available featured currencies first */}
                        {availableToCurrencies.filter((c) => c.featured && c.isAvailable).length > 0 && (
                          <optgroup label="Available - Featured" className="bg-[#0f0f0f]">
                            {availableToCurrencies
                              .filter((c) => c.featured && c.isAvailable)
                              .map((c) => (
                                <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f]">
                                  {c.ticker.toUpperCase()} - {c.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {/* Show other available currencies */}
                        {availableToCurrencies.filter((c) => !c.featured && c.isAvailable).length > 0 && (
                          <optgroup label="Available - All" className="bg-[#0f0f0f]">
                            {availableToCurrencies
                              .filter((c) => !c.featured && c.isAvailable)
                              .map((c) => (
                                <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f]">
                                  {c.ticker.toUpperCase()} - {c.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {/* Show unavailable currencies grayed out */}
                        {availableToCurrencies.filter((c) => !c.isAvailable).length > 0 && (
                          <optgroup label="Unavailable" className="bg-[#0f0f0f]">
                            {availableToCurrencies
                              .filter((c) => !c.isAvailable)
                              .map((c) => (
                                <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f] text-gray-600" disabled>
                                  {c.ticker.toUpperCase()} - {c.name} (Not available)
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Fallback to all currencies if API hasn't loaded yet */}
                        {currencies.filter((c) => c.featured).length > 0 && (
                          <optgroup label="Featured" className="bg-[#0f0f0f]">
                            {currencies
                              .filter((c) => c.featured)
                              .map((c) => (
                                <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f]">
                                  {c.ticker.toUpperCase()} - {c.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {currencies.filter((c) => !c.featured).length > 0 && (
                          <optgroup label="All Currencies" className="bg-[#0f0f0f]">
                            {currencies
                              .filter((c) => !c.featured)
                              .map((c) => (
                                <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f]">
                                  {c.ticker.toUpperCase()} - {c.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </>
                    )}
                  </select>
                  <input
                    type="number"
                    value={toAmount}
                    readOnly
                    className="flex-1 px-4 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white/70 cursor-not-allowed"
                    placeholder="0.00"
                  />
                </div>
                {transactionSpeed && (
                  <p className="text-xs text-gray-500 mt-1">Est. time: {transactionSpeed}</p>
                )}
              </div>

              {/* Rate Type Toggle */}
              <div className="p-3 bg-[#0f0f0f] border border-white/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Fixed Rate</span>
                    {fixedRateMarkets && (
                      <span className="text-xs text-blue-400">
                        ({fixedRateMarkets.filter(m =>
                          m.from === fromCurrency && m.to === toCurrency
                        ).length > 0 ? '✓ Available' : 'Not available for this pair'})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsFixedRate(!isFixedRate)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isFixedRate ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isFixedRate ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                {fixedRateMarkets && isFixedRate && (
                  <div className="mt-2 text-xs text-gray-500">
                    {(() => {
                      const market = fixedRateMarkets.find(m => m.from === fromCurrency && m.to === toCurrency);
                      return market ? (
                        <span>Min: {market.min} | Max: {market.max}</span>
                      ) : (
                        <span className="text-yellow-500">Fixed rate not available for this pair</span>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Recipient {toCurrency.toUpperCase()} Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter recipient address"
                />
              </div>

              {/* Refund Address */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Refund Address (Optional)
                </label>
                <input
                  type="text"
                  value={refundAddress}
                  onChange={(e) => setRefundAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your wallet address"
                />
              </div>

              {/* Pair Status */}
              {pairStatus === "inactive" && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">
                    ⚠️ Pair {fromCurrency.toUpperCase()}/{toCurrency.toUpperCase()} is not available.
                  </p>
                  <p className="text-xs text-red-300 mt-2">
                    Try selecting currencies from the "Featured" section in the dropdown menu.
                  </p>
                </div>
              )}

              {pairStatus === "active" && estimatedAmount && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm">
                    ✓ Rate: 1 {fromCurrency.toUpperCase()} ≈ {(estimatedAmount / parseFloat(fromAmount || "1")).toFixed(6)} {toCurrency.toUpperCase()}
                  </p>
                </div>
              )}

              {/* Create Exchange Button */}
              <Button
                onClick={handleCreateExchange}
                disabled={loading || !fromAmount || !recipientAddress || pairStatus === "inactive"}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Exchange"
                )}
              </Button>

              {error && <p className="text-red-400 text-sm">{error}</p>}
            </CardContent>
          </Card>

          {/* Right Column - Exchange Details & Tracking */}
          <Card className="bg-[#1a1a1a] border border-white/10 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl text-white">Exchange Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exchangeData ? (
                <div className="space-y-4">
                  {/* Deposit Info */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <h3 className="font-semibold text-blue-400 mb-2">Deposit Address</h3>
                    <p className="text-xs text-gray-400 mb-1">
                      Send exactly {fromAmount} {exchangeData.fromCurrency.toUpperCase()} to:
                    </p>
                    <p className="text-sm text-white break-all font-mono bg-[#0f0f0f] p-2 rounded">
                      {exchangeData.payinAddress}
                    </p>
                    {exchangeData.payinExtraId && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-400">Memo/Tag:</p>
                        <p className="text-sm text-white font-mono">{exchangeData.payinExtraId}</p>
                      </div>
                    )}
                    {fromCurrencyExplorer && (
                      <a
                        href={fromCurrencyExplorer.addressMask.replace('$$', exchangeData.payinAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Deposit Address on Explorer
                      </a>
                    )}
                    {isFromCurrencySupported() ? (
                      <>
                        {getRequiredChainId() && chain?.id !== getRequiredChainId() ? (
                          <p className="text-xs text-yellow-300 mt-3">
                            ⚠️ You're on {chain?.name}. Click "Send from Wallet" to switch to {supportedChains.find(c => c.id === getRequiredChainId())?.name} and send funds.
                          </p>
                        ) : (
                          <p className="text-xs text-blue-300 mt-3">
                            💡 Tip: Click "Send from Wallet" below to send funds directly from your connected wallet
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-yellow-300 mt-3">
                        ⚠️ Send {exchangeData.fromCurrency.toUpperCase()} from your external wallet to complete the exchange
                      </p>
                    )}
                  </div>

                  {/* Exchange ID */}
                  <div className="p-3 bg-[#0f0f0f] border border-white/10 rounded-lg">
                    <p className="text-xs text-gray-400">Exchange ID</p>
                    <p className="text-sm text-white font-mono">{exchangeData.id}</p>
                  </div>

                  {/* Expected Receive Amount */}
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-xs text-gray-400">You will receive</p>
                    <p className="text-lg font-bold text-green-400">
                      {exchangeData.amount} {exchangeData.toCurrency.toUpperCase()}
                    </p>
                  </div>

                  {/* Payout Address */}
                  <div className="p-3 bg-[#0f0f0f] border border-white/10 rounded-lg">
                    <p className="text-xs text-gray-400">At address</p>
                    <p className="text-sm text-white break-all font-mono">{exchangeData.payoutAddress}</p>
                    {toCurrencyExplorer && (
                      <a
                        href={toCurrencyExplorer.addressMask.replace('$$', exchangeData.payoutAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Payout Address on Explorer
                      </a>
                    )}
                  </div>

                  {/* Send from Wallet Button - Only show if currency is supported */}
                  {isFromCurrencySupported() ? (
                    <Button
                      onClick={handleSendFromWallet}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Send from Wallet
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-300">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        This currency/chain is not supported for direct wallet sending. Please send {exchangeData.fromCurrency.toUpperCase()} from your external wallet to the deposit address above.
                      </p>
                    </div>
                  )}

                  {/* Track Button */}
                  <Button
                    onClick={() => {
                      setTrackingId(exchangeData.id);
                      startPollingStatus(exchangeData.id);
                    }}
                    disabled={isPolling}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isPolling ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Tracking...
                      </>
                    ) : (
                      "Track Exchange"
                    )}
                  </Button>

                  {/* New Exchange Button */}
                  <Button
                    onClick={() => {
                      setExchangeData(null);
                      setTransactionStatus(null);
                      setFromAmount("");
                      setToAmount("");
                    }}
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/10"
                  >
                    New Exchange
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ArrowDownUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Create an exchange to see details</p>
                </div>
              )}

              {/* Transaction Status */}
              {transactionStatus && (
                <div className="mt-4 p-4 bg-[#0f0f0f] border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transactionStatus.status)}
                      <h3 className="font-semibold text-white capitalize">
                        {transactionStatus.status}
                      </h3>
                    </div>
                    {/* Available Actions Info */}
                    {availableActions?.available && (
                      <span className="text-xs text-green-400 px-2 py-1 bg-green-500/10 rounded">
                        Actions Available
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {transactionStatus.amountSend && transactionStatus.amountSend > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sent:</span>
                        <span className="text-white">
                          {transactionStatus.amountSend} {transactionStatus.fromCurrency.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {transactionStatus.amountReceive && transactionStatus.amountReceive > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Received:</span>
                        <span className="text-white">
                          {transactionStatus.amountReceive} {transactionStatus.toCurrency.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {transactionStatus.payinHash && (
                      <div>
                        <span className="text-gray-400 block">Deposit TX:</span>
                        <span className="text-white text-xs font-mono break-all">
                          {transactionStatus.payinHash}
                        </span>
                        {fromCurrencyExplorer && (
                          <a
                            href={fromCurrencyExplorer.txMask.replace('$$', transactionStatus.payinHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on Explorer
                          </a>
                        )}
                      </div>
                    )}
                    {transactionStatus.payoutHash && (
                      <div>
                        <span className="text-gray-400 block">Payout TX:</span>
                        <span className="text-white text-xs font-mono break-all">
                          {transactionStatus.payoutHash}
                        </span>
                        {toCurrencyExplorer && (
                          <a
                            href={toCurrencyExplorer.txMask.replace('$$', transactionStatus.payoutHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 mt-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on Explorer
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Available Actions Buttons */}
                  {availableActions?.available && (
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      <p className="text-xs text-gray-400 mb-2">Available Actions:</p>
                      {availableActions.address && (
                        <div className="space-y-2">
                          <p className="text-xs text-blue-300">
                            Refund address: <span className="font-mono">{availableActions.address}</span>
                          </p>
                          {availableActions.amount && (
                            <p className="text-xs text-blue-300">
                              Refundable amount: {availableActions.amount}
                            </p>
                          )}
                          {availableActions.currentEstimate && (
                            <p className="text-xs text-blue-300">
                              Current estimate: {availableActions.currentEstimate}
                            </p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                            onClick={() => {
                              toast({
                                title: "Refund Info",
                                description: "To request a refund, please contact ChangeNow support with your transaction ID.",
                              });
                            }}
                          >
                            Request Refund
                          </Button>
                        </div>
                      )}
                      {availableActions.additionalAddressList && availableActions.additionalAddressList.length > 0 && (
                        <div>
                          <p className="text-xs text-green-300 mb-1">
                            Additional addresses available for push:
                          </p>
                          <div className="text-xs font-mono text-gray-400 space-y-1">
                            {availableActions.additionalAddressList.map((addr, idx) => (
                              <div key={idx} className="break-all">{addr}</div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 border-green-500/50 text-green-400 hover:bg-green-500/10"
                            onClick={() => {
                              toast({
                                title: "Push Transaction Info",
                                description: "To push the transaction to a different address, please contact ChangeNow support.",
                              });
                            }}
                          >
                            Push to Different Address
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Track Section */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3">Track Existing Exchange</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter transaction ID"
                  />
                  <Button
                    onClick={handleTrackTransaction}
                    disabled={loading || !trackingId}
                    size="sm"
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Track
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
