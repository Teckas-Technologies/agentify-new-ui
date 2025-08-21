'use client'

import { useParams } from 'next/navigation';
import { ChatSidebar } from '@/Components/NewDesign/ChatSidebar';
import { ChatInterface } from '@/Components/NewDesign/ChatInterface';
import { useState, useEffect } from 'react';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id; // same as :chatId
  const [isMobile, setIsMobile] = useState(false);

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
      {/* Only show sidebar on desktop */}
      {!isMobile && <ChatSidebar />}
      <main className="flex-1 overflow-hidden">
        <ChatInterface chatId={chatId as string} />
      </main>
    </div>
  );
}