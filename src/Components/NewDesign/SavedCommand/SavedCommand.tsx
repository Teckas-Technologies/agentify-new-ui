"use client";

import { ReactNode } from "react";
import { Button } from "@/Components/ui/button";

interface SavedCommandProps {
  title: string;
  command: string;
  icon?: ReactNode;
  onRun?: () => void;
}

export const SavedCommand = ({ title, command, icon, onRun }: SavedCommandProps) => {
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
        onClick={onRun}
      >
        Run Again
      </Button>
    </div>
  );
};
