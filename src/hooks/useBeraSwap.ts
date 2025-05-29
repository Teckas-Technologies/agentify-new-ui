import { useCallback, useState } from "react";
import { BigNumber, ethers } from "ethers";
import { Big } from "big.js";
import {
  BalancerApi,
  SwapKind,
  Token,
  TokenAmount,
  Swap,
  Slippage,
  ChainId,
} from "@berachain-foundation/berancer-sdk";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { erc20Abi } from "viem";
import { ChainKey, getToken, getTokenBalance } from "@lifi/sdk";
import { useAccount } from "wagmi";

const RPC_URL = "https://rpc.berachain.com/";
const CHAIN_ID = 80094;

export const useBeraSwap = () => {
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { address } = useAccount();
  const getProvider =
    async (): Promise<ethers.providers.Web3Provider | null> => {
      const userWalletType = user?.wallet?.walletClientType;
      if (!userWalletType) {
        setError("No wallet connection found");
        return null;
      }

      const matchedWallet = wallets.find(
        (wallet) => wallet.walletClientType === userWalletType
      );

      if (!matchedWallet) {
        setError(`No ${userWalletType} wallet connected`);
        return null;
      }

      try {
        const ethereumProvider = await matchedWallet.getEthereumProvider();
        return new ethers.providers.Web3Provider(ethereumProvider);
      } catch (err) {
        console.error("Error getting provider:", err);
        setError("Failed to get wallet provider");
        return null;
      }
    };
  const validateTokenBalance = async (
    chainId: any,
    tokenAddress: string,
    amount: string
  ) => {
    if (!address) {
      return;
    }
    try {
      const token = await getToken(chainId, tokenAddress);
      const tokenBalance = await getTokenBalance(address, token);
      const userBalance = BigInt(tokenBalance?.amount || "0");
      const requiredAmount = BigInt(amount);
      if (userBalance < requiredAmount) {
        setError(
          "Insufficient token balance. Please check your wallet balance"
        );
        return false;
      }
      return true;
    } catch (err) {
      setError("Failed to fetch token balance. Please try again.");
      return false;
    }
  };
  const validateNativeTokenBalance = async (
    amount: bigint
  ): Promise<boolean> => {
    if (!address) return false;
    try {
      const provider = await getProvider();
      if (!provider) throw new Error("Provider not available");

      const balance = await provider.getBalance(address);

      const requiredAmount = BigNumber.from(amount.toString()); // Convert bigint to BigNumber

      if (balance.lt(requiredAmount)) {
        setError("Insufficient native token balance.");
        return false;
      }

      return true;
    } catch (err) {
      console.error("Failed to fetch native balance:", err);
      setError("Could not fetch native token balance.");
      return false;
    }
  };

  const swap = useCallback(
    async (
      fromTokenAddress: string,
      fromTokenDecimals: number,
      fromTokenSymbol: string,
      toTokenAddress: string,
      toTokenDecimals: number,
      toTokenSymbol: string,
      amount: string | number | bigint
    ): Promise<string> => {
      setIsSwapping(true);
      setError(null);
      setTxHash(null);

      try {
        const provider = await getProvider();
        if (!provider) throw new Error("Provider not available");

        const signer = provider.getSigner();
        const walletAddress = await signer.getAddress();
        const balancerApi = new BalancerApi(
          "https://api.berachain.com/",
          CHAIN_ID
        );

        const fromToken = new Token(
          CHAIN_ID,
          fromTokenAddress as `0x${string}`,
          fromTokenDecimals,
          fromTokenSymbol
        );

        const toToken = new Token(
          CHAIN_ID,
          toTokenAddress as `0x${string}`,
          toTokenDecimals,
          toTokenSymbol
        );

        let amountString: string;
        if (typeof amount === "bigint" || typeof amount === "number") {
          amountString = Big(amount.toString()).toFixed(); // Ensures plain decimal
        } else {
          amountString = Big(amount).toFixed(); // Handles scientific notation like "1e-17"
        }

        const swapAmount = TokenAmount.fromHumanAmount(
          fromToken,
          amountString as `${number}`
        );

        const { paths: sorPaths } =
          await balancerApi.sorSwapPaths.fetchSorSwapPaths({
            chainId: CHAIN_ID,
            tokenIn: fromToken.address,
            tokenOut: toToken.address,
            swapKind: SwapKind.GivenOut,
            swapAmount,
          });

        if (!sorPaths || sorPaths.length === 0) {
          throw new Error("No swap paths found — possibly low liquidity");
        }

        const swap = new Swap({
          chainId: CHAIN_ID,
          paths: sorPaths,
          swapKind: SwapKind.GivenIn,
          userData: "0x",
        });

        const queryOutput = await swap.query(RPC_URL);
        const slippage = Slippage.fromPercentage("1");
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 900);

        const callData = swap.buildCall({
          slippage,
          deadline,
          queryOutput,
          sender: walletAddress as `0x${string}`,
          recipient: walletAddress as `0x${string}`,
          wethIsEth: false,
        });
        const isNativeToken =
          fromToken.address === ethers.constants.AddressZero;

        if (!isNativeToken) {
          const fromTokenContract = new ethers.Contract(
            fromToken.address,
            erc20Abi,
            signer
          );

          const code = await provider.getCode(fromTokenContract.address);
          if (code === "0x") {
            throw new Error("Token contract does not exist on this network.");
          }

          const network = await provider.getNetwork();
          const currentAllowance: ethers.BigNumber =
            await fromTokenContract.allowance(walletAddress, callData.to);

          if (currentAllowance.lt(swapAmount.amount)) {
            const approveTx = await fromTokenContract.approve(
              callData.to,
              swapAmount.amount
            );
            await approveTx.wait();
          } else {
            // console.log(
            //   "Sufficient allowance already exists. Skipping approval."
            // );
          }
        } else {
          // console.log(
          //   "Native token selected — skipping approve and allowance check."
          // );
        }

        const swapTx = await signer.sendTransaction({
          to: callData.to,
          data: callData.callData,
          value: callData.value,
        });
        setTxHash(swapTx.hash);
        await swapTx.wait();

        return swapTx.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Swap failed:", error);
        setError(error.message || "Swap failed");
        throw error;
      } finally {
        setIsSwapping(false);
      }
    },
    [wallets, user]
  );

  return {
    isSwapping,
    error,
    txHash,
    swap,
    RPC_URL,
    validateTokenBalance,
    validateNativeTokenBalance,
  };
};
