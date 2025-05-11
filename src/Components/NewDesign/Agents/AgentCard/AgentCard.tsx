import { useState } from "react";
import { ArrowRight, ShieldCheck, Key, Info } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  categories: string[];
  tags: string[];
  supported_chains: string[];
  sample_commands: string[];
  security_notes: string;
}

const AgentCard = ({
  id,
  name,
  description,
  categories,
  tags,
  supported_chains,
  sample_commands,
  security_notes
}: AgentCardProps) => {
  const router = useRouter();

  // Hardcoded values for each agent type
  const getAgentDetails = (agentId: string) => {
    const details = {
      icon: "Command", // Default icon
      gradient: "from-violet-500/20 via-fuchsia-500/20 to-violet-500/20", // Default gradient
      supportedChains: ["Ethereum", "Arbitrum", "Optimism", "Polygon", "Base"],
      sampleCommands: ["Basic command 1", "Basic command 2", "Basic command 3"],
      securityNotes: "Standard security protocols apply for this agent.",
      permissions: ["Connect wallet", "Transaction signing"],
    };

    // Customize based on agent ID
    switch (agentId) {
      case "swapAgent":
        return {
          ...details,
          icon: "ArrowLeftRight",
          gradient: "from-violet-500/20 via-fuchsia-500/20 to-violet-500/20",
          sampleCommands: [
            "Swap 0.1 ETH to USDC",
            "Find best rate for token swap",
            "Execute swap with custom slippage",
          ],
          securityNotes:
            "Requires token approvals. Uses secure routes with trusted protocols.",
          permissions: [
            "Connect wallet",
            "Token approvals",
            "Transaction signing",
          ],
        };
      case "bridgeAgent":
        return {
          ...details,
          icon: "Layers",
          gradient: "from-cyan-500/20 via-blue-500/20 to-cyan-500/20",
          sampleCommands: [
            "Bridge tokens between chains",
            "Check bridge fees",
            "Execute cross-chain transfer",
          ],
          securityNotes:
            "Uses official bridge contracts and trusted aggregators.",
          permissions: [
            "Connect wallet",
            "Token approvals",
            "Transaction signing",
          ],
        };
      case "lendingBorrowingAgent":
        return {
          ...details,
          icon: "Zap",
          gradient: "from-amber-500/20 via-orange-500/20 to-amber-500/20",
          sampleCommands: [
            "Swap 0.1 ETH to USDC",
            "Find best rate for token swap",
            "Execute swap with custom slippage",
          ],
          securityNotes:
            "Requires token approvals. Uses secure routes with trusted protocols.",
          permissions: [
            "Connect wallet",
            "Token approvals",
            "Transaction signing",
          ],
        };
        case "berachainSwapAgent":
  return {
    ...details,
    icon: "BeraSwap", // Example icon for Berachain
    gradient: "from-yellow-400/20 via-yellow-500/20 to-yellow-600/20", // Fully yellow gradient
    sampleCommands: [
      "Swap BERA to USDC",
      "Get Berachain swap rates",
      "Swap with custom slippage on Berachain",
    ],
    supportedChains: ["Berachain"],
    securityNotes:
      "Operates on Berachain. Ensure token approval for Berachain-based tokens.",
    permissions: [
      "Connect wallet",
      "Token approvals",
      "Transaction signing",
    ],
  };

      // Add more cases as needed
      default:
        return details;
    }
  };

  const agentDetails = getAgentDetails(id);

  const handleLaunchAgent = () => {
    router.push(`/playground?agent=${id}`);
  };

  // Dynamic icon component (same as before)
  const DynamicIcon = ({ name }: { name: string }) => {
    const icons = {
      ArrowLeftRight: () => (
        <div className="p-3 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-violet-400"
          >
            <path d="M18 8L22 12L18 16" />
            <path d="M6 12H22" />
            <path d="M6 16L2 12L6 8" />
            <path d="M2 12H18" />
          </svg>
        </div>
      ),
      Layers: () => (
        <div className="p-3 rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-cyan-400"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
      ),
      Zap: () => (
        <div className="p-3 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-amber-400"
          >
            <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
      ),
      BeraSwap: () => (
        <div className="p-3 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            fill="none"
            className="h-5 w-5 text-amber-400"
          >
            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="4" />
            <path
              d="M35 50c0-8.3 6.7-15 15-15s15 6.7 15 15-6.7 15-15 15"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M50 35v-8M50 65v8M65 50h8M35 50h-8"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ),
      
      
      
    };

    const IconComponent = icons[name as keyof typeof icons];
    return IconComponent ? (
      <IconComponent />
    ) : (
      <div className="w-12 h-12 bg-muted rounded-full" />
    );
  };

  return (
    <div
      className={cn(
        "group rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5",
        "neumorphic-sm border-none bg-gradient-to-br from-background/90 to-background",
        agentDetails.gradient
      )}
    >
      <div className="flex gap-4 items-start mb-4">
        <DynamicIcon name={agentDetails.icon} />
        <div>
          <h3 className="text-xl font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1 truncate-1-lines">
            {description}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 mb-4">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="bg-white/5 text-xs border-white/10 hover:bg-white/10 transition-colors"
          >
            {tag}
          </Badge>
        ))}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="p-0 h-auto text-sm font-medium text-muted-foreground hover:text-white hover:bg-transparent flex items-center gap-1"
          >
            <Info className="h-4 w-4" /> More details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-scroll scroll-d bg-[#0a0a0a] text-white border border-white/10 shadow-lg rounded-xl animate-in fade-in zoom-in-95">
          <DialogHeader>
            <DialogTitle>{name} - Details</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div>
              <h4 className="font-medium mb-2 text-white/90">
                Supported Chains
              </h4>
              <div className="flex flex-wrap gap-2">
                {supported_chains.map((chain) => (
                  <Badge
                    key={chain}
                    className="bg-secondary text-white/90 hover:bg-secondary/80"
                  >
                    {chain}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-white/90">
                Sample Commands
              </h4>
              <ul className="space-y-2">
                {sample_commands?.map((command, idx) => (
                  <li
                    key={idx}
                    className="text-muted-foreground bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md font-mono text-xs transition-colors"
                  >
                    {command}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-1.5 text-white/90">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                Security Notes
              </h4>
              <p className="text-muted-foreground text-sm">
                {security_notes}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-1.5 text-white/90">
                <Key className="h-4 w-4 text-amber-400" />
                Required Permissions
              </h4>
              <ul className="space-y-1">
                {agentDetails.permissions.map((permission, idx) => (
                  <li
                    key={idx}
                    className="text-muted-foreground text-sm flex items-center gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        onClick={handleLaunchAgent}
        className="w-full mt-4 bg-primary/10 hover:bg-primary/20 text-white border border-primary/20 hover:border-primary/30"
      >
        Launch Agent
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default AgentCard;
