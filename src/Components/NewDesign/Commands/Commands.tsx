"use client";

import { CardContent } from "@/Components/ui/card";
import { FileText, PlayCircle } from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/Components/ui/pagination";
import { SavedCommand } from "../Dashboard/SavedCommand/SavedCommand";
import useFetchSavedCommands from "@/hooks/useFetchSavedCommands";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Skeleton } from "@/Components/ui/skeleton";
import { EmptyState } from "../Dashboard/EmptyState/EmptyState";

const CommandsPage = () => {
  const { address } = useAccount();
  const {
    savedCommands,
    fetchSavedCommands,
    loading: savedCmdLoading,
  } = useFetchSavedCommands();
  const [savedCommandsData, setSavedCommandsData] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const commandsPerPage = 3;

  const skip = (currentPage - 1) * commandsPerPage;
  const limit = commandsPerPage;

  const loadSavedCommands = useCallback(async () => {
    if (address) {
      const res = await fetchSavedCommands(address, skip, limit);
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

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Saved Commands</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </div>

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
                  command={command.command}
                  agentId={command.agent_id}
                  icon={<PlayCircle className="h-4 w-4" />}
                />
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination - Only show if data exists and more than 1 page */}
        {savedCommandsData.length > 0 && savedCommands && savedCommands?.totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => goToPage(currentPage - 1)}
                    className={isFirstPage ? "cursor-not-allowed opacity-50" : ""}
                  />
                </PaginationItem>

                {[...Array(savedCommands?.totalPages)].map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === index + 1}
                      onClick={() => goToPage(index + 1)}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => goToPage(currentPage + 1)}
                    className={isLastPage ? "cursor-not-allowed opacity-50" : ""}
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
