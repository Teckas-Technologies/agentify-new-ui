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

const MarkdownToJSX = dynamic(() => import("markdown-to-jsx"), { ssr: false });

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

          // Handle errors in tool response
          if (toolMessage?.error) {
            if (toolMessage?.error?.includes("No routes found")) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Hey! It looks like there are no available routes right now. This can happen if there's low liquidity, the amount is too small, gas fees are too high, or the token pair doesn't have a valid route. Try adjusting the amount or selecting a different combination! 😊`,
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
        }

        // Handle regular AI message (only if no tool response was handled)
        if (response?.data?.ai_message) {
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
              {(isLoading || isExecutingLifi || isExecutingAave || isSwapping) && (
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