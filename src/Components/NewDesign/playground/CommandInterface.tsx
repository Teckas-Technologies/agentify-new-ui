
import { Send, Wallet, MessageCircle, Zap, Trash2 } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/Components/ui/card";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { useCallback, useEffect, useRef, useState } from "react";
import { agentExampleCommands } from "@/utils/agentCommands";
import { Agent, MarketType, Message, RequestFields } from "@/types/types";
import { useAccount } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useChat } from "@/hooks/useChatHook";
import dynamic from "next/dynamic";
import InlineSVG from "react-inlinesvg";
import useAaveHook from "@/hooks/useAaveHook";
import useLifiHook from "@/hooks/useLifiHook";
import { useTransactions } from "@/hooks/useTransactionsHook";
import { v4 as uuidv4 } from 'uuid';
import { switchNetwork } from "@/utils/switchNetwork";
import AgentSelector from "./AgentSelector";

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
    initialAgents
}: CommandInterfaceProps) => {
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isExecutingLifi, setExecutingLifi] = useState(false);
    const [isExecutingAave, setExecutingAave] = useState(false);
    const [modelOpen, setModelOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);
    const { address } = useAccount();
    const { user } = usePrivy();
    const { chat, fetchChatHistory, clearHistory, updateMessage } = useChat();
    const { executeLifi, validateTokenBalance } = useLifiHook();
    const { supplyToAave, withdrawFromAave, borrowToAave, repayToAave } = useAaveHook();
    const { createTransactions } = useTransactions();
    const { wallets } = useWallets();
    const wallet = wallets[0];

    useEffect(() => {
        if (messages && messages.length > 3) {
            // Scroll to bottom when messages update
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setModelOpen(false);
            }
        };

        if (modelOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [modelOpen]);


    useEffect(() => {
        if (!address || !user) {
            setMessages([]);
        }
    }, [address, user])

    useEffect(() => {
        if (address && user) {
            fetchHistory();
        }
    }, [address, selectedAgent, user]);


    const handleQuickCommand = useCallback((command: string) => {
        setInputValue(command);
    }, []);

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
        const data = await createTransactions(payload);
    }

    // const fetchHistory = useCallback(async () => {
    //     if (!address || !selectedAgent?.agentId) return;
    //     const history = await fetchChatHistory(
    //         address,
    //         selectedAgent?.agentId
    //     );
    //     const filteredMessages = history?.threads?.filter(
    //         (msg: Message) => msg.message.trim() !== "" && (msg.role === "ai" || msg.role === "human")
    //     );

    //     setMessages(filteredMessages);
    //     console.log(filteredMessages);
    // }, [address, selectedAgent, user]);

    const fetchHistory = useCallback(async () => {
        if (!address || !selectedAgent?.agentId) return;

        const history = await fetchChatHistory(address, selectedAgent?.agentId);

        const filteredMessages = history?.threads
            ?.filter((msg: Message) => {
                if (msg.message.trim() === "") return false;

                if (msg.role === "ai" || msg.role === "human") {
                    return true;
                }

                if (msg.role === "tool") {
                    try {
                        const toolMessage = JSON.parse(msg.message);
                        return toolMessage?.type === "tool" && !!toolMessage?.message;
                    } catch (err) {
                        console.error("Error parsing tool message:", err);
                        return false;
                    }
                }

                return false;
            })
            .map((msg: Message) => {
                if (msg.role === "tool") {
                    const toolMessage = JSON.parse(msg.message);
                    return {
                        role: "ai",
                        message: toolMessage.message,
                    };
                }

                return msg;
            });

        setMessages(filteredMessages);
        console.log(filteredMessages);
    }, [address, selectedAgent, user]);

    const clearChatHistory = async () => {
        if (!address || !selectedAgent?.agentId) return;
        await clearHistory(address, selectedAgent?.agentId);
        setMessages([]);
    }

    const updateLastAiMessage = useCallback((newMessage: Message) => {
        setMessages((prev) => {
            const updatedMessages = [...prev];
            const lastIndex = updatedMessages.length - 1;

            if (updatedMessages[lastIndex]?.role === "ai") {
                updatedMessages[lastIndex] = newMessage;
            } else {
                updatedMessages.push(newMessage);
            }

            return updatedMessages;
        });
    }, []);

    const handleChat = async () => {
        console.log("Ip:", inputValue)
        if (!inputValue.trim()) {
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

        if (!selectedAgent) {
            console.log("No agent selected, returning...");
            return;
        }

        const userMessage: Message = { role: "human", message: inputValue };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue(""); // Clear the input field

        setIsLoading(true);

        try {
            const response = await chat({
                inputMessage: inputValue,
                agentName: selectedAgent?.agentId,
                userId: address,
            });
            console.log("RES:", response);
            if (response?.success) {
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
                            // setMessages((prev) => [
                            //     ...prev,
                            //     {
                            //         role: "ai",
                            //         message: `Lending ${amount} ${tokenSymbol} executed successfully!`,
                            //         txHash: `${explorer}tx/${res?.txHashes[0]}`,
                            //     },
                            // ]);
                            await createTrans(res.txHashes[0], address, address, "lendingBorrowingAgent", "lending", "Successful", amount, `${explorer}tx/${res?.txHashes[0]}`);

                            const statusMessage = `Your lending of ${amount} ${tokenSymbol} was successful. 🎉 You can check the transaction on the [explorer](${explorer}tx/${res?.txHashes[0]}).`;
                            await updateMessage(
                                address,
                                selectedAgent.agentId,
                                JSON.stringify({
                                    type: "tool",
                                    status: "success",
                                    message: statusMessage,
                                })
                            );

                            const newMessage = {
                                role: "ai" as "ai" | "human" | "tool",
                                message: statusMessage
                            }
                            updateLastAiMessage(newMessage)
                            setExecutingAave(false);
                            return;
                        } else {
                            // setMessages((prev) => [
                            //     ...prev,
                            //     {
                            //         role: "ai",
                            //         message: `Lending ${tokenSymbol} execution was failed!`,
                            //     },
                            // ]);
                            await createTrans(`failed_${uuidv4()}`, address, address, "swapAgent", "lending", "Failed", amount, `${explorer}tx/failed`);

                            const statusMessage = `Oops! Your lending ${amount} ${tokenSymbol} execution was failed!`;
                            await updateMessage(
                                address,
                                selectedAgent.agentId,
                                JSON.stringify({
                                    type: "tool",
                                    status: "failed",
                                    message: statusMessage,
                                })
                            );

                            const newMessage = {
                                role: "ai" as "ai" | "human" | "tool",
                                message: statusMessage
                            }
                            updateLastAiMessage(newMessage)
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
                            // setMessages((prev) => [
                            //     ...prev,
                            //     {
                            //         role: "ai",
                            //         message: `Borrow ${amount} ${tokenSymbol} executed successfully! 🎉 You can check the transaction on the [explorer](${explorer}tx/${res?.txHashes[0]}).`,
                            //         txHash: `${explorer}tx/${res?.txHashes[0]}`,
                            //     },
                            // ]);
                            await createTrans(res.txHashes[0], address, address, "lendingBorrowingAgent", "borrow", "Successful", amount, `${explorer}tx/${res?.txHashes[0]}`);

                            const statusMessage = `Great! You've successfully borrowed ${amount} ${tokenSymbol}. 🎉 You can check the transaction on the [explorer](${explorer}tx/${res?.txHashes[0]}).`;
                            await updateMessage(
                                address,
                                selectedAgent.agentId,
                                JSON.stringify({
                                    type: "tool",
                                    status: "success",
                                    message: statusMessage,
                                })
                            );

                            const newMessage = {
                                role: "ai" as "ai" | "human" | "tool",
                                message: statusMessage
                            }
                            updateLastAiMessage(newMessage)
                            setExecutingAave(false);
                            return;
                        } else {
                            // setMessages((prev) => [
                            //     ...prev,
                            //     {
                            //         role: "ai",
                            //         message: `Borrow ${tokenSymbol} execution was failed!`,
                            //     },
                            // ]);
                            await createTrans(`failed_${uuidv4()}`, address, address, "swapAgent", "lending", "Failed", amount, `${explorer}tx/failed`);

                            const statusMessage = `Oops! The borrowing of ${amount} ${tokenSymbol} failed.`;
                            await updateMessage(
                                address,
                                selectedAgent.agentId,
                                JSON.stringify({
                                    type: "tool",
                                    status: "failed",
                                    message: statusMessage,
                                })
                            );

                            const newMessage = {
                                role: "ai" as "ai" | "human" | "tool",
                                message: statusMessage
                            }
                            updateLastAiMessage(newMessage)
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
                            // setMessages((prev) => [
                            //     ...prev,
                            //     {
                            //         role: "ai",
                            //         message: `Withdraw ${amount} ${tokenSymbol} executed successfully!`,
                            //         txHash: `${explorer}tx/${res?.txHashes[0]}`,
                            //     },
                            // ]);
                            
                            await createTrans(res.txHashes[0], address, address, "lendingBorrowingAgent", "withdraw", "Successful", amount, `${explorer}tx/${res?.txHashes[0]}`);

                            const statusMessage = `You’ve withdrawn ${amount} ${tokenSymbol} from your lending. 🎉 You can check the transaction on the [explorer](${explorer}tx/${res?.txHashes[0]}).`;
                            await updateMessage(
                                address,
                                selectedAgent.agentId,
                                JSON.stringify({
                                    type: "tool",
                                    status: "success",
                                    message: statusMessage,
                                })
                            );

                            const newMessage = {
                                role: "ai" as "ai" | "human" | "tool",
                                message: statusMessage
                            }
                            updateLastAiMessage(newMessage)
                            setExecutingAave(false);
                            return;
                        } else {
                            // setMessages((prev) => [
                            //     ...prev,
                            //     {
                            //         role: "ai",
                            //         message: `Withdraw ${tokenSymbol} execution was failed!`,
                            //     },
                            // ]);
                            await createTrans(`failed_${uuidv4()}`, address, address, "swapAgent", "lending", "Failed", amount, `${explorer}tx/failed`);

                            const statusMessage = `Oops! The withdrawal of ${amount} ${tokenSymbol} failed.`;
                            await updateMessage(
                                address,
                                selectedAgent.agentId,
                                JSON.stringify({
                                    type: "tool",
                                    status: "failed",
                                    message: statusMessage,
                                })
                            );

                            const newMessage = {
                                role: "ai" as "ai" | "human" | "tool",
                                message: statusMessage
                            }
                            updateLastAiMessage(newMessage)
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
                                // setMessages((prev) => [
                                //     ...prev,
                                //     {
                                //         role: "ai",
                                //         message: `${fromChainId.toString() === toChainId.toString()
                                //             ? "Swap"
                                //             : "Bridge"
                                //             } executed successfully!`,
                                //         txHash: `${explorer}tx/${response?.txHash}`,
                                //     },
                                // ]);
                                const agentId = fromChainId.toString() === toChainId.toString()
                                    ? "swapAgent"
                                    : "bridgeAgent";
                                await createTrans(response.txHash, address, address, agentId, agentId, "Successful", fromAmount, `${explorer}tx/${response?.txHash}`);
                                
                                const statusMessage = `Your ${fromChainId.toString() === toChainId.toString() ? "Swap" : "Bridge"} was executed successfully!. 🎉 You can check the transaction on the [explorer](${explorer}tx/${response?.txHash}).`;
                                await updateMessage(
                                    address,
                                    selectedAgent.agentId,
                                    JSON.stringify({
                                        type: "tool",
                                        status: "success",
                                        message: statusMessage,
                                    })
                                );

                                const newMessage = {
                                    role: "ai" as "ai" | "human" | "tool",
                                    message: statusMessage
                                }
                                updateLastAiMessage(newMessage)
                                setExecutingLifi(false);
                                return;
                            } else {
                                // setMessages((prev) => [
                                //     ...prev,
                                //     {
                                //         role: "ai",
                                //         message: `${fromChainId.toString() === toChainId.toString()
                                //             ? "Swap"
                                //             : "Bridge"
                                //             } execution was failed!`,
                                //     },
                                // ]);
                                const agentId = fromChainId.toString() === toChainId.toString()
                                    ? "swapAgent"
                                    : "bridgeAgent";
                                await createTrans(`failed_${uuidv4()}`, address, address, agentId, agentId, "Failed", fromAmount, `${explorer}tx/failed`);

                                const statusMessage = `Oops! ${fromChainId.toString() === toChainId.toString() ? "Swap" : "Bridge"} execution was failed!.`;
                                await updateMessage(
                                    address,
                                    selectedAgent.agentId,
                                    JSON.stringify({
                                        type: "tool",
                                        status: "failed",
                                        message: statusMessage,
                                    })
                                );
                                const newMessage = {
                                    role: "ai" as "ai" | "human" | "tool",
                                    message: statusMessage
                                }
                                updateLastAiMessage(newMessage)
                                setExecutingLifi(false);
                                return;
                            }
                        }
                    }

                    if (toolMessage?.error) {
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
    }

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
                                    <Badge variant="outline" className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                                        Wallet Connected
                                    </Badge>
                                    {messages?.length > 0 && <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20 cursor-pointer" onClick={clearChatHistory}>
                                        <Trash2 className="h-4 w-4 text-primary" />
                                    </div>}
                                </div>
                            </>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-y-hidden relative">
                    <ScrollArea className={`w-full ${modelOpen ? "overflow-y-hidden h-[37vh]" : "md:h-[calc(100vh-80px)] h-[calc(100vh-280px)]"}`}>
                        <div className="p-3 md:p-6">
                            {!isWalletConnected ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="p-4 rounded-full bg-primary/5 ring-1 ring-primary/20 mb-2">
                                        <MessageCircle className="h-8 w-8 text-primary/60" />
                                    </div>
                                    <h3 className="text-lg font-medium bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                                        Welcome to Agentify AI Assistant
                                    </h3>
                                    <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                                        Connect your wallet to start executing smart transactions with natural language commands across any blockchain.
                                    </p>
                                </div>
                            ) : messages?.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Zap className="h-4 w-4 text-primary" />
                                            <h3 className="text-sm font-medium">Quick Start</h3>
                                        </div>

                                        {messages?.map((msg, index) => (
                                            <>
                                                <div key={index} className={`message w-full h-auto flex ${index === messages.length - 1 && msg.role === "ai" && "md:flex-row flex-col"} gap-1 md:gap-2 lg:gap-3 my-2 ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                                                    <div className={`relative px-4 py-3 max-w-xs md:max-w-md md:overflow-x-auto overflow-x-auto rounded-md w-auto ${msg.role === "ai" ? "bg-white/5 hover:bg-primary/10 border border-white/10" : "user-msg agent-name bg-primary/50 border border-white/10"}`}>
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
                                                                            className: "text-blue-600 underline underline-offset-2",
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
                                                            {msg.message}
                                                        </MarkdownToJSX>
                                                    </div>

                                                    {/* {msg?.txHash && msg.role === "ai" && (
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
                                                    )} */}

                                                </div>
                                                {isLoading && index === messages.length - 1 && (
                                                    <div className={`whole-div w-full flex items-center gap-1 justify-start`}>
                                                        <div className={`relative message px-3 py-2.5 flex items-center gap-1 rounded-lg max-w-xs bg-white/5 hover:bg-primary/10 border border-white/10`}>
                                                            <p className={`text-sm text-white`}>Typing...</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div ref={messagesEndRef} />
                                            </>
                                        ))}
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
                                            {agentExampleCommands[selectedAgent?.agentId || "swap"]?.map((command, index) => (
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

                <CardFooter className="border-t border-white/5 p-4 sticky bottom-0 bg-background z-10">
                    <div className="flex w-full gap-3 md:items-center md:flex-row flex-col">
                        <div className="first flex justify-between gap-2 items-center">
                            <Badge
                                variant="outline"
                                className="bg-primary/10 border-primary/20 text-primary shrink-0 w-auto"
                            >
                                {selectedAgent?.name?.toUpperCase() || "AGENTIFY"}
                            </Badge>
                            <div className="md:hidden agents bg-primary/40 rounded-sm px-2 py-1 pb-1.5" onClick={() => setModelOpen(true)}>
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
                            <div onClick={handleChat} className={`flex items-center justify-center p-2 rounded-xl transition-colors ring-1 ring-primary/20 ${(!isWalletConnected || !inputValue.trim()) ? "cursor-not-allowed" : "bg-primary/10 hover:bg-primary/20 cursor-pointer"}`}>
                                <Send className="h-5 w-5 text-primary" />
                            </div>
                            {/* </Button> */}
                        </div>
                    </div>
                </CardFooter>
            </Card>
            {modelOpen && <div className="absolute top-0 right-0 left-0 bottom-0 bg-black z-40 overflow-hidden h-full">
                <div ref={modalRef} className="agents md:hidden flex p-4 rounded-xl neumorphic border-none bg-gradient-to-b from-background/95 to-background">
                    <AgentSelector
                        selectedAgent={selectedAgent}
                        onSelectAgent={onSelectAgent}
                        setModelOpen={setModelOpen}
                        initialAgents={initialAgents}
                    />
                </div>
            </div>}
        </>
    );
};
