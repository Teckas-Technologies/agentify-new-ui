import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/Components/ui/command";
import { ArrowLeftRight, Layers, Repeat, Search, Zap } from "lucide-react";
// import { cn } from "@/lib/utils";
import { JSX, useCallback, useEffect, useState } from "react";
import { useChat } from "@/hooks/useChatHook";
import { Agent } from "@/types/types";
import { Input } from "@/Components/ui/input";
import { Skeleton } from "@/Components/ui/skeleton";

const agentIconMap: Record<string, JSX.Element> = {
  swapAgent: <ArrowLeftRight className="h-5 w-5" />,
  bridgeAgent: <Layers className="h-5 w-5" />,
  berachainSwapAgent: <Repeat className="h-5 w-5" />,
  default: <Zap className="h-5 w-5" />
};

export const AgentSelector = ({
  selectedAgent,
  onSelectAgent,
  setModelOpen,
  initialAgents,
}: {
  selectedAgent: Agent | null;
  onSelectAgent: (id: Agent) => void;
  setModelOpen?: (e: boolean) => void;
  initialAgents?: Agent[];
}) => {
  const [search, setSearch] = useState("");
  const [hasInitialAgentsLoaded, setHasInitialAgentsLoaded] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(initialAgents || []);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const { fetchAgents } = useChat();
  const [queryAgent, setQueryAgent] = useState<string>();

  useEffect(() => {
    if (!hasInitialAgentsLoaded) {
      setHasInitialAgentsLoaded(true);
      return;
    }
    if (search.trim() !== "") {
      fetchAllAgents();
    }
  }, [search, queryAgent]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryAgent = params.get("agent");
      if (queryAgent) {
        setQueryAgent(queryAgent);
      } else {
        setQueryAgent("swapAgent");
      }
    }
  }, []);

  useEffect(() => {
    if (queryAgent && agents && agents?.length > 0) {
      const matched = agents?.find(
        (agent: Agent) =>
          agent.agentId === queryAgent ||
          agent.name?.toLowerCase() === queryAgent.toLowerCase()
      );
      if (matched) {
        onSelectAgent(matched);
      } else {
        onSelectAgent(agents[0]);
      }
    }
  }, [queryAgent, agents]);

  const fetchAllAgents = useCallback(async () => {
    setLoading(true);
    const res = await fetchAgents({ page: page, search_query: search });
    setAgents(res.data);
    setTotalPages(res?.totalPages);
    if (res?.data.length > 0 && !queryAgent) {
      onSelectAgent(res?.data[0]);
    }
    setLoading(false);
  }, [page, search]);

  const handleSelectAgent = useCallback(
    (agent: Agent) => {
      // Update the selected agent in the current component
      onSelectAgent(agent);
      if (setModelOpen) {
        setModelOpen(false);
      }

      // Optional: Update the URL query parameter without navigation
      const url = new URL(window.location.href);
      url.searchParams.set("agent", agent?.agentId);
      window.history.pushState({}, "", url);
    },
    [onSelectAgent]
  );

  return (
    <Command className="rounded-xl border-0 bg-background/50 backdrop-blur-xl min-h-[315px]">
      <Input
        placeholder="Search agents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border-b border-white/10 bg-background/50"
      />
      <CommandList>
        {/* <CommandEmpty>No agents found.</CommandEmpty> */}
        {agents?.length === 0 && !loading && (
          <div className="flex flex-col items-center py-2 pt-4 ">
            <div className="bg-muted/20 p-4 rounded-full mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-center font-semibold text-white text-lg">
              No agents found.
            </h2>
          </div>
        )}
        {/* {agents?.length === 0 && loading && <div className="w-full flex items-center justify-center gap-3 py-2 pt-6">
                    <div role="status">
                        <svg aria-hidden="true" className="w-6 h-6 text-gray-100 animate-spin dark:text-gray-600 fill-primary" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                        </svg>
                        <span className="sr-only">Loading...</span>
                    </div>
                    <h2 className="text-center text-white">Fetching agents...</h2>
                </div>} */}
        {agents?.length === 0 && loading && (
          <div className="w-full h-auto flex flex-col gap-2 pt-2">
            <Skeleton className="w-full bg-white/10 h-[81px]"></Skeleton>
            <Skeleton className="w-full bg-white/10 h-[81px]"></Skeleton>
            <Skeleton className="w-full bg-white/10 h-[81px]"></Skeleton>
          </div>
        )}
        <CommandGroup>
          {agents &&
            agents.length !== 0 &&
            !loading &&
            agents.map((agent, index) => (
              <div
                key={agent.agentId || index}
                onClick={() => handleSelectAgent(agent)}
                className={
                  `group flex items-start gap-4 p-4 mt-1 cursor-pointer transition-all duration-300 from-violet-500/20 via-fuchsia-500/20 to-violet-500/20 rounded-sm 
                                ${selectedAgent?.agentId === agent.agentId
                    ? "bg-gradient-to-r border border-primary/20"
                    : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10"
                  }`
                  // cn(
                  //     "group flex items-start gap-4 p-4 cursor-pointer transition-all duration-300",
                  //     "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10",
                  //     "from-violet-500/20 via-fuchsia-500/20 to-violet-500/20",
                  //     selectedAgent === agent.agentId && "bg-gradient-to-r border border-primary/20",
                  // )
                }
              >
                <div
                  className="mt-1 p-3 rounded-xl bg-white/5 ring-1 ring-white/10 
                            transition-all duration-300 group-hover:ring-primary/20 
                            group-hover:bg-white/10"
                >
                  {agentIconMap[agent.agentId] ?? agentIconMap.default}
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-medium text-gradient">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed truncate-1-lines">
                    {agent.description}
                  </p>
                </div> 
              </div>
            ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default AgentSelector;
