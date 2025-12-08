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

// =====================================
// V2 API Types (Separate network params)
// =====================================

// V2 Currency type
export interface ChangeNowCurrencyV2 {
  ticker: string;
  name: string;
  image: string;
  network: string;
  hasExternalId: boolean;
  isFiat: boolean;
  featured: boolean;
  isStable: boolean;
  supportsFixedRate: boolean;
  tokenContract?: string | null;
  buy: boolean;
  sell: boolean;
}

// V2 Available pairs response
export interface AvailablePairV2 {
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  flow: 'standard' | 'fixed-rate';
}

// V2 Min amount response (more accurate)
export interface MinAmountResponseV2 {
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  flow: 'standard' | 'fixed-rate';
  minAmount: number;
}

// V2 Exchange range response
export interface ExchangeRangeResponseV2 {
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  flow: 'standard' | 'fixed-rate';
  minAmount: number;
  maxAmount: number | null;
}

// V2 Estimated amount response
export interface EstimatedAmountResponseV2 {
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  flow: 'standard' | 'fixed-rate';
  type: 'direct' | 'reverse';
  rateId: string | null;
  validUntil: string | null;
  transactionSpeedForecast: string | null;
  warningMessage: string | null;
  depositFee: number;
  withdrawalFee: number;
  userId: string | null;
  fromAmount: number;
  toAmount: number;
}

// V2 Create exchange request params
export interface CreateExchangeParamsV2 {
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  fromAmount?: number;
  toAmount?: number;
  address: string;
  extraId?: string;
  refundAddress?: string;
  refundExtraId?: string;
  userId?: string;
  payload?: Record<string, string>;
  contactEmail?: string;
  flow: 'standard' | 'fixed-rate';
  type?: 'direct' | 'reverse';
  rateId?: string;
}

// V2 Create exchange response
export interface CreateExchangeResponseV2 {
  id: string;
  fromAmount: number;
  toAmount: number;
  flow: 'standard' | 'fixed-rate';
  type: 'direct' | 'reverse';
  payinAddress: string;
  payoutAddress: string;
  payinExtraId?: string | null;
  payoutExtraId?: string | null;
  fromCurrency: string;
  toCurrency: string;
  fromNetwork: string;
  toNetwork: string;
  refundAddress?: string | null;
  refundExtraId?: string | null;
  validUntil?: string | null;
  rateId?: string | null;
}

// V2 Transaction status response
export interface TransactionStatusResponseV2 {
  id: string;
  status: TransactionStatus;
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  expectedAmountFrom: number;
  expectedAmountTo: number;
  amountFrom: number | null;
  amountTo: number | null;
  payinAddress: string;
  payoutAddress: string;
  payinExtraId?: string | null;
  payoutExtraId?: string | null;
  refundAddress?: string | null;
  refundExtraId?: string | null;
  createdAt: string;
  updatedAt: string;
  depositReceivedAt?: string | null;
  payinHash?: string | null;
  payoutHash?: string | null;
  fromLegacyTicker: string;
  toLegacyTicker: string;
  actionsAvailable: boolean;
}

// V2 Validate address response
export interface ValidateAddressResponseV2 {
  result: boolean;
  message: string | null;
}

// V2 Network fee estimate response
export interface NetworkFeeResponseV2 {
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  flow: 'standard' | 'fixed-rate';
  depositFee: number;
  withdrawalFee: number;
  fromAmount: number;
  toAmount: number;
}

// V2 Hook return type
export interface UseNewChangeNowReturn {
  loading: boolean;
  error: string | null;
  // Read operations
  getCurrencies: (params?: { active?: boolean; fixedRate?: boolean; buy?: boolean; sell?: boolean }) => Promise<ChangeNowCurrencyV2[] | undefined>;
  getEVMCurrencies: (params?: { active?: boolean; fixedRate?: boolean }) => Promise<ChangeNowCurrencyV2[] | undefined>;
  getAvailablePairs: (params?: {
    fromCurrency?: string;
    toCurrency?: string;
    fromNetwork?: string;
    toNetwork?: string;
    flow?: 'standard' | 'fixed-rate';
  }) => Promise<AvailablePairV2[] | undefined>;
  getMinAmount: (params: {
    fromCurrency: string;
    toCurrency: string;
    fromNetwork: string;
    toNetwork: string;
    flow?: 'standard' | 'fixed-rate';
  }) => Promise<MinAmountResponseV2 | undefined>;
  getExchangeRange: (params: {
    fromCurrency: string;
    toCurrency: string;
    fromNetwork: string;
    toNetwork: string;
    flow?: 'standard' | 'fixed-rate';
  }) => Promise<ExchangeRangeResponseV2 | undefined>;
  getEstimatedAmount: (params: {
    fromCurrency: string;
    toCurrency: string;
    fromNetwork: string;
    toNetwork: string;
    fromAmount?: number;
    toAmount?: number;
    flow?: 'standard' | 'fixed-rate';
    type?: 'direct' | 'reverse';
    useRateId?: boolean;
  }) => Promise<EstimatedAmountResponseV2 | undefined>;
  getTransactionStatus: (id: string) => Promise<TransactionStatusResponseV2 | undefined>;
  validateAddress: (params: {
    currency: string;
    address: string;
  }) => Promise<ValidateAddressResponseV2 | undefined>;
  // Write operations
  createExchange: (params: CreateExchangeParamsV2) => Promise<CreateExchangeResponseV2 | undefined>;
  sendToDepositAddress: (depositAddress: string, amount: number, currency: string, network: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  // Orchestrated flow
  executeExchange: (params: {
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
      step: 'validating' | 'estimating' | 'creating' | 'sending' | 'tracking' | 'completed';
      status: 'loading' | 'success' | 'error';
      message?: string;
      data?: any;
    }) => void;
  }) => Promise<{
    success: boolean;
    exchange?: CreateExchangeResponseV2;
    transaction?: TransactionStatusResponseV2;
    depositTxHash?: string;
    error?: string;
  }>;
}

// Hook return type
export interface UseChangeNowReturn {
  loading: boolean;
  error: string | null;
  // Read operations
  getCurrencies: (active?: boolean, fixedRate?: boolean) => Promise<ChangeNowCurrency[] | undefined>;
  getEVMCurrencies: (active?: boolean, fixedRate?: boolean) => Promise<ChangeNowCurrency[] | undefined>;
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
  // Orchestrated flow
  executeExchange: (params: {
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
  }) => Promise<{
    success: boolean;
    exchange?: CreateExchangeResponse;
    transaction?: TransactionStatusResponse;
    depositTxHash?: string;
    error?: string;
  }>;
  // Debug functions
  debugLogEVMCurrencies: () => Promise<ChangeNowCurrency[] | undefined>;
}
