"use client";
import { useState } from "react";
import {
  ChevronDown,
  X,
  MessageSquare,
  Grid,
  Activity,
  Users,
  Plus,
  UserRound,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useConversations } from "@/contexts/ConversationContext";
import { Button } from "../ui/button";
import { Sidebar, SidebarContent, SidebarHeader } from "../ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

interface ChatSidebarProps {
  mobileView?: boolean;
  onSelectChat?: () => void;
  collapsed?: boolean;
}

export function ChatSidebar({
  mobileView = false,
  onSelectChat,
  collapsed = false,
}: ChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    conversations,
    createNewConversation,
    deleteConversation,
    deleteAllConversations,
  } = useConversations();
  const [showSignIn, setShowSignIn] = useState(false);

  // new states for delete flow
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);

  const { handleWalletConnect, disconnectAll } = useWalletConnect();
  const { user } = usePrivy();
  const { address } = useAccount();

  const handleClick = () => {
    if (!address || !user) {
      handleWalletConnect();
    } else {
      disconnectAll();
    }
  };

  const handleNewConversation = () => {
    const id = createNewConversation();
    router.push(`/chats/${id}`);
  };

  const handleDeleteConversation = (conversationId: string) => {
    deleteConversation(conversationId);
    if (pathname === `/chats/${conversationId}`) {
      const remainingConversations = conversations.filter(
        (conv) => conv.id !== conversationId
      );
      if (remainingConversations.length > 0) {
        router.push(`/chats/${remainingConversations[0].id}`);
      } else {
        router.push("/playground");
      }
    }
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      handleDeleteConversation(conversationToDelete);
      setConversationToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleOpenDeleteDialog = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const isActive = (conversationId: string) =>
    pathname === `/chats/${conversationId}`;

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border bg-[#18181B] text-white transition-all duration-300",
        collapsed ? "w-20" : "w-80"
      )}
      collapsible="none"
    >
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border flex flex-row items-center gap-2 font-bold text-lg">
        <img
          src="/images/new-logo.png"
          alt="Agentify Logo"
          className="w-5 h-5 object-contain"
        />
        {!collapsed && <span>Agentify</span>}
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="p-4 flex flex-col justify-between h-full overflow-y-auto">
        <div className="space-y-6">
          {/* Navigation */}
          <div>
            {!collapsed && (
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Navigation
              </span>
            )}
            <div
              className={cn(
                "p-2 rounded hover:bg-[#111] cursor-pointer flex",
                collapsed ? "justify-center" : "items-center gap-2"
              )}
            >
              <Grid className="h-4 w-4 text-primary" />
              {!collapsed && <span>Dashboard</span>}
            </div>

            <div
              className={cn(
                "p-2 rounded hover:bg-[#111] cursor-pointer flex",
                collapsed ? "justify-center" : "items-center gap-2"
              )}
            >
              <Activity className="h-4 w-4 text-primary" />
              {!collapsed && <span>Activity</span>}
            </div>

            <div
              className={cn(
                "p-2 rounded hover:bg-[#111] cursor-pointer flex",
                collapsed ? "justify-center" : "items-center gap-2"
              )}
            >
              <Users className="h-4 w-4 text-primary" />
              {!collapsed && <span>Agents</span>}
            </div>
          </div>

          {/* Chat Threads */}
          {/* Chat Threads */}
{!collapsed && (
  <>
    <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase mb-3">
      <span>Chat Threads</span>
      <Plus
        className="h-4 w-4 text-gray-400 hover:text-white cursor-pointer"
        onClick={handleNewConversation}
      />
    </div>

    <div className="space-y-1">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={cn(
            "flex items-center justify-between gap-2 p-2 rounded cursor-pointer text-sm truncate group",
            isActive(conversation.id)
              ? "bg-primary/10 text-primary"
              : "hover:bg-[#111]"
          )}
        >
          <div
            className="flex items-center gap-2 truncate"
            onClick={() => router.push(`/chats/${conversation.id}`)}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">{conversation.title}</span>
          </div>
          <X
            className="h-4 w-4 text-gray-400 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDeleteDialog(conversation.id);
            }}
          />
        </div>
      ))}
    </div>
  </>
)}

        </div>

        {/* Bottom Profile Section */}
        <div className="mt-4 flex flex-col gap-2">
          {showSignIn && (
            <Button
              variant="outline"
              className="neumorphic-sm hover:bg-primary/5 w-full rounded font-medium"
              onClick={handleClick}
            >
              {address && user ? "Sign Out" : "Sign in"}
            </Button>
          )}

          <div
            onClick={() => setShowSignIn(!showSignIn)}
            className="flex items-center justify-between cursor-pointer text-sm text-gray-400 p-4 rounded hover:bg-[#111]"
          >
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-gray-400" />
              {!collapsed && (
                <span>
                  {address && user
                    ? `${address.slice(0, 6)}...${address.slice(-4)}`
                    : "Anonymous"}
                </span>
              )}
            </div>
            {!collapsed && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  showSignIn && "rotate-180"
                )}
              />
            )}
          </div>
        </div>
      </SidebarContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#18181B] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
