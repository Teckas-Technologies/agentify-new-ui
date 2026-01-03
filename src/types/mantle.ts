/**
 * Mantle Network Type Definitions
 *
 * Comprehensive types for Mantle Network integration including:
 * - Network configuration
 * - Bridge operations
 * - Gas oracle types
 * - Transaction types
 */

import { Address, Hex } from 'viem';

// ====================================
// NETWORK TYPES
// ====================================

export type MantleNetwork = 'mainnet' | 'testnet';

export interface MantleChainConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  wsUrl: string | null;
  explorerUrl: string;
  bridgeUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface MantleNetworkConfig {
  network: MantleNetwork;
  l1ChainId: number;
  l2ChainId: number;
  l1Contracts: L1ContractAddresses;
  l2Contracts: L2ContractAddresses;
  config: MantleChainConfig;
}

// ====================================
// CONTRACT ADDRESS TYPES
// ====================================

export interface L1ContractAddresses {
  L1CrossDomainMessenger: Address;
  L1StandardBridge: Address;
  L1ERC721Bridge: Address;
  L2OutputOracle: Address;
  OptimismPortal: Address;
  OptimismMintableERC20Factory: Address;
  SystemConfig: Address;
  AddressManager: Address;
  MNTToken: Address;
}

export interface L2ContractAddresses {
  L2CrossDomainMessenger: Address;
  L2StandardBridge: Address;
  L2ERC721Bridge: Address;
  L2ToL1MessagePasser: Address;
  GasPriceOracle: Address;
  L1Block: Address;
  SequencerFeeVault: Address;
  BaseFeeVault: Address;
  L1BlockNumber: Address;
  OptimismMintableERC20Factory: Address;
  WMNT: Address;
  WETH: Address;
}

// ====================================
// BRIDGE OPERATION TYPES
// ====================================

export type BridgeDirection = 'deposit' | 'withdraw';
export type TokenType = 'MNT' | 'ETH' | 'ERC20' | 'ERC721';

export interface BridgeOperationParams {
  direction: BridgeDirection;
  tokenType: TokenType;
  amount?: string;
  tokenId?: string;
  l1TokenAddress?: Address;
  l2TokenAddress?: Address;
  recipient?: Address;
  minGasLimit?: number;
}

export interface BridgeOperationResult {
  success: boolean;
  message: string;
  txHash?: string;
  explorerUrl?: string;
  estimatedArrival?: string;
  data?: any;
  error?: string;
}

// ====================================
// DEPOSIT TYPES
// ====================================

export interface DepositMNTParams {
  amount: string;
  recipient?: Address;
  minGasLimit?: number;
}

export interface DepositETHParams {
  amount: string;
  recipient?: Address;
  minGasLimit?: number;
}

export interface DepositERC20Params {
  l1TokenAddress: Address;
  l2TokenAddress: Address;
  amount: string;
  recipient?: Address;
  minGasLimit?: number;
}

export interface DepositERC721Params {
  l1TokenAddress: Address;
  l2TokenAddress: Address;
  tokenId: string;
  recipient?: Address;
  minGasLimit?: number;
}

// ====================================
// WITHDRAWAL TYPES
// ====================================

export interface WithdrawMNTParams {
  amount: string;
  recipient?: Address;
  minGasLimit?: number;
}

export interface WithdrawETHParams {
  amount: string;
  recipient?: Address;
  minGasLimit?: number;
}

export interface WithdrawERC20Params {
  l2TokenAddress: Address;
  amount: string;
  recipient?: Address;
  minGasLimit?: number;
}

export interface WithdrawERC721Params {
  l1TokenAddress: Address;
  l2TokenAddress: Address;
  tokenId: string;
  recipient?: Address;
  minGasLimit?: number;
}

/**
 * Withdrawal Status Enum
 * Tracks the lifecycle of a withdrawal from L2 to L1
 */
export enum WithdrawalStatus {
  /** Withdrawal initiated on L2 */
  INITIATED = 'INITIATED',
  /** Waiting for the challenge period to complete */
  WAITING_FOR_CHALLENGE_PERIOD = 'WAITING_FOR_CHALLENGE_PERIOD',
  /** Ready to be proven on L1 */
  READY_TO_PROVE = 'READY_TO_PROVE',
  /** Proven on L1, waiting for finalization */
  PROVEN = 'PROVEN',
  /** Ready to be finalized (claim funds) */
  READY_TO_FINALIZE = 'READY_TO_FINALIZE',
  /** Finalized and complete */
  FINALIZED = 'FINALIZED',
  /** Failed at some step */
  FAILED = 'FAILED'
}

export interface WithdrawalInfo {
  txHash: string;
  status: WithdrawalStatus;
  amount: string;
  tokenSymbol: string;
  initiatedAt: number;
  challengePeriodEnd?: number;
  proveHash?: string;
  finalizeHash?: string;
}

// ====================================
// CROSS-CHAIN MESSAGING TYPES
// ====================================

export interface CrossChainMessageParams {
  targetContract: Address;
  message: Hex;
  minGasLimit?: number;
  fromL1?: boolean;
}

export interface CrossChainMessageResult {
  success: boolean;
  message: string;
  txHash?: string;
  messageNonce?: bigint;
}

// ====================================
// GAS & FEE TYPES
// ====================================

export interface GasPriceInfo {
  l2GasPrice: string;
  l1BaseFee: string;
  overhead: string;
  scalar: string;
  tokenRatio: string;
}

export interface L1FeeEstimate {
  l1Fee: string;
  l1GasUsed: string;
  l1BaseFee: string;
}

export interface TransactionFeeEstimate {
  l1Fee: string;
  l2Fee: string;
  totalFee: string;
  gasLimit: string;
}

// ====================================
// BLOCK & STATE TYPES
// ====================================

export interface L1BlockInfo {
  number: bigint;
  timestamp: bigint;
  basefee: bigint;
  hash: Hex;
  sequenceNumber: bigint;
  batcherHash?: Hex;
}

export interface L2OutputInfo {
  outputRoot: Hex;
  timestamp: bigint;
  l2BlockNumber: bigint;
}

// ====================================
// TOKEN TYPES
// ====================================

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  l1Address?: Address;
  l2Address?: Address;
  logoUri?: string;
}

export interface TokenBalance {
  balance: string;
  balanceRaw: bigint;
  symbol: string;
  decimals: number;
  address: Address;
}

export interface CrossChainTokenBalances {
  l1Balance: string;
  l2Balance: string;
  l1BalanceRaw: bigint;
  l2BalanceRaw: bigint;
  symbol: string;
}

// ====================================
// NETWORK STATUS TYPES
// ====================================

export interface NetworkStatus {
  isConnected: boolean;
  currentChainId: number | undefined;
  isOnMantle: boolean;
  isOnEthereum: boolean;
  network: MantleNetwork | 'unknown';
}

export interface MantleNodeInfo {
  mode: 'sequencer' | 'verifier';
  syncing: boolean;
  ethContext: {
    blockNumber: number;
    timestamp: number;
  };
  rollupContext: {
    queueIndex: number;
    index: number;
    verifiedIndex: number;
  };
}

// ====================================
// HOOK RESPONSE TYPES
// ====================================

export interface MantleHookResponse<T = any> {
  success: boolean;
  message: string;
  txHash?: string;
  data?: T;
  error?: string;
}

// ====================================
// EVENT TYPES
// ====================================

export interface DepositInitiatedEvent {
  from: Address;
  to: Address;
  l1Token: Address;
  l2Token: Address;
  amount: bigint;
  extraData: Hex;
}

export interface WithdrawalInitiatedEvent {
  from: Address;
  to: Address;
  l1Token: Address;
  l2Token: Address;
  amount: bigint;
  extraData: Hex;
}

export interface MessagePassedEvent {
  nonce: bigint;
  sender: Address;
  target: Address;
  value: bigint;
  gasLimit: bigint;
  data: Hex;
  withdrawalHash: Hex;
}

// ====================================
// ORACLE PROVIDER TYPES
// ====================================

export type OracleProvider =
  | 'api3'
  | 'chronicle'
  | 'ora'
  | 'pyth'
  | 'redstone'
  | 'supra';

export interface OracleFeed {
  provider: OracleProvider;
  feedId: string;
  pair: string;
  contractAddress: Address;
}

// ====================================
// ACCOUNT ABSTRACTION TYPES
// ====================================

export interface SmartAccountConfig {
  provider: 'biconomy' | 'etherspot' | 'particle';
  paymasterUrl?: string;
  bundlerUrl?: string;
}

export interface GaslessTransactionParams {
  to: Address;
  data: Hex;
  value?: bigint;
}

// ====================================
// UTILITY TYPES
// ====================================

export interface TransactionReceipt {
  txHash: string;
  blockNumber: bigint;
  status: 'success' | 'reverted';
  gasUsed: bigint;
  effectiveGasPrice: bigint;
}

export interface MantleExplorerLink {
  tx: (hash: string) => string;
  address: (addr: string) => string;
  block: (blockNumber: number) => string;
  token: (addr: string) => string;
}

// ====================================
// CONSTANTS
// ====================================

export const MANTLE_CHAIN_IDS = {
  MAINNET: 5000,
  TESTNET: 5003,
  ETHEREUM_MAINNET: 1,
  SEPOLIA: 11155111
} as const;

export const DEFAULT_MIN_GAS_LIMIT = 200000;

export const CHALLENGE_PERIOD = {
  MAINNET: 7 * 24 * 60 * 60, // 7 days in seconds
  TESTNET: 40 * 60 // ~40 minutes in seconds
} as const;

// Native token address constant used by Mantle
export const MANTLE_NATIVE_TOKEN_ADDRESS = '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' as Address;

// Standard predeploy addresses (same across all OP Stack chains)
export const PREDEPLOYS = {
  L2_CROSS_DOMAIN_MESSENGER: '0x4200000000000000000000000000000000000007' as Address,
  L2_STANDARD_BRIDGE: '0x4200000000000000000000000000000000000010' as Address,
  SEQUENCE_FEE_VAULT: '0x4200000000000000000000000000000000000011' as Address,
  OPTIMISM_MINTABLE_ERC20_FACTORY: '0x4200000000000000000000000000000000000012' as Address,
  L1_BLOCK_NUMBER: '0x4200000000000000000000000000000000000013' as Address,
  GAS_PRICE_ORACLE: '0x420000000000000000000000000000000000000F' as Address,
  L1_BLOCK: '0x4200000000000000000000000000000000000015' as Address,
  L2_TO_L1_MESSAGE_PASSER: '0x4200000000000000000000000000000000000016' as Address,
  L2_ERC721_BRIDGE: '0x4200000000000000000000000000000000000014' as Address,
  BASE_FEE_VAULT: '0x4200000000000000000000000000000000000019' as Address,
} as const;

// ====================================
// LENDLE PROTOCOL TYPES
// ====================================

export type InterestRateMode = 1 | 2; // 1 = Stable, 2 = Variable

export interface LendleDepositParams {
  asset: Address;
  amount: string;
  onBehalfOf?: Address;
  referralCode?: number;
}

export interface LendleWithdrawParams {
  asset: Address;
  amount: string; // Use "max" for full withdrawal
  to?: Address;
}

export interface LendleBorrowParams {
  asset: Address;
  amount: string;
  interestRateMode: InterestRateMode;
  onBehalfOf?: Address;
  referralCode?: number;
}

export interface LendleRepayParams {
  asset: Address;
  amount: string; // Use "max" for full repayment
  rateMode: InterestRateMode;
  onBehalfOf?: Address;
}

export interface LendleLiquidationParams {
  collateralAsset: Address;
  debtAsset: Address;
  user: Address;
  debtToCover: string;
  receiveAToken: boolean;
}

export interface LendleFlashLoanParams {
  receiverAddress: Address;
  assets: Address[];
  amounts: string[];
  modes: number[];
  onBehalfOf?: Address;
  params: Hex;
  referralCode?: number;
}

export interface LendleUserAccountData {
  totalCollateralETH: string;
  totalDebtETH: string;
  availableBorrowsETH: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

export interface LendleReserveData {
  availableLiquidity: string;
  totalStableDebt: string;
  totalVariableDebt: string;
  liquidityRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  utilizationRate: string;
}

export interface LendleUserReserveData {
  currentATokenBalance: string;
  currentStableDebt: string;
  currentVariableDebt: string;
  liquidityRate: string;
  usageAsCollateralEnabled: boolean;
}

export interface LendleReserveConfigData {
  decimals: number;
  ltv: number;
  liquidationThreshold: number;
  liquidationBonus: number;
  reserveFactor: number;
  usageAsCollateralEnabled: boolean;
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
}

export interface LendleStakingInfo {
  totalStaked: string;
  lockedBalance: string;
  unlockableBalance: string;
  withdrawableAmount: string;
  penaltyAmount: string;
  earnedRewards: string;
}

// ====================================
// FUSIONX PROTOCOL TYPES
// ====================================

export type FusionXFeeTier = 100 | 500 | 3000 | 10000;

// V2 Types
export interface FusionXV2SwapParams {
  amountIn: string;
  amountOutMin: string;
  path: Address[];
  to?: Address;
  deadline?: number;
}

export interface FusionXV2LiquidityParams {
  tokenA: Address;
  tokenB: Address;
  amountADesired: string;
  amountBDesired: string;
  amountAMin?: string;
  amountBMin?: string;
  to?: Address;
  deadline?: number;
}

export interface FusionXV2RemoveLiquidityParams {
  tokenA: Address;
  tokenB: Address;
  liquidity: string;
  amountAMin?: string;
  amountBMin?: string;
  to?: Address;
  deadline?: number;
}

export interface FusionXV2PairInfo {
  pairAddress: Address;
  token0: Address;
  token1: Address;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
}

// V3 Types
export interface FusionXV3SwapSingleParams {
  tokenIn: Address;
  tokenOut: Address;
  fee: FusionXFeeTier;
  amountIn: string;
  amountOutMinimum: string;
  sqrtPriceLimitX96?: bigint;
  recipient?: Address;
  deadline?: number;
}

export interface FusionXV3SwapMultiHopParams {
  path: { token: Address; fee: FusionXFeeTier }[];
  amountIn: string;
  amountOutMinimum: string;
  recipient?: Address;
  deadline?: number;
}

export interface FusionXV3MintPositionParams {
  token0: Address;
  token1: Address;
  fee: FusionXFeeTier;
  tickLower: number;
  tickUpper: number;
  amount0Desired: string;
  amount1Desired: string;
  amount0Min?: string;
  amount1Min?: string;
  recipient?: Address;
  deadline?: number;
}

export interface FusionXV3PositionInfo {
  tokenId: bigint;
  token0: Address;
  token1: Address;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

export interface FusionXV3PoolInfo {
  poolAddress: Address;
  token0: Address;
  token1: Address;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
}

export interface FusionXQuoteResult {
  amountOut: string;
  priceImpact: string;
  path: Address[];
}

// ====================================
// COMMON DEFI TYPES
// ====================================

export interface DeFiHookResponse<T = any> {
  success: boolean;
  message: string;
  txHash?: string;
  data?: T;
  error?: string;
}

export interface TokenApprovalParams {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: bigint;
}

export interface SwapQuote {
  inputToken: Address;
  outputToken: Address;
  inputAmount: string;
  outputAmount: string;
  priceImpact: string;
  route: Address[];
  protocol: 'fusionx-v2' | 'fusionx-v3' | 'aggregator';
}
