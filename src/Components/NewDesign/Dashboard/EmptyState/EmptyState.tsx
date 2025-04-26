
import { MessageSquareOff } from "lucide-react";
import { Card } from "@/Components/ui/card";
import { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export const EmptyState = ({ 
  title = "No transactions yet",
  description = "When you make transactions, they will appear here.",
  icon = <MessageSquareOff className="h-12 w-12 text-muted-foreground/50" />
}: EmptyStateProps) => {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </Card>
  );
};
