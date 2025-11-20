// ChangeNow API Types

// Currency types (exact match to API response)
export interface ChangeNowCurrency {
  ticker: string;
  name: string;
  image: string;
  hasExternalId: boolean;
  isExtraIdSupported: boolean;
  isFiat: boolean;
  featured: boolean;
  isStable: boolean;
  supportsFixedRate: boolean;
}

// Minimum amount response
export interface MinAmountResponse {
  minAmount: number;
}

// Exchange amount estimate response (floating rate)
export interface ExchangeAmountResponse {
  estimatedAmount: number;
  transactionSpeedForecast: string;
  warningMessage: string | null;
}

// Exchange amount estimate response (fixed rate)
export interface FixedRateExchangeResponse {
  estimatedAmount: number;
  transactionSpeedForecast: string;
  warningMessage: string | null;
  rateId: string;
  validUntil: string;
}

// Exchange range response
export interface ExchangeRangeResponse {
  minAmount: number;
  maxAmount: number | null;
}

// Create exchange request parameters
export interface CreateExchangeParams {
  from: string;
  to: string;
  amount: number;
  address: string;
  extraId?: string;
  refundAddress?: string;
  refundExtraId?: string;
  userId?: string;
  payload?: Record<string, string>;
  contactEmail?: string;
  rateId?: string; // For fixed-rate exchanges
}

// Create exchange response
export interface CreateExchangeResponse {
  id: string;
  payinAddress: string;
  payoutAddress: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  // Optional fields
  payinExtraId?: string | null;
  payoutExtraId?: string | null;
  payinExtraIdName?: string;
  payoutExtraIdName?: string;
  refundAddress?: string | null;
  refundExtraId?: string | null;
  validUntil?: string | null;
  rateId?: string | null;
}

// Transaction status types
export type TransactionStatus =
  | 'new'
  | 'waiting'
  | 'confirming'
  | 'exchanging'
  | 'sending'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'verifying'
  | 'expired';

// Transaction status response
export interface TransactionStatusResponse {
  id: string;
  status: TransactionStatus;
  payinAddress: string;
  payoutAddress: string;
  fromCurrency: string;
  toCurrency: string;
  updatedAt: string;
  expectedSendAmount: number;
  expectedReceiveAmount: number;
  createdAt?: string;
  isPartner?: boolean;
  // Optional fields that appear during transaction lifecycle
  payinConfirmations?: string;
  hash?: string;
  payinHash?: string;
  payoutHash?: string;
  payinExtraId?: string;
  payoutExtraId?: string;
  payinExtraIdName?: string;
  payoutExtraIdName?: string;
  amountSend?: number;
  amountReceive?: number;
  networkFee?: number;
  depositReceivedAt?: string;
  refundAddress?: string;
  refundExtraId?: string;
  validUntil?: string;
  verificationSent?: boolean;
  userId?: string;
  payload?: Record<string, string>;
  tokensDestination?: string;
}

// Available pairs response (array of strings like "btc_eth")
export type AvailablePairsResponse = string[];

// Available currencies for specific currency response
export interface AvailableCurrencyForPair extends ChangeNowCurrency {
  isAvailable: boolean;
}

export type AvailableCurrenciesForResponse = AvailableCurrencyForPair[];

// Available actions response
export interface AvailableActionsResponse {
  available: boolean;
  amount?: number;
  address?: string;
  additionalAddressList?: string[];
  currentEstimate?: number;
}

// Fixed-rate market info
export interface FixedRateMarket {
  from: string;
  to: string;
  min: number;
  max: number;
}

export type FixedRateMarketsResponse = FixedRateMarket[];

// Validate address response
export interface ValidateAddressResponse {
  result: boolean;
  message: string | null;
}

// Currency info response
export interface CurrencyInfoResponse {
  ticker: string;
  name: string;
  image: string;
  warnings: {
    from: string;
    to: string;
  };
  hasExternalId: boolean;
  isFiat: boolean;
  isAnonymous: boolean;
  addressExplorerMask: string;
  transactionExplorerMask: string;
  wallets?: {
    primary?: Array<{
      name: string;
      url: string;
      imageUrl: string;
      platforms: Record<string, boolean>;
      properties: {
        anonymity: string;
        security: string;
        weight: string;
      };
      multi: boolean;
    }>;
    secondary?: Array<{
      name: string;
      url: string;
      imageUrl: string;
      platforms: Record<string, boolean>;
      properties: {
        anonymity: string;
        security: string;
        weight: string;
      };
      multi: boolean;
    }>;
  };
}

// Error response
export interface ChangeNowError {
  error: string;
  message: string;
}

// Exchange type for UI state
export interface ExchangeState {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  toAmount: string;
  address: string;
  refundAddress?: string;
  extraId?: string;
  rateId?: string;
  isFixedRate: boolean;
}

// API Key header type
export interface ChangeNowHeaders {
  'x-changenow-api-key': string;
  'Content-Type': string;
}

// Hook return type
export interface UseChangeNowReturn {
  loading: boolean;
  error: string | null;
  // Read operations
  getCurrencies: (active?: boolean, fixedRate?: boolean) => Promise<ChangeNowCurrency[] | undefined>;
  getCurrencyInfo: (ticker: string) => Promise<CurrencyInfoResponse | undefined>;
  getAvailableCurrenciesFor: (ticker: string, fixedRate?: boolean) => Promise<AvailableCurrenciesForResponse | undefined>;
  getMinAmount: (from: string, to: string) => Promise<MinAmountResponse | undefined>;
  getExchangeAmount: (amount: number, from: string, to: string) => Promise<ExchangeAmountResponse | undefined>;
  getFixedRateAmount: (amount: number, from: string, to: string) => Promise<FixedRateExchangeResponse | undefined>;
  getExchangeRange: (from: string, to: string) => Promise<ExchangeRangeResponse | undefined>;
  getTransactionStatus: (id: string) => Promise<TransactionStatusResponse | undefined>;
  getAvailablePairs: () => Promise<AvailablePairsResponse | undefined>;
  getAvailableActions: (transactionId: string) => Promise<AvailableActionsResponse | undefined>;
  getFixedRateMarkets: () => Promise<FixedRateMarketsResponse | undefined>;
  validateAddress: (currency: string, address: string) => Promise<ValidateAddressResponse | undefined>;
  // Write operations
  createExchange: (params: CreateExchangeParams) => Promise<CreateExchangeResponse | undefined>;
  createFixedRateExchange: (params: CreateExchangeParams) => Promise<CreateExchangeResponse | undefined>;
  sendToDepositAddress: (depositAddress: string, amount: number, ticker: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
}
