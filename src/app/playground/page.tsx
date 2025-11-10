"use client";

import {
  Zap,
  Wallet,
  ArrowRight,
  X,
  WandSparkles,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { useConversations } from "@/contexts/ConversationContext";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "@/Components/NewDesign/playground/ChatSidebar";
import { useEffect, useState, useRef } from "react";
import { RightSidebar } from "@/Components/NewDesign/playground/RightSidebar";
import { getAccessToken } from "@privy-io/react-auth";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import Navbar from "@/Components/NewDesign/Dashboard/Navbar/Navbar";
// Animated Grid Background Component (keep this as is)
const AnimatedGridBackground = () => {
  return (
    <>
      {/* Animated Grid Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Perspective Grid Container */}
        <div
          className="absolute inset-0"
          style={{
            perspective: "1000px",
            perspectiveOrigin: "center 60%",
          }}
        >
          {/* Animated Grid */}
          <div
            className="absolute w-full h-full"
            style={{
              transform: "rotateX(85deg) translateZ(-300px)",
              transformOrigin: "center center",
            }}
          >
            {/* Horizontal Lines */}
            <div className="absolute inset-0">
              {Array.from({ length: 40 }, (_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/35 to-transparent grid-line-horizontal"
                  style={{
                    top: "50%",
                    animationDelay: `${i * 0.2}s`,
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>

            {/* Vertical Lines */}
            <div className="absolute inset-0">
              {Array.from({ length: 31 }, (_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute h-full w-px bg-gradient-to-b from-white/10 via-white/40 to-white/10 grid-line-vertical"
                  style={{
                    left: `${50 + (i - 15) * 10}%`,
                    animationDelay: `${i * 0.1}s`,
                    opacity: Math.max(0.5, 1 - Math.abs(i - 15) * 0.02),
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        .grid-line-horizontal {
          animation: moveFromHorizon 10s linear infinite;
        }

        @keyframes moveFromHorizon {
          0% {
            transform: translateY(-300vh);
            opacity: 0.4;
          }
          20% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.85;
            transform: translateY(0);
          }
          80% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(300vh);
            opacity: 0.4;
          }
        }
      `}</style>
    </>
  );
};

export default function Playground() {
  const router = useRouter();
  const { createNewConversation } = useConversations();
  const [isLoaded, setIsLoaded] = useState(false);
  const { handleWalletConnect, disconnectAll } = useWalletConnect();
  const { user } = usePrivy();
  const { address } = useAccount();
  // 🔹 Sidebar state
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Refs for detecting outside clicks
  const chatSidebarRef = useRef<HTMLDivElement>(null);
  const walletSidebarRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setIsLoaded(true);
    getToken();
  }, []);
  const getToken = async () => {
    const accessToken = await getAccessToken();
    console.log("Token---", accessToken);
  };
  const handleTryAgentify = () => {
    const id = createNewConversation();
    router.push(`/chats/${id}`);
  };
  const handleClick = () => {
    if (!address || !user) {
      handleWalletConnect();
    } else {
      disconnectAll();
    }
  };
  return (
    <div className="min-h-screen flex flex-col w-full bg-background relative overflow-hidden">
      {/* Navigation Header */}
      <Navbar onWalletClick={() => setIsWalletOpen(!isWalletOpen)} isWalletOpen={isWalletOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Animated Grid Background */}

        {/* ChatSidebar - Fixed position, not affected by wallet animation */}
        {!isMobile && (
          <div className="fixed left-0 top-[73px] h-[calc(100%-73px)] z-30">
            <ChatSidebar />
          </div>
        )}

      {/* 🔹 Mobile Header Buttons */}
      {isMobile && (
        <div className="fixed top-[73px] left-0 right-0 flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm z-40 border-b border-border">
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

        {/* 🔹 Desktop Wallet Button Top Right */}
        {!isMobile && (
          <div className="absolute top-4 right-6 z-30">
            <Button
              onClick={() => {
                setIsWalletOpen(!isWalletOpen);
              }}
              variant="outline"
              className="neumorphic-sm hover:bg-primary/5 rounded-xl shadow-md px-5 py-2 flex items-center justify-center gap-2 transition-all duration-300 group w-full"
            >
              <Wallet className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
              <span className="transition-transform duration-300 group-hover:-translate-x-1">
                Wallet
              </span>
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </Button>
          </div>
        )}

        {/* 🔹 Wallet Sidebar (Right Drawer) */}
        <div
          ref={walletSidebarRef}
          className={`fixed top-[73px] right-0 h-[calc(100%-73px)] w-80 bg-[#101014] text-white shadow-lg transform transition-transform duration-500 z-40 ${
            isWalletOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#1d1d20]">
          <h2 className="text-sm font-semibold text-gray-300">Wallet</h2>
          <button
            onClick={() => setIsWalletOpen(false)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Content */}
        <RightSidebar
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
        />
      </div>

        {/* 🔹 Left Sidebar (Chats) for mobile */}
        {isMobile && (
          <div
            ref={chatSidebarRef}
            className={`fixed top-[73px] left-0 h-[calc(100%-73px)] w-80 bg-[#101014] shadow-lg transform transition-transform duration-500 z-40 ${
              isChatOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* You'll need to pass the chat sidebar content here */}
            <ChatSidebar mobileView onSelectChat={() => setIsChatOpen(false)} />
          </div>
        )}

        {/* 🔹 Main Content with Push Effect - Only on Desktop */}
        <div
          className={`flex flex-1 relative z-10 transition-all duration-500 ${
            !isMobile ? "ml-60" : ""
          } ${
            // Push effect only on desktop
            isWalletOpen && !isMobile
              ? "translate-x-[-160px] scale-95"
              : "translate-x-0 scale-100"
          }`}
        >
        {/* 🔹 Video Background Layer */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-70"
        >
          <source src="/videos/bg3.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* 🔹 Centered Content Container */}
        <div className="flex items-center justify-center w-full h-full pt-32 md:pt-0">
          {/* 🔹 Foreground Content */}
          <div className="max-w-2xl text-left relative z-20 mx-4 md:mx-0">
            <h1
              className={`text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent ${
                isLoaded ? "animate-fadeInUp" : "opacity-0"
              }`}
              style={{ animationDelay: "0.2s" }}
            >
              Research
            </h1>
            <div className="space-y-4 text-lg md:text-xl text-muted-foreground mb-8">
              <p
                className={`${isLoaded ? "animate-fadeInUp" : "opacity-0"}`}
                style={{ animationDelay: "0.6s" }}
              >
                Swap seamlessly between chains
              </p>
              <p
                className={`${isLoaded ? "animate-fadeInUp" : "opacity-0"}`}
                style={{ animationDelay: "1.0s" }}
              >
                Bridge tokens effortlessly
              </p>
              <p
                className={`text-primary font-medium ${
                  isLoaded ? "animate-fadeInUp" : "opacity-0"
                }`}
                style={{ animationDelay: "1.4s" }}
              >
                Just ask.
              </p>
            </div>
            <div
              className={`${
                isLoaded ? "animate-fadeIn" : "opacity-0"
              } flex justify-center items-center`}
              style={{ animationDelay: "1.8s" }}
            >
              <button
                className="button items-center justify-center gap-2"
                onClick={handleTryAgentify}
              >
                <WandSparkles className="w-5 h-5 mr-2" />
                Try Agentify
              </button>

              <style jsx>{`
                .button {
                  width: 180px;
                  height: 40px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 10px;
                  padding: 0px 15px;
                  background-color: red;
                  border-radius: 15px;
                  border: none;
                  color: white;
                  position: relative;
                  cursor: pointer;
                  font-weight: 900;
                  transition-duration: 0.2s;
                  background: linear-gradient(0deg, #000, #272727);
                }

                .button:before,
                .button:after {
                  content: "";
                  position: absolute;
                  left: -2px;
                  top: -2px;
                  border-radius: 15px;
                  background: linear-gradient(
                    45deg,
                    #fb0094,
                    #0000ff,
                    #00ff00,
                    #ffff00,
                    #ff0000,
                    #fb0094,
                    #0000ff,
                    #00ff00,
                    #ffff00,
                    #ff0000
                  );
                  background-size: 400%;
                  width: calc(100% + 4px);
                  height: calc(100% + 4px);
                  z-index: -1;
                  animation: steam 20s linear infinite;
                }

                @keyframes steam {
                  0% {
                    background-position: 0 0;
                  }
                  50% {
                    background-position: 400% 0;
                  }
                  100% {
                    background-position: 0 0;
                  }
                }

                .button:after {
                  filter: blur(50px);
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>

        {/* 🔹 Overlay for mobile sidebars */}
        {isMobile && (isChatOpen || isWalletOpen) && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => {
              setIsChatOpen(false);
              setIsWalletOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
