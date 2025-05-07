import { useCallback, useState } from "react";
import { ethers } from "ethers";
import {
  BalancerApi,
  SwapKind,
  Token,
  TokenAmount,
  Swap,
  Slippage,
} from "@berachain-foundation/berancer-sdk";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { erc20Abi } from "viem";

const RPC_URL = "https://rpc.berachain.com/";
const CHAIN_ID = 80094;

export const useBeraSwap = () => {
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { user } = usePrivy();
  const { wallets } = useWallets();

  const getProvider = async (): Promise<ethers.providers.Web3Provider | null> => {
    const userWalletType = user?.wallet?.walletClientType;
    console.log("User wallet type:", userWalletType);

    if (!userWalletType) {
      setError("No wallet connection found");
      return null;
    }

    const matchedWallet = wallets.find(wallet => wallet.walletClientType === userWalletType);
    console.log("Matched wallet:", matchedWallet);

    if (!matchedWallet) {
      setError(`No ${userWalletType} wallet connected`);
      return null;
    }

    try {
      const ethereumProvider = await matchedWallet.getEthereumProvider();
      console.log("Ethereum provider:", ethereumProvider);
      return new ethers.providers.Web3Provider(ethereumProvider);
    } catch (err) {
      console.error("Error getting provider:", err);
      setError("Failed to get wallet provider");
      return null;
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
      console.log("Initiating swap...");
      setIsSwapping(true);
      setError(null);
      setTxHash(null);

      try {
        const provider = await getProvider();
        if (!provider) throw new Error("Provider not available");

        const signer = provider.getSigner();
        const walletAddress = await signer.getAddress();
        console.log("Wallet address:", walletAddress);

        const balancerApi = new BalancerApi("https://api.berachain.com/", CHAIN_ID);
console.log("API ..",balancerApi);

        const fromToken = new Token(
          CHAIN_ID,
          fromTokenAddress as `0x${string}`,
          fromTokenDecimals,
          fromTokenSymbol
        );
        console.log("From token:", fromToken);

        const toToken = new Token(
          CHAIN_ID,
          toTokenAddress as `0x${string}`,
          toTokenDecimals,
          toTokenSymbol
        );
        console.log("To token:", toToken);

        let amountString: string;
        if (typeof amount === "bigint") {
          amountString = amount.toString();
        } else if (typeof amount === "number") {
          amountString = amount.toString();
        } else {
          amountString = amount;
        }
        console.log("Parsed amount string:", amountString);

        if (!/^\d*\.?\d+$/.test(amountString)) {
          throw new Error("Invalid amount format");
        }

        const swapAmount = TokenAmount.fromHumanAmount(fromToken, amountString as `${number}`);
        console.log("Swap amount (TokenAmount):", swapAmount);

        const { paths: sorPaths } = await balancerApi.sorSwapPaths.fetchSorSwapPaths({
          chainId: CHAIN_ID,
          tokenIn: fromToken.address,
          tokenOut: toToken.address,
          swapKind: SwapKind.GivenOut,
          swapAmount,
        });
        console.log("Fetching SOR paths with::::::::", {
          chainId: CHAIN_ID,
          tokenIn: fromToken.address,
          tokenOut: toToken.address,
          swapKind: SwapKind.GivenOut,
          swapAmount:swapAmount.amount.toString(),
        });
        console.log("SOR paths:", sorPaths);

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
        console.log("Query output:", queryOutput);

        const slippage = Slippage.fromPercentage("1");
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60);
        console.log("Slippage:", slippage.toString(), "Deadline:", deadline.toString());

        const callData = swap.buildCall({
          slippage,
          deadline,
          queryOutput,
          sender: walletAddress as `0x${string}`,
          recipient: walletAddress as `0x${string}`,
          wethIsEth: false,
        });
        console.log("Call data for transaction:", callData);

        const tokenAbi = ["function approve(address spender, uint256 amount) public returns (bool)"];
        const fromTokenContract = new ethers.Contract(fromToken.address, erc20Abi, signer);
        const code = await provider.getCode(fromTokenContract.address);
console.log("Deployed code at token address -----------", code);
const network = await provider.getNetwork();
console.log("Connected network:", network.name, network.chainId);
console.log("Token contract for approval:", fromTokenContract.address);
console.log("Checking allowance for:");
console.log("Owner (walletAddress):", walletAddress);
console.log("Spender (callData.to):", callData.to);
const currentAllowance: ethers.BigNumber = await fromTokenContract.allowance("0x0f8b92dAF673604CEE6598c7177846fd663BCdC1", "0x4Be03f781C497A489E3cB0287833452cA9B9E80B");
console.log("Current allowance:", currentAllowance.toString());

if (currentAllowance.lt(swapAmount.amount)) {
  console.log("Insufficient allowance, sending approve transaction...");
  const approveTx = await fromTokenContract.approve(callData.to, swapAmount.amount);
  console.log("Approval transaction sent:", approveTx.hash);
  await approveTx.wait();
  console.log("Approval confirmed");
} else {
  console.log("Sufficient allowance already exists. Skipping approval.");
}


        const swapTx = await signer.sendTransaction({
          to: callData.to,
          data: callData.callData,
          value: callData.value,
        });
        console.log("Swap transaction sent:", swapTx.hash);

        setTxHash(swapTx.hash);
        await swapTx.wait();
        console.log("Swap confirmed:", swapTx.hash);

        return swapTx.hash;
      } catch (err: any) {
        console.error("Swap failed:", err);
        setError(err.message || "Swap failed");
        throw err;
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
  };
};