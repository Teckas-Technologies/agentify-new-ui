import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { getTokens } from '@lifi/sdk';
import { getBalance, readContract } from '@wagmi/core';
import { wagmiConfig } from '@/contexts/CustomWagmiProvider';
import { erc20Abi } from 'viem';
import { useTokenBalanceRefresh } from '@/contexts/TokenBalanceRefreshContext';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  value: bigint;
  chainId: number;
  chainName: string;
  logoURI: string;
  address: string;
  priceUSD?: string;
}

// Native token addresses used by LiFi SDK
const NATIVE_TOKEN_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
].map(addr => addr.toLowerCase());

export function useTokenBalances() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { refreshTrigger } = useTokenBalanceRefresh();
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setTokens([]);
      return;
    }

    const fetchTokenBalances = async () => {
      // Only show loading spinner on initial load (when tokens array is empty)
      // During refresh, silently update in the background
      const isInitialLoad = tokens.length === 0;
      if (isInitialLoad) {
        setIsLoading(true);
      }
      try {
        // Fetch all tokens for the current chain from LiFi
        const lifiTokens = await getTokens({ chains: [chainId] });
        const chainTokens = lifiTokens.tokens[chainId] || [];

        // Limit to first 50 popular tokens to avoid excessive API calls
        const popularTokens = chainTokens.slice(0, 50);

        // Fetch balances for all tokens
        const balancePromises = popularTokens.map(async (token) => {
          try {
            const isNativeToken = NATIVE_TOKEN_ADDRESSES.includes(token.address.toLowerCase());
            let balance: bigint = BigInt(0);

            if (isNativeToken) {
              // Fetch native token balance (ETH, BNB, MATIC, etc.)
              const nativeBalance = await getBalance(wagmiConfig as any, {
                address: address as `0x${string}`,
                chainId: chainId as any,
              });
              balance = nativeBalance.value;
            } else {
              // Fetch ERC20 token balance
              try {
                const erc20Balance = await readContract(wagmiConfig as any, {
                  address: token.address as `0x${string}`,
                  abi: erc20Abi,
                  functionName: 'balanceOf',
                  args: [address as `0x${string}`],
                  chainId: chainId as any,
                });
                balance = BigInt(erc20Balance?.toString() || "0");
              } catch (err) {
                // Token might not be a valid ERC20, skip it
                return null;
              }
            }

            // Only return tokens with non-zero balance
            if (balance > BigInt(0)) {
              return {
                symbol: token.symbol,
                name: token.name,
                balance: formatUnits(balance, token.decimals),
                decimals: token.decimals,
                value: balance,
                chainId: token.chainId,
                chainName: token.chainId.toString(),
                logoURI: token.logoURI || '',
                address: token.address,
                priceUSD: token.priceUSD,
              };
            }
            return null;
          } catch (error) {
            // Skip tokens that fail to fetch
            return null;
          }
        });

        const results = await Promise.all(balancePromises);

        // Filter out null results and sort by balance value (descending)
        const validTokens = results
          .filter((token): token is NonNullable<typeof token> => token !== null)
          .sort((a, b) => {
            // Sort by USD value if available, otherwise by balance
            if (a.priceUSD && b.priceUSD) {
              const aValue = parseFloat(a.balance) * parseFloat(a.priceUSD);
              const bValue = parseFloat(b.balance) * parseFloat(b.priceUSD);
              return bValue - aValue;
            }
            return Number(b.value - a.value);
          });

        setTokens(validTokens);
      } catch (error) {
        console.error('Error fetching token balances:', error);
        // Only clear tokens on initial load error, not during refresh
        if (isInitialLoad) {
          setTokens([]);
        }
      } finally {
        // Only turn off loading if we turned it on (initial load)
        if (isInitialLoad) {
          setIsLoading(false);
        }
      }
    };

    fetchTokenBalances();
  }, [address, isConnected, chainId, refreshTrigger]);

  return {
    tokens,
    isLoading,
    isConnected,
  };
}
