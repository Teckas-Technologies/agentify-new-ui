import { Send, Wallet, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/Components/ui/card";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MarketType,
  Message,
  TransactionType,
  TransactionStatus,
  RequestFieldsv2,
  RequestFields,
} from "@/types/types";
import { useAccount } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useChat } from "@/hooks/useChatHook";
import dynamic from "next/dynamic";
import useAaveHook, { TransactionError } from "@/hooks/useAaveHook";
import useLifiHook from "@/hooks/useLifiHook";
import { useTransactions } from "@/hooks/useTransactionsHook";
import { v4 as uuidv4 } from "uuid";
import { switchNetwork } from "@/utils/switchNetwork";
import { marketConfigs } from "@/utils/markets";
import { ChainType, getChains } from "@lifi/sdk";
import { useBeraSwap } from "@/hooks/useBeraSwap";
import { useToast } from "@/hooks/use-toast";
import { formatUnits } from "ethers/lib/utils";
import useMantleHook, { MANTLE_CONFIG } from "@/hooks/useMantleHook";
import useLendleHook, { LENDLE_ASSETS } from "@/hooks/useLendleHook";

const MarkdownToJSX = dynamic(() => import("markdown-to-jsx"), { ssr: false });

// Helper function to resolve token symbol/name to contract address
const resolveTokenAddress = (tokenInput: string): string => {
  if (!tokenInput) return tokenInput;

  // If already a valid address (starts with 0x and is 42 chars), return as-is
  if (tokenInput.startsWith("0x") && tokenInput.length === 42) {
    return tokenInput;
  }

  const tokenLower = tokenInput.toLowerCase().trim();

  // Map common token symbols/names to addresses
  const tokenMap: Record<string, string> = {
    // Native/Wrapped MNT
    "native": LENDLE_ASSETS.WMNT,
    "mnt": LENDLE_ASSETS.WMNT,
    "mantle": LENDLE_ASSETS.WMNT,
    "wmnt": LENDLE_ASSETS.WMNT,
    "wrapped mnt": LENDLE_ASSETS.WMNT,
    "wrapped mantle": LENDLE_ASSETS.WMNT,

    // WETH
    "weth": LENDLE_ASSETS.WETH,
    "eth": LENDLE_ASSETS.WETH,
    "ethereum": LENDLE_ASSETS.WETH,
    "wrapped eth": LENDLE_ASSETS.WETH,
    "wrapped ethereum": LENDLE_ASSETS.WETH,

    // USDC
    "usdc": LENDLE_ASSETS.USDC,
    "usd coin": LENDLE_ASSETS.USDC,

    // USDT
    "usdt": LENDLE_ASSETS.USDT,
    "tether": LENDLE_ASSETS.USDT,

    // METH
    "meth": LENDLE_ASSETS.METH,
    "mantle eth": LENDLE_ASSETS.METH,

    // WBTC
    "wbtc": LENDLE_ASSETS.WBTC,
    "btc": LENDLE_ASSETS.WBTC,
    "bitcoin": LENDLE_ASSETS.WBTC,
    "wrapped btc": LENDLE_ASSETS.WBTC,
    "wrapped bitcoin": LENDLE_ASSETS.WBTC,
  };

  return tokenMap[tokenLower] || tokenInput;
};

interface UnifiedCommandInterfaceProps {
  isWalletConnected?: boolean;
  onConnect?: () => void;
}

export const UnifiedCommandInterface = ({
  isWalletConnected = false,
  onConnect = () => { },
}: UnifiedCommandInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExecutingLifi, setExecutingLifi] = useState(false);
  const [isExecutingAave, setExecutingAave] = useState(false);
  const [isExecutingMantle, setExecutingMantle] = useState(false);
  const [isExecutingLendle, setExecutingLendle] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { address } = useAccount();
  const { user } = usePrivy();
  const { toast } = useToast();
  const {
    chat,
    fetchChatHistory,
    clearHistory,
  } = useChat();
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const { executeLifi, validateTokenBalance } = useLifiHook();
  const { supplyToAave, withdrawFromAave, borrowToAave, repayToAave } = useAaveHook();
  const { createTransactions, createTransactionsv2 } = useTransactions();
  const {
    swap,
    txHash,
    isSwapping,
    error,
    RPC_URL,
    validateTokenBalance: validateBeraChainTokenBalance,
    validateNativeTokenBalance,
  } = useBeraSwap();
  const {
    depositMNT,
    depositETH,
    withdrawMNT,
    withdrawETH,
    wrapMNT,
    unwrapMNT,
    getMNTBalances,
    getETHBalances,
    getGasPriceInfo,
    getExplorerUrl,
  } = useMantleHook();
  const {
    deposit: lendleDeposit,
    depositMNT: lendleDepositMNT,
    withdraw: lendleWithdraw,
    withdrawMNT: lendleWithdrawMNT,
    borrow: lendleBorrow,
    borrowMNT: lendleBorrowMNT,
    repay: lendleRepay,
    repayMNT: lendleRepayMNT,
    getUserAccountData: lendleGetUserAccountData,
    getUserReserveData: lendleGetUserReserveData,
    getReserveData: lendleGetReserveData,
    getReserveConfigData: lendleGetReserveConfigData,
    stakeLEND,
    withdrawStakedLEND,
    claimStakingRewards: lendleClaimStakingRewards,
    getStakingInfo: lendleGetStakingInfo,
  } = useLendleHook();
  const { wallets } = useWallets();
  const wallet = wallets[0];

  const quickCommands = [
    "Swap 100 USDT for ETH on Ethereum",
    "Bridge 50 USDC from Ethereum to Polygon",
    "Lend 1000 USDC on Ethereum",
    "Show my lending positions",
    "Swap HONEY for BERA on Berachain",
  ];

  useEffect(() => {
    if (messages && messages?.length > 3) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!address || !user) {
      setMessages([]);
      setCurrentThreadId(null);
    }
  }, [address, user]);

  useEffect(() => {
    if (address && user) {
      // Load history if we have a threadId, otherwise start fresh
      if (currentThreadId) {
        fetchHistory();
      }
    }
  }, [address, user, currentThreadId]);

  // Initialize threadId and load conversation for new/existing users
  useEffect(() => {
    if (address && user && !currentThreadId) {
      const newThreadId = `multiagent_${user.id}`;
      setCurrentThreadId(newThreadId);
    }
  }, [address, user, currentThreadId, setCurrentThreadId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const message = params.get("message");
      if (message) {
        setInputValue(message);
      }
    }
  }, []);

  const handleQuickCommand = useCallback((command: string) => {
    setInputValue(command);
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      if (!address || !currentThreadId) return;
      const history = await fetchChatHistory(currentThreadId);
      const filteredMessages = history?.message?.filter(
        (msg: Message) => msg.message.trim() !== "" && msg.role !== "tool"
      );
      setMessages(filteredMessages ?? []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }, [address, currentThreadId]);

  const clearChatHistory = async () => {
    try {
      if (!address || !currentThreadId) return;
      const res = await clearHistory(currentThreadId);
      if (res?.success) {
        setMessages([]);
        setCurrentThreadId(null);
        toast({
          title: "Chat History Cleared!",
          description: "Starting a new conversation.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
      toast({
        title: "Unexpected Error",
        description: "An error occurred while clearing chat history.",
        variant: "destructive",
      });
    }
  };

  const updateLastAiMessage = useCallback((newMessage: string) => {
    setMessages((prev) => {
      const updatedMessages = [...prev];
      const lastIndex = updatedMessages.length - 1;

      if (updatedMessages[lastIndex]?.role === "ai") {
        updatedMessages[lastIndex] = { role: "ai", message: newMessage };
      } else {
        updatedMessages.push({ role: "ai", message: newMessage });
      }

      return updatedMessages;
    });
  }, []);

  async function getChainInfoById(chainId: number) {
    try {
      const chains = await getChains({ chainTypes: [ChainType.EVM] });
      const matched = chains.find((chain) => chain.id === chainId);
      if (!matched || !matched.metamask || !matched.nativeToken) return null;

      return {
        nativeTokenSymbol: matched.nativeToken.symbol,
        rpcUrl: matched.metamask.rpcUrls?.[0] || "",
        decimals: matched.nativeToken.decimals,
        chainName: matched.name,
      };
    } catch (error) {
      console.error("Error fetching chain info:", error);
      return null;
    }
  }

  const createTrans = async (
    user_id: string,
    agent_id: string,
    transaction_type: TransactionType,
    description: string,
    chain: string,
    time: Date,
    crypto: string,
    amount: number,
    transaction_hash: string,
    explorer_url: string,
    status: TransactionStatus,
    amountUSD: number,
    gasUSD: number,
    agent_name: string
  ) => {
    const payload: RequestFields = {
      user_id,
      agent_id,
      transaction_type,
      description,
      chain,
      time,
      crypto,
      amount,
      transaction_hash,
      explorer_url,
      status,
      amountUSD,
      gasUSD,
      agent_name,
    };
    const data = await createTransactions(payload);
  };

  const createTransv2 = async (
    user_id: string,
    agent_id: string,
    transaction_type: TransactionType,
    description: string,
    chain: string,
    time: Date,
    crypto: string,
    amount: number,
    transaction_hash: string,
    explorer_url: string,
    status: TransactionStatus,
    rpcUrl: string,
    symbol: string,
    decimal: number,
    token_symbol: string,
    agent_name: string
  ) => {
    const payload: RequestFieldsv2 = {
      user_id,
      agent_id,
      transaction_type,
      description,
      chain,
      time,
      crypto,
      amount,
      transaction_hash,
      explorer_url,
      status,
      rpcUrl,
      symbol,
      decimal,
      agent_name,
      token_symbol,
    };
    const data = await createTransactionsv2(payload);
  };

  const handleChat = async () => {
    if (!inputValue.trim() || isLoading || !address || !user) {
      return;
    }

    // Display only the plain message in UI
    const userMessage: Message = {
      role: "human",
      message: inputValue,
    };
    setMessages((prev) => (Array.isArray(prev) ? [...prev, userMessage] : [userMessage]));
    
    // Save the input value before clearing
    const messageToSend = inputValue;
    setInputValue("");

    setIsLoading(true);

    try {
      // Send enriched message to backend
      const enrichedMessage = JSON.stringify({
        message: messageToSend,
        context: {
          fromAddress: address
        },
      });

      const response = await chat({
        inputMessage: enrichedMessage,
        agentName: currentThreadId || 'default-agent',
        userId: user?.id ?? '',
        isTransaction: false,
      });

      // The response doesn't include threadId, so we keep using the current one

      if (response?.success) {
        // Handle tool responses for various operations
        if (response?.data?.tool_response !== "None" && response?.data?.tool_response) {
          const toolMessage = JSON.parse(response?.data?.tool_response);
          
          // Berachain Swap
          if (toolMessage?.type === "berachain_swap") {
            const {
              fromAddress,
              toAddress,
              slippage,
              fromToken,
              toToken,
              parsedFromAmount,
              estimatedToAmount,
              fromTokenAddress,
              toTokenAddress,
              fromTokenDecimals,
              toTokenDecimals,
            } = toolMessage.details;

            if (!fromAddress || !toAddress) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: "Missing swap parameters. Please try again.",
                },
              ]);
              return;
            }

            const fromAmount = Number(parsedFromAmount) / 1e18;
            const from = `${fromAmount} ${fromToken}`;
            const to = `${estimatedToAmount} ${toToken}`;

            try {
              const berachainId = toolMessage?.BerachainId;
              if (
                wallet &&
                berachainId &&
                parseInt(wallet.chainId.split(":")[1]) !== berachainId
              ) {
                await switchNetwork(berachainId);
              }

              let hasSufficientBalance;
              if (fromToken === "BERA") {
                hasSufficientBalance = await validateNativeTokenBalance(
                  BigInt(parsedFromAmount)
                );
              } else {
                hasSufficientBalance = await validateBeraChainTokenBalance(
                  berachainId,
                  fromTokenAddress,
                  parsedFromAmount
                );
              }

              if (!hasSufficientBalance) {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "ai",
                    message: `Insufficient ${fromToken} balance to complete the swap.`,
                  },
                ]);
                return;
              }

              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Executing swap: ${fromToken} → ${toToken}. Don't close the page...`,
                },
              ]);

              const amountString = fromAmount.toString();

              const txHash = await swap(
                fromTokenAddress,
                fromTokenDecimals,
                fromToken,
                toTokenAddress,
                toTokenDecimals,
                toToken,
                amountString
              );

              if (txHash) {
                const explorerUrl = `https://berascan.com/tx/${txHash}`;
                
                await createTransv2(
                  user?.id ?? '',
                  "berachainSwapAgent",
                  "SWAP",
                  `Swapped ${from} to ${to}`,
                  "Berachain",
                  new Date(),
                  fromToken,
                  fromAmount,
                  txHash,
                  explorerUrl,
                  "SUCCESS",
                  RPC_URL,
                  "BERA",
                  fromTokenDecimals,
                  toToken,
                  "Berachain Swap Agent"
                );

                const statusMessage = `Swap successful! 🎉 [View on Berascan](${explorerUrl})`;
                
                // Store the status in backend
                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });
                
                updateLastAiMessage(statusMessage);
                
                // Refresh conversation after successful transaction
                setTimeout(() => {
                  if (currentThreadId) {
                    fetchHistory();
                  }
                }, 1500);
              } else {
                throw new Error("Swap failed (no transaction hash)");
              }
            } catch (err: unknown) {
              const error = err as TransactionError;
              console.error("Swap error:", error);

              let errorMsg = "Something went wrong. Please try again later.";

              if (
                error?.code === "ACTION_REJECTED" ||
                error?.message?.includes("user rejected transaction")
              ) {
                errorMsg = "Swap cancelled by user.";
              } else if (
                error?.code === "UNPREDICTABLE_GAS_LIMIT" ||
                error?.message?.includes("cannot estimate gas")
              ) {
                errorMsg =
                  "Swap failed due to gas limit issues. Please check your balance and try a smaller amount.";
              } else if (
                error?.message?.includes("No swap paths found") ||
                error?.message?.toLowerCase().includes("low liquidity")
              ) {
                errorMsg =
                  "Swap failed: No available swap path due to low liquidity. Try a different token pair or amount.";
              }

              setMessages((prev) => [
                ...prev,
                { role: "ai", message: errorMsg },
              ]);
            }
            return;
          }

          // Bridge or Swap via Lifi
          if (toolMessage?.type === "bridge" || toolMessage?.type === "swap") {
            const { quote, explorerUrl } = toolMessage;
            const { explorer } = toolMessage;
            if (quote) {
              const {
                estimate: {
                  fromAmount,
                  toAmount,
                  fromToken,
                  toToken,
                  fromChainId,
                  toChainId,
                  fromAmountUSD,
                  gasCostUSD,
                },
              } = quote;

              const chainInfo = await getChainInfoById(fromChainId);
              const hasSufficientBalance = await validateTokenBalance(fromChainId, fromToken, fromAmount);

              if (!hasSufficientBalance) {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "ai",
                    message: `Oh no! It looks like you don't have enough ${fromToken.symbol} in your wallet. Please check your balance and try again!`,
                  },
                ]);
                return;
              }

              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Executing ${
                    fromChainId.toString() === toChainId.toString()
                      ? "swap"
                      : "bridge"
                  }... Please confirm the transaction and don't close the page.`,
                },
              ]);

              setExecutingLifi(true);
              const response = await executeLifi({ quote });
              
              if (response?.txHash) {
                const agentId =
                  fromChainId.toString() === toChainId.toString()
                    ? "swapAgent"
                    : "bridgeAgent";
                const transaction_type =
                  fromChainId.toString() === toChainId.toString()
                    ? "SWAP"
                    : "BRIDGE";

                const formatedAmount = formatUnits(
                  fromAmount,
                  fromToken.decimals
                );

                const agentName =
                  fromChainId.toString() === toChainId.toString()
                    ? "Swap Agent"
                    : "Bridge Agent";

                await createTrans(
                  user?.id ?? '',
                  agentId,
                  transaction_type,
                  `${
                    fromChainId.toString() === toChainId.toString()
                      ? "Swap"
                      : "Bridge"
                  } ${formatedAmount} ${
                    fromToken.symbol
                  } executed successfully!`,
                  chainInfo?.chainName || "",
                  new Date(),
                  fromToken.symbol,
                  Number(formatedAmount),
                  response?.txHash,
                  `${explorer}tx/${response.txHash}`,
                  "SUCCESS",
                  fromAmountUSD,
                  gasCostUSD,
                  agentName
                );

                const statusMessage = `Your ${
                  fromChainId.toString() === toChainId.toString()
                    ? "Swap"
                    : "Bridge"
                } was executed successfully! 🎉 You can check the transaction on the [explorer](${explorer}tx/${
                  response?.txHash
                }).`;
                
                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);
                setExecutingLifi(false);
                
                // Refresh conversation after successful transaction
                setTimeout(() => {
                  if (currentThreadId) {
                    fetchHistory();
                  }
                }, 1500);
                return;
              } else {
                const statusMessage = `Oops! ${
                  fromChainId.toString() === toChainId.toString()
                    ? "Swap"
                    : "Bridge"
                } execution failed!`;
                
                updateLastAiMessage(statusMessage);
                setExecutingLifi(false);
                return;
              }
            }
          }

          // Lend (Supply)
          if (toolMessage?.type === "lend") {
            const { market, tokenSymbol, amount, explorer } = toolMessage;
            if (!market || !tokenSymbol || !amount) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Required fields are incorrect or missing!`,
                },
              ]);
              return;
            }
            
            const marketType: MarketType = market;
            const selectedMarket = marketConfigs[marketType];

            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Executing lend for ${amount} ${tokenSymbol}, don't close the page until confirmations...`,
              },
            ]);
            
            setExecutingAave(true);

            const res = await supplyToAave({
              market: MarketType[market as keyof typeof MarketType],
              tokenSymbol: tokenSymbol,
              amount: amount.toString(),
            });

            const chainInfo = await getChainInfoById(selectedMarket.chainId);
            
            if (res?.success && res?.txHashes && res?.txHashes?.length > 0) {
              if (!chainInfo) {
                console.error("Chain info not found for chainId:", selectedMarket.chainId);
                return;
              }

              const { nativeTokenSymbol, rpcUrl, decimals, chainName } = chainInfo;
              
              await createTransv2(
                user?.id ?? '',
                "lendingBorrowingAgent",
                "LEND",
                `Lend ${amount} ${tokenSymbol} executed successfully`,
                chainName,
                new Date(),
                tokenSymbol,
                amount,
                res?.txHashes[0],
                `${explorer}tx/${res?.txHashes[0]}`,
                "SUCCESS",
                rpcUrl,
                nativeTokenSymbol,
                decimals,
                tokenSymbol,
                "Lend and Borrow agent"
              );

              const statusMessage = `You've successfully lent ${amount} ${tokenSymbol}! 🎉 You can check the transaction on the [explorer](${explorer}tx/${res?.txHashes[0]}).`;
              
              await chat({
                inputMessage: statusMessage,
                agentName: currentThreadId || 'default-agent',
                userId: user?.id ?? '',
                isTransaction: true,
              });

              updateLastAiMessage(statusMessage);
              setExecutingAave(false);
              
              // Refresh conversation after successful transaction
              setTimeout(() => {
                if (currentThreadId) {
                  fetchHistory();
                }
              }, 1500);
              return;
            } else {
              const statusMessage = `Oops! The lending of ${amount} ${tokenSymbol} failed.`;
              updateLastAiMessage(res?.message || statusMessage);
              setExecutingAave(false);
              return;
            }
          }

          // Mantle Bridge: Deposit MNT (L1 -> L2)
          if (toolMessage?.type === "mantle_deposit_mnt") {
            const { amount, recipient, minGasLimit } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for bridging MNT. Please try again." },
              ]);
              return;
            }

            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Bridging ${amount} MNT from Ethereum to Mantle... Please confirm the transaction.`,
              },
            ]);

            setExecutingMantle(true);

            try {
              const result = await depositMNT({
                amount,
                recipient: recipient || undefined,
                minGasLimit: minGasLimit || 200000,
              });

              if (result.success && result.txHash) {
                const explorerUrl = `https://etherscan.io/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "mantleBridgeAgent",
                  "BRIDGE",
                  `Bridged ${amount} MNT from Ethereum to Mantle`,
                  "Ethereum",
                  new Date(),
                  "MNT",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "MNT",
                  "Mantle Bridge Agent"
                );

                const statusMessage = `Successfully bridged ${amount} MNT from Ethereum to Mantle! The funds will arrive in ~10-20 minutes. [View on Etherscan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Bridging MNT failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Mantle deposit MNT error:", err);
              updateLastAiMessage(err?.message || "Bridging MNT failed. Please try again.");
            } finally {
              setExecutingMantle(false);
            }
            return;
          }

          // Mantle Bridge: Deposit ETH (L1 -> L2)
          if (toolMessage?.type === "mantle_deposit_eth") {
            const { amount, recipient, minGasLimit } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for bridging ETH. Please try again." },
              ]);
              return;
            }

            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Bridging ${amount} ETH from Ethereum to Mantle... Please confirm the transaction.`,
              },
            ]);

            setExecutingMantle(true);

            try {
              const result = await depositETH({
                amount,
                recipient: recipient || undefined,
                minGasLimit: minGasLimit || 200000,
              });

              if (result.success && result.txHash) {
                const explorerUrl = `https://etherscan.io/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "mantleBridgeAgent",
                  "BRIDGE",
                  `Bridged ${amount} ETH from Ethereum to Mantle`,
                  "Ethereum",
                  new Date(),
                  "ETH",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "ETH",
                  18,
                  "ETH",
                  "Mantle Bridge Agent"
                );

                const statusMessage = `Successfully bridged ${amount} ETH from Ethereum to Mantle! The funds will arrive in ~10-20 minutes. [View on Etherscan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Bridging ETH failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Mantle deposit ETH error:", err);
              updateLastAiMessage(err?.message || "Bridging ETH failed. Please try again.");
            } finally {
              setExecutingMantle(false);
            }
            return;
          }

          // Mantle Bridge: Withdraw MNT (L2 -> L1)
          if (toolMessage?.type === "mantle_withdraw_mnt") {
            const { amount, recipient, minGasLimit } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for bridging MNT. Please try again." },
              ]);
              return;
            }

            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Bridging ${amount} MNT from Mantle to Ethereum... Please confirm the transaction.`,
              },
            ]);

            setExecutingMantle(true);

            try {
              const result = await withdrawMNT({
                amount,
                recipient: recipient || undefined,
                minGasLimit: minGasLimit || 200000,
              });

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "mantleBridgeAgent",
                  "BRIDGE",
                  `Initiated withdrawal of ${amount} MNT from Mantle to Ethereum`,
                  "Mantle",
                  new Date(),
                  "MNT",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "MNT",
                  "Mantle Bridge Agent"
                );

                const statusMessage = `Successfully initiated bridge of ${amount} MNT from Mantle to Ethereum! After the 7-day challenge period, you'll need to prove and finalize on L1. [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Bridging MNT failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Mantle withdraw MNT error:", err);
              updateLastAiMessage(err?.message || "Bridging MNT failed. Please try again.");
            } finally {
              setExecutingMantle(false);
            }
            return;
          }

          // Mantle Bridge: Withdraw ETH (L2 -> L1)
          if (toolMessage?.type === "mantle_withdraw_eth") {
            const { amount, recipient, minGasLimit } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for bridging WETH. Please try again." },
              ]);
              return;
            }

            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Bridging ${amount} WETH from Mantle to Ethereum... Please confirm the transaction.`,
              },
            ]);

            setExecutingMantle(true);

            try {
              const result = await withdrawETH({
                amount,
                recipient: recipient || undefined,
                minGasLimit: minGasLimit || 200000,
              });

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "mantleBridgeAgent",
                  "BRIDGE",
                  `Initiated withdrawal of ${amount} ETH from Mantle to Ethereum`,
                  "Mantle",
                  new Date(),
                  "ETH",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "ETH",
                  "Mantle Bridge Agent"
                );

                const statusMessage = `Successfully initiated bridge of ${amount} WETH from Mantle to Ethereum! After the 7-day challenge period, you'll need to prove and finalize on L1. [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Bridging WETH failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Mantle withdraw ETH error:", err);
              updateLastAiMessage(err?.message || "Bridging WETH failed. Please try again.");
            } finally {
              setExecutingMantle(false);
            }
            return;
          }

          // Mantle: Wrap MNT to WMNT
          if (toolMessage?.type === "mantle_wrap_mnt") {
            const { amount } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for wrapping MNT. Please try again." },
              ]);
              return;
            }

            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Wrapping ${amount} MNT to WMNT on Mantle... Please confirm the transaction.`,
              },
            ]);

            setExecutingMantle(true);

            try {
              const result = await wrapMNT(amount);

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "mantleWrapAgent",
                  "SWAP",
                  `Wrapped ${amount} MNT to WMNT`,
                  "Mantle",
                  new Date(),
                  "MNT",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "WMNT",
                  "Mantle Wrap Agent"
                );

                const statusMessage = `Successfully wrapped ${amount} MNT to WMNT! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "MNT wrapping failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Mantle wrap MNT error:", err);
              updateLastAiMessage(err?.message || "MNT wrapping failed. Please try again.");
            } finally {
              setExecutingMantle(false);
            }
            return;
          }

          // Mantle: Unwrap WMNT to MNT
          if (toolMessage?.type === "mantle_unwrap_mnt") {
            const { amount } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for unwrapping WMNT. Please try again." },
              ]);
              return;
            }

            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Unwrapping ${amount} WMNT to MNT on Mantle... Please confirm the transaction.`,
              },
            ]);

            setExecutingMantle(true);

            try {
              const result = await unwrapMNT(amount);

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "mantleWrapAgent",
                  "SWAP",
                  `Unwrapped ${amount} WMNT to MNT`,
                  "Mantle",
                  new Date(),
                  "WMNT",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "MNT",
                  "Mantle Wrap Agent"
                );

                const statusMessage = `Successfully unwrapped ${amount} WMNT to MNT! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "WMNT unwrapping failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Mantle unwrap MNT error:", err);
              updateLastAiMessage(err?.message || "WMNT unwrapping failed. Please try again.");
            } finally {
              setExecutingMantle(false);
            }
            return;
          }

          // Mantle: Get MNT Balances
          if (toolMessage?.type === "mantle_get_mnt_balances") {
            const { network } = toolMessage.params;

            setMessages((prev) => [
              ...prev,
              { role: "ai", message: "Fetching your MNT balances..." },
            ]);

            try {
              const balances = await getMNTBalances(network || undefined);

              if (balances) {
                const statusMessage = `**Your MNT Balances:**\n\n- **Ethereum L1:** ${parseFloat(balances.l1Balance).toFixed(6)} MNT\n- **Mantle L2:** ${parseFloat(balances.l2Balance).toFixed(6)} MNT`;
                updateLastAiMessage(statusMessage);
              } else {
                updateLastAiMessage("Unable to fetch MNT balances. Please make sure your wallet is connected.");
              }
            } catch (err: any) {
              console.error("Get MNT balances error:", err);
              updateLastAiMessage(err?.message || "Failed to fetch MNT balances.");
            }
            return;
          }

          // Mantle: Get ETH Balances
          if (toolMessage?.type === "mantle_get_eth_balances") {
            const { network } = toolMessage.params;

            setMessages((prev) => [
              ...prev,
              { role: "ai", message: "Fetching your ETH balances..." },
            ]);

            try {
              const balances = await getETHBalances(network || undefined);

              if (balances) {
                const statusMessage = `**Your ETH Balances:**\n\n- **Ethereum L1:** ${parseFloat(balances.l1Balance).toFixed(6)} ETH\n- **Mantle L2 (WETH):** ${parseFloat(balances.l2Balance).toFixed(6)} WETH`;
                updateLastAiMessage(statusMessage);
              } else {
                updateLastAiMessage("Unable to fetch ETH balances. Please make sure your wallet is connected.");
              }
            } catch (err: any) {
              console.error("Get ETH balances error:", err);
              updateLastAiMessage(err?.message || "Failed to fetch ETH balances.");
            }
            return;
          }

          // Mantle: Get Gas Price Info
          if (toolMessage?.type === "mantle_get_gas_price_info") {
            setMessages((prev) => [
              ...prev,
              { role: "ai", message: "Fetching Mantle network gas price info..." },
            ]);

            try {
              const gasInfo = await getGasPriceInfo();

              if (gasInfo) {
                const statusMessage = `**Mantle Network Gas Info:**\n\n- **L2 Gas Price:** ${gasInfo.l2GasPrice}\n- **L1 Base Fee:** ${gasInfo.l1BaseFee}\n- **Overhead:** ${gasInfo.overhead}\n- **Scalar:** ${gasInfo.scalar}\n- **Token Ratio:** ${gasInfo.tokenRatio}`;
                updateLastAiMessage(statusMessage);
              } else {
                updateLastAiMessage("Unable to fetch gas price info. Please try again later.");
              }
            } catch (err: any) {
              console.error("Get gas price info error:", err);
              updateLastAiMessage(err?.message || "Failed to fetch gas price info.");
            }
            return;
          }

          // =====================================
          // Lendle Protocol Handlers
          // =====================================

          // Lendle: Deposit Token
          if (toolMessage?.type === "lendle_deposit") {
            const { asset, amount, onBehalfOf, referralCode } = toolMessage.params;

            if (!asset || !amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing asset or amount for Lendle deposit. Please try again." },
              ]);
              return;
            }

            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Depositing ${amount} tokens into Lendle on Mantle... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await lendleDeposit({
                asset,
                amount,
                onBehalfOf: onBehalfOf || undefined,
                referralCode: referralCode || 0,
              });

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "LEND",
                  `Deposited ${amount} tokens into Lendle`,
                  "Mantle",
                  new Date(),
                  "TOKEN",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "lToken",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully deposited ${amount} tokens into Lendle! You are now earning interest. [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Lendle deposit failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle deposit error:", err);
              updateLastAiMessage(err?.message || "Lendle deposit failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Deposit MNT
          if (toolMessage?.type === "lendle_deposit_mnt") {
            const { amount, onBehalfOf } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for Lendle MNT deposit. Please try again." },
              ]);
              return;
            }

            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Depositing ${amount} MNT into Lendle on Mantle... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await lendleDepositMNT(amount, onBehalfOf || undefined);

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "LEND",
                  `Deposited ${amount} MNT into Lendle`,
                  "Mantle",
                  new Date(),
                  "MNT",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "lMNT",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully deposited ${amount} MNT into Lendle! You are now earning interest. [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Lendle MNT deposit failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle deposit MNT error:", err);
              updateLastAiMessage(err?.message || "Lendle MNT deposit failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Withdraw Token
          if (toolMessage?.type === "lendle_withdraw") {
            const { asset, amount, to } = toolMessage.params;

            if (!asset || !amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing asset or amount for Lendle withdrawal. Please try again." },
              ]);
              return;
            }

            const displayAmount = amount.toLowerCase() === "max" ? "all" : amount;
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Withdrawing ${displayAmount} tokens from Lendle... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await lendleWithdraw({
                asset,
                amount,
                to: to || undefined,
              });

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "WITHDRAW",
                  `Withdrew ${displayAmount} tokens from Lendle`,
                  "Mantle",
                  new Date(),
                  "TOKEN",
                  amount.toLowerCase() === "max" ? 0 : parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "TOKEN",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully withdrew ${displayAmount} tokens from Lendle! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Lendle withdrawal failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle withdraw error:", err);
              updateLastAiMessage(err?.message || "Lendle withdrawal failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Withdraw MNT
          if (toolMessage?.type === "lendle_withdraw_mnt") {
            const { amount, to } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for Lendle MNT withdrawal. Please try again." },
              ]);
              return;
            }

            const displayAmount = amount.toLowerCase() === "max" ? "all" : amount;
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Withdrawing ${displayAmount} MNT from Lendle... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await lendleWithdrawMNT(amount, to || undefined);

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "WITHDRAW",
                  `Withdrew ${displayAmount} MNT from Lendle`,
                  "Mantle",
                  new Date(),
                  "MNT",
                  amount.toLowerCase() === "max" ? 0 : parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "MNT",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully withdrew ${displayAmount} MNT from Lendle! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Lendle MNT withdrawal failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle withdraw MNT error:", err);
              updateLastAiMessage(err?.message || "Lendle MNT withdrawal failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Borrow Token
          if (toolMessage?.type === "lendle_borrow") {
            const { asset, amount, interestRateMode, onBehalfOf, referralCode } = toolMessage.params;

            if (!asset || !amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing asset or amount for Lendle borrow. Please try again." },
              ]);
              return;
            }

            const rateType = interestRateMode === 1 ? "Stable" : "Variable";
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Borrowing ${amount} tokens from Lendle at ${rateType} rate... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await lendleBorrow({
                asset,
                amount,
                interestRateMode: interestRateMode || 2,
                onBehalfOf: onBehalfOf || undefined,
                referralCode: referralCode || 0,
              });

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "BORROW",
                  `Borrowed ${amount} tokens from Lendle at ${rateType} rate`,
                  "Mantle",
                  new Date(),
                  "TOKEN",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "TOKEN",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully borrowed ${amount} tokens from Lendle at ${rateType} rate! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Lendle borrow failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle borrow error:", err);
              updateLastAiMessage(err?.message || "Lendle borrow failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Borrow MNT
          if (toolMessage?.type === "lendle_borrow_mnt") {
            const { amount, interestRateMode } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for Lendle MNT borrow. Please try again." },
              ]);
              return;
            }

            const rateType = interestRateMode === 1 ? "Stable" : "Variable";
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Borrowing ${amount} MNT from Lendle at ${rateType} rate... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await lendleBorrowMNT(amount, interestRateMode || 2);

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "BORROW",
                  `Borrowed ${amount} MNT from Lendle at ${rateType} rate`,
                  "Mantle",
                  new Date(),
                  "MNT",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "MNT",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully borrowed ${amount} MNT from Lendle at ${rateType} rate! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Lendle MNT borrow failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle borrow MNT error:", err);
              updateLastAiMessage(err?.message || "Lendle MNT borrow failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Repay Token
          if (toolMessage?.type === "lendle_repay") {
            const { asset, amount, rateMode, onBehalfOf } = toolMessage.params;

            if (!asset || !amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing asset or amount for Lendle repay. Please try again." },
              ]);
              return;
            }

            const displayAmount = amount.toLowerCase() === "max" ? "all" : amount;
            const rateType = rateMode === 1 ? "Stable" : "Variable";
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Repaying ${displayAmount} tokens on Lendle (${rateType} rate)... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await lendleRepay({
                asset,
                amount,
                rateMode: rateMode || 2,
                onBehalfOf: onBehalfOf || undefined,
              });

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "REPAY",
                  `Repaid ${displayAmount} tokens on Lendle`,
                  "Mantle",
                  new Date(),
                  "TOKEN",
                  amount.toLowerCase() === "max" ? 0 : parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "TOKEN",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully repaid ${displayAmount} tokens on Lendle! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Lendle repay failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle repay error:", err);
              updateLastAiMessage(err?.message || "Lendle repay failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Repay MNT
          if (toolMessage?.type === "lendle_repay_mnt") {
            const { amount, rateMode, onBehalfOf } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for Lendle MNT repay. Please try again." },
              ]);
              return;
            }

            const displayAmount = amount.toLowerCase() === "max" ? "all" : amount;
            const rateType = rateMode === 1 ? "Stable" : "Variable";
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Repaying ${displayAmount} MNT on Lendle (${rateType} rate)... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await lendleRepayMNT(amount, rateMode || 2, onBehalfOf || undefined);

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "REPAY",
                  `Repaid ${displayAmount} MNT on Lendle`,
                  "Mantle",
                  new Date(),
                  "MNT",
                  amount.toLowerCase() === "max" ? 0 : parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "MNT",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully repaid ${displayAmount} MNT on Lendle! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Lendle MNT repay failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle repay MNT error:", err);
              updateLastAiMessage(err?.message || "Lendle MNT repay failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Get User Account Data
          if (toolMessage?.type === "lendle_get_user_account_data") {
            const { userAddress } = toolMessage.params;

            setMessages((prev) => [
              ...prev,
              { role: "ai", message: "Fetching your Lendle account data..." },
            ]);

            try {
              const accountData = await lendleGetUserAccountData(userAddress || undefined);

              if (accountData) {
                const statusMessage = `**Your Lendle Account Data:**\n\n` +
                  `- **Total Collateral:** $${parseFloat(accountData.totalCollateralETH).toFixed(6)}\n` +
                  `- **Total Debt:** $${parseFloat(accountData.totalDebtETH).toFixed(6)}\n` +
                  `- **Available to Borrow:** $${parseFloat(accountData.availableBorrowsETH).toFixed(6)}\n` +
                  `- **Liquidation Threshold:** ${accountData.currentLiquidationThreshold}%\n` +
                  `- **Loan-to-Value:** ${accountData.ltv}%\n` +
                  `- **Health Factor:** ${accountData.healthFactor}`;
                updateLastAiMessage(statusMessage);
              } else {
                updateLastAiMessage("Unable to fetch Lendle account data. Please make sure your wallet is connected.");
              }
            } catch (err: any) {
              console.error("Lendle get user account data error:", err);
              updateLastAiMessage(err?.message || "Failed to fetch Lendle account data.");
            }
            return;
          }

          // Lendle: Get User Reserve Data
          if (toolMessage?.type === "lendle_get_user_reserve_data") {
            let { asset, userAddress } = toolMessage.params;

            if (!asset) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing asset for Lendle reserve data. Please try again." },
              ]);
              return;
            }

            // Handle native MNT - use WMNT address instead
            const assetLower = asset.toLowerCase();
            if (assetLower === "native" || assetLower === "mnt" || assetLower === "mantle") {
              asset = LENDLE_ASSETS.WMNT;
            }

            setMessages((prev) => [
              ...prev,
              { role: "ai", message: "Fetching your Lendle reserve data..." },
            ]);

            try {
              const reserveData = await lendleGetUserReserveData(asset, userAddress || undefined);

              if (reserveData) {
                const statusMessage = `**Your Lendle Position:**\n\n` +
                  `- **Deposited (lToken Balance):** ${parseFloat(reserveData.currentATokenBalance).toFixed(6)}\n` +
                  `- **Stable Debt:** ${parseFloat(reserveData.currentStableDebt).toFixed(6)}\n` +
                  `- **Variable Debt:** ${parseFloat(reserveData.currentVariableDebt).toFixed(6)}\n` +
                  `- **Current APY:** ${reserveData.liquidityRate}%\n` +
                  `- **Used as Collateral:** ${reserveData.usageAsCollateralEnabled ? "Yes" : "No"}`;
                updateLastAiMessage(statusMessage);
              } else {
                updateLastAiMessage("Unable to fetch Lendle reserve data. Please make sure your wallet is connected.");
              }
            } catch (err: any) {
              console.error("Lendle get user reserve data error:", err);
              if (err?.message?.includes("InvalidAddressError") || err?.message?.includes("invalid") || err?.name === "InvalidAddressError") {
                updateLastAiMessage("I couldn't find your position data for that asset. Please make sure you're using a valid token symbol like USDC, USDT, WETH, or WMNT. For native MNT positions, check under WMNT (Wrapped MNT).");
              } else {
                updateLastAiMessage("I encountered an issue while fetching your reserve data. This might be due to network issues or the token not being supported on Lendle. Please try again.");
              }
            }
            return;
          }

          // Lendle: Get Reserve Data
          if (toolMessage?.type === "lendle_get_reserve_data") {
            let { asset } = toolMessage.params;

            if (!asset) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing asset for Lendle reserve data. Please try again." },
              ]);
              return;
            }

            // Handle native MNT - use WMNT address instead
            const assetLower = asset.toLowerCase();
            if (assetLower === "native" || assetLower === "mnt" || assetLower === "mantle") {
              asset = LENDLE_ASSETS.WMNT;
            }

            setMessages((prev) => [
              ...prev,
              { role: "ai", message: "Fetching Lendle reserve data..." },
            ]);

            try {
              const reserveData = await lendleGetReserveData(asset);

              if (reserveData) {
                const statusMessage = `**Lendle Reserve Data:**\n\n` +
                  `- **Available Liquidity:** ${parseFloat(reserveData.availableLiquidity).toFixed(6)}\n` +
                  `- **Total Stable Debt:** ${parseFloat(reserveData.totalStableDebt).toFixed(6)}\n` +
                  `- **Total Variable Debt:** ${parseFloat(reserveData.totalVariableDebt).toFixed(6)}\n` +
                  `- **Supply APY:** ${reserveData.liquidityRate}%\n` +
                  `- **Variable Borrow APY:** ${reserveData.variableBorrowRate}%\n` +
                  `- **Stable Borrow APY:** ${reserveData.stableBorrowRate}%\n` +
                  `- **Utilization Rate:** ${reserveData.utilizationRate}%`;
                updateLastAiMessage(statusMessage);
              } else {
                updateLastAiMessage("Unable to fetch Lendle reserve data. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle get reserve data error:", err);
              if (err?.message?.includes("InvalidAddressError") || err?.message?.includes("invalid") || err?.name === "InvalidAddressError") {
                updateLastAiMessage("I couldn't find reserve data for that asset. Please make sure you're using a valid token symbol like USDC, USDT, WETH, or WMNT. For native MNT, the data is shown under WMNT (Wrapped MNT).");
              } else {
                updateLastAiMessage("I encountered an issue while fetching the reserve data. This might be due to network issues or the token not being supported on Lendle. Please try again or check if the token is available on Lendle.");
              }
            }
            return;
          }

          // Lendle: Get Reserve Config Data
          if (toolMessage?.type === "lendle_get_reserve_config_data") {
            let { asset } = toolMessage.params;

            if (!asset) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing asset for Lendle reserve config. Please try again." },
              ]);
              return;
            }

            // Handle native MNT - use WMNT address instead
            const assetLower = asset.toLowerCase();
            if (assetLower === "native" || assetLower === "mnt" || assetLower === "mantle") {
              asset = LENDLE_ASSETS.WMNT;
            }

            setMessages((prev) => [
              ...prev,
              { role: "ai", message: "Fetching Lendle reserve configuration..." },
            ]);

            try {
              const configData = await lendleGetReserveConfigData(asset);

              if (configData) {
                const statusMessage = `**Lendle Reserve Configuration:**\n\n` +
                  `- **Decimals:** ${configData.decimals}\n` +
                  `- **Loan-to-Value:** ${configData.ltv}%\n` +
                  `- **Liquidation Threshold:** ${configData.liquidationThreshold}%\n` +
                  `- **Liquidation Bonus:** ${configData.liquidationBonus}%\n` +
                  `- **Reserve Factor:** ${configData.reserveFactor}%\n` +
                  `- **Can be Collateral:** ${configData.usageAsCollateralEnabled ? "Yes" : "No"}\n` +
                  `- **Borrowing Enabled:** ${configData.borrowingEnabled ? "Yes" : "No"}\n` +
                  `- **Stable Rate Enabled:** ${configData.stableBorrowRateEnabled ? "Yes" : "No"}\n` +
                  `- **Active:** ${configData.isActive ? "Yes" : "No"}\n` +
                  `- **Frozen:** ${configData.isFrozen ? "Yes" : "No"}`;
                updateLastAiMessage(statusMessage);
              } else {
                updateLastAiMessage("Unable to fetch Lendle reserve configuration. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle get reserve config error:", err);
              if (err?.message?.includes("InvalidAddressError") || err?.message?.includes("invalid") || err?.name === "InvalidAddressError") {
                updateLastAiMessage("I couldn't find configuration data for that asset. Please make sure you're using a valid token symbol like USDC, USDT, WETH, or WMNT. For native MNT, the data is shown under WMNT (Wrapped MNT).");
              } else {
                updateLastAiMessage("I encountered an issue while fetching the reserve configuration. This might be due to network issues or the token not being supported on Lendle. Please try again or check if the token is available on Lendle.");
              }
            }
            return;
          }

          // Lendle: Stake LEND
          if (toolMessage?.type === "lendle_stake_lend") {
            const { amount, lock } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for LEND staking. Please try again." },
              ]);
              return;
            }

            const lockText = lock ? " (locked)" : "";
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Staking ${amount} LEND tokens${lockText}... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await stakeLEND(amount, lock || false);

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "LEND",
                  `Staked ${amount} LEND tokens${lockText}`,
                  "Mantle",
                  new Date(),
                  "LEND",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "sLEND",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully staked ${amount} LEND tokens${lockText}! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "LEND staking failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle stake LEND error:", err);
              updateLastAiMessage(err?.message || "LEND staking failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Withdraw Staked LEND
          if (toolMessage?.type === "lendle_withdraw_staked_lend") {
            const { amount } = toolMessage.params;

            if (!amount) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: "Missing amount for LEND withdrawal. Please try again." },
              ]);
              return;
            }

            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Withdrawing ${amount} staked LEND tokens... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await withdrawStakedLEND(amount);

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "WITHDRAW",
                  `Withdrew ${amount} staked LEND tokens`,
                  "Mantle",
                  new Date(),
                  "LEND",
                  parseFloat(amount),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "LEND",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully withdrew ${amount} staked LEND tokens! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "LEND withdrawal failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle withdraw staked LEND error:", err);
              updateLastAiMessage(err?.message || "LEND withdrawal failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Claim Staking Rewards
          if (toolMessage?.type === "lendle_claim_staking_rewards") {
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Claiming LEND staking rewards... Please confirm the transaction.`,
              },
            ]);

            setExecutingLendle(true);

            try {
              const result = await lendleClaimStakingRewards();

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "LEND",
                  `Claimed LEND staking rewards`,
                  "Mantle",
                  new Date(),
                  "LEND",
                  0,
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "LEND",
                  "Lendle Agent"
                );

                const statusMessage = `Successfully claimed LEND staking rewards! [View on Mantlescan](${explorerUrl})`;

                await chat({
                  inputMessage: statusMessage,
                  agentName: currentThreadId || 'default-agent',
                  userId: user?.id ?? '',
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);

                setTimeout(() => {
                  if (currentThreadId) fetchHistory();
                }, 1500);
              } else {
                updateLastAiMessage(result.message || "Claiming rewards failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle claim staking rewards error:", err);
              updateLastAiMessage(err?.message || "Claiming rewards failed. Please try again.");
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Get Staking Info
          if (toolMessage?.type === "lendle_get_staking_info") {
            const { userAddress } = toolMessage.params;

            setMessages((prev) => [
              ...prev,
              { role: "ai", message: "Fetching your LEND staking info..." },
            ]);

            try {
              const stakingInfo = await lendleGetStakingInfo(userAddress || undefined);

              if (stakingInfo) {
                const statusMessage = `**Your LEND Staking Info:**\n\n` +
                  `- **Total Staked:** ${parseFloat(stakingInfo.totalStaked).toFixed(6)} LEND\n` +
                  `- **Locked Balance:** ${parseFloat(stakingInfo.lockedBalance).toFixed(6)} LEND\n` +
                  `- **Unlockable Balance:** ${parseFloat(stakingInfo.unlockableBalance).toFixed(6)} LEND\n` +
                  `- **Withdrawable Amount:** ${parseFloat(stakingInfo.withdrawableAmount).toFixed(6)} LEND\n` +
                  `- **Penalty if Early Withdraw:** ${parseFloat(stakingInfo.penaltyAmount).toFixed(6)} LEND\n` +
                  `- **Earned Rewards:** ${parseFloat(stakingInfo.earnedRewards).toFixed(6)} LEND`;
                updateLastAiMessage(statusMessage);
              } else {
                updateLastAiMessage("Unable to fetch LEND staking info. Please make sure your wallet is connected.");
              }
            } catch (err: any) {
              console.error("Lendle get staking info error:", err);
              updateLastAiMessage(err?.message || "Failed to fetch LEND staking info.");
            }
            return;
          }

          // Handle errors in tool response
          if (toolMessage?.error) {
            if (toolMessage?.error?.includes("No routes found")) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Hey! It looks like there are no available routes right now. This can happen if there's low liquidity, the amount is too small, gas fees are too high, or the token pair doesn't have a valid route. Try adjusting the amount or selecting a different combination!`,
                },
              ]);
              return;
            }
            setMessages((prev) => [
              ...prev,
              { role: "ai", message: `${toolMessage?.error}` },
            ]);
            return;
          }

          // If generic tool response (for unhandled tool types)
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              message: "Tool Response:\n```json\n" +
                JSON.stringify(toolMessage, null, 2) +
                "\n```",
            },
          ]);
        }

        // Handle regular AI message (only if no tool response was handled)
        if (response?.data?.ai_message && response?.data?.ai_message !== "None") {
          const aiMessage: Message = {
            role: "ai",
            message: response.data.ai_message,
          };
          setMessages((prev) => [...prev, aiMessage]);
        }

        // Refresh conversation from backend to ensure sync
        setTimeout(() => {
          if (currentThreadId) {
            fetchHistory();
          }
        }, 1000);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", message: response?.message || "Something went wrong!" },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", message: "Something went wrong!" },
      ]);
    } finally {
      setIsLoading(false);
      setExecutingLifi(false);
      setExecutingAave(false);
      setExecutingMantle(false);
      setExecutingLendle(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  return (
    <Card className="w-full h-[calc(100vh-16rem)] bg-[#030303] border-[#1a1a1a] shadow-2xl">
      <CardHeader className="border-b border-[#1a1a1a] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <MessageCircle className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Unified DeFi Assistant</h3>
              <p className="text-xs text-gray-400">Swap, Bridge, Lend - All in One Chat</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              onClick={clearChatHistory}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {currentThreadId && (
          <Badge variant="outline" className="mt-2 text-xs">
            Session: {currentThreadId.slice(0, 8)}...
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-0 h-[calc(100%-8rem)]">
        <ScrollArea className="h-full p-4">
          {!isWalletConnected ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Wallet className="h-12 w-12 text-gray-400" />
              <p className="text-gray-400">Connect your wallet to start</p>
              <Button onClick={onConnect} className="bg-gradient-to-r from-purple-500 to-blue-500">
                Connect Wallet
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h4 className="text-lg font-semibold text-white">Welcome to Unified DeFi Chat!</h4>
                <p className="text-sm text-gray-400">
                  Execute any DeFi operation in natural language - no need to switch between agents
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">Try these commands:</p>
                <div className="flex flex-wrap gap-2">
                  {quickCommands.map((cmd, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickCommand(cmd)}
                      className="text-xs border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-300"
                    >
                      {cmd}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "human" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === "human"
                        ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30"
                        : "bg-[#0a0a0a] border border-[#1a1a1a]"
                    }`}
                  >
                    <MarkdownToJSX className="text-sm text-white prose prose-invert prose-sm max-w-none">
                      {msg.message}
                    </MarkdownToJSX>
                  </div>
                </div>
              ))}
              {(isLoading || isExecutingLifi || isExecutingAave || isSwapping || isExecutingMantle || isExecutingLendle) && (
                <div className="flex justify-start">
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse flex gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
                      </div>
                      <span className="text-sm text-gray-400">Processing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t border-[#1a1a1a] p-4">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Ask me anything about DeFi operations..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !isWalletConnected}
            className="flex-1 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-purple-500/50"
          />
          <Button
            onClick={handleChat}
            disabled={isLoading || !inputValue.trim() || !isWalletConnected}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};