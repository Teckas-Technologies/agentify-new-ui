"use client";
import { SidebarProvider } from "@/Components/ui/sidebar";

interface SidebarWrapperProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function SidebarWrapper({ 
  children, 
  defaultOpen = true,
  className 
}: SidebarWrapperProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className={className}>
        {children}
      </div>
    </SidebarProvider>
  );
}