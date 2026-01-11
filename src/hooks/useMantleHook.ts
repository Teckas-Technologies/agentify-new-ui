import { useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useTokenBalanceRefresh } from "@/contexts/TokenBalanceRefreshContext";
import { switchChain, readContract, writeContract, getBalance, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from "@/contexts/CustomWagmiProvider";
import {
  parseUnits,
  formatUnits,
  parseEther,
  formatEther,
  encodeFunctionData,
  type Hex,
  type Address,
  maxUint256,
  erc20Abi
} from 'viem';

// ====================================
// MANTLE NETWORK CONFIGURATION
// ====================================

/**
 * Mantle Network Chain Configuration
 *
 * Mantle is a ZK-validity proof rollup built on Ethereum
 * Key features:
 * - EVM compatible (with some opcode differences)
 * - Uses EigenDA for data availability
 * - Native token is MNT (used for gas fees)
 * - 7-day challenge period on mainnet, ~40 minutes on testnet
 */
export const MANTLE_CONFIG = {
  mainnet: {
    chainId: 5000,
    chainIdHex: "0x1388",
    name: "Mantle",
    rpcUrl: "https://rpc.mantle.xyz",
    wsUrl: "wss://wss.mantle.xyz",
    explorerUrl: "https://mantlescan.xyz",
    bridgeUrl: "https://app.mantle.xyz/bridge",
    nativeCurrency: {
      name: "MNT",
      symbol: "MNT",
      decimals: 18
    }
  },
  testnet: {
    chainId: 5003,
    chainIdHex: "0x138B",
    name: "Mantle Sepolia",
    rpcUrl: "https://rpc.sepolia.mantle.xyz",
    wsUrl: null,
    explorerUrl: "https://sepolia.mantlescan.xyz",
    bridgeUrl: "https://app.mantle.xyz/bridge?network=sepolia",
    nativeCurrency: {
      name: "MNT",
      symbol: "MNT",
      decimals: 18
    }
  }
} as const;

// L1 (Ethereum) Contract Addresses
export const L1_CONTRACTS = {
  mainnet: {
    L1CrossDomainMessenger: "0x676A795fe6E43C17c668de16730c3F690FEB7120" as Address,
    L1StandardBridge: "0x95fC37A27a2f68e3A647CDc081F0A89bb47c3012" as Address,
    L1ERC721Bridge: "0xCAF8938b6C4A27a96AaAfbb7228Fd613D40EA70a" as Address,
    L2OutputOracle: "0x31d543e7BE1dA6eFDc2206Ef7822879045B9f481" as Address,
    OptimismPortal: "0xc54cb22944F2bE476E02dECfCD7e3E7d3e15A8Fb" as Address,
    OptimismMintableERC20Factory: "0x3b96c878cc334a7d9EA994Ec4B6C28BdDde00Eb2" as Address,
    SystemConfig: "0x427Ea0710FA5252057F0D88274f7aeb308386cAf" as Address,
    AddressManager: "0x6968f3F16C3e64003F02E121cf0D5CCBf5625a42" as Address,
    // MNT Token on Ethereum L1 (checksummed address)
    MNTToken: "0x3c3a81e81dc49A522A592e7622A7E711c06bf354" as Address,
  },
  testnet: {
    // Sepolia testnet addresses
    L1CrossDomainMessenger: "0x7Ad11bB9216BC9Dc4CBd488D7618CbFD433d1E75" as Address,
    L1StandardBridge: "0x636Af16bf2f682dD3109e60102b8E1A089FedAa8" as Address,
    L1ERC721Bridge: "0x8A9424745056Eb399FD19a0EC26A14316684e274" as Address,
    L2OutputOracle: "0x2F80Fef2D6E8EF68DCCc10a2a8B42Db5C9cB13c6" as Address,
    OptimismPortal: "0x5c48354e9FC7c53f9D6A0fD5969E6E4d8e35b3A1" as Address,
    OptimismMintableERC20Factory: "0x70A8c6E0d0C3F2E4b9C4e8a7C3b4A9D5E1F2B6c7" as Address,
    SystemConfig: "0x8B4e8C1A2B3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F" as Address,
    AddressManager: "0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B" as Address,
    MNTToken: "0x65e37B558F64E2Be5768DB46DF22F93d85741A9E" as Address,
  }
} as const;

// L2 (Mantle) Contract Addresses
export const L2_CONTRACTS = {
  mainnet: {
    L2CrossDomainMessenger: "0x4200000000000000000000000000000000000007" as Address,
    L2StandardBridge: "0x4200000000000000000000000000000000000010" as Address,
    L2ERC721Bridge: "0x4200000000000000000000000000000000000014" as Address,
    L2ToL1MessagePasser: "0x4200000000000000000000000000000000000016" as Address,
    GasPriceOracle: "0x420000000000000000000000000000000000000F" as Address,
    L1Block: "0x4200000000000000000000000000000000000015" as Address,
    SequencerFeeVault: "0x4200000000000000000000000000000000000011" as Address,
    BaseFeeVault: "0x4200000000000000000000000000000000000019" as Address,
    L1BlockNumber: "0x4200000000000000000000000000000000000013" as Address,
    OptimismMintableERC20Factory: "0x4200000000000000000000000000000000000012" as Address,
    // Wrapped MNT on Mantle L2
    WMNT: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8" as Address,
    // ETH representation on Mantle L2
    WETH: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111" as Address,
  },
  testnet: {
    L2CrossDomainMessenger: "0x4200000000000000000000000000000000000007" as Address,
    L2StandardBridge: "0x4200000000000000000000000000000000000010" as Address,
    L2ERC721Bridge: "0x4200000000000000000000000000000000000014" as Address,
    L2ToL1MessagePasser: "0x4200000000000000000000000000000000000016" as Address,
    GasPriceOracle: "0x420000000000000000000000000000000000000F" as Address,
    L1Block: "0x4200000000000000000000000000000000000015" as Address,
    SequencerFeeVault: "0x4200000000000000000000000000000000000011" as Address,
    BaseFeeVault: "0x4200000000000000000000000000000000000019" as Address,
    L1BlockNumber: "0x4200000000000000000000000000000000000013" as Address,
    OptimismMintableERC20Factory: "0x4200000000000000000000000000000000000012" as Address,
    // Wrapped MNT on Mantle L2 testnet
    WMNT: "0x19f5557E23e9914A18239990f6C70D68FDF0deD5" as Address,
    // ETH representation on Mantle L2 testnet
    WETH: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111" as Address,
  }
} as const;

// Chain IDs
export const CHAIN_IDS = {
  ethereum: 1,
  sepolia: 11155111,
  mantle: 5000,
  mantleSepolia: 5003
} as const;

// Common Token Addresses on Mantle
export const MANTLE_TOKENS = {
  mainnet: {
    MNT: "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000" as Address, // Native MNT
    WMNT: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8" as Address,
    WETH: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111" as Address,
    USDC: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9" as Address,
    USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE" as Address,
    METH: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0" as Address, // mETH staking token
  },
  testnet: {
    MNT: "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000" as Address,
    WMNT: "0x19f5557E23e9914A18239990f6C70D68FDF0deD5" as Address,
  }
} as const;

// Third-Party RPC Providers for better reliability
export const RPC_PROVIDERS = {
  mainnet: {
    official: "https://rpc.mantle.xyz",
    drpc: "https://mantle.drpc.org",
    allnodes: "https://mantle-rpc.publicnode.com/",
    oneRpc: "https://1rpc.io/mantle",
    quicknode: "https://rpc.mantle.quicknode.com",
  },
  testnet: {
    official: "https://rpc.sepolia.mantle.xyz",
    ankr: "https://rpc.ankr.com/mantle_sepolia",
    drpc: "https://mantle-sepolia.drpc.org",
  }
} as const;

// ====================================
// CONTRACT ABIs
// ====================================

// L1 Standard Bridge ABI (deposit functions)
const L1_STANDARD_BRIDGE_ABI = [
  {
    inputs: [
      { name: "_l2Token", type: "address" },
      { name: "_amount", type: "uint256" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "depositERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "_l1Token", type: "address" },
      { name: "_l2Token", type: "address" },
      { name: "_amount", type: "uint256" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "depositERC20To",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "depositETH",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "_to", type: "address" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "depositETHTo",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "_amount", type: "uint256" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "depositMNT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "_to", type: "address" },
      { name: "_amount", type: "uint256" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "depositMNTTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// L2 Standard Bridge ABI (withdrawal functions)
const L2_STANDARD_BRIDGE_ABI = [
  {
    inputs: [
      { name: "_l2Token", type: "address" },
      { name: "_amount", type: "uint256" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "_l2Token", type: "address" },
      { name: "_to", type: "address" },
      { name: "_amount", type: "uint256" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "withdrawTo",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "_amount", type: "uint256" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "withdrawMNT",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "_to", type: "address" },
      { name: "_amount", type: "uint256" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "withdrawMNTTo",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
] as const;

// L1 ERC721 Bridge ABI
const L1_ERC721_BRIDGE_ABI = [
  {
    inputs: [
      { name: "_localToken", type: "address" },
      { name: "_remoteToken", type: "address" },
      { name: "_tokenId", type: "uint256" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "bridgeERC721",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "_localToken", type: "address" },
      { name: "_remoteToken", type: "address" },
      { name: "_to", type: "address" },
      { name: "_tokenId", type: "uint256" },
      { name: "_minGasLimit", type: "uint32" },
      { name: "_extraData", type: "bytes" }
    ],
    name: "bridgeERC721To",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// Gas Price Oracle ABI
const GAS_PRICE_ORACLE_ABI = [
  {
    inputs: [],
    name: "gasPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "l1BaseFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "overhead",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "scalar",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "tokenRatio",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_data", type: "bytes" }],
    name: "getL1Fee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_data", type: "bytes" }],
    name: "getL1GasUsed",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// L1 Block ABI (for accessing L1 state)
const L1_BLOCK_ABI = [
  {
    inputs: [],
    name: "number",
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "timestamp",
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "basefee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "hash",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "sequenceNumber",
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "batcherHash",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Cross Domain Messenger ABI
const CROSS_DOMAIN_MESSENGER_ABI = [
  {
    inputs: [
      { name: "_target", type: "address" },
      { name: "_message", type: "bytes" },
      { name: "_minGasLimit", type: "uint32" }
    ],
    name: "sendMessage",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "_nonce", type: "uint256" }],
    name: "successfulMessages",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "messageNonce",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// ERC721 ABI for approvals
const ERC721_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" }
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" }
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// ====================================
// TYPES & INTERFACES
// ====================================

export interface MantleHookResponse {
  success: boolean;
  message: string;
  txHash?: string;
  data?: any;
  error?: string;
}

export interface DepositMNTParams {
  amount: string; // Amount in MNT (will be converted to wei)
  recipient?: Address; // Optional: deposit to a different address
  minGasLimit?: number; // Optional: minimum gas limit for L2 execution
}

export interface DepositETHParams {
  amount: string; // Amount in ETH (will be converted to wei)
  recipient?: Address;
  minGasLimit?: number;
}

export interface DepositERC20Params {
  l1TokenAddress: Address; // L1 token address
  l2TokenAddress: Address; // L2 token address
  amount: string; // Amount (will use token's decimals)
  recipient?: Address;
  minGasLimit?: number;
}

export interface WithdrawMNTParams {
  amount: string; // Amount in MNT
  recipient?: Address;
  minGasLimit?: number;
}

export interface WithdrawETHParams {
  amount: string; // Amount in ETH
  recipient?: Address;
  minGasLimit?: number;
}

export interface WithdrawERC20Params {
  l2TokenAddress: Address;
  amount: string;
  recipient?: Address;
  minGasLimit?: number;
}

export interface BridgeERC721Params {
  l1TokenAddress: Address;
  l2TokenAddress: Address;
  tokenId: string;
  recipient?: Address;
  minGasLimit?: number;
  direction: 'deposit' | 'withdraw';
}

export interface SendCrossChainMessageParams {
  targetContract: Address;
  message: Hex;
  minGasLimit?: number;
  fromL1?: boolean; // true = L1->L2, false = L2->L1
}

export interface GasPriceInfo {
  l2GasPrice: string;
  l1BaseFee: string;
  overhead: string;
  scalar: string;
  tokenRatio: string;
}

export interface L1BlockInfo {
  number: bigint;
  timestamp: bigint;
  basefee: bigint;
  hash: Hex;
  sequenceNumber: bigint;
}

export interface TokenBalanceInfo {
  balance: string;
  balanceRaw: bigint;
  symbol: string;
  decimals: number;
}

export interface NetworkStatus {
  isConnected: boolean;
  currentChainId: number | undefined;
  isOnMantle: boolean;
  isOnEthereum: boolean;
  network: 'mainnet' | 'testnet' | 'unknown';
}

// ====================================
// MAIN HOOK
// ====================================

export const useMantleHook = () => {
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { wallets } = useWallets();
  const { user } = usePrivy();
  const { triggerRefresh } = useTokenBalanceRefresh();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ====================================
  // HELPER FUNCTIONS
  // ====================================

  /**
   * Get current network configuration based on chain ID
   */
  const getNetworkConfig = useCallback(() => {
    if (!chain?.id) return null;

    if (chain.id === CHAIN_IDS.mantle || chain.id === CHAIN_IDS.ethereum) {
      return {
        network: 'mainnet' as const,
        l1ChainId: CHAIN_IDS.ethereum,
        l2ChainId: CHAIN_IDS.mantle,
        l1Contracts: L1_CONTRACTS.mainnet,
        l2Contracts: L2_CONTRACTS.mainnet,
        config: MANTLE_CONFIG.mainnet
      };
    }

    if (chain.id === CHAIN_IDS.mantleSepolia || chain.id === CHAIN_IDS.sepolia) {
      return {
        network: 'testnet' as const,
        l1ChainId: CHAIN_IDS.sepolia,
        l2ChainId: CHAIN_IDS.mantleSepolia,
        l1Contracts: L1_CONTRACTS.testnet,
        l2Contracts: L2_CONTRACTS.testnet,
        config: MANTLE_CONFIG.testnet
      };
    }

    return null;
  }, [chain?.id]);

  /**
   * Get network status
   */
  const getNetworkStatus = useCallback((): NetworkStatus => {
    const isOnMantle = chain?.id === CHAIN_IDS.mantle || chain?.id === CHAIN_IDS.mantleSepolia;
    const isOnEthereum = chain?.id === CHAIN_IDS.ethereum || chain?.id === CHAIN_IDS.sepolia;

    let network: 'mainnet' | 'testnet' | 'unknown' = 'unknown';
    if (chain?.id === CHAIN_IDS.mantle || chain?.id === CHAIN_IDS.ethereum) {
      network = 'mainnet';
    } else if (chain?.id === CHAIN_IDS.mantleSepolia || chain?.id === CHAIN_IDS.sepolia) {
      network = 'testnet';
    }

    return {
      isConnected,
      currentChainId: chain?.id,
      isOnMantle,
      isOnEthereum,
      network
    };
  }, [chain?.id, isConnected]);

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
      const chainName = targetChainId === CHAIN_IDS.mantle ? "Mantle" :
                       targetChainId === CHAIN_IDS.mantleSepolia ? "Mantle Sepolia" :
                       targetChainId === CHAIN_IDS.ethereum ? "Ethereum" : "Sepolia";
      throw new Error(`Please switch to ${chainName} network`);
    }
  };

  /**
   * Get token balance (native or ERC20)
   */
  const getTokenBalance = async (
    tokenAddress: Address | 'native',
    chainId: number,
    userAddress?: Address
  ): Promise<TokenBalanceInfo> => {
    const targetAddress = userAddress || address;
    if (!targetAddress) {
      throw new Error("No address provided");
    }

    try {
      if (tokenAddress === 'native') {
        const balance = await getBalance(wagmiConfig as any, {
          address: targetAddress,
          chainId: chainId as any,
        });

        return {
          balance: formatEther(balance.value),
          balanceRaw: balance.value,
          symbol: balance.symbol,
          decimals: 18
        };
      }

      // ERC20 token
      const [balance, decimals, symbol] = await Promise.all([
        readContract(wagmiConfig as any, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [targetAddress],
          chainId: chainId as any,
        }),
        readContract(wagmiConfig as any, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'decimals',
          chainId: chainId as any,
        }),
        readContract(wagmiConfig as any, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'symbol',
          chainId: chainId as any,
        })
      ]);

      return {
        balance: formatUnits(balance as bigint, decimals as number),
        balanceRaw: balance as bigint,
        symbol: symbol as string,
        decimals: decimals as number
      };
    } catch (err: any) {
      console.error("Error fetching token balance:", err);
      throw new Error(`Failed to fetch token balance: ${err.message}`);
    }
  };

  /**
   * Approve token spending (ERC20)
   * Uses exact amount approval for better security (not unlimited)
   */
  const approveToken = async (
    tokenAddress: Address,
    spenderAddress: Address,
    amount: bigint,
    chainId: number
  ): Promise<Hex> => {
    try {
      // Check current allowance
      const currentAllowance = await readContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as Address, spenderAddress],
        chainId: chainId as any,
      });

      if ((currentAllowance as bigint) >= amount) {
        console.log("Sufficient allowance already exists");
        return "0x" as Hex; // No approval needed
      }

      // Use exact amount approval for better security (not unlimited/maxUint256)
      const txHash = await writeContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, amount],
        chainId: chainId as any,
      });

      // Wait for confirmation
      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: chainId as any,
      });

      return txHash;
    } catch (err: any) {
      console.error("Approval failed:", err);
      throw new Error(`Token approval failed: ${err.message}`);
    }
  };

  /**
   * Handle user-friendly error messages
   */
  const getErrorMessage = (error: any): string => {
    const errorStr = error?.message || String(error);

    if (errorStr.includes("insufficient") || errorStr.includes("exceeds balance")) {
      return "Insufficient balance for this operation";
    }
    if (errorStr.includes("User rejected") || errorStr.includes("user rejected") || errorStr.includes("User denied")) {
      return "No problem! You cancelled the transaction. Let me know when you're ready to try again.";
    }
    if (errorStr.includes("network") || errorStr.includes("disconnected")) {
      return "Network error. Please check your connection and try again";
    }
    if (errorStr.includes("gas")) {
      return "Gas estimation failed. The transaction may fail or require more gas";
    }
    if (errorStr.includes("nonce")) {
      return "Transaction nonce error. Please try again";
    }
    if (errorStr.includes("timeout")) {
      return "Transaction timed out. Please check the explorer for status";
    }

    return errorStr || "Operation failed. Please try again";
  };

  // ====================================
  // DEPOSIT FUNCTIONS (L1 -> L2)
  // ====================================

  /**
   * Deposit MNT from Ethereum L1 to Mantle L2
   *
   * @param params.amount - Amount of MNT to deposit (in MNT, not wei)
   * @param params.recipient - Optional recipient address on L2
   * @param params.minGasLimit - Minimum gas limit for L2 execution (default: 200000)
   */
  const depositMNT = async (params: DepositMNTParams): Promise<MantleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      const networkConfig = getNetworkConfig();
      if (!networkConfig) {
        // Switch to Ethereum mainnet
        await switchToNetwork(CHAIN_IDS.ethereum);
      }

      const l1ChainId = networkConfig?.l1ChainId || CHAIN_IDS.ethereum;
      const l1Contracts = networkConfig?.l1Contracts || L1_CONTRACTS.mainnet;

      // Switch to L1 if needed
      await switchToNetwork(l1ChainId);

      const amount = parseEther(params.amount);
      const minGasLimit = params.minGasLimit || 200000;

      // Check MNT balance on L1
      const balance = await getTokenBalance(l1Contracts.MNTToken, l1ChainId);
      if (balance.balanceRaw < amount) {
        throw new Error(`Insufficient MNT balance. You have ${balance.balance} MNT but need ${params.amount} MNT`);
      }

      // Approve MNT spending by bridge
      console.log("Approving MNT for bridge...");
      await approveToken(
        l1Contracts.MNTToken,
        l1Contracts.L1StandardBridge,
        amount,
        l1ChainId
      );

      // Execute deposit
      // Note: Always use depositMNTTo because depositMNT has onlyEOA modifier
      // which blocks smart contract wallets (Privy, Safe, etc.)
      let txHash: Hex;
      const recipient = params.recipient || address;

      txHash = await writeContract(wagmiConfig as any, {
        address: l1Contracts.L1StandardBridge,
        abi: L1_STANDARD_BRIDGE_ABI,
        functionName: 'depositMNTTo',
        args: [recipient, amount, minGasLimit, "0x"],
        chainId: l1ChainId as any,
      });

      // Wait for L1 confirmation
      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: l1ChainId as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully initiated deposit of ${params.amount} MNT to Mantle. The funds will arrive on L2 in approximately 10-20 minutes.`,
        txHash: txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Deposit MNT error:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deposit ETH from Ethereum L1 to Mantle L2
   */
  const depositETH = async (params: DepositETHParams): Promise<MantleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      const networkConfig = getNetworkConfig();
      const l1ChainId = networkConfig?.l1ChainId || CHAIN_IDS.ethereum;
      const l1Contracts = networkConfig?.l1Contracts || L1_CONTRACTS.mainnet;

      // Switch to L1 if needed
      await switchToNetwork(l1ChainId);

      const amount = parseEther(params.amount);
      const minGasLimit = params.minGasLimit || 200000;

      // Check ETH balance on L1
      const balance = await getTokenBalance('native', l1ChainId);
      if (balance.balanceRaw < amount) {
        throw new Error(`Insufficient ETH balance. You have ${balance.balance} ETH but need ${params.amount} ETH`);
      }

      // Execute deposit
      // Note: Always use depositETHTo because depositETH has onlyEOA modifier
      // which blocks smart contract wallets (Privy, Safe, etc.)
      let txHash: Hex;
      const recipient = params.recipient || address;

      txHash = await writeContract(wagmiConfig as any, {
        address: l1Contracts.L1StandardBridge,
        abi: L1_STANDARD_BRIDGE_ABI,
        functionName: 'depositETHTo',
        args: [recipient, minGasLimit, "0x"],
        value: amount,
        chainId: l1ChainId as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: l1ChainId as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully initiated deposit of ${params.amount} ETH to Mantle. The funds will arrive on L2 in approximately 10-20 minutes.`,
        txHash: txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Deposit ETH error:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deposit ERC20 tokens from Ethereum L1 to Mantle L2
   */
  const depositERC20 = async (params: DepositERC20Params): Promise<MantleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      const networkConfig = getNetworkConfig();
      const l1ChainId = networkConfig?.l1ChainId || CHAIN_IDS.ethereum;
      const l1Contracts = networkConfig?.l1Contracts || L1_CONTRACTS.mainnet;

      await switchToNetwork(l1ChainId);

      // Get token info
      const tokenInfo = await getTokenBalance(params.l1TokenAddress, l1ChainId);
      const amount = parseUnits(params.amount, tokenInfo.decimals);
      const minGasLimit = params.minGasLimit || 200000;

      // Check balance
      if (tokenInfo.balanceRaw < amount) {
        throw new Error(`Insufficient ${tokenInfo.symbol} balance. You have ${tokenInfo.balance} but need ${params.amount}`);
      }

      // Approve token
      console.log(`Approving ${tokenInfo.symbol} for bridge...`);
      await approveToken(
        params.l1TokenAddress,
        l1Contracts.L1StandardBridge,
        amount,
        l1ChainId
      );

      // Execute deposit
      let txHash: Hex;

      if (params.recipient && params.recipient !== address) {
        txHash = await writeContract(wagmiConfig as any, {
          address: l1Contracts.L1StandardBridge,
          abi: L1_STANDARD_BRIDGE_ABI,
          functionName: 'depositERC20To',
          args: [params.l1TokenAddress, params.l2TokenAddress, amount, minGasLimit, "0x"],
          chainId: l1ChainId as any,
        });
      } else {
        txHash = await writeContract(wagmiConfig as any, {
          address: l1Contracts.L1StandardBridge,
          abi: L1_STANDARD_BRIDGE_ABI,
          functionName: 'depositERC20',
          args: [params.l2TokenAddress, amount, minGasLimit, "0x"],
          chainId: l1ChainId as any,
        });
      }

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: l1ChainId as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully initiated deposit of ${params.amount} ${tokenInfo.symbol} to Mantle. The funds will arrive on L2 in approximately 10-20 minutes.`,
        txHash: txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Deposit ERC20 error:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // WITHDRAW FUNCTIONS (L2 -> L1)
  // ====================================

  /**
   * Withdraw MNT from Mantle L2 to Ethereum L1
   *
   * Note: Withdrawals have a 7-day challenge period on mainnet (~40 minutes on testnet)
   * After initiating, user must wait for the challenge period, then prove and finalize
   */
  const withdrawMNT = async (params: WithdrawMNTParams): Promise<MantleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      const networkConfig = getNetworkConfig();
      const l2ChainId = networkConfig?.l2ChainId || CHAIN_IDS.mantle;
      const l2Contracts = networkConfig?.l2Contracts || L2_CONTRACTS.mainnet;

      await switchToNetwork(l2ChainId);

      const amount = parseEther(params.amount);
      const minGasLimit = params.minGasLimit || 200000;

      // Check MNT balance on L2 (native token)
      const balance = await getTokenBalance('native', l2ChainId);
      if (balance.balanceRaw < amount) {
        throw new Error(`Insufficient MNT balance. You have ${balance.balance} MNT but need ${params.amount} MNT`);
      }

      // Execute withdrawal
      let txHash: Hex;

      if (params.recipient && params.recipient !== address) {
        txHash = await writeContract(wagmiConfig as any, {
          address: l2Contracts.L2StandardBridge,
          abi: L2_STANDARD_BRIDGE_ABI,
          functionName: 'withdrawMNTTo',
          args: [params.recipient, amount, minGasLimit, "0x"],
          chainId: l2ChainId as any,
        });
      } else {
        txHash = await writeContract(wagmiConfig as any, {
          address: l2Contracts.L2StandardBridge,
          abi: L2_STANDARD_BRIDGE_ABI,
          functionName: 'withdrawMNT',
          args: [amount, minGasLimit, "0x"],
          chainId: l2ChainId as any,
        });
      }

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: l2ChainId as any,
      });

      triggerRefresh();

      const challengePeriod = networkConfig?.network === 'testnet' ? '~40 minutes' : '7 days';

      return {
        success: true,
        message: `Successfully initiated withdrawal of ${params.amount} MNT. After the ${challengePeriod} challenge period, you will need to prove and finalize the withdrawal on L1.`,
        txHash: txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Withdraw MNT error:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Withdraw ETH from Mantle L2 to Ethereum L1
   */
  const withdrawETH = async (params: WithdrawETHParams): Promise<MantleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      const networkConfig = getNetworkConfig();
      const l2ChainId = networkConfig?.l2ChainId || CHAIN_IDS.mantle;
      const l2Contracts = networkConfig?.l2Contracts || L2_CONTRACTS.mainnet;

      await switchToNetwork(l2ChainId);

      const amount = parseEther(params.amount);
      const minGasLimit = params.minGasLimit || 200000;

      // On Mantle L2, ETH is an ERC20 token (WETH)
      const wethAddress = l2Contracts.WETH;

      // Check WETH balance
      const balance = await getTokenBalance(wethAddress, l2ChainId);
      if (balance.balanceRaw < amount) {
        throw new Error(`Insufficient WETH balance. You have ${balance.balance} WETH but need ${params.amount}`);
      }

      // Approve WETH for bridge
      await approveToken(wethAddress, l2Contracts.L2StandardBridge, amount, l2ChainId);

      // Execute withdrawal
      let txHash: Hex;

      if (params.recipient && params.recipient !== address) {
        txHash = await writeContract(wagmiConfig as any, {
          address: l2Contracts.L2StandardBridge,
          abi: L2_STANDARD_BRIDGE_ABI,
          functionName: 'withdrawTo',
          args: [wethAddress, params.recipient, amount, minGasLimit, "0x"],
          chainId: l2ChainId as any,
        });
      } else {
        txHash = await writeContract(wagmiConfig as any, {
          address: l2Contracts.L2StandardBridge,
          abi: L2_STANDARD_BRIDGE_ABI,
          functionName: 'withdraw',
          args: [wethAddress, amount, minGasLimit, "0x"],
          chainId: l2ChainId as any,
        });
      }

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: l2ChainId as any,
      });

      triggerRefresh();

      const challengePeriod = networkConfig?.network === 'testnet' ? '~40 minutes' : '7 days';

      return {
        success: true,
        message: `Successfully initiated withdrawal of ${params.amount} ETH. After the ${challengePeriod} challenge period, you will need to prove and finalize the withdrawal on L1.`,
        txHash: txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Withdraw ETH error:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Withdraw ERC20 tokens from Mantle L2 to Ethereum L1
   */
  const withdrawERC20 = async (params: WithdrawERC20Params): Promise<MantleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      const networkConfig = getNetworkConfig();
      const l2ChainId = networkConfig?.l2ChainId || CHAIN_IDS.mantle;
      const l2Contracts = networkConfig?.l2Contracts || L2_CONTRACTS.mainnet;

      await switchToNetwork(l2ChainId);

      // Get token info
      const tokenInfo = await getTokenBalance(params.l2TokenAddress, l2ChainId);
      const amount = parseUnits(params.amount, tokenInfo.decimals);
      const minGasLimit = params.minGasLimit || 200000;

      // Check balance
      if (tokenInfo.balanceRaw < amount) {
        throw new Error(`Insufficient ${tokenInfo.symbol} balance. You have ${tokenInfo.balance} but need ${params.amount}`);
      }

      // Approve token
      await approveToken(params.l2TokenAddress, l2Contracts.L2StandardBridge, amount, l2ChainId);

      // Execute withdrawal
      let txHash: Hex;

      if (params.recipient && params.recipient !== address) {
        txHash = await writeContract(wagmiConfig as any, {
          address: l2Contracts.L2StandardBridge,
          abi: L2_STANDARD_BRIDGE_ABI,
          functionName: 'withdrawTo',
          args: [params.l2TokenAddress, params.recipient, amount, minGasLimit, "0x"],
          chainId: l2ChainId as any,
        });
      } else {
        txHash = await writeContract(wagmiConfig as any, {
          address: l2Contracts.L2StandardBridge,
          abi: L2_STANDARD_BRIDGE_ABI,
          functionName: 'withdraw',
          args: [params.l2TokenAddress, amount, minGasLimit, "0x"],
          chainId: l2ChainId as any,
        });
      }

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: l2ChainId as any,
      });

      triggerRefresh();

      const challengePeriod = networkConfig?.network === 'testnet' ? '~40 minutes' : '7 days';

      return {
        success: true,
        message: `Successfully initiated withdrawal of ${params.amount} ${tokenInfo.symbol}. After the ${challengePeriod} challenge period, you will need to prove and finalize the withdrawal on L1.`,
        txHash: txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Withdraw ERC20 error:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // NFT BRIDGING (ERC-721)
  // ====================================

  /**
   * Bridge ERC-721 NFT between L1 and L2
   */
  const bridgeERC721 = async (params: BridgeERC721Params): Promise<MantleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      const networkConfig = getNetworkConfig();
      const isDeposit = params.direction === 'deposit';

      const chainId = isDeposit
        ? (networkConfig?.l1ChainId || CHAIN_IDS.ethereum)
        : (networkConfig?.l2ChainId || CHAIN_IDS.mantle);

      const bridgeAddress = isDeposit
        ? (networkConfig?.l1Contracts.L1ERC721Bridge || L1_CONTRACTS.mainnet.L1ERC721Bridge)
        : L2_CONTRACTS.mainnet.L2ERC721Bridge;

      const tokenAddress = isDeposit ? params.l1TokenAddress : params.l2TokenAddress;
      const remoteTokenAddress = isDeposit ? params.l2TokenAddress : params.l1TokenAddress;

      await switchToNetwork(chainId);

      const tokenId = BigInt(params.tokenId);
      const minGasLimit = params.minGasLimit || 200000;

      // Check ownership
      const owner = await readContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: ERC721_ABI,
        functionName: 'ownerOf',
        args: [tokenId],
        chainId: chainId as any,
      });

      if ((owner as Address).toLowerCase() !== address.toLowerCase()) {
        throw new Error(`You don't own NFT #${params.tokenId}`);
      }

      // Approve NFT for bridge
      const approvedAddress = await readContract(wagmiConfig as any, {
        address: tokenAddress,
        abi: ERC721_ABI,
        functionName: 'getApproved',
        args: [tokenId],
        chainId: chainId as any,
      });

      if ((approvedAddress as Address).toLowerCase() !== bridgeAddress.toLowerCase()) {
        console.log("Approving NFT for bridge...");
        const approveTx = await writeContract(wagmiConfig as any, {
          address: tokenAddress,
          abi: ERC721_ABI,
          functionName: 'approve',
          args: [bridgeAddress, tokenId],
          chainId: chainId as any,
        });

        await waitForTransactionReceipt(wagmiConfig as any, {
          hash: approveTx,
          chainId: chainId as any,
        });
      }

      // Execute bridge
      let txHash: Hex;

      if (params.recipient && params.recipient !== address) {
        txHash = await writeContract(wagmiConfig as any, {
          address: bridgeAddress,
          abi: L1_ERC721_BRIDGE_ABI,
          functionName: 'bridgeERC721To',
          args: [tokenAddress, remoteTokenAddress, params.recipient, tokenId, minGasLimit, "0x"],
          chainId: chainId as any,
        });
      } else {
        txHash = await writeContract(wagmiConfig as any, {
          address: bridgeAddress,
          abi: L1_ERC721_BRIDGE_ABI,
          functionName: 'bridgeERC721',
          args: [tokenAddress, remoteTokenAddress, tokenId, minGasLimit, "0x"],
          chainId: chainId as any,
        });
      }

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: chainId as any,
      });

      triggerRefresh();

      const direction = isDeposit ? 'Ethereum to Mantle' : 'Mantle to Ethereum';
      const timeEstimate = isDeposit
        ? '10-20 minutes'
        : (networkConfig?.network === 'testnet' ? '~40 minutes' : '7 days (challenge period)');

      return {
        success: true,
        message: `Successfully initiated NFT #${params.tokenId} bridge from ${direction}. Estimated arrival: ${timeEstimate}.`,
        txHash: txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Bridge ERC721 error:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // CROSS-CHAIN MESSAGING
  // ====================================

  /**
   * Send a cross-chain message (L1 <-> L2)
   * This allows executing arbitrary contract calls across layers
   */
  const sendCrossChainMessage = async (params: SendCrossChainMessageParams): Promise<MantleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      const networkConfig = getNetworkConfig();
      const isFromL1 = params.fromL1 ?? true;

      const chainId = isFromL1
        ? (networkConfig?.l1ChainId || CHAIN_IDS.ethereum)
        : (networkConfig?.l2ChainId || CHAIN_IDS.mantle);

      const messengerAddress = isFromL1
        ? (networkConfig?.l1Contracts.L1CrossDomainMessenger || L1_CONTRACTS.mainnet.L1CrossDomainMessenger)
        : L2_CONTRACTS.mainnet.L2CrossDomainMessenger;

      await switchToNetwork(chainId);

      const minGasLimit = params.minGasLimit || 200000;

      const txHash = await writeContract(wagmiConfig as any, {
        address: messengerAddress,
        abi: CROSS_DOMAIN_MESSENGER_ABI,
        functionName: 'sendMessage',
        args: [params.targetContract, params.message, minGasLimit],
        chainId: chainId as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: chainId as any,
      });

      const direction = isFromL1 ? 'L1 to L2' : 'L2 to L1';

      return {
        success: true,
        message: `Successfully sent cross-chain message from ${direction}. Target: ${params.targetContract}`,
        txHash: txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Send cross-chain message error:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // GAS & NETWORK INFORMATION
  // ====================================

  /**
   * Get current gas price information from Mantle's Gas Price Oracle
   */
  const getGasPriceInfo = async (): Promise<GasPriceInfo | null> => {
    try {
      const networkConfig = getNetworkConfig();
      const l2ChainId = networkConfig?.l2ChainId || CHAIN_IDS.mantle;
      const oracleAddress = L2_CONTRACTS.mainnet.GasPriceOracle;

      const [gasPrice, l1BaseFee, overhead, scalar, tokenRatio] = await Promise.all([
        readContract(wagmiConfig as any, {
          address: oracleAddress,
          abi: GAS_PRICE_ORACLE_ABI,
          functionName: 'gasPrice',
          chainId: l2ChainId as any,
        }),
        readContract(wagmiConfig as any, {
          address: oracleAddress,
          abi: GAS_PRICE_ORACLE_ABI,
          functionName: 'l1BaseFee',
          chainId: l2ChainId as any,
        }),
        readContract(wagmiConfig as any, {
          address: oracleAddress,
          abi: GAS_PRICE_ORACLE_ABI,
          functionName: 'overhead',
          chainId: l2ChainId as any,
        }),
        readContract(wagmiConfig as any, {
          address: oracleAddress,
          abi: GAS_PRICE_ORACLE_ABI,
          functionName: 'scalar',
          chainId: l2ChainId as any,
        }),
        readContract(wagmiConfig as any, {
          address: oracleAddress,
          abi: GAS_PRICE_ORACLE_ABI,
          functionName: 'tokenRatio',
          chainId: l2ChainId as any,
        }),
      ]);

      return {
        l2GasPrice: formatUnits(gasPrice as bigint, 9) + " gwei",
        l1BaseFee: formatUnits(l1BaseFee as bigint, 9) + " gwei",
        overhead: (overhead as bigint).toString(),
        scalar: (scalar as bigint).toString(),
        tokenRatio: (tokenRatio as bigint).toString()
      };
    } catch (err: any) {
      console.error("Error fetching gas price info:", err);
      return null;
    }
  };

  /**
   * Estimate L1 data fee for a transaction
   */
  const estimateL1Fee = async (txData: Hex): Promise<string | null> => {
    try {
      const networkConfig = getNetworkConfig();
      const l2ChainId = networkConfig?.l2ChainId || CHAIN_IDS.mantle;
      const oracleAddress = L2_CONTRACTS.mainnet.GasPriceOracle;

      const l1Fee = await readContract(wagmiConfig as any, {
        address: oracleAddress,
        abi: GAS_PRICE_ORACLE_ABI,
        functionName: 'getL1Fee',
        args: [txData],
        chainId: l2ChainId as any,
      });

      return formatEther(l1Fee as bigint) + " MNT";
    } catch (err: any) {
      console.error("Error estimating L1 fee:", err);
      return null;
    }
  };

  /**
   * Get latest L1 block information from L2
   */
  const getL1BlockInfo = async (): Promise<L1BlockInfo | null> => {
    try {
      const networkConfig = getNetworkConfig();
      const l2ChainId = networkConfig?.l2ChainId || CHAIN_IDS.mantle;
      const l1BlockAddress = L2_CONTRACTS.mainnet.L1Block;

      const [number, timestamp, basefee, hash, sequenceNumber] = await Promise.all([
        readContract(wagmiConfig as any, {
          address: l1BlockAddress,
          abi: L1_BLOCK_ABI,
          functionName: 'number',
          chainId: l2ChainId as any,
        }),
        readContract(wagmiConfig as any, {
          address: l1BlockAddress,
          abi: L1_BLOCK_ABI,
          functionName: 'timestamp',
          chainId: l2ChainId as any,
        }),
        readContract(wagmiConfig as any, {
          address: l1BlockAddress,
          abi: L1_BLOCK_ABI,
          functionName: 'basefee',
          chainId: l2ChainId as any,
        }),
        readContract(wagmiConfig as any, {
          address: l1BlockAddress,
          abi: L1_BLOCK_ABI,
          functionName: 'hash',
          chainId: l2ChainId as any,
        }),
        readContract(wagmiConfig as any, {
          address: l1BlockAddress,
          abi: L1_BLOCK_ABI,
          functionName: 'sequenceNumber',
          chainId: l2ChainId as any,
        }),
      ]);

      return {
        number: number as bigint,
        timestamp: timestamp as bigint,
        basefee: basefee as bigint,
        hash: hash as Hex,
        sequenceNumber: sequenceNumber as bigint
      };
    } catch (err: any) {
      console.error("Error fetching L1 block info:", err);
      return null;
    }
  };

  // ====================================
  // TOKEN WRAPPING
  // ====================================

  /**
   * Wrap MNT to WMNT on Mantle L2
   */
  const wrapMNT = async (amount: string): Promise<MantleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      const networkConfig = getNetworkConfig();
      const l2ChainId = networkConfig?.l2ChainId || CHAIN_IDS.mantle;
      const wmntAddress = networkConfig?.network === 'testnet'
        ? MANTLE_TOKENS.testnet.WMNT
        : MANTLE_TOKENS.mainnet.WMNT;

      await switchToNetwork(l2ChainId);

      const amountWei = parseEther(amount);

      // Check MNT balance
      const balance = await getTokenBalance('native', l2ChainId);
      if (balance.balanceRaw < amountWei) {
        throw new Error(`Insufficient MNT balance. You have ${balance.balance} MNT but need ${amount} MNT`);
      }

      // WMNT uses standard WETH9 interface - deposit() function
      const WMNT_ABI = [
        {
          inputs: [],
          name: "deposit",
          outputs: [],
          stateMutability: "payable",
          type: "function"
        }
      ] as const;

      const txHash = await writeContract(wagmiConfig as any, {
        address: wmntAddress,
        abi: WMNT_ABI,
        functionName: 'deposit',
        value: amountWei,
        chainId: l2ChainId as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: l2ChainId as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully wrapped ${amount} MNT to WMNT`,
        txHash: txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Wrap MNT error:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Unwrap WMNT to MNT on Mantle L2
   */
  const unwrapMNT = async (amount: string): Promise<MantleHookResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!address || !isConnected) {
        throw new Error("Please connect your wallet");
      }

      const networkConfig = getNetworkConfig();
      const l2ChainId = networkConfig?.l2ChainId || CHAIN_IDS.mantle;
      const wmntAddress = networkConfig?.network === 'testnet'
        ? MANTLE_TOKENS.testnet.WMNT
        : MANTLE_TOKENS.mainnet.WMNT;

      await switchToNetwork(l2ChainId);

      const amountWei = parseEther(amount);

      // Check WMNT balance
      const balance = await getTokenBalance(wmntAddress, l2ChainId);
      if (balance.balanceRaw < amountWei) {
        throw new Error(`Insufficient WMNT balance. You have ${balance.balance} WMNT but need ${amount} WMNT`);
      }

      // WMNT uses standard WETH9 interface - withdraw() function
      const WMNT_ABI = [
        {
          inputs: [{ name: "wad", type: "uint256" }],
          name: "withdraw",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ] as const;

      const txHash = await writeContract(wagmiConfig as any, {
        address: wmntAddress,
        abi: WMNT_ABI,
        functionName: 'withdraw',
        args: [amountWei],
        chainId: l2ChainId as any,
      });

      await waitForTransactionReceipt(wagmiConfig as any, {
        hash: txHash,
        chainId: l2ChainId as any,
      });

      triggerRefresh();

      return {
        success: true,
        message: `Successfully unwrapped ${amount} WMNT to MNT`,
        txHash: txHash
      };
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Unwrap MNT error:", err);
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // UTILITY FUNCTIONS
  // ====================================

  /**
   * Get MNT balance on both L1 and L2
   * @param network - Optional: 'mainnet' or 'testnet'. If not provided, auto-detects from connected chain.
   */
  const getMNTBalances = async (network?: 'mainnet' | 'testnet'): Promise<{
    l1Balance: string;
    l2Balance: string;
    l1BalanceRaw: bigint;
    l2BalanceRaw: bigint;
  } | null> => {
    try {
      if (!address) return null;

      // Use provided network or detect from connected chain
      let l1ChainId: number;
      let l2ChainId: number;
      let l1MntAddress: Address;

      if (network === 'mainnet') {
        l1ChainId = CHAIN_IDS.ethereum;
        l2ChainId = CHAIN_IDS.mantle;
        l1MntAddress = L1_CONTRACTS.mainnet.MNTToken;
      } else if (network === 'testnet') {
        l1ChainId = CHAIN_IDS.sepolia;
        l2ChainId = CHAIN_IDS.mantleSepolia;
        l1MntAddress = L1_CONTRACTS.testnet.MNTToken;
      } else {
        // Auto-detect from connected chain
        const networkConfig = getNetworkConfig();
        l1ChainId = networkConfig?.l1ChainId || CHAIN_IDS.ethereum;
        l2ChainId = networkConfig?.l2ChainId || CHAIN_IDS.mantle;
        l1MntAddress = networkConfig?.l1Contracts?.MNTToken || L1_CONTRACTS.mainnet.MNTToken;
      }

      console.log("Fetching MNT balances:", { l1ChainId, l2ChainId, l1MntAddress, address });

      const [l1Balance, l2Balance] = await Promise.all([
        getTokenBalance(l1MntAddress, l1ChainId),
        getTokenBalance('native', l2ChainId)
      ]);

      console.log("MNT balances fetched:", { l1Balance: l1Balance.balance, l2Balance: l2Balance.balance });

      return {
        l1Balance: l1Balance.balance,
        l2Balance: l2Balance.balance,
        l1BalanceRaw: l1Balance.balanceRaw,
        l2BalanceRaw: l2Balance.balanceRaw
      };
    } catch (err: any) {
      console.error("Error fetching MNT balances:", err);
      return null;
    }
  };

  /**
   * Get ETH balance on both L1 and L2
   * @param network - Optional: 'mainnet' or 'testnet'. If not provided, auto-detects from connected chain.
   */
  const getETHBalances = async (network?: 'mainnet' | 'testnet'): Promise<{
    l1Balance: string;
    l2Balance: string;
    l1BalanceRaw: bigint;
    l2BalanceRaw: bigint;
  } | null> => {
    try {
      if (!address) return null;

      // Use provided network or detect from connected chain
      let l1ChainId: number;
      let l2ChainId: number;
      let wethAddress: Address;

      if (network === 'mainnet') {
        l1ChainId = CHAIN_IDS.ethereum;
        l2ChainId = CHAIN_IDS.mantle;
        wethAddress = L2_CONTRACTS.mainnet.WETH;
      } else if (network === 'testnet') {
        l1ChainId = CHAIN_IDS.sepolia;
        l2ChainId = CHAIN_IDS.mantleSepolia;
        wethAddress = L2_CONTRACTS.testnet.WETH;
      } else {
        // Auto-detect from connected chain
        const networkConfig = getNetworkConfig();
        l1ChainId = networkConfig?.l1ChainId || CHAIN_IDS.ethereum;
        l2ChainId = networkConfig?.l2ChainId || CHAIN_IDS.mantle;
        wethAddress = networkConfig?.l2Contracts?.WETH || L2_CONTRACTS.mainnet.WETH;
      }

      console.log("Fetching ETH balances:", { l1ChainId, l2ChainId, wethAddress, address });

      const [l1Balance, l2Balance] = await Promise.all([
        getTokenBalance('native', l1ChainId),
        getTokenBalance(wethAddress, l2ChainId)
      ]);

      console.log("ETH balances fetched:", { l1Balance: l1Balance.balance, l2Balance: l2Balance.balance });

      return {
        l1Balance: l1Balance.balance,
        l2Balance: l2Balance.balance,
        l1BalanceRaw: l1Balance.balanceRaw,
        l2BalanceRaw: l2Balance.balanceRaw
      };
    } catch (err: any) {
      console.error("Error fetching ETH balances:", err);
      return null;
    }
  };

  /**
   * Get explorer URL for a transaction
   */
  const getExplorerUrl = (txHash: string, isL1: boolean = false): string => {
    const networkConfig = getNetworkConfig();

    if (isL1) {
      return networkConfig?.network === 'testnet'
        ? `https://sepolia.etherscan.io/tx/${txHash}`
        : `https://etherscan.io/tx/${txHash}`;
    }

    return networkConfig?.network === 'testnet'
      ? `https://sepolia.mantlescan.xyz/tx/${txHash}`
      : `https://mantlescan.xyz/tx/${txHash}`;
  };

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ====================================
  // RETURN ALL FUNCTIONS
  // ====================================

  return {
    // State
    loading,
    error,
    clearError,

    // Network Information
    getNetworkStatus,
    getNetworkConfig,
    switchToNetwork,

    // Deposit Functions (L1 -> L2)
    depositMNT,
    depositETH,
    depositERC20,

    // Withdraw Functions (L2 -> L1)
    withdrawMNT,
    withdrawETH,
    withdrawERC20,

    // NFT Bridging
    bridgeERC721,

    // Cross-Chain Messaging
    sendCrossChainMessage,

    // Token Wrapping
    wrapMNT,
    unwrapMNT,

    // Balance Queries
    getTokenBalance,
    getMNTBalances,
    getETHBalances,

    // Gas & Network Info
    getGasPriceInfo,
    estimateL1Fee,
    getL1BlockInfo,

    // Utilities
    getExplorerUrl,
    approveToken,

    // Constants Export
    MANTLE_CONFIG,
    L1_CONTRACTS,
    L2_CONTRACTS,
    MANTLE_TOKENS,
    CHAIN_IDS,
    RPC_PROVIDERS
  };
};

export default useMantleHook;
