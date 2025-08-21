"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowUp, Wallet, MessageSquare } from "lucide-react";
import { useConversations, Message } from "@/contexts/ConversationContext";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { RightSidebar } from "./RightSidebar";
import { ChatSidebar } from "./ChatSidebar";

const SUGGESTED_PROMPTS = [
  "Give me a list of 10 promising AI Agents between 10m and 30m market cap",
  "What are the best DeFi protocols to invest in right now?",
  "Explain the difference between Layer 1 and Layer 2 blockchain solutions",
  "How to create a successful NFT collection in 2024?",
];

interface ChatInterfaceProps {
  chatId: string;
}

// Common Input Component
interface InputBoxProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isCenter?: boolean;
}

function InputBox({ input, setInput, onSendMessage, isLoading, isCenter = false }: InputBoxProps) {
  return (
    <div className="w-full max-w-2xl">
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

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const router = useRouter();
  const { getConversation, addMessage, setCurrentChat, createNewConversation } =
    useConversations();
    
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const conversation = chatId ? getConversation(chatId) : null;

  // Refs for detecting outside clicks
  const chatSidebarRef = useRef<HTMLDivElement>(null);
  const walletSidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      const conv = getConversation(chatId);
      if (conv) {
        setCurrentChat(conv);
      } else {
        // If conversation doesn't exist, redirect to playground
        router.push("/playground");
      }
    }
  }, [chatId, getConversation, setCurrentChat, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
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
        if (isChatOpen && chatSidebarRef.current && 
            !chatSidebarRef.current.contains(event.target as Node)) {
          setIsChatOpen(false);
        }
        
        // Close wallet sidebar if clicked outside
        if (isWalletOpen && walletSidebarRef.current && 
            !walletSidebarRef.current.contains(event.target as Node)) {
          setIsWalletOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isChatOpen, isWalletOpen]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !chatId) return;

    setInput("");
    setIsLoading(true);

    // Add user message
    addMessage(chatId, {
      content: message,
      role: "user",
    });

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(message);
      addMessage(chatId, {
        content: aiResponse,
        role: "assistant",
      });
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
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

  const hasMessages = conversation?.messages.length > 0;

  return (
    <>
      <div className={`flex flex-col h-screen bg-background relative transition-all duration-500 ${
        // Push effect only on desktop
        isWalletOpen && !isMobile ? "translate-x-[-160px] scale-95" : "translate-x-0 scale-100"
      }`}>
        
        {/* Mobile Header Buttons */}
        {isMobile && (
          <div className="flex justify-between items-center p-4 border-b border-border">
            <Button
              onClick={() => setIsChatOpen(true)}
              variant="outline"
              className="neumorphic-sm hover:bg-primary/5 rounded-xl shadow-md px-4 py-2 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chats
            </Button>
            
            <Button
              onClick={() => setIsWalletOpen(true)}
              variant="outline"
              className="neumorphic-sm hover:bg-primary/5 rounded-xl shadow-md px-4 py-2 flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Wallet
            </Button>
          </div>
        )}

        {/* Desktop Wallet Button */}
        {!isMobile && (
          <div className="absolute top-4 right-6 z-30">
            <Button
              onClick={() => setIsWalletOpen(true)}
              variant="outline"
              className="neumorphic-sm hover:bg-primary/5 rounded-xl shadow-md px-5 py-2 flex items-center gap-2 transition-all"
            >
              <Wallet className="w-5 h-5" />
              Wallet
            </Button>
          </div>
        )}

        {/* Chat Messages */}
        {hasMessages && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-32">
            <div className="max-w-3xl mx-auto space-y-6">
              {conversation?.messages.map((message) => (
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
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="flex flex-col items-center justify-center w-full mx-auto text-center space-y-8">
              <div className="w-full flex justify-center px-8">
                <InputBox
                  input={input}
                  setInput={setInput}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  isCenter={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Input - Centered on desktop */}
       {/* Fixed Bottom Input - Centered on desktop */}
{hasMessages && (
  <div className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-background border-t border-border">
    <div
      className={cn(
        "flex justify-center",
        
      )}
    >
      <div className="w-full max-w-2xl">
        <InputBox
          input={input}
          setInput={setInput}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isCenter={false}
        />
      </div>
    </div>
  </div>
)}

      </div>

      {/* Right Sidebar (Wallet) */}
      <div
        ref={walletSidebarRef}
        className={`fixed top-0 right-0 h-full w-80 bg-[#101014] shadow-lg transform transition-transform duration-500 z-40 ${
          isWalletOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <RightSidebar isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      </div>

      {/* Left Sidebar (Chats) for mobile */}
      {isMobile && (
        <div
          ref={chatSidebarRef}
          className={`fixed top-0 left-0 h-full w-80 bg-[#101014] shadow-lg transform transition-transform duration-500 z-40 ${
            isChatOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-xl font-semibold">Chats</h2>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              ✕
            </button>
          </div>
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
          "rounded-lg max-w-2xl overflow-hidden",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground"
        )}
      >
        {/* Agent name header for AI messages */}
        {!isUser && (
          <div className="bg-primary/20 m-3 rounded px-4 py-3 text-sm font-medium text-primary-foreground">
            Agentify AI
          </div>
        )}
        
        <div className="p-4">
          <p className="whitespace-pre-wrap">{message.content}</p>
          <div
            className={cn(
              "text-xs mt-2 opacity-70",
              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}