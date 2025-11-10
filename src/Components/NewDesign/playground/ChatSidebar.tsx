"use client";
import { useEffect, useState, useRef } from "react";
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
import { useRouter, usePathname, useParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { useConversations } from "@/contexts/ConversationContext";
import { Button } from "../../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useDeleteThread } from "@/hooks/useDeleteThread";
import { Skeleton } from "@/Components/ui/skeleton";
import { useThreads } from "@/contexts/ThreadsContext";

interface ChatSidebarProps {
  mobileView?: boolean;
  onSelectChat?: () => void;
  collapsed?: boolean;
  refreshKey?: number;
}
export interface Thread {
  thread_id: string;
  preview: string;
  last_activity: number;
  message_count: number;
}
export function ChatSidebar({
  mobileView = false,
  onSelectChat,
  collapsed = false,
  refreshKey = 0,
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
  console.log("convers--", conversations);
  const { deleteThread } = useDeleteThread();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);

  const { handleWalletConnect, disconnectAll } = useWalletConnect();
  const { user } = usePrivy();
  console.log("user--",user);

  const { address } = useAccount();
  const signOutDropdownRef = useRef<HTMLDivElement>(null);

  // Use threads from context
  const { threads: contextThreads, isLoading: isFetching, isRefreshing, refreshThreads, removeThread } = useThreads();
  const [threads, setThreads] = useState<Thread[]>(contextThreads);

  // Update local threads when context threads change
  useEffect(() => {
    setThreads(contextThreads);
  }, [contextThreads]);

  // Trigger refresh when refreshKey changes
  const [prevRefreshKey, setPrevRefreshKey] = useState(refreshKey);
  useEffect(() => {
    if (prevRefreshKey !== refreshKey) {
      refreshThreads();
      setPrevRefreshKey(refreshKey);
    }
  }, [refreshKey, prevRefreshKey, refreshThreads]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        signOutDropdownRef.current &&
        !signOutDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSignIn(false);
      }
    };

    if (showSignIn) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSignIn]);

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

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const result = await deleteThread(conversationId, user?.id ?? "");

      if (!result.success) {
        console.error("Failed to delete thread:", result.message);
        return;
      }

      // Remove from context state
      removeThread(conversationId);

      // Get remaining threads after removal
      const remainingThreads = threads.filter(
        (t) => t.thread_id !== conversationId
      );

      // If user is on the deleted conversation route, redirect them
      if (pathname === `/chats/${conversationId}`) {
        if (remainingThreads.length > 0) {
          router.push(`/chats/${remainingThreads[0].thread_id}`);
        } else {
          router.push("/playground");
        }
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
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
  const params = useParams();

  return (
    <div
      className={cn(
        "border-r border-sidebar-border h-full bg-card text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-80"
      )}
    >
      {/* Header */}
      {/* <div
        className={`px-6 py-5 border-b border-sidebar-border flex items-center gap-2 font-bold text-lg
    ${collapsed ? "justify-center" : "justify-start"}`}
      >
        <img
          src="/images/new-logo.png"
          alt="Agentify Logo"
          className={`w-5 h-5 object-contain ${collapsed ? "h-7" : ""}`}
        />
        {!collapsed && <span>Agentify</span>}
      </div> */}

      {/* Main Content (Navigation + Threads) */}
      <div className="flex-1 flex flex-col py-4 pl-4 min-h-0">
        {/* Navigation (commented out - moved to header) */}
        {/* <div className="space-y-6">
          <div>
            {!collapsed && (
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Navigation
              </span>
            )}
            <div
              className={cn(
                "p-2 rounded hover:bg-muted cursor-pointer flex",
                collapsed ? "justify-center" : "items-center gap-2"
              )}
              onClick={() => router.push("/dashboard")}
            >
              <Grid className="h-4 w-4 text-primary" />
              {!collapsed && <span>Dashboard</span>}
            </div>

            <div
              className={cn(
                "p-2 rounded hover:bg-muted cursor-pointer flex",
                collapsed ? "justify-center" : "items-center gap-2"
              )}
              onClick={() => router.push("/activity")}
            >
              <Activity className="h-4 w-4 text-primary" />
              {!collapsed && <span>Activity</span>}
            </div>

            <div
              className={cn(
                "p-2 rounded hover:bg-muted cursor-pointer flex",
                collapsed ? "justify-center" : "items-center gap-2"
              )}
              onClick={() => router.push("/agents")}
            >
              <Users className="h-4 w-4 text-primary" />
              {!collapsed && <span>Agents</span>}
            </div>
          </div>
        </div> */}

        {/* Chat Threads (scrollable area) */}
        {!collapsed && (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* New Chat Button - Fixed */}
            <div className="flex-shrink-0 mb-3 mr-4">
              <Button
                onClick={handleNewConversation}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>
            
            {/* Header - Fixed */}
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase mb-3 mr-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span>Chat Threads</span>
                {isRefreshing && (
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

           <div className="space-y-1 overflow-y-auto custom-scroll flex-1">
  {isFetching && threads.length === 0 ? (
    // Show skeleton only when fetching AND no threads exist yet
   <div className="p-2 space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-full rounded" />
    ))}
  </div>
  ) : threads.length === 0 ? (
    // Empty state (only after fetch completes and no threads found)
    <div className="text-gray-400 text-sm italic p-4 text-center">
      No conversations found
    </div>
  ) : (
    // Threads list
    threads.map((conversation) => (
      <div
        key={conversation.thread_id}
        className={cn(
          "flex items-center justify-between gap-2 p-2 rounded cursor-pointer text-sm truncate group",
          params.id === conversation.thread_id
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted"
        )}
      >
        <div
          className="flex items-center gap-2 truncate"
          onClick={() => router.push(`/chats/${conversation.thread_id}`)}
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {(() => {
              try {
                const parsed = JSON.parse(conversation.preview.toString());
                return parsed.message || "No preview available";
              } catch {
                return conversation.preview || "No preview available";
              }
            })()}
          </span>
        </div>
        <X
          className="h-4 w-4 text-gray-400 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDeleteDialog(conversation.thread_id);
          }}
        />
      </div>
    ))
  )}
</div>


          </div>
        )}
      </div>

      {/* Bottom Profile Section (fixed at bottom) */}
      {/* <div className="p-4 border-t border-sidebar-border flex flex-col gap-2" ref={signOutDropdownRef}>
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
          className="flex items-center justify-between cursor-pointer text-sm text-gray-400 p-2 rounded hover:bg-muted"
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
      </div> */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card text-white">
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
    </div>
  );
}
