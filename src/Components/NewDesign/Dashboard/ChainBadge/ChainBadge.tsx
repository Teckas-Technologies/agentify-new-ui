
import { cn } from "@/lib/utils";

interface ChainBadgeProps {
  name: string;
  count: number;
  color?: string;
}

export const ChainBadge = ({ name, count, color = "bg-primary/20" }: ChainBadgeProps) => {
  const getShortenedChainName = (chain: string) => {
    if (chain === "Ethereum Mainnet" || chain === "EthereumCore") {
      return "Ethereum";
    }
    return chain; // return the original name for other chains
  };
  return (
    <div className={cn("rounded-full px-3 py-1 flex items-center gap-1.5", color)}>
      <span className="font-medium text-sm">{name}</span>
      <span className="text-xs bg-background/30 rounded-full w-5 h-5 flex items-center justify-center">
        {count}
      </span>
    </div>
  );
};
