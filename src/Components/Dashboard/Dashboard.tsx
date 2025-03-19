"use client";
import { useEffect, useRef, useState } from "react";
import InlineSVG from "react-inlinesvg";
import { BiUpArrowAlt } from "react-icons/bi";
import { MdKeyboardArrowRight } from "react-icons/md";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { FaSearch } from "react-icons/fa";
import AgentsModal from "../AgentsModal/AgentsModal";
import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";
import { BridgeData, useBridgeToken } from "@/hooks/useBridge";
import { useChat } from "@/hooks/useChatHook";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useApiSwapToken } from "@/hooks/useApiSwap";
import { useSegaApi } from "@/hooks/useSega";
import { usePools } from "@/hooks/usePools";

const MarkdownToJSX = dynamic(() => import("markdown-to-jsx"), { ssr: false });

const agents = [
  {
    name: "Delta Trade DCA Helper",
    description: "Automate your Dollar-Cost Averaging (DCA) strategy with precision. This agent helps you execute scheduled trades at optimal intervals, reducing market volatility impact.",
    logo: "images/sonic-logo.png",
  },
  {
    name: "PotLock-Assistant",
    description: "A secure and efficient assistant for managing locked liquidity pools. It ensures smooth handling of fund releases, withdrawals, and re-locking based on predefined conditions.",
    logo: "images/sonic-logo.png",
  },
  {
    name: "Bitte Distribute Tokens",
    description: "Effortlessly distribute tokens to multiple recipients in a single transaction. This agent streamlines batch token transfers, saving time and gas fees.",
    logo: "images/sonic-logo.png",
  },
  {
    name: "Bitte WETH Wraptor",
    description: "Easily wrap and unwrap ETH into WETH for seamless DeFi interactions. This agent simplifies token conversions, ensuring efficient trading and liquidity provision.",
    logo: "images/sonic-logo.png",
  },
];

interface Message {
  role: "ai" | "human",
  message: string;
  txHash?: string;
  fromChain?: "solanamainnet" | "sonicsvm";
}

const dummymessages: Message[] = [
  { role: "ai", message: "Hello, how can I assist you?" },
  { role: "human", message: "What is your name?" },
  { role: "ai", message: "I'm an AI assistant, you can call me ChatGPT!" },
  { role: "human", message: "Can you tell me a joke?" },
  { role: "ai", message: "Sure! Why don’t skeletons fight each other? Because they don’t have the guts!" },
  { role: "human", message: "What's the weather like today?" },
  { role: "ai", message: "I'm not connected to live data, but you can check a weather website for the latest update!" },
  { role: "human", message: "Can you suggest a good book to read?" },
  { role: "ai", message: "Of course! If you like fiction, 'The Alchemist' by Paulo Coelho is a great choice!" },
  { role: "human", message: "What is the capital of Japan?" },
  { role: "ai", message: "The capital of Japan is Tokyo!" }
];

export default function Dashboard({
  onToggle,
  onMobileNavToggle,
}: {
  onToggle: () => void;
  onMobileNavToggle: () => void;
}) {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { connectWallet, user, ready } = usePrivy();
  const { bridgeToken } = useBridgeToken();
  const { fetchPools } = usePools();
  const { fetchSwapRawData } = useSegaApi();
  const { swapToken } = useApiSwapToken();
  const { chat, fetchChatHistory, clearHistory, fetchAgents } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState([]);
  const [isBridging, setIsBridging] = useState(false);
  const [isSwaping, setIsSwaping] = useState(false);

  const { wallets } = useSolanaWallets();

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // console.log("Wallets:", wallets[0])
  // console.log("User:", user)

  const checkConnection = async () => {
    setIsConnected(await wallets[0].isConnected())
  }

  const checkLinked = async () => {
    if (wallets.length === 0) {
      return;
    }
    const linked = await wallets[0].linked;
    console.log("Linked: ", linked);
    if (!linked) {
      const res = await wallets[0].loginOrLink();
      console.log("RES:", res)
    }
  }

  useEffect(() => {
    if (wallets.length > 0) {
      checkConnection();
    }
  }, [wallets.length])

  useEffect(() => {
    if (wallets.length > 0) {
      checkLinked()
    }
  }, [wallets.length])

  const handleDisconnect = async () => {
    if (wallets.length === 0) {
      return;
    }
    setIsConnected(false);
    await wallets[0].disconnect();
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryAgent = params.get("agent");
      if (queryAgent) {
        setActiveAgent(queryAgent);
      } else {
        setActiveAgent("bridgeAgent")
      }
    }
  }, [agents]);

  useEffect(() => {
    if (wallets.length > 0) {
      fetchHistory();
    }
  }, [wallets.length, activeAgent])

  useEffect(() => {
    fetchSonicAgents();
  }, [])

  // useEffect(() => {
  //   if (agents.length > 0) {
  //     setActiveAgent(agents[0]);
  //   }
  // }, [agents])

  const fetchHistory = async () => {
    const history = await fetchChatHistory(activeAgent || "bridgeAgent");
    const filteredMessages = history?.threads?.filter(
      (msg: Message) => msg.message.trim() !== ""
    );

    setMessages(filteredMessages);
  }

  const fetchSonicAgents = async () => {
    const res = await fetchAgents();
    setAgents(res.agents);
  }

  const clearChatHistory = async () => {
    await clearHistory(activeAgent || "bridgeAgent");
    setMessages([])
  }

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
    if (!message.trim()) return;
    if (isLoading) {
      return;
    }

    if (!wallets[0].address) {
      return;
    }

    const userMessage: Message = { role: "human", message: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage(""); // Clear the input field

    setIsLoading(true);

    try {
      const response = await chat({ inputMessage: message, agentName: activeAgent || "bridgeAgent" });
      console.log("RES:", response);
      if (response?.success) {
        if (response?.data?.tool_response !== "None") {
          const toolMessage = JSON.parse(response?.data?.tool_response?.replace(/^"|"$/g, ""));
          console.log("TOOL MSG: ", toolMessage)

          if (toolMessage?.success) {
            if (toolMessage?.type === "bridge") {

              if (toolMessage?.fromChain !== "solanamainnet") {
                if (wallets[0]?.walletClientType === "phantom") {
                  setMessages((prev) => [...prev, { role: "ai", message: "Please connect your sonic svm wallet using one of the following: Backpack, OKX Web3 Wallet, Nightly Wallet, or Bybit Wallet." }]);
                  return;
                }
              }

              const bridgeData: BridgeData = {
                fromChain: toolMessage?.fromChain,
                amount: toolMessage?.amount,
                tokenSymbol: toolMessage?.tokenSymbol
              };

              if (toolMessage?.recipientAddress) {
                bridgeData.recipientAddress = toolMessage.recipientAddress;
              }

              setMessages((prev) => [...prev, { role: "ai", message: `Bridge from ${toolMessage?.fromChain === "solanamainnet" ? "Solana" : "Sonic SVM"} to ${toolMessage?.fromChain === "solanamainnet" ? "Sonic SVM" : "Solana"} is in progress...` }]);
              setIsBridging(true);

              const res = await bridgeToken(bridgeData);
              console.log("RES: ", res);

              if (res?.success) {
                setMessages((prev) => [...prev, { role: "ai", message: "Your recent bridge was successful!", txHash: res?.txHash, fromChain: toolMessage?.fromChain }]);
                setIsBridging(false);
                console.log("SUCCESS:", res.message);
                return;
              } else {
                setMessages((prev) => [...prev, { role: "ai", message: "Your recent bridge failed!" }]);
                setIsBridging(false);
                console.log("ERROR:", res?.message);
                return;
              }

            } else if (toolMessage?.type === "swap") {
              const { inputMint, outputMint, amount, poolId } = toolMessage;

              if (!inputMint || !outputMint || !amount || !poolId) {
                setMessages((prev) => [...prev, { role: "ai", message: `Input fields are missing...` }]);
                return;
              }

              setIsSwaping(true);

              setMessages((prev) => [...prev, { role: "ai", message: `Fetching pools...` }]);
              const poolRes = await fetchPools([poolId]);
              console.log("pool info:", poolRes)

              const decimal = poolRes?.data[0]?.mintA?.decimals;

              updateLastAiMessage(`Fetching swap raw data...`);
              const rawTransaction = await fetchSwapRawData({ inputMint: inputMint, outputMint: outputMint, amount: amount?.toString(), inputDecimal: decimal });
              console.log("Raw:", rawTransaction)

              if (!rawTransaction) {
                setMessages((prev) => [...prev, { role: "ai", message: `Please give valid inputs...` }]);
                return;
              }

              updateLastAiMessage(`Swap is in progress...`);
              const swapRes = await swapToken(rawTransaction?.data[0]?.transaction);
              console.log("RES: ", swapRes);

              if (swapRes?.success) {
                setMessages((prev) => [...prev, { role: "ai", message: "Your recent swap was successful!", txHash: swapRes?.txHash }]);
                console.log("SUCCESS:", swapRes.message);
                setIsSwaping(false);
                return;
              } else {
                setMessages((prev) => [...prev, { role: "ai", message: "Your recent swap failed!" }]);
                console.log("ERROR:", swapRes?.message);
                setIsSwaping(false);
                return;
              }
            } else if (toolMessage?.type === "coinMarketCap") {
              const aiMessage: Message = { role: "ai", message: toolMessage?.response };
              setMessages((prev) => [...prev, aiMessage]);
              return;
            }
          }
        }

        const aiMessage: Message = { role: "ai", message: response.data?.ai_message };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", message: "Something went wrong!" }]);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
      setIsBridging(false);
    }
  }


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
            {agents.length > 0 && agents?.map((agent) => (
              <div
                key={agent}
                onClick={() => setActiveAgent(agent)}
                className={`p-4 rounded cursor-pointer rounded-md border transition-all mt-2 duration-200 bg-[#0c1a27] 
          ${activeAgent === agent
                    ? "border-[#fde68a]"
                    : "border-transparent hover:border-[#fde68a]"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <img
                      src="images/sonic-logo.png"
                      alt={agent}
                      className="h-6 rounded-full"
                    />
                    <h3 className="font-semibold text-md truncate-1-lines w-[90%]">
                      {agent === "bridgeAgent" ?
                        "Bridge Assistant" :
                        agent === "swapAgent" ?
                          "Swap Assistant" :
                          agent === "coinMarketCapAgent" ?
                            "CoinMarketCap Assistant" :
                            "Liquidity Assistant"}
                    </h3>
                  </div>
                  <IoMdInformationCircleOutline className="w-5 h-5 text-gray-400 cursor-pointer" />
                </div>
                <p className="text-sm text-gray-400 mt-1 w-[90%] truncate-3-lines">
                  {agent === "bridgeAgent" ?
                    "Assistant for helping users to bridge tokens between Solana & Sonic SVM chains." :
                    agent === "swapAgent" ?
                      "Assistant for helping users to swap tokens between Solana & Sonic SVM chains." :
                      agent === "coinMarketCapAgent" ?
                        "Assistant for helping users to know the current market price of the tokens & all over the crypto activities in the world." :
                        "Assistant for helping users to add liquidity to pool in Solana & Sonic SVM chains."}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center w-full md:w-[70%] lg:w-[71%] xl:w-[72%]">
          {/* Execute Transactions with AI Box */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 border border-gray-700 rounded-lg md:mt-4 md:mx-4 p-[0.1rem] md:p-[0.4rem] lg:p-[0.7rem] xl:p-[1rem]">
            {messages.length > 0 && <div className="top w-full flex justify-between items-center px-5 md:px-0 border-b border-gray-700 pb-3">
              <h2
                className="font-semibold text-md"
                style={{ fontFamily: "orbitron" }}
              >
                SONIC SVM AGENTS
              </h2>
              <div className="div flex justify-end items-center gap-2">
                <h2
                  className="text-sm font-thin"
                  style={{ fontFamily: "orbitron" }}
                >
                  Clear History
                </h2>
                <div className="clear-chat w-[1.5rem] h-[1.5rem] flex items-center justify-center cursor-pointer" onClick={clearChatHistory}>
                  <InlineSVG
                    src="/icons/clear.svg"
                    className="fill-current bg-transparent text-gray-700 bg-white rounded-md w-[1.5rem] h-[1.5rem]"
                  />
                </div>
              </div>
            </div>}
            {messages.length === 0 && <div className="text-center">
              <div className="flex justify-center items-center">
                <img
                  src="images/sonic-logo.png"
                  className="md:h-[100px] h-[50px]"
                />
              </div>
              <h2
                className="xxl:text-xl xl:text-lg font-semibold text-sm"
                style={{ fontFamily: "orbitron" }}
              >
                Execute Transactions with AI
              </h2>
              {!isConnected && <button
                className="mt-4 bg-white text-black md:px-7 md:py-2 px-4 py-1 rounded font-semibold cursor-pointer"
                style={{ fontFamily: "manrope" }}
                onClick={connectWallet}
              >
                Connect
              </button>}
            </div>}
            {messages.length !== 0 && (
              <div className="w-full max-h-[70vh] md:max-h-[27rem] lg:max-h-[29rem] xl:max-h-[30rem] h-full px-4 scroll-d overflow-y-auto">
                {messages.map((msg, index) => (
                  <>
                    <div
                      key={index}
                      className={`message w-full h-auto flex gap-1 md:gap-2 lg:gap-3 my-2 ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
                    >
                      {/* <p className={`px-3 py-2.5 max-w-md rounded-md w-auto ${msg.role === "ai" ? "bg-gray-800" : "bg-[#0000ff]"}`}>
                      {msg.message}
                    </p> */}

                      <div className={`px-3 py-2.5 max-w-md rounded-md w-auto ${msg.role === "ai" ? "bg-gray-800" : "bg-[#0000ff]"} `}>
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
                                  className: "border border-gray-300 p-2 bg-gray-200 text-black min-w-[4rem]",
                                },
                              },
                              td: {
                                props: {
                                  className: "border border-gray-300 p-2",
                                },
                              }
                            },
                          }}
                        >
                          {msg.message}
                        </MarkdownToJSX>
                      </div>
                      {msg?.txHash && msg.role === "ai" && <>
                        <a href={`${msg?.fromChain === "solanamainnet" ? `https://explorer.solana.com/tx/${msg?.txHash}` : `https://explorer.sonic.game/tx/${msg?.txHash}`}`} target="_blank" rel="noopener noreferrer" className="approve-btn flex items-center justify-center gap-1 px-2  mt-1 min-w-[5rem] bg-grey-700 max-w-[9rem] rounded-3xl border-1 border-zinc-600 hover:border-zinc-400 cursor-pointer">
                          <h2 className="text-center dark:text-black text-sm">Check Explorer</h2>
                          <InlineSVG
                            src="/icons/goto.svg"
                            className="fill-current bg-transparent text-white w-2.5 h-2.8"
                          />
                        </a>
                      </>}
                    </div>
                    {isLoading && index === messages.length - 1 && <div className={`whole-div w-full flex items-center gap-1 justify-start`}>
                      <div className={`relative message px-3 py-2.5 flex items-center gap-1 rounded-lg max-w-xs bg-gray-800`}>
                        <p className={`text-sm text-white`}>Typing...</p>
                      </div>
                    </div>}
                    <div ref={messagesEndRef} />
                  </>
                ))}
              </div>
            )}
          </div>

          {/*Desktop */}
          <div className="flex md:flex hidden p-4 py-3 border border-gray-700 rounded-lg md:m-4 mt-3">
            {/* Input Container */}

            <div className="flex-1 bg-gray-900 rounded flex md:flex-row flex-col md:items-center items-start border border-gray-700 px-2">
              <span
                className="px-3 py-1 bg-[#fbb042] hidden md:block rounded text-black md:text-sm text-[8px] font-bold"
                style={{ fontFamily: "orbitron" }}
              >
                {activeAgent === "bridgeAgent" ? "Bridge Assistant" : activeAgent === "swapAgent" ? "Swap Assistant" : "SONIC ASSISTANT"}
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
                className="px-3 py-1 bg-[#fbb042] rounded text-black text-xs md:text-sm font-bold"
                style={{ fontFamily: "orbitron" }}
              >
                {activeAgent === "bridgeAgent" ? "Bridge Assistant" : activeAgent === "swapAgent" ? "Swap Assistant" : "SONIC ASSISTANT"}
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
