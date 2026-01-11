"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  RefreshCw,
  Wallet,
  ArrowDownUp,
  ArrowUpDown,
  Coins,
  TrendingUp,
  BarChart3,
  Send,
  Download,
  Upload,
  Percent,
  Gift,
  Layers,
  Activity,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/Components/NewDesign/Dashboard/Navbar/Navbar";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/NewDesign/Dashboard/Card/Card";
import { useMantleHook, MANTLE_TOKENS, CHAIN_IDS, MANTLE_CONFIG, L1_CONTRACTS, L2_CONTRACTS } from "@/hooks/useMantleHook";
import { useLendleHook, LENDLE_ASSETS, INTEREST_RATE_MODE } from "@/hooks/useLendleHook";
import { useFusionXHook, FUSIONX_TOKENS, FEE_TIERS, type LPHistoryResponse } from "@/hooks/useFusionXHook";
import { useToast } from "@/hooks/use-toast";
import { useSwitchChain } from "wagmi";
import { type Address } from "viem";

type TabType = "bridge" | "lendle" | "fusionx";
type FeeTier = 100 | 500 | 3000 | 10000;
type NetworkType = "testnet" | "mainnet";

// Network Configuration - Easy to switch between testnet and mainnet
const NETWORK_CONFIG = {
  testnet: {
    name: "Sepolia Testnet",
    l1ChainId: CHAIN_IDS.sepolia,
    l2ChainId: CHAIN_IDS.mantleSepolia,
    l1Name: "Sepolia",
    l2Name: "Mantle Sepolia",
    l1Contracts: L1_CONTRACTS.testnet,
    l2Contracts: L2_CONTRACTS.testnet,
    config: MANTLE_CONFIG.testnet,
    tokens: MANTLE_TOKENS.testnet,
    explorerL1: "https://sepolia.etherscan.io",
    explorerL2: "https://sepolia.mantlescan.xyz",
    faucet: "https://faucet.sepolia.mantle.xyz",
  },
  mainnet: {
    name: "Mainnet",
    l1ChainId: CHAIN_IDS.ethereum,
    l2ChainId: CHAIN_IDS.mantle,
    l1Name: "Ethereum",
    l2Name: "Mantle",
    l1Contracts: L1_CONTRACTS.mainnet,
    l2Contracts: L2_CONTRACTS.mainnet,
    config: MANTLE_CONFIG.mainnet,
    tokens: MANTLE_TOKENS.mainnet,
    explorerL1: "https://etherscan.io",
    explorerL2: "https://mantlescan.xyz",
    faucet: null,
  },
} as const;

export default function MantlePage() {
  const { address, isConnected, chain } = useAccount();
  const { toast } = useToast();
  const { switchChainAsync } = useSwitchChain();
  const [activeTab, setActiveTab] = useState<TabType>("bridge");

  // Network State - Default to testnet for safety
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("testnet");
  const networkConfig = NETWORK_CONFIG[selectedNetwork];

  // Hooks
  const mantleHook = useMantleHook();
  const lendleHook = useLendleHook();
  const fusionXHook = useFusionXHook();

  // Detect current network from chain
  const currentNetworkType: NetworkType | null =
    chain?.id === CHAIN_IDS.sepolia || chain?.id === CHAIN_IDS.mantleSepolia ? "testnet" :
    chain?.id === CHAIN_IDS.ethereum || chain?.id === CHAIN_IDS.mantle ? "mainnet" : null;

  const isOnL1 = chain?.id === networkConfig.l1ChainId;
  const isOnL2 = chain?.id === networkConfig.l2ChainId;
  const isOnCorrectNetwork = isOnL1 || isOnL2;

  // Network switching handler
  const handleNetworkSwitch = async (network: NetworkType) => {
    setSelectedNetwork(network);
    const config = NETWORK_CONFIG[network];

    // If user is connected, switch to L2 of the selected network
    if (isConnected && chain?.id !== config.l2ChainId) {
      try {
        await switchChainAsync({ chainId: config.l2ChainId });
        toast({
          title: "Network Switched",
          description: `Switched to ${config.l2Name}`,
        });
      } catch (err: any) {
        toast({
          title: "Switch Failed",
          description: `Please manually switch to ${config.l2Name}`,
          variant: "destructive",
        });
      }
    }
  };

  // Switch to L1 for deposits
  const switchToL1 = async () => {
    try {
      await switchChainAsync({ chainId: networkConfig.l1ChainId });
      toast({ title: "Switched", description: `Now on ${networkConfig.l1Name}` });
    } catch (err) {
      toast({ title: "Failed", description: `Please switch to ${networkConfig.l1Name}`, variant: "destructive" });
    }
  };

  // Switch to L2 for withdrawals/DeFi
  const switchToL2 = async () => {
    try {
      await switchChainAsync({ chainId: networkConfig.l2ChainId });
      toast({ title: "Switched", description: `Now on ${networkConfig.l2Name}` });
    } catch (err) {
      toast({ title: "Failed", description: `Please switch to ${networkConfig.l2Name}`, variant: "destructive" });
    }
  };

  // Bridge States
  const [bridgeAction, setBridgeAction] = useState<"deposit" | "withdraw">("deposit");
  const [bridgeAsset, setBridgeAsset] = useState<"MNT" | "ETH">("MNT");
  const [bridgeAmount, setBridgeAmount] = useState("");
  const [mntBalances, setMntBalances] = useState<{ l1Balance: string; l2Balance: string } | null>(null);
  const [ethBalances, setEthBalances] = useState<{ l1Balance: string; l2Balance: string } | null>(null);
  const [gasPriceInfo, setGasPriceInfo] = useState<any>(null);
  const [wrapAmount, setWrapAmount] = useState("");
  const [wrapAction, setWrapAction] = useState<"wrap" | "unwrap">("wrap");

  // Lendle States
  const [lendleAction, setLendleAction] = useState<"deposit" | "withdraw" | "borrow" | "repay">("deposit");
  const [lendleAsset, setLendleAsset] = useState<string>(LENDLE_ASSETS.WMNT);
  const [lendleAmount, setLendleAmount] = useState("");
  const [interestRateMode, setInterestRateMode] = useState<1 | 2>(2); // Variable by default
  const [userAccountData, setUserAccountData] = useState<any>(null);
  const [reserveData, setReserveData] = useState<any>(null);
  const [allReserves, setAllReserves] = useState<any[]>([]);
  const [stakeLendAmount, setStakeLendAmount] = useState("");
  const [withdrawLendAmount, setWithdrawLendAmount] = useState("");
  const [stakingInfo, setStakingInfo] = useState<any>(null);
  const [userPositions, setUserPositions] = useState<any[]>([]); // User's deposited/borrowed positions
  const [reserveConfig, setReserveConfig] = useState<any>(null); // Reserve config for stable rate check
  const [lendBalance, setLendBalance] = useState<{ balance: string; balanceRaw: bigint } | null>(null); // LEND token balance

  // FusionX States
  const [fusionAction, setFusionAction] = useState<"swap" | "liquidity">("swap");
  const [swapVersion, setSwapVersion] = useState<"v2" | "v3">("v2");
  const [tokenIn, setTokenIn] = useState<string>(FUSIONX_TOKENS.WMNT);
  const [tokenOut, setTokenOut] = useState<string>(FUSIONX_TOKENS.USDC);
  const [swapAmountIn, setSwapAmountIn] = useState("");
  const [swapAmountOut, setSwapAmountOut] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [v3Fee, setV3Fee] = useState<FeeTier>(FEE_TIERS.MEDIUM);
  const [v2PairInfo, setV2PairInfo] = useState<any>(null);
  const [v3PoolInfo, setV3PoolInfo] = useState<any>(null);
  const [userV3Positions, setUserV3Positions] = useState<any[]>([]);
  const [v2LpBalance, setV2LpBalance] = useState<string>("0");
  const [lpHistory, setLpHistory] = useState<LPHistoryResponse | null>(null);
  const [lpAmountA, setLpAmountA] = useState("");
  const [lpAmountB, setLpAmountB] = useState("");
  const [removeLpAmount, setRemoveLpAmount] = useState("");

  // Fetch initial data
  useEffect(() => {
    if (address) {
      fetchBridgeData();
      fetchLendleData();
      fetchFusionXData();
    }
  }, [address]);

  // Refetch bridge data when selectedNetwork changes
  useEffect(() => {
    if (address) {
      fetchBridgeData();
    }
  }, [selectedNetwork]);

  // Fetch reserve config when asset changes (for stable rate check)
  useEffect(() => {
    const fetchReserveConfig = async () => {
      if (lendleAsset) {
        const [reserve, config] = await Promise.all([
          lendleHook.getReserveData(lendleAsset as Address),
          lendleHook.getReserveConfigData(lendleAsset as Address),
        ]);
        setReserveData(reserve);
        setReserveConfig(config);
        // Reset to variable if stable is not supported
        if (config && !config.stableBorrowRateEnabled && interestRateMode === 1) {
          setInterestRateMode(2);
        }
      }
    };
    fetchReserveConfig();
  }, [lendleAsset]);

  // Bridge data fetching - pass selectedNetwork to get correct balances
  const fetchBridgeData = async () => {
    const [mnt, eth, gas] = await Promise.all([
      mantleHook.getMNTBalances(selectedNetwork),
      mantleHook.getETHBalances(selectedNetwork),
      mantleHook.getGasPriceInfo(),
    ]);
    setMntBalances(mnt);
    setEthBalances(eth);
    setGasPriceInfo(gas);
  };

  // Lendle data fetching
  const fetchLendleData = async () => {
    const [account, reserves, staking, lendBal] = await Promise.all([
      lendleHook.getUserAccountData(),
      lendleHook.getAllReserves(),
      lendleHook.getStakingInfo(),
      lendleHook.getLendBalance(),
    ]);
    setUserAccountData(account);
    setAllReserves(reserves);
    setStakingInfo(staking);
    setLendBalance(lendBal);

    if (lendleAsset) {
      const [reserve, config] = await Promise.all([
        lendleHook.getReserveData(lendleAsset as Address),
        lendleHook.getReserveConfigData(lendleAsset as Address),
      ]);
      setReserveData(reserve);
      setReserveConfig(config);
    }

    // Fetch user positions for each supported asset
    const assetAddresses = [
      { address: LENDLE_ASSETS.WMNT, symbol: "WMNT" },
      { address: LENDLE_ASSETS.WETH, symbol: "WETH" },
      { address: LENDLE_ASSETS.USDC, symbol: "USDC" },
      { address: LENDLE_ASSETS.USDT, symbol: "USDT" },
      { address: LENDLE_ASSETS.METH, symbol: "mETH" },
      { address: LENDLE_ASSETS.WBTC, symbol: "WBTC" },
    ];

    const positions = await Promise.all(
      assetAddresses.map(async (asset) => {
        const userData = await lendleHook.getUserReserveData(asset.address as Address);
        if (userData && (parseFloat(userData.currentATokenBalance) > 0 ||
            parseFloat(userData.currentVariableDebt) > 0 ||
            parseFloat(userData.currentStableDebt) > 0)) {
          return {
            symbol: asset.symbol,
            address: asset.address,
            deposited: userData.currentATokenBalance,
            variableDebt: userData.currentVariableDebt,
            stableDebt: userData.currentStableDebt,
            isCollateral: userData.usageAsCollateralEnabled,
          };
        }
        return null;
      })
    );

    setUserPositions(positions.filter(p => p !== null));
  };

  // FusionX data fetching
  const fetchFusionXData = async () => {
    const [v2Info, v3Info, positions, lpBalance, history] = await Promise.all([
      fusionXHook.getV2PairInfo(tokenIn as Address, tokenOut as Address),
      fusionXHook.getV3PoolInfo(tokenIn as Address, tokenOut as Address, v3Fee),
      fusionXHook.getUserV3Positions(),
      fusionXHook.getV2LPBalance(tokenIn as Address, tokenOut as Address),
      fusionXHook.getUserLPHistory(),
    ]);

    setV2PairInfo(v2Info);
    setV3PoolInfo(v3Info);
    setUserV3Positions(positions);
    setV2LpBalance(lpBalance?.balance || "0");
    setLpHistory(history);
  };

  // Get quote when swap inputs change
  useEffect(() => {
    const getQuote = async () => {
      if (swapAmountIn && parseFloat(swapAmountIn) > 0) {
        const quote = await fusionXHook.getV2Quote(swapAmountIn, [tokenIn as Address, tokenOut as Address]);
        if (quote) {
          setSwapAmountOut(quote.amountOut);
        }
      }
    };
    const timer = setTimeout(getQuote, 500);
    return () => clearTimeout(timer);
  }, [swapAmountIn, tokenIn, tokenOut]);

  // Auto-calculate optimal Token B amount based on pool ratio when Token A amount changes
  // useEffect(() => {
  //   if (lpAmountA && parseFloat(lpAmountA) > 0 && v2PairInfo && swapVersion === "v2") {
  //     const amountA = parseFloat(lpAmountA);
  //     const reserve0 = parseFloat(v2PairInfo.reserve0);
  //     const reserve1 = parseFloat(v2PairInfo.reserve1);

  //     if (reserve0 > 0 && reserve1 > 0) {
  //       // Check token order - v2PairInfo.token0 and token1 might be different from tokenIn/tokenOut
  //       const isTokenInToken0 = v2PairInfo.token0.toLowerCase() === tokenIn.toLowerCase();

  //       let optimalAmountB: number;
  //       if (isTokenInToken0) {
  //         // tokenIn is token0, so calculate token1 amount
  //         optimalAmountB = (amountA * reserve1) / reserve0;
  //       } else {
  //         // tokenIn is token1, so calculate token0 amount
  //         optimalAmountB = (amountA * reserve0) / reserve1;
  //       }

  //       setLpAmountB(optimalAmountB.toFixed(8));
  //     }
  //   }
  // }, [lpAmountA, v2PairInfo, tokenIn, tokenOut, swapVersion]);

  // ========================================
  // BRIDGE HANDLERS
  // ========================================

  const handleBridgeOperation = async () => {
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    let result;
    if (bridgeAction === "deposit") {
      if (bridgeAsset === "MNT") {
        result = await mantleHook.depositMNT({ amount: bridgeAmount });
      } else {
        result = await mantleHook.depositETH({ amount: bridgeAmount });
      }
    } else {
      if (bridgeAsset === "MNT") {
        result = await mantleHook.withdrawMNT({ amount: bridgeAmount });
      } else {
        result = await mantleHook.withdrawETH({ amount: bridgeAmount });
      }
    }

    if (result.success) {
      toast({ title: "Success", description: result.message });
      setBridgeAmount("");
      fetchBridgeData();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleWrapOperation = async () => {
    if (!wrapAmount || parseFloat(wrapAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const result = wrapAction === "wrap"
      ? await mantleHook.wrapMNT(wrapAmount)
      : await mantleHook.unwrapMNT(wrapAmount);

    if (result.success) {
      toast({ title: "Success", description: result.message });
      setWrapAmount("");
      fetchBridgeData();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  // ========================================
  // LENDLE HANDLERS
  // ========================================

  const handleLendleOperation = async () => {
    if (!lendleAmount || parseFloat(lendleAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    let result;
    switch (lendleAction) {
      case "deposit":
        if (lendleAsset === LENDLE_ASSETS.WMNT) {
          result = await lendleHook.depositMNT(lendleAmount);
        } else {
          result = await lendleHook.deposit({ asset: lendleAsset as Address, amount: lendleAmount });
        }
        break;
      case "withdraw":
        if (lendleAsset === LENDLE_ASSETS.WMNT) {
          result = await lendleHook.withdrawMNT(lendleAmount);
        } else {
          result = await lendleHook.withdraw({ asset: lendleAsset as Address, amount: lendleAmount });
        }
        break;
      case "borrow":
        if (lendleAsset === LENDLE_ASSETS.WMNT) {
          result = await lendleHook.borrowMNT(lendleAmount, interestRateMode);
        } else {
          result = await lendleHook.borrow({
            asset: lendleAsset as Address,
            amount: lendleAmount,
            interestRateMode
          });
        }
        break;
      case "repay":
        if (lendleAsset === LENDLE_ASSETS.WMNT) {
          result = await lendleHook.repayMNT(lendleAmount, interestRateMode);
        } else {
          result = await lendleHook.repay({
            asset: lendleAsset as Address,
            amount: lendleAmount,
            rateMode: interestRateMode
          });
        }
        break;
    }

    if (result?.success) {
      toast({ title: "Success", description: result.message });
      setLendleAmount("");
      fetchLendleData();
    } else {
      toast({ title: "Error", description: result?.message || "Operation failed", variant: "destructive" });
    }
  };

  const handleStakeLEND = async () => {
    if (!stakeLendAmount || parseFloat(stakeLendAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const result = await lendleHook.stakeLEND(stakeLendAmount, false);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setStakeLendAmount("");
      fetchLendleData();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleClaimStakingRewards = async () => {
    const result = await lendleHook.claimStakingRewards();
    if (result.success) {
      toast({ title: "Success", description: result.message });
      fetchLendleData();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleWithdrawStakedLEND = async () => {
    if (!withdrawLendAmount || parseFloat(withdrawLendAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const result = await lendleHook.withdrawStakedLEND(withdrawLendAmount);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setWithdrawLendAmount("");
      fetchLendleData();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  // ========================================
  // FUSIONX HANDLERS
  // ========================================

  const handleSwap = async () => {
    if (!swapAmountIn || parseFloat(swapAmountIn) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const slippageBps = parseFloat(slippage) / 100;
    const minOut = (parseFloat(swapAmountOut) * (1 - slippageBps)).toString();

    let result;
    if (swapVersion === "v2") {
      // Check if swapping from/to native MNT
      if (tokenIn === FUSIONX_TOKENS.WMNT) {
        result = await fusionXHook.swapExactMNTForTokens({
          amountIn: swapAmountIn,
          amountOutMin: minOut,
          tokenOut: tokenOut as Address,
        });
      } else if (tokenOut === FUSIONX_TOKENS.WMNT) {
        result = await fusionXHook.swapExactTokensForMNT({
          tokenIn: tokenIn as Address,
          amountIn: swapAmountIn,
          amountOutMin: minOut,
        });
      } else {
        result = await fusionXHook.swapExactTokensForTokens({
          amountIn: swapAmountIn,
          amountOutMin: minOut,
          path: [tokenIn as Address, tokenOut as Address],
        });
      }
    } else {
      result = await fusionXHook.v3SwapExactInputSingle({
        tokenIn: tokenIn as Address,
        tokenOut: tokenOut as Address,
        fee: v3Fee,
        amountIn: swapAmountIn,
        amountOutMinimum: minOut,
      });
    }

    if (result.success) {
      toast({ title: "Swap Successful", description: result.message });
      setSwapAmountIn("");
      setSwapAmountOut("");
      fetchFusionXData();
    } else {
      toast({ title: "Swap Failed", description: result.message, variant: "destructive" });
    }
  };

  const handleAddLiquidity = async () => {
    if (!lpAmountA || !lpAmountB || parseFloat(lpAmountA) <= 0 || parseFloat(lpAmountB) <= 0) {
      toast({ title: "Invalid Amounts", description: "Please enter valid amounts for both tokens", variant: "destructive" });
      return;
    }

    let result;
    if (swapVersion === "v2") {
      // Always use addLiquidity for ERC-20 token pairs (including WMNT)
      result = await fusionXHook.addLiquidity({
        tokenA: tokenIn as Address,
        tokenB: tokenOut as Address,
        amountADesired: lpAmountA,
        amountBDesired: lpAmountB,
      });
    } else {
      // V3 requires tick range - using full range for simplicity
      result = await fusionXHook.v3MintPosition({
        token0: tokenIn as Address,
        token1: tokenOut as Address,
        fee: v3Fee,
        tickLower: -887220,
        tickUpper: 887220,
        amount0Desired: lpAmountA,
        amount1Desired: lpAmountB,
      });
    }

    if (result.success) {
      toast({ title: "Liquidity Added", description: result.message });
      setLpAmountA("");
      setLpAmountB("");
      fetchFusionXData();
    } else {
      toast({ title: "Failed", description: result.message, variant: "destructive" });
    }
  };

  const handleCollectFees = async (tokenId: bigint) => {
    const result = await fusionXHook.v3CollectFees({ tokenId });
    if (result.success) {
      toast({ title: "Fees Collected", description: result.message });
      fetchFusionXData();
    } else {
      toast({ title: "Failed", description: result.message, variant: "destructive" });
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!removeLpAmount || parseFloat(removeLpAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid LP amount to remove", variant: "destructive" });
      return;
    }

    if (parseFloat(removeLpAmount) > parseFloat(v2LpBalance)) {
      toast({ title: "Insufficient Balance", description: "You don't have enough LP tokens", variant: "destructive" });
      return;
    }

    const result = await fusionXHook.removeLiquidity({
      tokenA: tokenIn as Address,
      tokenB: tokenOut as Address,
      liquidity: removeLpAmount,
    });

    if (result.success) {
      toast({ title: "Liquidity Removed", description: result.message });
      setRemoveLpAmount("");
      fetchFusionXData();
    } else {
      toast({ title: "Failed", description: result.message, variant: "destructive" });
    }
  };

  // Token options for dropdowns
  const tokenOptions = [
    { value: FUSIONX_TOKENS.WMNT, label: "WMNT" },
    { value: FUSIONX_TOKENS.WETH, label: "WETH" },
    { value: FUSIONX_TOKENS.USDC, label: "USDC" },
    { value: FUSIONX_TOKENS.USDT, label: "USDT" },
    { value: FUSIONX_TOKENS.METH, label: "mETH" },
    { value: FUSIONX_TOKENS.WBTC, label: "WBTC" },
    { value: FUSIONX_TOKENS.LEND, label: "LEND" },
  ];

  const lendleAssetOptions = [
    { value: LENDLE_ASSETS.WMNT, label: "WMNT" },
    { value: LENDLE_ASSETS.WETH, label: "WETH" },
    { value: LENDLE_ASSETS.USDC, label: "USDC" },
    { value: LENDLE_ASSETS.USDT, label: "USDT" },
    { value: LENDLE_ASSETS.METH, label: "mETH" },
    { value: LENDLE_ASSETS.WBTC, label: "WBTC" },
  ];

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Card className="bg-[#1a1a1a] border border-white/10 p-8 text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold mb-2 text-white">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-4">
              Please connect your wallet to access Mantle ecosystem
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
        {/* Header with Network Toggle */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Mantle Ecosystem</h1>
          <p className="text-gray-400 mb-4">Bridge, Lend, and Trade on Mantle Network</p>

          {/* Network Toggle */}
          <div className="flex justify-center items-center gap-4 mb-4">
            <span className="text-sm text-gray-400">Network:</span>
            <div className="flex bg-[#0f0f0f] rounded-lg p-1 border border-white/10">
              <Button
                onClick={() => handleNetworkSwitch("testnet")}
                size="sm"
                variant="ghost"
                className={`px-4 py-1 rounded-md transition-all ${
                  selectedNetwork === "testnet"
                    ? "bg-yellow-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Testnet
              </Button>
              <Button
                onClick={() => handleNetworkSwitch("mainnet")}
                size="sm"
                variant="ghost"
                className={`px-4 py-1 rounded-md transition-all ${
                  selectedNetwork === "mainnet"
                    ? "bg-green-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Mainnet
              </Button>
            </div>
          </div>

          {/* Network Status */}
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              isOnCorrectNetwork ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
            }`}>
              <div className={`w-2 h-2 rounded-full ${isOnCorrectNetwork ? "bg-green-400" : "bg-yellow-400"} animate-pulse`} />
              {isOnL1 ? networkConfig.l1Name : isOnL2 ? networkConfig.l2Name : chain?.name || "Not Connected"}
            </div>

            {isOnCorrectNetwork && (
              <div className="flex gap-2">
                <Button
                  onClick={switchToL1}
                  size="sm"
                  variant="outline"
                  disabled={isOnL1}
                  className={`text-xs ${isOnL1 ? "border-blue-500 text-blue-400" : "border-white/10 text-gray-400 hover:text-white"}`}
                >
                  {networkConfig.l1Name} {isOnL1 && "✓"}
                </Button>
                <Button
                  onClick={switchToL2}
                  size="sm"
                  variant="outline"
                  disabled={isOnL2}
                  className={`text-xs ${isOnL2 ? "border-purple-500 text-purple-400" : "border-white/10 text-gray-400 hover:text-white"}`}
                >
                  {networkConfig.l2Name} {isOnL2 && "✓"}
                </Button>
              </div>
            )}

            {!isOnCorrectNetwork && isConnected && (
              <Button
                onClick={switchToL2}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
              >
                Switch to {networkConfig.l2Name}
              </Button>
            )}

            {selectedNetwork === "testnet" && networkConfig.faucet && (
              <a
                href={networkConfig.faucet}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <Gift className="w-3 h-3" />
                Get Testnet MNT
              </a>
            )}
          </div>

          {/* Network Info Box */}
          <div className="mt-4 max-w-md mx-auto p-3 bg-[#1a1a1a] border border-white/10 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">L1 Chain ID:</span>
              <span className="text-white font-mono">{networkConfig.l1ChainId}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-400">L2 Chain ID:</span>
              <span className="text-white font-mono">{networkConfig.l2ChainId}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-400">Explorer:</span>
              <a href={networkConfig.explorerL2} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                {networkConfig.explorerL2.replace("https://", "")}
              </a>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            onClick={() => setActiveTab("bridge")}
            variant={activeTab === "bridge" ? "default" : "outline"}
            className={activeTab === "bridge" ? "bg-blue-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
          >
            <Layers className="w-4 h-4 mr-2" />
            Bridge
          </Button>
          <Button
            onClick={() => setActiveTab("lendle")}
            variant={activeTab === "lendle" ? "default" : "outline"}
            className={activeTab === "lendle" ? "bg-purple-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
          >
            <Coins className="w-4 h-4 mr-2" />
            Lendle
          </Button>
          <Button
            onClick={() => setActiveTab("fusionx")}
            variant={activeTab === "fusionx" ? "default" : "outline"}
            className={activeTab === "fusionx" ? "bg-green-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
          >
            <ArrowDownUp className="w-4 h-4 mr-2" />
            FusionX
          </Button>
        </div>

        {/* ============================================ */}
        {/* BRIDGE SECTION */}
        {/* ============================================ */}
        {activeTab === "bridge" && (
          <div className="space-y-6">
            {/* Network Status */}
            <Card className="bg-[#1a1a1a] border border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-white">
                  Network Status
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${selectedNetwork === "testnet" ? "bg-yellow-600" : "bg-green-600"}`}>
                    {selectedNetwork.toUpperCase()}
                  </span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchBridgeData}
                  disabled={mantleHook.loading}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className={`w-4 h-4 ${mantleHook.loading ? "animate-spin" : ""}`} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Current Chain</p>
                    <p className="text-lg font-bold text-white">
                      {isOnL1 ? networkConfig.l1Name : isOnL2 ? networkConfig.l2Name : chain?.name || "Not Connected"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isOnL1 ? "Layer 1" : isOnL2 ? "Layer 2" : "Switch network"}
                    </p>
                  </div>
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">L1 ({networkConfig.l1Name})</p>
                    <p className="text-lg font-bold text-white">Chain {networkConfig.l1ChainId}</p>
                    <p className="text-xs text-gray-500 mt-1">For deposits</p>
                  </div>
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">L2 ({networkConfig.l2Name})</p>
                    <p className="text-lg font-bold text-white">Chain {networkConfig.l2ChainId}</p>
                    <p className="text-xs text-gray-500 mt-1">For withdrawals & DeFi</p>
                  </div>
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">L2 Gas Price</p>
                    <p className="text-lg font-bold text-white">{gasPriceInfo?.l2GasPrice || "Loading..."}</p>
                    <p className="text-xs text-gray-500 mt-1">{gasPriceInfo?.l1BaseFee ? `L1: ${gasPriceInfo.l1BaseFee}` : ""}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 flex gap-2 justify-center">
                  <Button
                    onClick={switchToL1}
                    size="sm"
                    disabled={isOnL1}
                    className={isOnL1 ? "bg-blue-600/50 text-white/50" : "bg-blue-600 hover:bg-blue-700 text-white"}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Switch to {networkConfig.l1Name}
                  </Button>
                  <Button
                    onClick={switchToL2}
                    size="sm"
                    disabled={isOnL2}
                    className={isOnL2 ? "bg-purple-600/50 text-white/50" : "bg-purple-600 hover:bg-purple-700 text-white"}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Switch to {networkConfig.l2Name}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Balances */}
            <Card className="bg-[#1a1a1a] border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white">Cross-Chain Balances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* MNT Balances */}
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-400 mb-3">MNT Balance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{networkConfig.l1Name} (L1):</span>
                        <span className="text-white font-mono">{mntBalances?.l1Balance ? parseFloat(mntBalances.l1Balance).toFixed(4) : "0"} MNT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{networkConfig.l2Name} (L2):</span>
                        <span className="text-white font-mono">{mntBalances?.l2Balance ? parseFloat(mntBalances.l2Balance).toFixed(4) : "0"} MNT</span>
                      </div>
                    </div>
                  </div>
                  {/* ETH Balances */}
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-400 mb-3">ETH Balance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{networkConfig.l1Name} (L1):</span>
                        <span className="text-white font-mono">{ethBalances?.l1Balance ? parseFloat(ethBalances.l1Balance).toFixed(4) : "0"} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{networkConfig.l2Name} (L2):</span>
                        <span className="text-white font-mono">{ethBalances?.l2Balance ? parseFloat(ethBalances.l2Balance).toFixed(4) : "0"} WETH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bridge Operations */}
              <Card className="bg-[#1a1a1a] border border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Bridge Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Action Toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setBridgeAction("deposit")}
                      variant={bridgeAction === "deposit" ? "default" : "outline"}
                      className={bridgeAction === "deposit" ? "bg-green-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Deposit (L1→L2)
                    </Button>
                    <Button
                      onClick={() => setBridgeAction("withdraw")}
                      variant={bridgeAction === "withdraw" ? "default" : "outline"}
                      className={bridgeAction === "withdraw" ? "bg-orange-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Withdraw (L2→L1)
                    </Button>
                  </div>

                  {/* Asset Selection */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Asset</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setBridgeAsset("MNT")}
                        variant={bridgeAsset === "MNT" ? "default" : "outline"}
                        className={bridgeAsset === "MNT" ? "bg-blue-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                      >
                        MNT
                      </Button>
                      <Button
                        onClick={() => setBridgeAsset("ETH")}
                        variant={bridgeAsset === "ETH" ? "default" : "outline"}
                        className={bridgeAsset === "ETH" ? "bg-purple-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                      >
                        ETH
                      </Button>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount</label>
                    <input
                      type="number"
                      value={bridgeAmount}
                      onChange={(e) => setBridgeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300">
                      {bridgeAction === "deposit"
                        ? `Deposits typically take 10-20 minutes to arrive on ${networkConfig.l2Name}.`
                        : selectedNetwork === "testnet"
                          ? "Withdrawals have a ~40 minute challenge period on testnet."
                          : "Withdrawals have a 7-day challenge period on mainnet."}
                    </p>
                  </div>

                  {/* Execute Button */}
                  <Button
                    onClick={handleBridgeOperation}
                    disabled={mantleHook.loading || !bridgeAmount}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {mantleHook.loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {bridgeAction === "deposit" ? <Download className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        {bridgeAction === "deposit" ? "Deposit" : "Withdraw"} {bridgeAsset}
                      </>
                    )}
                  </Button>

                  {mantleHook.error && (
                    <p className="text-red-400 text-sm">{mantleHook.error}</p>
                  )}
                </CardContent>
              </Card>

              {/* Wrap/Unwrap MNT */}
              <Card className="bg-[#1a1a1a] border border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Wrap / Unwrap MNT</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setWrapAction("wrap")}
                      variant={wrapAction === "wrap" ? "default" : "outline"}
                      className={wrapAction === "wrap" ? "bg-green-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                    >
                      MNT → WMNT
                    </Button>
                    <Button
                      onClick={() => setWrapAction("unwrap")}
                      variant={wrapAction === "unwrap" ? "default" : "outline"}
                      className={wrapAction === "unwrap" ? "bg-orange-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                    >
                      WMNT → MNT
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount</label>
                    <input
                      type="number"
                      value={wrapAmount}
                      onChange={(e) => setWrapAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    onClick={handleWrapOperation}
                    disabled={mantleHook.loading || !wrapAmount}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {mantleHook.loading ? "Processing..." : wrapAction === "wrap" ? "Wrap MNT" : "Unwrap WMNT"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* LENDLE SECTION */}
        {/* ============================================ */}
        {activeTab === "lendle" && (
          <div className="space-y-6">
            {/* Account Overview */}
            <Card className="bg-[#1a1a1a] border border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-white">Account Overview</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchLendleData}
                  disabled={lendleHook.loading}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className={`w-4 h-4 ${lendleHook.loading ? "animate-spin" : ""}`} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Total Collateral</p>
                    <p className="text-lg font-bold text-green-400">${userAccountData?.totalCollateralETH || "0.00"}</p>
                  </div>
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Total Debt</p>
                    <p className="text-lg font-bold text-red-400">${userAccountData?.totalDebtETH || "0.00"}</p>
                  </div>
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Available to Borrow</p>
                    <p className="text-lg font-bold text-blue-400">${userAccountData?.availableBorrowsETH || "0.00"}</p>
                  </div>
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">LTV</p>
                    <p className="text-lg font-bold text-white">{userAccountData?.ltv || "0"}%</p>
                  </div>
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Liquidation Threshold</p>
                    <p className="text-lg font-bold text-white">{userAccountData?.currentLiquidationThreshold || "0"}%</p>
                  </div>
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Health Factor</p>
                    <p className={`text-lg font-bold ${parseFloat(userAccountData?.healthFactor || "0") > 1.5 ? "text-green-400" : "text-yellow-400"}`}>
                      {userAccountData?.healthFactor || "∞"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Positions */}
            {userPositions.length > 0 && (
              <Card className="bg-[#1a1a1a] border border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Your Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                          <th className="pb-3">Asset</th>
                          <th className="pb-3">Deposited</th>
                          <th className="pb-3">Borrowed</th>
                          <th className="pb-3">Collateral</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userPositions.map((position: any) => (
                          <tr key={position.symbol} className="border-b border-white/5">
                            <td className="py-3">
                              <span className="font-semibold text-white">{position.symbol}</span>
                            </td>
                            <td className="py-3">
                              <span className="text-green-400">
                                {parseFloat(position.deposited).toFixed(6)}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-orange-400">
                                {(parseFloat(position.variableDebt) + parseFloat(position.stableDebt)).toFixed(6)}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={position.isCollateral ? "text-green-400" : "text-gray-500"}>
                                {position.isCollateral ? "Yes" : "No"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lending Operations */}
              <Card className="bg-[#1a1a1a] border border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Lending Operations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Action Selection */}
                  <div className="grid grid-cols-4 gap-2">
                    {(["deposit", "withdraw", "borrow", "repay"] as const).map((action) => (
                      <Button
                        key={action}
                        onClick={() => setLendleAction(action)}
                        variant={lendleAction === action ? "default" : "outline"}
                        size="sm"
                        className={lendleAction === action
                          ? action === "deposit" || action === "repay" ? "bg-green-600 text-white" : "bg-orange-600 text-white"
                          : "border-white/10 text-white hover:bg-white/10"
                        }
                      >
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </Button>
                    ))}
                  </div>

                  {/* Asset Selection */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Asset</label>
                    <select
                      value={lendleAsset}
                      onChange={(e) => setLendleAsset(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {lendleAssetOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-[#0f0f0f]">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rate Mode for Borrow/Repay */}
                  {(lendleAction === "borrow" || lendleAction === "repay") && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Interest Rate Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => setInterestRateMode(2)}
                          variant={interestRateMode === 2 ? "default" : "outline"}
                          className={interestRateMode === 2 ? "bg-blue-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                        >
                          Variable
                        </Button>
                        <Button
                          onClick={() => setInterestRateMode(1)}
                          variant={interestRateMode === 1 ? "default" : "outline"}
                          disabled={reserveConfig && !reserveConfig.stableBorrowRateEnabled}
                          className={
                            reserveConfig && !reserveConfig.stableBorrowRateEnabled
                              ? "border-white/10 text-gray-500 cursor-not-allowed opacity-50"
                              : interestRateMode === 1
                                ? "bg-purple-600 text-white"
                                : "border-white/10 text-white hover:bg-white/10"
                          }
                          title={reserveConfig && !reserveConfig.stableBorrowRateEnabled ? "Stable rate not available for this asset" : ""}
                        >
                          Stable {reserveConfig && !reserveConfig.stableBorrowRateEnabled && "(N/A)"}
                        </Button>
                      </div>
                      {reserveConfig && !reserveConfig.stableBorrowRateEnabled && (
                        <p className="text-xs text-yellow-500 mt-1">⚠️ Stable rate is not available for this asset</p>
                      )}
                    </div>
                  )}

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount</label>
                    <input
                      type="number"
                      value={lendleAmount}
                      onChange={(e) => setLendleAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Reserve Info */}
                  {reserveData && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Supply APY:</span>
                          <span className="text-green-400 ml-2">{reserveData.liquidityRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Borrow APY:</span>
                          <span className="text-orange-400 ml-2">{reserveData.variableBorrowRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Utilization:</span>
                          <span className="text-white ml-2">{reserveData.utilizationRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Available:</span>
                          <span className="text-white ml-2">{parseFloat(reserveData.availableLiquidity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Execute Button */}
                  <Button
                    onClick={handleLendleOperation}
                    disabled={lendleHook.loading || !lendleAmount}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {lendleHook.loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {lendleAction === "deposit" && <Download className="w-4 h-4 mr-2" />}
                        {lendleAction === "withdraw" && <Upload className="w-4 h-4 mr-2" />}
                        {lendleAction === "borrow" && <Coins className="w-4 h-4 mr-2" />}
                        {lendleAction === "repay" && <Send className="w-4 h-4 mr-2" />}
                        {lendleAction.charAt(0).toUpperCase() + lendleAction.slice(1)}
                      </>
                    )}
                  </Button>

                  {lendleHook.error && (
                    <p className="text-red-400 text-sm">{lendleHook.error}</p>
                  )}
                </CardContent>
              </Card>

              {/* LEND Staking */}
              <Card className="bg-[#1a1a1a] border border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white">LEND Staking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Wallet Balance */}
                  <div className="p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg">
                    <p className="text-gray-400 text-xs">Wallet Balance</p>
                    <p className="text-xl font-bold text-purple-400">
                      {lendBalance ? parseFloat(lendBalance.balance).toFixed(4) : "0.0000"} LEND
                    </p>
                  </div>

                  {/* Staking Stats */}
                  {stakingInfo && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-[#0f0f0f] border border-white/5 rounded-lg">
                        <p className="text-gray-400 text-xs">Total Staked</p>
                        <p className="text-lg font-bold text-white">{parseFloat(stakingInfo.totalStaked).toFixed(2)} LEND</p>
                      </div>
                      <div className="p-3 bg-[#0f0f0f] border border-white/5 rounded-lg">
                        <p className="text-gray-400 text-xs">Earned Rewards</p>
                        <p className="text-lg font-bold text-green-400">{parseFloat(stakingInfo.earnedRewards).toFixed(4)} LEND</p>
                      </div>
                      <div className="p-3 bg-[#0f0f0f] border border-white/5 rounded-lg">
                        <p className="text-gray-400 text-xs">Locked Balance</p>
                        <p className="text-lg font-bold text-orange-400">{parseFloat(stakingInfo.lockedBalance).toFixed(2)} LEND</p>
                      </div>
                      <div className="p-3 bg-[#0f0f0f] border border-white/5 rounded-lg">
                        <p className="text-gray-400 text-xs">Withdrawable</p>
                        <p className="text-lg font-bold text-blue-400">{parseFloat(stakingInfo.withdrawableAmount).toFixed(2)} LEND</p>
                      </div>
                    </div>
                  )}

                  {/* Stake Input */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-400">Stake LEND</label>
                      {lendBalance && parseFloat(lendBalance.balance) > 0 && (
                        <button
                          onClick={() => setStakeLendAmount(lendBalance.balance)}
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          MAX
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      value={stakeLendAmount}
                      onChange={(e) => setStakeLendAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <Button
                    onClick={handleStakeLEND}
                    disabled={lendleHook.loading || !stakeLendAmount}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Stake LEND
                  </Button>

                  {/* Withdraw Staked LEND */}
                  {stakingInfo && parseFloat(stakingInfo.withdrawableAmount) > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">Withdraw Staked LEND</label>
                        <button
                          onClick={() => setWithdrawLendAmount(stakingInfo.withdrawableAmount)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          MAX ({parseFloat(stakingInfo.withdrawableAmount).toFixed(2)})
                        </button>
                      </div>
                      <input
                        type="number"
                        value={withdrawLendAmount}
                        onChange={(e) => setWithdrawLendAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      />
                      <Button
                        onClick={handleWithdrawStakedLEND}
                        disabled={lendleHook.loading || !withdrawLendAmount}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Withdraw LEND
                      </Button>
                    </div>
                  )}

                  {/* Claim Rewards */}
                  <Button
                    onClick={handleClaimStakingRewards}
                    disabled={lendleHook.loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Claim Rewards
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Available Markets */}
            <Card className="bg-[#1a1a1a] border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl text-white">Available Markets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                        <th className="pb-3">Asset</th>
                        <th className="pb-3">Supply APY</th>
                        <th className="pb-3">Borrow APY</th>
                        <th className="pb-3">Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allReserves.map((reserve) => (
                        <tr key={reserve.address} className="border-b border-white/5">
                          <td className="py-3">
                            <span className="font-semibold text-white">{reserve.symbol}</span>
                          </td>
                          <td className="py-3 text-green-400">-</td>
                          <td className="py-3 text-orange-400">-</td>
                          <td className="py-3 text-white">-</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============================================ */}
        {/* FUSIONX SECTION */}
        {/* ============================================ */}
        {activeTab === "fusionx" && (
          <div className="space-y-6">
            {/* Pool Info */}
            <Card className="bg-[#1a1a1a] border border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-white">Pool Information</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchFusionXData}
                  disabled={fusionXHook.loading}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className={`w-4 h-4 ${fusionXHook.loading ? "animate-spin" : ""}`} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* V2 Pool Info */}
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-400 mb-3">V2 Pool</h3>
                    {v2PairInfo ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Reserve 0:</span>
                          <span className="text-white">{parseFloat(v2PairInfo.reserve0).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Reserve 1:</span>
                          <span className="text-white">{parseFloat(v2PairInfo.reserve1).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Supply:</span>
                          <span className="text-white">{parseFloat(v2PairInfo.totalSupply).toFixed(4)} LP</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No V2 pool found for this pair</p>
                    )}
                  </div>

                  {/* V3 Pool Info */}
                  <div className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-400 mb-3">V3 Pool</h3>
                    {v3PoolInfo ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fee Tier:</span>
                          <span className="text-white">{v3PoolInfo.fee / 10000}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tick Spacing:</span>
                          <span className="text-white">{v3PoolInfo.tickSpacing}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Tick:</span>
                          <span className="text-white">{v3PoolInfo.tick}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No V3 pool found for this pair/fee</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Swap */}
              <Card className="bg-[#1a1a1a] border border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Swap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Version Toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setSwapVersion("v2")}
                      variant={swapVersion === "v2" ? "default" : "outline"}
                      className={swapVersion === "v2" ? "bg-green-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                    >
                      V2 AMM
                    </Button>
                    <Button
                      onClick={() => setSwapVersion("v3")}
                      variant={swapVersion === "v3" ? "default" : "outline"}
                      className={swapVersion === "v3" ? "bg-blue-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                    >
                      V3 Concentrated
                    </Button>
                  </div>

                  {/* Token In */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">From</label>
                    <div className="flex gap-2">
                      <select
                        value={tokenIn}
                        onChange={(e) => setTokenIn(e.target.value)}
                        className="w-32 px-3 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {tokenOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-[#0f0f0f]">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={swapAmountIn}
                        onChange={(e) => setSwapAmountIn(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* Swap Direction Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const temp = tokenIn;
                        setTokenIn(tokenOut);
                        setTokenOut(temp);
                        setSwapAmountIn("");
                        setSwapAmountOut("");
                      }}
                      className="text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <ArrowUpDown className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Token Out */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">To</label>
                    <div className="flex gap-2">
                      <select
                        value={tokenOut}
                        onChange={(e) => setTokenOut(e.target.value)}
                        className="w-32 px-3 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {tokenOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-[#0f0f0f]">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={swapAmountOut}
                        readOnly
                        placeholder="0.00"
                        className="flex-1 px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white/70 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* V3 Fee Tier */}
                  {swapVersion === "v3" && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Fee Tier</label>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(FEE_TIERS).map(([name, fee]) => (
                          <Button
                            key={name}
                            onClick={() => setV3Fee(fee as FeeTier)}
                            variant={v3Fee === fee ? "default" : "outline"}
                            size="sm"
                            className={v3Fee === fee ? "bg-blue-600 text-white text-xs" : "border-white/10 text-white hover:bg-white/10 text-xs"}
                          >
                            {fee / 10000}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slippage */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Slippage Tolerance</label>
                    <div className="flex gap-2">
                      {["0.1", "0.5", "1.0"].map((value) => (
                        <Button
                          key={value}
                          onClick={() => setSlippage(value)}
                          variant={slippage === value ? "default" : "outline"}
                          size="sm"
                          className={slippage === value ? "bg-green-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                        >
                          {value}%
                        </Button>
                      ))}
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="w-20 px-2 py-1 bg-[#0f0f0f] border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* Swap Button */}
                  <Button
                    onClick={handleSwap}
                    disabled={fusionXHook.loading || !swapAmountIn}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {fusionXHook.loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Swapping...
                      </>
                    ) : (
                      <>
                        <ArrowDownUp className="w-4 h-4 mr-2" />
                        Swap
                      </>
                    )}
                  </Button>

                  {fusionXHook.error && (
                    <p className="text-red-400 text-sm">{fusionXHook.error}</p>
                  )}
                </CardContent>
              </Card>

              {/* Liquidity */}
              <Card className="bg-[#1a1a1a] border border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Add Liquidity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Version Toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setSwapVersion("v2")}
                      variant={swapVersion === "v2" ? "default" : "outline"}
                      className={swapVersion === "v2" ? "bg-green-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                    >
                      V2 LP
                    </Button>
                    <Button
                      onClick={() => setSwapVersion("v3")}
                      variant={swapVersion === "v3" ? "default" : "outline"}
                      className={swapVersion === "v3" ? "bg-blue-600 text-white" : "border-white/10 text-white hover:bg-white/10"}
                    >
                      V3 Position
                    </Button>
                  </div>

                  {/* Token A Amount */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Token A Amount</label>
                    <div className="flex gap-2">
                      <select
                        value={tokenIn}
                        onChange={(e) => setTokenIn(e.target.value)}
                        className="w-32 px-3 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none"
                      >
                        {tokenOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-[#0f0f0f]">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={lpAmountA}
                        onChange={(e) => setLpAmountA(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Token B Amount */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Token B Amount</label>
                    <div className="flex gap-2">
                      <select
                        value={tokenOut}
                        onChange={(e) => setTokenOut(e.target.value)}
                        className="w-32 px-3 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white focus:outline-none"
                      >
                        {tokenOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-[#0f0f0f]">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={lpAmountB}
                        onChange={(e) => setLpAmountB(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Pool Ratio Info - V2 Only */}
                  {/* {swapVersion === "v2" && v2PairInfo && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-400 mb-1">Pool Ratio (Auto-calculated)</p>
                      <p className="text-sm text-white">
                        1 {tokenOptions.find(t => t.value === tokenIn)?.label} = {" "}
                        {v2PairInfo.token0.toLowerCase() === tokenIn.toLowerCase()
                          ? (parseFloat(v2PairInfo.reserve1) / parseFloat(v2PairInfo.reserve0)).toFixed(8)
                          : (parseFloat(v2PairInfo.reserve0) / parseFloat(v2PairInfo.reserve1)).toFixed(8)
                        } {tokenOptions.find(t => t.value === tokenOut)?.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Token B amount is auto-calculated based on pool ratio</p>
                    </div>
                  )} */}

                  {/* V3 Fee Selection */}
                  {swapVersion === "v3" && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Fee Tier</label>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(FEE_TIERS).map(([name, fee]) => (
                          <Button
                            key={name}
                            onClick={() => setV3Fee(fee as FeeTier)}
                            variant={v3Fee === fee ? "default" : "outline"}
                            size="sm"
                            className={v3Fee === fee ? "bg-blue-600 text-white text-xs" : "border-white/10 text-white hover:bg-white/10 text-xs"}
                          >
                            {fee / 10000}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Liquidity Button */}
                  <Button
                    onClick={handleAddLiquidity}
                    disabled={fusionXHook.loading || !lpAmountA || !lpAmountB}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {fusionXHook.loading ? "Processing..." : "Add Liquidity"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* V2 LP Positions */}
            {parseFloat(v2LpBalance) > 0 && v2PairInfo && (
              <Card className="bg-[#1a1a1a] border border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-green-400" />
                    Your V2 LP Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Position Summary Table */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Pair</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">LP Balance</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Pool Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4">
                            <span className="text-white font-semibold">
                              {tokenIn.toLowerCase() < tokenOut.toLowerCase()
                                ? `${tokenOptions.find(t => t.value === tokenIn)?.label} / ${tokenOptions.find(t => t.value === tokenOut)?.label}`
                                : `${tokenOptions.find(t => t.value === tokenOut)?.label} / ${tokenOptions.find(t => t.value === tokenIn)?.label}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-white">{parseFloat(v2LpBalance).toFixed(8)} LP</td>
                          <td className="py-3 px-4 text-right text-green-400 font-semibold">
                            {((parseFloat(v2LpBalance) / parseFloat(v2PairInfo.totalSupply)) * 100).toFixed(4)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Token Amounts Table */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Token</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Pool Reserve</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Your Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/5 bg-[#0f0f0f]">
                          <td className="py-3 px-4">
                            <span className="text-white font-semibold">
                              {tokenIn.toLowerCase() < tokenOut.toLowerCase()
                                ? tokenOptions.find(t => t.value === tokenIn)?.label
                                : tokenOptions.find(t => t.value === tokenOut)?.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-300">
                            {parseFloat(v2PairInfo.reserve0).toFixed(6)}
                          </td>
                          <td className="py-3 px-4 text-right text-green-400 font-semibold">
                            {((parseFloat(v2LpBalance) / parseFloat(v2PairInfo.totalSupply)) * parseFloat(v2PairInfo.reserve0)).toFixed(8)}
                          </td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4">
                            <span className="text-white font-semibold">
                              {tokenIn.toLowerCase() < tokenOut.toLowerCase()
                                ? tokenOptions.find(t => t.value === tokenOut)?.label
                                : tokenOptions.find(t => t.value === tokenIn)?.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-300">
                            {parseFloat(v2PairInfo.reserve1).toFixed(6)}
                          </td>
                          <td className="py-3 px-4 text-right text-green-400 font-semibold">
                            {((parseFloat(v2LpBalance) / parseFloat(v2PairInfo.totalSupply)) * parseFloat(v2PairInfo.reserve1)).toFixed(8)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Remove Liquidity Section */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-gray-400 text-sm mb-2">Remove Liquidity</p>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        value={removeLpAmount}
                        onChange={(e) => setRemoveLpAmount(e.target.value)}
                        placeholder="LP amount to remove"
                        className="flex-1 px-4 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <Button
                        onClick={() => setRemoveLpAmount(v2LpBalance)}
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        MAX
                      </Button>
                    </div>

                    {/* Expected Output Preview */}
                    {removeLpAmount && parseFloat(removeLpAmount) > 0 && parseFloat(v2PairInfo.totalSupply) > 0 && (
                      <div className="mb-3 p-3 bg-[#0f0f0f] border border-white/5 rounded-lg">
                        <p className="text-gray-400 text-xs mb-2">You will receive (estimated):</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-white">
                            {tokenIn.toLowerCase() < tokenOut.toLowerCase()
                              ? tokenOptions.find(t => t.value === tokenIn)?.label
                              : tokenOptions.find(t => t.value === tokenOut)?.label}:
                          </span>
                          <span className="text-green-400 font-semibold">
                            {((parseFloat(removeLpAmount) / parseFloat(v2PairInfo.totalSupply)) * parseFloat(v2PairInfo.reserve0)).toFixed(8)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white">
                            {tokenIn.toLowerCase() < tokenOut.toLowerCase()
                              ? tokenOptions.find(t => t.value === tokenOut)?.label
                              : tokenOptions.find(t => t.value === tokenIn)?.label}:
                          </span>
                          <span className="text-green-400 font-semibold">
                            {((parseFloat(removeLpAmount) / parseFloat(v2PairInfo.totalSupply)) * parseFloat(v2PairInfo.reserve1)).toFixed(8)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleRemoveLiquidity}
                      disabled={fusionXHook.loading || !removeLpAmount || parseFloat(removeLpAmount) <= 0}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      {fusionXHook.loading ? "Processing..." : "Remove Liquidity"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* LP History (Mints & Burns from Subgraph) */}
            {lpHistory && (lpHistory.mints.length > 0 || lpHistory.burns.length > 0) && (
              <Card className="bg-[#1a1a1a] border border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    LP History (All Pairs)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Mints (Liquidity Additions) */}
                  {lpHistory.mints.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Liquidity Added ({lpHistory.mints.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-2 px-3 text-gray-400 font-medium">Pair</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">Token 0</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">Token 1</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">LP Tokens</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">USD Value</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lpHistory.mints.map((mint) => (
                              <tr key={mint.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-2 px-3 text-white">
                                  {mint.pair.token0.symbol}/{mint.pair.token1.symbol}
                                </td>
                                <td className="py-2 px-3 text-right text-white">
                                  {parseFloat(mint.amount0).toFixed(6)} {mint.pair.token0.symbol}
                                </td>
                                <td className="py-2 px-3 text-right text-white">
                                  {parseFloat(mint.amount1).toFixed(6)} {mint.pair.token1.symbol}
                                </td>
                                <td className="py-2 px-3 text-right text-green-400">
                                  {parseFloat(mint.liquidity).toFixed(8)}
                                </td>
                                <td className="py-2 px-3 text-right text-gray-300">
                                  ${parseFloat(mint.amountUSD).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right text-gray-400">
                                  {new Date(parseInt(mint.transaction.timestamp) * 1000).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Burns (Liquidity Removals) */}
                  {lpHistory.burns.length > 0 && (
                    <div>
                      <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 rotate-180" />
                        Liquidity Removed ({lpHistory.burns.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-2 px-3 text-gray-400 font-medium">Pair</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">Token 0</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">Token 1</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">LP Tokens</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">USD Value</th>
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lpHistory.burns.map((burn) => (
                              <tr key={burn.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-2 px-3 text-white">
                                  {burn.pair.token0.symbol}/{burn.pair.token1.symbol}
                                </td>
                                <td className="py-2 px-3 text-right text-white">
                                  {parseFloat(burn.amount0).toFixed(6)} {burn.pair.token0.symbol}
                                </td>
                                <td className="py-2 px-3 text-right text-white">
                                  {parseFloat(burn.amount1).toFixed(6)} {burn.pair.token1.symbol}
                                </td>
                                <td className="py-2 px-3 text-right text-red-400">
                                  {parseFloat(burn.liquidity).toFixed(8)}
                                </td>
                                <td className="py-2 px-3 text-right text-gray-300">
                                  ${parseFloat(burn.amountUSD).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right text-gray-400">
                                  {new Date(parseInt(burn.transaction.timestamp) * 1000).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* V3 Positions */}
            {userV3Positions.length > 0 && (
              <Card className="bg-[#1a1a1a] border border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Your V3 Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userV3Positions.map((position) => (
                      <div key={position.tokenId.toString()} className="p-4 bg-[#0f0f0f] border border-white/5 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-white font-semibold">Position #{position.tokenId.toString()}</p>
                            <p className="text-gray-400 text-sm">Fee: {position.fee / 10000}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Liquidity</p>
                            <p className="text-white">{position.liquidity.toString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCollectFees(position.tokenId)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Gift className="w-4 h-4 mr-1" />
                            Collect Fees
                          </Button>
                          <a
                            href={`https://mantlescan.xyz/token/${FUSIONX_TOKENS.WMNT}?a=${position.tokenId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 text-sm border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
