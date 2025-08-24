"use client";
import { useState } from "react";
import { ChatInterface } from "@/Components/NewDesign/ChatInterface";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function Chat() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();
  
  // Generate a new chat ID or redirect to a specific chat
  const chatId = uuidv4();
  
  return (
    <ChatInterface 
      chatId={chatId}
      isSidebarCollapsed={isSidebarCollapsed}
      setIsSidebarCollapsed={setIsSidebarCollapsed}
    />
  );
}