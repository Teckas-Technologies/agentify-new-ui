"use client";

import { CardContent } from "@/Components/ui/card";
import { ArrowLeft, FileText, PlayCircle } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/Components/ui/pagination";
import { SavedCommand } from "../Dashboard/SavedCommand/SavedCommand";
import useFetchSavedCommands from "@/hooks/useFetchSavedCommands";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Skeleton } from "@/Components/ui/skeleton";
import { EmptyState } from "../Dashboard/EmptyState/EmptyState";
import Navbar from "../Dashboard/Navbar/Navbar";


interface Command {
  agent_id: string;
  agent_name: string;
  command: string;
  id: string;
}

const CommandsPage = () => {
  const router = useRouter();
  const { address } = useAccount();
  const {
    savedCommands,
    fetchSavedCommands,
    loading: savedCmdLoading,
  } = useFetchSavedCommands();
  const [savedCommandsData, setSavedCommandsData] = useState<Command[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const commandsPerPage = 5;

  const skip = (currentPage - 1) * commandsPerPage;
  const limit = commandsPerPage;

  const loadSavedCommands = useCallback(async () => {
    if (address) {
      const res = await fetchSavedCommands(skip, limit);
      if (res?.data) {
        setSavedCommandsData(res.data);
      }
    }
  }, [address, skip, limit]);

  useEffect(() => {
    loadSavedCommands();
  }, [address, skip, limit]);

  const isFirstPage = currentPage === 1;
  const isLastPage =
    savedCommands?.totalPages !== undefined &&
    currentPage === savedCommands.totalPages;

  const goToPage = (page: number) => {
    if (
      savedCommands?.totalPages &&
      page >= 1 &&
      page <= savedCommands.totalPages
    ) {
      setCurrentPage(page);
    }
  };

  function isJsonString(str: string) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  const renderPaginationItems = () => {
    if (!savedCommands?.totalPages) return null;

    const totalPages = savedCommands.totalPages;
    const items = [];
    const maxVisiblePages = 5; // Show up to 5 page numbers at once

    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          href="#"
          isActive={currentPage === 1}
          onClick={() => goToPage(1)}
          className="min-w-[40px]"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is 5 or less
      for (let i = 2; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={() => goToPage(i)}
              className="min-w-[40px]"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Determine range of pages to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the start or end
      if (currentPage <= 3) {
        startPage = 2;
        endPage = 4;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
        endPage = totalPages - 1;
      }

      // Add first ellipsis if needed
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={() => goToPage(i)}
              className="min-w-[40px]"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Add second ellipsis if needed
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Always show last page
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            isActive={currentPage === totalPages}
            onClick={() => goToPage(totalPages)}
            className="min-w-[40px]"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    // <div className="min-h-screen bg-background text-foreground">
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <Navbar />
      {/* <div className="container mx-auto max-w-5xl"> */}
      <div className="container relative mx-auto px-3 py-6 md:px-4 md:py-8">
        <div className=" mb-8 md:px-5 px-2">
          <Button
            variant="outline"
            size="sm"
            className="neumorphic-sm flex items-center gap-2 mb-4 hover:bg-primary/20"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-br from-white via-white/90 to-white/70 bg-clip-text text-transparent">
            Saved Commands
          </h1>
          <p className="text-muted-foreground mt-1">
            Execute smart transactions with your favorite commands
          </p>

        </div>
        {/* Header */}
        {/* <div className="flex items-center justify-between mb-6">
          <h1 className="md:text-2xl text-lg font-bold">Saved Commands</h1>
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </div> */}

        {/* Commands List */}
        <CardContent>
          {!address || savedCmdLoading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(commandsPerPage)].map((_, index) => (
                <div className="h-[50px] w-full" key={index}>
                  <Skeleton className="w-full h-full bg-white/10 rounded-md" />
                </div>
              ))}
            </div>
          ) : savedCommandsData.length === 0 ? (
            <EmptyState
              title="No Saved Commands"
              description="Your frequently used and saved commands will appear here."
              icon={<FileText className="h-12 w-12 text-muted-foreground/50" />}
            />
          ) : (
            <div className="space-y-3">
              {savedCommandsData.map((command) => (
                <SavedCommand
                  key={command.id}
                  title={command.agent_name}
                  command={isJsonString(command.command)
                    ? JSON.parse(command.command).message
                    : command.command}
                  agentId={command.agent_id}
                  icon={<PlayCircle className="h-4 w-4" />}
                />
              ))}
            </div>
          )}
        </CardContent>


        {/* Enhanced Pagination */}
        {savedCommandsData.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => goToPage(currentPage - 1)}
                    className={
                      isFirstPage
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-accent/80"
                    }
                    size="sm"
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => goToPage(currentPage + 1)}
                    className={
                      isLastPage
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-accent/80"
                    }
                    size="sm"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandsPage;