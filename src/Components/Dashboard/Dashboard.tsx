"use client";
import { useEffect, useRef, useState } from "react";
import InlineSVG from "react-inlinesvg";
import { BiUpArrowAlt } from "react-icons/bi";
import { MdKeyboardArrowRight } from "react-icons/md";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { FaSearch } from "react-icons/fa";
import AgentsModal from "../AgentsModal/AgentsModal";
import { useChat } from "@/hooks/useChatHook";
import dynamic from "next/dynamic";
import "./Dashboard.css";
import { useAccount, useDisconnect } from "wagmi";
import useLifiHook from "@/hooks/useLifiHook";
import useAaveHook from "@/hooks/useAaveHook";
import { MarketType } from "@/types/types";
import { LiFiWidget, WidgetConfig } from "@lifi/widget";
import { usePrivy, LoginModal, User, useWallets } from "@privy-io/react-auth";
import { UserPill } from "@privy-io/react-auth/ui";
import { switchNetwork } from "@/utils/switchNetwork";
import { useTransactions } from "@/hooks/useTransactionsHook";
import { v4 as uuidv4 } from 'uuid';
const MarkdownToJSX = dynamic(() => import("markdown-to-jsx"), { ssr: false });

interface Message {
  role: "ai" | "human";
  message: string;
  txHash?: string;
}

export interface Agent {
  agentId: string;
  name: string;
  description: string;
  tags: string[];
}

interface RequestFields {
  transaction_id: string;
  user_id: string;
  wallet_address: string;
  agent_id: string;
  transaction_type: string;
  status: string;
  transaction_volume: string;
  explorer_link: string;

}

export default function Dashboard({
  onToggle,
  onMobileNavToggle,
}: {
  onToggle: () => void;
  onMobileNavToggle: () => void;
}) {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [activeAgent, setActiveAgent] = useState<string>("swapAgent");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { executeLifi, validateTokenBalance } = useLifiHook();
  const {
    supplyToAave,
    withdrawFromAave,
    borrowToAave,
    repayToAave,
    status,
    error,
  } = useAaveHook();
  const { chat, fetchChatHistory, clearHistory, fetchAgents } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isBridging, setIsBridging] = useState(false);
  const [isExecutingLifi, setExecutingLifi] = useState(false);
  const [isExecutingAave, setExecutingAave] = useState(false);
  const [isSwaping, setIsSwaping] = useState(false);
  const { loading, createTransactions } = useTransactions();

  const { wallets } = useWallets();
  const wallet = wallets[0];
  console.log("Chain ID: >>> ", wallet?.chainId)
  // const { isConnected } = useAppKitAccount();
  const { address, isConnected } = useAccount();
  console.log("Address -----", address);

  const { login, connectWallet, user } = usePrivy();

  const [showWidget, setShowWidget] = useState(false);

  const handleClick = () => {
    setShowWidget(true);
  };
  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!address || !user) {
      setMessages([]);
    }
  }, [address, user])

  // const switchNetwork = async (chainId: number) => {
  //   await wallet.switchChain(chainId);
  // }

  console.log("isConnected --", isConnected);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryAgent = params.get("agent");
      if (queryAgent) {
        setActiveAgent(queryAgent);
      } else {
        setActiveAgent("swapAgent");
      }
    }
  }, [agents]);

  useEffect(() => {
    if (address && user) {
      fetchHistory();
    }
  }, [address, activeAgent, user]);

  useEffect(() => {
    fetchAllAgents();
  }, [address]);

  // useEffect(() => {
  //   if (agents.length > 0) {
  //     setActiveAgent(agents[0]);
  //   }
  // }, [agents])

  const fetchHistory = async () => {
    if (!address || !activeAgent) return;
    const history = await fetchChatHistory(
      address,
      activeAgent
    );
    const filteredMessages = history?.threads?.filter(
      (msg: Message) => msg.message.trim() !== ""
    );

    setMessages(filteredMessages);
    console.log(filteredMessages);
  };

  const fetchAllAgents = async () => {
    const res = await fetchAgents({});
    console.log("Res:", res)
    setAgents(res.data);
  };


  const createTrans = async (transaction_id: string, user_id: string, wallet_address: string, agent_id: string, transaction_type: string, status: string, transaction_volume: string, explorer_link: string) => {
    const payload: RequestFields = {
      transaction_id,
      user_id,
      wallet_address,
      agent_id,
      transaction_type,
      status,
      transaction_volume,
      explorer_link
    };
    // const data = await createTransactions(payload);
  }

  const clearChatHistory = async () => {
    if (!address || !activeAgent) return;
    await clearHistory(address, activeAgent);
    setMessages([]);
  };

  const updateLastAiMessage = (newMessage: string) => {
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
  };

  // Chat functions & actions
  const handleChat = async () => {
    if (!message.trim()) {
      console.log("Message is empty, returning...");
      return;
    }
    if (isLoading) {
      console.log("Already loading, returning...");
      return;
    }

    if (!address) {
      console.log("No address found, returning...");
      return;
    }

    // switchNetwork(137)

    const userMessage: Message = { role: "human", message: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage(""); // Clear the input field

    setIsLoading(true);

    try {
      const response = await chat({
        inputMessage: message,
        agentName: activeAgent,
        userId: address,
        isTransaction: false
      });
      console.log("RES:", response);
      if (response?.success) {
        {
          /**  */
        }
        if (response?.data?.tool_response !== "None") {
          const toolMessage = JSON.parse(response?.data?.tool_response);

          if (toolMessage?.type === "lend") {
            const { market, tokenSymbol, amount, explorer } = toolMessage;
            if (!market || !tokenSymbol || !amount) {
              console.log("Err missing fields");
            }
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Executing lend for ${amount} ${tokenSymbol}, don't close the page until get confirmations...`,
              },
            ]);
            setExecutingAave(true);

            console.log(
              "Market Type",
              MarketType[market as keyof typeof MarketType]
            );
            const res = await supplyToAave({
              market: MarketType[market as keyof typeof MarketType],
              tokenSymbol: tokenSymbol,
              amount: amount.toString(),
            });
            console.log("Lend RES:", res);

            if (res?.success && res?.txHashes && res?.txHashes?.length > 0) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Lending ${amount} ${tokenSymbol} executed successfully!`,
                  txHash: `${explorer}tx/${res?.txHashes[0]}`,
                },
              ]);
              await createTrans(res.txHashes[0], address, address, "lendingBorrowingAgent", "lending", "Successful", amount, `${explorer}tx/${res?.txHashes[0]}`);
              setExecutingAave(false);
              return;
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Lending ${tokenSymbol} execution was failed!`,
                },
              ]);
              await createTrans(`failed_${uuidv4()}`, address, address, "swapAgent", "lending", "Failed", amount, `${explorer}tx/failed`);
              setExecutingAave(false);
              return;
            }
          } else if (toolMessage?.type === "borrow") {
            const { market, tokenSymbol, amount, explorer } = toolMessage;
            if (!market || !tokenSymbol || !amount) {
              console.log("Err missing fields");
            }
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Executing borrow for ${amount} ${tokenSymbol}, don't close the page until get confirmations...`,
              },
            ]);
            setExecutingAave(true);

            console.log(
              "Market Type",
              MarketType[market as keyof typeof MarketType]
            );
            const res = await borrowToAave({
              market: MarketType[market as keyof typeof MarketType],
              tokenSymbol: tokenSymbol,
              amount: amount.toString(),
            });
            console.log("Borrow RES:", res);

            if (res?.success && res?.txHashes && res?.txHashes?.length > 0) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Borrow ${amount} ${tokenSymbol} executed successfully!`,
                  txHash: `${explorer}tx/${res?.txHashes[0]}`,
                },
              ]);
              await createTrans(res.txHashes[0], address, address, "lendingBorrowingAgent", "borrow", "Successful", amount, `${explorer}tx/${res?.txHashes[0]}`);
              setExecutingAave(false);
              return;
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Borrow ${tokenSymbol} execution was failed!`,
                },
              ]);
              await createTrans(`failed_${uuidv4()}`, address, address, "swapAgent", "lending", "Failed", amount, `${explorer}tx/failed`);
              setExecutingAave(false);
              return;
            }
          } else if (toolMessage?.type === "withdraw") {
            const { market, tokenSymbol, amount, explorer } = toolMessage;
            if (!market || !tokenSymbol || !amount) {
              console.log("Err missing fields");
            }
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                message: `Executing withdraw for ${amount} ${tokenSymbol}, don't close the page until get confirmations...`,
              },
            ]);
            setExecutingAave(true);

            console.log(
              "Market Type",
              MarketType[market as keyof typeof MarketType]
            );
            const res = await withdrawFromAave({
              market: MarketType[market as keyof typeof MarketType],
              tokenSymbol: tokenSymbol,
              amount: amount.toString(),
            });
            console.log("Withdraw RES:", res);

            if (res?.success && res?.txHashes && res?.txHashes?.length > 0) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Withdraw ${amount} ${tokenSymbol} executed successfully!`,
                  txHash: `${explorer}tx/${res?.txHashes[0]}`,
                },
              ]);
              await createTrans(res.txHashes[0], address, address, "lendingBorrowingAgent", "withdraw", "Successful", amount, `${explorer}tx/${res?.txHashes[0]}`);
              setExecutingAave(false);
              return;
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  message: `Withdraw ${tokenSymbol} execution was failed!`,
                },
              ]);
              await createTrans(`failed_${uuidv4()}`, address, address, "swapAgent", "lending", "Failed", amount, `${explorer}tx/failed`);
              setExecutingAave(false);
              return;
            }
          } else if (toolMessage?.type === "swap" || toolMessage?.type === "bridge") {
            const { quote, explorer } = toolMessage
            console.log("Quote:", quote);

            if (quote) {
              const { fromChainId, fromToken, toChainId, toToken, fromAmount } = quote;
              if (wallet && fromChainId && parseInt(wallet.chainId.split(":")[1]) !== fromChainId) {
                await switchNetwork(fromChainId);
              }
              const isEnoughBalance = await validateTokenBalance(
                fromChainId,
                fromToken,
                fromAmount
              );

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
              const response: any = await executeLifi({ quote });
              console.log("Res:", response);
              if (response?.txHash) {
                const agentId = fromChainId.toString() === toChainId.toString()
                  ? "swapAgent"
                  : "bridgeAgent";
                await createTrans(response.txHash, address, address, agentId, agentId, "Successful", fromAmount, `${explorer}tx/${response?.txHash}`);
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "ai",
                    message: `${fromChainId.toString() === toChainId.toString()
                      ? "Swap"
                      : "Bridge"
                      } executed successfully!`,
                    txHash: `${explorer}tx/${response?.txHash}`,
                  },
                ]);
                setExecutingLifi(false);
                return;
              } else {
                const agentId = fromChainId.toString() === toChainId.toString()
                  ? "swapAgent"
                  : "bridgeAgent";
                await createTrans(`failed_${uuidv4()}`, address, address, agentId, agentId, "Failed", fromAmount, `${explorer}tx/failed`);
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "ai",
                    message: `${fromChainId.toString() === toChainId.toString()
                      ? "Swap"
                      : "Bridge"
                      } execution was failed!`,
                  },
                ]);
                setExecutingLifi(false);
                return;
              }
            }
          }

          if (toolMessage?.error) {
            if (toolMessage.error?.includes("No routes found")) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", message: `Hey! It looks like there are no available routes right now. This can happen if there's low liquidity, the amount you selected is too small, gas fees are too high, or the token pair doesn't have a valid route. Try adjusting the amount or selecting a different combination and see if that helps! 😊` },
              ]);
              return;
            }
            setMessages((prev) => [
              ...prev,
              { role: "ai", message: `${toolMessage?.error}` },
            ]);
            return;
          }

          // const toolMessage = JSON.parse(response?.data?.tool_response?.replace(/^"|"$/g, ""));
          // console.log("TOOL MSG: ", toolMessage)
          // if (toolMessage?.success) {
          //   if (toolMessage?.type === "bridge") {
          //     setMessages((prev) => [...prev, { role: "ai", message: `Bridge from ${toolMessage?.fromChain === "solanamainnet" ? "Solana" : "Sonic SVM"} to ${toolMessage?.fromChain === "solanamainnet" ? "Sonic SVM" : "Solana"} is in progress...` }]);
          //     setIsBridging(true);
          //     const res = "" as any;
          //     console.log("RES: ", res);
          //     if (res?.success) {
          //       setMessages((prev) => [...prev, { role: "ai", message: "Your recent bridge was successful!", txHash: res?.txHash, fromChain: toolMessage?.fromChain }]);
          //       setIsBridging(false);
          //       console.log("SUCCESS:", res.message);
          //       return;
          //     } else {
          //       setMessages((prev) => [...prev, { role: "ai", message: "Your recent bridge failed!" }]);
          //       setIsBridging(false);
          //       console.log("ERROR:", res?.message);
          //       return;
          //     }
          //   } else if (toolMessage?.type === "swap") {
          //     const { inputMint, outputMint, amount, poolId } = toolMessage;
          //     if (!inputMint || !outputMint || !amount || !poolId) {
          //       setMessages((prev) => [...prev, { role: "ai", message: `Input fields are missing...` }]);
          //       return;
          //     }
          //     setIsSwaping(true);
          //     // setMessages((prev) => [...prev, { role: "ai", message: `Fetching pools...` }]);
          //     // updateLastAiMessage(`Fetching swap raw data...`);
          //     updateLastAiMessage(`Swap is in progress...`);
          //     const swapRes = "" as any;
          //     console.log("RES: ", swapRes);
          //     if (swapRes?.success) {
          //       setMessages((prev) => [...prev, { role: "ai", message: "Your recent swap was successful!", txHash: swapRes?.txHash }]);
          //       console.log("SUCCESS:", swapRes.message);
          //       setIsSwaping(false);
          //       return;
          //     } else {
          //       setMessages((prev) => [...prev, { role: "ai", message: "Your recent swap failed!" }]);
          //       console.log("ERROR:", swapRes?.message);
          //       setIsSwaping(false);
          //       return;
          //     }
          //   } else if (toolMessage?.type === "coinMarketCap") {
          //     const aiMessage: Message = { role: "ai", message: toolMessage?.response };
          //     setMessages((prev) => [...prev, aiMessage]);
          //     return;
          //   }
          // }
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
    } catch (error: any) {
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

  console.log("Agents:", agents)

  return (
    <div className="flex flex-col items-center h-screen bg-black text-white">

      <div
        className="bg-gray-900 p-4 flex items-center md:gap-5 gap-3 w-full"
        style={{ fontFamily: "orbitron" }}
      >
        <button
          onClick={() => {
            onToggle(); // Always toggle collapse state
            if (window.innerWidth < 768) {
              onMobileNavToggle(); // Only toggle mobile nav visibility on mobile screens
            }
          }}
          className="focus:outline-none"
        >
          <InlineSVG
            src="icons/Toggle.svg"
            className="w-5 h-5 cursor-pointer"
          />
        </button>
        <div className="xxl:text-lg xl:text-base text-gray-400 font-semibold">
          CHAT
        </div>
        <MdKeyboardArrowRight className="w-6 h-6" />
        <div className="text-white text-xs">VEJAS6QK0U1BTPQK</div>
      </div>

      <div className="flex md:flex-1 w-full h-[95%] md:h-0 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col md:w-[30%] lg:w-[29%] xl:w-[28%] bg-black p-4 m-4 rounded-lg border border-gray-700 overflow-hidden">
          {/* Header + Input */}
          <div className="flex-shrink-0">
            <h2
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: "orbitron" }}
            >
              Agents
            </h2>
            <p
              className="text-sm text-gray-400 mb-4"
              style={{ fontFamily: "manrope" }}
            >
              Choose agents to perform specific tasks.
            </p>
            <div className="relative w-full flex items-center">
              <FaSearch className="absolute left-3 text-gray-400 xxl:text-lg xl:text-base" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 pl-10 bg-gray-800 text-white rounded placeholder:font-manrope placeholder:text-base placeholder:text-gray-400 focus:outline-none"
                style={{ fontFamily: "manrope" }}
              />
            </div>
          </div>

          {/* Scrollable List (Fixed) */}
          <div className="flex-grow overflow-y-auto scroll-d border border-gray-700 p-3 mt-4 rounded max-h-[430px]">
            {agents && agents?.length > 0 &&
              agents?.map((agent) => (
                <div
                  key={agent.agentId}
                  onClick={() => setActiveAgent(agent?.agentId)}
                  className={`p-4 rounded cursor-pointer rounded-md border transition-all mt-2 duration-200 bg-[#0c1a27] 
          ${activeAgent === agent.agentId
                      ? "border-[#91D695]"
                      : "border-transparent hover:border-[#157626]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 gap-2">
                      <img
                        src="images/logo.png"
                        alt={agent.agentId}
                        className="h-8 w-8 object-cover rounded-full"
                      />
                      <h3 className="font-semibold text-md truncate-1-lines w-[90%]">
                        {agent.agentId === "bridgeAgent"
                          ? "Bridge Assistant"
                          : agent.agentId === "swapAgent"
                            ? "Swap Assistant"
                            : agent.agentId === "lendingBorrowingAgent"
                              ? "Lend & Borrow Assistant"
                              : "Liquidity Assistant"}
                      </h3>
                    </div>
                    <IoMdInformationCircleOutline className="w-5 h-5 text-gray-400 cursor-pointer" />
                  </div>
                  <p className="text-sm text-gray-400 mt-1 w-[90%] truncate-3-lines">
                    {agent.agentId === "bridgeAgent"
                      ? "Assistant for helping users to bridge tokens between the EVM chains."
                      : agent.agentId === "swapAgent"
                        ? "Assistant for helping users to swap tokens in the EVM chains."
                        : agent.agentId === "lendingBorrowingAgent"
                          ? "Assistant for helping users to lend & borrow the tokens in EVM chains."
                          : "Assistant for helping users to add liquidity to pool in EVM chains."}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center w-full md:w-[70%] lg:w-[71%] xl:w-[72%]">
          {/* Execute Transactions with AI Box bg-gray-950 */}
          <div className="relative z-0 flex-1 flex flex-col items-center justify-center  border border-gray-700 rounded-lg md:mt-4 md:mx-4 p-[0.1rem] md:p-[0.4rem] lg:p-[0.7rem] xl:p-[1rem]">
            {user && address && messages && messages.length > 0 && (
              <div className="top w-full flex justify-between items-center px-5 md:px-0 border-b border-gray-700 pb-3">
                <h2
                  className="font-semibold text-md"
                  style={{ fontFamily: "orbitron" }}
                >
                  AGENTIFY
                </h2>
                <div className="div flex justify-end items-center gap-2">
                  <h2
                    className="text-sm font-thin"
                    style={{ fontFamily: "orbitron" }}
                  >
                    Clear History
                  </h2>
                  <div
                    className="clear-chat w-[1.5rem] h-[1.5rem] flex items-center justify-center cursor-pointer"
                    onClick={clearChatHistory}
                  >
                    <InlineSVG
                      src="/icons/clear.svg"
                      className="fill-current bg-transparent text-gray-700 bg-white rounded-md w-[1.5rem] h-[1.5rem]"
                    />
                  </div>
                </div>
              </div>
            )}
            {messages && messages?.length === 0 && (
              <div className="text-center flex flex-col items-center">
                <div className="flex justify-center items-center">
                  <img
                    src="images/logo.png"
                    className="w-20 h-20 object-cover rounded-full"
                  />
                </div>
                <h2
                  className="xxl:text-xl xl:text-lg font-semibold text-sm"
                  style={{ fontFamily: "orbitron" }}
                >
                  Execute Transactions with AI
                </h2>
                {(!address || !user) && (
                  <div
                    className="button-holder relative w-[15.5rem] h-[3rem] mt-4 flex items-center justify-center cursor-pointer"
                    onClick={() => { !user ? login() : connectWallet() }}
                  >
                    <h2
                      className="text-white font-medium"
                      style={{ fontFamily: "manrope" }}
                    >
                      Connect Wallet
                    </h2>
                    <div className="absolute button-holder-abs top-0 left-0 right-0 bottom-0">
                      <img
                        src="/images/button-border.png"
                        alt="agy"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {messages && messages.length !== 0 && address && user && (
              <div className="w-full max-h-[70vh] md:max-h-[27rem] lg:max-h-[29rem] xl:max-h-[30rem] h-full px-4 scroll-d overflow-y-auto">
                {messages?.map((msg, index) => (
                  <>
                    <div
                      key={index}
                      className={`message w-full h-auto flex ${index === messages.length - 1 && "md:flex-row flex-col"
                        } gap-1 md:gap-2 lg:gap-3 my-2 ${msg.role === "ai" ? "justify-start" : "justify-end"
                        }`}
                    >
                      {/* <p className={`px-3 py-2.5 max-w-md rounded-md w-auto ${msg.role === "ai" ? "bg-gray-800" : "bg-[#0000ff]"}`}>
                      {msg.message}
                    </p> */}

                      <div
                        className={`relative px-3 py-2.5 max-w-sm md:max-w-md md:overflow-x-auto overflow-x-auto rounded-md w-auto ${msg.role === "ai" ? "bg-gray-800" : "user-msg agent-name"
                          } `}
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
                            },
                          }}
                        >
                          {msg.message}
                        </MarkdownToJSX>
                      </div>
                      {msg?.txHash && msg.role === "ai" && (
                        <>
                          <a
                            href={`${msg?.txHash.includes("https://") ? msg?.txHash : `https://etherscan.io/${msg?.txHash.includes("tx") ? "" : "tx/"}${msg?.txHash}`}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="approve-btn flex items-center justify-center gap-1 px-2 py-2 md:py-1 mt-1 min-w-[5rem] bg-grey-700 max-w-[9rem] rounded-3xl border-1 border-zinc-600 hover:border-zinc-400 cursor-pointer"
                          >
                            <h2 className="text-center dark:text-white text-sm">
                              Check Explorer
                            </h2>
                            <InlineSVG
                              src="/icons/goto.svg"
                              className="fill-current bg-transparent text-white w-2.5 h-2.8"
                            />
                          </a>
                        </>
                      )}
                    </div>
                    {isLoading && index === messages.length - 1 && (
                      <div
                        className={`whole-div w-full flex items-center gap-1 justify-start`}
                      >
                        <div
                          className={`relative message px-3 py-2.5 flex items-center gap-1 rounded-lg max-w-xs bg-gray-800`}
                        >
                          <p className={`text-sm text-white`}>Typing...</p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                ))}
              </div>
            )}

            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-lg z-[-1]">
              <img
                src="/images/green-overlay.png"
                alt="agy"
                className="w-full h-full rounded-lg"
              />{" "}
              {/** scale-x-[-1] */}
            </div>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-lg bg-gray-950 z-[-2]"></div>
          </div>

          {/*Desktop */}
          <div className="flex md:flex hidden p-4 py-3 border border-gray-700 rounded-lg md:m-4 mt-3">
            {/* Input Container */}

            <div className="flex-1 bg-gray-900 rounded flex md:flex-row flex-col md:items-center items-start border border-gray-700 px-2">
              <span
                className="agent-name px-3 py-1 hidden md:block rounded text-white md:text-sm text-[8px] font-bold"
                style={{ fontFamily: "orbitron" }}
              >
                {activeAgent === "bridgeAgent"
                  ? "BRIDGE ASSISTANT"
                  : activeAgent === "swapAgent"
                    ? "SWAP ASSISTANT"
                    : activeAgent === "lendingBorrowingAgent"
                      ? "Lend & Borrow"
                      : "AGENTIFY ASSISTANT"}
              </span>
              <input
                type="text"
                placeholder="Message Smart Actions"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 md:p-2 mt-2 md:mt-0 bg-transparent outline-none text-white md:ml-2 placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleChat();
                  }
                }}
                style={{ fontFamily: "manrope" }}
              />
            </div>

            {/* Arrow Button */}
            <div
              className={`md:w-12 w-10 flex cursor-pointer justify-center items-center px-2 py-2 rounded ml-3 transition-all ${message.trim() ? "bg-[#0000ff]" : "bg-gray-700"
                }`}
              onClick={handleChat}
            >
              <BiUpArrowAlt className="w-8 h-8 text-white" />
            </div>
          </div>

          {/*Mobile -------------------*/}
          <div className="flex flex-col gap-3 py-4 px-3 border border-gray-700 rounded-lg md:m-4 mt-3 md:hidden">
            <div className="flex flex-row items-center justify-between">
              {/* Active Agent Name */}
              <span
                className="agent-name px-3 py-1 rounded text-white text-xs md:text-sm font-bold"
                style={{ fontFamily: "orbitron" }}
              >
                {activeAgent === "bridgeAgent"
                  ? "BRIDGE ASSISTANT"
                  : activeAgent === "swapAgent"
                    ? "SWAP ASSISTANT"
                    : activeAgent === "lendingBorrowingAgent"
                      ? "LENDING & BORROW"
                      : "AGENTIFY ASSISTANT"}
              </span>

              {/* Agents Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded transition-all duration-200"
              >
                Agents
              </button>

              {/* Agents Modal */}
              <AgentsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                setActiveAgent={setActiveAgent}
                sonicAgents={agents}
              />
            </div>

            {/* Input Box & Send Button */}
            <div className="flex flex-row items-center bg-gray-900 rounded border border-gray-700 px-3 py-2">
              <input
                type="text"
                placeholder="Message Smart Actions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleChat();
                  }
                }}
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-400 p-2"
                style={{ fontFamily: "manrope" }}
              />

              {/* Send Button with Better Positioning */}
              <button
                className={`ml-3 p-2 rounded flex items-center justify-center transition-all ${message.trim()
                  ? "bg-[#0000ff] hover:bg-blue-700"
                  : "bg-gray-700"
                  }`}
                onClick={handleChat}
                disabled={!message.trim()}
              >
                <BiUpArrowAlt className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
