"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Command, Code, Layers, Menu, X } from "lucide-react";

import NavLink from "./NavLink";
import { Button } from "@/Components/ui/button";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { handleWalletConnect, disconnectAll } = useWalletConnect();
  const { user } = usePrivy();
  const { address } = useAccount();

  console.log("Address", address);
  console.log("User", user);

  const handleClick = () => {
    if (!address || !user) {
      handleWalletConnect();
    } else {
      disconnectAll();
    }
  };

  return (
    <header className="px-4 sm:px-6 py-4 border-b border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex justify-between items-center w-full">
        {/* Hamburger + Logo */}
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

          <Link href="/" className="flex items-center gap-1">
            <div className="logo flex w-[10rem] h-[2.5rem]">
              <img
                src="images/agentify-logo-sample.png"
                alt="Agentify Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {/* <h1 className="text-xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
              Agentify
            </h1> */}
          </Link>
        </div>

        {/* Center Nav */}
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

        {/* Connect/Disconnect Button */}
        <div className="flex justify-end flex-1 md:flex-none">
          <Button
            variant="outline"
            className="neumorphic-sm hover:bg-primary/5"
            onClick={handleClick}
          >
            {address && user ? "Disconnect Wallet" : "Connect Wallet"}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
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
