'use client'

import { useParams } from 'next/navigation';
import { ChatSidebar } from '@/Components/NewDesign/ChatSidebar';
import { ChatInterface } from '@/Components/NewDesign/ChatInterface';
import { useState, useEffect } from 'react';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;

  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      {/* Sidebar (only on desktop) */}
      {!isMobile && (
        <ChatSidebar collapsed={isSidebarCollapsed} />
      )}

      {/* Main chat area */}
      <main className="flex-1 overflow-hidden">
        <ChatInterface
          chatId={chatId}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </main>
    </div>
  );
}
