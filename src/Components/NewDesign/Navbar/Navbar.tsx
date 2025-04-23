"use client";

import React from "react";
import Link from "next/link"; // Use next/link instead of react-router-dom
import { Terminal, LayoutDashboard, Command, Code, Layers } from "lucide-react";

import NavLink from "./NavLink";
import { Button } from "@/Components/ui/button";

const Navbar: React.FC = () => {
  return (
    <header className="px-6 py-4 border-b border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
            Agentify
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" icon={LayoutDashboard}>
            Dashboard
          </NavLink>
          <NavLink to="/playground" icon={Command}>
            Playground
          </NavLink>
          <NavLink to="/agents" icon={Code}>
            Agents
          </NavLink>
          <NavLink to="/activity" icon={Layers}>
            Activity
          </NavLink>
        </nav>
        <Button variant="outline" className="neumorphic-sm hover:bg-primary/5">
          Connect Wallet
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
