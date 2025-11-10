"use client";

import { useParams } from "next/navigation";
import { ChatSidebar } from "@/Components/NewDesign/playground/ChatSidebar";
import { ChatInterface } from "@/Components/NewDesign/playground/ChatInterface";
import { useState, useEffect } from "react";
import Navbar from "@/Components/NewDesign/Dashboard/Navbar/Navbar";

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;

  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [threadsRefreshKey, setThreadsRefreshKey] = useState(0);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const triggerThreadsRefresh = () => setThreadsRefreshKey((k) => k + 1);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="h-screen flex flex-col w-full bg-background overflow-hidden">
      {/* Navigation Header */}
      <Navbar
        onWalletClick={() => setIsWalletOpen(!isWalletOpen)}
        isWalletOpen={isWalletOpen}
        onChatClick={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (only on desktop) */}
        {!isMobile && <ChatSidebar collapsed={isSidebarCollapsed} refreshKey={threadsRefreshKey}/>}
        {/* Main chat area */}
        <main className="flex-1 overflow-hidden">
          <ChatInterface
            chatId={chatId}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            onThreadChange={triggerThreadsRefresh}
            // also pass the current key so it can forward to the mobile sidebar instance
            threadsRefreshKey={threadsRefreshKey}
            // Pass wallet sidebar control to ChatInterface
            isWalletOpen={isWalletOpen}
            setIsWalletOpen={setIsWalletOpen}
            // Pass chat sidebar control to ChatInterface
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
          />
        </main>
      </div>
    </div>
  );
}
