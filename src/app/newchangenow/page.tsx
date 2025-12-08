"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { RefreshCw, ArrowDownUp, Wallet, Search, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";
import Navbar from "@/Components/NewDesign/Dashboard/Navbar/Navbar";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/NewDesign/Dashboard/Card/Card";
import { useNewChangeNowHook, NETWORK_NAME_MAP, networkToChainId, toChangeNowNetwork } from "@/hooks/useNewChangeNowHook";
import { useToast } from "@/hooks/use-toast";
import { supportedChains } from "@/contexts/CustomWagmiProvider";
import {
  ChangeNowCurrencyV2,
  TransactionStatusResponseV2,
  CreateExchangeResponseV2,
  EstimatedAmountResponseV2,
  ExchangeRangeResponseV2,
} from "@/types/changenow";

// Get unique networks from our supported chains
const SUPPORTED_NETWORKS = Object.entries(NETWORK_NAME_MAP).reduce((acc, [name, network]) => {
  if (!acc.find(n => n.network === network)) {
    acc.push({ name: name.charAt(0).toUpperCase() + name.slice(1), network });
  }
  return acc;
}, [] as { name: string; network: string }[]);

export default function NewChangeNowPage() {
  const { address, isConnected, chain } = useAccount();
  const { toast } = useToast();
  const { switchChainAsync } = useSwitchChain();

  const {
    loading,
    error,
    getCurrencies,
    getEVMCurrencies,
    getAvailablePairs,
    getMinAmount,
    getExchangeRange,
    getEstimatedAmount,
    getTransactionStatus,
    validateAddress,
    createExchange,
    sendToDepositAddress,
    executeExchange,
  } = useNewChangeNowHook();

  // Currencies state - separate for FROM (EVM only) and TO (all networks)
  const [fromCurrencies, setFromCurrencies] = useState<ChangeNowCurrencyV2[]>([]); // EVM only
  const [toCurrencies, setToCurrencies] = useState<ChangeNowCurrencyV2[]>([]); // All networks (including non-EVM)
  const [currencySearch, setCurrencySearch] = useState("");
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);

  // Exchange form state - V2 uses separate currency and network
  const [fromCurrency, setFromCurrency] = useState("usdt");
  const [fromNetwork, setFromNetwork] = useState("matic"); // polygon
  const [toCurrency, setToCurrency] = useState("usdc");
  const [toNetwork, setToNetwork] = useState("arbitrum");
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
  const [depositFee, setDepositFee] = useState<number | null>(null);
  const [withdrawalFee, setWithdrawalFee] = useState<number | null>(null);

  // Transaction state
  const [exchangeData, setExchangeData] = useState<CreateExchangeResponseV2 | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatusResponseV2 | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [isPolling, setIsPolling] = useState(false);

  // Load currencies on mount
  useEffect(() => {
    fetchCurrencies();
  }, []);

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
  }, [fromAmount, fromCurrency, fromNetwork, toCurrency, toNetwork, isFixedRate]);

  // Fetch min/max when currencies or networks change
  useEffect(() => {
    if (fromCurrency && toCurrency && fromNetwork && toNetwork) {
      fetchExchangeRange();
    }
  }, [fromCurrency, fromNetwork, toCurrency, toNetwork, isFixedRate]);

  const fetchCurrencies = async () => {
    setLoadingCurrencies(true);

    // Fetch EVM currencies for FROM (user sends from EVM wallet)
    const evmData = await getEVMCurrencies({ active: true });
    if (evmData) {
      setFromCurrencies(evmData);
      console.log(`[V2] Loaded ${evmData.length} EVM currencies for FROM`);
    }

    // Fetch ALL currencies for TO (cross-chain support - BTC, ZEC, SOL, etc.)
    const allData = await getCurrencies({ active: true });
    if (allData) {
      setToCurrencies(allData);
      console.log(`[V2] Loaded ${allData.length} total currencies for TO`);
    }

    setLoadingCurrencies(false);
  };

  const fetchExchangeRange = async () => {
    setPairStatus(null);
    setDepositFee(null);
    setWithdrawalFee(null);

    const rangeData = await getExchangeRange({
      fromCurrency,
      toCurrency,
      fromNetwork,
      toNetwork,
      flow: isFixedRate ? "fixed-rate" : "standard",
    });

    if (rangeData) {
      setMinAmount(rangeData.minAmount);
      setMaxAmount(rangeData.maxAmount);
      setPairStatus("active");
      console.log(`[V2] Range for ${fromCurrency}/${fromNetwork} → ${toCurrency}/${toNetwork}:`, rangeData);
    } else {
      setMinAmount(null);
      setMaxAmount(null);
      setPairStatus("inactive");
      setToAmount("");
      setEstimatedAmount(null);
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

    // Check minimum amount before calling API
    if (minAmount && amount < minAmount) {
      setToAmount("");
      setEstimatedAmount(null);
      console.log(`[V2] Amount ${amount} is below minimum ${minAmount}`);
      return;
    }

    console.log(`[V2] Fetching estimate: ${fromCurrency}/${fromNetwork} → ${toCurrency}/${toNetwork}, amount: ${amount}`);

    const data = await getEstimatedAmount({
      fromCurrency,
      toCurrency,
      fromNetwork,
      toNetwork,
      fromAmount: amount,
      flow: isFixedRate ? "fixed-rate" : "standard",
      type: "direct",
      useRateId: isFixedRate,
    });

    if (data) {
      setEstimatedAmount(data.toAmount);
      setToAmount(data.toAmount.toString());
      setTransactionSpeed(data.transactionSpeedForecast);
      setRateId(data.rateId);
      setDepositFee(data.depositFee);
      setWithdrawalFee(data.withdrawalFee);
      setPairStatus("active");
      console.log(`[V2] Estimate result:`, data);
    } else {
      setToAmount("");
      setEstimatedAmount(null);
      if (!minAmount) {
        setPairStatus("inactive");
      }
    }
  };

  const handleSwapCurrencies = () => {
    const tempCurrency = fromCurrency;
    const tempNetwork = fromNetwork;
    setFromCurrency(toCurrency);
    setFromNetwork(toNetwork);
    setToCurrency(tempCurrency);
    setToNetwork(tempNetwork);
    setFromAmount("");
    setToAmount("");
    setEstimatedAmount(null);
  };

  const handleCreateExchange = async () => {
    if (pairStatus === "inactive") {
      toast({
        title: "Pair Inactive",
        description: `The pair ${fromCurrency.toUpperCase()}/${fromNetwork} → ${toCurrency.toUpperCase()}/${toNetwork} is not available.`,
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
      const result = await createExchange({
        fromCurrency,
        toCurrency,
        fromNetwork,
        toNetwork,
        fromAmount: amount,
        address: recipientAddress,
        refundAddress: refundAddress || undefined,
        flow: isFixedRate ? "fixed-rate" : "standard",
        type: "direct",
        ...(isFixedRate && rateId ? { rateId } : {}),
      });

      if (result) {
        setExchangeData(result);
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
    }
  };

  const startPollingStatus = async (id: string) => {
    setIsPolling(true);

    const pollInterval = setInterval(async () => {
      const status = await getTransactionStatus(id);
      if (status) {
        setTransactionStatus(status);

        if (["finished", "failed", "refunded", "expired"].includes(status.status)) {
          clearInterval(pollInterval);
          setIsPolling(false);
        }
      }
    }, 10000);

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
      // Get the chain ID for the fromNetwork
      const requiredChainId = networkToChainId(exchangeData.fromNetwork);

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
        parseFloat(fromAmount),
        exchangeData.fromCurrency,
        exchangeData.fromNetwork
      );

      if (result.success) {
        toast({
          title: "Transaction Sent",
          description: "Funds sent successfully! Your exchange will complete in a few minutes.",
        });

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
    const chainId = networkToChainId(exchangeData.fromNetwork);
    return chainId !== null && supportedChains.some(c => c.id === chainId);
  };

  // Get unique currencies for FROM dropdown (EVM only)
  const getUniqueFromCurrencies = () => {
    const uniqueMap = new Map<string, ChangeNowCurrencyV2>();
    fromCurrencies.forEach(c => {
      if (!uniqueMap.has(c.ticker)) {
        uniqueMap.set(c.ticker, c);
      }
    });
    return Array.from(uniqueMap.values());
  };

  // Get unique currencies for TO dropdown (ALL networks including non-EVM)
  const getUniqueToCurrencies = () => {
    const uniqueMap = new Map<string, ChangeNowCurrencyV2>();
    toCurrencies.forEach(c => {
      if (!uniqueMap.has(c.ticker)) {
        uniqueMap.set(c.ticker, c);
      }
    });
    return Array.from(uniqueMap.values());
  };

  // Get available networks for FROM currency (EVM only)
  const getNetworksForFromCurrency = (ticker: string) => {
    return fromCurrencies
      .filter(c => c.ticker.toLowerCase() === ticker.toLowerCase())
      .map(c => ({ network: c.network, name: c.name }));
  };

  // Get available networks for TO currency (ALL networks)
  const getNetworksForToCurrency = (ticker: string) => {
    return toCurrencies
      .filter(c => c.ticker.toLowerCase() === ticker.toLowerCase())
      .map(c => ({ network: c.network, name: c.name }));
  };

  // Filter currencies for the left sidebar (show FROM currencies - EVM only)
  const filteredFromCurrencies = fromCurrencies.filter(
    (c) =>
      c.ticker.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.network.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const uniqueFromCurrencies = getUniqueFromCurrencies();
  const uniqueToCurrencies = getUniqueToCurrencies();

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Card className="bg-[#1a1a1a] border border-white/10 p-8 text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold mb-2 text-white">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-4">
              Please connect your wallet to access ChangeNow V2 exchange
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ChangeNow V2 Exchange</h1>
          <p className="text-gray-400">V2 API with accurate minimum amounts & separate network selection</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Currencies List */}
          <Card className="bg-[#1a1a1a] border border-white/10 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white">FROM Currencies (EVM)</CardTitle>
                <p className="text-xs text-green-400 mt-1">Click to select as FROM token</p>
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
                  placeholder="Search currencies or networks..."
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Currencies List with Scroll - Shows FROM currencies (EVM only) */}
              <div className="h-[400px] overflow-y-auto pr-2 space-y-2">
                {loadingCurrencies ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : filteredFromCurrencies.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No currencies found</div>
                ) : (
                  filteredFromCurrencies.slice(0, 100).map((currency, index) => (
                    <div
                      key={`${currency.ticker}-${currency.network}-${index}`}
                      className={`flex items-center gap-3 p-3 bg-[#0f0f0f] border rounded-lg cursor-pointer transition-colors ${
                        currency.ticker === fromCurrency && currency.network === fromNetwork
                          ? "border-blue-500"
                          : "border-white/5 hover:border-blue-500/50"
                      }`}
                      onClick={() => {
                        if (!exchangeData) {
                          setFromCurrency(currency.ticker);
                          setFromNetwork(currency.network);
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
                        <p className="text-xs text-blue-400 truncate">Network: {currency.network}</p>
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
                {fromCurrencies.length} EVM currencies (FROM) | {toCurrencies.length} total (TO)
              </p>
            </CardContent>
          </Card>

          {/* Middle Column - Exchange Form */}
          <Card className="bg-[#1a1a1a] border border-white/10 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl text-white">Exchange (V2)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* From Currency & Network */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">You Send</label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={fromCurrency}
                    onChange={(e) => {
                      setFromCurrency(e.target.value);
                      // Auto-select first available network for this currency (EVM only)
                      const networks = getNetworksForFromCurrency(e.target.value);
                      if (networks.length > 0) {
                        setFromNetwork(networks[0].network);
                      }
                    }}
                    className="w-28 px-3 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!!exchangeData}
                  >
                    {uniqueFromCurrencies.filter(c => c.featured).length > 0 && (
                      <optgroup label="Featured" className="bg-[#0f0f0f]">
                        {uniqueFromCurrencies
                          .filter(c => c.featured)
                          .map(c => (
                            <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f]">
                              {c.ticker.toUpperCase()}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    <optgroup label="All EVM" className="bg-[#0f0f0f]">
                      {uniqueFromCurrencies
                        .filter(c => !c.featured)
                        .slice(0, 50)
                        .map(c => (
                          <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f]">
                            {c.ticker.toUpperCase()}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <select
                    value={fromNetwork}
                    onChange={(e) => setFromNetwork(e.target.value)}
                    className="w-28 px-3 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!!exchangeData}
                  >
                    {getNetworksForFromCurrency(fromCurrency).map(n => (
                      <option key={n.network} value={n.network} className="bg-[#0f0f0f]">
                        {n.network}
                      </option>
                    ))}
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
                  <p className="text-xs text-gray-500">
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

              {/* To Currency & Network - ALL networks including non-EVM (BTC, ZEC, SOL, etc.) */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">You Get (All Networks)</label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={toCurrency}
                    onChange={(e) => {
                      setToCurrency(e.target.value);
                      // Auto-select first available network for this currency (ALL networks)
                      const networks = getNetworksForToCurrency(e.target.value);
                      if (networks.length > 0) {
                        setToNetwork(networks[0].network);
                      }
                    }}
                    className="w-28 px-3 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!!exchangeData}
                  >
                    {uniqueToCurrencies.filter(c => c.featured).length > 0 && (
                      <optgroup label="Featured" className="bg-[#0f0f0f]">
                        {uniqueToCurrencies
                          .filter(c => c.featured)
                          .map(c => (
                            <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f]">
                              {c.ticker.toUpperCase()}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    <optgroup label="All Networks" className="bg-[#0f0f0f]">
                      {uniqueToCurrencies
                        .filter(c => !c.featured)
                        .slice(0, 100)
                        .map(c => (
                          <option key={c.ticker} value={c.ticker} className="bg-[#0f0f0f]">
                            {c.ticker.toUpperCase()}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <select
                    value={toNetwork}
                    onChange={(e) => setToNetwork(e.target.value)}
                    className="w-28 px-3 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!!exchangeData}
                  >
                    {getNetworksForToCurrency(toCurrency).map(n => (
                      <option key={n.network} value={n.network} className="bg-[#0f0f0f]">
                        {n.network}
                      </option>
                    ))}
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
                  <p className="text-xs text-gray-500">Est. time: {transactionSpeed}</p>
                )}
              </div>

              {/* Fee Info - V2 shows fees! */}
              {(depositFee !== null || withdrawalFee !== null) && (
                <div className="p-3 bg-[#0f0f0f] border border-white/10 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Fees (V2):</p>
                  <div className="flex justify-between text-xs">
                    {depositFee !== null && (
                      <span className="text-gray-300">Deposit: {depositFee} {fromCurrency.toUpperCase()}</span>
                    )}
                    {withdrawalFee !== null && (
                      <span className="text-gray-300">Withdrawal: {withdrawalFee} {toCurrency.toUpperCase()}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Rate Type Toggle */}
              <div className="p-3 bg-[#0f0f0f] border border-white/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Fixed Rate</span>
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
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Recipient {toCurrency.toUpperCase()} Address ({toNetwork})
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
                    Pair {fromCurrency.toUpperCase()}/{fromNetwork} → {toCurrency.toUpperCase()}/{toNetwork} is not available.
                  </p>
                </div>
              )}

              {pairStatus === "active" && estimatedAmount && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm">
                    Rate: 1 {fromCurrency.toUpperCase()} ≈ {(estimatedAmount / parseFloat(fromAmount || "1")).toFixed(6)} {toCurrency.toUpperCase()}
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
                      Send exactly {fromAmount} {exchangeData.fromCurrency.toUpperCase()} ({exchangeData.fromNetwork}) to:
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
                    {isFromCurrencySupported() ? (
                      <p className="text-xs text-blue-300 mt-3">
                        Click "Send from Wallet" below to send funds directly
                      </p>
                    ) : (
                      <p className="text-xs text-yellow-300 mt-3">
                        Send {exchangeData.fromCurrency.toUpperCase()} from your external wallet
                      </p>
                    )}
                  </div>

                  {/* Exchange ID */}
                  <div className="p-3 bg-[#0f0f0f] border border-white/10 rounded-lg">
                    <p className="text-xs text-gray-400">Exchange ID</p>
                    <p className="text-sm text-white font-mono">{exchangeData.id}</p>
                  </div>

                  {/* Network Info - V2 shows networks! */}
                  <div className="p-3 bg-[#0f0f0f] border border-white/10 rounded-lg">
                    <p className="text-xs text-gray-400">Networks</p>
                    <p className="text-sm text-white">
                      {exchangeData.fromNetwork} → {exchangeData.toNetwork}
                    </p>
                  </div>

                  {/* Expected Receive Amount */}
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-xs text-gray-400">You will receive</p>
                    <p className="text-lg font-bold text-green-400">
                      {exchangeData.toAmount} {exchangeData.toCurrency.toUpperCase()}
                    </p>
                  </div>

                  {/* Payout Address */}
                  <div className="p-3 bg-[#0f0f0f] border border-white/10 rounded-lg">
                    <p className="text-xs text-gray-400">At address ({exchangeData.toNetwork})</p>
                    <p className="text-sm text-white break-all font-mono">{exchangeData.payoutAddress}</p>
                  </div>

                  {/* Send from Wallet Button */}
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
                        Send {exchangeData.fromCurrency.toUpperCase()} from your external wallet to the deposit address.
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
                    {transactionStatus.actionsAvailable && (
                      <span className="text-xs text-green-400 px-2 py-1 bg-green-500/10 rounded">
                        Actions Available
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {transactionStatus.amountFrom && transactionStatus.amountFrom > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sent:</span>
                        <span className="text-white">
                          {transactionStatus.amountFrom} {transactionStatus.fromCurrency.toUpperCase()} ({transactionStatus.fromNetwork})
                        </span>
                      </div>
                    )}
                    {transactionStatus.amountTo && transactionStatus.amountTo > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Received:</span>
                        <span className="text-white">
                          {transactionStatus.amountTo} {transactionStatus.toCurrency.toUpperCase()} ({transactionStatus.toNetwork})
                        </span>
                      </div>
                    )}
                    {transactionStatus.payinHash && (
                      <div>
                        <span className="text-gray-400 block">Deposit TX:</span>
                        <span className="text-white text-xs font-mono break-all">
                          {transactionStatus.payinHash}
                        </span>
                      </div>
                    )}
                    {transactionStatus.payoutHash && (
                      <div>
                        <span className="text-gray-400 block">Payout TX:</span>
                        <span className="text-white text-xs font-mono break-all">
                          {transactionStatus.payoutHash}
                        </span>
                      </div>
                    )}
                  </div>
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
