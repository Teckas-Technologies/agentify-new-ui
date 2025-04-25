"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  icon: ReactNode;
  value: ReactNode; // <-- changed from string | number to ReactNode
  trend?: {
    value: ReactNode; // <-- also allow JSX here for skeleton
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({ title, value, icon, trend, className }: StatCardProps) => {
  return (
    <div className={cn("neumorphic p-4 rounded-xl", className)}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-xs flex items-center mt-1",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
               {trend.value}
            </p>
          )}
        </div>
        {icon && <div className="text-primary/80">{icon}</div>}
      </div>
    </div>
  );
};
