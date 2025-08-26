"use client";

import { useParams } from "next/navigation";
import { ChatSidebar } from "@/Components/NewDesign/playground/ChatSidebar";
import { ChatInterface } from "@/Components/NewDesign/playground/ChatInterface";
import { useState, useEffect } from "react";

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;

  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [threadsRefreshKey, setThreadsRefreshKey] = useState(0);
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
    <div className="h-screen flex w-full bg-background overflow-hidden">
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
        />
      </main>
    </div>
  );
}
