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
import { useNewChangeNowHook, NETWORK_TO_CHAIN_ID, toChangeNowNetwork } from "@/hooks/useNewChangeNowHook";
import { ChainType, getChains } from "@lifi/sdk";
import { formatUnits } from "ethers/lib/utils";
import { marketConfigs } from "@/utils/markets";
import { v4 as uuidv4 } from "uuid";
import useMantleHook from "@/hooks/useMantleHook";
import useLendleHook, { LENDLE_ASSETS } from "@/hooks/useLendleHook";
import useFusionXHook, { FUSIONX_TOKENS } from "@/hooks/useFusionXHook";
import ReactMarkdown from "react-markdown";
import { useGetHistory } from "@/hooks/useGetThreadIdHistory";
import { useGetThreadHistory } from "@/hooks/useGetThreadHistory";
import { useWalletConnect } from "@/hooks/useWalletConnect";

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

const SUGGESTED_PROMPTS = [
  "Give me a list of 10 promising AI Agents between 10m and 30m market cap",
  "What are the best DeFi protocols to invest in right now?",
  "Explain the difference between Layer 1 and Layer 2 blockchain solutions",
  "How to create a successful NFT collection in 2024?",
];

// Error handling map with natural AI responses
interface ErrorHandler {
  pattern: RegExp;
  generateMessage: (match: RegExpMatchArray) => string;
}

const ERROR_HANDLING_MAP: ErrorHandler[] = [
  // =====================================
  // ChangeNow Exchange Errors
  // =====================================
  {
    pattern: /Pair not available.*→/i,
    generateMessage: () =>
      `This token pair isn't currently available for exchange. The tokens you selected may not have a direct swap route. Try selecting a different token pair or use a more common token like ETH or USDC as an intermediary.`,
  },
  {
    pattern: /Amount below minimum.*Min:\s*([\d.]+)\s*(\w+)/i,
    generateMessage: (match: RegExpMatchArray) =>
      `The amount you entered is below the minimum required for this exchange. Please use at least ${match[1]} ${match[2]} to proceed with the swap.`,
  },
  {
    pattern: /Amount above maximum.*Max:\s*([\d.]+)\s*(\w+)/i,
    generateMessage: (match: RegExpMatchArray) =>
      `The amount you entered exceeds the maximum allowed for this exchange. Please reduce the amount to ${match[1]} ${match[2]} or less.`,
  },
  {
    pattern: /Failed to get exchange estimate/i,
    generateMessage: () =>
      `I couldn't get an exchange rate estimate for this pair right now. This usually means the amount is too small or there's temporary low liquidity. Try increasing the amount or waiting a moment before trying again.`,
  },
  {
    pattern: /Failed to create exchange/i,
    generateMessage: () =>
      `There was an issue creating your exchange order. This could be a temporary service issue. Please wait a moment and try again.`,
  },
  {
    pattern: /Exchange (failed|expired|refunded)/i,
    generateMessage: (match: RegExpMatchArray) =>
      `Your exchange ${match[1]}. This can happen due to market volatility, network delays, or the exchange timing out. Any funds sent will be refunded to your wallet. Please try again with a new exchange.`,
  },
  {
    pattern: /Unknown network:?\s*(\w+)?/i,
    generateMessage: (match: RegExpMatchArray) =>
      `The network "${match[1] || 'specified'}" isn't supported for ChangeNow exchanges. Please select a supported network like Ethereum, Polygon, Arbitrum, Base, or BNB Chain.`,
  },
  {
    pattern: /Token.*not found on chain/i,
    generateMessage: () =>
      `I couldn't find this token on the selected network. Please verify the token exists on this blockchain or try a different network.`,
  },
  {
    pattern: /deposit_too_small|out_of_range/i,
    generateMessage: () =>
      `The deposit amount is too small for this exchange. Please increase the amount to meet the minimum requirement.`,
  },
  // =====================================
  // LiFi / Swap / Bridge Errors
  // =====================================
  {
    // Check for BOTH tokens invalid first
    pattern: /Invalid token\(s\): fromToken '([^']+)', toToken '([^']+)'/i,
    generateMessage: (match: RegExpMatchArray) =>
      `Both tokens are invalid: "${match[1]}" (from) and "${match[2]}" (to). Please check the spelling and provide correct token symbols.`,
  },
  {
    // Then check for only toToken invalid
    pattern: /Invalid token\(s\):.*toToken '([^']+)'/i,
    generateMessage: (match: RegExpMatchArray) =>
      `I couldn't find the token "${match[1]}" you mentioned. Could you please check the spelling and provide the correct "To Token" symbol?`,
  },
  {
    // Then check for only fromToken invalid
    pattern: /Invalid token\(s\):.*fromToken '([^']+)'/i,
    generateMessage: (match: RegExpMatchArray) =>
      `The token "${match[1]}" you want to swap/bridge from doesn't seem to be valid. Could you please verify and provide the correct "From Token" symbol?`,
  },
  {
    // Generic invalid token fallback
    pattern: /Invalid token\(s\):.*'([^']+)'/i,
    generateMessage: (match: RegExpMatchArray) =>
      `The token "${match[1]}" is not recognized. Please double-check the token symbol or try using the token's contract address instead.`,
  },
  {
    pattern: /Invalid token\(s\) provided/i,
    generateMessage: () =>
      `The tokens you specified couldn't be found. Please check the token symbols and try again.`,
  },
  {
    pattern: /Source chain '([^']+)' not found/i,
    generateMessage: (match: RegExpMatchArray) =>
      `I couldn't find the source blockchain "${match[1]}" you mentioned. Please check the chain name and make sure you're using a supported network like Ethereum, Polygon, Arbitrum, Base, BNB Chain, or others.`,
  },
  {
    pattern: /Destination chain '([^']+)' not found/i,
    generateMessage: (match: RegExpMatchArray) =>
      `I couldn't find the destination blockchain "${match[1]}" you specified. Please verify the chain name and use a supported network like Ethereum, Polygon, Arbitrum, Base, BNB Chain, or others.`,
  },
  {
    pattern: /No routes found/i,
    generateMessage: () =>
      `Hey! It looks like there are no available routes right now. This can happen if there's low liquidity, the amount you selected is too small, gas fees are too high, or the token pair doesn't have a valid route. Try adjusting the amount or selecting a different combination!`,
  },
  {
    pattern: /LiFi route fetch failed.*'NoneType' object has no attribute 'get'/i,
    generateMessage: () =>
      `Oops! There was a temporary issue connecting to the swap service. This is usually a brief service interruption. Please wait a moment and try again. If the issue persists, the service might be undergoing maintenance.`,
  },
  {
    pattern: /Failed to fetch routes from Li\.Fi API|LiFi API.*failed/i,
    generateMessage: () =>
      `I'm having trouble connecting to the Li.Fi swap service right now. This could be due to a network issue or temporary service unavailability. Please check your internet connection and try again in a moment.`,
  },
  {
    pattern: /insufficient.*balance/i,
    generateMessage: () =>
      `I noticed your wallet doesn't have enough balance to complete this transaction. Please check your balance and either reduce the amount or add more funds to your wallet before trying again.`,
  },
  {
    pattern: /slippage.*exceeded/i,
    generateMessage: () =>
      `The price moved too much (slippage exceeded). Try increasing your slippage tolerance or wait a moment and try again.`,
  },
  {
    pattern: /user.*reject/i,
    generateMessage: () =>
      `Looks like you cancelled the transaction. No worries! Let me know when you're ready to try again.`,
  },
  {
    pattern: /network.*error/i,
    generateMessage: () =>
      `There seems to be a network connectivity issue. Please check your internet connection and try again.`,
  },
  {
    pattern: /gas.*too.*high/i,
    generateMessage: () =>
      `Gas fees are quite high right now. You might want to wait a bit or adjust your gas settings before trying again.`,
  },
  {
    pattern: /chain.*not.*support/i,
    generateMessage: () =>
      `This blockchain network is not supported for this operation. Please try with a different network.`,
  },
  {
    pattern: /toLowerCase is not a function|cannot read.*toLowerCase/i,
    generateMessage: () =>
      `There was an issue processing the transaction details. This is usually a temporary problem with the bridge service. Please try again in a moment, or try with a different amount.`,
  },
  {
    pattern: /execution.*failed|transaction.*failed/i,
    generateMessage: () =>
      `The transaction execution failed. This could be due to network congestion, insufficient gas, or a temporary service issue. Please check your wallet balance and try again.`,
  },
  {
    pattern: /CALL_EXCEPTION|call exception/i,
    generateMessage: () =>
      `The transaction was sent to the blockchain but failed during execution. This usually happens when there isn't enough collateral, the amount exceeds your available balance, or the transaction would put your position at risk. Please check your balance and try again with a different amount.`,
  },
  {
    pattern: /"status"\s*:\s*0|status.*0|receipt.*status.*0/i,
    generateMessage: () =>
      `The transaction was processed by the blockchain but was reverted. This could be due to insufficient funds, market conditions, or transaction requirements not being met. Please verify your balance and the transaction details before trying again.`,
  },
  {
    pattern: /unknown token[:\s]*(\w+)/i,
    generateMessage: (match: RegExpMatchArray) =>
      `The token "${match[1]}" is not currently available for trading on FusionX. This token may not have sufficient liquidity or may not be listed yet. Try using a different token like WMNT, WETH, USDC, USDT, or WBTC.`,
  },
  {
    pattern: /token.*not.*available|unavailable.*token|token.*not.*supported/i,
    generateMessage: () =>
      `This token is not currently available for trading. It may not have sufficient liquidity or may not be listed on the exchange. Please try with a different token.`,
  },
];

// Fallback message for unknown errors
const FALLBACK_ERROR_MESSAGE = "Something went wrong! Please try again later.";

/**
 * Matches error string against ERROR_HANDLING_MAP and returns natural AI response
 */
const getErrorMessage = (errorString: string): string => {
  for (const errorHandler of ERROR_HANDLING_MAP) {
    const match = errorString.match(errorHandler.pattern);
    if (match) {
      return errorHandler.generateMessage(match);
    }
  }
  return FALLBACK_ERROR_MESSAGE;
};

interface ChatInterfaceProps {
  chatId: string;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean) => void;
  onThreadChange: () => void;
  threadsRefreshKey: number;
  isWalletOpen?: boolean;
  setIsWalletOpen?: (value: boolean) => void;
  isChatOpen?: boolean;
  setIsChatOpen?: (value: boolean) => void;
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
  const { user } = usePrivy();
  const { address } = useAccount();
  return (
    <div className="w-full max-w-3xl">
      <div
        className="flex items-center bg-black border rounded-md p-3 transition-all duration-300"
        style={{
          borderColor: "#1a142a",
          boxShadow:
            "0 0 40px 10px rgba(26, 20, 42, 0.8), 0 0 80px 20px rgba(26, 20, 42, 0.5) inset",
          minHeight: "60px",
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
          placeholder={
            !address || !user
              ? "🔗 Connect your wallet to start chatting..."
              : "Enter your text here..."
          }
          className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-lg"
          disabled={isLoading || !address || !user}
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
  onThreadChange,
  threadsRefreshKey,
  isWalletOpen: externalIsWalletOpen,
  setIsWalletOpen: externalSetIsWalletOpen,
  isChatOpen: externalIsChatOpen,
  setIsChatOpen: externalSetIsChatOpen,
}: ChatInterfaceProps) {
  const router = useRouter();
  const { getConversation, addMessage, createNewConversation } =
    useConversations();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use external wallet state if provided, otherwise use internal state
  const [internalIsWalletOpen, internalSetIsWalletOpen] = useState(false);
  const isWalletOpen = externalIsWalletOpen !== undefined ? externalIsWalletOpen : internalIsWalletOpen;
  const setIsWalletOpen = externalSetIsWalletOpen || internalSetIsWalletOpen;

  // Use external chat state if provided, otherwise use internal state
  const [internalIsChatOpen, internalSetIsChatOpen] = useState(false);
  const isChatOpen = externalIsChatOpen !== undefined ? externalIsChatOpen : internalIsChatOpen;
  const setIsChatOpen = externalSetIsChatOpen || internalSetIsChatOpen;

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
  const {
    executeExchange: executeChangeNowExchange,
    getTransactionStatus: getChangeNowTxStatus,
    loading: changeNowLoading,
    error: changeNowError,
  } = useNewChangeNowHook();
  const [isExecutingChangeNow, setExecutingChangeNow] = useState(false);
  const [isExecutingMantle, setExecutingMantle] = useState(false);
  const [isExecutingLendle, setExecutingLendle] = useState(false);
  const [isExecutingFusionX, setExecutingFusionX] = useState(false);
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
    getAllReserves: lendleGetAllReserves,
    getLendBalance: lendleGetLendBalance,
    getPendingRewards: lendleGetPendingRewards,
    claimRewards: lendleClaimRewards,
  } = useLendleHook();
  const {
    swapExactTokensForTokens: fusionXSwapExactTokensForTokens,
    swapExactMNTForTokens: fusionXSwapExactMNTForTokens,
    swapExactTokensForMNT: fusionXSwapExactTokensForMNT,
    addLiquidity: fusionXAddLiquidity,
    removeLiquidity: fusionXRemoveLiquidity,
    getV2Quote: fusionXGetV2Quote,
    getV2PairInfo: fusionXGetV2PairInfo,
    getV2LPBalance: fusionXGetV2LPBalance,
    getUserLPHistory: fusionXGetUserLPHistory,
    getExplorerUrl: fusionXGetExplorerUrl,
  } = useFusionXHook();
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
  const skipNextHistoryFetch = useRef<boolean>(false);
  const { getThreadHistory } = useGetThreadHistory();
  const { getHistory } = useGetHistory();
  const { handleWalletConnect, disconnectAll } = useWalletConnect();
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
  const [isMessageSending, setIsMessageSending] = useState(false);

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
      if (!user?.id || !address) return;
      const res = await getThreadHistory(user.id);
      if (res.success && Array.isArray(res.message)) {
        setThreads(res.message);
      }
    };
    fetchThreads();
  }, [user?.id, address]);

  useEffect(() => {
    const fetchThreadMessages = async () => {
      if (!chatId || !user?.id || !address) return;
      if (isMessageSending) return;
      // Skip fetch if we just finished sending a message (to preserve local state like tool responses)
      if (skipNextHistoryFetch.current) {
        skipNextHistoryFetch.current = false;
        return;
      }
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
            // 🟢 remove tool messages and empty AI messages
            .filter((m) => m.role !== "tool" && !(m.role === "ai" && !m.message))
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
    // Note: isMessageSending removed from deps to prevent refetching history after each message
    // which was overwriting local state with backend data (losing read-only tool responses like staking info)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, threads, user?.id, address, newChats, setCurrentChat]);

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
        const target = event.target as HTMLElement;

        // Check if click is on the chat or wallet trigger buttons
        const isChatTrigger = target.closest('[data-chat-trigger="true"]');
        const isWalletTrigger = target.closest('[data-wallet-trigger="true"]');

        // Close chat sidebar if clicked outside
        if (
          isChatOpen &&
          chatSidebarRef.current &&
          !chatSidebarRef.current.contains(event.target as Node) &&
          !isChatTrigger
        ) {
          setIsChatOpen(false);
        }

        // Close wallet sidebar if clicked outside
        if (
          isWalletOpen &&
          walletSidebarRef.current &&
          !walletSidebarRef.current.contains(event.target as Node) &&
          !isWalletTrigger
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
  const handleConnectWallet = () => {
    if (!address || !user) {
      handleWalletConnect();
    } else {
      disconnectAll();
    }
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
  // Helper to replace the most recent assistant message
  const updateLastAiMessage = (newContent: string) => {
    setCurrentChat((prev) => {
      if (!prev) return prev;

      const updatedMessages = [...prev.messages];
      for (let i = updatedMessages.length - 1; i >= 0; i--) {
        if (updatedMessages[i].role === "assistant") {
          updatedMessages[i] = { ...updatedMessages[i], content: newContent };
          break;
        }
      }

      const updatedChat = { ...prev, messages: updatedMessages };
      
      // Alert to check if the updated text is added to the messages array
     
      
      return updatedChat;
    });

    if (chatId && newChats[chatId]) {
      setNewChats((prev) => {
        const updatedMessages = [...prev[chatId].messages];
        for (let i = updatedMessages.length - 1; i >= 0; i--) {
          if (updatedMessages[i].role === "assistant") {
            updatedMessages[i] = { ...updatedMessages[i], content: newContent };
            break;
          }
        }
        const updatedNewChats = {
          ...prev,
          [chatId]: {
            ...prev[chatId],
            messages: updatedMessages,
          },
        };
        
        // Alert to check if the updated text is added to the newChats array
      
        return updatedNewChats;
      });
    }
  };

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
    setIsMessageSending(true);

    // Check if this is a new chat and first message BEFORE adding the user message
    const isNewChat = newChats[chatId] !== undefined;
    const isFirstMessage = currentChat?.messages.filter(m => m.role === 'user').length === 0;
    const shouldCallOnThreadChange = isNewChat && isFirstMessage;

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
        
        // Only call onThreadChange for new chats and first message
        if (shouldCallOnThreadChange) {
          onThreadChange();
        }

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
                "Missing swap parameters. Please try again."
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
                const errorMessage = `Oops! It looks like you don't have enough ${fromToken} in your wallet to complete this swap. Please check your balance and try again with a smaller amount, or add more ${fromToken} to your wallet.`;

                addMessageToCurrentChat("assistant", errorMessage);

                // Notify backend about the transaction failure
                try {
                  await orchestratedAgentChat({
                    agentName: "orchestratedAgent",
                    userId: user?.id ?? "",
                    message: `${errorMessage}`,
                    threadId: chatId,
                    walletAddress: address ?? "",
                    isTransaction: true, // Mark as transaction status update
                  });
                } catch (notifyError) {
                  console.error("Failed to notify backend about insufficient balance:", notifyError);
                }

                return;
              }

              // Show execution message
              addMessageToCurrentChat(
                "assistant",
                `🔄 Swapping ${fromAmount} ${fromToken} to ${toToken}, don't close the page until confirmation...`
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

                const statusMessage = `Your swap of ${fromAmount} ${fromToken} to ${toToken} was successful! 🎉 You can check the transaction on the [block explorer](${explorerUrl}).`;
                updateLastAiMessage(statusMessage);

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

              updateLastAiMessage(errorMsg);

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

              // Notify backend about the transaction failure
              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${errorMsg}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true, // Mark as transaction status update
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about swap failure:", notifyError);
              }
            }
            return;
          }

          // Lifi swap/bridge handling
          if (toolMessage?.type === "swap" || toolMessage?.type === "bridge") {
            const { quote, explorer } = toolMessage;

            if (!quote) {
              const errorMessage = "I couldn't fetch the swap/bridge details from the service. This might be a temporary issue. Please try again in a moment.";
              addMessageToCurrentChat("assistant", errorMessage);

              // Notify backend about the failure
              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${errorMessage}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about missing quote:", notifyError);
              }

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
            const balanceValidation = await validateTokenBalance(
              fromChainId,
              fromToken,
              fromAmount
            );

            const chainInfo = await getChainInfoById(fromChainId);
            if (!chainInfo) {
              console.error("Chain info not found for chainId:", fromChainId);
              const errorMessage = "I couldn't retrieve information about the blockchain network. This might be a temporary service issue. Please try again shortly.";
              addMessageToCurrentChat("assistant", errorMessage);

              // Notify backend about the failure
              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${errorMessage}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about chain info error:", notifyError);
              }

              return;
            }

            if (!balanceValidation.isValid) {
              let errorMessage: string;

              if (balanceValidation.isNearMax && balanceValidation.suggestedAmount) {
                // User is trying to use max balance - provide suggested amount
                errorMessage = `You have ${balanceValidation.actualBalance} ${balanceValidation.tokenSymbol}, but the transaction requires ${balanceValidation.requiredAmount} ${balanceValidation.tokenSymbol}. Try using ${balanceValidation.suggestedAmount} ${balanceValidation.tokenSymbol} instead.`;
              } else {
                const shortfallMsg = balanceValidation.shortfall
                  ? ` You're short by ${balanceValidation.shortfall} ${balanceValidation.tokenSymbol}.`
                  : '';
                errorMessage = `I see that you need ${balanceValidation.requiredAmount} ${balanceValidation.tokenSymbol} for this transaction, but you only have ${balanceValidation.actualBalance} ${balanceValidation.tokenSymbol}.${shortfallMsg} Please add more funds or reduce the amount to continue.`;
              }

              addMessageToCurrentChat("assistant", errorMessage);

              // Notify backend about the transaction failure
              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${errorMessage}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true, // Mark as transaction status update
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about insufficient balance:", notifyError);
              }

              return;
            }

            // Show execution message
            const formatedAmountDisplay = formatUnits(fromAmount, fromToken.decimals);
            addMessageToCurrentChat(
              "assistant",
              `🔄 ${fromChainId === toChainId ? "Swapping" : "Bridging"} ${formatedAmountDisplay} ${fromToken.symbol}${fromChainId !== toChainId ? ` to ${quote.toToken?.symbol || 'destination token'}` : ''}, don't close the page until confirmation...`
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

                const actionType = fromChainId === toChainId ? "swap" : "bridge";
                const statusMessage = `Your ${actionType} of ${formatedAmount} ${fromToken.symbol}${fromChainId !== toChainId ? ` to ${quote.toToken?.symbol || 'destination token'}` : ''} was successful! 🎉 You can check the transaction on the [block explorer](${explorer}tx/${txRes.txHash}).`;

                updateLastAiMessage(statusMessage);

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

                const errorMsg = "The swap/bridge transaction was initiated but didn't complete successfully. This could be due to network congestion or a temporary service issue. Please check your wallet and try again.";
                updateLastAiMessage(errorMsg);

                // Notify backend about the transaction failure
                try {
                  await orchestratedAgentChat({
                    agentName: "orchestratedAgent",
                    userId: user?.id ?? "",
                    message: `${errorMsg}`,
                    threadId: chatId,
                    walletAddress: address ?? "",
                    isTransaction: true, // Mark as transaction status update
                  });
                } catch (notifyError) {
                  console.error("Failed to notify backend about LiFi failure:", notifyError);
                }
              }
            } catch (err) {
              console.error("Lifi execution error:", err);
              const errorMessage = (err as Error).message || "";
              const errorString = JSON.stringify(err);

              // Try to match error with error handling map
              let userFriendlyMessage = getErrorMessage(errorMessage);

              // If no match found in message, try matching the full error string
              if (userFriendlyMessage === FALLBACK_ERROR_MESSAGE) {
                userFriendlyMessage = getErrorMessage(errorString);
              }

              // Special case: user rejected
              if (
                errorMessage.toLowerCase().includes("user denied") ||
                errorMessage.toLowerCase().includes("user rejected")
              ) {
                userFriendlyMessage =
                  "Looks like you cancelled the transaction. No worries! Let me know when you're ready to try again.";
              }

              updateLastAiMessage(userFriendlyMessage);

              // Notify backend about the transaction failure
              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${userFriendlyMessage}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true, // Mark as transaction status update
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about LiFi catch error:", notifyError);
              }
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
                "Required fields are incorrect or missing!"
              );
              return;
            }

            const marketType: MarketType = market;
            const selectedMarket = marketConfigs[marketType];

            // Show execution message
            let actionText = "";
            switch (toolMessage.type) {
              case "lend":
                actionText = "Lending";
                break;
              case "borrow":
                actionText = "Borrowing";
                break;
              case "repay":
                actionText = "Repaying";
                break;
              case "withdraw":
                actionText = "Withdrawing";
                break;
            }

            // Display user-friendly amount (convert -1 to "the full amount of" only for repay/withdraw)
            const displayAmount =
              (toolMessage.type === "repay" || toolMessage.type === "withdraw") &&
              (amount === "-1" || amount === -1 || String(amount) === "-1")
                ? "the full amount of"
                : amount;
            addMessageToCurrentChat(
              "assistant",
              `🔄 ${actionText} ${displayAmount} ${tokenSymbol}, don't close the page until confirmation...`
            );

            setExecutingAave(true);
            try {
              let res: any;
              let transactionType: TransactionType = "LEND"; // Default value

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

                default:
                  console.error("Unknown Aave operation type:", toolMessage.type);
                  updateLastAiMessage("I encountered an unexpected operation type. Please try again.");
                  return;
              }

              const chainInfo = await getChainInfoById(selectedMarket.chainId);

              if (res?.success && res?.txHashes && res.txHashes.length > 0) {
                if (!chainInfo) {
                  console.error(
                    "Chain info not found for chainId:",
                    selectedMarket.chainId
                  );
                  const errorMessage = "I encountered an issue retrieving the blockchain network details. Please try your transaction again.";
                  updateLastAiMessage(errorMessage);

                  // Notify backend about the failure
                  try {
                    await orchestratedAgentChat({
                      agentName: "orchestratedAgent",
                      userId: user?.id ?? "",
                      message: `${errorMessage}`,
                      threadId: chatId,
                      walletAddress: address ?? "",
                      isTransaction: true,
                    });
                  } catch (notifyError) {
                    console.error("Failed to notify backend about Aave chain info error:", notifyError);
                  }

                  return;
                }

                // transactionType is already set in the switch statement above
                // Create transaction record
                // Use display-friendly amount in description
                const txDescAmount =
                  (toolMessage.type === "repay" || toolMessage.type === "withdraw") &&
                  (amount === "-1" || amount === -1 || String(amount) === "-1")
                    ? "full amount"
                    : amount;
                await createTransv2(
                  user?.id ?? "",
                  "lendingBorrowingAgent",
                  transactionType,
                  `${transactionType} ${txDescAmount} ${tokenSymbol} executed successfully`,
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

                // Convert action text to past tense for success message
                const actionPastTense = actionText === "Lending" ? "deposit"
                  : actionText === "Borrowing" ? "borrow"
                  : actionText === "Withdrawing" ? "withdrawal"
                  : actionText === "Repaying" ? "repayment"
                  : actionText;

                // Use displayAmount for success message (same logic as execution message)
                const successDisplayAmount =
                  (toolMessage.type === "repay" || toolMessage.type === "withdraw") &&
                  (amount === "-1" || amount === -1 || String(amount) === "-1")
                    ? "the full amount of"
                    : amount;

                const statusMessage = `Your ${actionPastTense} of ${successDisplayAmount} ${tokenSymbol} was successful! 🎉 You can check the transaction on the [block explorer](${explorer}tx/${res.txHashes[0]}).`;

                updateLastAiMessage(statusMessage);

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
                // transactionType is already set in the switch statement above
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

                // ✅ Use the natural error message from the hook if available
                let errorMessage = res?.message || `The lending/borrowing transaction couldn't be completed. This might be due to insufficient funds, network congestion, or market conditions. Please check your wallet balance and try again.`;

               updateLastAiMessage(errorMessage);

               // Notify backend about the transaction failure
               try {
                 await orchestratedAgentChat({
                   agentName: "orchestratedAgent",
                   userId: user?.id ?? "",
                   message: `${errorMessage}`,
                   threadId: chatId,
                   walletAddress: address ?? "",
                   isTransaction: true, // Mark as transaction status update
                 });
               } catch (notifyError) {
                 console.error("Failed to notify backend about Aave failure:", notifyError);
               }
              }
            } catch (err) {
              console.error("Aave operation error:", err);
              const error = err as any;
              const errorMessage = error?.message || "";

              // Check for specific error codes and types
              let userFriendlyMessage = "";

              // Check for CALL_EXCEPTION or on-chain transaction failure
              if (error?.code === "CALL_EXCEPTION" || errorMessage.includes("CALL_EXCEPTION")) {
                userFriendlyMessage = "The transaction was sent to the blockchain but failed during execution. This usually happens when there isn't enough collateral, the amount exceeds your available balance, or the transaction would put your position at risk. Please check your balance and try again with a different amount.";
              }
              // Check if receipt shows status: 0 (failed on-chain)
              else if (error?.receipt?.status === 0) {
                userFriendlyMessage = "The transaction was processed by the blockchain but was reverted. This could be due to insufficient funds, market conditions, or transaction requirements not being met. Please verify your balance and the transaction details before trying again.";
              }
              // Special case: user rejected
              else if (
                errorMessage.toLowerCase().includes("user denied") ||
                errorMessage.toLowerCase().includes("user rejected")
              ) {
                userFriendlyMessage = "Looks like you cancelled the transaction. No worries! Let me know when you're ready to try again.";
              }
              // Try to match error with error handling map
              else {
                userFriendlyMessage = getErrorMessage(errorMessage);

                // If no match found in message, try with a simpler error check (avoid full JSON)
                if (userFriendlyMessage === FALLBACK_ERROR_MESSAGE) {
                  // Only check the error code and name, not the full object to avoid huge messages
                  const simpleErrorInfo = `${error?.code} ${error?.name} ${errorMessage}`;
                  userFriendlyMessage = getErrorMessage(simpleErrorInfo);
                }
              }

              updateLastAiMessage(userFriendlyMessage);

              // Notify backend about the transaction failure
              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${userFriendlyMessage}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true, // Mark as transaction status update
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about Aave catch error:", notifyError);
              }
            } finally {
              setExecutingAave(false);
            }
            return;
          }

          // =====================================
          // ChangeNow Exchange Handler
          // =====================================
          if (toolMessage?.type === "changenow_exchange") {
            const { quote, exchange_type } = toolMessage;

            if (!quote) {
              const errorMessage = "I couldn't fetch the exchange details from ChangeNow. This might be a temporary issue. Please try again in a moment.";
              addMessageToCurrentChat("assistant", errorMessage);

              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${errorMessage}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about missing ChangeNow quote:", notifyError);
              }

              return;
            }

            const {
              fromChain,
              toChain,
              fromNetwork,
              toNetwork,
              fromToken,
              toToken,
              fromAmount,
              fromAddress,
              toAddress,
              minAmount,
              maxAmount,
            } = quote;

            // Validate minimum amount
            if (minAmount && fromAmount < minAmount) {
              const errorMessage = `The amount you entered is below the minimum required for this exchange. Please use at least ${minAmount} ${fromToken.toUpperCase()} to proceed.`;
              addMessageToCurrentChat("assistant", errorMessage);

              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${errorMessage}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about min amount error:", notifyError);
              }

              return;
            }

            // Validate maximum amount
            if (maxAmount && fromAmount > maxAmount) {
              const errorMessage = `The amount you entered exceeds the maximum allowed for this exchange. Please reduce the amount to ${maxAmount} ${fromToken.toUpperCase()} or less.`;
              addMessageToCurrentChat("assistant", errorMessage);

              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${errorMessage}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about max amount error:", notifyError);
              }

              return;
            }

            // Get chain ID for network switch
            const sourceNetwork = toChangeNowNetwork(fromNetwork);
            const sourceChainId = NETWORK_TO_CHAIN_ID[sourceNetwork.toLowerCase()];

            if (!sourceChainId) {
              const errorMessage = `The network "${fromChain}" isn't supported for ChangeNow exchanges. Please select a supported network like Ethereum, Polygon, Arbitrum, Base, or BNB Chain.`;
              addMessageToCurrentChat("assistant", errorMessage);

              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${errorMessage}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about unsupported network:", notifyError);
              }

              return;
            }

            // Switch network if needed
            if (wallet && parseInt(wallet.chainId.split(":")[1]) !== sourceChainId) {
              try {
                await switchNetwork(sourceChainId);
              } catch (switchErr) {
                const errorMessage = `Failed to switch to ${fromChain}. Please manually switch your wallet to ${fromChain} and try again.`;
                addMessageToCurrentChat("assistant", errorMessage);

                try {
                  await orchestratedAgentChat({
                    agentName: "orchestratedAgent",
                    userId: user?.id ?? "",
                    message: `${errorMessage}`,
                    threadId: chatId,
                    walletAddress: address ?? "",
                    isTransaction: true,
                  });
                } catch (notifyError) {
                  console.error("Failed to notify backend about network switch error:", notifyError);
                }

                return;
              }
            }

            // Show execution message
            const exchangeTypeLabel = exchange_type === "cross-chain" ? "Cross-chain exchange" : "Exchange";
            addMessageToCurrentChat(
              "assistant",
              `🔄 ${exchangeTypeLabel} in progress: ${fromAmount} ${fromToken.toUpperCase()} (${fromChain}) → ${toToken.toUpperCase()} (${toChain}), don't close the page until confirmation...`
            );

            setExecutingChangeNow(true);
            try {
              const result = await executeChangeNowExchange({
                fromCurrency: fromToken,
                fromNetwork: fromNetwork,
                toCurrency: toToken,
                toNetwork: toNetwork,
                amount: fromAmount,
                recipientAddress: toAddress || address || "",
                refundAddress: fromAddress || address,
                autoSendFromWallet: true,
                onProgress: (progress) => {
                  console.log("[ChangeNow Progress]", progress);

                  // Update UI based on progress
                  if (progress.step === "sending" && progress.status === "loading") {
                    updateLastAiMessage(`🔄 Sending ${fromAmount} ${fromToken.toUpperCase()} to the exchange...`);
                  } else if (progress.step === "tracking" && progress.status === "loading") {
                    updateLastAiMessage(`⏳ Waiting for exchange confirmation. Status: ${progress.message || "Processing..."}`);
                  }
                },
              });

              if (result.success && result.exchange) {
                // Get block explorer URL for the source chain
                const explorerUrls: Record<string, string> = {
                  eth: "https://etherscan.io/",
                  matic: "https://polygonscan.com/",
                  arbitrum: "https://arbiscan.io/",
                  op: "https://optimistic.etherscan.io/",
                  base: "https://basescan.org/",
                  bsc: "https://bscscan.com/",
                  cchain: "https://snowtrace.io/",
                  linea: "https://lineascan.build/",
                  scroll: "https://scrollscan.com/",
                  zksync: "https://explorer.zksync.io/",
                  bera: "https://berascan.com/",
                };

                const explorerUrl = explorerUrls[sourceNetwork.toLowerCase()] || "https://etherscan.io/";
                const depositTxUrl = result.depositTxHash
                  ? `${explorerUrl}tx/${result.depositTxHash}`
                  : null;

                // Create transaction record
                const chainInfo = await getChainInfoById(sourceChainId);
                if (chainInfo) {
                  await createTransv2(
                    user?.id ?? "",
                    "changeNowExchangeAgent",
                    exchange_type === "cross-chain" ? "BRIDGE" : "SWAP",
                    `${exchange_type === "cross-chain" ? "Bridge" : "Exchange"} ${fromAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()} via ChangeNow`,
                    chainInfo.chainName,
                    new Date(),
                    fromToken.toUpperCase(),
                    fromAmount,
                    result.depositTxHash || result.exchange.id,
                    depositTxUrl || `https://changenow.io/exchange/txs/${result.exchange.id}`,
                    "SUCCESS",
                    chainInfo.rpcUrl,
                    chainInfo.nativeTokenSymbol,
                    chainInfo.decimals,
                    toToken.toUpperCase(),
                    "ChangeNow Exchange Agent"
                  );
                }

                // Build success message
                let statusMessage = `Your ${exchange_type === "cross-chain" ? "cross-chain exchange" : "exchange"} of ${fromAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()} was initiated successfully! 🎉\n\n`;

                if (depositTxUrl) {
                  statusMessage += `📤 Deposit transaction: [View on Explorer](${depositTxUrl})\n`;
                }

                statusMessage += `🔄 Track exchange status: [ChangeNow](https://changenow.io/exchange/txs/${result.exchange.id})`;

                // Check final transaction status
                if (result.transaction) {
                  if (result.transaction.status === "finished") {
                    // Get the actual received amount from the transaction
                    const receivedAmount = result.transaction.amountTo ?? result.transaction.expectedAmountTo;
                    statusMessage = `Your ${exchange_type === "cross-chain" ? "cross-chain exchange" : "exchange"} of ${fromAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()} completed successfully! 🎉\n\n`;
                    if (receivedAmount) {
                      statusMessage += `💰 Received: **${receivedAmount} ${toToken.toUpperCase()}**\n`;
                    }
                    if (result.transaction.payoutHash) {
                      const destNetwork = toChangeNowNetwork(toNetwork);
                      const destExplorerUrl = explorerUrls[destNetwork.toLowerCase()] || "https://etherscan.io/";
                      statusMessage += `📥 Transaction: [View on Explorer](${destExplorerUrl}tx/${result.transaction.payoutHash})\n`;
                    }
                    statusMessage += `🔄 Exchange details: [ChangeNow](https://changenow.io/exchange/txs/${result.exchange.id})`;
                  } else if (["failed", "refunded", "expired"].includes(result.transaction.status)) {
                    statusMessage = `Your exchange ${result.transaction.status}. `;
                    if (result.transaction.status === "refunded") {
                      statusMessage += "Your funds have been refunded to your wallet.";
                    } else {
                      statusMessage += "This can happen due to market volatility or network delays. Please try again.";
                    }
                    statusMessage += `\n\n🔄 View details: [ChangeNow](https://changenow.io/exchange/txs/${result.exchange.id})`;
                  }
                }

                updateLastAiMessage(statusMessage);

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
                // Handle error - check if it's a user rejection first
                let errorMsg = result.error || "The exchange couldn't be completed. Please try again.";

                // Check if the error indicates user rejection (in case the hook didn't catch it)
                if (result.error) {
                  const errorLower = result.error.toLowerCase();
                  if (
                    errorLower.includes("user rejected") ||
                    errorLower.includes("user denied") ||
                    errorLower.includes("rejected the request") ||
                    errorLower.includes("denied transaction") ||
                    errorLower.includes("cancelled the transaction")
                  ) {
                    errorMsg = "Looks like you cancelled the transaction. No worries! Let me know when you're ready to try again.";
                  }
                }

                // Create failed transaction record
                const chainInfo = await getChainInfoById(sourceChainId);
                await createTrans(
                  user?.id ?? "",
                  "changeNowExchangeAgent",
                  exchange_type === "cross-chain" ? "BRIDGE" : "SWAP",
                  `Failed ${exchange_type === "cross-chain" ? "bridge" : "exchange"}: ${fromAmount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}`,
                  chainInfo?.chainName || fromChain,
                  new Date(),
                  fromToken.toUpperCase(),
                  fromAmount,
                  `failed_${uuidv4()}`,
                  `https://changenow.io`,
                  "FAILED",
                  0,
                  0,
                  "ChangeNow Exchange Agent"
                );

                updateLastAiMessage(errorMsg);

                try {
                  await orchestratedAgentChat({
                    agentName: "orchestratedAgent",
                    userId: user?.id ?? "",
                    message: `${errorMsg}`,
                    threadId: chatId,
                    walletAddress: address ?? "",
                    isTransaction: true,
                  });
                } catch (notifyError) {
                  console.error("Failed to notify backend about ChangeNow failure:", notifyError);
                }
              }
            } catch (err) {
              console.error("ChangeNow execution error:", err);
              const error = err as TransactionError;
              let userFriendlyMessage = "";

              const errorMessage = error?.message?.toLowerCase() || "";

              // Check for user rejection (expanded patterns)
              if (
                error?.code === "ACTION_REJECTED" ||
                errorMessage.includes("user rejected") ||
                errorMessage.includes("user denied") ||
                errorMessage.includes("rejected the request") ||
                errorMessage.includes("denied transaction")
              ) {
                userFriendlyMessage = "Looks like you cancelled the transaction. No worries! Let me know when you're ready to try again.";
              } else {
                // Use error message directly - the hook returns natural messages
                userFriendlyMessage = error?.message || "Something went wrong with the exchange. Please try again.";
              }

              updateLastAiMessage(userFriendlyMessage);

              try {
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: `${userFriendlyMessage}`,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } catch (notifyError) {
                console.error("Failed to notify backend about ChangeNow catch error:", notifyError);
              }
            } finally {
              setExecutingChangeNow(false);
            }
            return;
          }

          // Handle tool errors
          if (toolMessage?.error) {
            // Generate natural AI response based on error
            let naturalErrorMessage = "";
            const errorStr = toolMessage.error.toLowerCase();
            const originalError = toolMessage.error;

            // Check for user rejection first (applies to all operations)
            if (
              errorStr.includes("user rejected") ||
              errorStr.includes("user denied") ||
              errorStr.includes("rejected the request") ||
              errorStr.includes("denied transaction") ||
              errorStr.includes("cancelled the transaction")
            ) {
              naturalErrorMessage = "Looks like you cancelled the transaction. No worries! Let me know when you're ready to try again.";
            }
            // ChangeNow specific error handling
            else if (errorStr.includes("token pair") || (errorStr.includes("pair") && errorStr.includes("not"))) {
              naturalErrorMessage = "This token pair isn't available for exchange right now. Please try a different combination of tokens.";
            } else if (errorStr.includes("below minimum") || errorStr.includes("min amount") || errorStr.includes("too small")) {
              // Extract minimum amount from error message like "Amount 4.5 USDC is below minimum 9.375075 USDC"
              const minMatch = originalError.match(/minimum[:\s]*([\d.]+)\s*(\w+)/i);
              if (minMatch) {
                naturalErrorMessage = `The amount you entered is below the minimum required for this exchange. Please use at least ${minMatch[1]} ${minMatch[2].toUpperCase()} to proceed.`;
              } else {
                naturalErrorMessage = "The amount you entered is below the minimum required for this exchange. Please try a larger amount.";
              }
            } else if (errorStr.includes("above maximum") || errorStr.includes("max amount") || errorStr.includes("too large")) {
              // Extract maximum amount from error message
              const maxMatch = originalError.match(/maximum[:\s]*([\d.]+)\s*(\w+)/i);
              if (maxMatch) {
                naturalErrorMessage = `The amount you entered exceeds the maximum allowed for this exchange. Please reduce the amount to ${maxMatch[1]} ${maxMatch[2].toUpperCase()} or less.`;
              } else {
                naturalErrorMessage = "The amount you entered exceeds the maximum allowed for this exchange. Please try a smaller amount.";
              }
            } else if (errorStr.includes("network") || (errorStr.includes("chain") && errorStr.includes("not"))) {
              naturalErrorMessage = "The network you specified isn't supported. Please use a supported network like Ethereum, Polygon, Arbitrum, Base, or BNB Chain.";
            } else if (errorStr.includes("balance") || errorStr.includes("insufficient")) {
              naturalErrorMessage = "You don't have enough balance to complete this exchange. Please check your wallet balance.";
            } else if (errorStr.includes("invalid token") || (errorStr.includes("invalid") && errorStr.includes("token symbol"))) {
              // Extract token name from error message like "Invalid token(s): fromToken 'ETH'"
              const tokenMatch = originalError.match(/['"](\w+)['"]/);
              if (tokenMatch) {
                naturalErrorMessage = `The token '${tokenMatch[1]}' isn't recognized. Please use the correct token symbol (e.g., WETH instead of ETH, WMNT instead of MNT) or provide the contract address.`;
              } else {
                naturalErrorMessage = "One or more tokens weren't recognized. Please check the token symbols or provide the contract addresses.";
              }
            } else if (errorStr.includes("address") && errorStr.includes("invalid") && !errorStr.includes("token")) {
              naturalErrorMessage = "The wallet address provided isn't valid. Please check and try again.";
            } else if (errorStr.includes("rate") && errorStr.includes("expired")) {
              naturalErrorMessage = "The exchange rate has expired. Please try again to get a fresh quote.";
            } else if (errorStr.includes("currency") && errorStr.includes("not found")) {
              naturalErrorMessage = "I couldn't find one of the tokens you specified. Please verify the token symbol and try again.";
            } else {
              // Fall back to error handling map for other errors (swap, bridge, lend, etc.)
              naturalErrorMessage = getErrorMessage(toolMessage.error);
            }

            // Add AI error message to chat
            addMessageToCurrentChat("assistant", naturalErrorMessage);

            // Notify backend about the transaction failure with natural message
            try {
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: `${naturalErrorMessage}`,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true, // Mark as transaction status update
              });
            } catch (error) {
              console.error("Failed to notify backend about transaction failure:", error);
            }

            return;
          }

          // =====================================
          // Mantle Bridge & Wrap Handlers
          // =====================================

          // Mantle Bridge: Deposit MNT (L1 -> L2)
          if (toolMessage?.type === "mantle_deposit_mnt") {
            const { amount, recipient, minGasLimit } = toolMessage.params;

            if (!amount) {
              addMessageToCurrentChat("assistant", "Missing amount for bridging MNT. Please try again.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Bridging ${amount} MNT from Ethereum to Mantle... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
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
              addMessageToCurrentChat("assistant", "Missing amount for bridging ETH. Please try again.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Bridging ${amount} ETH from Ethereum to Mantle... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
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
              addMessageToCurrentChat("assistant", "Missing amount for bridging MNT. Please try again.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Bridging ${amount} MNT from Mantle to Ethereum... Please confirm the transaction.`
            );

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
                  `Initiated bridge of ${amount} MNT from Mantle to Ethereum`,
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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
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
              addMessageToCurrentChat("assistant", "Missing amount for bridging WETH. Please try again.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Bridging ${amount} WETH from Mantle to Ethereum... Please confirm the transaction.`
            );

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
                  `Initiated bridge of ${amount} WETH from Mantle to Ethereum`,
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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
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
              addMessageToCurrentChat("assistant", "Missing amount for wrapping MNT. Please try again.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Wrapping ${amount} MNT to WMNT on Mantle... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage(result.message || "Wrapping MNT failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Mantle wrap MNT error:", err);
              updateLastAiMessage(err?.message || "Wrapping MNT failed. Please try again.");
            } finally {
              setExecutingMantle(false);
            }
            return;
          }

          // Mantle: Unwrap WMNT to MNT
          if (toolMessage?.type === "mantle_unwrap_mnt") {
            const { amount } = toolMessage.params;

            if (!amount) {
              addMessageToCurrentChat("assistant", "Missing amount for unwrapping WMNT. Please try again.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Unwrapping ${amount} WMNT to MNT on Mantle... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage(result.message || "Unwrapping WMNT failed. Please try again.");
              }
            } catch (err: any) {
              console.error("Mantle unwrap MNT error:", err);
              updateLastAiMessage(err?.message || "Unwrapping WMNT failed. Please try again.");
            } finally {
              setExecutingMantle(false);
            }
            return;
          }

          // Mantle: Get MNT Balances
          if (toolMessage?.type === "mantle_get_mnt_balances") {
            const { network } = toolMessage.params;

            addMessageToCurrentChat("assistant", "🔍 Fetching your MNT balances...");

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

            addMessageToCurrentChat("assistant", "🔍 Fetching your ETH balances...");

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
            addMessageToCurrentChat("assistant", "🔍 Fetching Mantle network gas price info...");

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
              addMessageToCurrentChat("assistant", "Missing asset or amount for Lendle deposit. Please try again.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Depositing ${amount} tokens into Lendle on Mantle... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                const errorMsg = result.message || "Lendle deposit failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("Lendle deposit error:", err);
              const errorMsg = err?.message || "Lendle deposit failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Deposit MNT
          if (toolMessage?.type === "lendle_deposit_mnt") {
            const { amount, onBehalfOf } = toolMessage.params;

            if (!amount) {
              addMessageToCurrentChat("assistant", "Missing amount for Lendle MNT deposit. Please try again.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Depositing ${amount} MNT into Lendle on Mantle... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                const errorMsg = result.message || "Lendle MNT deposit failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("Lendle deposit MNT error:", err);
              const errorMsg = err?.message || "Lendle MNT deposit failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Withdraw Token
          if (toolMessage?.type === "lendle_withdraw") {
            const { asset, amount, to } = toolMessage.params;

            if (!asset || !amount) {
              addMessageToCurrentChat("assistant", "Missing asset or amount for Lendle withdrawal. Please try again.");
              return;
            }

            const displayAmount = amount.toLowerCase() === "max" ? "all" : amount;
            addMessageToCurrentChat(
              "assistant",
              `🔄 Withdrawing ${displayAmount} tokens from Lendle... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                const errorMsg = result.message || "Lendle withdrawal failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("Lendle withdraw error:", err);
              const errorMsg = err?.message || "Lendle withdrawal failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Withdraw MNT
          if (toolMessage?.type === "lendle_withdraw_mnt") {
            const { amount, to } = toolMessage.params;

            if (!amount) {
              addMessageToCurrentChat("assistant", "Missing amount for Lendle MNT withdrawal. Please try again.");
              return;
            }

            const displayAmount = amount.toLowerCase() === "max" ? "all" : amount;
            addMessageToCurrentChat(
              "assistant",
              `🔄 Withdrawing ${displayAmount} MNT from Lendle... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                const errorMsg = result.message || "Lendle MNT withdrawal failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("Lendle withdraw MNT error:", err);
              const errorMsg = err?.message || "Lendle MNT withdrawal failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Borrow Token
          if (toolMessage?.type === "lendle_borrow") {
            const { asset, amount, interestRateMode, onBehalfOf, referralCode } = toolMessage.params;

            if (!asset || !amount) {
              addMessageToCurrentChat("assistant", "Missing asset or amount for Lendle borrow. Please try again.");
              return;
            }

            const rateType = interestRateMode === 1 ? "Stable" : "Variable";
            addMessageToCurrentChat(
              "assistant",
              `🔄 Borrowing ${amount} tokens from Lendle at ${rateType} rate... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                const errorMsg = result.message || "Lendle borrow failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("Lendle borrow error:", err);
              const errorMsg = err?.message || "Lendle borrow failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Borrow MNT
          if (toolMessage?.type === "lendle_borrow_mnt") {
            const { amount, interestRateMode } = toolMessage.params;

            if (!amount) {
              addMessageToCurrentChat("assistant", "Missing amount for Lendle MNT borrow. Please try again.");
              return;
            }

            const rateType = interestRateMode === 1 ? "Stable" : "Variable";
            addMessageToCurrentChat(
              "assistant",
              `🔄 Borrowing ${amount} MNT from Lendle at ${rateType} rate... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                const errorMsg = result.message || "Lendle MNT borrow failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("Lendle borrow MNT error:", err);
              const errorMsg = err?.message || "Lendle MNT borrow failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Repay Token
          if (toolMessage?.type === "lendle_repay") {
            const { asset, amount, rateMode, onBehalfOf } = toolMessage.params;

            if (!asset || !amount) {
              addMessageToCurrentChat("assistant", "Missing asset or amount for Lendle repay. Please try again.");
              return;
            }

            const displayAmount = amount.toLowerCase() === "max" ? "all" : amount;
            const rateType = rateMode === 1 ? "Stable" : "Variable";
            addMessageToCurrentChat(
              "assistant",
              `🔄 Repaying ${displayAmount} tokens on Lendle (${rateType} rate)... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                const errorMsg = result.message || "Lendle repay failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("Lendle repay error:", err);
              const errorMsgLower = err?.message?.toLowerCase() || "";
              let errorMsg: string;
              if (
                err?.code === "ACTION_REJECTED" ||
                errorMsgLower.includes("user rejected") ||
                errorMsgLower.includes("user denied") ||
                errorMsgLower.includes("cancelled") ||
                errorMsgLower.includes("canceled")
              ) {
                errorMsg = "No problem! You cancelled the repay transaction. Let me know when you're ready to try again.";
              } else {
                errorMsg = err?.message || "Lendle repay failed. Please try again.";
              }
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Repay MNT
          if (toolMessage?.type === "lendle_repay_mnt") {
            const { amount, rateMode, onBehalfOf } = toolMessage.params;

            if (!amount) {
              addMessageToCurrentChat("assistant", "Missing amount for Lendle MNT repay. Please try again.");
              return;
            }

            const displayAmount = amount.toLowerCase() === "max" ? "all" : amount;
            const rateType = rateMode === 1 ? "Stable" : "Variable";
            addMessageToCurrentChat(
              "assistant",
              `🔄 Repaying ${displayAmount} MNT on Lendle (${rateType} rate)... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                const errorMsg = result.message || "Lendle MNT repay failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("Lendle repay MNT error:", err);
              const errorMsgLower = err?.message?.toLowerCase() || "";
              let errorMsg: string;
              if (
                err?.code === "ACTION_REJECTED" ||
                errorMsgLower.includes("user rejected") ||
                errorMsgLower.includes("user denied") ||
                errorMsgLower.includes("cancelled") ||
                errorMsgLower.includes("canceled")
              ) {
                errorMsg = "No problem! You cancelled the MNT repay transaction. Let me know when you're ready to try again.";
              } else {
                errorMsg = err?.message || "Lendle MNT repay failed. Please try again.";
              }
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Get User Account Data
          if (toolMessage?.type === "lendle_get_user_account_data") {
            const { userAddress } = toolMessage.params;

            addMessageToCurrentChat("assistant", "🔍 Fetching your Lendle account data...");

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

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
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
              addMessageToCurrentChat("assistant", "Missing asset for Lendle reserve data. Please try again.");
              return;
            }

            // Handle native MNT - use WMNT address instead
            const assetLower = asset.toLowerCase();
            if (assetLower === "native" || assetLower === "mnt" || assetLower === "mantle") {
              asset = LENDLE_ASSETS.WMNT;
            }

            addMessageToCurrentChat("assistant", "🔍 Fetching your Lendle reserve data...");

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

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage("Unable to fetch Lendle reserve data. Please make sure your wallet is connected.");
              }
            } catch (err: any) {
              console.error("Lendle get user reserve data error:", err);
              // Handle invalid address error with friendly message
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
              addMessageToCurrentChat("assistant", "Missing asset for Lendle reserve data. Please try again.");
              return;
            }

            // Handle native MNT - use WMNT address instead
            const assetLower = asset.toLowerCase();
            if (assetLower === "native" || assetLower === "mnt" || assetLower === "mantle") {
              asset = LENDLE_ASSETS.WMNT;
            }

            addMessageToCurrentChat("assistant", "🔍 Fetching Lendle reserve data...");

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

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage("Unable to fetch Lendle reserve data. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle get reserve data error:", err);
              // Handle invalid address error with friendly message
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
              addMessageToCurrentChat("assistant", "Missing asset for Lendle reserve config. Please try again.");
              return;
            }

            // Handle native MNT - use WMNT address instead
            const assetLower = asset.toLowerCase();
            if (assetLower === "native" || assetLower === "mnt" || assetLower === "mantle") {
              asset = LENDLE_ASSETS.WMNT;
            }

            addMessageToCurrentChat("assistant", "🔍 Fetching Lendle reserve configuration...");

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

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage("Unable to fetch Lendle reserve configuration. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle get reserve config error:", err);
              // Handle invalid address error with friendly message
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
              addMessageToCurrentChat("assistant", "Missing amount for LEND staking. Please try again.");
              return;
            }

            const lockText = lock ? " (locked)" : "";
            addMessageToCurrentChat(
              "assistant",
              `🔄 Staking ${amount} LEND tokens${lockText}... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
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
              addMessageToCurrentChat("assistant", "Missing amount for LEND withdrawal. Please try again.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Withdrawing ${amount} staked LEND tokens... Please confirm the transaction.`
            );

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

                const statusMessage = `Successfully withdrew ${amount} staked LEND tokens! [View on Mantlescan frames](${explorerUrl})`;

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
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
            addMessageToCurrentChat(
              "assistant",
              `🔄 Claiming LEND staking rewards... Please confirm the transaction.`
            );

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

                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
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

            addMessageToCurrentChat("assistant", "🔍 Fetching your LEND staking info...");

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

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage("Unable to fetch LEND staking info. Please make sure your wallet is connected.");
              }
            } catch (err: any) {
              console.error("Lendle get staking info error:", err);
              updateLastAiMessage(err?.message || "Failed to fetch LEND staking info.");
            }
            return;
          }

          // Lendle: Get LEND Balance
          if (toolMessage?.type === "lendle_get_lend_balance") {
            addMessageToCurrentChat("assistant", "🔍 Checking your LEND token balance...");

            try {
              const lendBalance = await lendleGetLendBalance();

              if (lendBalance) {
                const statusMessage = `**Your LEND Token Balance:**\n\n` +
                  `- **Balance:** ${parseFloat(lendBalance.balance).toFixed(6)} LEND`;
                updateLastAiMessage(statusMessage);

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage("Unable to fetch LEND balance. Please make sure your wallet is connected.");
              }
            } catch (err: any) {
              console.error("Lendle get LEND balance error:", err);
              updateLastAiMessage(err?.message || "Failed to fetch LEND balance.");
            }
            return;
          }

          // Lendle: Get Pending Rewards (Lending/Borrowing incentives)
          if (toolMessage?.type === "lendle_get_pending_rewards") {
            const { lTokenAddresses } = toolMessage.params;

            addMessageToCurrentChat("assistant", "🔍 Checking your pending rewards...");

            try {
              // If no lToken addresses provided, get all reserves and use their lToken addresses
              let tokenAddresses = lTokenAddresses;
              if (!tokenAddresses || tokenAddresses.length === 0) {
                const reserves = await lendleGetAllReserves();
                tokenAddresses = reserves.map((r: any) => r.lTokenAddress);
              }

              const rewards = await lendleGetPendingRewards(tokenAddresses);

              if (rewards && rewards.length > 0) {
                const totalRewards = rewards.reduce((sum: number, r: string) => sum + parseFloat(r), 0);
                const statusMessage = `**Your Pending Lending Rewards:**\n\n` +
                  `- **Total Pending:** ${totalRewards.toFixed(6)} LEND\n\n` +
                  `You can claim these rewards anytime.`;
                updateLastAiMessage(statusMessage);

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage("You don't have any pending lending rewards at the moment.");
              }
            } catch (err: any) {
              console.error("Lendle get pending rewards error:", err);
              updateLastAiMessage(err?.message || "Failed to fetch pending rewards.");
            }
            return;
          }

          // Lendle: Claim Rewards (Lending/Borrowing incentives)
          if (toolMessage?.type === "lendle_claim_rewards") {
            const { lTokenAddresses } = toolMessage.params;

            addMessageToCurrentChat("assistant", "🔄 Claiming your lending rewards... Please confirm the transaction.");

            setExecutingLendle(true);

            try {
              // If no lToken addresses provided, get all reserves and use their lToken addresses
              let tokenAddresses = lTokenAddresses;
              if (!tokenAddresses || tokenAddresses.length === 0) {
                const reserves = await lendleGetAllReserves();
                tokenAddresses = reserves.map((r: any) => r.lTokenAddress);
              }

              const result = await lendleClaimRewards(tokenAddresses);

              if (result.success && result.txHash) {
                const explorerUrl = `https://mantlescan.xyz/tx/${result.txHash}`;

                await createTransv2(
                  user?.id ?? '',
                  "lendleAgent",
                  "WITHDRAW",
                  "Claimed lending rewards on Lendle",
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

                const statusMessage = `Successfully claimed your lending rewards! [View on Mantlescan](${explorerUrl})`;
                updateLastAiMessage(statusMessage);

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage(result.message || "Failed to claim rewards. Please try again.");
              }
            } catch (err: any) {
              console.error("Lendle claim rewards error:", err);
              const errorMsg = err?.message?.toLowerCase() || "";
              if (
                err?.code === "ACTION_REJECTED" ||
                errorMsg.includes("user rejected") ||
                errorMsg.includes("user denied") ||
                errorMsg.includes("cancelled") ||
                errorMsg.includes("canceled")
              ) {
                updateLastAiMessage("No problem! You cancelled the claim transaction. Let me know when you're ready to try again.");
              } else {
                updateLastAiMessage(err?.message || "Failed to claim rewards. Please try again.");
              }
            } finally {
              setExecutingLendle(false);
            }
            return;
          }

          // Lendle: Get All Reserves
          if (toolMessage?.type === "lendle_get_all_reserves") {
            addMessageToCurrentChat("assistant", "🔍 Fetching all reserves data on Lendle...");

            try {
              const reserves = await lendleGetAllReserves();

              if (reserves && reserves.length > 0) {
                const reservesWithData: Array<{symbol: string; available: string; supplyAPY: string; borrowAPY: string}> = [];

                for (const reserve of reserves) {
                  const reserveData = await lendleGetReserveData(reserve.address);
                  if (reserveData && parseFloat(reserveData.availableLiquidity) > 0) {
                    reservesWithData.push({
                      symbol: reserve.symbol,
                      available: parseFloat(reserveData.availableLiquidity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                      supplyAPY: reserveData.liquidityRate,
                      borrowAPY: reserveData.variableBorrowRate,
                    });
                  }
                }

                if (reservesWithData.length > 0) {
                  let statusMessage = `**Lendle Reserves Overview:**\n\n`;
                  statusMessage += `| Asset | Available | Supply APY | Borrow APY |\n`;
                  statusMessage += `|:------|----------:|-----------:|-----------:|\n`;

                  for (const r of reservesWithData) {
                    statusMessage += `| ${r.symbol} | ${r.available} | ${r.supplyAPY}% | ${r.borrowAPY}% |\n`;
                  }

                  updateLastAiMessage(statusMessage);

                  // Save to backend for persistence
                  await orchestratedAgentChat({
                    agentName: "orchestratedAgent",
                    userId: user?.id ?? "",
                    message: statusMessage,
                    threadId: chatId,
                    walletAddress: address ?? "",
                    isTransaction: true,
                  });
                } else {
                  updateLastAiMessage("No reserves with available liquidity found.");
                }
              } else {
                updateLastAiMessage("Unable to fetch reserves. Please try again later.");
              }
            } catch (err: any) {
              console.error("Lendle get all reserves error:", err);
              updateLastAiMessage(err?.message || "Failed to fetch Lendle reserves.");
            }
            return;
          }

          // =====================================
          // FusionX DEX Handlers
          // =====================================

          // FusionX: Swap Exact Tokens For Tokens
          if (toolMessage?.type === "fusionx_swap_exact_tokens_for_tokens") {
            const { amountIn, amountOutMin, path, to, deadline } = toolMessage.params;

            if (!amountIn || !path || path.length < 2) {
              addMessageToCurrentChat("assistant", "Missing parameters for FusionX swap. Please provide amount and token path.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Swapping ${amountIn} tokens on FusionX... Please confirm the transaction.`
            );

            setExecutingFusionX(true);

            try {
              const result = await fusionXSwapExactTokensForTokens({
                amountIn,
                amountOutMin: amountOutMin || "0",
                path,
                to: to || undefined,
                deadline: deadline || undefined,
              });

              if (result.success && result.txHash) {
                const explorerUrl = fusionXGetExplorerUrl(result.txHash);

                await createTransv2(
                  user?.id ?? '',
                  "fusionXAgent",
                  "SWAP",
                  `Swapped ${amountIn} tokens on FusionX`,
                  "Mantle",
                  new Date(),
                  "TOKEN",
                  parseFloat(amountIn),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "TOKEN",
                  "FusionX Agent"
                );

                const statusMessage = `Successfully swapped ${amountIn} tokens on FusionX! [View on Mantlescan](${explorerUrl})`;

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);
              } else {
                const errorMsg = result.message || "FusionX swap failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("FusionX swap error:", err);
              const errorMsg = err?.message || "FusionX swap failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingFusionX(false);
            }
            return;
          }

          // FusionX: Swap Exact MNT For Tokens
          if (toolMessage?.type === "fusionx_swap_exact_mnt_for_tokens") {
            const { amountIn, amountOutMin, tokenOut } = toolMessage.params;

            if (!amountIn || !tokenOut) {
              addMessageToCurrentChat("assistant", "Missing parameters for FusionX MNT swap. Please provide amount and output token.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Swapping ${amountIn} MNT for tokens on FusionX... Please confirm the transaction.`
            );

            setExecutingFusionX(true);

            try {
              const result = await fusionXSwapExactMNTForTokens({
                amountIn,
                amountOutMin: amountOutMin || "0",
                tokenOut,
              });

              if (result.success && result.txHash) {
                const explorerUrl = fusionXGetExplorerUrl(result.txHash);

                await createTransv2(
                  user?.id ?? '',
                  "fusionXAgent",
                  "SWAP",
                  `Swapped ${amountIn} MNT for tokens on FusionX`,
                  "Mantle",
                  new Date(),
                  "MNT",
                  parseFloat(amountIn),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "TOKEN",
                  "FusionX Agent"
                );

                const statusMessage = `Successfully swapped ${amountIn} MNT for tokens on FusionX! [View on Mantlescan](${explorerUrl})`;

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);
              } else {
                const errorMsg = result.message || "FusionX MNT swap failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("FusionX MNT swap error:", err);
              const errorMsg = err?.message || "FusionX MNT swap failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingFusionX(false);
            }
            return;
          }

          // FusionX: Swap Exact Tokens For MNT
          if (toolMessage?.type === "fusionx_swap_exact_tokens_for_mnt") {
            const { tokenIn, amountIn, amountOutMin } = toolMessage.params;

            if (!amountIn || !tokenIn) {
              addMessageToCurrentChat("assistant", "Missing parameters for FusionX swap to MNT. Please provide amount and input token.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Swapping ${amountIn} tokens for MNT on FusionX... Please confirm the transaction.`
            );

            setExecutingFusionX(true);

            try {
              const result = await fusionXSwapExactTokensForMNT({
                tokenIn,
                amountIn,
                amountOutMin: amountOutMin || "0",
              });

              if (result.success && result.txHash) {
                const explorerUrl = fusionXGetExplorerUrl(result.txHash);

                await createTransv2(
                  user?.id ?? '',
                  "fusionXAgent",
                  "SWAP",
                  `Swapped ${amountIn} tokens for MNT on FusionX`,
                  "Mantle",
                  new Date(),
                  "TOKEN",
                  parseFloat(amountIn),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "MNT",
                  "FusionX Agent"
                );

                const statusMessage = `Successfully swapped ${amountIn} tokens for MNT on FusionX! [View on Mantlescan](${explorerUrl})`;

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);
              } else {
                const errorMsg = result.message || "FusionX swap to MNT failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("FusionX swap to MNT error:", err);
              const errorMsg = err?.message || "FusionX swap to MNT failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingFusionX(false);
            }
            return;
          }

          // FusionX: Add Liquidity
          if (toolMessage?.type === "fusionx_add_liquidity") {
            const { tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline } = toolMessage.params;

            if (!tokenA || !tokenB || !amountADesired || !amountBDesired) {
              addMessageToCurrentChat("assistant", "Missing parameters for adding liquidity. Please provide both tokens and amounts.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Adding liquidity to FusionX pool... Please confirm the transaction.`
            );

            setExecutingFusionX(true);

            try {
              const result = await fusionXAddLiquidity({
                tokenA,
                tokenB,
                amountADesired,
                amountBDesired,
                amountAMin: amountAMin || "0",
                amountBMin: amountBMin || "0",
                to: to || undefined,
                deadline: deadline || undefined,
              });

              if (result.success && result.txHash) {
                const explorerUrl = fusionXGetExplorerUrl(result.txHash);

                await createTransv2(
                  user?.id ?? '',
                  "fusionXAgent",
                  "LEND",
                  `Added liquidity to FusionX pool`,
                  "Mantle",
                  new Date(),
                  "LP",
                  parseFloat(amountADesired),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "LP Token",
                  "FusionX Agent"
                );

                const statusMessage = `Successfully added liquidity to FusionX pool! [View on Mantlescan](${explorerUrl})`;

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);
              } else {
                const errorMsg = result.message || "Adding liquidity failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("FusionX add liquidity error:", err);
              const errorMsg = err?.message || "Adding liquidity failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingFusionX(false);
            }
            return;
          }

          // FusionX: Remove Liquidity
          if (toolMessage?.type === "fusionx_remove_liquidity") {
            const { tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline } = toolMessage.params;

            if (!tokenA || !tokenB || !liquidity) {
              addMessageToCurrentChat("assistant", "Missing parameters for removing liquidity. Please provide tokens and liquidity amount.");
              return;
            }

            addMessageToCurrentChat(
              "assistant",
              `🔄 Removing ${liquidity} LP tokens from FusionX pool... Please confirm the transaction.`
            );

            setExecutingFusionX(true);

            try {
              const result = await fusionXRemoveLiquidity({
                tokenA,
                tokenB,
                liquidity,
                amountAMin: amountAMin || "0",
                amountBMin: amountBMin || "0",
                to: to || undefined,
                deadline: deadline || undefined,
              });

              if (result.success && result.txHash) {
                const explorerUrl = fusionXGetExplorerUrl(result.txHash);

                await createTransv2(
                  user?.id ?? '',
                  "fusionXAgent",
                  "WITHDRAW",
                  `Removed ${liquidity} LP tokens from FusionX pool`,
                  "Mantle",
                  new Date(),
                  "LP",
                  parseFloat(liquidity),
                  result.txHash,
                  explorerUrl,
                  "SUCCESS",
                  "https://rpc.mantle.xyz",
                  "MNT",
                  18,
                  "TOKEN",
                  "FusionX Agent"
                );

                const statusMessage = `Successfully removed ${liquidity} LP tokens from FusionX pool! [View on Mantlescan](${explorerUrl})`;

                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });

                updateLastAiMessage(statusMessage);
              } else {
                const errorMsg = result.message || "Removing liquidity failed. Please try again.";
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: errorMsg,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
                updateLastAiMessage(errorMsg);
              }
            } catch (err: any) {
              console.error("FusionX remove liquidity error:", err);
              const errorMsg = err?.message || "Removing liquidity failed. Please try again.";
              await orchestratedAgentChat({
                agentName: "orchestratedAgent",
                userId: user?.id ?? "",
                message: errorMsg,
                threadId: chatId,
                walletAddress: address ?? "",
                isTransaction: true,
              });
              updateLastAiMessage(errorMsg);
            } finally {
              setExecutingFusionX(false);
            }
            return;
          }

          // FusionX: Get V2 Quote
          if (toolMessage?.type === "fusionx_get_v2_quote") {
            const { amountIn, path } = toolMessage.params;

            if (!amountIn || !path || path.length < 2) {
              addMessageToCurrentChat("assistant", "Missing parameters for swap quote. Please provide amount and token path.");
              return;
            }

            addMessageToCurrentChat("assistant", "🔍 Getting swap quote from FusionX...");

            try {
              const quote = await fusionXGetV2Quote(amountIn, path);

              if (quote) {
                const statusMessage = `**FusionX Swap Quote:**\n\n` +
                  `- **Input Amount:** ${amountIn}\n` +
                  `- **Expected Output:** ${quote.amountOut}\n` +
                  `- **Price Impact:** ${quote.priceImpact}\n` +
                  `- **Route:** ${path.length} hops`;
                updateLastAiMessage(statusMessage);

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage("Unable to get swap quote. The trading pair may not have sufficient liquidity.");
              }
            } catch (err: any) {
              console.error("FusionX get quote error:", err);
              updateLastAiMessage("Failed to get swap quote. Please try again.");
            }
            return;
          }

          // FusionX: Get V2 Pair Info
          if (toolMessage?.type === "fusionx_get_v2_pair_info") {
            const { tokenA, tokenB } = toolMessage.params;

            if (!tokenA || !tokenB) {
              addMessageToCurrentChat("assistant", "Missing token addresses for pair info. Please provide both tokens.");
              return;
            }

            addMessageToCurrentChat("assistant", "🔍 Fetching FusionX pool information...");

            try {
              const pairInfo = await fusionXGetV2PairInfo(tokenA, tokenB);

              if (pairInfo) {
                const statusMessage = `**FusionX Pool Information:**\n\n` +
                  `- **Pair Address:** \`${pairInfo.pairAddress}\`\n` +
                  `- **${pairInfo.token0Symbol} Reserve:** ${pairInfo.reserve0}\n` +
                  `- **${pairInfo.token1Symbol} Reserve:** ${pairInfo.reserve1}\n` +
                  `- **Total LP Supply:** ${pairInfo.totalSupply}`;
                updateLastAiMessage(statusMessage);

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage("This trading pair doesn't exist on FusionX yet. You can create it by adding liquidity.");
              }
            } catch (err: any) {
              console.error("FusionX get pair info error:", err);
              updateLastAiMessage("Failed to fetch pool information. Please try again.");
            }
            return;
          }

          // FusionX: Get V2 LP Balance
          if (toolMessage?.type === "fusionx_get_v2_lp_balance") {
            const { tokenA, tokenB, userAddress } = toolMessage.params;

            if (!tokenA || !tokenB) {
              addMessageToCurrentChat("assistant", "Missing token addresses for LP balance check.");
              return;
            }

            addMessageToCurrentChat("assistant", "🔍 Checking your LP token balance...");

            try {
              const lpBalance = await fusionXGetV2LPBalance(tokenA, tokenB, userAddress || undefined);

              if (lpBalance) {
                const statusMessage = `**Your FusionX LP Position:**\n\n` +
                  `- **LP Token Balance:** ${lpBalance.balance}\n` +
                  `- **Your Share:** ${lpBalance.sharePercent}%\n` +
                  `- **${lpBalance.token0Symbol} Value:** ${lpBalance.token0Amount}\n` +
                  `- **${lpBalance.token1Symbol} Value:** ${lpBalance.token1Amount}`;
                updateLastAiMessage(statusMessage);

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage("You don't have any LP tokens for this pair, or the pair doesn't exist.");
              }
            } catch (err: any) {
              console.error("FusionX get LP balance error:", err);
              updateLastAiMessage("Failed to fetch LP balance. Please try again.");
            }
            return;
          }

          // FusionX: Get User LP History
          if (toolMessage?.type === "fusionx_get_user_lp_history") {
            const { userAddress } = toolMessage.params;

            addMessageToCurrentChat("assistant", "🔍 Fetching your FusionX LP history...");

            try {
              const lpHistory = await fusionXGetUserLPHistory(userAddress || undefined);

              if (lpHistory && (lpHistory.mints.length > 0 || lpHistory.burns.length > 0)) {
                let statusMessage = `**Your FusionX LP History:**\n\n`;

                if (lpHistory.mints.length > 0) {
                  statusMessage += `**Recent Liquidity Additions (${lpHistory.mints.length}):**\n`;
                  lpHistory.mints.slice(0, 5).forEach((mint: any, i: number) => {
                    statusMessage += `${i + 1}. ${mint.pair?.token0?.symbol}/${mint.pair?.token1?.symbol} - ${parseFloat(mint.amountUSD || 0).toFixed(2)} USD\n`;
                  });
                }

                if (lpHistory.burns.length > 0) {
                  statusMessage += `\n**Recent Liquidity Removals (${lpHistory.burns.length}):**\n`;
                  lpHistory.burns.slice(0, 5).forEach((burn: any, i: number) => {
                    statusMessage += `${i + 1}. ${burn.pair?.token0?.symbol}/${burn.pair?.token1?.symbol} - ${parseFloat(burn.amountUSD || 0).toFixed(2)} USD\n`;
                  });
                }

                updateLastAiMessage(statusMessage);

                // Save to backend for persistence
                await orchestratedAgentChat({
                  agentName: "orchestratedAgent",
                  userId: user?.id ?? "",
                  message: statusMessage,
                  threadId: chatId,
                  walletAddress: address ?? "",
                  isTransaction: true,
                });
              } else {
                updateLastAiMessage("No LP history found. You haven't added or removed liquidity on FusionX yet.");
              }
            } catch (err: any) {
              console.error("FusionX get LP history error:", err);
              updateLastAiMessage("Failed to fetch LP history. Please try again.");
            }
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
        const errorMessage = "I encountered an issue processing your request. This might be a temporary service problem. Could you please try again in a moment?";
        addMessageToCurrentChat("assistant", errorMessage);

        // Notify backend about the failure
        try {
          await orchestratedAgentChat({
            agentName: "orchestratedAgent",
            userId: user?.id ?? "",
            message: `${errorMessage}`,
            threadId: chatId,
            walletAddress: address ?? "",
            isTransaction: true,
          });
        } catch (notifyError) {
          console.error("Failed to notify backend about response error:", notifyError);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = "Oops! Something unexpected happened. This could be a network issue or temporary service interruption. Please try again in a moment.";
      addMessageToCurrentChat("assistant", errorMessage);

      // Notify backend about the failure
      try {
        await orchestratedAgentChat({
          agentName: "orchestratedAgent",
          userId: user?.id ?? "",
          message: `${errorMessage}`,
          threadId: chatId,
          walletAddress: address ?? "",
          isTransaction: true,
        });
      } catch (notifyError) {
        console.error("Failed to notify backend about catch error:", notifyError);
      }
    } finally {
      setIsLoading(false);
      // Set flag to skip the next history fetch to preserve local state (e.g., read-only tool responses)
      skipNextHistoryFetch.current = true;
      setIsMessageSending(false);
      setExecutingLifi(false);
      setExecutingAave(false);
      setExecutingChangeNow(false);
      setExecutingMantle(false);
      setExecutingLendle(false);
      setExecutingFusionX(false);
    }
  };
  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  if (!chatId) {
    return null;
  }

  const hasMessages = currentChat?.messages && currentChat.messages.length > 0;

  // console.log("hasMess", hasMessages);

  return (
    <>
      <div
        className={`flex flex-col h-[calc(100vh-76px)] bg-background relative transition-all duration-500 ${
          // Push effect only on desktop
          isWalletOpen && !isMobile
            ? "translate-x-[-160px] scale-95"
            : "translate-x-0 scale-100"
        }`}
      >
        {/* Mobile Header Buttons */}
        {/* {isMobile && (
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
        )} */}

        {/* Desktop Wallet Button */}
        {/* Desktop Header Section */}
        {/* {!isMobile && (
          <div
            className={cn(
              "w-full flex items-center justify-between px-6 py-4 border-b border-border bg-background z-30 transition-all duration-500",
              isWalletOpen
                ? "opacity-0 scale-95 pointer-events-none"
                : "opacity-100 scale-100"
            )}
          >
            <div className="flex items-center gap-4">
              <button
                className="p-2 hover:bg-muted rounded-lg"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <PanelLeft className="w-5 h-5 text-white" />
              </button>

              <button
                className="flex items-center gap-2 text-white font-medium hover:text-primary"
                onClick={handleNewConversation}
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <button
              onClick={() => setIsWalletOpen(true)}
              className="flex text-white items-center gap-2 font-medium hover:text-primary"
            >
              <Wallet className="w-5 h-5" />
              Wallet
            </button>
          </div>
        )} */}

        {hasMessages && user?.id && address && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-20 custom-scroll">
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
        {user?.id && address && !hasMessages && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <h1 className="text-white text-3xl font-bold">
              Welcome to Agentify
            </h1>
            <p className="text-muted-foreground">
              Start a conversation with your AI assistant
            </p>
          </div>
        )}

        {(!user?.id || !address) && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            {/* Wallet Icon */}
            <div className="p-4 rounded-full bg-muted">
              <Wallet className="w-10 h-10 text-muted-foreground" />
            </div>

            {/* Title + Subtitle */}
            <div>
              <h1 className="text-white text-2xl font-bold">
                Welcome to Agentify
              </h1>
              <p className="text-muted-foreground mt-2 max-w-md">
                Start smart transactions by connecting your wallet.
              </p>
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleConnectWallet}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!hasMessages ||
          !user?.id ||
          (!address && (
            <div className=" flex flex-col items-center justify-center text-center space-y-4">
              <h1 className="text-white text-3xl font-bold">
                Welcome to Agentify
              </h1>
              <p className="text-muted-foreground">
                Start a conversation with your AI assistant
              </p>
            </div>
          ))}

        {/* Fixed Bottom Input (always visible) */}
        {user?.id && address && (
          <div className="fixed bottom-0 left-0 right-0 z-10 p-2 bg-background">
            <div className="w-full flex justify-center">
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
        )}
      </div>

      {/* Right Sidebar (Wallet) */}
      <div
        ref={walletSidebarRef}
        className={`fixed top-0 right-0 h-full w-80 bg-card shadow-lg transform transition-transform duration-500 z-40 ${
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
          className={`fixed top-0 left-0 h-[calc(100vh-76px)] mt-[76px] w-80 bg-card shadow-lg transform transition-transform duration-500 z-40 ${
            isChatOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* You'll need to pass the chat sidebar content here */}
          <ChatSidebar
            mobileView
            onSelectChat={() => setIsChatOpen(false)}
            refreshKey={threadsRefreshKey}
          />
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
          <div className="bg-primary/20 mx-3 mt-3 rounded px-4 py-3 text-sm font-medium text-white">
            {" "}
            {/* Changed to text-white */}
            Agentify AI
          </div>
        )}

        <div className="p-3">
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
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 my-2">
                  {children}
                </ol>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 my-2">
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li className="ml-2">{children}</li>
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
