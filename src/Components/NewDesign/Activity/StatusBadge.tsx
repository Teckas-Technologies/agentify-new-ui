
import { ReactNode } from "react";

type StatusType = "success" | "pending" | "failed";

interface StatusBadgeProps {
  status: StatusType;
  children?: ReactNode;
}

export const StatusBadge = ({ status, children }: StatusBadgeProps) => {
  const badgeClass = {
    success: "status-badge-success",
    pending: "status-badge-pending",
    failed: "status-badge-failed",
  }[status];

  return <span className={badgeClass}>{children || status}</span>;
};