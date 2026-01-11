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
  encodePacked,
  type Hex,
  type Address,
  maxUint256,
  erc20Abi
} from 'viem';

// ====================================
// FUSIONX PROTOCOL CONFIGURATION
// ====================================

/**
 * FusionX Finance - Native DEX on Mantle Network
 *
 * FusionX is the leading native DEX on Mantle Network offering:
 * - V2 AMM (Constant Product) swaps
 * - V3 Concentrated Liquidity swaps
 * - Liquidity provision for V2 and V3 pools
 * - Smart Router for optimal routing
 *
 * Key Features:
 * - Ultra-low gas fees on Mantle
 * - Concentrated liquidity for capital efficiency
 * - Multiple fee tiers (0.01%, 0.05%, 0.3%, 1%)
 */

export const FUSIONX_CONFIG = {
  chainId: 5000,
  chainName: "Mantle",
  protocol: "FusionX Finance",
  version: "2.0",
  website: "https://fusionx.finance",
  docs: "https://docs.fusionx.finance"
} as const;

// FusionX V2 Contract Addresses
export const FUSIONX_V2_CONTRACTS = {
  Factory: "0xE5020961fA51ffd3662CDf307dEf18F9a87Cce7c" as Address,
  Router: "0xDd0840118bF9CCCc6d67b2944ddDfbdb995955FD" as Address,
  Multicall: "0x27679C2E0Da9Bac8b4C4135CF0952d2aBCb6AA55" as Address,
  INIT_CODE_HASH: "0x58c684aeb03fe49c8a3080db88e425fae262c5ef5bf0e8acffc0526c6e3c03a0" as Hex,
} as const;

// FusionX V3 Contract Addresses
export const FUSIONX_V3_CONTRACTS = {
  Factory: "0x530d2766D1988CC1c000C8b7d00334c14B69AD71" as Address,
  PoolDeployer: "0x8790c2C3BA67223D83C8FCF2a5E3C650059987b4" as Address,
  SwapRouter: "0x5989FB161568b9F133eDf5Cf6787f5597762797F" as Address,
  NonfungiblePositionManager: "0x5752F085206AB87d8a5EF6166779658ADD455774" as Address,
  QuoterV2: "0x90f72244294E7c5028aFd6a96E18CC2c1E913995" as Address,
  MixedRouteQuoterV1: "0xD79dEB10Dc7970467dC36A51Ebc306821aB16618" as Address,
  TickLens: "0xE80EE7e19Dd06365111471E1478bA671CAd024C0" as Address,
  TokenValidator: "0x256406635628D158B88D678826B588b9F2f76A97" as Address,
  Multicall: "0xf5bb4e61ccAC9080fb520e5F69224eE85a4D588F" as Address,
  SmartRouter: "0x4bf659cA398A73AaF73818F0c64c838B9e229c08" as Address,
  V3Migrator: "0xbc9F05790045e8479718841cE055ffA95b2C4890" as Address,
} as const;

// Common Token Addresses on Mantle
export const FUSIONX_TOKENS = {
  WMNT: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8" as Address,
  WETH: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111" as Address,
  USDC: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9" as Address,
  USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE" as Address,
  METH: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0" as Address,
  WBTC: "0xCAbAE6f6Ea1ecaB08Ad02fE02ce9A44F09aebfA2" as Address,
  LEND: "0x25356aeca4210eF7553140edb9b8026089E49396" as Address, // Lendle governance token
} as const;

// V3 Fee Tiers
export const FEE_TIERS = {
  LOWEST: 100,    // 0.01%
  LOW: 500,       // 0.05%
  MEDIUM: 3000,   // 0.30%
  HIGH: 10000,    // 1.00%
} as const;

// FusionX Subgraph API Endpoints
export const FUSIONX_SUBGRAPH = {
  V2: "https://subgraph-api.mantle.xyz/subgraphs/name/fusionx/exchange",
  V3: "https://subgraph-api.mantle.xyz/subgraphs/name/fusionx/exchange-v3",
} as const;

// ====================================
// CONTRACT ABIs
// ====================================

// V2 Router ABI
const V2_ROUTER_ABI = [
  // Swap Functions
  {
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "swapExactTokensForTokens",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "amountOut", type: "uint256" },
      { name: "amountInMax", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "swapTokensForExactTokens",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "swapExactETHForTokens",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "amountOut", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "swapETHForExactTokens",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "swapExactTokensForETH",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "amountOut", type: "uint256" },
      { name: "amountInMax", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "swapTokensForExactETH",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Liquidity Functions
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "amountADesired", type: "uint256" },
      { name: "amountBDesired", type: "uint256" },
      { name: "amountAMin", type: "uint256" },
      { name: "amountBMin", type: "uint256" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "addLiquidity",
    outputs: [
      { name: "amountA", type: "uint256" },
      { name: "amountB", type: "uint256" },
      { name: "liquidity", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amountTokenDesired", type: "uint256" },
      { name: "amountTokenMin", type: "uint256" },
      { name: "amountETHMin", type: "uint256" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "addLiquidityETH",
    outputs: [
      { name: "amountToken", type: "uint256" },
      { name: "amountETH", type: "uint256" },
      { name: "liquidity", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "liquidity", type: "uint256" },
      { name: "amountAMin", type: "uint256" },
      { name: "amountBMin", type: "uint256" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "removeLiquidity",
    outputs: [
      { name: "amountA", type: "uint256" },
      { name: "amountB", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "liquidity", type: "uint256" },
      { name: "amountTokenMin", type: "uint256" },
      { name: "amountETHMin", type: "uint256" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    name: "removeLiquidityETH",
    outputs: [
      { name: "amountToken", type: "uint256" },
      { name: "amountETH", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Quote Functions
  {
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "path", type: "address[]" }
    ],
    name: "getAmountsOut",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "amountOut", type: "uint256" },
      { name: "path", type: "address[]" }
    ],
    name: "getAmountsIn",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "factory",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "WETH",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// V2 Factory ABI
const V2_FACTORY_ABI = [
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" }
    ],
    name: "getPair",
    outputs: [{ name: "pair", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "allPairsLength",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "allPairs",
    outputs: [{ name: "pair", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// V2 Pair ABI
const V2_PAIR_ABI = [
  {
    inputs: [],
    name: "getReserves",
    outputs: [
      { name: "reserve0", type: "uint112" },
      { name: "reserve1", type: "uint112" },
      { name: "blockTimestampLast", type: "uint32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "token0",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// V3 SwapRouter ABI
const V3_SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "exactInputSingle",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { name: "path", type: "bytes" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "exactInput",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountOut", type: "uint256" },
          { name: "amountInMaximum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "exactOutputSingle",
    outputs: [{ name: "amountIn", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { name: "path", type: "bytes" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountOut", type: "uint256" },
          { name: "amountInMaximum", type: "uint256" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "exactOutput",
    outputs: [{ name: "amountIn", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "data", type: "bytes[]" }],
    name: "multicall",
    outputs: [{ name: "results", type: "bytes[]" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "amountMinimum", type: "uint256" }, { name: "recipient", type: "address" }],
    name: "unwrapWETH9",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "amountMinimum", type: "uint256" }],
    name: "refundETH",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
] as const;

// V3 QuoterV2 ABI
const V3_QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "path", type: "bytes" },
      { name: "amountIn", type: "uint256" }
    ],
    name: "quoteExactInput",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96AfterList", type: "uint160[]" },
      { name: "initializedTicksCrossedList", type: "uint32[]" },
      { name: "gasEstimate", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "quoteExactOutputSingle",
    outputs: [
      { name: "amountIn", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// V3 NonfungiblePositionManager ABI
const V3_POSITION_MANAGER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "token0", type: "address" },
          { name: "token1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickLower", type: "int24" },
          { name: "tickUpper", type: "int24" },
          { name: "amount0Desired", type: "uint256" },
          { name: "amount1Desired", type: "uint256" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "mint",
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "liquidity", type: "uint128" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "amount0Desired", type: "uint256" },
          { name: "amount1Desired", type: "uint256" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "increaseLiquidity",
    outputs: [
      { name: "liquidity", type: "uint128" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "liquidity", type: "uint128" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "decreaseLiquidity",
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "amount0Max", type: "uint128" },
          { name: "amount1Max", type: "uint128" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "collect",
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "positions",
    outputs: [
      { name: "nonce", type: "uint96" },
      { name: "operator", type: "address" },
      { name: "token0", type: "address" },
      { name: "token1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "tickLower", type: "int24" },
      { name: "tickUpper", type: "int24" },
      { name: "liquidity", type: "uint128" },
      { name: "feeGrowthInside0LastX128", type: "uint256" },
      { name: "feeGrowthInside1LastX128", type: "uint256" },
      { name: "tokensOwed0", type: "uint128" },
      { name: "tokensOwed1", type: "uint128" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" }
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "data", type: "bytes[]" }],
    name: "multicall",
    outputs: [{ name: "results", type: "bytes[]" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "amountMinimum", type: "uint256" }, { name: "recipient", type: "address" }],
    name: "unwrapWETH9",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "amountMinimum", type: "uint256" }],
    name: "refundETH",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "token", type: "address" }, { name: "amountMinimum", type: "uint256" }, { name: "recipient", type: "address" }],
    name: "sweepToken",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
] as const;

// V3 Factory ABI
const V3_FACTORY_ABI = [
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" }
    ],
    name: "getPool",
    outputs: [{ name: "pool", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// V3 Pool ABI
const V3_POOL_ABI = [
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "token0",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "fee",
    outputs: [{ name: "", type: "uint24" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "tickSpacing",
    outputs: [{ name: "", type: "int24" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// ====================================
// TYPES & INTERFACES
// ====================================

export interface FusionXHookResponse {
  success: boolean;
  message: string;
  txHash?: string;
  data?: any;
  error?: string;
}

// V2 Types
export interface SwapExactTokensParams {
  amountIn: string;
  amountOutMin: string;
  path: Address[];
  to?: Address;
  deadline?: number;
}

export interface SwapTokensForExactParams {
  amountOut: string;
  amountInMax: string;
  path: Address[];
  to?: Address;
  deadline?: number;
}

export interface AddLiquidityParams {
  tokenA: Address;
  tokenB: Address;
  amountADesired: string;
  amountBDesired: string;
  amountAMin?: string;
  amountBMin?: string;
  to?: Address;
  deadline?: number;
}

export interface RemoveLiquidityParams {
  tokenA: Address;
  tokenB: Address;
  liquidity: string;
  amountAMin?: string;
  amountBMin?: string;
  to?: Address;
  deadline?: number;
}

// V3 Types
export interface V3SwapExactInputSingleParams {
  tokenIn: Address;
  tokenOut: Address;
  fee: number;
  amountIn: string;
  amountOutMinimum: string;
  sqrtPriceLimitX96?: bigint;
  recipient?: Address;
  deadline?: number;
}

export interface V3SwapExactInputParams {
  path: { token: Address; fee: number }[];
  amountIn: string;
  amountOutMinimum: string;
  recipient?: Address;
  deadline?: number;
}

export interface V3SwapExactOutputSingleParams {
  tokenIn: Address;
  tokenOut: Address;
  fee: number;
  amountOut: string;
  amountInMaximum: string;
  sqrtPriceLimitX96?: bigint;
  recipient?: Address;
  deadline?: number;
}

export interface V3MintPositionParams {
  token0: Address;
  token1: Address;
  fee: number;
  tickLower: number;
  tickUpper: number;
  amount0Desired: string;
  amount1Desired: string;
  amount0Min?: string;
  amount1Min?: string;
  recipient?: Address;
  deadline?: number;
}

export interface V3IncreaseLiquidityParams {
  tokenId: bigint;
  amount0Desired: string;
  amount1Desired: string;
  amount0Min?: string;
  amount1Min?: string;
  deadline?: number;
}

export interface V3DecreaseLiquidityParams {
  tokenId: bigint;
  liquidity: bigint;
  amount0Min?: string;
  amount1Min?: string;
  deadline?: number;
}

export interface V3CollectFeesParams {
  tokenId: bigint;
  recipient?: Address;
  amount0Max?: bigint;
  amount1Max?: bigint;
}

export interface V3PositionInfo {
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

export interface PairInfo {
  pairAddress: Address;
  token0: Address;
  token1: Address;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: string;
  reserve1: string;
  reserve0Raw: bigint;
  reserve1Raw: bigint;
  totalSupply: string;
}

export interface QuoteResult {
  amountOut: string;
  priceImpact: string;
  path: Address[];
}

export interface V3PoolInfo {
  poolAddress: Address;
  token0: Address;
  token1: Address;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
}

// LP History interfaces (from Subgraph API)
export interface LPMintEvent {
  id: string;
  transaction: {
    id: string;
    timestamp: string;
  };
  pair: {
    id: string;
    token0: { symbol: string; name: string; id: string };
    token1: { symbol: string; name: string; id: string };
  };
  to: string;
  liquidity: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
}

export interface LPBurnEvent {
  id: string;
  transaction: {
    id: string;
    timestamp: string;
  };
  pair: {
    id: string;
    token0: { symbol: string; name: string; id: string };
    token1: { symbol: string; name: string; id: string };
  };
  sender: string;
  liquidity: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
}

export interface LPHistoryResponse {
  mints: LPMintEvent[];
  burns: LPBurnEvent[];
}

// ====================================
// MAIN HOOK
// ====================================

export const useFusionXHook = () => {
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
   * Approve token for spender
   */
  const approveToken = async (
    tokenAddress: Address,
    spenderAddress: Address,
    amount: bigint
  ): Promise<Hex | null> => {
    try {
      const currentAllowance = await readContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as Address, spenderAddress],
        chainId: MANTLE_CHAIN_ID as any,
      });

      if ((currentAllowance as bigint) >= amount) {
        return null;
      }

      // Use exact amount approval for better security (not unlimited/maxUint256)
      const txHash = await writeContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, amount],
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
   * Check if user has sufficient token balance
   */
  const checkTokenBalance = async (
    tokenAddress: Address,
    requiredAmount: bigint
  ): Promise<{ hasBalance: boolean; balance: bigint }> => {
    try {
      if (!address) return { hasBalance: false, balance: BigInt(0) };

      const balance = await readContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      return { hasBalance: balance >= requiredAmount, balance };
    } catch (err) {
      console.error("Error checking token balance:", err);
      return { hasBalance: false, balance: BigInt(0) };
    }
  };

  /**
   * Check if user has sufficient MNT balance
   */
  const checkMNTBalance = async (requiredAmount: bigint): Promise<{ hasBalance: boolean; balance: bigint }> => {
    try {
      if (!address) return { hasBalance: false, balance: BigInt(0) };

      const balance = await getBalance(wagmiConfig as any, {
        address: address,
        chainId: MANTLE_CHAIN_ID as any,
      });

      return { hasBalance: balance.value >= requiredAmount, balance: balance.value };
    } catch (err) {
      console.error("Error checking MNT balance:", err);
      return { hasBalance: false, balance: BigInt(0) };
    }
  };

  /**
   * Get deadline timestamp
   */
  const getDeadline = (minutes: number = 20): bigint => {
    return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
  };

  /**
   * Encode V3 path for multi-hop swaps
   */
  const encodeV3Path = (tokens: Address[], fees: number[]): Hex => {
    if (tokens.length !== fees.length + 1) {
      throw new Error("Invalid path: tokens length must be fees length + 1");
    }

    let encoded: Hex = tokens[0].toLowerCase() as Hex;
    for (let i = 0; i < fees.length; i++) {
      const feeHex = fees[i].toString(16).padStart(6, '0');
      encoded = `${encoded}${feeHex}${tokens[i + 1].slice(2).toLowerCase()}` as Hex;
    }
    return encoded;
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
    if (errorStr.includes("INSUFFICIENT_OUTPUT_AMOUNT")) {
      return "The price moved too much during the swap. Try increasing your slippage tolerance or try again.";
    }
    if (errorStr.includes("EXPIRED")) {
      return "The transaction deadline expired. Please try again.";
    }
    if (errorStr.includes("INSUFFICIENT_LIQUIDITY")) {
      return "There isn't enough liquidity in the pool for this trade. Try a smaller amount or a different pair.";
    }
    // Catch generic insufficient balance errors from contract
    if (errorStr.includes("insufficient") || errorStr.includes("exceeds balance")) {
      return "It looks like you don't have enough balance to complete this operation. Please check your wallet balance and try again.";
    }

    return errorStr || "Something went wrong. Please try again.";
  };

  // ====================================
  // V2 SWAP FUNCTIONS
  // ====================================

  /**
   * Swap exact tokens for tokens (V2)
   * Swaps a precise amount of input tokens for as many output tokens as possible
   */
  const swapExactTokensForTokens = async (
    params: SwapExactTokensParams
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const tokenInDecimals = await getTokenDecimals(params.path[0]);
      const tokenOutDecimals = await getTokenDecimals(params.path[params.path.length - 1]);
      const tokenInSymbol = await getTokenSymbol(params.path[0]);

      const amountIn = parseUnits(params.amountIn, tokenInDecimals);
      const amountOutMin = parseUnits(params.amountOutMin, tokenOutDecimals);
      const deadline = params.deadline ? BigInt(params.deadline) : getDeadline();

      // Check token balance before proceeding
      const { hasBalance, balance } = await checkTokenBalance(params.path[0], amountIn);
      if (!hasBalance) {
        throw new Error(`I noticed you don't have enough ${tokenInSymbol} for this swap. You need ${params.amountIn} ${tokenInSymbol}, but your wallet only has ${formatUnits(balance, tokenInDecimals)} ${tokenInSymbol}. Would you like to try a smaller amount?`);
      }

      // Approve token
      await approveToken(params.path[0], FUSIONX_V2_CONTRACTS.Router, amountIn);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Router,
        abi: V2_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [
          amountIn,
          amountOutMin,
          params.path,
          params.to || address,
          deadline
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
        message: `Successfully swapped ${params.amountIn} tokens`,
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
   * Swap tokens for exact tokens (V2)
   * Swaps as few input tokens as possible for a precise amount of output tokens
   */
  const swapTokensForExactTokens = async (
    params: SwapTokensForExactParams
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const tokenInDecimals = await getTokenDecimals(params.path[0]);
      const tokenOutDecimals = await getTokenDecimals(params.path[params.path.length - 1]);

      const amountOut = parseUnits(params.amountOut, tokenOutDecimals);
      const amountInMax = parseUnits(params.amountInMax, tokenInDecimals);
      const deadline = params.deadline ? BigInt(params.deadline) : getDeadline();

      await approveToken(params.path[0], FUSIONX_V2_CONTRACTS.Router, amountInMax);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Router,
        abi: V2_ROUTER_ABI,
        functionName: 'swapTokensForExactTokens',
        args: [
          amountOut,
          amountInMax,
          params.path,
          params.to || address,
          deadline
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
        message: `Successfully swapped for ${params.amountOut} tokens`,
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
   * Swap exact MNT for tokens (V2)
   */
  const swapExactMNTForTokens = async (
    params: {
      amountIn: string;
      amountOutMin: string;
      tokenOut: Address;
      to?: Address;
    }
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const amountInWei = parseEther(params.amountIn);
      const tokenOutDecimals = await getTokenDecimals(params.tokenOut);
      const amountOutMinWei = parseUnits(params.amountOutMin, tokenOutDecimals);
      const deadline = getDeadline();

      // Check MNT balance before proceeding
      const { hasBalance, balance: mntBalance } = await checkMNTBalance(amountInWei);
      if (!hasBalance) {
        throw new Error(`I noticed you don't have enough MNT for this swap. You need ${params.amountIn} MNT, but your wallet only has ${formatEther(mntBalance)} MNT. Would you like to try a smaller amount?`);
      }

      const path = [FUSIONX_TOKENS.WMNT, params.tokenOut];

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Router,
        abi: V2_ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [amountOutMinWei, path, params.to || address, deadline],
        value: amountInWei,
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully swapped ${params.amountIn} MNT`,
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
   * Swap exact tokens for MNT (V2)
   */
  const swapExactTokensForMNT = async (
    params: {
      tokenIn: Address;
      amountIn: string;
      amountOutMin: string;
      to?: Address;
    }
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const tokenInDecimals = await getTokenDecimals(params.tokenIn);
      const tokenInSymbol = await getTokenSymbol(params.tokenIn);
      const amountInWei = parseUnits(params.amountIn, tokenInDecimals);
      const amountOutMinWei = parseEther(params.amountOutMin);
      const deadline = getDeadline();

      // Check token balance before proceeding
      const { hasBalance, balance } = await checkTokenBalance(params.tokenIn, amountInWei);
      if (!hasBalance) {
        throw new Error(`I noticed you don't have enough ${tokenInSymbol} for this swap. You need ${params.amountIn} ${tokenInSymbol}, but your wallet only has ${formatUnits(balance, tokenInDecimals)} ${tokenInSymbol}. Would you like to try a smaller amount?`);
      }

      const path = [params.tokenIn, FUSIONX_TOKENS.WMNT];

      // Use exact amount approval for better security
      await approveToken(params.tokenIn, FUSIONX_V2_CONTRACTS.Router, amountInWei);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Router,
        abi: V2_ROUTER_ABI,
        functionName: 'swapExactTokensForETH',
        args: [amountInWei, amountOutMinWei, path, params.to || address, deadline],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully swapped ${params.amountIn} tokens for MNT`,
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
  // V2 LIQUIDITY FUNCTIONS
  // ====================================

  /**
   * Add liquidity to V2 pool
   */
  const addLiquidity = async (params: AddLiquidityParams): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const decimalsA = await getTokenDecimals(params.tokenA);
      const decimalsB = await getTokenDecimals(params.tokenB);

      const amountADesired = parseUnits(params.amountADesired, decimalsA);
      const amountBDesired = parseUnits(params.amountBDesired, decimalsB);

      // Check token balances before proceeding
      const [balanceA, balanceB] = await Promise.all([
        readContract(wagmiConfig as any, {
          address: params.tokenA,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
          chainId: MANTLE_CHAIN_ID as any,
        }) as Promise<bigint>,
        readContract(wagmiConfig as any, {
          address: params.tokenB,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
          chainId: MANTLE_CHAIN_ID as any,
        }) as Promise<bigint>
      ]);

      const symbolA = await getTokenSymbol(params.tokenA);
      const symbolB = await getTokenSymbol(params.tokenB);

      if (balanceA < amountADesired) {
        throw new Error(`I noticed you don't have enough ${symbolA} to add liquidity. You need ${params.amountADesired} ${symbolA}, but your wallet only has ${formatUnits(balanceA, decimalsA)} ${symbolA}. Would you like to try a smaller amount?`);
      }
      if (balanceB < amountBDesired) {
        throw new Error(`I noticed you don't have enough ${symbolB} to add liquidity. You need ${params.amountBDesired} ${symbolB}, but your wallet only has ${formatUnits(balanceB, decimalsB)} ${symbolB}. Would you like to try a smaller amount?`);
      }

      // Check native MNT balance for gas fees
      const mntBalance = await getBalance(wagmiConfig as any, {
        address: address,
        chainId: MANTLE_CHAIN_ID as any,
      });

      // Require at least 0.01 MNT for gas fees
      const minGasBalance = parseEther("0.01");
      if (mntBalance.value < minGasBalance) {
        throw new Error(`I noticed you don't have enough MNT for gas fees. You need at least 0.01 MNT for transaction fees, but your wallet only has ${formatEther(mntBalance.value)} MNT. Please add some MNT to your wallet for gas.`);
      }

      // Get pool info to calculate optimal amounts based on pool ratio
      const pairInfo = await getV2PairInfo(params.tokenA, params.tokenB);

      let amountAMin: bigint;
      let amountBMin: bigint;

      if (pairInfo && pairInfo.reserve0Raw > BigInt(0) && pairInfo.reserve1Raw > BigInt(0)) {
        // Pool exists - calculate optimal amounts based on pool ratio
        // Determine which token is token0 in the pair
        const isTokenAFirst = params.tokenA.toLowerCase() < params.tokenB.toLowerCase();
        const reserveA = isTokenAFirst ? pairInfo.reserve0Raw : pairInfo.reserve1Raw;
        const reserveB = isTokenAFirst ? pairInfo.reserve1Raw : pairInfo.reserve0Raw;

        // Calculate optimal B amount for given A amount
        const optimalB = (amountADesired * reserveB) / reserveA;
        // Calculate optimal A amount for given B amount
        const optimalA = (amountBDesired * reserveA) / reserveB;

        // Use the smaller ratio to determine actual amounts
        let actualAmountA: bigint;
        let actualAmountB: bigint;

        if (optimalB <= amountBDesired) {
          // Use full amountA, calculate required B
          actualAmountA = amountADesired;
          actualAmountB = optimalB;
        } else {
          // Use full amountB, calculate required A
          actualAmountA = optimalA;
          actualAmountB = amountBDesired;
        }

        // Set minimum amounts with 5% slippage based on ACTUAL amounts that will be used
        amountAMin = params.amountAMin
          ? parseUnits(params.amountAMin, decimalsA)
          : (actualAmountA * BigInt(95)) / BigInt(100);
        amountBMin = params.amountBMin
          ? parseUnits(params.amountBMin, decimalsB)
          : (actualAmountB * BigInt(95)) / BigInt(100);
      } else {
        // New pool - use desired amounts directly with slippage
        amountAMin = params.amountAMin
          ? parseUnits(params.amountAMin, decimalsA)
          : (amountADesired * BigInt(95)) / BigInt(100);
        amountBMin = params.amountBMin
          ? parseUnits(params.amountBMin, decimalsB)
          : (amountBDesired * BigInt(95)) / BigInt(100);
      }

      const deadline = params.deadline ? BigInt(params.deadline) : getDeadline();

      // Approve both tokens
      await approveToken(params.tokenA, FUSIONX_V2_CONTRACTS.Router, amountADesired);
      await approveToken(params.tokenB, FUSIONX_V2_CONTRACTS.Router, amountBDesired);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Router,
        abi: V2_ROUTER_ABI,
        functionName: 'addLiquidity',
        args: [
          params.tokenA,
          params.tokenB,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          params.to || address,
          deadline
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
        message: `Successfully added liquidity`,
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
   * Add liquidity with MNT (V2)
   */
  const addLiquidityMNT = async (
    token: Address,
    amountTokenDesired: string,
    amountMNTDesired: string,
    amountTokenMin?: string,
    amountMNTMin?: string,
    to?: Address
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const tokenDecimals = await getTokenDecimals(token);
      const amountToken = parseUnits(amountTokenDesired, tokenDecimals);
      const amountMNT = parseEther(amountMNTDesired);

      // Check token balance
      const tokenBalance = await readContract(wagmiConfig as any, {
        address: token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      const tokenSymbol = await getTokenSymbol(token);
      if (tokenBalance < amountToken) {
        throw new Error(`I noticed you don't have enough ${tokenSymbol} to add liquidity. You need ${amountTokenDesired} ${tokenSymbol}, but your wallet only has ${formatUnits(tokenBalance, tokenDecimals)} ${tokenSymbol}. Would you like to try a smaller amount?`);
      }

      // Check MNT balance (need liquidity amount + gas fees)
      const mntBalance = await getBalance(wagmiConfig as any, {
        address: address,
        chainId: MANTLE_CHAIN_ID as any,
      });

      // Require liquidity amount + 0.01 MNT for gas fees
      const gasBuffer = parseEther("0.01");
      const totalMNTRequired = amountMNT + gasBuffer;

      if (mntBalance.value < totalMNTRequired) {
        const availableForLiquidity = mntBalance.value > gasBuffer ? formatEther(mntBalance.value - gasBuffer) : "0";
        throw new Error(`I noticed you don't have enough MNT for this operation. You need ${amountMNTDesired} MNT for liquidity plus gas fees, but your wallet only has ${formatEther(mntBalance.value)} MNT (about ${availableForLiquidity} MNT available after reserving for gas). Would you like to try a smaller amount?`);
      }

      const minToken = amountTokenMin
        ? parseUnits(amountTokenMin, tokenDecimals)
        : (amountToken * BigInt(95)) / BigInt(100);
      const minMNT = amountMNTMin
        ? parseEther(amountMNTMin)
        : (amountMNT * BigInt(95)) / BigInt(100);
      const deadline = getDeadline();

      await approveToken(token, FUSIONX_V2_CONTRACTS.Router, amountToken);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Router,
        abi: V2_ROUTER_ABI,
        functionName: 'addLiquidityETH',
        args: [token, amountToken, minToken, minMNT, to || address, deadline],
        value: amountMNT,
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully added liquidity with MNT`,
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
   * Remove liquidity from V2 pool
   */
  const removeLiquidity = async (params: RemoveLiquidityParams): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const decimalsA = await getTokenDecimals(params.tokenA);
      const decimalsB = await getTokenDecimals(params.tokenB);

      const liquidity = parseEther(params.liquidity); // LP tokens have 18 decimals
      const amountAMin = params.amountAMin
        ? parseUnits(params.amountAMin, decimalsA)
        : BigInt(0);
      const amountBMin = params.amountBMin
        ? parseUnits(params.amountBMin, decimalsB)
        : BigInt(0);
      const deadline = params.deadline ? BigInt(params.deadline) : getDeadline();

      // Get pair address and check LP token balance
      const pairAddress = await readContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Factory,
        abi: V2_FACTORY_ABI,
        functionName: 'getPair',
        args: [params.tokenA, params.tokenB],
        chainId: MANTLE_CHAIN_ID as any,
      }) as Address;

      // Check LP token balance
      const lpBalance = await readContract(wagmiConfig as any, {
        address: pairAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      if (lpBalance < liquidity) {
        throw new Error(`I noticed you don't have enough LP tokens to remove this liquidity. You need ${params.liquidity} LP tokens, but your wallet only has ${formatEther(lpBalance)} LP tokens. Would you like to try a smaller amount?`);
      }

      // Check native MNT balance for gas fees
      const mntGasBalance = await getBalance(wagmiConfig as any, {
        address: address,
        chainId: MANTLE_CHAIN_ID as any,
      });

      // Require at least 0.01 MNT for gas fees
      const minGasBalance = parseEther("0.01");
      if (mntGasBalance.value < minGasBalance) {
        throw new Error(`I noticed you don't have enough MNT for gas fees. You need at least 0.01 MNT for transaction fees, but your wallet only has ${formatEther(mntGasBalance.value)} MNT. Please add some MNT to your wallet for gas.`);
      }

      await approveToken(pairAddress, FUSIONX_V2_CONTRACTS.Router, liquidity);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Router,
        abi: V2_ROUTER_ABI,
        functionName: 'removeLiquidity',
        args: [
          params.tokenA,
          params.tokenB,
          liquidity,
          amountAMin,
          amountBMin,
          params.to || address,
          deadline
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
        message: `Successfully removed liquidity`,
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
   * Remove liquidity with MNT (V2)
   */
  const removeLiquidityMNT = async (
    token: Address,
    liquidity: string,
    amountTokenMin?: string,
    amountMNTMin?: string,
    to?: Address
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const tokenDecimals = await getTokenDecimals(token);
      const liquidityWei = parseEther(liquidity);
      const minToken = amountTokenMin
        ? parseUnits(amountTokenMin, tokenDecimals)
        : BigInt(0);
      const minMNT = amountMNTMin ? parseEther(amountMNTMin) : BigInt(0);
      const deadline = getDeadline();

      // Get pair and check LP token balance
      const pairAddress = await readContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Factory,
        abi: V2_FACTORY_ABI,
        functionName: 'getPair',
        args: [token, FUSIONX_TOKENS.WMNT],
        chainId: MANTLE_CHAIN_ID as any,
      }) as Address;

      // Check LP token balance
      const lpBalance = await readContract(wagmiConfig as any, {
        address: pairAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      if (lpBalance < liquidityWei) {
        throw new Error(`I noticed you don't have enough LP tokens to remove this liquidity. You need ${liquidity} LP tokens, but your wallet only has ${formatEther(lpBalance)} LP tokens. Would you like to try a smaller amount?`);
      }

      // Check native MNT balance for gas fees
      const mntGasBalance = await getBalance(wagmiConfig as any, {
        address: address,
        chainId: MANTLE_CHAIN_ID as any,
      });

      // Require at least 0.01 MNT for gas fees
      const minGasBalance = parseEther("0.01");
      if (mntGasBalance.value < minGasBalance) {
        throw new Error(`I noticed you don't have enough MNT for gas fees. You need at least 0.01 MNT for transaction fees, but your wallet only has ${formatEther(mntGasBalance.value)} MNT. Please add some MNT to your wallet for gas.`);
      }

      await approveToken(pairAddress, FUSIONX_V2_CONTRACTS.Router, liquidityWei);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Router,
        abi: V2_ROUTER_ABI,
        functionName: 'removeLiquidityETH',
        args: [token, liquidityWei, minToken, minMNT, to || address, deadline],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully removed liquidity`,
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
  // V3 SWAP FUNCTIONS
  // ====================================

  /**
   * Swap exact input single hop (V3)
   */
  const v3SwapExactInputSingle = async (
    params: V3SwapExactInputSingleParams
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      // Check if V3 pool exists for this pair and fee tier
      const poolInfo = await getV3PoolInfo(params.tokenIn, params.tokenOut, params.fee);
      if (!poolInfo || !poolInfo.poolAddress || poolInfo.poolAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error(`No V3 pool found for this pair at ${params.fee / 10000}% fee tier. Try a different fee tier or use V2 AMM instead.`);
      }

      const tokenInDecimals = await getTokenDecimals(params.tokenIn);
      const tokenOutDecimals = await getTokenDecimals(params.tokenOut);

      const amountIn = parseUnits(params.amountIn, tokenInDecimals);
      const amountOutMinimum = parseUnits(params.amountOutMinimum, tokenOutDecimals);
      const deadline = params.deadline ? BigInt(params.deadline) : getDeadline();

      await approveToken(params.tokenIn, FUSIONX_V3_CONTRACTS.SwapRouter, amountIn);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.SwapRouter,
        abi: V3_SWAP_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [{
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          fee: params.fee,
          recipient: params.recipient || address,
          deadline: deadline,
          amountIn: amountIn,
          amountOutMinimum: amountOutMinimum,
          sqrtPriceLimitX96: params.sqrtPriceLimitX96 || BigInt(0)
        }],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully swapped ${params.amountIn} tokens via V3`,
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
   * Swap exact input multi-hop (V3)
   */
  const v3SwapExactInput = async (
    params: V3SwapExactInputParams
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const tokens = params.path.map(p => p.token);
      const fees = params.path.slice(0, -1).map(p => p.fee);

      // Check if V3 pools exist for each hop in the path
      for (let i = 0; i < tokens.length - 1; i++) {
        const poolInfo = await getV3PoolInfo(tokens[i], tokens[i + 1], fees[i]);
        if (!poolInfo || !poolInfo.poolAddress || poolInfo.poolAddress === '0x0000000000000000000000000000000000000000') {
          throw new Error(`No V3 pool found for ${i === 0 ? 'first' : 'intermediate'} hop at ${fees[i] / 10000}% fee tier. Try a different route or use V2 AMM.`);
        }
      }

      const tokenInDecimals = await getTokenDecimals(tokens[0]);
      const tokenOutDecimals = await getTokenDecimals(tokens[tokens.length - 1]);

      const amountIn = parseUnits(params.amountIn, tokenInDecimals);
      const amountOutMinimum = parseUnits(params.amountOutMinimum, tokenOutDecimals);
      const deadline = params.deadline ? BigInt(params.deadline) : getDeadline();

      const path = encodeV3Path(tokens, fees);

      await approveToken(tokens[0], FUSIONX_V3_CONTRACTS.SwapRouter, amountIn);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.SwapRouter,
        abi: V3_SWAP_ROUTER_ABI,
        functionName: 'exactInput',
        args: [{
          path: path,
          recipient: params.recipient || address,
          deadline: deadline,
          amountIn: amountIn,
          amountOutMinimum: amountOutMinimum
        }],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully swapped via V3 multi-hop`,
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
   * Swap exact output single hop (V3)
   */
  const v3SwapExactOutputSingle = async (
    params: V3SwapExactOutputSingleParams
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const tokenInDecimals = await getTokenDecimals(params.tokenIn);
      const tokenOutDecimals = await getTokenDecimals(params.tokenOut);

      const amountOut = parseUnits(params.amountOut, tokenOutDecimals);
      const amountInMaximum = parseUnits(params.amountInMaximum, tokenInDecimals);
      const deadline = params.deadline ? BigInt(params.deadline) : getDeadline();

      await approveToken(params.tokenIn, FUSIONX_V3_CONTRACTS.SwapRouter, amountInMaximum);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.SwapRouter,
        abi: V3_SWAP_ROUTER_ABI,
        functionName: 'exactOutputSingle',
        args: [{
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          fee: params.fee,
          recipient: params.recipient || address,
          deadline: deadline,
          amountOut: amountOut,
          amountInMaximum: amountInMaximum,
          sqrtPriceLimitX96: params.sqrtPriceLimitX96 || BigInt(0)
        }],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully swapped for ${params.amountOut} tokens via V3`,
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
  // V3 LIQUIDITY FUNCTIONS
  // ====================================

  /**
   * Mint new V3 liquidity position
   */
  const v3MintPosition = async (
    params: V3MintPositionParams
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      // Ensure token0 < token1 (required by Uniswap V3)
      let token0 = params.token0;
      let token1 = params.token1;
      let amount0Desired = params.amount0Desired;
      let amount1Desired = params.amount1Desired;

      if (token0.toLowerCase() > token1.toLowerCase()) {
        [token0, token1] = [token1, token0];
        [amount0Desired, amount1Desired] = [amount1Desired, amount0Desired];
      }

      const decimals0 = await getTokenDecimals(token0);
      const decimals1 = await getTokenDecimals(token1);

      const amount0 = parseUnits(amount0Desired, decimals0);
      const amount1 = parseUnits(amount1Desired, decimals1);

      // Check token balances before proceeding
      const [balance0, balance1] = await Promise.all([
        readContract(wagmiConfig as any, {
          address: token0,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
          chainId: MANTLE_CHAIN_ID as any,
        }) as Promise<bigint>,
        readContract(wagmiConfig as any, {
          address: token1,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
          chainId: MANTLE_CHAIN_ID as any,
        }) as Promise<bigint>
      ]);

      const symbol0 = await getTokenSymbol(token0);
      const symbol1 = await getTokenSymbol(token1);

      if (balance0 < amount0) {
        throw new Error(`I noticed you don't have enough ${symbol0} to add liquidity. You need ${amount0Desired} ${symbol0}, but your wallet only has ${formatUnits(balance0, decimals0)} ${symbol0}. Would you like to try a smaller amount?`);
      }
      if (balance1 < amount1) {
        throw new Error(`I noticed you don't have enough ${symbol1} to add liquidity. You need ${amount1Desired} ${symbol1}, but your wallet only has ${formatUnits(balance1, decimals1)} ${symbol1}. Would you like to try a smaller amount?`);
      }

      const amount0Min = params.amount0Min
        ? parseUnits(params.amount0Min, decimals0)
        : (amount0 * BigInt(95)) / BigInt(100);
      const amount1Min = params.amount1Min
        ? parseUnits(params.amount1Min, decimals1)
        : (amount1 * BigInt(95)) / BigInt(100);
      const deadline = params.deadline ? BigInt(params.deadline) : getDeadline();

      // Approve both tokens
      await approveToken(token0, FUSIONX_V3_CONTRACTS.NonfungiblePositionManager, amount0);
      await approveToken(token1, FUSIONX_V3_CONTRACTS.NonfungiblePositionManager, amount1);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.NonfungiblePositionManager,
        abi: V3_POSITION_MANAGER_ABI,
        functionName: 'mint',
        args: [{
          token0: token0,
          token1: token1,
          fee: params.fee,
          tickLower: params.tickLower,
          tickUpper: params.tickUpper,
          amount0Desired: amount0,
          amount1Desired: amount1,
          amount0Min: amount0Min,
          amount1Min: amount1Min,
          recipient: params.recipient || address,
          deadline: deadline
        }],
        chainId: MANTLE_CHAIN_ID as any,
      });

      const receipt = await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully created V3 liquidity position`,
        txHash,
        data: { receipt }
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
   * Increase liquidity in existing V3 position
   */
  const v3IncreaseLiquidity = async (
    params: V3IncreaseLiquidityParams
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      // Get position info to get token addresses
      const position = await getV3Position(params.tokenId);
      if (!position) {
        throw new Error("Position not found");
      }

      const decimals0 = await getTokenDecimals(position.token0);
      const decimals1 = await getTokenDecimals(position.token1);

      const amount0Desired = parseUnits(params.amount0Desired, decimals0);
      const amount1Desired = parseUnits(params.amount1Desired, decimals1);
      const amount0Min = params.amount0Min
        ? parseUnits(params.amount0Min, decimals0)
        : BigInt(0);
      const amount1Min = params.amount1Min
        ? parseUnits(params.amount1Min, decimals1)
        : BigInt(0);
      const deadline = params.deadline ? BigInt(params.deadline) : getDeadline();

      await approveToken(position.token0, FUSIONX_V3_CONTRACTS.NonfungiblePositionManager, amount0Desired);
      await approveToken(position.token1, FUSIONX_V3_CONTRACTS.NonfungiblePositionManager, amount1Desired);

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.NonfungiblePositionManager,
        abi: V3_POSITION_MANAGER_ABI,
        functionName: 'increaseLiquidity',
        args: [{
          tokenId: params.tokenId,
          amount0Desired: amount0Desired,
          amount1Desired: amount1Desired,
          amount0Min: amount0Min,
          amount1Min: amount1Min,
          deadline: deadline
        }],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully increased liquidity`,
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
   * Decrease liquidity in V3 position
   */
  const v3DecreaseLiquidity = async (
    params: V3DecreaseLiquidityParams
  ): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const position = await getV3Position(params.tokenId);
      if (!position) {
        throw new Error("Position not found");
      }

      const decimals0 = await getTokenDecimals(position.token0);
      const decimals1 = await getTokenDecimals(position.token1);

      const amount0Min = params.amount0Min
        ? parseUnits(params.amount0Min, decimals0)
        : BigInt(0);
      const amount1Min = params.amount1Min
        ? parseUnits(params.amount1Min, decimals1)
        : BigInt(0);
      const deadline = params.deadline ? BigInt(params.deadline) : getDeadline();

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.NonfungiblePositionManager,
        abi: V3_POSITION_MANAGER_ABI,
        functionName: 'decreaseLiquidity',
        args: [{
          tokenId: params.tokenId,
          liquidity: params.liquidity,
          amount0Min: amount0Min,
          amount1Min: amount1Min,
          deadline: deadline
        }],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully decreased liquidity`,
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
   * Collect fees from V3 position
   */
  const v3CollectFees = async (params: V3CollectFeesParams): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.NonfungiblePositionManager,
        abi: V3_POSITION_MANAGER_ABI,
        functionName: 'collect',
        args: [{
          tokenId: params.tokenId,
          recipient: params.recipient || address,
          amount0Max: params.amount0Max || BigInt("340282366920938463463374607431768211455"), // uint128 max
          amount1Max: params.amount1Max || BigInt("340282366920938463463374607431768211455")
        }],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully collected fees`,
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
   * Burn V3 position NFT (must have 0 liquidity and collected all fees)
   */
  const v3BurnPosition = async (tokenId: bigint): Promise<FusionXHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      await ensureMantleNetwork();

      const txHash = await writeContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.NonfungiblePositionManager,
        abi: V3_POSITION_MANAGER_ABI,
        functionName: 'burn',
        args: [tokenId],
        chainId: MANTLE_CHAIN_ID as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: MANTLE_CHAIN_ID as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully burned position NFT`,
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
  // READ FUNCTIONS
  // ====================================

  /**
   * Get quote for V2 swap
   */
  const getV2Quote = async (
    amountIn: string,
    path: Address[]
  ): Promise<QuoteResult | null> => {
    try {
      const tokenInDecimals = await getTokenDecimals(path[0]);
      const tokenOutDecimals = await getTokenDecimals(path[path.length - 1]);

      const amountInWei = parseUnits(amountIn, tokenInDecimals);

      const amounts = await readContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Router,
        abi: V2_ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [amountInWei, path],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint[];

      const amountOut = formatUnits(amounts[amounts.length - 1], tokenOutDecimals);

      // Calculate price impact (simplified)
      const priceImpact = "< 0.1%"; // Would need reserves to calculate properly

      return {
        amountOut,
        priceImpact,
        path
      };
    } catch (err) {
      console.error("Error getting V2 quote:", err);
      return null;
    }
  };

  /**
   * Get V2 pair info
   */
  const getV2PairInfo = async (
    tokenA: Address,
    tokenB: Address
  ): Promise<PairInfo | null> => {
    try {
      const pairAddress = await readContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Factory,
        abi: V2_FACTORY_ABI,
        functionName: 'getPair',
        args: [tokenA, tokenB],
        chainId: MANTLE_CHAIN_ID as any,
      }) as Address;

      if (pairAddress === "0x0000000000000000000000000000000000000000") {
        return null;
      }

      const [reserves, token0, token1, totalSupply] = await Promise.all([
        readContract(wagmiConfig as any, {
          address: pairAddress,
          abi: V2_PAIR_ABI,
          functionName: 'getReserves',
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: pairAddress,
          abi: V2_PAIR_ABI,
          functionName: 'token0',
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: pairAddress,
          abi: V2_PAIR_ABI,
          functionName: 'token1',
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: pairAddress,
          abi: V2_PAIR_ABI,
          functionName: 'totalSupply',
          chainId: MANTLE_CHAIN_ID as any,
        })
      ]);

      const reserveData = reserves as [bigint, bigint, number];
      const decimals0 = await getTokenDecimals(token0 as Address);
      const decimals1 = await getTokenDecimals(token1 as Address);
      const token0Symbol = await getTokenSymbol(token0 as Address);
      const token1Symbol = await getTokenSymbol(token1 as Address);

      return {
        pairAddress,
        token0: token0 as Address,
        token1: token1 as Address,
        token0Symbol,
        token1Symbol,
        reserve0: formatUnits(reserveData[0], decimals0),
        reserve1: formatUnits(reserveData[1], decimals1),
        reserve0Raw: reserveData[0],
        reserve1Raw: reserveData[1],
        totalSupply: formatEther(totalSupply as bigint)
      };
    } catch (err) {
      console.error("Error getting V2 pair info:", err);
      return null;
    }
  };

  /**
   * Get user's LP token balance for V2 pair with detailed position info
   */
  const getV2LPBalance = async (
    tokenA: Address,
    tokenB: Address,
    userAddress?: Address
  ): Promise<{
    balance: string;
    sharePercent: string;
    token0Amount: string;
    token1Amount: string;
    token0Symbol: string;
    token1Symbol: string;
    pairAddress: Address;
  } | null> => {
    try {
      const targetAddress = userAddress || address;
      if (!targetAddress) return null;

      const pairAddress = await readContract(wagmiConfig as any, {
        address: FUSIONX_V2_CONTRACTS.Factory,
        abi: V2_FACTORY_ABI,
        functionName: 'getPair',
        args: [tokenA, tokenB],
        chainId: MANTLE_CHAIN_ID as any,
      }) as Address;

      if (pairAddress === "0x0000000000000000000000000000000000000000") {
        return null;
      }

      // Get user's LP token balance
      const userBalance = await readContract(wagmiConfig as any, {
        address: pairAddress,
        abi: V2_PAIR_ABI,
        functionName: 'balanceOf',
        args: [targetAddress],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      // Get token0 and token1 addresses from the pair
      const token0 = await readContract(wagmiConfig as any, {
        address: pairAddress,
        abi: V2_PAIR_ABI,
        functionName: 'token0',
        chainId: MANTLE_CHAIN_ID as any,
      }) as Address;

      const token1 = await readContract(wagmiConfig as any, {
        address: pairAddress,
        abi: V2_PAIR_ABI,
        functionName: 'token1',
        chainId: MANTLE_CHAIN_ID as any,
      }) as Address;

      // Get token symbols
      const token0Symbol = await getTokenSymbol(token0);
      const token1Symbol = await getTokenSymbol(token1);

      if (userBalance === BigInt(0)) {
        return {
          balance: "0",
          sharePercent: "0",
          token0Amount: "0",
          token1Amount: "0",
          token0Symbol,
          token1Symbol,
          pairAddress
        };
      }

      // Get total supply of LP tokens
      const totalSupply = await readContract(wagmiConfig as any, {
        address: pairAddress,
        abi: V2_PAIR_ABI,
        functionName: 'totalSupply',
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      // Get reserves
      const reserves = await readContract(wagmiConfig as any, {
        address: pairAddress,
        abi: V2_PAIR_ABI,
        functionName: 'getReserves',
        chainId: MANTLE_CHAIN_ID as any,
      }) as [bigint, bigint, number];

      // Calculate user's share percentage
      const sharePercent = totalSupply > BigInt(0)
        ? (Number(userBalance) / Number(totalSupply) * 100).toFixed(4)
        : "0";

      // Calculate user's share of each token
      const token0Amount = totalSupply > BigInt(0)
        ? formatEther((userBalance * reserves[0]) / totalSupply)
        : "0";
      const token1Amount = totalSupply > BigInt(0)
        ? formatEther((userBalance * reserves[1]) / totalSupply)
        : "0";

      return {
        balance: formatEther(userBalance),
        sharePercent,
        token0Amount,
        token1Amount,
        token0Symbol,
        token1Symbol,
        pairAddress
      };
    } catch (err) {
      console.error("Error getting LP balance:", err);
      return null;
    }
  };

  /**
   * Get user's LP history (mints & burns) from Subgraph API
   * This fetches the history of all liquidity additions and removals
   */
  const getUserLPHistory = async (
    userAddress?: string,
    pairAddress?: string
  ): Promise<LPHistoryResponse | null> => {
    try {
      const targetAddress = (userAddress || address)?.toLowerCase();
      if (!targetAddress) return null;

      // Build filter for pair if provided
      const pairFilter = pairAddress ? `, pair: "${pairAddress.toLowerCase()}"` : "";

      const query = `{
        mints(
          first: 100,
          where: { to: "${targetAddress}"${pairFilter} },
          orderBy: timestamp,
          orderDirection: desc
        ) {
          id
          transaction {
            id
            timestamp
          }
          pair {
            id
            token0 { id symbol name }
            token1 { id symbol name }
          }
          to
          liquidity
          amount0
          amount1
          amountUSD
        }
        burns(
          first: 100,
          where: { sender: "${targetAddress}"${pairFilter} },
          orderBy: timestamp,
          orderDirection: desc
        ) {
          id
          transaction {
            id
            timestamp
          }
          pair {
            id
            token0 { id symbol name }
            token1 { id symbol name }
          }
          sender
          liquidity
          amount0
          amount1
          amountUSD
        }
      }`;

      const response = await fetch(FUSIONX_SUBGRAPH.V2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error("❌ [LP History] Subgraph errors:", result.errors);
        return null;
      }

      const lpHistory: LPHistoryResponse = {
        mints: result.data?.mints || [],
        burns: result.data?.burns || [],
      };

      console.log("📜 [LP History] Raw Response:", result.data);
      console.log("🟢 [LP History] Mints:", lpHistory.mints.length, "records", lpHistory.mints);
      console.log("🔴 [LP History] Burns:", lpHistory.burns.length, "records", lpHistory.burns);

      return lpHistory;
    } catch (err) {
      console.error("Error fetching LP history:", err);
      return null;
    }
  };

  /**
   * Get V3 pool info
   */
  const getV3PoolInfo = async (
    tokenA: Address,
    tokenB: Address,
    fee: number
  ): Promise<V3PoolInfo | null> => {
    try {
      const poolAddress = await readContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.Factory,
        abi: V3_FACTORY_ABI,
        functionName: 'getPool',
        args: [tokenA, tokenB, fee],
        chainId: MANTLE_CHAIN_ID as any,
      }) as Address;

      if (poolAddress === "0x0000000000000000000000000000000000000000") {
        return null;
      }

      const [slot0, liquidity, token0, token1, poolFee, tickSpacing] = await Promise.all([
        readContract(wagmiConfig as any, {
          address: poolAddress,
          abi: V3_POOL_ABI,
          functionName: 'slot0',
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: poolAddress,
          abi: V3_POOL_ABI,
          functionName: 'liquidity',
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: poolAddress,
          abi: V3_POOL_ABI,
          functionName: 'token0',
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: poolAddress,
          abi: V3_POOL_ABI,
          functionName: 'token1',
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: poolAddress,
          abi: V3_POOL_ABI,
          functionName: 'fee',
          chainId: MANTLE_CHAIN_ID as any,
        }),
        readContract(wagmiConfig as any, {
          address: poolAddress,
          abi: V3_POOL_ABI,
          functionName: 'tickSpacing',
          chainId: MANTLE_CHAIN_ID as any,
        })
      ]);

      const slotData = slot0 as [bigint, number, number, number, number, number, boolean];

      return {
        poolAddress,
        token0: token0 as Address,
        token1: token1 as Address,
        fee: poolFee as number,
        tickSpacing: tickSpacing as number,
        sqrtPriceX96: slotData[0],
        tick: slotData[1],
        liquidity: liquidity as bigint
      };
    } catch (err) {
      console.error("Error getting V3 pool info:", err);
      return null;
    }
  };

  /**
   * Get V3 position info
   */
  const getV3Position = async (tokenId: bigint): Promise<V3PositionInfo | null> => {
    try {
      const position = await readContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.NonfungiblePositionManager,
        abi: V3_POSITION_MANAGER_ABI,
        functionName: 'positions',
        args: [tokenId],
        chainId: MANTLE_CHAIN_ID as any,
      }) as [bigint, Address, Address, Address, number, number, number, bigint, bigint, bigint, bigint, bigint];

      return {
        tokenId,
        token0: position[2],
        token1: position[3],
        fee: position[4],
        tickLower: position[5],
        tickUpper: position[6],
        liquidity: position[7],
        tokensOwed0: position[10],
        tokensOwed1: position[11]
      };
    } catch (err) {
      console.error("Error getting V3 position:", err);
      return null;
    }
  };

  /**
   * Get all V3 positions for user
   */
  const getUserV3Positions = async (userAddress?: Address): Promise<V3PositionInfo[]> => {
    try {
      const targetAddress = userAddress || address;
      if (!targetAddress) return [];

      const balance = await readContract(wagmiConfig as any, {
        address: FUSIONX_V3_CONTRACTS.NonfungiblePositionManager,
        abi: V3_POSITION_MANAGER_ABI,
        functionName: 'balanceOf',
        args: [targetAddress],
        chainId: MANTLE_CHAIN_ID as any,
      }) as bigint;

      const positions: V3PositionInfo[] = [];

      for (let i = BigInt(0); i < balance; i++) {
        const tokenId = await readContract(wagmiConfig as any, {
          address: FUSIONX_V3_CONTRACTS.NonfungiblePositionManager,
          abi: V3_POSITION_MANAGER_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [targetAddress, i],
          chainId: MANTLE_CHAIN_ID as any,
        }) as bigint;

        const position = await getV3Position(tokenId);
        if (position) {
          positions.push(position);
        }
      }

      return positions;
    } catch (err) {
      console.error("Error getting user V3 positions:", err);
      return [];
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
   * Calculate tick from price (simplified)
   */
  const priceToTick = (price: number): number => {
    return Math.floor(Math.log(price) / Math.log(1.0001));
  };

  /**
   * Calculate price from tick (simplified)
   */
  const tickToPrice = (tick: number): number => {
    return Math.pow(1.0001, tick);
  };

  /**
   * Get nearest usable tick
   */
  const getNearestUsableTick = (tick: number, tickSpacing: number): number => {
    return Math.round(tick / tickSpacing) * tickSpacing;
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

    // V2 Swap Functions
    swapExactTokensForTokens,
    swapTokensForExactTokens,
    swapExactMNTForTokens,
    swapExactTokensForMNT,

    // V2 Liquidity Functions
    addLiquidity,
    addLiquidityMNT,
    removeLiquidity,
    removeLiquidityMNT,

    // V3 Swap Functions
    v3SwapExactInputSingle,
    v3SwapExactInput,
    v3SwapExactOutputSingle,

    // V3 Liquidity Functions
    v3MintPosition,
    v3IncreaseLiquidity,
    v3DecreaseLiquidity,
    v3CollectFees,
    v3BurnPosition,

    // Read Functions
    getV2Quote,
    getV2PairInfo,
    getV2LPBalance,
    getUserLPHistory,
    getV3PoolInfo,
    getV3Position,
    getUserV3Positions,

    // Utility Functions
    getExplorerUrl,
    priceToTick,
    tickToPrice,
    getNearestUsableTick,
    encodeV3Path,
    getTokenDecimals,
    getTokenSymbol,

    // Constants
    FUSIONX_CONFIG,
    FUSIONX_V2_CONTRACTS,
    FUSIONX_V3_CONTRACTS,
    FUSIONX_TOKENS,
    FEE_TIERS
  };
};

export default useFusionXHook;
