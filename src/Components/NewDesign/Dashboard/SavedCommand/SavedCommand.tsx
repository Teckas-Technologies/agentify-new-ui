"use client";

import { ReactNode } from "react";
import { Button } from "@/Components/ui/button";
import { useRouter } from "next/navigation"; 
interface SavedCommandProps {
  title: string;
  command: string;
  agentId: string;
  icon?: ReactNode;
}

export const SavedCommand = ({ title, command, icon,agentId }: SavedCommandProps) => {
  const router = useRouter();
  const handleRunAgain = () => {
    // Redirect to the Playground page with the agentId and command as URL parameters
    router.push(`/playground?agent=${encodeURIComponent(agentId)}&message=${encodeURIComponent(command)}`);
  };
  return (
    <div className="neumorphic-sm rounded-lg p-3 flex justify-between items-center">
      <div className="flex gap-2 items-center">
        {icon && <div className="text-primary/70">{icon}</div>}
        <div>
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{command}</p>
        </div>
      </div>
      <Button 
        variant="secondary" 
        size="sm" 
        className="glow" 
        onClick={handleRunAgain}
      >
        Run Again
      </Button>
    </div>
  );
};
