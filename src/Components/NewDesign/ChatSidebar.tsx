"use client";
import { useState } from "react";
import {
  Trash2,
  FileEdit,
  ChevronDown,
  X,
  MessageSquare,
  MessageCircle,
  SquarePen,
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
interface ChatSidebarProps {
  mobileView?: boolean;
  onSelectChat?: () => void;
}
export function ChatSidebar({ mobileView = false, onSelectChat }: ChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    conversations,
    createNewConversation,
    deleteConversation,
    deleteAllConversations,
  } = useConversations();
  const [showSignIn, setShowSignIn] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);

  const handleNewConversation = () => {
    const id = createNewConversation();
    router.push(`/chats/${id}`);
  };

  const handleDeleteConversation = (conversationId: string) => {
    deleteConversation(conversationId);
    if (pathname === `/chats/${conversationId}`) {
      // Check if there are other conversations
      const remainingConversations = conversations.filter(
        (conv) => conv.id !== conversationId
      );

      if (remainingConversations.length > 0) {
        // Navigate to the first remaining conversation
        router.push(`/chats/${remainingConversations[0].id}`);
      } else {
        // No conversations left, navigate to playground
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

  const handleConfirmDeleteAll = () => {
    deleteAllConversations();
    setDeleteAllDialogOpen(false);
    router.push("/playground");
  };

  const isActive = (conversationId: string) =>
    pathname === `/chats/${conversationId}`;

  return (
    <Sidebar
      className="w-80 border-r border-sidebar-border bg-[#18181B] text-white"
      collapsible="none"
    >
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <img
            src="images/new-logo.png"
            alt="Agentify Logo"
            className="w-5 h-5 object-contain"
          />
          <span>Agentify</span>
        </div>

        <SquarePen
          className="h-5 w-5 cursor-pointer text-gray-300 hover:text-white"
          onClick={handleNewConversation}
        />
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="p-4 flex flex-col justify-between h-full">
        <div>
          {/* Conversations header with Trash */}
          <div className="flex items-center justify-between mb-3 text-sm font-medium text-gray-300">
            <span>Conversations</span>

            <div
              className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20 cursor-pointer"
              onClick={() => setDeleteAllDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* If no conversations → Show New Conversation Button */}
          {conversations.length === 0 ? (
            <Button
              onClick={handleNewConversation}
              variant="outline"
              className="neumorphic-sm hover:bg-primary/5 w-full font-medium mb-4 flex items-center justify-center"
            >
              <SquarePen className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          ) : (
            /* Else → Show conversation list with close icons */
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/chats/${conversation.id}`)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded cursor-pointer transition-colors",
                    isActive(conversation.id)
                      ? "bg-[#222] text-white"
                      : "hover:bg-[#111]"
                  )}
                >
                  {/* Left: conversation title */}
                  <div className="flex items-center gap-2 truncate">
                    <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <span className="truncate">{conversation.title}</span>
                  </div>

                  {/* Right: Close (X) icon */}
                  <X
                    className="h-4 w-4 text-gray-400 hover:text-red-500 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDeleteDialog(conversation.id);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: Sign In + Anonymous */}
        <div className="mt-4 flex flex-col gap-2">
          {showSignIn && (
            <Button
              variant="outline"
              className="neumorphic-sm hover:bg-primary/5 w-full rounded font-medium"
            >
              Sign in
            </Button>
          )}
          <div
            onClick={() => setShowSignIn(!showSignIn)}
            className="flex items-center justify-between cursor-pointer text-sm text-gray-400 p-4 rounded hover:bg-[#111]"
          >
            <span>Anonymous</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showSignIn && "rotate-180"
              )}
            />
          </div>
        </div>
      </SidebarContent>

      {/* Delete Single Conversation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConversationToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Conversations Dialog */}
      <AlertDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Conversations</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all conversations? This will
              permanently remove all your chat history and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAll}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
