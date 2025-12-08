/**
 * ChangeNOW V2 API Hook
 *
 * This hook uses the V2 API which provides:
 * - Separate currency and network parameters (no ticker parsing needed)
 * - More accurate minimum amounts
 * - Better fee visibility (depositFee, withdrawalFee)
 * - Header-based authentication (x-changenow-api-key)
 *
 * V2 API Docs: https://changenow.io/api/docs
 */

import { useState } from "react";
import axios, { AxiosError } from "axios";
import { useAccount, useWalletClient, useSwitchChain } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { readContract, getBalance, sendTransaction } from "@wagmi/core";
import { wagmiConfig } from "@/contexts/CustomWagmiProvider";
import { erc20Abi } from "viem";
import { useTokenBalanceRefresh } from "@/contexts/TokenBalanceRefreshContext";
import { getTokens } from "@lifi/sdk";
import {
  ChangeNowCurrencyV2,
  AvailablePairV2,
  MinAmountResponseV2,
  ExchangeRangeResponseV2,
  EstimatedAmountResponseV2,
  CreateExchangeParamsV2,
  CreateExchangeResponseV2,
  TransactionStatusResponseV2,
  ValidateAddressResponseV2,
  ChangeNowError,
  UseNewChangeNowReturn,
} from "@/types/changenow";
import {
  CHAIN_CONFIGS,
  getNativeCurrency,
  getChainConfig,
} from "@/utils/changeNowTokenMapping";

const API_V2_BASE_URL = "https://api.changenow.io/v2";

// =====================================
// Network Name Mapping
// Your chain names → ChangeNOW network names
// =====================================
export const NETWORK_NAME_MAP: Record<string, string> = {
  // Your name → ChangeNOW network name
  ethereum: "eth",
  polygon: "matic",
  arbitrum: "arbitrum",
  optimism: "op",
  base: "base",
  bsc: "bsc",
  "bnb smart chain": "bsc",
  avalanche: "cchain",
  "avalanche c-chain": "cchain",
  fantom: "ftm",
  gnosis: "gno",
  linea: "linea",
  zksync: "zksync",
  "zksync era": "zksync",
  scroll: "scroll",
  blast: "blast",
  mode: "mode",
  mantle: "mantle",
  celo: "celo",
  moonbeam: "glmr",
  moonriver: "movr",
  aurora: "aurora",
  boba: "boba",
  metis: "metis",
  cronos: "cro",
  fuse: "fuse",
  "polygon zkevm": "polygon_zkevm",
  taiko: "taiko",
  sei: "sei",
  fraxtal: "fraxtal",
  rootstock: "rsk",
  lisk: "lisk",
  kaia: "kaia",
  berachain: "bera",
  sonic: "sonic",
  gravity: "gravity",
  "world chain": "wld",
  "immutable zkevm": "imx",
  unichain: "unichain",
  abstract: "abstract",
  soneium: "soneium",
  lens: "lens",
  ink: "ink",
};

// Reverse mapping: ChangeNOW network → Your chain name
export const REVERSE_NETWORK_MAP: Record<string, string> = Object.entries(NETWORK_NAME_MAP).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>
);

// ChangeNOW network → Chain ID mapping
export const NETWORK_TO_CHAIN_ID: Record<string, number> = {
  eth: 1,
  matic: 137,
  arbitrum: 42161,
  op: 10,
  base: 8453,
  bsc: 56,
  cchain: 43114,
  ftm: 250,
  gno: 100,
  linea: 59144,
  zksync: 324,
  scroll: 534352,
  blast: 81457,
  mode: 34443,
  mantle: 5000,
  celo: 42220,
  glmr: 1284,
  movr: 1285,
  aurora: 1313161554,
  boba: 288,
  metis: 1088,
  cro: 25,
  fuse: 122,
  polygon_zkevm: 1101,
  taiko: 167000,
  sei: 1329,
  fraxtal: 252,
  rsk: 30,
  lisk: 1135,
  kaia: 8217,
  bera: 80094,
  sonic: 146,
  gravity: 1625,
  wld: 480,
  imx: 13371,
  unichain: 130,
  abstract: 2741,
  soneium: 1868,
  lens: 232,
  ink: 57073,
};

/**
 * Convert your chain name to ChangeNOW network name
 */
export function toChangeNowNetwork(chainName: string): string {
  const lowerName = chainName.toLowerCase();
  return NETWORK_NAME_MAP[lowerName] || lowerName;
}

/**
 * Convert ChangeNOW network to chain ID
 */
export function networkToChainId(network: string): number | null {
  return NETWORK_TO_CHAIN_ID[network.toLowerCase()] || null;
}

// In-memory cache for token details from LiFi
const tokenDetailsCache = new Map<string, { address: string; decimals: number }>();

export const useNewChangeNowHook = (): UseNewChangeNowReturn => {
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const { triggerRefresh } = useTokenBalanceRefresh();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = process.env.NEXT_PUBLIC_CHANGENOW_API_KEY || "";

  // V2 API uses header-based authentication
  const getHeaders = () => ({
    "x-changenow-api-key": API_KEY,
    "Content-Type": "application/json",
  });

  // =====================================
  // Natural Error Message Generator
  // =====================================
  const generateNaturalErrorMessage = (
    errorCode: string | undefined,
    errorMessage: string | undefined,
    context: string
  ): string => {
    // Map common ChangeNow error codes/messages to natural language
    const errorCodeMap: Record<string, string> = {
      // API error codes
      "not_valid_params": "The exchange parameters are invalid. Please check your token symbols and try again.",
      "out_of_range": "The amount you entered is outside the allowed range for this exchange.",
      "deposit_too_small": "The deposit amount is too small for this exchange. Please increase the amount to meet the minimum requirement.",
      "pair_is_inactive": "This token pair isn't available for exchange right now. Please try a different pair.",
      "not_available": "This exchange pair is temporarily unavailable. Please try again later or choose different tokens.",
      "invalid_address": "The wallet address provided is invalid. Please check and try again.",
      "currency_not_found": "I couldn't find one of the tokens you specified. Please verify the token symbol.",
      "network_not_found": "The network you specified isn't supported. Please use a supported network like Ethereum, Polygon, or Arbitrum.",
    };

    // Check error code first
    if (errorCode && errorCodeMap[errorCode.toLowerCase()]) {
      return errorCodeMap[errorCode.toLowerCase()];
    }

    // Check error message patterns
    if (errorMessage) {
      const lowerMessage = errorMessage.toLowerCase();

      if (lowerMessage.includes("pair") && lowerMessage.includes("not")) {
        return "This token pair isn't currently available for exchange. Try selecting a different combination.";
      }
      if (lowerMessage.includes("minimum") || lowerMessage.includes("min amount")) {
        return "The amount you entered is below the minimum required. Please increase the amount.";
      }
      if (lowerMessage.includes("maximum") || lowerMessage.includes("max amount")) {
        return "The amount you entered exceeds the maximum allowed. Please reduce the amount.";
      }
      if (lowerMessage.includes("insufficient") || lowerMessage.includes("balance")) {
        return "You don't have enough balance to complete this exchange. Please check your wallet balance.";
      }
      if (lowerMessage.includes("network") || lowerMessage.includes("chain")) {
        return "There's an issue with the network configuration. Please make sure you're on the correct network.";
      }
      if (lowerMessage.includes("address") && lowerMessage.includes("invalid")) {
        return "The wallet address provided isn't valid for this token. Please double-check the address.";
      }
      if (lowerMessage.includes("rate") && lowerMessage.includes("expired")) {
        return "The exchange rate has expired. Please try again to get a fresh quote.";
      }
    }

    // Context-specific fallbacks
    const contextMessages: Record<string, string> = {
      "fetch currencies": "I'm having trouble fetching available currencies. Please try again in a moment.",
      "min amount": "I couldn't determine the minimum exchange amount. Please try again.",
      "exchange range": "I couldn't get the exchange limits for this pair. The pair may not be available.",
      "estimated amount": "I couldn't estimate the exchange amount. Try a different amount or pair.",
      "create exchange": "There was an issue creating your exchange order. Please try again.",
      "transaction status": "I couldn't check the transaction status. You can track it directly on ChangeNow.",
      "validate address": "I couldn't validate the wallet address. Please check and try again.",
      "send funds": "There was an issue sending funds to the exchange. Please check your balance and try again.",
    };

    for (const [key, message] of Object.entries(contextMessages)) {
      if (context.toLowerCase().includes(key)) {
        return message;
      }
    }

    // Default fallback
    return `Something went wrong with the exchange: ${context}. Please try again.`;
  };

  // Helper to handle API errors with natural messages
  const handleApiError = (err: unknown, defaultMessage: string): void => {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<ChangeNowError>;
      const errorCode = axiosError.response?.data?.error;
      const apiErrorMessage = axiosError.response?.data?.message;

      // Generate natural error message
      const naturalMessage = generateNaturalErrorMessage(errorCode, apiErrorMessage, defaultMessage);

      setError(naturalMessage);
      console.error(`[ChangeNow V2] ${defaultMessage}:`, {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        naturalMessage,
      });
    } else {
      const naturalMessage = generateNaturalErrorMessage(undefined, undefined, defaultMessage);
      setError(naturalMessage);
      console.error(`[ChangeNow V2] ${defaultMessage}:`, err);
    }
  };

  // =====================================
  // V2 API Methods
  // =====================================

  /**
   * Get all available currencies (V2)
   */
  const getCurrencies = async (
    params?: { active?: boolean; fixedRate?: boolean; buy?: boolean; sell?: boolean }
  ): Promise<ChangeNowCurrencyV2[] | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string> = {};
      if (params?.active !== undefined) queryParams.active = params.active.toString();
      if (params?.fixedRate !== undefined) queryParams.fixedRate = params.fixedRate.toString();
      if (params?.buy !== undefined) queryParams.buy = params.buy.toString();
      if (params?.sell !== undefined) queryParams.sell = params.sell.toString();

      const response = await axios.get<ChangeNowCurrencyV2[]>(
        `${API_V2_BASE_URL}/exchange/currencies`,
        {
          params: queryParams,
          headers: getHeaders(),
        }
      );

      console.log(`[ChangeNow V2] Fetched ${response.data.length} currencies`);
      return response.data;
    } catch (err) {
      handleApiError(err, "Failed to fetch currencies");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get only EVM chain currencies (filtered by our supported chains)
   */
  const getEVMCurrencies = async (
    params?: { active?: boolean; fixedRate?: boolean }
  ): Promise<ChangeNowCurrencyV2[] | undefined> => {
    try {
      const allCurrencies = await getCurrencies({
        active: params?.active ?? true,
        fixedRate: params?.fixedRate,
      });
      if (!allCurrencies) return undefined;

      // Get list of supported networks
      const supportedNetworks = new Set(Object.values(NETWORK_NAME_MAP));

      // Filter to only include currencies on our supported EVM chains
      const evmCurrencies = allCurrencies.filter((currency) => {
        // Exclude fiat currencies
        if (currency.isFiat) return false;

        // Check if network is in our supported list
        return supportedNetworks.has(currency.network.toLowerCase());
      });

      console.log(`[ChangeNow V2] Filtered to ${evmCurrencies.length} EVM currencies`);
      return evmCurrencies;
    } catch (err) {
      handleApiError(err, "Failed to fetch EVM currencies");
      return undefined;
    }
  };

  /**
   * Get available pairs (V2)
   * NOTE: This endpoint requires partner-level API access.
   * Use getExchangeRange() for pair validation instead.
   */
  const getAvailablePairs = async (params?: {
    fromCurrency?: string;
    toCurrency?: string;
    fromNetwork?: string;
    toNetwork?: string;
    flow?: "standard" | "fixed-rate";
  }): Promise<AvailablePairV2[] | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string> = {};
      if (params?.fromCurrency) queryParams.fromCurrency = params.fromCurrency.toLowerCase();
      if (params?.toCurrency) queryParams.toCurrency = params.toCurrency.toLowerCase();
      if (params?.fromNetwork) queryParams.fromNetwork = toChangeNowNetwork(params.fromNetwork);
      if (params?.toNetwork) queryParams.toNetwork = toChangeNowNetwork(params.toNetwork);
      if (params?.flow) queryParams.flow = params.flow;

      // This endpoint uses x-api-key header (different from other V2 endpoints)
      const response = await axios.get<AvailablePairV2[]>(
        `${API_V2_BASE_URL}/exchange/available-pairs`,
        {
          params: queryParams,
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (err) {
      handleApiError(err, "Failed to fetch available pairs");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get minimum exchange amount (V2 - more accurate!)
   */
  const getMinAmount = async (params: {
    fromCurrency: string;
    toCurrency: string;
    fromNetwork: string;
    toNetwork: string;
    flow?: "standard" | "fixed-rate";
  }): Promise<MinAmountResponseV2 | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        fromCurrency: params.fromCurrency.toLowerCase(),
        toCurrency: params.toCurrency.toLowerCase(),
        fromNetwork: toChangeNowNetwork(params.fromNetwork),
        toNetwork: toChangeNowNetwork(params.toNetwork),
        flow: params.flow || "standard",
      };

      console.log(`[ChangeNow V2] Getting min amount:`, queryParams);

      const response = await axios.get<MinAmountResponseV2>(
        `${API_V2_BASE_URL}/exchange/min-amount`,
        {
          params: queryParams,
          headers: getHeaders(),
        }
      );

      console.log(`[ChangeNow V2] Min amount response:`, response.data);
      return response.data;
    } catch (err) {
      // Don't set error for pair not available - just return undefined
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        console.log(
          `[ChangeNow V2] Pair not available: ${params.fromCurrency}/${params.fromNetwork} → ${params.toCurrency}/${params.toNetwork}`
        );
        return undefined;
      }
      handleApiError(err, "Failed to get min amount");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get exchange range (min/max amounts) (V2)
   */
  const getExchangeRange = async (params: {
    fromCurrency: string;
    toCurrency: string;
    fromNetwork: string;
    toNetwork: string;
    flow?: "standard" | "fixed-rate";
  }): Promise<ExchangeRangeResponseV2 | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        fromCurrency: params.fromCurrency.toLowerCase(),
        toCurrency: params.toCurrency.toLowerCase(),
        fromNetwork: toChangeNowNetwork(params.fromNetwork),
        toNetwork: toChangeNowNetwork(params.toNetwork),
        flow: params.flow || "standard",
      };

      console.log(`[ChangeNow V2] Getting exchange range:`, queryParams);

      const response = await axios.get<ExchangeRangeResponseV2>(
        `${API_V2_BASE_URL}/exchange/range`,
        {
          params: queryParams,
          headers: getHeaders(),
        }
      );

      console.log(`[ChangeNow V2] Exchange range response:`, response.data);
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        console.log(
          `[ChangeNow V2] Range not available for pair: ${params.fromCurrency}/${params.fromNetwork} → ${params.toCurrency}/${params.toNetwork}`
        );
        return undefined;
      }
      handleApiError(err, "Failed to get exchange range");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get estimated exchange amount (V2)
   */
  const getEstimatedAmount = async (params: {
    fromCurrency: string;
    toCurrency: string;
    fromNetwork: string;
    toNetwork: string;
    fromAmount?: number;
    toAmount?: number;
    flow?: "standard" | "fixed-rate";
    type?: "direct" | "reverse";
    useRateId?: boolean;
  }): Promise<EstimatedAmountResponseV2 | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string> = {
        fromCurrency: params.fromCurrency.toLowerCase(),
        toCurrency: params.toCurrency.toLowerCase(),
        fromNetwork: toChangeNowNetwork(params.fromNetwork),
        toNetwork: toChangeNowNetwork(params.toNetwork),
        flow: params.flow || "standard",
        type: params.type || "direct",
      };

      if (params.fromAmount !== undefined) {
        queryParams.fromAmount = params.fromAmount.toString();
      }
      if (params.toAmount !== undefined) {
        queryParams.toAmount = params.toAmount.toString();
      }
      if (params.useRateId !== undefined) {
        queryParams.useRateId = params.useRateId.toString();
      }

      console.log(`[ChangeNow V2] Getting estimated amount:`, queryParams);

      const response = await axios.get<EstimatedAmountResponseV2>(
        `${API_V2_BASE_URL}/exchange/estimated-amount`,
        {
          params: queryParams,
          headers: getHeaders(),
        }
      );

      console.log(`[ChangeNow V2] Estimated amount response:`, response.data);
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as ChangeNowError | undefined;
        const errorType = errorData?.error;

        if (errorType === "deposit_too_small" || errorType === "out_of_range") {
          console.log(
            `[ChangeNow V2] Amount below minimum for ${params.fromCurrency}/${params.fromNetwork}`
          );
          return undefined;
        }
      }
      handleApiError(err, "Failed to get estimated amount");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get transaction status (V2)
   */
  const getTransactionStatus = async (
    id: string
  ): Promise<TransactionStatusResponseV2 | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<TransactionStatusResponseV2>(
        `${API_V2_BASE_URL}/exchange/by-id`,
        {
          params: { id },
          headers: getHeaders(),
        }
      );

      return response.data;
    } catch (err) {
      handleApiError(err, `Failed to get transaction status for ${id}`);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate address (V2)
   */
  const validateAddress = async (params: {
    currency: string;
    address: string;
  }): Promise<ValidateAddressResponseV2 | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<ValidateAddressResponseV2>(
        `${API_V2_BASE_URL}/validate/address`,
        {
          params: {
            currency: params.currency.toLowerCase(),
            address: params.address,
          },
          headers: getHeaders(),
        }
      );

      return response.data;
    } catch (err) {
      handleApiError(err, `Failed to validate address for ${params.currency}`);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create exchange transaction (V2)
   */
  const createExchange = async (
    params: CreateExchangeParamsV2
  ): Promise<CreateExchangeResponseV2 | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        fromCurrency: params.fromCurrency.toLowerCase(),
        toCurrency: params.toCurrency.toLowerCase(),
        fromNetwork: toChangeNowNetwork(params.fromNetwork),
        toNetwork: toChangeNowNetwork(params.toNetwork),
        fromAmount: params.fromAmount?.toString() || "",
        toAmount: params.toAmount?.toString() || "",
        address: params.address,
        flow: params.flow,
        type: params.type || "direct",
        ...(params.extraId && { extraId: params.extraId }),
        ...(params.refundAddress && { refundAddress: params.refundAddress }),
        ...(params.refundExtraId && { refundExtraId: params.refundExtraId }),
        ...(params.userId && { userId: params.userId }),
        ...(params.payload && { payload: params.payload }),
        ...(params.contactEmail && { contactEmail: params.contactEmail }),
        ...(params.rateId && { rateId: params.rateId }),
      };

      console.log(`[ChangeNow V2] Creating exchange:`, requestBody);

      const response = await axios.post<CreateExchangeResponseV2>(
        `${API_V2_BASE_URL}/exchange`,
        requestBody,
        {
          headers: getHeaders(),
        }
      );

      console.log(`[ChangeNow V2] Exchange created:`, response.data);
      return response.data;
    } catch (err) {
      handleApiError(err, "Failed to create exchange");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // Wallet Integration Functions
  // =====================================

  /**
   * Get token details from LiFi dynamically
   */
  const getTokenDetailsFromLiFi = async (
    tokenSymbol: string,
    chainId: number
  ): Promise<{ address: string; decimals: number } | null> => {
    const cacheKey = `${chainId}-${tokenSymbol.toLowerCase()}`;

    if (tokenDetailsCache.has(cacheKey)) {
      return tokenDetailsCache.get(cacheKey)!;
    }

    try {
      const tokensResponse = await getTokens({ chains: [chainId] });
      const tokensData = (tokensResponse as any).tokens || tokensResponse;
      const tokensForChain = tokensData[chainId];

      if (!tokensForChain || tokensForChain.length === 0) {
        console.log(`[LiFi] No tokens found for chain ${chainId}`);
        return null;
      }

      const token = tokensForChain.find(
        (t: any) => t.symbol.toLowerCase() === tokenSymbol.toLowerCase()
      );

      if (!token) {
        console.log(`[LiFi] Token ${tokenSymbol} not found on chain ${chainId}`);
        return null;
      }

      const details = { address: token.address, decimals: token.decimals };
      tokenDetailsCache.set(cacheKey, details);
      return details;
    } catch (err) {
      console.error(`[LiFi] Failed to fetch token ${tokenSymbol}:`, err);
      return null;
    }
  };

  /**
   * Check if currency is native on the given chain
   */
  const isNativeCurrency = (currency: string, chainId: number): boolean => {
    const config = CHAIN_CONFIGS[chainId];
    if (!config) return false;

    const nativeSymbols = [
      config.nativeCurrency.symbol.toLowerCase(),
      // Common aliases
      "eth",
      "matic",
      "bnb",
      "avax",
      "ftm",
    ];

    return nativeSymbols.includes(currency.toLowerCase());
  };

  /**
   * Send funds to deposit address
   */
  const sendToDepositAddress = async (
    depositAddress: string,
    amount: number,
    currency: string,
    network: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Wallet not connected");
      }

      // Get chain ID from network
      const chainId = networkToChainId(toChangeNowNetwork(network));
      if (!chainId) {
        throw new Error(`Unknown network: ${network}`);
      }

      // Switch chain if needed
      if (chain?.id !== chainId) {
        const chainConfig = getChainConfig(chainId);
        const chainName = chainConfig?.name || `Chain ${chainId}`;

        console.log(`[Wallet] Switching to ${chainName}...`);

        if (!switchChainAsync) {
          throw new Error("Chain switching not available");
        }

        await switchChainAsync({ chainId });
      }

      // Check if it's native currency
      if (isNativeCurrency(currency, chainId)) {
        return await sendNativeCurrency(depositAddress, amount, chainId);
      } else {
        return await sendERC20Token(depositAddress, amount, currency, chainId);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to send funds";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send native currency
   */
  const sendNativeCurrency = async (
    depositAddress: string,
    amount: number,
    chainId: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      const nativeCurrency = getNativeCurrency(chainId);
      const decimals = nativeCurrency?.decimals || 18;
      const amountWei = parseUnits(amount.toString(), decimals);

      // Check balance
      const balance = await getBalance(wagmiConfig as any, {
        address: address as `0x${string}`,
        chainId,
      });

      if (balance.value < amountWei) {
        throw new Error(
          `Insufficient balance. Required: ${amount}, Available: ${formatUnits(balance.value, decimals)}`
        );
      }

      // Send transaction
      const hash = await sendTransaction(wagmiConfig as any, {
        to: depositAddress as `0x${string}`,
        value: amountWei,
      });

      triggerRefresh();

      return { success: true, txHash: hash };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to send native currency" };
    }
  };

  /**
   * Send ERC20 token
   */
  const sendERC20Token = async (
    depositAddress: string,
    amount: number,
    currency: string,
    chainId: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      // Get token details from LiFi
      const tokenDetails = await getTokenDetailsFromLiFi(currency, chainId);

      if (!tokenDetails) {
        throw new Error(`Token ${currency} not found on chain ${chainId}`);
      }

      const { address: tokenAddress, decimals } = tokenDetails;
      const amountBigInt = parseUnits(amount.toString(), decimals);

      // Check balance
      const balance = await readContract(wagmiConfig as any, {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
        chainId,
      });

      if ((balance as bigint) < amountBigInt) {
        throw new Error(
          `Insufficient ${currency.toUpperCase()} balance. Required: ${amount}, Available: ${formatUnits(balance as bigint, decimals)}`
        );
      }

      // Transfer tokens (no approval needed for direct transfer)
      const hash = await walletClient?.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [depositAddress as `0x${string}`, amountBigInt],
        chain: undefined,
      });

      if (!hash) {
        throw new Error("Transaction failed");
      }

      triggerRefresh();

      return { success: true, txHash: hash };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to send token" };
    }
  };

  // =====================================
  // Orchestrated Exchange Flow
  // =====================================

  /**
   * Execute complete exchange flow with progress tracking
   */
  const executeExchange = async (params: {
    fromCurrency: string;
    fromNetwork: string;
    toCurrency: string;
    toNetwork: string;
    amount: number;
    recipientAddress: string;
    refundAddress?: string;
    isFixedRate?: boolean;
    autoSendFromWallet?: boolean;
    onProgress?: (progress: {
      step: "validating" | "estimating" | "creating" | "sending" | "tracking" | "completed";
      status: "loading" | "success" | "error";
      message?: string;
      data?: any;
    }) => void;
  }): Promise<{
    success: boolean;
    exchange?: CreateExchangeResponseV2;
    transaction?: TransactionStatusResponseV2;
    depositTxHash?: string;
    error?: string;
  }> => {
    const {
      fromCurrency,
      fromNetwork,
      toCurrency,
      toNetwork,
      amount,
      recipientAddress,
      refundAddress,
      isFixedRate = false,
      autoSendFromWallet = false,
      onProgress,
    } = params;

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      const error = "Please enter a valid amount greater than zero to proceed with the exchange.";
      onProgress?.({ step: "validating", status: "error", message: error });
      return { success: false, error };
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Get exchange range (includes min amount)
      onProgress?.({ step: "validating", status: "loading", message: "Checking exchange limits..." });

      const rangeData = await getExchangeRange({
        fromCurrency,
        toCurrency,
        fromNetwork,
        toNetwork,
        flow: isFixedRate ? "fixed-rate" : "standard",
      });

      if (!rangeData) {
        const error = `This token pair (${fromCurrency.toUpperCase()} on ${fromNetwork} → ${toCurrency.toUpperCase()} on ${toNetwork}) isn't available for exchange right now. Try selecting a different pair or use a more common token like ETH or USDC.`;
        onProgress?.({ step: "validating", status: "error", message: error });
        return { success: false, error };
      }

      console.log(`[V2 Exchange] Range: min=${rangeData.minAmount}, max=${rangeData.maxAmount}`);

      if (amount < rangeData.minAmount) {
        const error = `The amount you entered is below the minimum required. Please use at least ${rangeData.minAmount} ${fromCurrency.toUpperCase()} to proceed with this exchange.`;
        onProgress?.({ step: "validating", status: "error", message: error });
        return { success: false, error };
      }

      if (rangeData.maxAmount && amount > rangeData.maxAmount) {
        const error = `The amount you entered exceeds the maximum allowed for this exchange. Please reduce the amount to ${rangeData.maxAmount} ${fromCurrency.toUpperCase()} or less.`;
        onProgress?.({ step: "validating", status: "error", message: error });
        return { success: false, error };
      }

      onProgress?.({
        step: "validating",
        status: "success",
        message: "Exchange limits validated",
        data: rangeData,
      });

      // Step 2: Get estimate
      onProgress?.({ step: "estimating", status: "loading", message: "Getting exchange rate..." });

      const estimateData = await getEstimatedAmount({
        fromCurrency,
        toCurrency,
        fromNetwork,
        toNetwork,
        fromAmount: amount,
        flow: isFixedRate ? "fixed-rate" : "standard",
        type: "direct",
        useRateId: isFixedRate,
      });

      if (!estimateData) {
        const error = `I couldn't get an exchange rate estimate for this pair right now. This usually means the amount is too small or there's temporary low liquidity. Try increasing the amount or waiting a moment.`;
        onProgress?.({ step: "estimating", status: "error", message: error });
        return { success: false, error };
      }

      onProgress?.({
        step: "estimating",
        status: "success",
        message: `You will receive ~${estimateData.toAmount} ${toCurrency.toUpperCase()}`,
        data: estimateData,
      });

      // Step 2.5: Validate balance if autoSendFromWallet
      if (autoSendFromWallet) {
        onProgress?.({ step: "validating", status: "loading", message: "Checking wallet balance..." });

        if (!address || !isConnected) {
          const error = "Please connect your wallet to proceed with the exchange. I need wallet access to send funds.";
          onProgress?.({ step: "validating", status: "error", message: error });
          return { success: false, error };
        }

        const chainId = networkToChainId(toChangeNowNetwork(fromNetwork));
        if (!chainId) {
          const error = `The network "${fromNetwork}" isn't supported. Please use a supported network like Ethereum, Polygon, Arbitrum, Base, or BNB Chain.`;
          onProgress?.({ step: "validating", status: "error", message: error });
          return { success: false, error };
        }

        // Check balance based on currency type
        try {
          if (isNativeCurrency(fromCurrency, chainId)) {
            const nativeCurrency = getNativeCurrency(chainId);
            const decimals = nativeCurrency?.decimals || 18;
            const amountWei = parseUnits(amount.toString(), decimals);

            const balance = await getBalance(wagmiConfig as any, {
              address: address as `0x${string}`,
              chainId,
            });

            if (balance.value < amountWei) {
              const availableBalance = formatUnits(balance.value, decimals);
              const error = `You don't have enough balance to complete this exchange. You need ${amount} but only have ${availableBalance} available. Please add more funds or try a smaller amount.`;
              onProgress?.({ step: "validating", status: "error", message: error });
              return { success: false, error };
            }
          } else {
            const tokenDetails = await getTokenDetailsFromLiFi(fromCurrency, chainId);
            if (tokenDetails) {
              const { address: tokenAddress, decimals } = tokenDetails;
              const amountBigInt = parseUnits(amount.toString(), decimals);

              const balance = await readContract(wagmiConfig as any, {
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [address as `0x${string}`],
                chainId,
              });

              if ((balance as bigint) < amountBigInt) {
                const availableBalance = formatUnits(balance as bigint, decimals);
                const error = `You don't have enough ${fromCurrency.toUpperCase()} for this exchange. You need ${amount} but only have ${availableBalance} available. Please add more tokens or try a smaller amount.`;
                onProgress?.({ step: "validating", status: "error", message: error });
                return { success: false, error };
              }
            }
          }

          onProgress?.({ step: "validating", status: "success", message: "Balance validated" });
        } catch (err: any) {
          const error = `I couldn't verify your wallet balance. Please check your network connection and try again. (${err.message})`;
          onProgress?.({ step: "validating", status: "error", message: error });
          return { success: false, error };
        }
      }

      // Step 3: Create exchange
      onProgress?.({ step: "creating", status: "loading", message: "Creating exchange..." });

      const exchange = await createExchange({
        fromCurrency,
        toCurrency,
        fromNetwork,
        toNetwork,
        fromAmount: amount,
        address: recipientAddress,
        refundAddress: refundAddress || address || undefined,
        flow: isFixedRate ? "fixed-rate" : "standard",
        type: "direct",
        rateId: isFixedRate ? estimateData.rateId || undefined : undefined,
      });

      if (!exchange) {
        const error = "There was an issue creating your exchange order. This could be a temporary service issue with ChangeNow. Please wait a moment and try again.";
        onProgress?.({ step: "creating", status: "error", message: error });
        return { success: false, error };
      }

      onProgress?.({
        step: "creating",
        status: "success",
        message: "Exchange created successfully",
        data: exchange,
      });

      // Step 4: Send funds (if autoSend)
      let depositTxHash: string | undefined;

      if (autoSendFromWallet) {
        onProgress?.({ step: "sending", status: "loading", message: "Sending funds from wallet..." });

        const sendResult = await sendToDepositAddress(
          exchange.payinAddress,
          amount,
          fromCurrency,
          fromNetwork
        );

        if (!sendResult.success) {
          let naturalError = "There was an issue sending funds to the exchange. Please check your wallet and try again.";

          if (sendResult.error) {
            const errorLower = sendResult.error.toLowerCase();
            // Check for user rejection patterns
            if (
              errorLower.includes("user rejected") ||
              errorLower.includes("user denied") ||
              errorLower.includes("rejected the request") ||
              errorLower.includes("denied transaction")
            ) {
              naturalError = "Looks like you cancelled the transaction. No worries! Let me know when you're ready to try again.";
            } else if (sendResult.error.includes("Insufficient")) {
              naturalError = sendResult.error;
            } else if (errorLower.includes("insufficient")) {
              naturalError = "You don't have enough balance to complete this exchange. Please check your wallet balance.";
            } else {
              naturalError = `There was an issue sending funds to the exchange: ${sendResult.error}`;
            }
          }

          onProgress?.({
            step: "sending",
            status: "error",
            message: naturalError,
          });
          // Return exchange info even if send fails
          return { success: false, exchange, error: naturalError };
        }

        depositTxHash = sendResult.txHash;
        onProgress?.({
          step: "sending",
          status: "success",
          message: "Funds sent successfully",
          data: { txHash: depositTxHash },
        });
      }

      // Step 5: Track transaction status
      onProgress?.({
        step: "tracking",
        status: "loading",
        message: "Waiting for deposit confirmation...",
      });

      const pollStatus = async (): Promise<TransactionStatusResponseV2 | undefined> => {
        let attempts = 0;
        const maxAttempts = 180; // 30 minutes max

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds

          const status = await getTransactionStatus(exchange.id);
          if (!status) {
            attempts++;
            continue;
          }

          onProgress?.({
            step: "tracking",
            status: "loading",
            message: status.status,
            data: status,
          });

          if (status.status === "finished") {
            onProgress?.({
              step: "completed",
              status: "success",
              message: "Exchange completed successfully!",
              data: status,
            });
            return status;
          } else if (["failed", "refunded", "expired"].includes(status.status)) {
            onProgress?.({
              step: "tracking",
              status: "error",
              message: `Exchange ${status.status}`,
              data: status,
            });
            return status;
          }

          attempts++;
        }

        onProgress?.({
          step: "tracking",
          status: "error",
          message: "The exchange is taking longer than expected. You can track the status at changenow.io/exchange/txs using your exchange ID.",
        });
        return undefined;
      };

      const finalStatus = await pollStatus();

      return {
        success: true,
        exchange,
        transaction: finalStatus,
        depositTxHash,
      };
    } catch (err: any) {
      // Generate natural error message
      let errorMsg = "Something went wrong with the exchange. Please try again.";

      if (err.message) {
        // Check for common error patterns and provide natural responses
        if (err.message.includes("user rejected") || err.message.includes("user denied")) {
          errorMsg = "Looks like you cancelled the transaction. No worries! Let me know when you're ready to try again.";
        } else if (err.message.includes("insufficient")) {
          errorMsg = "You don't have enough balance to complete this exchange. Please check your wallet balance.";
        } else if (err.message.includes("network") || err.message.includes("chain")) {
          errorMsg = "There was a network issue. Please make sure you're connected to the correct network and try again.";
        } else {
          errorMsg = `Exchange encountered an issue: ${err.message}`;
        }
      }

      setError(errorMsg);
      onProgress?.({ step: "validating", status: "error", message: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    // V2 API methods
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
    // Orchestrated flow
    executeExchange,
  };
};

export default useNewChangeNowHook;
