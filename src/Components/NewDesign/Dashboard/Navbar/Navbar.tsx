"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Command, Code, Layers, Menu, X, Wallet, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";

import NavLink from "./NavLink";
import { Button } from "@/Components/ui/button";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

interface NavbarProps {
  onWalletClick?: () => void;
  isWalletOpen?: boolean;
  onChatClick?: () => void;
  isChatOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onWalletClick, isWalletOpen, onChatClick, isChatOpen }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { handleWalletConnect, disconnectAll } = useWalletConnect();
  const { user } = usePrivy();
  const { address } = useAccount();
  const pathname = usePathname();

  // Check if we're on playground page
  const isPlaygroundPage = pathname === "/" || pathname?.startsWith("/chats");

  const handleClick = () => {
    // If on playground and wallet is connected and we have onWalletClick callback
    if (isPlaygroundPage && address && user && onWalletClick) {
      onWalletClick();
    } else if (!address || !user) {
      handleWalletConnect();
    } else {
      disconnectAll();
    }
  };

  // Determine button text and icon
  const getButtonContent = () => {
    if (isPlaygroundPage && address && user && onWalletClick) {
      return (
        <>
          <Wallet className="w-4 h-4" />
          Wallet
        </>
      );
    }
    return address && user ? "Disconnect Wallet" : "Connect Wallet";
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

          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <div className="logo flex w-[1.7rem] h-[1.7rem] ">
                <img
                  src="/images/new-logo.png"
                  alt="Agentify Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
              Agentify
            </h1>
          </Link>
        </div>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-6 mx-4">
          
          <NavLink to="/" icon={Command} className2="h-4 w-4">
            Playground
          </NavLink>
          <NavLink to="/dashboard" icon={LayoutDashboard} className2="h-4 w-4">
            Dashboard
          </NavLink>
          <NavLink to="/agents" icon={Code} className2="h-4 w-4">
            Agents
          </NavLink>
          <NavLink to="/activity" icon={Layers} className2="h-4 w-4">
            Activity
          </NavLink>
        </nav>

        {/* Connect/Disconnect/Wallet Button */}
        <div className="flex justify-end items-center gap-2 flex-1 md:flex-none">
          {/* Chat Button - Mobile Only on Playground */}
          {isPlaygroundPage && onChatClick && (
            <button
              onClick={onChatClick}
              className="md:hidden p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition"
              data-chat-trigger="true"
            >
              <MessageSquare className="w-5 h-5 text-white" />
            </button>
          )}

          <Button
            variant="outline"
            className="neumorphic-sm hover:bg-primary/5 flex items-center gap-2 text-white"
            onClick={handleClick}
            data-wallet-trigger="true"
          >
            {getButtonContent()}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black backdrop-blur border-b border-white/5 z-40 px-6 py-4 space-y-4" style={{ boxShadow: '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)' }}>
         
          <NavLink to="/" icon={Command} className1="text-md" className2="h-5 w-5">
            Playground
          </NavLink>
           <NavLink to="/dashboard" icon={LayoutDashboard} className1="text-md" className2="h-5 w-5">
            Dashboard
          </NavLink>
          <NavLink to="/agents" icon={Code} className1="text-md" className2="h-5 w-5">
            Agents
          </NavLink>
          <NavLink to="/activity" icon={Layers} className1="text-md" className2="h-5 w-5">
            Activity
          </NavLink>
        </div>
      )}
    </header>
  );
};

export default Navbar;
