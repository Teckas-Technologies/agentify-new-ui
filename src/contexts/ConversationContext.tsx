'use client'
import { useDeleteThread } from '@/hooks/useDeleteThread';
import { usePrivy } from '@privy-io/react-auth';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';

}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationContextType {
  conversations: Conversation[];
  currentChat: Conversation | null;
  createNewConversation: () => string;
  getConversation: (id: string) => Conversation | undefined;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateConversationTitle: (conversationId: string, title: string) => void;
  deleteConversation: (conversationId: string) => void;
  deleteAllConversations: () => void;
  setCurrentChat: (conversation: Conversation | null) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
};

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

interface ConversationProviderProps {
  children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChat, setCurrentChat] = useState<Conversation | null>(null);
  const { deleteThread } = useDeleteThread();
  const { user } = usePrivy();
  const createNewConversation = useCallback((): string => {
    const id = generateId();
    const newConversation: Conversation = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentChat(newConversation);
    return id;
  }, []);

  const getConversation = useCallback((id: string): Conversation | undefined => {
    return conversations.find(conv => conv.id === id);
  }, [conversations]);

  const addMessage = useCallback((conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const messageId = generateId();
    const newMessage: Message = {
      ...message,
      id: messageId,
    };

    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === conversationId) {
          const updatedConv = {
            ...conv,
            messages: [...conv.messages, newMessage],
            updatedAt: new Date(),
            // Auto-generate title from first user message
            title: conv.messages.length === 0 && message.role === 'user' 
              ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
              : conv.title
          };
          
          // Update current chat if it's the same conversation
          if (currentChat?.id === conversationId) {
            setCurrentChat(updatedConv);
          }
          
          return updatedConv;
        }
        return conv;
      })
    );
  }, [currentChat]);

  const updateConversationTitle = useCallback((conversationId: string, title: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, title, updatedAt: new Date() }
          : conv
      )
    );
  }, []);

 const deleteConversation = useCallback(
    async (conversationId: string) => {
      // call API first
      const res = await deleteThread(conversationId,user?.id ?? "");

      if (res.success) {
        setConversations((prev) =>
          prev.filter((conv) => conv.id !== conversationId)
        );

        if (currentChat?.id === conversationId) {
          setCurrentChat(null);
        }
      } else {
        console.error('Failed to delete conversation:', res.message);
      }
    },
    [currentChat, deleteThread]
  );

  const deleteAllConversations = useCallback(() => {
    setConversations([]);
    setCurrentChat(null);
  }, []);

  const value: ConversationContextType = {
    conversations,
    currentChat,
    createNewConversation,
    getConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    deleteAllConversations,
    setCurrentChat,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};