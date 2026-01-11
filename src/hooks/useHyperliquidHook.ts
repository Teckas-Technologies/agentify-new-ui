import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import useLifiHook from "./useLifiHook";
import { useTokenBalanceRefresh } from "@/contexts/TokenBalanceRefreshContext";
import { switchChain, readContract, writeContract, getBalance } from '@wagmi/core';
import { wagmiConfig } from "@/contexts/CustomWagmiProvider";
import { parseUnits, formatUnits, encodeFunctionData, type Hex, keccak256, encodeAbiParameters } from 'viem';
import axios from 'axios';
import { encode as msgpackEncode } from '@msgpack/msgpack';

// ====================================
// CONSTANTS & CONFIGURATION
// ====================================

// Hyperliquid API endpoints
const HYPERLIQUID_API = {
  mainnet: "https://api.hyperliquid.xyz",
  testnet: "https://api.hyperliquid-testnet.xyz"
};

const API_BASE = HYPERLIQUID_API.mainnet;

// Bridge contract addresses (Arbitrum <-> Hyperliquid)
const BRIDGE_ADDRESSES = {
  mainnet: "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7" as const,
  testnet: "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89" as const
};

const BRIDGE_ADDRESS = BRIDGE_ADDRESSES.mainnet;

// USDC contract addresses
const USDC_ADDRESSES = {
  arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const,
  ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
  polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as const,
  bsc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as const,
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const,
  optimism: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as const
};

// Chain IDs
const CHAIN_IDS = {
  arbitrum: 42161,
  ethereum: 1,
  polygon: 137,
  bsc: 56,
  base: 8453,
  optimism: 10
};

// Chain names for display
const CHAIN_NAMES = {
  [CHAIN_IDS.arbitrum]: "Arbitrum",
  [CHAIN_IDS.ethereum]: "Ethereum",
  [CHAIN_IDS.polygon]: "Polygon",
  [CHAIN_IDS.bsc]: "BNB Chain",
  [CHAIN_IDS.base]: "Base",
  [CHAIN_IDS.optimism]: "Optimism"
};

// Minimum deposit amount (5 USDC)
const MIN_DEPOSIT_AMOUNT = 5;

// ERC20 ABI (for USDC operations)
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "nonces",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Bridge ABI (for deposits) - Correct ABI from Arbiscan
const BRIDGE_ABI = [
  {
    inputs: [
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]"
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]"
      },
      {
        internalType: "uint256[]",
        name: "deadlines",
        type: "uint256[]"
      },
      {
        internalType: "uint8[]",
        name: "vs",
        type: "uint8[]"
      },
      {
        internalType: "bytes32[]",
        name: "rs",
        type: "bytes32[]"
      },
      {
        internalType: "bytes32[]",
        name: "ss",
        type: "bytes32[]"
      }
    ],
    name: "batchedDepositWithPermit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// ====================================
// TYPES & INTERFACES
// ====================================

interface HyperliquidPosition {
  coin: string;
  szi: string; // Size (signed, positive = long, negative = short)
  leverage: { value: number };
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  liquidationPx: string;
  marginUsed: string;
}

interface HyperliquidAccountState {
  assetPositions: Array<{
    position: HyperliquidPosition;
    type: string;
  }>;
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
}

interface HyperliquidSpotBalance {
  coin: string;
  hold: string;
  total: string;
}

interface OpenPerpPositionParams {
  symbol: string;
  size: number;
  leverage: number;
  isLong: boolean;
  orderType?: "market" | "limit";
  limitPrice?: number;
}

interface ClosePerpPositionParams {
  symbol: string;
  percentage?: number;
}

interface PlaceOrderParams {
  symbol: string;
  side: "buy" | "sell";
  size: number;
  price?: number;
  orderType: "market" | "limit";
  reduceOnly?: boolean;
}

interface SpotTradeParams {
  symbol: string;
  side: "buy" | "sell";
  amount: number;
  orderType?: "market" | "limit";
  limitPrice?: number;
}

interface HookResponse {
  success: boolean;
  message: string;
  txHash?: string;
  orderId?: string;
  data?: any;
}

// ====================================
// MAIN HOOK
// ====================================

export const useHyperliquidHook = () => {
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { wallets } = useWallets();
  const { user } = usePrivy();
  const { triggerRefresh } = useTokenBalanceRefresh();
  const { executeLifi, fetchQuote } = useLifiHook();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ====================================
  // HELPER FUNCTIONS
  // ====================================

  /**
   * Get wallet client for signing transactions
   */
  const getWallet = () => {
    if (!walletClient) {
      throw new Error("Wallet client not available");
    }
    return walletClient;
  };

  /**
   * Remove trailing zeros from a number string
   * Hyperliquid requires prices and sizes without trailing zeros
   */
  const removeTrailingZeros = (value: string | number): string => {
    const str = typeof value === 'number' ? value.toString() : value;
    // Remove trailing zeros after decimal point
    return str.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
  };

  /**
   * Switch to a specific network
   */
  const switchToNetwork = async (targetChainId: number): Promise<boolean> => {
    try {
      if (chain?.id === targetChainId) {
        return true;
      }

      await switchChain(wagmiConfig as any, { chainId: targetChainId as any });

      // Wait for switch to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (err: any) {
      console.error("Network switch failed:", err);
      throw new Error(`Please switch to ${CHAIN_NAMES[targetChainId]} network`);
    }
  };

  /**
   * Check USDC balance on a specific chain
   */
  const getUSDCBalance = async (chainId: number, userAddress: string): Promise<number> => {
    try {
      const usdcAddresses: { [key: number]: string } = {
        [CHAIN_IDS.arbitrum]: USDC_ADDRESSES.arbitrum,
        [CHAIN_IDS.ethereum]: USDC_ADDRESSES.ethereum,
        [CHAIN_IDS.polygon]: USDC_ADDRESSES.polygon,
        [CHAIN_IDS.bsc]: USDC_ADDRESSES.bsc,
        [CHAIN_IDS.base]: USDC_ADDRESSES.base,
        [CHAIN_IDS.optimism]: USDC_ADDRESSES.optimism
      };

      const usdcAddress = usdcAddresses[chainId];
      if (!usdcAddress) {
        throw new Error(`USDC address not configured for chain ${chainId}`);
      }

      const balance = await readContract(wagmiConfig as any, {
        address: usdcAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
        chainId: chainId as any
      });

      // USDC has 6 decimals
      return Number(formatUnits(balance as bigint, 6));
    } catch (err: any) {
      console.error("Error fetching USDC balance:", err);
      return 0;
    }
  };

  /**
   * Get USDC permit nonce for signing
   */
  const getUSDCNonce = async (userAddress: string): Promise<number> => {
    try {
      const nonce = await readContract(wagmiConfig as any, {
        address: USDC_ADDRESSES.arbitrum,
        abi: ERC20_ABI,
        functionName: 'nonces',
        args: [userAddress as `0x${string}`],
        chainId: CHAIN_IDS.arbitrum as any
      });

      return Number(nonce);
    } catch (err: any) {
      console.error("Error fetching nonce:", err);
      return 0;
    }
  };

  /**
   * Sign USDC Permit (EIP-2612) for bridge deposit
   */
  const signUSDCPermit = async (amount: number, deadline: number) => {
    if (!address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    const nonce = await getUSDCNonce(address);
    const amountBigInt = parseUnits(amount.toString(), 6);

    console.log("🔵 PERMIT DEBUG - Starting permit signature:", {
      owner: address,
      spender: BRIDGE_ADDRESS,
      amount: amount,
      amountBigInt: amountBigInt.toString(),
      nonce,
      deadline,
      usdcAddress: USDC_ADDRESSES.arbitrum
    });

    // EIP-712 domain for USDC on Arbitrum
    const domain = {
      name: "USD Coin",
      version: "2",
      chainId: CHAIN_IDS.arbitrum,
      verifyingContract: USDC_ADDRESSES.arbitrum
    };

    // EIP-712 types for permit
    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    };

    // Message to sign
    const message = {
      owner: address,
      spender: BRIDGE_ADDRESS,
      value: amountBigInt,
      nonce: BigInt(nonce),
      deadline: BigInt(deadline)
    };

    console.log("🔵 PERMIT DEBUG - EIP-712 message:", {
      domain,
      message: {
        owner: message.owner,
        spender: message.spender,
        value: message.value.toString(),
        nonce: message.nonce.toString(),
        deadline: message.deadline.toString()
      }
    });

    try {
      const signature = await walletClient.signTypedData({
        account: address as `0x${string}`,
        domain,
        types,
        primaryType: "Permit",
        message
      });

      console.log("🔵 PERMIT DEBUG - Signature received:", signature);

      // Split signature into v, r, s
      const r = signature.slice(0, 66) as Hex;
      const s = ("0x" + signature.slice(66, 130)) as Hex;
      const v = parseInt(signature.slice(130, 132), 16);

      console.log("🔵 PERMIT DEBUG - Signature split:", { v, r, s });

      return { v, r, s, deadline, nonce, amount: amountBigInt };
    } catch (err: any) {
      console.error("❌ Permit signing failed:", err);
      throw new Error("Failed to sign permit. Please try again.");
    }
  };

  /**
   * Call Hyperliquid API (Info endpoint - no auth required)
   */
  const callInfoAPI = async (action: string, params: any = {}) => {
    try {
      const response = await axios.post(`${API_BASE}/info`, {
        type: action,
        ...params
      });

      return response.data;
    } catch (err: any) {
      console.error("Hyperliquid API call failed:", err);
      throw new Error(err.response?.data?.error || "API call failed");
    }
  };

  /**
   * Sign and call Hyperliquid Exchange API (requires EIP-712 signing)
   * Hyperliquid uses "Phantom Agent" construction for L1 actions
   */
  const callExchangeAPI = async (action: any, nonce: number) => {
    if (!address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("🔵 Exchange API - Signing action:", { action, nonce, address });

      // Step 1: Serialize the action with msgpack
      // Hyperliquid requires msgpack serialization for the hash
      const actionPayload = {
        action,
        nonce,
        vaultAddress: null
      };

      // Serialize with msgpack
      const msgpackBytes = msgpackEncode(actionPayload);

      // Step 2: Hash the serialized action with keccak256
      // Convert Uint8Array to hex string for keccak256
      const msgpackHex = `0x${Array.from(msgpackBytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
      const connectionId = keccak256(msgpackHex);

      console.log("🔵 Msgpack hash (connectionId):", connectionId);

      // Step 3: Construct phantom agent with the hash
      // EIP-712 domain for Hyperliquid L1 actions
      const domain = {
        name: "HyperliquidSignTransaction",
        version: "1",
        chainId: 42161, // Arbitrum mainnet
        verifyingContract: "0x0000000000000000000000000000000000000000" as `0x${string}`
      };

      const phantomAgent = {
        source: "a", // "a" indicates API wallet (agent)
        connectionId: connectionId
      };

      const types = {
        HyperliquidTransaction: [
          { name: "source", type: "string" },
          { name: "connectionId", type: "bytes32" }
        ]
      };

      console.log("🔵 Signing with domain:", domain);
      console.log("🔵 Phantom agent:", phantomAgent);

      // Step 4: Sign the phantom agent message with EIP-712
      const signature = await walletClient.signTypedData({
        account: address as `0x${string}`,
        domain,
        types,
        primaryType: "HyperliquidTransaction",
        message: phantomAgent
      });

      console.log("🔵 Signature:", signature);

      // Split signature into r, s, v components
      const r = signature.slice(0, 66);
      const s = "0x" + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);

      // Step 5: Construct the full request payload
      const request = {
        action,
        nonce,
        signature: { r, s, v },
        vaultAddress: null
      };

      console.log("🔵 Sending to Hyperliquid API:", request);

      const response = await axios.post(`${API_BASE}/exchange`, request);

      console.log("🔵 Hyperliquid response:", response.data);

      return response.data;
    } catch (err: any) {
      console.error("❌ Exchange API call failed:", err);
      console.error("❌ Response data:", err.response?.data);
      console.error("❌ Response status:", err.response?.status);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.response?.data?.response || err.message || "Transaction failed";
      throw new Error(errorMsg);
    }
  };

  /**
   * Validate deposit amount
   */
  const validateDepositAmount = (amount: number): boolean => {
    if (amount < MIN_DEPOSIT_AMOUNT) {
      throw new Error(`Minimum deposit is ${MIN_DEPOSIT_AMOUNT} USDC`);
    }
    return true;
  };

  /**
   * Handle user-friendly error messages
   */
  const getErrorMessage = (error: any): string => {
    const errorStr = error?.message || String(error);

    // Common error patterns
    if (errorStr.includes("insufficient")) {
      return "Insufficient balance for this operation";
    }
    if (errorStr.includes("User rejected") || errorStr.includes("user rejected")) {
      return "No problem! You cancelled the transaction. Let me know when you're ready to try again.";
    }
    if (errorStr.includes("network")) {
      return "Network error. Please check your connection and try again";
    }
    if (errorStr.includes("margin")) {
      return "Insufficient margin for this position";
    }
    if (errorStr.includes("leverage")) {
      return "Invalid leverage. Please use a value between 1x and 50x";
    }

    return errorStr || "Operation failed. Please try again";
  };

  // ====================================
  // DEPOSIT FUNCTIONS (Priority 1)
  // ====================================

  /**
   * Deposit from Arbitrum to Hyperliquid (Simple Transfer Method)
   * This is the recommended and simplest approach
   */
  const depositFromArbitrumSimple = async (amount: number): Promise<HookResponse> => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔵 SIMPLE DEPOSIT - Starting:", { amount, address });

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      // Validate amount
      validateDepositAmount(amount);

      // Switch to Arbitrum
      await switchToNetwork(CHAIN_IDS.arbitrum);

      // Check USDC balance on Arbitrum
      const balance = await getUSDCBalance(CHAIN_IDS.arbitrum, address);
      console.log("🔵 SIMPLE DEPOSIT - Balance check:", { balance, required: amount });

      if (balance < amount) {
        throw new Error(`Insufficient USDC on Arbitrum. You have ${balance.toFixed(2)} USDC but need ${amount} USDC`);
      }

      const amountBigInt = parseUnits(amount.toString(), 6);

      // Just transfer USDC directly to the bridge
      // Hyperliquid detects incoming USDC and credits your account automatically
      console.log("🔵 SIMPLE DEPOSIT - Transferring USDC to bridge:", {
        token: USDC_ADDRESSES.arbitrum,
        from: address,
        to: BRIDGE_ADDRESS,
        amount: amountBigInt.toString()
      });

      const transferTx = await writeContract(wagmiConfig as any, {
        address: USDC_ADDRESSES.arbitrum,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [BRIDGE_ADDRESS, amountBigInt],
        chainId: CHAIN_IDS.arbitrum as any
      });

      console.log("🔵 SIMPLE DEPOSIT - Transfer tx:", transferTx);

      triggerRefresh();

      return {
        success: true,
        message: `Deposited ${amount} USDC to Hyperliquid. Funds will arrive in ~1 minute.`,
        txHash: transferTx as string
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("❌ SIMPLE DEPOSIT ERROR:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deposit from Arbitrum to Hyperliquid (Permit Method)
   * This is the final step for all deposit flows
   */
  const depositFromArbitrum = async (amount: number): Promise<HookResponse> => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔵 DEPOSIT DEBUG - Starting deposit:", { amount, address });

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      // Validate amount
      validateDepositAmount(amount);

      // Switch to Arbitrum
      await switchToNetwork(CHAIN_IDS.arbitrum);

      // Check USDC balance on Arbitrum
      const balance = await getUSDCBalance(CHAIN_IDS.arbitrum, address);
      console.log("🔵 DEPOSIT DEBUG - USDC Balance:", { balance, required: amount });

      if (balance < amount) {
        throw new Error(`Insufficient USDC on Arbitrum. You have ${balance.toFixed(2)} USDC but need ${amount} USDC`);
      }

      // Sign permit (30 minutes deadline)
      const deadline = Math.floor(Date.now() / 1000) + 1800;
      console.log("🔵 DEPOSIT DEBUG - Signing permit:", { amount, deadline });

      const permit = await signUSDCPermit(amount, deadline);

      console.log("🔵 DEPOSIT DEBUG - Permit signed:", {
        amount: permit.amount.toString(),
        v: permit.v,
        r: permit.r,
        s: permit.s,
        deadline
      });

      // Call batchedDepositWithPermit on bridge contract
      // The function expects arrays for batch processing
      const tokens = [USDC_ADDRESSES.arbitrum] as const;
      const amounts = [permit.amount];
      const deadlines = [BigInt(deadline)];
      const vs = [permit.v];
      const rs = [permit.r];
      const ss = [permit.s];

      console.log("🔵 DEPOSIT DEBUG - Contract call args:", {
        bridgeAddress: BRIDGE_ADDRESS,
        tokens,
        amounts: amounts.map(a => a.toString()),
        deadlines: deadlines.map(d => d.toString()),
        vs,
        rs,
        ss
      });

      const txHash = await writeContract(wagmiConfig as any, {
        address: BRIDGE_ADDRESS,
        abi: BRIDGE_ABI,
        functionName: 'batchedDepositWithPermit',
        args: [tokens, amounts, deadlines, vs, rs, ss] as const,
        chainId: CHAIN_IDS.arbitrum as any
      });

      triggerRefresh();

      return {
        success: true,
        message: `Deposited ${amount} USDC to Hyperliquid. Funds will arrive in ~1 minute.`,
        txHash: txHash as string
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deposit from Polygon to Hyperliquid
   * Step 1: Bridge Polygon -> Arbitrum (via Lifi)
   * Step 2: Bridge Arbitrum -> Hyperliquid
   */
  const depositFromPolygon = async (amount: number): Promise<HookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address) {
        throw new Error("Please connect your wallet");
      }

      validateDepositAmount(amount);

      // Check balance on Polygon
      const balance = await getUSDCBalance(CHAIN_IDS.polygon, address);
      if (balance < amount) {
        throw new Error(`Insufficient USDC on Polygon. You have ${balance.toFixed(2)} USDC but need ${amount} USDC`);
      }

      // Step 1: Bridge to Arbitrum via Lifi
      await switchToNetwork(CHAIN_IDS.polygon);

      const quote = await fetchQuote({
        address: address as `0x${string}`,
        fromChain: CHAIN_IDS.polygon,
        toChain: CHAIN_IDS.arbitrum,
        fromToken: USDC_ADDRESSES.polygon,
        toToken: USDC_ADDRESSES.arbitrum,
        fromAmount: parseUnits(amount.toString(), 6).toString()
      });

      if (!quote) {
        throw new Error("Failed to get bridge quote from Polygon to Arbitrum");
      }

      const lifiResult = await executeLifi({ quote });
      if (!lifiResult?.txHash) {
        throw new Error("Bridge from Polygon to Arbitrum failed");
      }

      // Wait for bridge completion (estimate 1-3 minutes)
      await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes

      // Step 2: Bridge from Arbitrum to Hyperliquid
      const hyperliquidResult = await depositFromArbitrum(amount);

      return hyperliquidResult;
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deposit from Ethereum to Hyperliquid
   */
  const depositFromEthereum = async (amount: number): Promise<HookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address) {
        throw new Error("Please connect your wallet");
      }

      validateDepositAmount(amount);

      const balance = await getUSDCBalance(CHAIN_IDS.ethereum, address);
      if (balance < amount) {
        throw new Error(`Insufficient USDC on Ethereum. You have ${balance.toFixed(2)} USDC but need ${amount} USDC`);
      }

      // Bridge to Arbitrum via Lifi
      await switchToNetwork(CHAIN_IDS.ethereum);

      const quote = await fetchQuote({
        address: address as `0x${string}`,
        fromChain: CHAIN_IDS.ethereum,
        toChain: CHAIN_IDS.arbitrum,
        fromToken: USDC_ADDRESSES.ethereum,
        toToken: USDC_ADDRESSES.arbitrum,
        fromAmount: parseUnits(amount.toString(), 6).toString()
      });

      if (!quote) {
        throw new Error("Failed to get bridge quote from Ethereum to Arbitrum");
      }

      const lifiResult = await executeLifi({ quote });
      if (!lifiResult?.txHash) {
        throw new Error("Bridge from Ethereum to Arbitrum failed");
      }

      await new Promise(resolve => setTimeout(resolve, 120000));

      const hyperliquidResult = await depositFromArbitrum(amount);
      return hyperliquidResult;
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deposit from BNB Chain to Hyperliquid
   */
  const depositFromBNB = async (amount: number): Promise<HookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address) {
        throw new Error("Please connect your wallet");
      }

      validateDepositAmount(amount);

      const balance = await getUSDCBalance(CHAIN_IDS.bsc, address);
      if (balance < amount) {
        throw new Error(`Insufficient USDC on BNB Chain. You have ${balance.toFixed(2)} USDC but need ${amount} USDC`);
      }

      await switchToNetwork(CHAIN_IDS.bsc);

      const quote = await fetchQuote({
        address: address as `0x${string}`,
        fromChain: CHAIN_IDS.bsc,
        toChain: CHAIN_IDS.arbitrum,
        fromToken: USDC_ADDRESSES.bsc,
        toToken: USDC_ADDRESSES.arbitrum,
        fromAmount: parseUnits(amount.toString(), 6).toString()
      });

      if (!quote) {
        throw new Error("Failed to get bridge quote from BNB Chain to Arbitrum");
      }

      const lifiResult = await executeLifi({ quote });
      if (!lifiResult?.txHash) {
        throw new Error("Bridge from BNB Chain to Arbitrum failed");
      }

      await new Promise(resolve => setTimeout(resolve, 120000));

      const hyperliquidResult = await depositFromArbitrum(amount);
      return hyperliquidResult;
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deposit from Base to Hyperliquid
   */
  const depositFromBase = async (amount: number): Promise<HookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address) {
        throw new Error("Please connect your wallet");
      }

      validateDepositAmount(amount);

      const balance = await getUSDCBalance(CHAIN_IDS.base, address);
      if (balance < amount) {
        throw new Error(`Insufficient USDC on Base. You have ${balance.toFixed(2)} USDC but need ${amount} USDC`);
      }

      await switchToNetwork(CHAIN_IDS.base);

      const quote = await fetchQuote({
        address: address as `0x${string}`,
        fromChain: CHAIN_IDS.base,
        toChain: CHAIN_IDS.arbitrum,
        fromToken: USDC_ADDRESSES.base,
        toToken: USDC_ADDRESSES.arbitrum,
        fromAmount: parseUnits(amount.toString(), 6).toString()
      });

      if (!quote) {
        throw new Error("Failed to get bridge quote from Base to Arbitrum");
      }

      const lifiResult = await executeLifi({ quote });
      if (!lifiResult?.txHash) {
        throw new Error("Bridge from Base to Arbitrum failed");
      }

      await new Promise(resolve => setTimeout(resolve, 120000));

      const hyperliquidResult = await depositFromArbitrum(amount);
      return hyperliquidResult;
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deposit from Optimism to Hyperliquid
   */
  const depositFromOptimism = async (amount: number): Promise<HookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address) {
        throw new Error("Please connect your wallet");
      }

      validateDepositAmount(amount);

      const balance = await getUSDCBalance(CHAIN_IDS.optimism, address);
      if (balance < amount) {
        throw new Error(`Insufficient USDC on Optimism. You have ${balance.toFixed(2)} USDC but need ${amount} USDC`);
      }

      await switchToNetwork(CHAIN_IDS.optimism);

      const quote = await fetchQuote({
        address: address as `0x${string}`,
        fromChain: CHAIN_IDS.optimism,
        toChain: CHAIN_IDS.arbitrum,
        fromToken: USDC_ADDRESSES.optimism,
        toToken: USDC_ADDRESSES.arbitrum,
        fromAmount: parseUnits(amount.toString(), 6).toString()
      });

      if (!quote) {
        throw new Error("Failed to get bridge quote from Optimism to Arbitrum");
      }

      const lifiResult = await executeLifi({ quote });
      if (!lifiResult?.txHash) {
        throw new Error("Bridge from Optimism to Arbitrum failed");
      }

      await new Promise(resolve => setTimeout(resolve, 120000));

      const hyperliquidResult = await depositFromArbitrum(amount);
      return hyperliquidResult;
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // WITHDRAW FUNCTION
  // ====================================

  /**
   * Withdraw from Hyperliquid to Arbitrum
   * Uses EIP-712 signing, no Arbitrum transaction needed
   */
  const withdrawToArbitrum = async (amount: number): Promise<HookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !walletClient) {
        throw new Error("Please connect your wallet");
      }

      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Get current account balance
      const accountState = await getAccountBalance();
      if (!accountState) {
        throw new Error("Failed to fetch account balance");
      }

      const availableBalance = parseFloat(accountState.perpBalance);
      if (availableBalance < amount) {
        throw new Error(`Insufficient balance. Available: ${availableBalance.toFixed(2)} USDC`);
      }

      // Sign EIP-712 withdraw message
      const timestamp = Date.now();

      const domain = {
        name: "Exchange",
        version: "1",
        chainId: 1337,
        verifyingContract: "0x0000000000000000000000000000000000000000" as `0x${string}`
      };

      const types = {
        HyperliquidTransaction: [
          { name: "signatureChainId", type: "string" },
          { name: "hyperliquidChain", type: "string" },
          { name: "destination", type: "string" },
          { name: "amount", type: "string" },
          { name: "time", type: "uint64" }
        ]
      };

      const message = {
        signatureChainId: "0xa4b1", // Arbitrum
        hyperliquidChain: "Mainnet",
        destination: address,
        amount: (amount * 1e6).toString(), // 6 decimals
        time: BigInt(timestamp)
      };

      const signature = await walletClient.signTypedData({
        account: address as `0x${string}`,
        domain,
        types,
        primaryType: "HyperliquidTransaction",
        message
      });

      // Send withdraw request to Hyperliquid API
      const withdrawRequest = {
        action: {
          type: "withdraw3",
          signatureChainId: "0xa4b1",
          hyperliquidChain: "Mainnet",
          destination: address,
          amount: (amount * 1e6).toString(),
          time: timestamp
        },
        nonce: timestamp,
        signature: {
          r: signature.slice(0, 66),
          s: "0x" + signature.slice(66, 130),
          v: parseInt(signature.slice(130, 132), 16)
        }
      };

      const response = await axios.post(`${API_BASE}/exchange`, withdrawRequest);

      if (response.data.status === "ok") {
        return {
          success: true,
          message: `Withdrawal initiated. ${amount} USDC will arrive on Arbitrum in 3-4 minutes.`,
          txHash: response.data.response?.data?.statuses?.[0]?.hash || "pending"
        };
      } else {
        throw new Error(response.data.response || "Withdrawal failed");
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // ACCOUNT INFO FUNCTIONS
  // ====================================

  /**
   * Get account balance on Hyperliquid
   */
  const getAccountBalance = async (): Promise<{ perpBalance: string; spotBalance: string } | null> => {
    try {
      if (!address) return null;

      const [perpState, spotState] = await Promise.all([
        callInfoAPI("clearinghouseState", { user: address }),
        callInfoAPI("spotClearinghouseState", { user: address })
      ]);

      const perpBalance = perpState?.marginSummary?.accountValue || "0";

      let spotBalance = "0";
      if (spotState?.balances) {
        const usdcBalance = spotState.balances.find((b: any) => b.coin === "USDC");
        spotBalance = usdcBalance?.total || "0";
      }

      return { perpBalance, spotBalance };
    } catch (err) {
      console.error("Error fetching balance:", err);
      return null;
    }
  };

  /**
   * Get current perpetual positions
   */
  const getCurrentPositions = async (): Promise<HyperliquidPosition[]> => {
    try {
      if (!address) return [];

      const state: HyperliquidAccountState = await callInfoAPI("clearinghouseState", { user: address });

      if (!state || !state.assetPositions) return [];

      return state.assetPositions
        .filter(ap => parseFloat(ap.position.szi) !== 0)
        .map(ap => ap.position);
    } catch (err) {
      console.error("Error fetching positions:", err);
      return [];
    }
  };

  /**
   * Get spot balances
   */
  const getSpotBalances = async (): Promise<HyperliquidSpotBalance[]> => {
    try {
      if (!address) return [];

      const spotState = await callInfoAPI("spotClearinghouseState", { user: address });

      return spotState?.balances || [];
    } catch (err) {
      console.error("Error fetching spot balances:", err);
      return [];
    }
  };

  /**
   * Get comprehensive account summary
   */
  const getAccountSummary = async () => {
    try {
      if (!address) return null;

      const [perpState, spotState, portfolio] = await Promise.all([
        callInfoAPI("clearinghouseState", { user: address }),
        callInfoAPI("spotClearinghouseState", { user: address }),
        callInfoAPI("portfolio", { user: address })
      ]);

      return {
        perpAccountValue: perpState?.marginSummary?.accountValue || "0",
        perpUnrealizedPnl: perpState?.marginSummary?.totalNtlPos || "0",
        perpPositions: perpState?.assetPositions || [],
        spotBalances: spotState?.balances || [],
        performance: portfolio || {}
      };
    } catch (err) {
      console.error("Error fetching account summary:", err);
      return null;
    }
  };

  // ====================================
  // TRADING FUNCTIONS
  // ====================================

  /**
   * Get asset index for a symbol
   */
  const getAssetIndex = async (symbol: string): Promise<number> => {
    try {
      const meta = await callInfoAPI("meta");
      const universe = meta?.universe || [];

      const asset = universe.find((u: any) => u.name === symbol);
      if (!asset) {
        throw new Error(`Asset ${symbol} not found`);
      }

      return universe.indexOf(asset);
    } catch (err) {
      console.error("Error getting asset index:", err);
      throw new Error(`Failed to find asset ${symbol}`);
    }
  };

  /**
   * Open a perpetual position (long or short)
   */
  const openPerpPosition = async ({
    symbol,
    size,
    leverage,
    isLong,
    orderType = "market",
    limitPrice
  }: OpenPerpPositionParams): Promise<HookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !walletClient) {
        throw new Error("Wallet not connected");
      }

      console.log("🔵 OPEN POSITION:", { symbol, size, leverage, isLong, orderType });

      // Get asset index for the symbol
      const assetIndex = await getAssetIndex(symbol);
      console.log("🔵 Asset index:", assetIndex);

      // Get current price for market orders
      let price = limitPrice;
      if (orderType === "market") {
        const allMids = await callInfoAPI("allMids");
        const currentPrice = parseFloat(allMids[symbol]);
        // Adjust price slightly for market execution (1% slippage)
        price = isLong ? currentPrice * 1.01 : currentPrice * 0.99;
      }

      if (!price) {
        throw new Error("Price is required for limit orders");
      }

      // Calculate position size in coins (not USD value)
      const positionSize = size / price;

      // Format price and size - remove trailing zeros as Hyperliquid requires
      const formattedPrice = removeTrailingZeros(price.toFixed(8));
      const formattedSize = removeTrailingZeros(positionSize.toFixed(8));

      console.log("🔵 Order details:", {
        symbol,
        assetIndex,
        price: formattedPrice,
        positionSize: formattedSize,
        isBuy: isLong,
        leverage
      });

      // Construct order action in Hyperliquid's wire format
      const action = {
        type: "order",
        orders: [{
          a: assetIndex, // asset index
          b: isLong, // is buy (long)
          p: formattedPrice, // price (no trailing zeros)
          s: formattedSize, // size (no trailing zeros)
          r: false, // reduce only (false for opening position)
          t: {
            limit: {
              tif: orderType === "market" ? "Ioc" : "Gtc" // time in force
            }
          }
        }],
        grouping: "na"
      };

      const nonce = Date.now();
      console.log("🔵 Calling exchange API:", { action, nonce });

      const result = await callExchangeAPI(action, nonce);
      console.log("🔵 Order result:", result);

      if (result?.status === "ok") {
        return {
          success: true,
          message: `Opened ${isLong ? "long" : "short"} position on ${symbol}`,
          data: result
        };
      } else {
        throw new Error(result?.response || "Failed to open position");
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("❌ OPEN POSITION ERROR:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close a perpetual position
   */
  const closePerpPosition = async ({
    symbol,
    percentage = 100
  }: ClosePerpPositionParams): Promise<HookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !walletClient) {
        throw new Error("Wallet not connected");
      }

      console.log("🔵 CLOSE POSITION:", { symbol, percentage });

      // Get current positions
      const positions = await getCurrentPositions();
      const position = positions.find(p => p.coin === symbol);

      if (!position) {
        throw new Error(`No open position found for ${symbol}`);
      }

      const currentSize = Math.abs(parseFloat(position.szi));
      const closeSize = (currentSize * percentage) / 100;
      const isLong = parseFloat(position.szi) > 0;

      // Get asset index
      const assetIndex = await getAssetIndex(symbol);

      // Get current price
      const allMids = await callInfoAPI("allMids");
      const currentPrice = parseFloat(allMids[symbol]);

      // Close means opposite direction: if long, sell; if short, buy
      // Add 1% slippage for market execution
      const closePrice = !isLong ? currentPrice * 1.01 : currentPrice * 0.99;

      // Format price and size - remove trailing zeros as Hyperliquid requires
      const formattedPrice = removeTrailingZeros(closePrice.toFixed(8));
      const formattedSize = removeTrailingZeros(closeSize.toFixed(8));

      console.log("🔵 Close order details:", {
        assetIndex,
        currentSize,
        closeSize: formattedSize,
        isLong,
        closePrice: formattedPrice,
        closingDirection: !isLong ? "buy" : "sell"
      });

      // Construct close order in Hyperliquid's wire format
      const action = {
        type: "order",
        orders: [{
          a: assetIndex, // asset index
          b: !isLong, // opposite direction to close (if long, sell; if short, buy)
          p: formattedPrice, // price (no trailing zeros)
          s: formattedSize, // size (no trailing zeros)
          r: true, // reduce only = true for closing positions
          t: {
            limit: {
              tif: "Ioc" // Immediate or cancel for market execution
            }
          }
        }],
        grouping: "na"
      };

      const nonce = Date.now();
      console.log("🔵 Calling exchange API:", { action, nonce });

      const result = await callExchangeAPI(action, nonce);
      console.log("🔵 Close position result:", result);

      if (result?.status === "ok") {
        return {
          success: true,
          message: `Closed ${percentage}% of ${symbol} position`,
          data: result
        };
      } else {
        throw new Error(result?.response || "Failed to close position");
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("❌ CLOSE POSITION ERROR:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // RETURN ALL FUNCTIONS
  // ====================================

  return {
    // State
    loading,
    error,

    // Deposit Functions
    depositFromArbitrum: depositFromArbitrumSimple, // Use simple method by default
    depositFromArbitrumPermit: depositFromArbitrum, // Keep permit method available
    depositFromPolygon,
    depositFromEthereum,
    depositFromBNB,
    depositFromBase,
    depositFromOptimism,

    // Withdraw Function
    withdrawToArbitrum,

    // Trading Functions
    openPerpPosition,
    closePerpPosition,

    // Account Info
    getAccountBalance,
    getCurrentPositions,
    getSpotBalances,
    getAccountSummary,

    // Helper for API calls
    callInfoAPI,
    callExchangeAPI
  };
};
