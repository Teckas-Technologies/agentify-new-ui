
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/Components/ui/command";
import { ArrowLeftRight, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useChat } from "@/hooks/useChatHook";
import { useAccount } from "wagmi";
import { Agent } from "@/types/types";


const dummyAgents = [
    {
        id: "swap",
        name: "Swap Assistant",
        description: "Execute token swaps across any DEX",
        icon: ArrowLeftRight,
        gradient: "from-violet-500/20 via-fuchsia-500/20 to-violet-500/20"
    },
    {
        id: "bridge",
        name: "Bridge Assistant",
        description: "Bridge tokens between networks",
        icon: Layers,
        gradient: "from-cyan-500/20 via-blue-500/20 to-cyan-500/20"
    },
    {
        id: "lend",
        name: "Lend & Borrow Assistant",
        description: "Manage lending positions",
        icon: Zap,
        gradient: "from-amber-500/20 via-orange-500/20 to-amber-500/20"
    }
];

export const AgentSelector = ({
    selectedAgent,
    onSelectAgent
}: {
    selectedAgent: string;
    onSelectAgent: (id: string) => void;
}) => {
    const [search, setSearch] = useState("");
    const [agents, setAgents] = useState<Agent[] | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const { chat, fetchChatHistory, clearHistory, fetchAgents } = useChat();
    const { address, isConnected } = useAccount();

    useEffect(() => {
        fetchAllAgents();
    }, [address, search]);

    const fetchAllAgents = async () => {
        const res = await fetchAgents({ page: page, search_query: search });
        console.log("Res:", res)
        setAgents(res.data);
        setTotalPages(res?.totalPages)
    };

    const handleSelectAgent = (agentId: string) => {
        // Update the selected agent in the current component
        onSelectAgent(agentId);

        // Optional: Update the URL query parameter without navigation
        const url = new URL(window.location.href);
        url.searchParams.set('agent', agentId);
        window.history.pushState({}, '', url);
    };

    return (
        <Command className="rounded-xl border-0 bg-background/50 backdrop-blur-xl">
            <CommandInput
                placeholder="Search agents..."
                value={search}
                onValueChange={setSearch}
                className="border-b border-white/10 bg-background/50"
            />
            <CommandList>
                <CommandEmpty>No agents found.</CommandEmpty>
                <CommandGroup>
                    {agents && agents.length > 0 && agents.map((agent, index) => (
                        <CommandItem
                            key={agent.agentId || index}
                            onSelect={() => handleSelectAgent(agent.agentId)}
                            className={cn(
                                "group flex items-start gap-4 p-4 cursor-pointer transition-all duration-300",
                                "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10",
                                "from-violet-500/20 via-fuchsia-500/20 to-violet-500/20",
                                selectedAgent === agent.agentId && "bg-gradient-to-r border border-primary/20",
                            )}
                        >
                            <div className="mt-1 p-3 rounded-xl bg-white/5 ring-1 ring-white/10 
                            transition-all duration-300 group-hover:ring-primary/20 
                            group-hover:bg-white/10">
                                <Zap className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <h3 className="font-medium text-gradient">{agent.name}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed truncate-1-lines">{agent.description}</p>
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
};

export default AgentSelector;
