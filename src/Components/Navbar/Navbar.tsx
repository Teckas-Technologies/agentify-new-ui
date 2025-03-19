/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaRobot, FaLaptopCode } from "react-icons/fa6";
import { MdLink } from "react-icons/md";
import { HiMiniArrowUpRight } from "react-icons/hi2";
import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";
import { useBridgeToken } from "@/hooks/useBridge";
import InlineSVG from "react-inlinesvg";

export default function Navbar({
  isCollapsed,
  isMobileNavVisible,
  onMobileNavToggle,
}: {
  isCollapsed: boolean;
  isMobileNavVisible: boolean;
  onMobileNavToggle: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { connectWallet, user, ready } = usePrivy();
  const [isConnected, setIsConnected] = useState(false);
  const [isSoon, setIsSoon] = useState(false);

  const { wallets } = useSolanaWallets();

  const checkConnection = async () => {
    setIsConnected(await wallets[0].isConnected())
  }

  const checkLinked = async () => {
    if (wallets.length === 0) {
      return;
    }
    const linked = await wallets[0].linked;
    console.log("Linked: ", linked);
    if (!linked) {
      const res = await wallets[0].loginOrLink();
      console.log("RES:", res)
    }
  }

  useEffect(() => {
    if (wallets.length > 0) {
      checkConnection();
    }
  }, [wallets.length])

  useEffect(() => {
    if (wallets.length > 0) {
      checkLinked()
    }
  }, [wallets.length])

  const handleConnect = () => {
    connectWallet({
      suggestedAddress: '1111WS4xG97qPg6xehU4MadJZifPyQPgYPHfsS3X1111',
      walletList: ['phantom', 'solflare'],
    });
  }

  const handleDisconnect = async () => {
    if (wallets.length === 0) {
      return;
    }
    setIsConnected(false);
    await wallets[0].disconnect();
  }

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (pathname === "/browse") return "Browse Agents";
    return "Chat"; // Default active tab
  };

  const [active, setActive] = useState(getActiveTab);

  useEffect(() => {
    setActive(getActiveTab()); // Update state when route changes
  }, [pathname]);

  const handleNavigation = (page: string) => {
    setActive(page);
    router.push(page === "Browse Agents" ? "/browse" : "/");
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileNavVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-30 md:hidden"
          onClick={onMobileNavToggle}
        />

      )}

      <nav
        className={`fixed md:relative h-screen bg-black bg-opacity-90 text-white p-4 flex-col justify-between border-r border-gray-700 transition-all ${isCollapsed && !isMobileNavVisible ? "w-20" : "w-[14rem] md:w-[15rem] lg:w-[16rem]"
          } ${isMobileNavVisible ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 z-50`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Menu Items */}
          <div>
            {/* Logo */}
            <div className="flex items-center space-x-2 font-semibold">
              <img src="images/sonic-logo.png" className="h-9" />
              {(!isCollapsed || isMobileNavVisible) && (
                <span
                  className="text-white text-2xl"
                  style={{ fontFamily: "orbitron" }}
                >
                  SONIC
                </span>
              )}
            </div>

            {/* Menu Items */}
            <ul className="mt-6 space-y-2" style={{ fontFamily: "manrope" }}>
              <li>
                <button
                  className={`flex cursor-pointer items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${active === "Chat" ? "bg-gray-700" : "hover:bg-gray-800"
                    }`}
                  onClick={() => handleNavigation("Chat")}
                >
                  <FaLaptopCode className="w-8 h-8" />
                  {(!isCollapsed || isMobileNavVisible) && (
                    <span className="text-base font-semibold">Chat</span>
                  )}
                </button>
              </li>
              <li>
                <button
                  className={`flex cursor-pointer items-center w-full px-3 gap-2 py-2 rounded-lg text-sm transition-colors ${active === "Browse Agents"
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                    }`}
                  onClick={() => handleNavigation("Browse Agents")}
                >
                  <FaRobot className="w-8 h-8" />
                  {(!isCollapsed || isMobileNavVisible) && (
                    <span className="text-base font-semibold">
                      Browse Agents
                    </span>
                  )}
                </button>
              </li>
            </ul>
            <hr className="mt-5 h-3"></hr>
            {(!isCollapsed || isMobileNavVisible) && (
              <div className="mt-4 space-y-4">
                <div onClick={isMobileNavVisible ? () => { onMobileNavToggle(); setIsSoon(true) } : () => setIsSoon(true)} className="build-agent block flex items-center justify-between text-gray-400 text-lg font-semibold hover:bg-gray-800 px-2 py-2 rounded-lg">
                  <Link
                    href="#"
                    className="flex flex-row items-center gap-1"
                    style={{ fontFamily: "manrope" }}
                  >
                    Build Agent <HiMiniArrowUpRight />
                  </Link>
                  {/* <div className="soon px-2 py-1 bg-[#fbb042] rounded text-black md:text-sm text-[8px] font-semibold"
                    style={{ fontFamily: "orbitron" }}>
                    SOON
                  </div> */}
                </div>
                <div onClick={isMobileNavVisible ? () => { onMobileNavToggle(); setIsSoon(true) } : () => setIsSoon(true)} className="build-agent block flex items-center justify-between gap-1 text-gray-400 text-lg font-semibold hover:bg-gray-800 px-2 py-2 rounded-lg">
                  <Link
                    href="#"
                    className="flex flex-row items-center"
                    style={{ fontFamily: "manrope" }}
                  >
                    Documentation <HiMiniArrowUpRight />
                  </Link>
                  {/* <div className="soon px-2 py-1 bg-[#fbb042] rounded text-black md:text-sm text-[8px] font-semibold"
                    style={{ fontFamily: "orbitron" }}>
                    SOON
                  </div> */}
                </div>
              </div>
            )}
          </div>

          {/* Connect Wallet Button */}
          <div className="mt-auto">
            <button
              className="w-full py-2 rounded-lg cursor-pointer flex justify-center items-center gap-2 text-sm bg-white text-black font-bold hover:bg-gray-200 transition"
              style={{ fontFamily: "manrope" }}
              onClick={() => !isConnected ? connectWallet() : handleDisconnect()}
            >
              <MdLink className="w-8 h-8" />
              {(!isCollapsed || isMobileNavVisible) && (
                !isConnected ? <span>Connect Wallet</span> : <span>Disconnect</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {isSoon && <div onClick={() => setIsSoon(false)} className={`absolute top-0 bottom-0 right-0 left-0 bg-transparent backdrop-blur-[10px] z-10 flex justify-center items-center ${isCollapsed && !isMobileNavVisible ? "" : " md:pl-[15rem] lg:pl-[16rem]"}`}>
        <div className="center-box w-[22rem] md:w-[24rem] lg:w-[25rem] xl:w-[26rem] min-h-[12rem] md:min-h-[15rem] bg-gray-800 rounded-md">
          <div className="top-close h-[2rem] w-full flex justify-end items-center pr-5 pt-5">
            <div className="clear-chat w-[1.5rem] h-[1.5rem] flex items-center justify-center cursor-pointer" onClick={() => setIsSoon(false)}>
              <InlineSVG
                src="/icons/clear.svg"
                className="fill-current bg-transparent text-gray-700 bg-white rounded-md w-[1.5rem] h-[1.5rem]"
              />
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()} className="inside-box w-full pb-5 md:pb-[1.5rem] md:min-h-[15rem] min-[13rem] flex flex-col items-center justify-center gap-1">
            <div className="flex justify-center items-center">
              <img
                src="images/sonic-logo.png"
                className="md:h-[100px] h-[50px]"
              />
            </div>
            <h2
              className="xxl:text-xl text-white xl:text-lg font-semibold text-md"
              style={{ fontFamily: "orbitron" }}
            >
              SONIC SVM AGENTS
            </h2>
            <p className="text-md text-white">Build your own agents!</p>
            <div className="soon max-w-[10rem] mt-2 text-center px-3 py-1 bg-[#fbb042] rounded text-black md:text-sm text-[8px] font-semibold"
              style={{ fontFamily: "orbitron" }}>
              COMING SOON
            </div>
          </div>
        </div>
      </div>}
    </>
  );
}
