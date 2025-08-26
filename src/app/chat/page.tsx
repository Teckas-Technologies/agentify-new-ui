"use client";
import { useState } from "react";
import { ChatInterface } from "@/Components/NewDesign/playground/ChatInterface";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function Chat() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();
  const [threadsRefreshKey, setThreadsRefreshKey] = useState(0);
  const triggerThreadsRefresh = () => setThreadsRefreshKey((k) => k + 1);

  // Generate a new chat ID or redirect to a specific chat
  const chatId = uuidv4();

  return (
    <ChatInterface
      chatId={chatId}
      isSidebarCollapsed={isSidebarCollapsed}
      setIsSidebarCollapsed={setIsSidebarCollapsed}
      onThreadChange={triggerThreadsRefresh}
          // also pass the current key so it can forward to the mobile sidebar instance
          threadsRefreshKey={threadsRefreshKey}
    />
  );
}
