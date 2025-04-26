"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // ✅ use usePathname instead
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className1?: string;
  className2?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, children, className1, className2 }) => {
  const pathname = usePathname(); // ✅ get current path
  const isActive = pathname === to;

  return (
    <Link 
      href={to} 
      className={cn(
        "text-sm font-medium transition-colors flex items-center gap-1.5",
        `${className1}`,
        isActive 
          ? "text-white" 
          : "text-muted-foreground hover:text-white"
      )}
    >
      <Icon className={`${className2}`} />
      {children}
    </Link>
  );
};

export default NavLink;
