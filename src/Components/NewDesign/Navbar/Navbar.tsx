"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  LayoutDashboard,
  Command,
  Code,
  Layers,
  Menu,
  X,
} from "lucide-react";

import NavLink from "./NavLink";
import { Button } from "@/Components/ui/button";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="px-4 sm:px-6 py-4 border-b border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex justify-between items-center w-full">
        {/* Left aligned items - hamburger and logo */}
        <div className="flex items-center gap-2 flex-1 md:flex-none">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>

          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
              Agentify
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation - centered */}
        <nav className="hidden md:flex items-center gap-6 mx-4">
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

        {/* Right aligned button */}
        <div className="flex justify-end flex-1 md:flex-none">
          <Button
            variant="outline"
            className="neumorphic-sm hover:bg-primary/5"
          >
            Connect Wallet
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 px-2 space-y-2">
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
        </div>
      )}
    </header>
  );
};

export default Navbar;
