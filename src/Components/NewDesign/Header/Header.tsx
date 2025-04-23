"use client";
import "./Header.css";
import { LuLayers } from "react-icons/lu";
import { IoCode } from "react-icons/io5";
import { MdOutlineKeyboardCommandKey } from "react-icons/md";
import { MdOutlineDashboard } from "react-icons/md";
export default function Header() {
  return (
    <div className="flex items-center justify-between px-[60px] py-4 border-b border-[var(--shadow)]">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <img
          src="images/logo.png"
          alt="Agentify Logo"
          className="w-6 h-6 object-contain"
        />
        <span className="text-white">Agentify</span>
      </div>
      <div className="space-x-6 text-sm font-medium text-[var(--text-muted)] hidden md:flex">
        <a href="#" className="flex items-center gap-1 hover:text-white">
          <MdOutlineDashboard className="text-lg" />
          <span className="text-[var(--secondary)]">Dashboard</span>
        </a>

        <a href="#" className="flex items-center gap-1 hover:text-white">
          <MdOutlineKeyboardCommandKey className="text-lg" />
          <span>Playground</span>
        </a>

        <a href="#" className="flex items-center gap-1 hover:text-white">
          <IoCode className="text-lg" />
          <span>Agents</span>
        </a>

        <a href="#" className="flex items-center gap-1 hover:text-white">
          <LuLayers className="text-lg" />
          <span>Assets</span>
        </a>
      </div>

      <button className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-[var(--hover)] transition-colors duration-200 custom-shadow">
        Connect Wallet
      </button>
    </div>
  );
}
