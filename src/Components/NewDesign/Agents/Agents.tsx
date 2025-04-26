"use client";
import React, { useEffect, useState } from "react";
import { Search, ArrowRight, Construction, X } from "lucide-react";
import { Button } from "@/Components/ui/button";
import Navbar from "../Dashboard/Navbar/Navbar";
import SearchAndFilter from "./SearchAndFilter/SearchAndFilter";
import AgentCard from "./AgentCard/AgentCard";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";
import useFetchAgents from "@/hooks/useFetchAgents";
import { Skeleton } from "@/Components/ui/skeleton";

export interface AgentCategory {
  id: string;
  name: string;
}

interface AgentsPageProps {
  initialAgents?: any[];
}

const AgentsPage = ({ initialAgents = [] }: AgentsPageProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

  const { agentsData, loading, error, fetchAgents } = useFetchAgents(initialAgents);

  useEffect(() => {
    fetchAgents({
      userId: "demo_user", // Replace with actual userId
      searchQuery: searchTerm,
      filter: selectedCategory !== "all" ? selectedCategory : "",
    });
  }, [searchTerm, selectedCategory]);

  const categories: AgentCategory[] = [
    { id: "all", name: "All Agents" },
    { id: "DEFI", name: "DeFi" },
    { id: "NFT", name: "NFT" },
    { id: "TRADING", name: "Trading" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              Browse Agents
            </h1>
            <p className="text-muted-foreground mt-1">
              Pick an agent. Give it a task. Let it work for you.
            </p>
          </div>

          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {agentsData.map((agent) => (
            <AgentCard
              key={agent.agentId}
              id={agent.agentId}
              name={agent.name}
              description={agent.description}
              categories={[selectedCategory]} // or derive categories based on your logic
              tags={agent.tags}
              sample_commands={agent.sample_commands}
              security_notes={agent.security_notes}
              supported_chains={agent.supported_chains}
            />
          ))}

          {agentsData.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted/20 p-4 rounded-full mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">No agents found</h3>
              <p className="text-muted-foreground max-w-md">
                Try adjusting your search or filter criteria to find what you're
                looking for.
              </p>
            </div>
          )}

          {agentsData.length === 0 && loading && (
            <>
              <Skeleton className="w-full bg-white/10 h-[230px]"></Skeleton>
              <Skeleton className="w-full bg-white/10 h-[230px]"></Skeleton>
              <Skeleton className="w-full bg-white/10 h-[230px]"></Skeleton>
            </>
          )}
        </div>

        {/* Build Your Own Agent Section */}
        <div className="mt-16 p-8 rounded-xl neumorphic border-none bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent mb-2">
                Build Your Own Agent?
              </h2>
              <p className="text-muted-foreground max-w-lg">
                Create custom agents tailored to your specific needs with the
                Agentify Developer Framework. Design, test, and deploy your AI
                agents in minutes.
              </p>
            </div>
            <Dialog open={isComingSoonOpen} onOpenChange={setIsComingSoonOpen}>
              <DialogTrigger asChild>
                <Button
                  className="glow neumorphic-sm hover:bg-primary/10 py-3 px-6 rounded-lg text-white font-medium border border-primary/20 flex items-center gap-2 transition-all"
                  onClick={() => setIsComingSoonOpen(true)}
                >
                  Start Building
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0A0A]">
                <DialogHeader>
                  <div className="w-full flex justify-between">
                    <DialogTitle className="flex items-center gap-2 text-white">
                      <Construction className="h-6 w-6 text-primary" />
                      Coming Soon
                    </DialogTitle>
                    <DialogClose asChild>
                      <div className="w-6 h-6 border border-primary rounded-full flex justify-center items-center absolute right-3 top-3 rounded-sm opacity-100 z-50 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none cursor-pointer">
                        <X className="h-4 w-4 text-primary" />
                      </div>
                    </DialogClose>
                  </div>
                  <DialogDescription>
                    We're working hard to bring the Agentify Developer Framework
                    to life. Stay tuned for an exciting update that will empower
                    you to create custom AI agents!
                  </DialogDescription>
                </DialogHeader>

              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AgentsPage;
