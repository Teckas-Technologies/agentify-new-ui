"use client";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ArrowUp,
  Wallet,
  MessageSquare,
  ArrowRight,
  Menu,
  Plus,
  PanelLeft,
} from "lucide-react";
import { useConversations } from "@/contexts/ConversationContext";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "../../ui/button";
import { RightSidebar } from "./RightSidebar";
import { ChatSidebar, Thread } from "./ChatSidebar";
import { useOrchestratedAgent } from "@/hooks/orchestratedAgentHook";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { switchNetwork } from "@/utils/switchNetwork";
import useLifiHook from "@/hooks/useLifiHook";
import { useAccount } from "wagmi";
import { useBeraSwap } from "@/hooks/useBeraSwap";
import {
  MarketType,
  RequestFields,
  RequestFieldsv2,
  TransactionStatus,
  TransactionType,
} from "@/types/types";
import { useTransactions } from "@/hooks/useTransactionsHook";
import useAaveHook, { TransactionError } from "@/hooks/useAaveHook";
import { ChainType, getChains } from "@lifi/sdk";
import { formatUnits } from "ethers/lib/utils";
import { marketConfigs } from "@/utils/markets";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import { useGetHistory } from "@/hooks/useGetThreadIdHistory";
import { useGetThreadHistory } from "@/hooks/useGetThreadHistory";
const SUGGESTED_PROMPTS = [
  "Give me a list of 10 promising AI Agents between 10m and 30m market cap",
  "What are the best DeFi protocols to invest in right now?",
  "Explain the difference between Layer 1 and Layer 2 blockchain solutions",
  "How to create a successful NFT collection in 2024?",
];

interface ChatInterfaceProps {
  chatId: string;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean) => void;
}

// Common Input Component
interface InputBoxProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isCenter?: boolean;
}

function InputBox({
  input,
  setInput,
  onSendMessage,
  isLoading,
  isCenter = false,
}: InputBoxProps) {
  return (
    <div className="w-full max-w-3xl">
      <div
        className="flex items-center bg-black border rounded-md px-4 py-4 transition-all duration-300"
        style={{
          borderColor: "#1a142a",
          boxShadow:
            "0 0 40px 10px rgba(26, 20, 42, 0.8), 0 0 80px 20px rgba(26, 20, 42, 0.5) inset",
          minHeight: "90px",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSendMessage(input);
            }
          }}
          placeholder="Enter your text here..."
          className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-lg"
          disabled={isLoading}
        />

        <button
          onClick={() => onSendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="ml-3 p-3 rounded-full bg-[#462581] hover:bg-[#5e34ad] hover:scale-110 transition-all duration-200"
        >
          <ArrowUp className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}

export function ChatInterface({
  chatId,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}: ChatInterfaceProps) {
  const router = useRouter();
  const { getConversation, addMessage, createNewConversation } =
    useConversations();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const conversation = chatId ? getConversation(chatId) : null;
  const { orchestratedAgentChat, loading: hookLoading } =
    useOrchestratedAgent();
  const { user } = usePrivy();
  const { executeLifi, validateTokenBalance } = useLifiHook();
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const { address } = useAccount();
  const [isExecutingLifi, setExecutingLifi] = useState(false);
  const [isExecutingAave, setExecutingAave] = useState(false);
  const { createTransactions, createTransactionsv2 } = useTransactions();
  const { supplyToAave, withdrawFromAave, borrowToAave, repayToAave } =
    useAaveHook();
  const {
    swap,
    txHash,
    isSwapping,
    error,
    RPC_URL,
    validateTokenBalance: validateBeraChainTokenBalance,
    validateNativeTokenBalance,
  } = useBeraSwap();
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
  // Refs for detecting outside clicks
  const chatSidebarRef = useRef<HTMLDivElement>(null);
  const walletSidebarRef = useRef<HTMLDivElement>(null);
  const { getThreadHistory } = useGetThreadHistory();
  const { getHistory } = useGetHistory();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [newChats, setNewChats] = useState<
    Record<
      string,
      {
        id: string;
        messages: { id: string; role: string; content: string }[];
        title: string;
        timestamp: Date;
      }
    >
  >({});
  const [currentChat, setCurrentChat] = useState<{
    id: string;
    messages: { id: string; role: string; content: string }[];
    title: string;
    timestamp: Date;
  } | null>(null);

  const [loadingMessages, setLoadingMessages] = useState(false);

  // Helper function to add messages to current chat
  const addMessageToCurrentChat = (role: string, content: string) => {
    const newMessage = {
      id: crypto.randomUUID(),
      role,
      content,
    };

    setCurrentChat((prev) => {
      if (prev) {
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
        };
      }
      return prev;
    });

    // Also update newChats for newly created chats
    if (chatId && newChats[chatId]) {
      setNewChats((prev) => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          messages: [...prev[chatId].messages, newMessage],
        },
      }));
    }
  };

  useEffect(() => {
    const fetchThreads = async () => {
      if (!user?.id) return;
      const res = await getThreadHistory(user.id);
      if (res.success && Array.isArray(res.message)) {
        setThreads(res.message);
      }
    };
    fetchThreads();
  }, [user?.id, address]);

  useEffect(() => {
    const fetchThreadMessages = async () => {
      if (!chatId || !user?.id) return;

      // Check if this is a new chat (not in threads yet)
      const isNewChat = !threads.some((t) => t.thread_id === chatId);

      if (isNewChat) {
        // Initialize new chat
        if (!newChats[chatId]) {
          setNewChats((prev) => ({
            ...prev,
            [chatId]: {
              id: chatId,
              messages: [],
              title: "New Chat",
              timestamp: new Date(),
            },
          }));
          setCurrentChat({
            id: chatId,
            messages: [],
            title: "New Chat",
            timestamp: new Date(),
          });
        } else {
          // Use existing new chat data
          setCurrentChat(newChats[chatId]);
        }
        return;
      }

      // Existing chat logic
      const thread = threads.find((t) => t.thread_id === chatId);

      if (thread) {
        setLoadingMessages(true);
        const res = await getHistory(thread.thread_id, user.id);

        if (res.success && Array.isArray(res.message)) {
          const parsedMessages = res.message
            // 🟢 remove tool messages first
            .filter((m) => m.role !== "tool")
            .map((m) => {
              let content = m.message;

              if (m.role === "human") {
                try {
                  const parsed = JSON.parse(m.message);
                  if (parsed?.message) {
                    content = parsed.message;
                  }
                } catch (e) {
                  console.warn("Failed to parse human message JSON", e);
                }
              }

              return {
                id: m.message_id ?? crypto.randomUUID(),
                role: m.role === "human" ? "user" : m.role, // normalize
                content,
              };
            });

          setCurrentChat({
            id: thread.thread_id,
            messages: parsedMessages,
            title: JSON.parse(thread.preview).message || "Untitled Chat", // parsedMessages[0].content
            timestamp: new Date(thread.last_activity),
          });
        } else {
          console.warn("No messages found for this thread");
          setCurrentChat({
            id: thread.thread_id,
            messages: [],
            title: JSON.parse(thread.preview).message || "Untitled Chat",
            timestamp: new Date(thread.last_activity),
          });
        }
        setLoadingMessages(false);
      } else {
        console.warn("Thread not found in API, staying on page");
      }
    };

    fetchThreadMessages();
  }, [chatId, threads, user?.id, newChats, setCurrentChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebars when screen size changes to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsChatOpen(false);
      setIsWalletOpen(false);
    }
  }, [isMobile]);

  // Handle outside clicks to close sidebars on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile) {
        // Close chat sidebar if clicked outside
        if (
          isChatOpen &&
          chatSidebarRef.current &&
          !chatSidebarRef.current.contains(event.target as Node)
        ) {
          setIsChatOpen(false);
        }

        // Close wallet sidebar if clicked outside
        if (
          isWalletOpen &&
          walletSidebarRef.current &&
          !walletSidebarRef.current.contains(event.target as Node)
        ) {
          setIsWalletOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, isChatOpen, isWalletOpen]);
  const handleNewConversation = () => {
    const id = createNewConversation();
    router.push(`/chats/${id}`);
  };

  // const handleSendMessage = async (message: string) => {
  //   if (!message.trim() || !chatId) return;

  //   setInput("");
  //   setIsLoading(true);

  //   // Add user message
  //   addMessage(chatId, {
  //     content: message,
  //     role: "user",
  //   });

  //   try {
  //     // Call orchestrated agent API
  //     const response = await orchestratedAgentChat({
  //       agentName: "orchestratedAgent",
  //       userId: user?.id ?? "", // fallback to wallet if no user id
  //       message,
  //       threadId: chatId,
  //       isTransaction: false,
  //     });

  //     if (response.success && response.data) {
  //       const { ai_message, tool_response } = response.data;

  //       // Always show AI message
  //       if (ai_message && ai_message !== "None") {
  //         addMessage(chatId, {
  //           content: ai_message,
  //           role: "assistant",
  //         });
  //       }

  //       // Handle tool responses
  //       if (tool_response && tool_response !== "None") {
  //         let toolMessage: any;
  //         try {
  //           toolMessage =
  //             typeof tool_response === "string"
  //               ? JSON.parse(tool_response)
  //               : tool_response;
  //         } catch {
  //           toolMessage = tool_response;
  //         }

  //         /** ------------------------------
  //          * Handle transaction tools
  //          * ------------------------------ */
  //         if (toolMessage?.type === "swap" || toolMessage?.type === "bridge") {
  //           const { quote, explorer } = toolMessage;

  //           if (!quote) {
  //             addMessage(chatId, {
  //               content: "❌ Missing swap/bridge quote data.",
  //               role: "assistant",
  //             });
  //             return;
  //           }

  //           const { fromChainId, toChainId, fromToken, fromAmount } = quote;

  //           // Switch network if needed
  //           if (
  //             wallet &&
  //             fromChainId &&
  //             parseInt(wallet.chainId.split(":")[1]) !== fromChainId
  //           ) {
  //             await switchNetwork(fromChainId);
  //           }

  //           // Validate balance
  //           const isEnoughBalance = await validateTokenBalance(
  //             fromChainId,
  //             fromToken,
  //             fromAmount
  //           );
  //           if (!isEnoughBalance) {
  //             addMessage(chatId, {
  //               content: `⚠️ Insufficient ${fromToken.symbol} balance.`,
  //               role: "assistant",
  //             });
  //             return;
  //           }

  //           // Show execution message
  //           addMessage(chatId, {
  //             content: `🚀 Executing ${
  //               fromChainId === toChainId ? "Swap" : "Bridge"
  //             }...`,
  //             role: "assistant",
  //           });

  //           setExecutingLifi(true);
  //           try {
  //             const txRes = await executeLifi({ quote });
  //             console.log("txRes----",txRes);

  //             if (txRes?.txHash) {
  //               const statusMessage = `✅ ${
  //                 fromChainId === toChainId ? "Swap" : "Bridge"
  //               } successful! [View on Explorer](${explorer}tx/${
  //                 txRes.txHash
  //               })`;
  //               addMessage(chatId, {
  //                 content: statusMessage,
  //                 role: "assistant",
  //               });

  //               // Notify AI that tx is done
  //               await orchestratedAgentChat({
  //                 agentName: "orchestratedAgent",
  //                 userId: user?.id ?? address ?? "",
  //                 message: statusMessage,
  //                 threadId: chatId,
  //                 isTransaction: true,
  //               });
  //             } else {
  //               addMessage(chatId, {
  //                 content: `❌ ${
  //                   fromChainId === toChainId ? "Swap" : "Bridge"
  //                 } failed.`,
  //                 role: "assistant",
  //               });
  //             }
  //           } catch (err) {
  //             console.error("Lifi execution error:", err);
  //             addMessage(chatId, {
  //               content: `❌ Transaction execution error: ${
  //                 (err as Error).message
  //               }`,
  //               role: "assistant",
  //             });
  //           } finally {
  //             setExecutingLifi(false);
  //           }
  //           return;
  //         }

  //         // Future: add lend, borrow, repay, withdraw handling
  //         if (toolMessage?.type === "lend") {
  //           addMessage(chatId, {
  //             content: "🛠️ Lend flow detected (hook into supplyToAave here).",
  //             role: "assistant",
  //           });
  //           // same structure as old handleChat lend branch
  //           return;
  //         }

  //         if (toolMessage?.type === "borrow") {
  //           addMessage(chatId, {
  //             content: "🛠️ Borrow flow detected (hook into borrowToAave here).",
  //             role: "assistant",
  //           });
  //           return;
  //         }

  //         if (toolMessage?.type === "repay") {
  //           addMessage(chatId, {
  //             content: "🛠️ Repay flow detected (hook into repayToAave here).",
  //             role: "assistant",
  //           });
  //           return;
  //         }

  //         if (toolMessage?.type === "withdraw") {
  //           addMessage(chatId, {
  //             content:
  //               "🛠️ Withdraw flow detected (hook into withdrawFromAave here).",
  //             role: "assistant",
  //           });
  //           return;
  //         }

  //         // If generic tool response
  //         addMessage(chatId, {
  //           content:
  //             "📊 Tool Response:\n```json\n" +
  //             JSON.stringify(toolMessage, null, 2) +
  //             "\n```",
  //           role: "assistant",
  //         });
  //       }
  //     } else {
  //       addMessage(chatId, {
  //         content: response.message || "❌ Something went wrong.",
  //         role: "assistant",
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Chat error:", error);
  //     addMessage(chatId, {
  //       content: "❌ Something went wrong while sending message.",
  //       role: "assistant",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //     setExecutingLifi(false);
  //     setExecutingAave(false);
  //   }
  // };
  console.log("id", user?.id);

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
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !chatId) return;

    setInput("");
    setIsLoading(true);

    // Add user message to current chat state
    addMessageToCurrentChat("user", message);

    try {
      const messagePayload = JSON.stringify({
        message,
        context: {
          fromAddress: address, // use connected wallet or user wallet
        },
      });
      // Call orchestrated agent API
      const response = await orchestratedAgentChat({
        agentName: "orchestratedAgent",
        userId: user?.id ?? "", // fallback to wallet if no user id
        message: messagePayload,
        threadId: chatId,
        walletAddress: address ?? "",
        isTransaction: false,
      });

      if (response.success && response.data) {
        const { ai_message, tool_response } = response.data;

        // Always show AI message
        if (ai_message && ai_message !== "None") {
          addMessageToCurrentChat("assistant", ai_message);
        }

        // Handle tool responses
        if (tool_response && tool_response !== "None") {
          let toolMessage: any;
          try {
            toolMessage =
              typeof tool_response === "string"
                ? JSON.parse(tool_response)
                : tool_response;
          } catch {
            toolMessage = tool_response;
          }

          /** ------------------------------
           * Handle transaction tools
           * ------------------------------ */

          // Berachain swap handling
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
              BerachainId,
            } = toolMessage.details;

            if (!fromAddress || !toAddress) {
              addMessageToCurrentChat(
                "assistant",
                "❌ Missing swap parameters. Please try again."
              );
              return;
            }

            const fromAmount = Number(parsedFromAmount) / 1e18;
            const from = `${fromAmount} ${fromToken}`;
            const to = `${estimatedToAmount} ${toToken}`;

            try {
              // Switch network if needed
              if (
                wallet &&
                BerachainId &&
                parseInt(wallet.chainId.split(":")[1]) !== BerachainId
              ) {
                await switchNetwork(BerachainId);
              }

              // Conditional balance validation based on the fromToken
              let hasSufficientBalance;
              if (fromToken === "BERA") {
                // Use native token balance validation
                hasSufficientBalance = await validateNativeTokenBalance(
                  BigInt(parsedFromAmount)
                );
              } else {
                // Use token balance validation for other tokens
                hasSufficientBalance = await validateBeraChainTokenBalance(
                  BerachainId,
                  fromTokenAddress,
                  parsedFromAmount
                );
              }

              if (!hasSufficientBalance) {
                addMessageToCurrentChat(
                  "assistant",
                  `⚠️ Insufficient ${fromToken} balance to complete the swap.`
                );
                return;
              }

              // Show execution message
              addMessageToCurrentChat(
                "assistant",
                `🔄 Executing swap: ${fromToken} → ${toToken}. Don't close the page...`
              );

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

                // Create transaction record
                if (
                  user?.id &&
                  fromToken &&
                  txHash &&
                  explorerUrl &&
                  RPC_URL &&
                  fromTokenDecimals &&
                  toToken
                ) {
                  await createTransv2(
                    user.id,
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
                }

                const statusMessage = `Swap successful! 🎉 [View on Berascan](${explorerUrl})`;
                addMessageToCurrentChat("assistant", statusMessage);

                // Notify AI that tx is done
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
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

              addMessageToCurrentChat("assistant", errorMsg);

              // Create failed transaction record
              const explorerUrl = `https://berascan.com/tx`;
              await createTrans(
                user?.id ?? "",
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

          // Lifi swap/bridge handling
          if (toolMessage?.type === "swap" || toolMessage?.type === "bridge") {
            const { quote, explorer } = toolMessage;

            if (!quote) {
              addMessageToCurrentChat(
                "assistant",
                "❌ Missing swap/bridge quote data."
              );
              return;
            }

            const {
              fromChainId,
              toChainId,
              fromToken,
              fromAmount,
              fromAmountUSD,
              gasCostUSD,
            } = quote;

            // Switch network if needed
            if (
              wallet &&
              fromChainId &&
              parseInt(wallet.chainId.split(":")[1]) !== fromChainId
            ) {
              await switchNetwork(fromChainId);
            }

            // Validate balance
            const isEnoughBalance = await validateTokenBalance(
              fromChainId,
              fromToken,
              fromAmount
            );

            const chainInfo = await getChainInfoById(fromChainId);
            if (!chainInfo) {
              console.error("Chain info not found for chainId:", fromChainId);
              addMessageToCurrentChat(
                "assistant",
                "❌ Chain configuration error."
              );
              return;
            }

            if (!isEnoughBalance) {
              addMessageToCurrentChat(
                "assistant",
                `⚠️ Insufficient ${fromToken.symbol} balance.`
              );
              return;
            }

            // Show execution message
            addMessageToCurrentChat(
              "assistant",
              `🚀 Executing ${fromChainId === toChainId ? "Swap" : "Bridge"}...`
            );

            setExecutingLifi(true);
            try {
              const txRes = await executeLifi({ quote });

              if (txRes?.txHash) {
                const agentId =
                  fromChainId === toChainId ? "swapAgent" : "bridgeAgent";
                const transaction_type =
                  fromChainId === toChainId ? "SWAP" : "BRIDGE";
                const agentName =
                  fromChainId === toChainId ? "Swap Agent" : "Bridge Agent";

                const formatedAmount = formatUnits(
                  fromAmount,
                  fromToken.decimals
                );

                // Create transaction record
                await createTrans(
                  user?.id ?? "",
                  agentId,
                  transaction_type,
                  `${
                    fromChainId === toChainId ? "Swap" : "Bridge"
                  } ${formatedAmount} ${
                    fromToken.symbol
                  } executed successfully!`,
                  chainInfo.chainName,
                  new Date(),
                  fromToken.symbol,
                  Number(formatedAmount),
                  txRes.txHash,
                  `${explorer}tx/${txRes.txHash}`,
                  "SUCCESS",
                  fromAmountUSD,
                  gasCostUSD,
                  agentName
                );

                const statusMessage = `${
                  fromChainId === toChainId ? "Swap" : "Bridge"
                } successful! [View on Explorer](${explorer}tx/${
                  txRes.txHash
                })`;

                addMessageToCurrentChat("assistant", statusMessage);

                // Notify AI that tx is done
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                const agentId =
                  fromChainId === toChainId ? "swapAgent" : "bridgeAgent";
                const transaction_type =
                  fromChainId === toChainId ? "SWAP" : "BRIDGE";
                const agentName =
                  fromChainId === toChainId ? "Swap Agent" : "Bridge Agent";
                const formatedAmount = formatUnits(
                  fromAmount,
                  fromToken.decimals
                );

                // Create failed transaction record
                await createTrans(
                  user?.id ?? "",
                  agentId,
                  transaction_type,
                  `${
                    fromChainId === toChainId ? "Swap" : "Bridge"
                  } ${formatedAmount} ${fromToken.symbol} execution failed!`,
                  chainInfo.chainName,
                  new Date(),
                  fromToken.symbol,
                  Number(formatedAmount),
                  txRes?.txHash || "",
                  `${explorer}tx/${txRes?.txHash || "failed"}`,
                  "FAILED",
                  fromAmountUSD,
                  gasCostUSD,
                  agentName
                );

                addMessageToCurrentChat(
                  "assistant",
                  `❌ ${fromChainId === toChainId ? "Swap" : "Bridge"} failed.`
                );
              }
            } catch (err) {
              console.error("Lifi execution error:", err);
              addMessageToCurrentChat(
                "assistant",
                `❌ Transaction execution error: ${(err as Error).message}`
              );
            } finally {
              setExecutingLifi(false);
            }
            return;
          }

          // Aave lending operations
          if (
            ["lend", "borrow", "repay", "withdraw"].includes(toolMessage?.type)
          ) {
            const { market, tokenSymbol, amount, explorer, onBehalfOf } =
              toolMessage;

            if (!market || !tokenSymbol || !amount) {
              addMessageToCurrentChat(
                "assistant",
                "❌ Required fields are incorrect or missing!"
              );
              return;
            }

            const marketType: MarketType = market;
            const selectedMarket = marketConfigs[marketType];

            // Show execution message
            let actionText = "";
            switch (toolMessage.type) {
              case "lend":
                actionText = "lending";
                break;
              case "borrow":
                actionText = "borrowing";
                break;
              case "repay":
                actionText = "repaying";
                break;
              case "withdraw":
                actionText = "withdrawing";
                break;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Executing ${actionText} for ${amount} ${tokenSymbol}, don't close the page until confirmations...`
            );

            setExecutingAave(true);
            try {
              let res: any;
              let transactionType: string;

              switch (toolMessage.type) {
                case "lend":
                  res = await supplyToAave({
                    market: MarketType[market as keyof typeof MarketType],
                    tokenSymbol: tokenSymbol,
                    amount: amount.toString(),
                  });
                  transactionType = "LEND";
                  break;

                case "borrow":
                  res = await borrowToAave({
                    market: MarketType[market as keyof typeof MarketType],
                    tokenSymbol: tokenSymbol,
                    amount: amount.toString(),
                  });
                  transactionType = "BORROW";
                  break;

                case "repay":
                  res = await repayToAave({
                    market,
                    tokenSymbol,
                    amount,
                    onBehalfOf,
                  });
                  transactionType = "REPAY";
                  break;

                case "withdraw":
                  res = await withdrawFromAave({
                    market: MarketType[market as keyof typeof MarketType],
                    tokenSymbol: tokenSymbol,
                    amount: amount.toString(),
                  });
                  transactionType = "WITHDRAW";
                  break;
              }

              const chainInfo = await getChainInfoById(selectedMarket.chainId);

              if (res?.success && res?.txHashes && res.txHashes.length > 0) {
                if (!chainInfo) {
                  console.error(
                    "Chain info not found for chainId:",
                    selectedMarket.chainId
                  );
                  addMessageToCurrentChat(
                    "assistant",
                    "❌ Chain configuration error."
                  );
                  return;
                }
                const toolType = toolMessage?.type as
                  | TransactionType
                  | undefined;
                if (!toolType) {
                  addMessageToCurrentChat(
                    "assistant",
                    "❌ Unknown transaction type."
                  );
                  return;
                }

                const transactionType: TransactionType = toolType;
                // Create transaction record
                await createTransv2(
                  user?.id ?? "",
                  "lendingBorrowingAgent",
                  transactionType,
                  `${transactionType} ${amount} ${tokenSymbol} executed successfully`,
                  chainInfo.chainName,
                  new Date(),
                  tokenSymbol,
                  amount,
                  res.txHashes[0],
                  `${explorer}tx/${res.txHashes[0]}`,
                  "SUCCESS",
                  chainInfo.rpcUrl,
                  chainInfo.nativeTokenSymbol,
                  chainInfo.decimals,
                  tokenSymbol,
                  "Lend and Borrow agent"
                );

                const statusMessage = `Your ${actionText} of ${amount} ${tokenSymbol} was successful. 🎉 You can check the transaction on the [explorer](${explorer}tx/${res.txHashes[0]}).`;

                addMessageToCurrentChat("assistant", statusMessage);

                // Notify AI that tx is done
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                const toolType = toolMessage?.type as
                  | TransactionType
                  | undefined;
                if (!toolType) {
                  addMessageToCurrentChat(
                    "assistant",
                    "❌ Unknown transaction type."
                  );
                  return;
                }

                const transactionType: TransactionType = toolType;
                // Create failed transaction record
                await createTrans(
                  user?.id ?? "",
                  "lendingBorrowingAgent",
                  transactionType,
                  `${transactionType} ${tokenSymbol} execution was failed`,
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

                let errorMessage = `❌ Oops! Your ${actionText} of ${amount} ${tokenSymbol} failed.`;

                if (res?.message?.includes("UNPREDICTABLE_GAS_LIMIT")) {
                  errorMessage = `❌ Transaction failed due to low gas funds. Please ensure your wallet has enough native tokens to cover gas fees.`;
                }

                addMessageToCurrentChat(
                  "assistant",
                  res?.message || errorMessage
                );
              }
            } catch (err) {
              console.error("Aave operation error:", err);
              addMessageToCurrentChat(
                "assistant",
                `❌ ${actionText} execution error: ${(err as Error).message}`
              );
            } finally {
              setExecutingAave(false);
            }
            return;
          }

          // Handle tool errors
          if (toolMessage?.error) {
            if (toolMessage?.error?.includes("No routes found")) {
              addMessageToCurrentChat(
                "assistant",
                `Hey! It looks like there are no available routes right now. This can happen if there's low liquidity, the amount you selected is too small, gas fees are too high, or the token pair doesn't have a valid route. Try adjusting the amount or selecting a different combination and see if that helps! 😊`
              );
              return;
            }

            addMessageToCurrentChat("assistant", `❌ ${toolMessage?.error}`);
            return;
          }

          // If generic tool response
          addMessageToCurrentChat(
            "assistant",
            "📊 Tool Response:\n```json\n" +
              JSON.stringify(toolMessage, null, 2) +
              "\n```"
          );
        }
      } else {
        addMessageToCurrentChat(
          "assistant",
          response.message || "❌ Something went wrong."
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessageToCurrentChat(
        "assistant",
        "❌ Something went wrong while sending message."
      );
    } finally {
      setIsLoading(false);
      setExecutingLifi(false);
      setExecutingAave(false);
    }
  };
  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "I understand you're interested in that topic. Let me provide you with some insights based on current market trends and analysis.",
      "That's a great question! Based on my knowledge, here are some key points to consider...",
      "Interesting query! I can help you explore this further with detailed analysis and recommendations.",
      "Perfect timing for this question. The current market conditions make this particularly relevant, and here's what I think...",
      "I'd be happy to dive deep into this topic. There are several important factors to consider...",
    ];

    return (
      responses[Math.floor(Math.random() * responses.length)] +
      "\n\nThis is a simulated response for demonstration purposes. In a real implementation, this would connect to an actual AI service."
    );
  };

  if (!chatId) {
    return null;
  }

  const hasMessages = currentChat?.messages && currentChat.messages.length > 0;

  // console.log("hasMess", hasMessages);

  return (
    <>
      <div
        className={`flex flex-col h-screen bg-background relative transition-all duration-500 ${
          // Push effect only on desktop
          isWalletOpen && !isMobile
            ? "translate-x-[-160px] scale-95"
            : "translate-x-0 scale-100"
        }`}
      >
        {/* Mobile Header Buttons */}
        {isMobile && (
          <div className="flex justify-between items-center p-4 border-b border-border">
            <Button
              onClick={() => setIsChatOpen(true)}
              variant="outline"
              className="text-white neumorphic-sm hover:bg-primary/5 rounded-xl shadow-md px-4 py-2 flex items-center gap-2"
            >
              <MessageSquare className="text-white w-4 h-4" />
              Chats
            </Button>

            <Button
              onClick={() => setIsWalletOpen(true)}
              variant="outline"
              className="text-white neumorphic-sm hover:bg-primary/5 rounded-xl shadow-md px-4 py-2 flex items-center gap-2"
            >
              <Wallet className="text-white w-4 h-4" />
              Wallet
            </Button>
          </div>
        )}

        {/* Desktop Wallet Button */}
        {/* Desktop Header Section */}
        {!isMobile && (
          <div
            className={cn(
              "w-full flex items-center justify-between px-6 py-4 border-b border-border bg-background z-30 transition-all duration-500",
              isWalletOpen
                ? "opacity-0 scale-95 pointer-events-none"
                : "opacity-100 scale-100"
            )}
          >
            {/* Left side: Toggle + New Chat */}
            <div className="flex items-center gap-4">
              {/* Sidebar toggle */}
              <button
                className="p-2 hover:bg-muted rounded-lg"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <PanelLeft className="w-5 h-5" />
              </button>

              {/* New Chat */}
              <button
                className="flex items-center gap-2 font-medium hover:text-primary"
                onClick={handleNewConversation}
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            {/* Right side: Wallet */}
            <button
              onClick={() => setIsWalletOpen(true)}
              className="flex items-center gap-2 font-medium hover:text-primary"
            >
              <Wallet className="w-5 h-5" />
              Wallet
            </button>
          </div>
        )}

        {/* Chat Messages */}
        {/* Chat Messages */}
        {hasMessages && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-32">
            <div className="max-w-3xl mx-auto space-y-6">
              {currentChat?.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-start">
                  <div className="bg-card p-4 rounded-lg max-w-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasMessages && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <h1 className="text-white text-3xl font-bold">
              Welcome to Agentify
            </h1>
            <p className="text-muted-foreground">
              Start a conversation with your AI assistant
            </p>
          </div>
        )}

        {/* Fixed Bottom Input (always visible) */}
        <div className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-background">
          <div className="flex justify-center">
            <div className="w-full max-w-3xl">
              <InputBox
                input={input}
                setInput={setInput}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar (Wallet) */}
      <div
        ref={walletSidebarRef}
        className={`fixed top-0 right-0 h-full w-80 bg-[#101014] shadow-lg transform transition-transform duration-500 z-40 ${
          isWalletOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <RightSidebar
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
        />
      </div>

      {/* Left Sidebar (Chats) for mobile */}
      {isMobile && (
        <div
          ref={chatSidebarRef}
          className={`fixed top-0 left-0 h-full w-80 bg-[#101014] shadow-lg transform transition-transform duration-500 z-40 ${
            isChatOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* You'll need to pass the chat sidebar content here */}
          <ChatSidebar mobileView onSelectChat={() => setIsChatOpen(false)} />
        </div>
      )}

      {/* Overlay for mobile sidebars */}
      {isMobile && (isChatOpen || isWalletOpen) && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => {
            setIsChatOpen(false);
            setIsWalletOpen(false);
          }}
        />
      )}
    </>
  );
}
interface Message {
  id: string;
  role: string;
  content: string;
}
interface MessageBubbleProps {
  message: Message;
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser && "justify-end")}>
      <div
        className={cn(
          "rounded-lg max-w-3xl overflow-hidden",
          isUser
            ? "bg-primary/50 text-primary-foreground border border-white/10"
            : "bg-white/5 hover:bg-primary/10 border border-white/10 text-white" // Added text-white for AI messages
        )}
      >
        {/* Agent name header for AI messages */}
        {!isUser && (
          <div className="bg-primary/20 m-3 rounded px-4 py-3 text-sm font-medium text-white">
            {" "}
            {/* Changed to text-white */}
            Agentify AI
          </div>
        )}

        <div className="p-4">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
