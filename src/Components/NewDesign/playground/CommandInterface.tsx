import { Send, Wallet, MessageCircle, Zap, Trash2, Heart } from "lucide-react";
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
  Agent,
  MarketType,
  Message,
  RequestFields,
  TransactionType,
  TransactionStatus,
  RequestFieldsv2,
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
import AgentSelector from "./AgentSelector";
import { formatUnits } from "ethers/lib/utils";
import { marketConfigs } from "@/utils/markets";
import { ChainType, EVM, config, createConfig, getChains } from "@lifi/sdk";
import { useBeraSwap } from "@/hooks/useBeraSwap";
import { AgentCommand } from "../Dashboard/Dashboard";
import { useToast } from "@/hooks/use-toast";

const MarkdownToJSX = dynamic(() => import("markdown-to-jsx"), { ssr: false });

interface CommandInterfaceProps {
  selectedAgent: Agent | null;
  isWalletConnected?: boolean;
  onConnect?: () => void;
  onSelectAgent: (id: Agent) => void;
  initialAgents?: Agent[];
}

export const CommandInterface = ({
  selectedAgent,
  isWalletConnected = false,
  onConnect = () => { },
  onSelectAgent,
  initialAgents,
}: CommandInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExecutingLifi, setExecutingLifi] = useState(false);
  const [isExecutingAave, setExecutingAave] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [savedCommands, setSavedCommands] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const { address } = useAccount();
  const { user } = usePrivy();
  const { toast } = useToast();
  const {
    chat,
    fetchChatHistory,
    clearHistory,
    updateMessage,
    sendAgentCommand,
    getAgentCommands,
    deleteAgentCommand,
  } = useChat();
  const { executeLifi, validateTokenBalance } = useLifiHook();
  const { supplyToAave, withdrawFromAave, borrowToAave, repayToAave } =
    useAaveHook();
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

  useEffect(() => {
    if (messages && messages?.length > 3) {
      // Scroll to bottom when messages update
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setModelOpen(false);
      }
    };

    if (modelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modelOpen]);

  useEffect(() => {
    if (!address || !user) {
      setMessages([]);
    }
  }, [address, user]);

  useEffect(() => {
    if (address && user) {
      fetchHistory();
    }
  }, [address, selectedAgent, user]);

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

  const saveCommand = async (command: string, index: number) => {
    try {
      if (!user?.id || !selectedAgent) return;
      const res = await sendAgentCommand(
        user?.id,
        selectedAgent?.agentId,
        selectedAgent?.name,
        command
      );

      setSavedCommands((prev) => [...prev, command]);
      // setFavoritedIndexes((prev) => {
      //     const currentAgentId = selectedAgent.agentId;
      //     const agentFavorites = prev[currentAgentId] || [];

      //     return {
      //         ...prev,
      //         [currentAgentId]: agentFavorites.includes(index)
      //             ? agentFavorites // already favorited, no duplicate
      //             : [...agentFavorites, index], // add new
      //     };
      // });
    } catch (error) {
      console.error("Error saving command:", error);
    }
  };

  const deleteCommand = async (command: string) => {
    try {
      if (!user?.id || !selectedAgent) return;
      const res = await deleteAgentCommand({
        userId: user?.id ,
        agentId: selectedAgent?.agentId,
        command,
      });
      setSavedCommands((prevCommands) =>
        prevCommands.filter((cmd) => cmd !== command)
      );
    } catch (error) {
      console.error("Error deleting command:", error);
      // Optionally, you can show an error message to the user
    }
  };

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

  const fetchHistory = useCallback(async () => {
    try {
      if (!address || !selectedAgent?.agentId) return;
      const history = await fetchChatHistory(selectedAgent?.agentId);
      const filteredMessages = history?.message?.filter(
        (msg: Message) => msg.message.trim() !== "" && msg.role !== "tool"
      );

      setMessages(filteredMessages ?? []);

      const cmds = await getAgentCommands(selectedAgent.agentId);
      if (cmds && Array.isArray(cmds?.data?.data)) {
        setSavedCommands(cmds?.data?.data?.map((cmd: AgentCommand) => cmd.command));
      }

    } catch (error) {
      console.error("Error fetching history or commands:", error);

      toast({
        title: "Error!",
        description: "Cannot fetch your chat history for this agent.",
        variant: "destructive",
      });
    }
  }, [address, selectedAgent, user]);

  const clearChatHistory = async () => {
    try {
      if (!address || !selectedAgent?.agentId) return;
      const res = await clearHistory(selectedAgent?.agentId);
      if (res?.success) {
        setMessages([]);
        toast({
          title: "Chat History Cleared!",
          description: "Chat history with this agent was cleared successfully.",
          variant: "default",
        });
      } else {
        toast({
          title: "Failed to Clear History",
          description: "Unable to clear chat history. Please try again later.",
          variant: "destructive",
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

  const handleChat = async () => {
    if (!inputValue.trim()) {
      return;
    }
    if (isLoading) {
      return;
    }

    if (!address) {
      return;
    }

    if (!selectedAgent) {
      return;
    }

    const enrichedMessage = JSON.stringify({
      message: inputValue,
      context: {
        fromAddress: address
      },
    });
    // Set only the message part in the frontend message array
    const userMessage: Message = {
      role: "human",
      message: JSON.parse(enrichedMessage).message,
    };
    setMessages((prev) => (Array.isArray(prev) ? [...prev, userMessage] : [userMessage]));
    setInputValue(""); // Clear input field

    setIsLoading(true);

    try {
      const response = await chat({
        inputMessage: enrichedMessage,
        agentName: selectedAgent?.agentId,
        userId: user?.id ?? '',
        isTransaction: false,
      });
      if (response?.success) {
        if (response?.data?.tool_response !== "None") {
          if (!response?.data?.tool_response) return;
          const toolMessage = JSON.parse(response?.data?.tool_response);
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
              // const chainInfo = await getChainInfoById(berachainId);

              // ✅ Conditional balance validation based on the fromToken
              let hasSufficientBalance;
              if (fromToken === "BERA") {
                // Use native token balance validation
                hasSufficientBalance = await validateNativeTokenBalance(
                  BigInt(parsedFromAmount)
                );
              } else {
                // Use token balance validation for other tokens
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

              // ✅ Show message before initiating the swap
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
                  address,
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
                await chat({
                  inputMessage: statusMessage,
                  agentName: selectedAgent?.agentId,
                  userId: address,
                  isTransaction: true,
                });
                updateLastAiMessage(statusMessage);
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
              const explorerUrl = `https://berascan.com/tx`;
              await createTrans(
                address,
                "berachainSwapAgent",
                "SWAP",
                `Failed swap: ${from} to ${to}`,
                "Berachain",
                new Date(),
                fromToken,
                fromAmount,
                `failed_${uuidv4()}`,
                `${explorerUrl}/tx/failed`,
                "FAILED",
                0,
                0,
                "Berachain Swap Agent"
              );
            }
            return;
          }

          if (toolMessage?.type === "lend") {
            const { market, tokenSymbol, amount, explorer } = toolMessage;
            if (!market || !tokenSymbol || !amount) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Required Fields are incorrect or missing!`,
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
                message: `Executing lend for ${amount} ${tokenSymbol}, don't close the page until get confirmations...`,
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
                console.error(
                  "Chain info not found for chainId:",
                  selectedMarket.chainId
                );
                return;
              }

              const { nativeTokenSymbol, rpcUrl, decimals, chainName } =
                chainInfo;
              await createTransv2(
                address,
                "lendingBorrowingAgent",
                "LEND",
                `Lending ${amount} ${tokenSymbol} executed successfully`,
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

              const statusMessage = `Your lending of ${amount} ${tokenSymbol} was successful. 🎉 You can check the transaction on the [explorer](${explorer}tx/${res?.txHashes[0]}).`;
              // await updateMessage(
              //     address,
              //     selectedAgent.agentId,
              //     JSON.stringify({
              //         type: "tool",
              //         status: "success",
              //         message: statusMessage,
              //     })
              // );
              await chat({
                inputMessage: statusMessage,
                agentName: selectedAgent?.agentId,
                userId: address,
                isTransaction: true,
              });

              updateLastAiMessage(statusMessage);
              setExecutingAave(false);
              return;
            } else {
              await createTrans(
                address,
                "lendingBorrowingAgent",
                "LEND",
                `Lending ${tokenSymbol} execution was failed`,
                chainInfo?.chainName || "",
                new Date(),
                tokenSymbol,
                amount,
                `failed_${uuidv4()}`,
                `${explorer}tx/failed`,
                "FAILED",
                0,
                0,
                "Lend and Borrow agent"
              );

              const statusMessage = `Oops! Your lending ${amount} ${tokenSymbol} execution was failed!`;
              await chat({
                inputMessage: res?.message || statusMessage,
                agentName: selectedAgent?.agentId,
                userId: address,
                isTransaction: true,
              });

              updateLastAiMessage(res?.message || statusMessage);
              setExecutingAave(false);
              return;
            }
          } else if (toolMessage?.type === "borrow") {
            const { market, tokenSymbol, amount, explorer } = toolMessage;
            if (!market || !tokenSymbol || !amount) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Required Fields are incorrect or missing!`,
                },
              ]);
              return;
            }
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Executing borrow for ${amount} ${tokenSymbol}, don't close the page until get confirmations...`,
              },
            ]);
            setExecutingAave(true);

            const res = await borrowToAave({
              market: MarketType[market as keyof typeof MarketType],
              tokenSymbol: tokenSymbol,
              amount: amount.toString(),
            });
            const marketType: MarketType = market;
            const selectedMarket = marketConfigs[marketType];
            const chainInfo = await getChainInfoById(selectedMarket.chainId);

            if (res?.success && res?.txHashes && res?.txHashes?.length > 0) {
              const chainInfo = await getChainInfoById(selectedMarket.chainId);

              if (!chainInfo) {
                console.error("Chain info not found for chainId:", selectedMarket.chainId);
                return;
              }

              await createTransv2(
                address,
                "lendingBorrowingAgent",
                "BORROW",
                `Borrow ${amount} ${tokenSymbol} executed successfully`,
                chainInfo.chainName,
                new Date(),
                tokenSymbol,
                amount,
                res?.txHashes[0],
                `${explorer}tx/${res?.txHashes[0]}`,
                "SUCCESS",
                chainInfo.rpcUrl,
                chainInfo.nativeTokenSymbol,
                chainInfo.decimals,
                tokenSymbol,
                "Lend and Borrow agent"
              );

              const statusMessage = `Great! You've successfully borrowed ${amount} ${tokenSymbol}. 🎉 You can check the transaction on the [explorer](${explorer}tx/${res?.txHashes[0]}).`;
              await chat({
                inputMessage: statusMessage,
                agentName: selectedAgent?.agentId,
                userId: address,
                isTransaction: true,
              });

              updateLastAiMessage(statusMessage);
              setExecutingAave(false);
              return;
            } else {
              await createTrans(
                address,
                "lendingBorrowingAgent",
                "BORROW",
                `Borrow ${tokenSymbol} execution was failed`,
                chainInfo?.chainName || "",
                new Date(),
                tokenSymbol,
                amount,
                `failed_${uuidv4()}`,
                `${explorer}tx/failed`,
                "FAILED",
                0,
                0,
                "Lend and Borrow agent"
              );

              let statusMessage = `Oops! The borrowing of ${amount} ${tokenSymbol} failed.`;

              if (res?.message?.includes("UNPREDICTABLE_GAS_LIMIT")) {
                statusMessage = `Transaction failed due to low gas funds. Please ensure your wallet has enough native tokens to cover gas fees.`;
              }
              await chat({
                inputMessage: res?.message || statusMessage,
                agentName: selectedAgent?.agentId,
                userId: address,
                isTransaction: true,
              });

              updateLastAiMessage(res?.message || statusMessage);
              setExecutingAave(false);
              return;
            }
          } else if (toolMessage?.type === "withdraw") {
            const { market, tokenSymbol, amount, explorer } = toolMessage;
            if (!market || !tokenSymbol || !amount) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Required Fields are incorrect or missing!`,
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
                message: `Executing withdraw for ${amount} ${tokenSymbol}, don't close the page until get confirmations...`,
              },
            ]);
            setExecutingAave(true);

            const res = await withdrawFromAave({
              market: MarketType[market as keyof typeof MarketType],
              tokenSymbol: tokenSymbol,
              amount: amount.toString(),
            });
            const chainInfo = await getChainInfoById(selectedMarket.chainId);
            if (res?.success && res?.txHashes && res?.txHashes?.length > 0) {
              if (!chainInfo) {
                console.error(
                  "Chain info not found for chainId:",
                  selectedMarket.chainId
                );
                return;
              }

              const { nativeTokenSymbol, rpcUrl, decimals, chainName } =
                chainInfo;
              await createTransv2(
                address,
                "lendingBorrowingAgent",
                "WITHDRAW",
                `Withdraw ${amount} ${tokenSymbol} executed successfully`,
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

              const statusMessage = `You’ve withdrawn ${amount} ${tokenSymbol} from your lending. 🎉 You can check the transaction on the [explorer](${explorer}tx/${res?.txHashes[0]}).`;
              await chat({
                inputMessage: statusMessage,
                agentName: selectedAgent?.agentId,
                userId: address,
                isTransaction: true,
              });

              updateLastAiMessage(statusMessage);
              setExecutingAave(false);
              return;
            } else {
              await createTrans(
                address,
                "lendingBorrowingAgent",
                "WITHDRAW",
                `Withdraw ${amount} ${tokenSymbol} was failed!`,
                chainInfo?.chainName || "",
                new Date(),
                tokenSymbol,
                amount,
                `failed_${uuidv4()}`,
                `${explorer}tx/failed`,
                "FAILED",
                0,
                0,
                "Lend and Borrow agent"
              );
              const statusMessage = `Oops! The withdrawal of ${amount} ${tokenSymbol} failed.`;
              await chat({
                inputMessage: res?.message || statusMessage,
                agentName: selectedAgent?.agentId,
                userId: address,
                isTransaction: true,
              });

              updateLastAiMessage(res?.message || statusMessage);
              setExecutingAave(false);
              return;
            }
          } else if (toolMessage?.type === "repay") {
            const { market, tokenSymbol, amount, onBehalfOf, explorer } = toolMessage;
            const marketType: MarketType = market;
            const selectedMarket = marketConfigs[marketType];

            // Push AI message before execution
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Executing repay for ${amount} ${tokenSymbol}, don't close the page until confirmations...`,
              },
            ]);

            setExecutingAave(true); // Optional: Add to indicate process ongoing

            const repayResult = await repayToAave({
              market,
              tokenSymbol,
              amount,
              onBehalfOf,
            });
            const chainInfo = await getChainInfoById(selectedMarket.chainId);

            if (Array.isArray(repayResult) && repayResult.length > 0) {
              const txHash = repayResult[0];

              if (!chainInfo) {
                console.error(
                  "Chain info not found for chainId:",
                  selectedMarket.chainId
                );
                return;
              }

              const { nativeTokenSymbol, rpcUrl, decimals, chainName } = chainInfo;
              await createTransv2(
                address,
                "lendingBorrowingAgent",
                "REPAY",
                `Repayment of ${amount} ${tokenSymbol} executed successfully`,
                chainName,
                new Date(),
                tokenSymbol,
                amount,
                txHash,
                `${explorer}tx/${txHash}`,
                "SUCCESS",
                rpcUrl,
                nativeTokenSymbol,
                decimals,
                tokenSymbol,
                "Lend and Borrow agent"
              );

              const statusMessage = `Repayment successful! 🎉\n\nYou can view the transaction on [explorer](${explorer}tx/${txHash}).`;

              await chat({
                inputMessage: statusMessage,
                agentName: selectedAgent?.agentId,
                userId: address,
                isTransaction: true,
              });

              updateLastAiMessage(statusMessage);
              setExecutingAave(false);
              return;
            }

            // Repayment failed
            await createTrans(
              address,
              "lendingBorrowingAgent",
              "REPAY",
              `Repayment of ${amount} ${tokenSymbol} failed!`,
              chainInfo?.chainName || "",
              new Date(),
              tokenSymbol,
              amount,
              `failed_${uuidv4()}`,
              `${explorer}tx/failed`,
              "FAILED",
              0,
              0,
              "Lend and Borrow agent"
            );

            const errorMessage =
              typeof repayResult === "object" &&
                !Array.isArray(repayResult) &&
                "message" in repayResult
                ? repayResult.message
                : `Repayment of ${amount} ${tokenSymbol} failed.`;

            await chat({
              inputMessage: errorMessage,
              agentName: selectedAgent?.agentId,
              userId: address,
              isTransaction: true,
            });

            updateLastAiMessage(errorMessage);
            setExecutingAave(false);
            return;
          } else if (
            toolMessage?.type === "swap" ||
            toolMessage?.type === "bridge"
          ) {
            const { quote, explorer } = toolMessage;

            if (quote) {
              const {
                fromChainId,
                fromAmountUSD,
                fromToken,
                toChainId,
                toToken,
                fromAmount,
                gasCostUSD,
              } = quote;
              if (
                wallet &&
                fromChainId &&
                parseInt(wallet.chainId.split(":")[1]) !== fromChainId
              ) {
                await switchNetwork(fromChainId);
              }
              const isEnoughBalance = await validateTokenBalance(
                fromChainId,
                fromToken,
                fromAmount
              );
              const chainInfo = await getChainInfoById(fromChainId);

              if (!chainInfo) {
                console.error("Chain info not found for chainId:", fromChainId);
                return;
              }

              if (!isEnoughBalance) {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "ai",
                    message: `Insufficient balance. Please check your wallet and try again.`,
                  },
                ]);
                return;
              }

              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Executing ${fromChainId.toString() === toChainId.toString()
                    ? "Swap"
                    : "Bridge"
                    }, don't close the page until get confirmations...`,
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
                const description =
                  fromChainId.toString() === toChainId.toString()
                    ? "swaping"
                    : "bridging";

                const formatedAmount = formatUnits(
                  fromAmount,
                  fromToken.decimals
                );

                const agentName =
                  fromChainId.toString() === toChainId.toString()
                    ? "Swap Agent"
                    : "Bridge Agent";

                await createTrans(
                  address,
                  agentId,
                  transaction_type,
                  `${fromChainId.toString() === toChainId.toString()
                    ? "Swap"
                    : "Bridge"
                  } ${formatedAmount} ${fromToken.symbol
                  } executed successfully!`,
                  chainInfo.chainName,
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

                const statusMessage = `Your ${fromChainId.toString() === toChainId.toString()
                  ? "Swap"
                  : "Bridge"
                  } was executed successfully!. 🎉 You can check the transaction on the [explorer](${explorer}tx/${response?.txHash
                  }).`;
                await chat({
                  inputMessage: statusMessage,
                  agentName: selectedAgent?.agentId,
                  userId: address,
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);
                setExecutingLifi(false);
                return;
              } else {
                const agentId =
                  fromChainId.toString() === toChainId.toString()
                    ? "swapAgent"
                    : "bridgeAgent";
                const transaction_type =
                  fromChainId.toString() === toChainId.toString()
                    ? "SWAP"
                    : "BRIDGE";
                const description =
                  fromChainId.toString() === toChainId.toString()
                    ? "swaping token"
                    : "bridging token";

                const agentName =
                  fromChainId.toString() === toChainId.toString()
                    ? "Swap Agent"
                    : "Bridge Agent";

                const formatedAmount = formatUnits(
                  fromAmount,
                  fromToken.decimals
                );

                await createTrans(
                  address,
                  agentId,
                  transaction_type,
                  `${fromChainId.toString() === toChainId.toString()
                    ? "Swap"
                    : "Bridge"
                  } ${formatedAmount} ${fromToken.symbol
                  } execution was failed!`,
                  chainInfo.chainName,
                  new Date(),
                  fromToken.symbol,
                  fromAmount,
                  response?.txHash || "",
                  `${explorer}tx/${response?.txHash}`,
                  "FAILED",
                  fromAmountUSD,
                  gasCostUSD,
                  agentName
                );

                const statusMessage = `Oops! ${fromChainId.toString() === toChainId.toString()
                  ? "Swap"
                  : "Bridge"
                  } execution was failed!.`;
                await chat({
                  inputMessage: statusMessage,
                  agentName: selectedAgent?.agentId,
                  userId: address,
                  isTransaction: true,
                });
                updateLastAiMessage(statusMessage);
                setExecutingLifi(false);
                return;
              }
            }
          }

          if (toolMessage?.error) {
            if (toolMessage?.error?.includes("No routes found")) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Hey! It looks like there are no available routes right now. This can happen if there's low liquidity, the amount you selected is too small, gas fees are too high, or the token pair doesn't have a valid route. Try adjusting the amount or selecting a different combination and see if that helps! 😊`,
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

        const aiMessage: Message = {
          role: "ai",
          message: response.data?.ai_message,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", message: "Something went wrong!" },
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

  return (
    <>
      <Card className="neumorphic border-none h-full flex flex-col bg-gradient-to-b from-background/95 to-background">
        <CardHeader className="border-b border-white/5 px-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                AI Assistant
              </h2>
            </div>
            {!isWalletConnected ? (
              <Button
                onClick={onConnect}
                variant="outline"
                className="neumorphic-sm flex items-center gap-2 hover:bg-primary/5"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            ) : (
              <>
                <div className="whole-div flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  >
                    Wallet Connected
                  </Badge>
                  {messages?.length > 0 && (
                    <div
                      className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20 cursor-pointer"
                      onClick={clearChatHistory}
                    >
                      <Trash2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-y-hidden relative">
          <ScrollArea
            className={`w-full ${modelOpen
              ? "overflow-y-hidden h-[37vh]"
              : "md:h-[calc(100vh-80px)] h-[calc(100vh-280px)]"
              }`}
          >
            <div className={`${messages.length !== 0 && "px-2 md:px-3"}`}>
              {!isWalletConnected ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-primary/5 ring-1 ring-primary/20 mb-2">
                    <MessageCircle className="h-8 w-8 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-medium bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                    Welcome to Agentify AI Assistant
                  </h3>
                  <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                    Connect your wallet to start executing smart transactions
                    with natural language commands across any blockchain.
                  </p>
                </div>
              ) : messages?.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-medium">Quick Start</h3>
                    </div>
                    {messages?.map((msg, index) => {
                      // Parse message if it's a JSON string, otherwise use as-is
                      let displayMessage = msg.message;
                      try {
                        const parsed = JSON.parse(msg.message);
                        if (parsed.message) {
                          displayMessage = parsed.message; // Extract "message" field from JSON
                        }
                      } catch (e) {
                        // Not JSON, use original message
                      }

                      return (
                        <div key={index}>
                          <div className={`message w-full h-auto flex ${index === messages.length - 1 &&
                            msg.role === "ai" &&
                            "md:flex-row flex-col"
                            } gap-1 md:gap-2 lg:gap-3 my-2 ${msg.role === "ai"
                              ? "justify-start"
                              : "justify-end"
                            }`}
                          >
                            {msg?.role === "human" && (
                              <div
                                className="p-1 md:p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20 self-center cursor-pointer"
                                onClick={() => {
                                  savedCommands.includes(msg?.message)
                                    ? deleteCommand(msg.message)
                                    : saveCommand(msg?.message, index);
                                }}
                              >
                                <Heart
                                  className={`h-4 w-4 md:h-5 md:w-5 ${savedCommands.includes(msg.message)
                                    ? "fill-current text-primary"
                                    : "text-primary"
                                    }`}
                                />
                              </div>
                            )}
                            <div
                              className={`relative px-4 py-3 max-w-xs md:max-w-md md:overflow-x-auto overflow-x-auto rounded-md w-auto ${msg.role === "ai"
                                ? "bg-white/5 hover:bg-primary/10 border border-white/10"
                                : "user-msg agent-name bg-primary/50 border border-white/10"
                                }`}
                            >
                              <MarkdownToJSX
                                options={{
                                  disableParsingRawHTML: true,
                                  overrides: {
                                    table: {
                                      props: {
                                        className:
                                          "table-auto w-full border-collapse border border-gray-300",
                                      },
                                    },
                                    th: {
                                      props: {
                                        className:
                                          "border border-gray-300 p-2 bg-gray-200 text-black min-w-[4rem]",
                                      },
                                    },
                                    td: {
                                      props: {
                                        className: "border border-gray-300 p-2",
                                      },
                                    },
                                    a: {
                                      props: {
                                        className:
                                          "text-blue-600 underline underline-offset-2",
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                      },
                                    },
                                    ul: {
                                      props: {
                                        className: "list-disc pl-6",
                                      },
                                    },
                                    ol: {
                                      props: {
                                        className: "list-decimal pl-6",
                                      },
                                    },
                                    li: {
                                      props: {
                                        className: "mb-1",
                                      },
                                    },
                                  },
                                }}
                              >
                                {displayMessage}
                              </MarkdownToJSX>
                            </div>
                          </div>
                          {isLoading && index === messages.length - 1 && (
                            <div
                              className={`whole-div w-full flex items-center gap-1 justify-start`}
                            >
                              <div
                                className={`relative message px-3 py-2.5 flex items-center gap-1 rounded-lg max-w-xs bg-white/5 hover:bg-primary/10 border border-white/10`}
                              >
                                <p className={`text-sm text-white`}>
                                  Typing...
                                </p>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-medium">Quick Commands</h3>
                    </div>
                    <div className="grid gap-2">
                      {selectedAgent?.sample_commands?.map((command, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-3 px-4 bg-white/5 hover:bg-primary/10 border-white/10"
                          onClick={() => handleQuickCommand(command)}
                        >
                          {command}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {/* Message history will be added here */}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="border-t border-white/5 p-4 sticky bottom-0 bg-background z-10 bg-[#101014] z-40">
          <div className="flex w-full gap-3 md:items-center md:flex-row flex-col">
            <div className="first flex justify-between gap-2 items-center">
              <Badge
                variant="outline"
                className="bg-primary/10 border-primary/20 text-primary shrink-0 w-auto"
              >
                {selectedAgent?.name?.toUpperCase() || "AGENTIFY"}
              </Badge>
              <div
                className="md:hidden agents bg-primary/40 rounded-sm px-2 py-1 pb-1.5"
                onClick={() => setModelOpen(true)}
              >
                <h2 className="text-white text-sm">Agents</h2>
              </div>
            </div>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Enter your text here..."
                className="flex-1 bg-white/5 border-white/10 border focus:border-primary/20"
                disabled={!isWalletConnected}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleChat();
                  }
                }}
              />
              {/* <Button
                            size="icon"
                            className="shrink-0 neumorphic-sm bg-primary/10 hover:bg-primary/20 transition-colors"
                            disabled={!isWalletConnected || !inputValue.trim()}
                            onClick={handleChat}
                        > */}
              <div
                onClick={handleChat}
                className={`flex items-center justify-center p-2 rounded-xl transition-colors ring-1 ring-primary/20 ${!isWalletConnected || !inputValue.trim()
                  ? "cursor-not-allowed"
                  : "bg-primary/10 hover:bg-primary/20 cursor-pointer"
                  }`}
              >
                <Send className="h-5 w-5 text-primary" />
              </div>
              {/* </Button> */}
            </div>
          </div>
        </CardFooter>
      </Card>
      {modelOpen && (
        <div className="absolute top-0 right-0 left-0 bottom-0 bg-black z-40 overflow-hidden h-full">
          <div
            ref={modalRef}
            className="agents md:hidden flex p-4 rounded-xl neumorphic border-none bg-gradient-to-b from-background/95 to-background"
          >
            <AgentSelector
              selectedAgent={selectedAgent}
              onSelectAgent={onSelectAgent}
              setModelOpen={setModelOpen}
              initialAgents={initialAgents}
            />
          </div>
        </div>
      )}
    </>
  );
};
