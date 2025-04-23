/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaRobot, FaLaptopCode } from "react-icons/fa6";
import { MdLink } from "react-icons/md";
import { HiMiniArrowUpRight } from "react-icons/hi2";
import { useAccount, useDisconnect } from "wagmi";
import InlineSVG from "react-inlinesvg";
import { usePrivy } from "@privy-io/react-auth";
import { UserPill } from "@privy-io/react-auth/ui";
import { GoGraph } from "react-icons/go";
import { BiTransferAlt } from "react-icons/bi";
import "./Navbar.css"
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
  const [isSoon, setIsSoon] = useState(false);
  // const { isConnected } = useAppKitAccount();
  const { address, isConnected } = useAccount();

  const { disconnect } = useDisconnect();
  
  const {
    ready,
    user,
    authenticated,
    login,
    connectWallet,
    logout,
    linkWallet,
  } = usePrivy();
  console.log("User ---------:", user);

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (pathname === "/browse") return "Browse Agents";
    if (pathname === "/playground") return "Playground";
    if (pathname === "/transactions") return "Transactions"; // ✅ Added this line
    return "Dashboard"; // Default
  };

  const [active, setActive] = useState(getActiveTab);

  useEffect(() => {
    setActive(getActiveTab()); // ✅ Keep this to sync with route
  }, [pathname]);

  const handleNavigation = (page: string) => {
    setActive(page);

    if (page === "Browse Agents") {
      router.push("/browse");
    } else if (page === "Playground") {
      router.push("/playground");
    } else if (page === "Transactions") {
      router.push("/transactions");
    } else if (page === "Integrations") {
      setIsSoon(true); // ✅ Show "coming soon" or similar
    } else {
      router.push("/"); // Default for Dashboard or others
    }
  };

  const disconnectAll = () => {
    logout();
    disconnect();
  }

  useEffect(() => {
    if (user && !address) {
      localStorage.clear()
    }
  }, [user])

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
        className={`fixed md:relative h-screen bg-black bg-opacity-90 text-white p-4 flex-col justify-between border-r border-gray-700 transition-all ${isCollapsed && !isMobileNavVisible
            ? "w-20"
            : "w-[14rem] md:w-[15rem] lg:w-[16rem]"
          } ${isMobileNavVisible ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 z-50`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Menu Items */}
          <div>
            {/* Logo */}

            <div
              className="flex items-center space-x-2 font-semibold cursor-pointer"
              onClick={() => (window.location.href = "/")}
            >
              <img
                src="images/logo.png"
                className="h-10 w-10 object-cover rounded-full"
              />
              {(!isCollapsed || isMobileNavVisible) && (
                <span
                  className="text-white text-2xl"
                  style={{ fontFamily: "orbitron" }}
                >
                  AGENTIFY
                </span>
              )}
            </div>

            {/* Menu Items */}
            <ul className="mt-6 space-y-2" style={{ fontFamily: "manrope" }}>
              <li>
                <Link href={"/"}
                  className={`flex cursor-pointer items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${active === "Dashboard" ? "bg-gray-700" : "hover:bg-gray-800"
                    }`}
                  // onClick={() => handleNavigation("Dashboard")}
                >
                  <GoGraph className="w-7 h-7" />
                  {(!isCollapsed || isMobileNavVisible) && (
                    <span className="text-base font-semibold">Dashboard</span>
                  )}
                </Link>
              </li>
              <li>
                <Link href={"/playground"}
                  className={`flex cursor-pointer items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${active === "Playground"
                      ? "bg-gray-700"
                      : "hover:bg-gray-800"
                    }`}
                  // onClick={() => handleNavigation("Playground")}
                >
                  <FaLaptopCode className="w-8 h-8" />
                  {(!isCollapsed || isMobileNavVisible) && (
                    <span className="text-base font-semibold">Playground</span>
                  )}
                </Link>
              </li>
              <li>
                <button
                  className="flex cursor-pointer items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-800"
                  onClick={() => handleNavigation("Integrations")}
                >
                  <GoGraph className="w-7 h-7" />
                  {(!isCollapsed || isMobileNavVisible) && (
                    <span className="text-base font-semibold">
                      Integrations
                    </span>
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

              <li>
                <button
                  className={`flex cursor-pointer items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${active === "Transactions"
                      ? "bg-gray-700"
                      : "hover:bg-gray-800"
                    }`}
                  onClick={() => handleNavigation("Transactions")}
                >
                  <BiTransferAlt className="w-7 h-7" />
                  {(!isCollapsed || isMobileNavVisible) && (
                    <span className="text-base font-semibold">
                      Transactions
                    </span>
                  )}
                </button>
              </li>
            </ul>
            <hr className="mt-5 h-3"></hr>
            {(!isCollapsed || isMobileNavVisible) && (
              <div className="mt-4 space-y-4">
                <div
                  onClick={
                    isMobileNavVisible
                      ? () => {
                        onMobileNavToggle();
                        setIsSoon(true);
                      }
                      : () => setIsSoon(true)
                  }
                  className="build-agent block flex items-center justify-between text-gray-400 text-lg font-semibold hover:bg-gray-800 px-2 py-2 rounded-lg"
                >
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
                <div
                  onClick={
                    isMobileNavVisible
                      ? () => {
                        onMobileNavToggle();
                        setIsSoon(true);
                      }
                      : () => setIsSoon(true)
                  }
                  className="build-agent block flex items-center justify-between gap-1 text-gray-400 text-lg font-semibold hover:bg-gray-800 px-2 py-2 rounded-lg"
                >
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

          {/* <p>{address}</p> */}

          {/* Connect Wallet Button */}
          <div className="mt-auto">
            {!isConnected || !user ? (
              <div
                className="button-holder relative w-full h-[3rem] mt-4 flex items-center justify-center gap-2 cursor-pointer"
                onClick={() => { !user ? login() : connectWallet() }}
              >
                <MdLink className="w-8 h-8" />
                {(!isCollapsed || isMobileNavVisible) && (
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-white font-medium"
                      style={{ fontFamily: "manrope" }}
                    >
                      Connect Wallet
                    </h2>
                  </div>
                )}
                <div className="absolute top-0 left-0 right-0 bottom-0">
                  <img
                    src="/images/button-border.png"
                    alt="agy"
                    className={`w-full h-full ${!isCollapsed || isMobileNavVisible
                        ? "object-contain"
                        : "object-cover"
                      }`}
                  />
                </div>
              </div>
            ) : user?.google?.email ? (
              <UserPill />
            ) : (
              <div
                className="button-holder relative w-full h-[3rem] mt-4 flex items-center justify-center gap-2 cursor-pointer"
                onClick={disconnectAll}
              >
                <MdLink className="w-8 h-8" />
                {(!isCollapsed || isMobileNavVisible) && (
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-white font-medium"
                      style={{ fontFamily: "manrope" }}
                    >
                      Disconnect Wallet
                    </h2>
                  </div>
                )}
                <div className="absolute top-0 left-0 right-0 bottom-0">
                  <img
                    src="/images/button-border.png"
                    alt="agy"
                    className={`w-full h-full ${!isCollapsed || isMobileNavVisible
                        ? "object-contain"
                        : "object-cover"
                      }`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-0 left-0 right-0 h-[20rem] z-[-1]">
          <div className="img-holder w-full h-full">
            <img
              src="images/left-top-circle.png"
              alt="agy"
              className="w-full h-full"
            />
          </div>
        </div>
      </nav>

      {isSoon && (
        <div
          onClick={() => setIsSoon(false)}
          className={`absolute top-0 bottom-0 right-0 left-0 bg-transparent backdrop-blur-[10px] z-10 flex justify-center items-center ${isCollapsed && !isMobileNavVisible
              ? ""
              : " md:pl-[15rem] lg:pl-[16rem]"
            }`}
        >
          <div className="center-box w-[22rem] md:w-[24rem] lg:w-[25rem] xl:w-[26rem] min-h-[12rem] md:min-h-[15rem] bg-gray-800 rounded-md">
            <div className="top-close h-[2rem] w-full flex justify-end items-center pr-5 pt-5">
              <div
                className="clear-chat w-[1.5rem] h-[1.5rem] flex items-center justify-center cursor-pointer"
                onClick={() => setIsSoon(false)}
              >
                <InlineSVG
                  src="/icons/clear.svg"
                  className="fill-current bg-transparent text-gray-700 bg-white rounded-md w-[1.5rem] h-[1.5rem]"
                />
              </div>
            </div>
            <div
              onClick={(e) => e.stopPropagation()}
              className="inside-box w-full pb-5 md:pb-[1.5rem] md:min-h-[15rem] min-[13rem] flex flex-col items-center justify-center gap-1"
            >
              <div className="flex justify-center items-center">
                <img src="images/logo.png" className="h-20 w-20" />
              </div>
              <h2
                className="xxl:text-xl text-white xl:text-lg font-semibold text-md"
                style={{ fontFamily: "orbitron" }}
              >
                AGENTIFY AGENTS
              </h2>
              <p className="text-md text-white">Build your own agents!</p>
              <div
                className="soon max-w-[10rem] mt-2 text-center px-3 py-1 rounded text-black md:text-sm text-[8px] font-semibold"
                style={{ fontFamily: "orbitron" }}
              >
                COMING SOON
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
