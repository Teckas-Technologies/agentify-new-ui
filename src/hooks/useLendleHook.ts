import { useState, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useTokenBalanceRefresh } from "@/contexts/TokenBalanceRefreshContext";
import { switchChain, readContract, writeContract, getBalance, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from "@/contexts/CustomWagmiProvider";
import {
  parseUnits,
  formatUnits,
  parseEther,
  formatEther,
  type Hex,
  type Address,
  maxUint256,
  erc20Abi
} from 'viem';

// ====================================
// LENDLE PROTOCOL CONFIGURATION
// ====================================

/**
 * Lendle - Native Lending Protocol on Mantle Network
 *
 * Lendle is a decentralized, non-custodial lending market built on Mantle Network.
 * Based on Aave V2 architecture with optimizations for Mantle's EigenDA technology.
 *
 * Key Features:
 * - Deposit assets to earn interest (receive lTokens)
 * - Borrow assets against collateral
 * - Variable and Stable interest rates
 * - Flash loans support
 * - LEND token rewards via ChefIncentivesController
 */

export const LENDLE_CONFIG = {
  chainId: 5000,
  chainName: "Mantle",
  protocol: "Lendle",
  version: "1.0",
  website: "https://lendle.xyz",
  docs: "https://docs.lendle.xyz"
} as const;

// Lendle Contract Addresses on Mantle Mainnet
export const LENDLE_CONTRACTS = {
  // Core Protocol
  LendingPoolAddressesProviderRegistry: "0xb92Bffee2DE49B6e87Ef3260337B676a2811b868" as Address,
  LendingPoolAddressesProvider: "0xAb94Bedd21ae3411eB2698945dfCab1D5C19C3d4" as Address,
  LendingPool: "0xCFa5aE7c2CE8Fadc6426C1ff872cA45378Fb7cF3" as Address,
  LendingPoolConfigurator: "0x30D990834539E1CE8Be816631b73a534e5044856" as Address,

  // Oracles
  AaveOracle: "0x870c9692Ab04944C86ec6FEeF63F261226506EfC" as Address,
  LendingRateOracle: "0xc7F65C6b94A8A1C0977add58b6799ad456D72392" as Address,

  // Data Provider
  ProtocolDataProvider: "0x552b9e4bae485C4B7F540777d7D25614CdB84773" as Address,

  // Gateway for native MNT
  WETHGateway: "0xEc831f8710C6286a91a348928600157f07aC55c2" as Address,

  // Tokens
  LendleToken: "0x25356aeca4210eF7553140edb9b8026089E49396" as Address,

  // Rewards & Staking
  MultiFeeDistribution: "0x5C75A733656c3E42E44AFFf1aCa1913611F49230" as Address,
  MasterChef: "0xC90C10c7e3B2F14870cC870A046Bd099CCDDEe12" as Address,
  ChefIncentivesController: "0x79e2fd1c484EB9EE45001A98Ce31F28918F27C41" as Address,

  // Token Implementations
  lToken: "0xeC3414058620E118D2258F8D9765F6c8b8320694" as Address,
  StableDebtToken: "0xd8A36c0E6148fFB374C6726d4c60Bbd55B745407" as Address,
  VariableDebtToken: "0xB3f838d219A0cFba73193453C2023090277d6Af5" as Address,

  // Other
  TokenVesting: "0xA7f784Dc0EC287342B0B84e63961eFfA541f7E6f" as Address,
  MerkleDistributor: "0xB57f32d28E098Cd2d72EAFc7a4ECfC54F3589296" as Address,
  StakingConfigurator: "0xE5F9fFc0D0D70EED59364b44B1F11900B39dB37B" as Address,
} as const;

// Supported Assets on Lendle
export const LENDLE_ASSETS = {
  WMNT: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8" as Address,
  WETH: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111" as Address,
  USDC: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9" as Address,
  USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE" as Address,
  METH: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0" as Address,
  WBTC: "0xCAbAE6f6Ea1ecaB08Ad02fE02ce9A44F09aebfA2" as Address,
} as const;

// Interest Rate Modes
export const INTEREST_RATE_MODE = {
  NONE: 0,
  STABLE: 1,
  VARIABLE: 2
} as const;

// ====================================
// CONTRACT ABIs
// ====================================

// LendingPool ABI (Aave V2 compatible)
const LENDING_POOL_ABI = [
  // Deposit
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" }
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Withdraw
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" }
    ],
    name: "withdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Borrow
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "interestRateMode", type: "uint256" },
      { name: "referralCode", type: "uint16" },
      { name: "onBehalfOf", type: "address" }
    ],
    name: "borrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Repay
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "rateMode", type: "uint256" },
      { name: "onBehalfOf", type: "address" }
    ],
    name: "repay",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Set User Use Reserve As Collateral
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "useAsCollateral", type: "bool" }
    ],
    name: "setUserUseReserveAsCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Swap Borrow Rate Mode
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "rateMode", type: "uint256" }
    ],
    name: "swapBorrowRateMode",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Liquidation Call
  {
    inputs: [
      { name: "collateralAsset", type: "address" },
      { name: "debtAsset", type: "address" },
      { name: "user", type: "address" },
      { name: "debtToCover", type: "uint256" },
      { name: "receiveAToken", type: "bool" }
    ],
    name: "liquidationCall",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Flash Loan
  {
    inputs: [
      { name: "receiverAddress", type: "address" },
      { name: "assets", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "modes", type: "uint256[]" },
      { name: "onBehalfOf", type: "address" },
      { name: "params", type: "bytes" },
      { name: "referralCode", type: "uint16" }
    ],
    name: "flashLoan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Get User Account Data
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserAccountData",
    outputs: [
      { name: "totalCollateralETH", type: "uint256" },
      { name: "totalDebtETH", type: "uint256" },
      { name: "availableBorrowsETH", type: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "healthFactor", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  // Get Reserve Data
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveData",
    outputs: [
      {
        components: [
          { name: "configuration", type: "uint256" },
          { name: "liquidityIndex", type: "uint128" },
          { name: "variableBorrowIndex", type: "uint128" },
          { name: "currentLiquidityRate", type: "uint128" },
          { name: "currentVariableBorrowRate", type: "uint128" },
          { name: "currentStableBorrowRate", type: "uint128" },
          { name: "lastUpdateTimestamp", type: "uint40" },
          { name: "aTokenAddress", type: "address" },
          { name: "stableDebtTokenAddress", type: "address" },
          { name: "variableDebtTokenAddress", type: "address" },
          { name: "interestRateStrategyAddress", type: "address" },
          { name: "id", type: "uint8" }
        ],
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  // Get Reserves List
  {
    inputs: [],
    name: "getReservesList",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  // Get User Configuration
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserConfiguration",
    outputs: [
      {
        components: [{ name: "data", type: "uint256" }],
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

// WETH Gateway ABI (for native MNT deposits/withdrawals)
const WETH_GATEWAY_ABI = [
  {
    inputs: [
      { name: "lendingPool", type: "address" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" }
    ],
    name: "depositETH",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "lendingPool", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" }
    ],
    name: "withdrawETH",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "lendingPool", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "interestRateMode", type: "uint256" },
      { name: "referralCode", type: "uint16" }
    ],
    name: "borrowETH",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "lendingPool", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "rateMode", type: "uint256" },
      { name: "onBehalfOf", type: "address" }
    ],
    name: "repayETH",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
] as const;

// Debt Token ABI (for credit delegation)
const DEBT_TOKEN_ABI = [
  {
    inputs: [
      { name: "delegatee", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approveDelegation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "fromUser", type: "address" },
      { name: "toUser", type: "address" }
    ],
    name: "borrowAllowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Protocol Data Provider ABI
const PROTOCOL_DATA_PROVIDER_ABI = [
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveConfigurationData",
    outputs: [
      { name: "decimals", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "liquidationThreshold", type: "uint256" },
      { name: "liquidationBonus", type: "uint256" },
      { name: "reserveFactor", type: "uint256" },
      { name: "usageAsCollateralEnabled", type: "bool" },
      { name: "borrowingEnabled", type: "bool" },
      { name: "stableBorrowRateEnabled", type: "bool" },
      { name: "isActive", type: "bool" },
      { name: "isFrozen", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveData",
    outputs: [
      { name: "availableLiquidity", type: "uint256" },
      { name: "totalStableDebt", type: "uint256" },
      { name: "totalVariableDebt", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "variableBorrowRate", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "averageStableBorrowRate", type: "uint256" },
      { name: "liquidityIndex", type: "uint256" },
      { name: "variableBorrowIndex", type: "uint256" },
      { name: "lastUpdateTimestamp", type: "uint40" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "user", type: "address" }
    ],
    name: "getUserReserveData",
    outputs: [
      { name: "currentATokenBalance", type: "uint256" },
      { name: "currentStableDebt", type: "uint256" },
      { name: "currentVariableDebt", type: "uint256" },
      { name: "principalStableDebt", type: "uint256" },
      { name: "scaledVariableDebt", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "stableRateLastUpdated", type: "uint40" },
      { name: "usageAsCollateralEnabled", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveTokensAddresses",
    outputs: [
      { name: "aTokenAddress", type: "address" },
      { name: "stableDebtTokenAddress", type: "address" },
      { name: "variableDebtTokenAddress", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getAllReservesTokens",
    outputs: [
      {
        components: [
          { name: "symbol", type: "string" },
          { name: "tokenAddress", type: "address" }
        ],
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getAllATokens",
    outputs: [
      {
        components: [
          { name: "symbol", type: "string" },
          { name: "tokenAddress", type: "address" }
        ],
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Oracle ABI
const ORACLE_ABI = [
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getAssetPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "assets", type: "address[]" }],
    name: "getAssetsPrices",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getSourceOfAsset",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Chef Incentives Controller ABI (for LEND rewards)
const CHEF_INCENTIVES_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "claimableReward",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "tokens", type: "address[]" }
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "_user", type: "address" },
      { name: "_tokens", type: "address[]" }
    ],
    name: "pendingRewards",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// MultiFeeDistribution ABI (for staking LEND)
const MULTI_FEE_DISTRIBUTION_ABI = [
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "lock", type: "bool" }
    ],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "exit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "earnedBalances",
    outputs: [
      { name: "total", type: "uint256" },
      {
        components: [
          { name: "amount", type: "uint256" },
          { name: "unlockTime", type: "uint256" }
        ],
        name: "earningsData",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "withdrawableBalance",
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "penaltyAmount", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "lockedBalances",
    outputs: [
      { name: "total", type: "uint256" },
      { name: "unlockable", type: "uint256" },
      { name: "locked", type: "uint256" },
      {
        components: [
          { name: "amount", type: "uint256" },
          { name: "unlockTime", type: "uint256" }
        ],
        name: "lockData",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "totalBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "rewardToken", type: "address" }
    ],
    name: "claimableRewards",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// ====================================
// TYPES & INTERFACES
// ====================================

export interface LendleHookResponse {
  success: boolean;
  message: string;
  txHash?: string;
  data?: any;
  error?: string;
}

export interface DepositParams {
  asset: Address;
  amount: string;
  onBehalfOf?: Address;
  referralCode?: number;
}

export interface WithdrawParams {
  asset: Address;
  amount: string; // Use "max" or specific amount
  to?: Address;
}

export interface BorrowParams {
  asset: Address;
  amount: string;
  interestRateMode: 1 | 2; // 1 = Stable, 2 = Variable
  onBehalfOf?: Address;
  referralCode?: number;
}

export interface RepayParams {
  asset: Address;
  amount: string; // Use "max" or specific amount
  rateMode: 1 | 2;
  onBehalfOf?: Address;
}

export interface LiquidationParams {
  collateralAsset: Address;
  debtAsset: Address;
  user: Address;
  debtToCover: string;
  receiveAToken: boolean;
}

export interface FlashLoanParams {
  receiverAddress: Address;
  assets: Address[];
  amounts: string[];
  modes: number[];
  onBehalfOf?: Address;
  params: Hex;
  referralCode?: number;
}

export interface UserAccountData {
  totalCollateralETH: string;
  totalDebtETH: string;
  availableBorrowsETH: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

export interface ReserveData {
  availableLiquidity: string;
  totalStableDebt: string;
  totalVariableDebt: string;
  liquidityRate: string; // APY for depositors (in ray - 27 decimals)
  variableBorrowRate: string;
  stableBorrowRate: string;
  utilizationRate: string;
}

export interface UserReserveData {
  currentATokenBalance: string;
  currentStableDebt: string;
  currentVariableDebt: string;
  liquidityRate: string;
  usageAsCollateralEnabled: boolean;
}

export interface ReserveConfigData {
  decimals: number;
  ltv: number; // Loan-to-Value ratio in percentage
  liquidationThreshold: number;
  liquidationBonus: number;
  reserveFactor: number;
  usageAsCollateralEnabled: boolean;
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
}

export interface TokenInfo {
  symbol: string;
  address: Address;
  decimals: number;
  lTokenAddress?: Address;
  stableDebtAddress?: Address;
  variableDebtAddress?: Address;
}

export interface StakingInfo {
  totalStaked: string;
  lockedBalance: string;
  unlockableBalance: string;
  withdrawableAmount: string;
  penaltyAmount: string;
  earnedRewards: string;
}

// ====================================
// MAIN HOOK
// ====================================

export const useLendleHook = () => {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { wallets } = useWallets();
  const { user } = usePrivy();
  const { triggerRefresh } = useTokenBalanceRefresh();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MANTLE_CHAIN_ID = 5000;

  // ====================================
  // HELPER FUNCTIONS
  // ====================================

  /**
   * Ensure user is connected to Mantle Network
   */
  const ensureMantleNetwork = async (): Promise<boolean> => {
    if (chain?.id === MANTLE_CHAIN_ID) return true;

    try {
      await switchChain(wagmiConfig as any, { chainId: MANTLE_CHAIN_ID as any });
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (err) {
      throw new Error("Please switch to Mantle Network");
    }
  };

  /**
   * Get token decimals
   */
  const getTokenDecimals = async (tokenAddress: Address): Promise<number> => {
    try {
      const decimals = await readContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
        chainId: MANTLE_CHAIN_ID as any,
      });
      return decimals as number;
    } catch {
      return 18;
    }
  };

  /**
   * Get token symbol
   */
  const getTokenSymbol = async (tokenAddress: Address): Promise<string> => {
    try {
      const symbol = await readContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
        chainId: MANTLE_CHAIN_ID as any,
      });
      return symbol as string;
    } catch {
      return "UNKNOWN";
    }
  };

  /**
   * Approve token for LendingPool
   * Uses exact amount approval for better security (not unlimited)
   */
  const approveToken = async (
    tokenAddress: Address,
    amount: bigint
  ): Promise<Hex | null> => {
    try {
      const currentAllowance = await readContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as Address, LENDLE_CONTRACTS.LendingPool],
        chainId: MANTLE_CHAIN_ID as any,
      });

      if ((currentAllowance as bigint) >= amount) {
        return null; // Already approved
      }

      // Use exact amount approval for better security (not unlimited/maxUint256)
      const txHash = await writeContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [LENDLE_CONTRACTS.LendingPool, amount],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      return txHash;
    } catch (err: any) {
      throw new Error(`Approval failed: ${err.message}`);
    }
  };

  /**
   * Handle error messages
   */
  const getErrorMessage = (error: any): string => {
    const errorStr = error?.message || String(error);

    // Preserve our natural AI messages (they start with "I noticed")
    if (errorStr.startsWith("I noticed")) {
      return errorStr;
    }

    if (errorStr.includes("User rejected") || errorStr.includes("user rejected")) {
      return "No problem! You cancelled the transaction. Let me know when you're ready to try again.";
    }
    if (errorStr.includes("health factor")) {
      return "This action would put your position at risk. Your health factor would drop below 1, which could lead to liquidation. Consider adding more collateral or repaying some debt first.";
    }
    if (errorStr.includes("collateral")) {
      return "You don't have enough collateral for this operation. Consider depositing more assets first.";
    }
    if (errorStr.includes("borrow cap")) {
      return "The borrow cap for this asset has been reached. Try borrowing a smaller amount or choose a different asset.";
    }
    if (errorStr.includes("supply cap")) {
      return "The supply cap for this asset has been reached. Try depositing a smaller amount or choose a different asset.";
    }
    // Catch generic insufficient balance errors from contract
    if (errorStr.includes("insufficient") || errorStr.includes("exceeds balance")) {
      return "It looks like you don't have enough balance to complete this operation. Please check your wallet balance and try again.";
    }

    return errorStr || "Something went wrong. Please try again.";
  };

  // Convert ray (27 decimals) to percentage APY
  const rayToPercent = (ray: bigint): string => {
    return (Number(ray) / 1e25).toFixed(2);
  };

  // ====================================
  // DEPOSIT FUNCTIONS
  // ====================================

  /**
   * Deposit ERC20 asset into Lendle to earn interest
   * You will receive lTokens representing your deposit
   */
  const deposit = async (params: DepositParams): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const decimals = await getTokenDecimals(params.asset);
      const tokenSymbol = await getTokenSymbol(params.asset);
      const amount = parseUnits(params.amount, decimals);

      // Check balance
      const balance = await readContract(wagmiConfig as any, {
        address: params.asset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      if (balance < amount) {
        throw new Error(`I noticed you don't have enough ${tokenSymbol} for this deposit. You need ${params.amount} ${tokenSymbol}, but your wallet only has ${formatUnits(balance, decimals)} ${tokenSymbol}. Would you like to try a smaller amount?`);
      }

      // Approve if needed
      await approveToken(params.asset, amount);

      // Execute deposit
      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'deposit',
        args: [
          params.asset,
          amount,
          params.onBehalfOf || address,
          params.referralCode || 0
        ],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully deposited ${params.amount} tokens into Lendle`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deposit native MNT into Lendle
   */
  const depositMNT = async (
    amount: string,
    onBehalfOf?: Address
  ): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const amountWei = parseEther(amount);

      // Check MNT balance
      const balance = await getBalance(wagmiConfig as any, {
        address: address,
        chainId: MANTLE_CHAIN_ID as any,
      });

      if (balance.value < amountWei) {
        throw new Error(`I noticed you don't have enough MNT for this deposit. You need ${amount} MNT, but your wallet only has ${formatEther(balance.value)} MNT. Would you like to try a smaller amount?`);
      }

      // Deposit via WETHGateway
      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.WETHGateway,
        abi: WETH_GATEWAY_ABI,
        functionName: 'depositETH',
        args: [
          LENDLE_CONTRACTS.LendingPool,
          onBehalfOf || address,
          0
        ],
        value: amountWei,
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully deposited ${amount} MNT into Lendle`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // WITHDRAW FUNCTIONS
  // ====================================

  /**
   * Withdraw ERC20 asset from Lendle
   * Burns lTokens and returns underlying asset
   */
  const withdraw = async (params: WithdrawParams): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const decimals = await getTokenDecimals(params.asset);

      // Use max uint256 for "max" withdrawal
      const amount = params.amount.toLowerCase() === "max"
        ? maxUint256
        : parseUnits(params.amount, decimals);

      // Check aToken balance for non-max withdrawals
      if (params.amount.toLowerCase() !== "max") {
        const reserveTokens = await readContract(wagmiConfig as any, {
          address: LENDLE_CONTRACTS.ProtocolDataProvider,
          abi: PROTOCOL_DATA_PROVIDER_ABI,
          functionName: 'getReserveTokensAddresses',
          args: [params.asset],
          chainId: MANTLE_CHAIN_ID as any,
        }) as [Address, Address, Address];

        const aTokenAddress = reserveTokens[0];
        const aTokenBalance = await readContract(wagmiConfig as any, {
          address: aTokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
          chainId: MANTLE_CHAIN_ID as any,
        }) as bigint;

        if (aTokenBalance < amount) {
          const tokenSymbol = await getTokenSymbol(params.asset);
          throw new Error(`I noticed you don't have enough deposited to withdraw this amount. You want to withdraw ${params.amount} ${tokenSymbol}, but you only have ${formatUnits(aTokenBalance, decimals)} ${tokenSymbol} deposited. Would you like to try a smaller amount?`);
        }
      }

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'withdraw',
        args: [
          params.asset,
          amount,
          params.to || address
        ],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully withdrew ${params.amount === "max" ? "all" : params.amount} tokens from Lendle`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Withdraw native MNT from Lendle
   */
  const withdrawMNT = async (
    amount: string,
    to?: Address
  ): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const amountWei = amount.toLowerCase() === "max"
        ? maxUint256
        : parseEther(amount);

      // Need to approve lWMNT token for WETHGateway
      const reserveTokens = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.ProtocolDataProvider,
        abi: PROTOCOL_DATA_PROVIDER_ABI,
        functionName: 'getReserveTokensAddresses',
        args: [LENDLE_ASSETS.WMNT],
        chainId: MANTLE_CHAIN_ID as any,
      }) as [Address, Address, Address];

      const lWMNTAddress = reserveTokens[0];

      // Get lWMNT balance for approval amount
      const lWMNTBalance = await readContract(wagmiConfig as any, {
        address: lWMNTAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      // Check balance for non-max withdrawals
      if (amount.toLowerCase() !== "max" && lWMNTBalance < amountWei) {
        throw new Error(`I noticed you don't have enough deposited to withdraw this amount. You want to withdraw ${amount} MNT, but you only have ${formatEther(lWMNTBalance)} MNT deposited. Would you like to try a smaller amount?`);
      }

      // Determine approval amount: use balance for "max" or exact amount
      const approvalAmount = amountWei === maxUint256 ? lWMNTBalance : amountWei;

      // Check current allowance for gateway
      const currentAllowance = await readContract(wagmiConfig as any, {
        address: lWMNTAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as Address, LENDLE_CONTRACTS.WETHGateway],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      // Approve lWMNT for gateway (exact amount, not unlimited)
      if (currentAllowance < approvalAmount) {
        const approvalTx = await writeContract(wagmiConfig as any, {
          address: lWMNTAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [LENDLE_CONTRACTS.WETHGateway, approvalAmount],
          chainId: MANTLE_CHAIN_ID as any,
        });

        await waitForTransactionReceipt(wagmiConfig as any, {
          hash: approvalTx,
          chainId: MANTLE_CHAIN_ID as any,
        });
      }

      // Withdraw via WETHGateway
      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.WETHGateway,
        abi: WETH_GATEWAY_ABI,
        functionName: 'withdrawETH',
        args: [
          LENDLE_CONTRACTS.LendingPool,
          amountWei,
          to || address
        ],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully withdrew ${amount === "max" ? "all" : amount} MNT from Lendle`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // BORROW FUNCTIONS
  // ====================================

  /**
   * Borrow ERC20 asset from Lendle
   * Requires sufficient collateral deposited first
   */
  const borrow = async (params: BorrowParams): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      // Check if stable rate is enabled for this asset (if user selected stable)
      if (params.interestRateMode === 1) {
        const reserveConfig = await getReserveConfigData(params.asset);
        if (reserveConfig && !reserveConfig.stableBorrowRateEnabled) {
          throw new Error("Stable borrow rate is not enabled for this asset. Please use Variable rate instead.");
        }
      }

      const decimals = await getTokenDecimals(params.asset);
      const amount = parseUnits(params.amount, decimals);

      // Check if user has enough collateral
      const accountData = await getUserAccountData();
      if (accountData && parseFloat(accountData.availableBorrowsETH) <= 0) {
        throw new Error("Insufficient collateral. Deposit assets first and enable them as collateral.");
      }

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'borrow',
        args: [
          params.asset,
          amount,
          BigInt(params.interestRateMode),
          params.referralCode || 0,
          params.onBehalfOf || address
        ],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      const rateType = params.interestRateMode === 1 ? "stable" : "variable";
      return {
        success: true,
        message: `Successfully borrowed ${params.amount} tokens at ${rateType} rate`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Borrow native MNT from Lendle
   * Note: Requires credit delegation to WETHGateway
   */
  const borrowMNT = async (
    amount: string,
    interestRateMode: 1 | 2 = 2
  ): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      // Check if stable rate is enabled for WMNT (if user selected stable)
      if (interestRateMode === 1) {
        const reserveConfig = await getReserveConfigData(LENDLE_ASSETS.WMNT);
        if (reserveConfig && !reserveConfig.stableBorrowRateEnabled) {
          throw new Error("Stable borrow rate is not enabled for MNT/WMNT. Please use Variable rate instead.");
        }
      }

      const amountWei = parseEther(amount);

      // Get the debt token address for WMNT
      const reserveTokens = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.ProtocolDataProvider,
        abi: PROTOCOL_DATA_PROVIDER_ABI,
        functionName: 'getReserveTokensAddresses',
        args: [LENDLE_ASSETS.WMNT],
        chainId: MANTLE_CHAIN_ID as any,
      }) as [Address, Address, Address];

      // Get appropriate debt token based on rate mode (index 1 = stable, index 2 = variable)
      const debtTokenAddress = interestRateMode === 1 ? reserveTokens[1] : reserveTokens[2];

      // Check current borrow allowance for WETHGateway
      const currentAllowance = await readContract(wagmiConfig as any, {
        address: debtTokenAddress,
        abi: DEBT_TOKEN_ABI,
        functionName: 'borrowAllowance',
        args: [address as Address, LENDLE_CONTRACTS.WETHGateway],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      // Approve credit delegation to WETHGateway if needed
      if (currentAllowance < amountWei) {
        console.log("Approving credit delegation to WETHGateway...");
        const approveTx = await writeContract(wagmiConfig as any, {
          address: debtTokenAddress,
          abi: DEBT_TOKEN_ABI,
          functionName: 'approveDelegation',
          args: [LENDLE_CONTRACTS.WETHGateway, maxUint256],
          chainId: MANTLE_CHAIN_ID as any,
        });

        await waitForTransactionReceipt(wagmiConfig as any, {
          hash: approveTx,
          chainId: MANTLE_CHAIN_ID as any,
        });
        console.log("Credit delegation approved");
      }

      // Now borrow via WETHGateway
      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.WETHGateway,
        abi: WETH_GATEWAY_ABI,
        functionName: 'borrowETH',
        args: [
          LENDLE_CONTRACTS.LendingPool,
          amountWei,
          BigInt(interestRateMode),
          0
        ],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully borrowed ${amount} MNT`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // REPAY FUNCTIONS
  // ====================================

  /**
   * Repay borrowed ERC20 asset
   */
  const repay = async (params: RepayParams): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const decimals = await getTokenDecimals(params.asset);
      const tokenSymbol = await getTokenSymbol(params.asset);
      let amount: bigint;
      let approvalAmount: bigint;

      // Check token balance
      const tokenBalance = await readContract(wagmiConfig as any, {
        address: params.asset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      if (params.amount.toLowerCase() === "max") {
        // For max repay, get actual debt and add 0.1% buffer for interest accrual
        const userReserve = await getUserReserveData(params.asset);
        const debt = params.rateMode === 1
          ? parseUnits(userReserve?.currentStableDebt || "0", decimals)
          : parseUnits(userReserve?.currentVariableDebt || "0", decimals);
        // Add 0.1% buffer for interest that accrues between approval and repay
        approvalAmount = debt + (debt / BigInt(1000));

        // Check if user has enough balance to repay the debt
        if (tokenBalance < debt) {
          throw new Error(`I noticed you don't have enough ${tokenSymbol} to repay your full debt. Your debt is ${formatUnits(debt, decimals)} ${tokenSymbol}, but your wallet only has ${formatUnits(tokenBalance, decimals)} ${tokenSymbol}. Would you like to make a partial repayment?`);
        }

        amount = maxUint256; // Use max for the actual repay call
      } else {
        amount = parseUnits(params.amount, decimals);
        approvalAmount = amount;

        // Check if user has enough balance for the specified amount
        if (tokenBalance < amount) {
          throw new Error(`I noticed you don't have enough ${tokenSymbol} for this repayment. You need ${params.amount} ${tokenSymbol}, but your wallet only has ${formatUnits(tokenBalance, decimals)} ${tokenSymbol}. Would you like to try a smaller amount?`);
        }
      }

      // Approve if needed (exact amount or debt + buffer)
      await approveToken(params.asset, approvalAmount);

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'repay',
        args: [
          params.asset,
          amount,
          BigInt(params.rateMode),
          params.onBehalfOf || address
        ],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully repaid ${params.amount === "max" ? "all" : params.amount} tokens`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Repay borrowed MNT
   */
  const repayMNT = async (
    amount: string,
    rateMode: 1 | 2 = 2,
    onBehalfOf?: Address
  ): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      // Check MNT balance
      const mntBalance = await getBalance(wagmiConfig as any, {
        address: address,
        chainId: MANTLE_CHAIN_ID as any,
      });

      const amountWei = amount.toLowerCase() === "max"
        ? maxUint256
        : parseEther(amount);

      // For non-max repay, check if user has enough MNT
      if (amount.toLowerCase() !== "max" && mntBalance.value < amountWei) {
        throw new Error(`I noticed you don't have enough MNT for this repayment. You need ${amount} MNT, but your wallet only has ${formatEther(mntBalance.value)} MNT. Would you like to try a smaller amount?`);
      }

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.WETHGateway,
        abi: WETH_GATEWAY_ABI,
        functionName: 'repayETH',
        args: [
          LENDLE_CONTRACTS.LendingPool,
          amountWei,
          BigInt(rateMode),
          onBehalfOf || address
        ],
        value: amountWei === maxUint256 ? parseEther("1000000") : amountWei, // Send more than needed, excess returned
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully repaid ${amount === "max" ? "all" : amount} MNT`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // COLLATERAL MANAGEMENT
  // ====================================

  /**
   * Enable or disable an asset as collateral
   */
  const setAssetAsCollateral = async (
    asset: Address,
    useAsCollateral: boolean
  ): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'setUserUseReserveAsCollateral',
        args: [asset, useAsCollateral],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Asset ${useAsCollateral ? "enabled" : "disabled"} as collateral`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Swap between stable and variable borrow rate
   */
  const swapBorrowRateMode = async (
    asset: Address,
    currentRateMode: 1 | 2
  ): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'swapBorrowRateMode',
        args: [asset, BigInt(currentRateMode)],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      const newRate = currentRateMode === 1 ? "variable" : "stable";
      return {
        success: true,
        message: `Successfully switched to ${newRate} rate`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // LIQUIDATION
  // ====================================

  /**
   * Liquidate an undercollateralized position
   */
  const liquidate = async (params: LiquidationParams): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const decimals = await getTokenDecimals(params.debtAsset);
      const debtToCover = parseUnits(params.debtToCover, decimals);

      // Approve debt asset
      await approveToken(params.debtAsset, debtToCover);

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'liquidationCall',
        args: [
          params.collateralAsset,
          params.debtAsset,
          params.user,
          debtToCover,
          params.receiveAToken
        ],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully liquidated position`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // FLASH LOANS
  // ====================================

  /**
   * Execute a flash loan
   * Note: Requires a receiver contract that implements IFlashLoanReceiver
   */
  const flashLoan = async (params: FlashLoanParams): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      // Convert amounts
      const amounts: bigint[] = [];
      for (let i = 0; i < params.assets.length; i++) {
        const decimals = await getTokenDecimals(params.assets[i]);
        amounts.push(parseUnits(params.amounts[i], decimals));
      }

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'flashLoan',
        args: [
          params.receiverAddress,
          params.assets,
          amounts,
          params.modes.map(m => BigInt(m)),
          params.onBehalfOf || address,
          params.params,
          params.referralCode || 0
        ],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Flash loan executed successfully`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // READ FUNCTIONS - USER DATA
  // ====================================

  /**
   * Get user's account data (collateral, debt, health factor)
   */
  const getUserAccountData = async (userAddress?: Address): Promise<UserAccountData | null> => {
    try {
      const targetAddress = userAddress || address;
      if (!targetAddress) return null;

      const data = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'getUserAccountData',
        args: [targetAddress],
        chainId: MANTLE_CHAIN_ID as any,
      }) as [bigint, bigint, bigint, bigint, bigint, bigint];

      return {
        totalCollateralETH: formatEther(data[0]),
        totalDebtETH: formatEther(data[1]),
        availableBorrowsETH: formatEther(data[2]),
        currentLiquidationThreshold: (Number(data[3]) / 100).toFixed(2),
        ltv: (Number(data[4]) / 100).toFixed(2),
        healthFactor: data[5] === maxUint256 ? "∞" : formatEther(data[5])
      };
    } catch (err) {
      console.error("Error fetching user account data:", err);
      return null;
    }
  };

  /**
   * Get user's position in a specific reserve
   */
  const getUserReserveData = async (
    asset: Address,
    userAddress?: Address
  ): Promise<UserReserveData | null> => {
    try {
      const targetAddress = userAddress || address;
      if (!targetAddress) return null;

      const decimals = await getTokenDecimals(asset);

      const data = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.ProtocolDataProvider,
        abi: PROTOCOL_DATA_PROVIDER_ABI,
        functionName: 'getUserReserveData',
        args: [asset, targetAddress],
        chainId: MANTLE_CHAIN_ID as any,
      }) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, number, boolean];

      return {
        currentATokenBalance: formatUnits(data[0], decimals),
        currentStableDebt: formatUnits(data[1], decimals),
        currentVariableDebt: formatUnits(data[2], decimals),
        liquidityRate: rayToPercent(data[6]),
        usageAsCollateralEnabled: data[8]
      };
    } catch (err) {
      console.error("Error fetching user reserve data:", err);
      return null;
    }
  };

  // ====================================
  // READ FUNCTIONS - RESERVE DATA
  // ====================================

  /**
   * Get reserve data (liquidity, rates, utilization)
   */
  const getReserveData = async (asset: Address): Promise<ReserveData | null> => {
    try {
      const decimals = await getTokenDecimals(asset);

      const data = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.ProtocolDataProvider,
        abi: PROTOCOL_DATA_PROVIDER_ABI,
        functionName: 'getReserveData',
        args: [asset],
        chainId: MANTLE_CHAIN_ID as any,
      }) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, number];

      const availableLiquidity = data[0];
      const totalStableDebt = data[1];
      const totalVariableDebt = data[2];
      const totalDebt = totalStableDebt + totalVariableDebt;
      const totalLiquidity = availableLiquidity + totalDebt;

      const utilizationRate = totalLiquidity > BigInt(0)
        ? (Number(totalDebt) * 100 / Number(totalLiquidity)).toFixed(2)
        : "0";

      return {
        availableLiquidity: formatUnits(availableLiquidity, decimals),
        totalStableDebt: formatUnits(totalStableDebt, decimals),
        totalVariableDebt: formatUnits(totalVariableDebt, decimals),
        liquidityRate: rayToPercent(data[3]), // Supply APY
        variableBorrowRate: rayToPercent(data[4]),
        stableBorrowRate: rayToPercent(data[5]),
        utilizationRate
      };
    } catch (err) {
      console.error("Error fetching reserve data:", err);
      return null;
    }
  };

  /**
   * Get reserve configuration
   */
  const getReserveConfigData = async (asset: Address): Promise<ReserveConfigData | null> => {
    try {
      const data = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.ProtocolDataProvider,
        abi: PROTOCOL_DATA_PROVIDER_ABI,
        functionName: 'getReserveConfigurationData',
        args: [asset],
        chainId: MANTLE_CHAIN_ID as any,
      }) as [bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean, boolean, boolean];

      return {
        decimals: Number(data[0]),
        ltv: Number(data[1]) / 100,
        liquidationThreshold: Number(data[2]) / 100,
        liquidationBonus: Number(data[3]) / 100 - 100, // Convert from 10500 to 5%
        reserveFactor: Number(data[4]) / 100,
        usageAsCollateralEnabled: data[5],
        borrowingEnabled: data[6],
        stableBorrowRateEnabled: data[7],
        isActive: data[8],
        isFrozen: data[9]
      };
    } catch (err) {
      console.error("Error fetching reserve config:", err);
      return null;
    }
  };

  /**
   * Get all supported reserves
   */
  const getAllReserves = async (): Promise<TokenInfo[]> => {
    try {
      const reserves = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.ProtocolDataProvider,
        abi: PROTOCOL_DATA_PROVIDER_ABI,
        functionName: 'getAllReservesTokens',
        chainId: MANTLE_CHAIN_ID as any,
      }) as Array<{ symbol: string; tokenAddress: Address }>;

      const result: TokenInfo[] = [];

      for (const reserve of reserves) {
        const decimals = await getTokenDecimals(reserve.tokenAddress);
        const tokens = await readContract(wagmiConfig as any, {
          address: LENDLE_CONTRACTS.ProtocolDataProvider,
          abi: PROTOCOL_DATA_PROVIDER_ABI,
          functionName: 'getReserveTokensAddresses',
          args: [reserve.tokenAddress],
          chainId: MANTLE_CHAIN_ID as any,
        }) as [Address, Address, Address];

        result.push({
          symbol: reserve.symbol,
          address: reserve.tokenAddress,
          decimals,
          lTokenAddress: tokens[0],
          stableDebtAddress: tokens[1],
          variableDebtAddress: tokens[2]
        });
      }

      return result;
    } catch (err) {
      console.error("Error fetching reserves:", err);
      return [];
    }
  };

  /**
   * Get asset price from oracle
   */
  const getAssetPrice = async (asset: Address): Promise<string | null> => {
    try {
      const price = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.AaveOracle,
        abi: ORACLE_ABI,
        functionName: 'getAssetPrice',
        args: [asset],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      // Price is in 8 decimals (USD)
      return formatUnits(price, 8);
    } catch (err) {
      console.error("Error fetching asset price:", err);
      return null;
    }
  };

  // ====================================
  // REWARDS & STAKING
  // ====================================

  /**
   * Claim LEND rewards from lending/borrowing
   */
  const claimRewards = async (lTokenAddresses: Address[]): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.ChefIncentivesController,
        abi: CHEF_INCENTIVES_ABI,
        functionName: 'claim',
        args: [address, lTokenAddresses],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: "Successfully claimed LEND rewards",
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get pending LEND rewards
   */
  const getPendingRewards = async (lTokenAddresses: Address[]): Promise<string[]> => {
    try {
      if (!address) return [];

      const rewards = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.ChefIncentivesController,
        abi: CHEF_INCENTIVES_ABI,
        functionName: 'pendingRewards',
        args: [address, lTokenAddresses],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint[];

      return rewards.map(r => formatEther(r));
    } catch (err) {
      console.error("Error fetching pending rewards:", err);
      return [];
    }
  };

  /**
   * Get user's LEND token balance
   */
  const getLendBalance = async (): Promise<{ balance: string; balanceRaw: bigint } | null> => {
    try {
      if (!address) return null;

      const balance = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendleToken,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      return {
        balance: formatEther(balance),
        balanceRaw: balance
      };
    } catch (err) {
      console.error("Error fetching LEND balance:", err);
      return null;
    }
  };

  /**
   * Stake LEND tokens
   */
  const stakeLEND = async (
    amount: string,
    lock: boolean = false
  ): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const amountWei = parseEther(amount);

      // Approve LEND token
      const currentAllowance = await readContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.LendleToken,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, LENDLE_CONTRACTS.MultiFeeDistribution],
        chainId: MANTLE_CHAIN_ID as any,
      });

      if ((currentAllowance as bigint) < amountWei) {
        // Use exact amount approval for better security (not unlimited)
        const approveTx = await writeContract(wagmiConfig as any, {
          address: LENDLE_CONTRACTS.LendleToken,
          abi: erc20Abi,
          functionName: 'approve',
          args: [LENDLE_CONTRACTS.MultiFeeDistribution, amountWei],
          chainId: MANTLE_CHAIN_ID as any,
        });

        await waitForTransactionReceipt(wagmiConfig as any, {
          hash: approveTx,
          chainId: MANTLE_CHAIN_ID as any,
        });
      }

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.MultiFeeDistribution,
        abi: MULTI_FEE_DISTRIBUTION_ABI,
        functionName: 'stake',
        args: [amountWei, lock],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully staked ${amount} LEND${lock ? " (locked)" : ""}`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Withdraw staked LEND
   */
  const withdrawStakedLEND = async (amount: string): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const amountWei = parseEther(amount);

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.MultiFeeDistribution,
        abi: MULTI_FEE_DISTRIBUTION_ABI,
        functionName: 'withdraw',
        args: [amountWei],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully withdrew ${amount} staked LEND`,
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Claim staking rewards
   */
  const claimStakingRewards = async (): Promise<LendleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const txHash = await writeContract(wagmiConfig as any, {
        address: LENDLE_CONTRACTS.MultiFeeDistribution,
        abi: MULTI_FEE_DISTRIBUTION_ABI,
        functionName: 'getReward',
        args: [],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: "Successfully claimed staking rewards",
        txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get staking info for user
   */
  const getStakingInfo = async (userAddress?: Address): Promise<StakingInfo | null> => {
    try {
      const targetAddress = userAddress || address;
      if (!targetAddress) return null;

      const [totalBalance, lockedBalances, withdrawable, earned] = await Promise.all([
        readContract(wagmiConfig as any, {
          address: LENDLE_CONTRACTS.MultiFeeDistribution,
          abi: MULTI_FEE_DISTRIBUTION_ABI,
          functionName: 'totalBalance',
          args: [targetAddress],
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: LENDLE_CONTRACTS.MultiFeeDistribution,
          abi: MULTI_FEE_DISTRIBUTION_ABI,
          functionName: 'lockedBalances',
          args: [targetAddress],
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: LENDLE_CONTRACTS.MultiFeeDistribution,
          abi: MULTI_FEE_DISTRIBUTION_ABI,
          functionName: 'withdrawableBalance',
          args: [targetAddress],
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: LENDLE_CONTRACTS.MultiFeeDistribution,
          abi: MULTI_FEE_DISTRIBUTION_ABI,
          functionName: 'earnedBalances',
          args: [targetAddress],
          chainId: MANTLE_CHAIN_ID as any,
        })
      ]);

      const locked = lockedBalances as [bigint, bigint, bigint, any];
      const withdraw = withdrawable as [bigint, bigint];
      const earnedData = earned as [bigint, any];

      return {
        totalStaked: formatEther(totalBalance as bigint),
        lockedBalance: formatEther(locked[2]),
        unlockableBalance: formatEther(locked[1]),
        withdrawableAmount: formatEther(withdraw[0]),
        penaltyAmount: formatEther(withdraw[1]),
        earnedRewards: formatEther(earnedData[0])
      };
    } catch (err) {
      console.error("Error fetching staking info:", err);
      return null;
    }
  };

  // ====================================
  // UTILITY FUNCTIONS
  // ====================================

  /**
   * Get explorer URL for transaction
   */
  const getExplorerUrl = (txHash: string): string => {
    return `https://mantlescan.xyz/tx/${txHash}`;
  };

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ====================================
  // RETURN
  // ====================================

  return {
    // State
    loading,
    error,
    clearError,

    // Deposit Functions
    deposit,
    depositMNT,

    // Withdraw Functions
    withdraw,
    withdrawMNT,

    // Borrow Functions
    borrow,
    borrowMNT,

    // Repay Functions
    repay,
    repayMNT,

    // Collateral Management
    setAssetAsCollateral,
    swapBorrowRateMode,

    // Liquidation
    liquidate,

    // Flash Loans
    flashLoan,

    // User Data
    getUserAccountData,
    getUserReserveData,

    // Reserve Data
    getReserveData,
    getReserveConfigData,
    getAllReserves,
    getAssetPrice,

    // Rewards & Staking
    claimRewards,
    getPendingRewards,
    getLendBalance,
    stakeLEND,
    withdrawStakedLEND,
    claimStakingRewards,
    getStakingInfo,

    // Utilities
    getExplorerUrl,

    // Constants
    LENDLE_CONFIG,
    LENDLE_CONTRACTS,
    LENDLE_ASSETS,
    INTEREST_RATE_MODE
  };
};

export default useLendleHook;
