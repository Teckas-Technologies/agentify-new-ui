import { useState } from "react";
import axios, { AxiosError } from "axios";
import { useAccount, useWalletClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { readContract, getBalance, sendTransaction } from "@wagmi/core";
import { wagmiConfig } from "@/contexts/CustomWagmiProvider";
import { erc20Abi } from "viem";
import { useTokenBalanceRefresh } from "@/contexts/TokenBalanceRefreshContext";
import {
  ChangeNowCurrency,
  CurrencyInfoResponse,
  AvailableCurrenciesForResponse,
  MinAmountResponse,
  ExchangeAmountResponse,
  FixedRateExchangeResponse,
  ExchangeRangeResponse,
  CreateExchangeParams,
  CreateExchangeResponse,
  TransactionStatusResponse,
  AvailablePairsResponse,
  AvailableActionsResponse,
  FixedRateMarketsResponse,
  ValidateAddressResponse,
  ChangeNowError,
  UseChangeNowReturn,
} from "@/types/changenow";
import {
  parseChangeNowTicker,
  getTokenAddress as getTokenAddressFromMapping,
  isNativeCurrency as isNativeCurrencyCheck,
  getNativeCurrency,
  getChainConfig,
} from "@/utils/changeNowTokenMapping";

const API_BASE_URL = "https://api.changenow.io/v1";
const API_V2_BASE_URL = "https://api.changenow.io/v2";

export const useChangeNowHook = (): UseChangeNowReturn => {
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { triggerRefresh } = useTokenBalanceRefresh();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = process.env.NEXT_PUBLIC_CHANGENOW_API_KEY || "";

  // Helper to handle API errors
  const handleApiError = (err: unknown, defaultMessage: string): void => {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<ChangeNowError>;
      const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || defaultMessage;
      setError(errorMessage);
    } else {
      setError(defaultMessage);
    }
  };

  // Get available currencies
  const getCurrencies = async (
    active: boolean = true,
    fixedRate: boolean = false
  ): Promise<ChangeNowCurrency[] | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (active) params.active = "true";
      if (fixedRate) params.fixedRate = "true";

      const response = await axios.get<ChangeNowCurrency[]>(`${API_BASE_URL}/currencies`, {
        params: {
          ...params,
          api_key: API_KEY,
        },
      });

      return response.data;
    } catch (err) {
      handleApiError(err, "Failed to fetch currencies");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get currency info (with explorer links and wallet recommendations)
  const getCurrencyInfo = async (ticker: string): Promise<CurrencyInfoResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<CurrencyInfoResponse>(
        `${API_BASE_URL}/currencies/${ticker.toLowerCase()}`
      );

      return response.data;
    } catch (err) {
      handleApiError(err, `Failed to fetch info for currency ${ticker}`);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get available currencies for a specific currency (dynamic pair filtering)
  const getAvailableCurrenciesFor = async (
    ticker: string,
    fixedRate: boolean = false
  ): Promise<AvailableCurrenciesForResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (fixedRate) params.fixedRate = "true";

      const response = await axios.get<AvailableCurrenciesForResponse>(
        `${API_BASE_URL}/currencies-to/${ticker.toLowerCase()}`,
        {
          params,
        }
      );

      return response.data;
    } catch (err) {
      handleApiError(err, `Failed to fetch available currencies for ${ticker}`);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get minimum exchange amount
  const getMinAmount = async (from: string, to: string): Promise<MinAmountResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<MinAmountResponse>(
        `${API_BASE_URL}/min-amount/${from.toLowerCase()}_${to.toLowerCase()}`,
        {
          params: { api_key: API_KEY },
        }
      );

      return response.data;
    } catch (err) {
      // Silently fail for unsupported pairs - don't set error for this
      console.log(`Pair ${from}/${to} not available`);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get exchange amount estimate (floating rate)
  const getExchangeAmount = async (
    amount: number,
    from: string,
    to: string
  ): Promise<ExchangeAmountResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<ExchangeAmountResponse>(
        `${API_BASE_URL}/exchange-amount/${amount}/${from.toLowerCase()}_${to.toLowerCase()}`,
        {
          params: { api_key: API_KEY },
        }
      );

      return response.data;
    } catch (err) {
      // Only show error if it's not a "pair not supported" error
      if (axios.isAxiosError(err)) {
        const errorMsg = err.response?.data?.message || "";
        if (!errorMsg.includes("not supported") && !errorMsg.includes("not_valid_params")) {
          handleApiError(err, `Failed to get exchange estimate for ${from}/${to}`);
        }
      }
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get fixed rate exchange amount
  const getFixedRateAmount = async (
    amount: number,
    from: string,
    to: string
  ): Promise<FixedRateExchangeResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<FixedRateExchangeResponse>(
        `${API_BASE_URL}/exchange-amount/fixed-rate/${amount}/${from.toLowerCase()}_${to.toLowerCase()}`,
        {
          params: { api_key: API_KEY },
        }
      );

      return response.data;
    } catch (err) {
      handleApiError(err, `Failed to get fixed rate estimate for ${from}/${to}`);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get exchange range (min/max amounts)
  const getExchangeRange = async (from: string, to: string): Promise<ExchangeRangeResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<ExchangeRangeResponse>(`${API_V2_BASE_URL}/exchange/range`, {
        params: {
          fromCurrency: from.toLowerCase(),
          toCurrency: to.toLowerCase(),
        },
        headers: {
          "x-changenow-api-key": API_KEY,
        },
      });

      return response.data;
    } catch (err) {
      // Silently fail for unsupported pairs
      console.log(`Range not available for ${from}/${to}`);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get transaction status
  const getTransactionStatus = async (id: string): Promise<TransactionStatusResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<TransactionStatusResponse>(`${API_BASE_URL}/transactions/${id}/${API_KEY}`);

      return response.data;
    } catch (err) {
      handleApiError(err, `Failed to get transaction status for ${id}`);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get available pairs
  const getAvailablePairs = async (): Promise<AvailablePairsResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<AvailablePairsResponse>(`${API_BASE_URL}/market-info/available-pairs/`, {
        params: { api_key: API_KEY },
      });

      return response.data;
    } catch (err) {
      handleApiError(err, "Failed to fetch available pairs");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get available actions for a transaction (refund/push)
  const getAvailableActions = async (transactionId: string): Promise<AvailableActionsResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<AvailableActionsResponse>(
        `${API_V2_BASE_URL}/exchange/actions`,
        {
          params: { id: transactionId },
          headers: {
            "x-changenow-api-key": API_KEY,
          },
        }
      );

      return response.data;
    } catch (err) {
      // This endpoint requires special API access, so silently fail if unauthorized
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        console.log("Available actions endpoint requires special API access");
        return undefined;
      }
      handleApiError(err, `Failed to get available actions for transaction ${transactionId}`);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Get all fixed-rate markets (with min/max amounts)
  const getFixedRateMarkets = async (): Promise<FixedRateMarketsResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<FixedRateMarketsResponse>(
        `${API_BASE_URL}/market-info/fixed-rate/${API_KEY}`
      );

      return response.data;
    } catch (err) {
      handleApiError(err, "Failed to fetch fixed-rate markets");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Validate address
  const validateAddress = async (currency: string, address: string): Promise<ValidateAddressResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<ValidateAddressResponse>(
        `${API_BASE_URL}/validate/address`,
        {
          params: {
            currency: currency.toLowerCase(),
            address,
          },
        }
      );

      return response.data;
    } catch (err) {
      handleApiError(err, `Failed to validate address for ${currency}`);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Create exchange (floating rate)
  const createExchange = async (params: CreateExchangeParams): Promise<CreateExchangeResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        from: params.from.toLowerCase(),
        to: params.to.toLowerCase(),
        amount: params.amount,
        address: params.address,
        ...(params.extraId && { extraId: params.extraId }),
        ...(params.refundAddress && { refundAddress: params.refundAddress }),
        ...(params.refundExtraId && { refundExtraId: params.refundExtraId }),
        ...(params.userId && { userId: params.userId }),
        ...(params.payload && { payload: params.payload }),
        ...(params.contactEmail && { contactEmail: params.contactEmail }),
      };

      const response = await axios.post<CreateExchangeResponse>(
        `${API_BASE_URL}/transactions/${API_KEY}`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (err) {
      handleApiError(err, "Failed to create exchange");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // Create fixed rate exchange
  const createFixedRateExchange = async (params: CreateExchangeParams): Promise<CreateExchangeResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);

      if (!params.rateId) {
        setError("Rate ID is required for fixed rate exchange");
        return undefined;
      }

      const requestBody = {
        from: params.from.toLowerCase(),
        to: params.to.toLowerCase(),
        amount: params.amount,
        address: params.address,
        rateId: params.rateId,
        ...(params.extraId && { extraId: params.extraId }),
        ...(params.refundAddress && { refundAddress: params.refundAddress }),
        ...(params.refundExtraId && { refundExtraId: params.refundExtraId }),
        ...(params.userId && { userId: params.userId }),
        ...(params.payload && { payload: params.payload }),
        ...(params.contactEmail && { contactEmail: params.contactEmail }),
      };

      const response = await axios.post<CreateExchangeResponse>(
        `${API_BASE_URL}/transactions/fixed-rate/${API_KEY}`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (err) {
      handleApiError(err, "Failed to create fixed rate exchange");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // WALLET DEPOSIT FUNCTIONS
  // ====================================

  /**
   * Check if currency is a native currency (ETH, MATIC, BNB, etc.)
   */
  const isNativeCurrency = (changeNowTicker: string, chainId: number): boolean => {
    const parsed = parseChangeNowTicker(changeNowTicker);
    if (!parsed) return false;

    // Check if the parsed chain matches the current chain and if it's native
    return parsed.chainId === chainId && isNativeCurrencyCheck(parsed.baseToken, chainId);
  };

  /**
   * Get token address for a given ChangeNow ticker and chain
   */
  const getTokenAddress = (changeNowTicker: string, chainId: number): string | null => {
    const parsed = parseChangeNowTicker(changeNowTicker);
    if (!parsed) return null;

    // If parsed chain doesn't match current chain, try to find token on current chain
    const tokenInfo = getTokenAddressFromMapping(parsed.baseToken, chainId);
    return tokenInfo?.address || null;
  };

  /**
   * Get token decimals from mapping or native currency info
   */
  const getTokenDecimals = (changeNowTicker: string, chainId: number): number => {
    const parsed = parseChangeNowTicker(changeNowTicker);
    if (!parsed) return 18; // Default

    // Check if it's native currency
    if (isNativeCurrencyCheck(parsed.baseToken, chainId)) {
      const nativeCurrency = getNativeCurrency(chainId);
      return nativeCurrency?.decimals || 18;
    }

    // Check token mapping
    const tokenInfo = getTokenAddressFromMapping(parsed.baseToken, chainId);
    return tokenInfo?.decimals || 18;
  };

  /**
   * Check token allowance for ERC20 tokens
   */
  const checkTokenAllowance = async (
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint
  ): Promise<boolean> => {
    try {
      const allowance = await readContract(wagmiConfig as any, {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address as `0x${string}`, spenderAddress as `0x${string}`],
      });

      return (allowance as bigint) >= amount;
    } catch (err) {
      console.error("Error checking allowance:", err);
      return false;
    }
  };

  /**
   * Approve ERC20 token spending
   */
  const approveToken = async (
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const hash = await walletClient?.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress as `0x${string}`, amount],
        chain: undefined,
      });

      if (hash) {
        // Wait for confirmation
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return true;
      }

      return false;
    } catch (err) {
      console.error("Error approving token:", err);
      handleApiError(err, "Failed to approve token");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send native currency (ETH, MATIC, BNB, etc.) to ChangeNow deposit address
   */
  const sendNativeCurrency = async (
    depositAddress: string,
    amount: number,
    ticker: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Wallet not connected");
      }

      if (!chain) {
        throw new Error("Chain not detected");
      }

      // Verify user is on a chain that supports this native currency
      if (!isNativeCurrency(ticker, chain.id)) {
        const currentChainConfig = getChainConfig(chain.id);
        const chainName = currentChainConfig?.name || `Chain ${chain.id}`;

        // Try to parse ticker to suggest correct network
        const parsed = parseChangeNowTicker(ticker);
        const suggestedChain = parsed ? getChainConfig(parsed.chainId) : null;
        const suggestion = suggestedChain
          ? ` Please switch to ${suggestedChain.name} network.`
          : "";

        throw new Error(
          `Cannot send ${ticker.toUpperCase()} on ${chainName}.${suggestion}`
        );
      }

      const decimals = getTokenDecimals(ticker, chain.id);
      const amountWei = parseUnits(amount.toString(), decimals);

      // Check balance
      const balance = await getBalance(wagmiConfig as any, { address: address as `0x${string}` });

      if (balance.value < amountWei) {
        throw new Error(`Insufficient ${ticker.toUpperCase()} balance`);
      }

      // Send transaction
      const hash = await sendTransaction(wagmiConfig as any, {
        to: depositAddress as `0x${string}`,
        value: amountWei,
      });

      triggerRefresh();

      return {
        success: true,
        txHash: hash,
      };
    } catch (err: any) {
      const errorMsg = err.message || "Failed to send transaction";
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send ERC20 token to ChangeNow deposit address
   */
  const sendERC20Token = async (
    depositAddress: string,
    amount: number,
    ticker: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected || !chain) {
        throw new Error("Wallet not connected");
      }

      const tokenAddress = getTokenAddress(ticker, chain.id);
      if (!tokenAddress) {
        const currentChainConfig = getChainConfig(chain.id);
        const chainName = currentChainConfig?.name || `Chain ${chain.id}`;

        // Try to parse ticker to suggest correct network
        const parsed = parseChangeNowTicker(ticker);
        const suggestedChain = parsed ? getChainConfig(parsed.chainId) : null;
        const suggestion = suggestedChain
          ? ` Please switch to ${suggestedChain.name} network to send this token.`
          : " This token may not be supported for wallet sending.";

        throw new Error(
          `Token ${ticker.toUpperCase()} not configured for ${chainName}.${suggestion}`
        );
      }

      const decimals = getTokenDecimals(ticker, chain.id);
      const amountBigInt = parseUnits(amount.toString(), decimals);

      // Check balance
      const balance = await readContract(wagmiConfig as any, {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      if ((balance as bigint) < amountBigInt) {
        throw new Error(`Insufficient ${ticker.toUpperCase()} balance`);
      }

      // Check allowance
      const hasAllowance = await checkTokenAllowance(
        tokenAddress,
        depositAddress,
        amountBigInt
      );

      // Approve if needed
      if (!hasAllowance) {
        const approved = await approveToken(tokenAddress, depositAddress, amountBigInt);
        if (!approved) {
          throw new Error("Token approval failed");
        }
      }

      // Transfer tokens
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

      return {
        success: true,
        txHash: hash,
      };
    } catch (err: any) {
      const errorMsg = err.message || "Failed to send token";
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send funds from wallet to ChangeNow deposit address
   * Automatically detects native vs ERC20 and handles accordingly
   */
  const sendToDepositAddress = async (
    depositAddress: string,
    amount: number,
    ticker: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      if (!chain) {
        throw new Error("Please connect your wallet");
      }

      // Check if it's a native currency
      if (isNativeCurrency(ticker, chain.id)) {
        return await sendNativeCurrency(depositAddress, amount, ticker);
      } else {
        return await sendERC20Token(depositAddress, amount, ticker);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to send funds";
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  return {
    loading,
    error,
    getCurrencies,
    getCurrencyInfo,
    getAvailableCurrenciesFor,
    getMinAmount,
    getExchangeAmount,
    getFixedRateAmount,
    getExchangeRange,
    getTransactionStatus,
    getAvailablePairs,
    getAvailableActions,
    getFixedRateMarkets,
    validateAddress,
    createExchange,
    createFixedRateExchange,
    sendToDepositAddress,
  };
};

export default useChangeNowHook;
