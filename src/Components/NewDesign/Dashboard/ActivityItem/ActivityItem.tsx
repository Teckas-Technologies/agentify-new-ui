"use client";

import { ReactNode } from "react";
import { StatusBadge } from "../StatusBadge/StatusBadge";

type ActivityStatus = "success" | "pending" | "failed";

interface ActivityItemProps {
  title: string;
  timestamp: string;
  status: ActivityStatus;
  icon?: ReactNode;
  description?: string;
}

export const ActivityItem = ({
  title,
  timestamp,
  status,
  icon,
  description,
}: ActivityItemProps) => {
  return (
    <div
      className="flex gap-3 py-3 border-b border-white last:border-0"
      style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}
    >
      {icon && <div className="mt-1 text-primary/70">{icon}</div>}
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-medium">{title}</h4>
          <StatusBadge status={status} />
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        <span className="text-xs text-muted-foreground mt-1 block">
          {timestamp}
        </span>
      </div>
    </div>
  );
};
