import { useState } from "react";
import axios, { AxiosError } from "axios";
import { useAccount, useWalletClient, useSwitchChain } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { readContract, getBalance, sendTransaction } from "@wagmi/core";
import { wagmiConfig } from "@/contexts/CustomWagmiProvider";
import { erc20Abi } from "viem";
import { useTokenBalanceRefresh } from "@/contexts/TokenBalanceRefreshContext";
import { getTokens, createConfig as createLiFiConfig } from "@lifi/sdk";
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
  parseChangeNowTickerLenient,
  parseChangeNowTickerDynamic,
  formatChangeNowTicker,
  isNativeCurrency as isNativeCurrencyCheck,
  getNativeCurrency,
  getChainConfig,
  CHAIN_CONFIGS,
} from "@/utils/changeNowTokenMapping";

const API_BASE_URL = "https://api.changenow.io/v1";
const API_V2_BASE_URL = "https://api.changenow.io/v2";

// In-memory cache for token details from LiFi
const tokenDetailsCache = new Map<string, { address: string; decimals: number }>();

export const useChangeNowHook = (): UseChangeNowReturn => {
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
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

  // Get only EVM chain currencies (filtered by our 41 supported chains)
  const getEVMCurrencies = async (
    active: boolean = true,
    fixedRate: boolean = false
  ): Promise<ChangeNowCurrency[] | undefined> => {
    try {
      const allCurrencies = await getCurrencies(active, fixedRate);
      if (!allCurrencies) return undefined;

      // Filter to only include currencies on our supported EVM chains
      // Use lenient parser to accept ALL tokens on our chains, not just ones with addresses
      const evmCurrencies = allCurrencies.filter((currency) => {
        // Exclude fiat currencies (COP, DOP, MOP, USD, EUR, etc.)
        if (currency.isFiat) return false;

        const parsed = parseChangeNowTickerLenient(currency.ticker);

        // If parseChangeNowTickerLenient returns null, it's not on our supported chains
        if (!parsed) return false;

        // Check if the chain is in our CHAIN_CONFIGS (our 41 EVM chains)
        const chainConfig = getChainConfig(parsed.chainId);
        return chainConfig !== null;
      });

      return evmCurrencies;
    } catch (err) {
      handleApiError(err, "Failed to fetch EVM currencies");
      return undefined;
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

      const url = `${API_BASE_URL}/exchange-amount/${amount}/${from.toLowerCase()}_${to.toLowerCase()}`;
      console.log(`[ChangeNow API] GET ${url}`);

      const response = await axios.get<ExchangeAmountResponse>(url, {
        params: { api_key: API_KEY },
      });

      console.log(`[ChangeNow API] Success for ${from}/${to}:`, response.data);
      return response.data;
    } catch (err) {
      // Log detailed error info
      if (axios.isAxiosError(err)) {
        console.error(`[ChangeNow API] Error for ${from}/${to}:`, {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
        });

        const errorData = err.response?.data;
        const errorType = errorData?.error;
        const errorMsg = errorData?.message || "";

        // Check for specific error types
        if (errorType === 'deposit_too_small') {
          // Don't show error toast for minimum amount issues
          console.log(`Amount below minimum for ${from}/${to}: ${errorMsg}`);
        } else if (errorType === 'pair_is_inactive') {
          // ChangeNow bug: Sometimes returns "pair_is_inactive" when amount is too low
          // instead of "deposit_too_small"
          console.warn(`⚠️ ChangeNow API Bug: Got "pair_is_inactive" for ${from}/${to} with amount ${amount}`);
          console.warn(`This usually means the amount is below the actual minimum (ChangeNow has inconsistent minimums across APIs)`);
        } else if (!errorMsg.includes("not supported") && !errorMsg.includes("not_valid_params")) {
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

      const url = `${API_BASE_URL}/exchange-amount/fixed-rate/${amount}/${from.toLowerCase()}_${to.toLowerCase()}`;
      console.log(`[ChangeNow API] GET ${url}`);

      const response = await axios.get<FixedRateExchangeResponse>(url, {
        params: { api_key: API_KEY },
      });

      console.log(`[ChangeNow API] Fixed rate success for ${from}/${to}:`, response.data);
      return response.data;
    } catch (err) {
      // Log detailed error info
      if (axios.isAxiosError(err)) {
        console.error(`[ChangeNow API] Fixed rate error for ${from}/${to}:`, {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
        });

        const errorData = err.response?.data;
        const errorType = errorData?.error;
        const errorMsg = errorData?.message || "";

        // Check for specific error types
        if (errorType === 'deposit_too_small') {
          // Don't show error toast for minimum amount issues
          console.log(`Amount below minimum for ${from}/${to}: ${errorMsg}`);
        } else if (errorType === 'pair_is_inactive') {
          // ChangeNow bug: Sometimes returns "pair_is_inactive" when amount is too low
          // instead of "deposit_too_small"
          console.warn(`⚠️ ChangeNow API Bug: Got "pair_is_inactive" for ${from}/${to} with amount ${amount}`);
          console.warn(`This usually means the amount is below the actual minimum (ChangeNow has inconsistent minimums across APIs)`);
        } else {
          handleApiError(err, `Failed to get fixed rate estimate for ${from}/${to}`);
        }
      }
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

      const url = `${API_V2_BASE_URL}/exchange/range?fromCurrency=${from.toLowerCase()}&toCurrency=${to.toLowerCase()}`;
      console.log(`[ChangeNow API] GET ${url}`);

      const response = await axios.get<ExchangeRangeResponse>(`${API_V2_BASE_URL}/exchange/range`, {
        params: {
          fromCurrency: from.toLowerCase(),
          toCurrency: to.toLowerCase(),
        },
        headers: {
          "x-changenow-api-key": API_KEY,
        },
      });

      console.log(`[ChangeNow API] Range success for ${from}/${to}:`, response.data);
      return response.data;
    } catch (err) {
      // Log detailed error info
      if (axios.isAxiosError(err)) {
        console.error(`[ChangeNow API] Range error for ${from}/${to}:`, {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
        });
      } else {
        console.log(`Range not available for ${from}/${to}`);
      }
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
   * Get token details (address & decimals) from LiFi dynamically
   * Uses in-memory cache for performance
   */
  const getTokenDetailsFromLiFi = async (
    tokenSymbol: string,
    chainId: number
  ): Promise<{ address: string; decimals: number } | null> => {
    const cacheKey = `${chainId}-${tokenSymbol.toLowerCase()}`;

    // Check cache first
    if (tokenDetailsCache.has(cacheKey)) {
      return tokenDetailsCache.get(cacheKey)!;
    }

    try {
      // Fetch all tokens for this chain from LiFi
      const tokensResponse = await getTokens({ chains: [chainId] });

      console.log(`LiFi tokens response for chain ${chainId}:`, tokensResponse);

      // LiFi returns { tokens: { [chainId]: Token[] }, extended: boolean }
      const tokensData = (tokensResponse as any).tokens || tokensResponse;
      const tokensForChain = tokensData[chainId];

      console.log(`Tokens for chain ${chainId}:`, tokensForChain?.length || 0);

      if (!tokensForChain || tokensForChain.length === 0) {
        console.log(`No tokens found on LiFi for chain ${chainId}`);
        return null;
      }

      // Find token by symbol (case-insensitive)
      const token = tokensForChain.find(
        (t: any) => t.symbol.toLowerCase() === tokenSymbol.toLowerCase()
      );

      if (!token) {
        // Log available symbols for debugging
        const availableSymbols = tokensForChain.map((t: any) => t.symbol).slice(0, 20).join(", ");
        console.log(`Token ${tokenSymbol} not found on LiFi for chain ${chainId}`);
        console.log(`Available symbols (first 20): ${availableSymbols}`);
        return null;
      }

      const details = {
        address: token.address,
        decimals: token.decimals,
      };

      // Cache it
      tokenDetailsCache.set(cacheKey, details);

      return details;
    } catch (err) {
      console.error(`Failed to fetch token ${tokenSymbol} from LiFi:`, err);
      return null;
    }
  };

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
   * Get token address and decimals dynamically from LiFi for a given ChangeNow ticker
   * Returns null if not found
   */
  const getTokenDetailsForTicker = async (
    changeNowTicker: string,
    chainId: number
  ): Promise<{ address: string; decimals: number } | null> => {
    const parsed = parseChangeNowTicker(changeNowTicker);
    if (!parsed) return null;

    // Check if it's native currency (doesn't need address lookup)
    if (isNativeCurrencyCheck(parsed.baseToken, chainId)) {
      const nativeCurrency = getNativeCurrency(chainId);
      return nativeCurrency ? { address: "0x0", decimals: nativeCurrency.decimals } : null;
    }

    // Fetch from LiFi dynamically
    return await getTokenDetailsFromLiFi(parsed.baseToken, chainId);
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

      // Parse ticker to get base token
      const parsed = parseChangeNowTicker(ticker);
      if (!parsed) {
        throw new Error(`Failed to parse ticker: ${ticker}`);
      }

      const baseToken = parsed.baseToken;

      // Verify user is on a chain that supports this native currency
      if (!isNativeCurrencyCheck(baseToken, chain.id)) {
        const currentChainConfig = getChainConfig(chain.id);
        const chainName = currentChainConfig?.name || `Chain ${chain.id}`;
        const suggestedChain = getChainConfig(parsed.chainId);
        const suggestion = suggestedChain
          ? ` Please switch to ${suggestedChain.name} network.`
          : "";

        throw new Error(
          `Cannot send ${ticker.toUpperCase()} on ${chainName}.${suggestion}`
        );
      }

      // Get decimals from native currency config
      const nativeCurrency = getNativeCurrency(chain.id);
      const decimals = nativeCurrency?.decimals || 18;
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

      // Get token details dynamically from LiFi
      console.log(`[Wallet Send] Looking up token ${ticker} on chain ${chain.id}`);
      const tokenDetails = await getTokenDetailsForTicker(ticker, chain.id);

      if (!tokenDetails) {
        const currentChainConfig = getChainConfig(chain.id);
        const chainName = currentChainConfig?.name || `Chain ${chain.id}`;

        // Try to parse ticker to suggest correct network
        const parsed = parseChangeNowTicker(ticker);
        const suggestedChain = parsed ? getChainConfig(parsed.chainId) : null;

        // Check if user is on wrong chain
        if (suggestedChain && suggestedChain.chainId !== chain.id) {
          throw new Error(
            `Token ${ticker.toUpperCase()} is for ${suggestedChain.name} network. Please switch to ${suggestedChain.name} to send this token.`
          );
        }

        // User is on correct chain, but LiFi doesn't have the token
        throw new Error(
          `Token ${ticker.toUpperCase()} not found on LiFi for ${chainName}. The token address may not be available. Try sending manually to the deposit address.`
        );
      }

      console.log(`[Wallet Send] Token found on LiFi:`, tokenDetails);

      const { address: tokenAddress, decimals } = tokenDetails;
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

      // Parse ticker to get base token (e.g., "etharb" → "eth")
      const parsed = parseChangeNowTickerLenient(ticker);
      if (!parsed) {
        throw new Error(`Failed to parse ticker: ${ticker}`);
      }

      const baseToken = parsed.baseToken;
      console.log(`[sendToDepositAddress] Ticker: ${ticker}, BaseToken: ${baseToken}, ChainId: ${chain.id}`);

      // Check if the base token is a native currency on the current chain
      if (isNativeCurrencyCheck(baseToken, chain.id)) {
        console.log(`[sendToDepositAddress] ${baseToken} is native on chain ${chain.id}, using sendNativeCurrency`);
        return await sendNativeCurrency(depositAddress, amount, ticker);
      } else {
        console.log(`[sendToDepositAddress] ${baseToken} is ERC20 on chain ${chain.id}, using sendERC20Token`);
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

  // ====================================
  // ORCHESTRATED EXCHANGE FLOW
  // ====================================

  /**
   * Execute complete exchange flow with progress tracking
   * This is a convenience method that orchestrates all steps
   *
   * @param fromCurrency - Token symbol (e.g., "usdt", "eth")
   * @param fromChain - Chain name (e.g., "polygon", "base")
   * @param toCurrency - Token symbol (e.g., "eth", "usdc")
   * @param toChain - Chain name (e.g., "ethereum", "arbitrum")
   */
  const executeExchange = async (params: {
    fromCurrency: string;
    fromChain: string;
    toCurrency: string;
    toChain: string;
    amount: number;
    recipientAddress: string;
    refundAddress?: string;
    isFixedRate?: boolean;
    autoSendFromWallet?: boolean;
    onProgress?: (progress: {
      step: 'validating' | 'estimating' | 'creating' | 'sending' | 'tracking' | 'completed';
      status: 'loading' | 'success' | 'error';
      message?: string;
      data?: any;
    }) => void;
  }): Promise<{
    success: boolean;
    exchange?: CreateExchangeResponse;
    transaction?: TransactionStatusResponse;
    depositTxHash?: string;
    error?: string;
  }> => {
    const {
      fromCurrency,
      fromChain,
      toCurrency,
      toChain,
      amount,
      recipientAddress,
      refundAddress,
      isFixedRate = false,
      autoSendFromWallet = false,
      onProgress,
    } = params;

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      const error = 'Amount must be a valid positive number';
      onProgress?.({ step: 'validating', status: 'error', message: error });
      return { success: false, error };
    }

    // Fetch EVM currencies list first (used for dynamic ticker formatting)
    const evmCurrencies = await getEVMCurrencies(true, false);
    if (!evmCurrencies || evmCurrencies.length === 0) {
      const error = 'Failed to fetch EVM currencies list';
      onProgress?.({ step: 'validating', status: 'error', message: error });
      return { success: false, error };
    }

    // Convert to ChangeNow ticker format using dynamic lookup
    const fromTicker = formatChangeNowTicker(fromCurrency, fromChain, evmCurrencies);
    const toTicker = formatChangeNowTicker(toCurrency, toChain, evmCurrencies);

    if (!fromTicker || !toTicker) {
      const error = `Failed to build tickers for ${fromCurrency}@${fromChain} or ${toCurrency}@${toChain}`;
      onProgress?.({ step: 'validating', status: 'error', message: error });
      return { success: false, error };
    }

    console.log(`[executeExchange] Converted: ${fromCurrency}@${fromChain} → ${fromTicker}`);
    console.log(`[executeExchange] Converted: ${toCurrency}@${toChain} → ${toTicker}`);

    try {
      setLoading(true);
      setError(null);

      // Step 1: Validate minimum amount
      onProgress?.({ step: 'validating', status: 'loading', message: 'Validating amount...' });

      const minAmountData = await getMinAmount(fromTicker, toTicker);
      console.log(`[executeExchange] Min amount data for ${fromTicker}/${toTicker}:`, minAmountData);

      if (!minAmountData) {
        const error = `Pair ${fromCurrency}@${fromChain}/${toCurrency}@${toChain} is not available`;
        onProgress?.({ step: 'validating', status: 'error', message: error });
        return { success: false, error };
      }

      console.log(`[executeExchange] Checking: ${amount} < ${minAmountData.minAmount}?`);

      if (amount < minAmountData.minAmount) {
        const error = `Amount below minimum. Min: ${minAmountData.minAmount} ${fromCurrency.toUpperCase()}`;
        onProgress?.({ step: 'validating', status: 'error', message: error });
        return { success: false, error };
      }

      onProgress?.({ step: 'validating', status: 'success', message: 'Amount validated', data: minAmountData });

      // Step 2: Get estimate
      onProgress?.({ step: 'estimating', status: 'loading', message: 'Getting exchange rate...' });

      let estimate;
      let rateId;

      if (isFixedRate) {
        const fixedRateData = await getFixedRateAmount(amount, fromTicker, toTicker);
        if (!fixedRateData) {
          const error = `Failed to get fixed rate estimate. Amount too low or pair unavailable. Try increasing the amount (min reported: ${minAmountData.minAmount}, but actual minimum may be higher due to ChangeNow API inconsistency).`;
          onProgress?.({ step: 'estimating', status: 'error', message: error });
          return { success: false, error };
        }
        estimate = fixedRateData.estimatedAmount;
        rateId = fixedRateData.rateId;
      } else {
        const floatingRateData = await getExchangeAmount(amount, fromTicker, toTicker);
        if (!floatingRateData) {
          const error = `Failed to get exchange estimate. Amount too low or pair unavailable. Try increasing the amount (min reported: ${minAmountData.minAmount}, but actual minimum may be higher due to ChangeNow API inconsistency).`;
          onProgress?.({ step: 'estimating', status: 'error', message: error });
          return { success: false, error };
        }
        estimate = floatingRateData.estimatedAmount;
      }

      onProgress?.({
        step: 'estimating',
        status: 'success',
        message: `You will receive ~${estimate} ${toCurrency.toUpperCase()}`,
        data: { estimate, rateId }
      });

      // Step 2.5: Validate balance if autoSendFromWallet is enabled
      if (autoSendFromWallet) {
        onProgress?.({ step: 'validating', status: 'loading', message: 'Checking balance...' });

        if (!address || !isConnected) {
          const error = 'Wallet not connected';
          onProgress?.({ step: 'validating', status: 'error', message: error });
          return { success: false, error };
        }

        // Get the chain config for fromChain
        const fromChainConfig = Object.values(CHAIN_CONFIGS).find(
          c => c.name.toLowerCase() === fromChain.toLowerCase() ||
               c.name.toLowerCase().includes(fromChain.toLowerCase()) ||
               fromChain.toLowerCase().includes(c.name.toLowerCase())
        );

        if (!fromChainConfig) {
          const error = `Chain config not found for ${fromChain}`;
          onProgress?.({ step: 'validating', status: 'error', message: error });
          return { success: false, error };
        }

        // Parse ticker to determine if native or ERC20
        const parsed = parseChangeNowTicker(fromTicker);
        if (!parsed) {
          const error = `Failed to parse ticker: ${fromTicker}`;
          onProgress?.({ step: 'validating', status: 'error', message: error });
          return { success: false, error };
        }

        const baseToken = parsed.baseToken;
        const chainId = fromChainConfig.chainId;

        try {
          // Check if it's a native currency
          if (isNativeCurrencyCheck(baseToken, chainId)) {
            // Check native balance
            const nativeCurrency = getNativeCurrency(chainId);
            const decimals = nativeCurrency?.decimals || 18;
            const amountWei = parseUnits(amount.toString(), decimals);

            const balance = await getBalance(wagmiConfig as any, {
              address: address as `0x${string}`,
              chainId: chainId
            });

            if (balance.value < amountWei) {
              const error = `Insufficient ${fromCurrency.toUpperCase()} balance. Required: ${amount}, Available: ${formatUnits(balance.value, decimals)}`;
              onProgress?.({ step: 'validating', status: 'error', message: error });
              return { success: false, error };
            }
          } else {
            // Check ERC20 token balance
            const tokenDetails = await getTokenDetailsFromLiFi(baseToken, chainId);

            if (!tokenDetails) {
              // Token not found on LiFi, but we'll allow it and check later during send
              console.warn(`Token ${baseToken} not found on LiFi for chain ${chainId}, skipping balance check`);
            } else {
              const { address: tokenAddress, decimals } = tokenDetails;
              const amountBigInt = parseUnits(amount.toString(), decimals);

              const balance = await readContract(wagmiConfig as any, {
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [address as `0x${string}`],
                chainId: chainId
              });

              if ((balance as bigint) < amountBigInt) {
                const error = `Insufficient ${fromCurrency.toUpperCase()} balance. Required: ${amount}, Available: ${formatUnits(balance as bigint, decimals)}`;
                onProgress?.({ step: 'validating', status: 'error', message: error });
                return { success: false, error };
              }
            }
          }

          onProgress?.({ step: 'validating', status: 'success', message: 'Balance validated' });
        } catch (err: any) {
          const error = `Failed to check balance: ${err.message}`;
          onProgress?.({ step: 'validating', status: 'error', message: error });
          return { success: false, error };
        }
      }

      // Step 3: Create exchange
      onProgress?.({ step: 'creating', status: 'loading', message: 'Creating exchange...' });

      const exchangeParams: CreateExchangeParams = {
        from: fromTicker,
        to: toTicker,
        address: recipientAddress,
        amount,
        refundAddress: refundAddress || address || undefined,
        rateId: isFixedRate ? rateId : undefined,
      };

      const exchange = isFixedRate
        ? await createFixedRateExchange(exchangeParams)
        : await createExchange(exchangeParams);

      if (!exchange) {
        const error = 'Failed to create exchange';
        onProgress?.({ step: 'creating', status: 'error', message: error });
        return { success: false, error };
      }

      onProgress?.({
        step: 'creating',
        status: 'success',
        message: 'Exchange created successfully',
        data: exchange
      });

      // Step 4: Send funds (if autoSend)
      let depositTxHash;

      if (autoSendFromWallet) {
        onProgress?.({ step: 'sending', status: 'loading', message: 'Preparing to send funds...' });

        // Get the chain ID for the fromChain using fuzzy matching
        const fromChainConfig = Object.values(CHAIN_CONFIGS).find(
          c => c.name.toLowerCase() === fromChain.toLowerCase() ||
               c.name.toLowerCase().includes(fromChain.toLowerCase()) ||
               fromChain.toLowerCase().includes(c.name.toLowerCase())
        );

        if (!fromChainConfig) {
          const error = `Chain config not found for ${fromChain}`;
          onProgress?.({ step: 'sending', status: 'error', message: error });
          return { success: false, exchange, error };
        }

        // Switch to the correct chain if needed
        if (chain?.id !== fromChainConfig.chainId) {
          onProgress?.({
            step: 'sending',
            status: 'loading',
            message: `Switching to ${fromChainConfig.name}...`
          });

          try {
            if (!switchChainAsync) {
              throw new Error('Chain switching not available');
            }
            await switchChainAsync({ chainId: fromChainConfig.chainId });
            console.log(`[executeExchange] Switched to chain ${fromChainConfig.chainId} (${fromChainConfig.name})`);
          } catch (switchErr: any) {
            const error = `Failed to switch to ${fromChainConfig.name}: ${switchErr.message}`;
            onProgress?.({ step: 'sending', status: 'error', message: error });
            return { success: false, exchange, error };
          }
        }

        onProgress?.({ step: 'sending', status: 'loading', message: 'Sending funds from wallet...' });

        const sendResult = await sendToDepositAddress(
          exchange.payinAddress,
          amount,
          fromTicker
        );

        if (!sendResult.success) {
          onProgress?.({
            step: 'sending',
            status: 'error',
            message: sendResult.error || 'Failed to send funds'
          });
          // Return exchange info even if send fails - user can send manually
          return {
            success: false,
            exchange,
            error: sendResult.error,
          };
        }

        depositTxHash = sendResult.txHash;
        onProgress?.({
          step: 'sending',
          status: 'success',
          message: 'Funds sent successfully',
          data: { txHash: depositTxHash }
        });
      }

      // Step 5: Track transaction status (poll for updates)
      onProgress?.({ step: 'tracking', status: 'loading', message: 'Waiting for deposit confirmation...' });

      // Poll status every 10 seconds
      const pollStatus = async (): Promise<TransactionStatusResponse | undefined> => {
        let attempts = 0;
        const maxAttempts = 180; // 30 minutes max (180 * 10s)

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

          const status = await getTransactionStatus(exchange.id);
          if (!status) {
            attempts++;
            continue;
          }

          // Update progress with current status
          onProgress?.({
            step: 'tracking',
            status: 'loading',
            message: `Status: ${status.status}`,
            data: status
          });

          // Check if transaction is complete or failed
          if (status.status === 'finished') {
            onProgress?.({
              step: 'completed',
              status: 'success',
              message: 'Exchange completed successfully!',
              data: status
            });
            return status;
          } else if (status.status === 'failed' || status.status === 'refunded' || status.status === 'expired') {
            onProgress?.({
              step: 'tracking',
              status: 'error',
              message: `Exchange ${status.status}`,
              data: status
            });
            return status;
          }

          attempts++;
        }

        // Timeout
        onProgress?.({
          step: 'tracking',
          status: 'error',
          message: 'Transaction tracking timeout. Please check status manually.'
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
      const errorMsg = err.message || 'Exchange failed';
      setError(errorMsg);
      onProgress?.({
        step: 'validating',
        status: 'error',
        message: errorMsg
      });
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Debug: Log EVM currencies for analysis
   */
  const debugLogEVMCurrencies = async () => {
    console.log('=== DEBUG: Fetching EVM Currencies ===');
    const currencies = await getEVMCurrencies(true, false);

    if (!currencies) {
      console.error('No currencies returned');
      return;
    }

    console.log(`Total EVM currencies: ${currencies.length}`);
    console.table(currencies.slice(0, 50).map(c => ({
      ticker: c.ticker,
      name: c.name,
      featured: c.featured,
      stable: c.isStable,
      fixedRate: c.supportsFixedRate,
    })));

    // Group by chain suffix
    const byChain: Record<string, string[]> = {};
    currencies.forEach(c => {
      const parsed = parseChangeNowTickerLenient(c.ticker);
      if (parsed) {
        const chainConfig = getChainConfig(parsed.chainId);
        const chainName = chainConfig?.name || `Chain ${parsed.chainId}`;
        if (!byChain[chainName]) byChain[chainName] = [];
        byChain[chainName].push(c.ticker);
      }
    });

    console.log('=== Currencies by Chain ===');
    Object.entries(byChain).forEach(([chain, tickers]) => {
      console.log(`${chain}: ${tickers.length} tokens`);
      console.log(`  Examples: ${tickers.slice(0, 5).join(', ')}`);
    });

    console.log('=== Full Currency List ===');
    console.log(JSON.stringify(currencies, null, 2));

    return currencies;
  };

  return {
    loading,
    error,
    // Individual functions
    getCurrencies,
    getEVMCurrencies,
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
    // Orchestrated function
    executeExchange,
    // Debug functions
    debugLogEVMCurrencies,
  };
};

export default useChangeNowHook;
