"use client";
import InlineSVG from "react-inlinesvg";
import "./UserDashboard.css";
import { useEffect, useState } from "react";
import { GraphChart } from "./Charts/GraphChart";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import useFetchStatistics from "@/hooks/useFetchSatistics";
import useFetchAgents from "@/hooks/useFetchAgents";
import useFetchDashboardStats from "@/hooks/useFetchAgentStats";
import { usePrivy } from "@privy-io/react-auth";
const year = new Date().getFullYear();
console.log("year", year);

const filters = [
  {
    type: "trade",
    count: 3,
  },
  {
    type: "nft",
    count: 3,
  },
  {
    type: "defi",
    count: 3,
  },
];

export default function UserDashboard2({
  onToggle,
  onMobileNavToggle,
}: {
  onToggle: () => void;
  onMobileNavToggle: () => void;
}) {
  const { address, isConnected } = useAccount();
  const [showModal, setShowModal] = useState(true);

  const {
    statisticsData,
    loading: statsLoading,
    fetchStatistics,
  } = useFetchStatistics();
  const {
    agentsData,
    error: agentsError,
    fetchAgents,
    totalPages,
  } = useFetchAgents();
  console.log("total __________________________________", totalPages);

  const {
    ready,
    authenticated,
    login,
    connectWallet,
    logout,
    linkWallet,
    user,
  } = usePrivy();
  const {
    dashboardStats,
    loading: dashboardLoading,
    error: dashboardError,
    fetchDashboardStats,
  } = useFetchDashboardStats();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentStatsMap, setAgentStatsMap] = useState<Record<string, any>>({});
  const [activeFilter, setActiveFilter] = useState("defi");
  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);

      return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
  }
  const debouncedSearch = useDebounce(searchQuery, 300);
  useEffect(() => {
    fetchStatistics();
  }, []);
  useEffect(() => {
    if (address) {
      const skip = (currentPage - 1) * 2;
      fetchAgents({
        userId: address,
        skip,
        limit: 2,
        searchQuery: debouncedSearch,
        isFavourite: false,
        filter: activeFilter.toUpperCase(), // since your API uses uppercase
      });
    }
  }, [address, currentPage, debouncedSearch, activeFilter]);

  // Fetch dashboard stats when agentsData changes
  useEffect(() => {
    const fetchAllStats = async () => {
      console.log("before ..............");
      if (address) {
        const statsMap: Record<string, any> = {};
        console.log("Address......", address);

        console.log("Entered ..............");

        for (const agent of agentsData) {
          const stats = await fetchDashboardStats(agent.agentId, address);
          console.log("Dashboard stats for", agent.agentId, stats);

          // If stats is an array, find the one matching this agent
          if (Array.isArray(stats)) {
            const matchedStat = stats.find((s) => s.agent_id === agent.agentId);
            if (matchedStat) {
              statsMap[agent.agentId] = matchedStat;
            }
          }
        }

        setAgentStatsMap(statsMap);
      }
    };

    fetchAllStats();
  }, [agentsData, address]);

  const router = useRouter();

  const handleClick = () => {
    console.log("Clicked");
    router.push("/playground");
  };

  return (
    <div className="w-full flex flex-col items-center h-screen bg-black text-white">
      <div
        className="bg-gray-900 p-4 flex items-center md:gap-5 gap-3 w-full"
        style={{ fontFamily: "orbitron" }}
      >
        <button
          onClick={() => {
            onToggle(); // Always toggle collapse state
            if (window.innerWidth < 768) {
              onMobileNavToggle(); // Only toggle mobile nav visibility on mobile screens
            }
          }}
          className="focus:outline-none"
        >
          <InlineSVG
            src="icons/Toggle.svg"
            className="w-5 h-5 cursor-pointer"
          />
        </button>
        <div className="xxl:text-lg xl:text-base text-gray-400 font-semibold">
          ACCOUNT
        </div>
        {/* <MdKeyboardArrowRight className="w-6 h-6" />
                <div className="text-white text-xs">VEJAS6QK0U1BTPQK</div> */}
      </div>

      <div className="w-full h-[95%] flex flex-col items-center overflow-x-hidden scroll-d">
        <div className="top-dashboard w-[96%] h-[10rem] grid grid-cols-3 gap-2 md:gap-4 bg-black p-0 md:p-4 m-3 md:m-4 xl:m-5 rounded-lg md:border border-gray-700">
          {/* AGENTS */}
          <div className="analytics-box p-3 bg-[#0c1a27] rounded-lg border border-gray-700 flex flex-col justify-between items-center gap-2 md:gap-0">
            <h2
              className="text-xs xxl:text-lg xl:text-base text-gray-400 font-semibold"
              style={{ fontFamily: "orbitron" }}
            >
              AGENTS
            </h2>
            <h2 className="text-white font-medium text-2xl">
              {statsLoading ? "..." : statisticsData?.totalAgents ?? 0}
            </h2>
            {/* <div className="bottom-anal w-full flex justify-center md:justify-end">
          <h2 className="text-sm">
            <span className="text-green-500 text-md">+2</span> /month
          </h2>
        </div> */}
          </div>

          {/* TRANSACTIONS */}
          <div className="analytics-box p-3 bg-[#0c1a27] rounded-lg border border-gray-700 flex flex-col justify-between items-center">
            <h2
              className="text-xs xxl:text-lg xl:text-base text-gray-400 font-semibold"
              style={{ fontFamily: "orbitron" }}
            >
              TRANSACTIONS
            </h2>
            <h2 className="text-white font-medium text-2xl">
              {statsLoading ? "..." : statisticsData?.totalTransactions ?? 0}
            </h2>
            {/* <div className="bottom-anal w-full flex justify-end">
          <h2 className="text-sm">
            <span className="text-green-500 text-md">+10</span> /month
          </h2>
        </div> */}
          </div>

          {/* USERS */}
          <div className="analytics-box p-3 bg-[#0c1a27] rounded-lg border border-gray-700 flex flex-col justify-between items-center">
            <h2
              className="text-xs xxl:text-lg xl:text-base text-gray-400 font-semibold"
              style={{ fontFamily: "orbitron" }}
            >
              USERS
            </h2>
            <h2 className="text-white font-medium text-2xl">
              {statsLoading ? "..." : statisticsData?.totalUsers ?? 0}
            </h2>
            {/* <div className="bottom-anal w-full flex justify-end">
          <h2 className="text-sm">
            <span className="text-green-500 text-md">+28</span> /month
          </h2>
        </div> */}
          </div>
        </div>

        <div className="bottom-dashboard w-[96%]">
          <div className="top-filters-box w-full flex flex-col md:flex-row justify-between gap-4 mb-2">
            <div className="relative w-full flex items-center">
              <FaSearch className="absolute left-3 text-gray-400 xxl:text-lg xl:text-base" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 pl-10 bg-gray-800 text-white rounded placeholder:font-manrope placeholder:text-base placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <div className="filters p-2 rounded-lg flex items-center gap-2">
              {filters?.map((filter) => (
                <div
                  key={filter.type}
                  className={`filter px-2 py-1 rounded-lg border border-gray-700 cursor-pointer ${
                    activeFilter === filter.type ? "active-filter" : ""
                  }`}
                  onClick={() => setActiveFilter(filter.type)}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      activeFilter === filter.type
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {filter.type.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="botom-agent-analytics w-full">
            {agentsData && agentsData.length > 0 ? (
              <div className="features-boxes grid grid-cols-1 md:grid-cols-2 gap-3 w-full md:min-h-[12rem] lg:min-h-[13rem] xl:min-h-[16rem] md:gap-[0.6rem] lg:gap-[0.8rem] xl:gap-[1rem] mt-5">
                {agentsData.map((anals, index) => {
                  const stat = agentStatsMap[anals.agentId]; // Get the correct stat

                  return (
                    <div
                      key={anals.agentId}
                      className="whole-div flex flex-col p-2 md:flex-row items-start md:items-stretch gap-4 w-full min-h-[14rem]"
                    >
                      <div
                        className={`relative feature-box-holder p-[25px] w-full md:w-[60%] lg:w-[55%] xl:w-[55%] ${
                          true ? "active mb-6" : ""
                        }`}
                      >
                        <h2 className="feature-box-title text-white text-[1rem] md:text-[1.1rem] lg:text-[1.2rem] xl:text-[1.3rem] leading-tight font-clash font-semibold">
                          {anals.agentId
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str: string) => str.toUpperCase())}
                        </h2>

                        <p className="text-xs md:text-xs lg:text-sm xl:text-sm text-white mt-2 truncate-2-lines">
                          {anals.description}
                        </p>

                        {stat?.total_transaction === 0 &&
                        stat?.successful === 0 &&
                        stat?.failed === 0 &&
                        (!stat?.popular || stat?.popular === "N/A") ? (
                          <div className="flex justify-center items-center mt-4">
                            <p className="text-sm text-gray-400 italic">
                              No transaction data available.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 mt-4 text-white text-sm">
                            <div>
                              <span className="font-semibold">
                                Transactions:
                              </span>{" "}
                              {stat?.total_transaction ?? 0}
                            </div>
                            <div>
                              <span className="font-semibold">Popular:</span>{" "}
                              {stat?.popular ?? ""}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/40 text-green-300 text-xs">
                                ✅ Successful: {stat?.successful ?? 0}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-900/40 text-red-300 text-xs">
                                ❌ Failed: {stat?.failed ?? 0}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="anals-actions grid grid-cols-2 gap-2">
                          <div
                            className="button-holder active-filter relative border border-gray-700 h-[2.5rem] mt-4 flex items-center justify-center cursor-pointer"
                            onClick={handleClick}
                          >
                            <h2
                              className="text-white font-medium text-sm"
                              style={{ fontFamily: "manrope" }}
                            >
                              Chat
                            </h2>
                          </div>
                          <div
                            className="button-holder relative border border-gray-700 hover:border-gray-500 transition-colors duration-300 ease-in-out h-[2.5rem] mt-4 flex items-center justify-center cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/${anals._id}?agentName=${anals.agentName}`
                              )
                            }
                          >
                            <h2
                              className="text-white font-medium text-sm"
                              style={{ fontFamily: "manrope" }}
                            >
                              Transactions
                            </h2>
                          </div>
                        </div>

                        <div className="box-bg absolute top-0 left-0 right-0 bottom-0 z-[-1]">
                          <img
                            src="/images/features/feture-box.png"
                            alt="feature-box"
                            className={`w-full h-full bg-layout ${
                              true ? "active -scale-x-100" : ""
                            }`}
                          />
                        </div>

                        {true && (
                          <div className="box-bg absolute top-0 left-0 right-0 bottom-0 z-[-1]">
                            <img
                              src="/images/features/card-right-overlay.png"
                              alt=""
                              className="w-full h-full"
                            />
                          </div>
                        )}
                      </div>

                      <div className="graph-view w-full md:w-[40%] lg:w-[45%] xl:w-[45%] min-h-[200px] flex items-center justify-center">
                        <GraphChart
                          userId={address || ""}
                          agentId={anals.agentId}
                          year={year}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-results grid place-items-center w-full text-center text-gray-400 py-5 mt-[80px]">
                <p>No results found for your search/filter</p>
              </div>
            )}
          </div>

          {totalPages > 1 && agentsData.length > 0 && (
            <div className="pagination-block flex justify-center items-center gap-3 my-5 pb-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`${
                  currentPage === 1
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-white hover:text-blue-400"
                }`}
              >
                &larr; previous
              </button>

              <div className="numbers flex justify-center items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Calculate page number based on current page position
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        pageNum === currentPage
                          ? "active-filter text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="text-gray-400">...</span>
                )}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    {totalPages}
                  </button>
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`${
                  currentPage === totalPages
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-white hover:text-blue-400"
                }`}
              >
                next &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
      {!isConnected && showModal && !user && (
        <div
          onClick={() => setShowModal(false)}
          className="absolute inset-0 bg-transparent backdrop-blur-[10px] z-10 flex justify-center items-center"
        >
          <div className="w-[22rem] md:w-[24rem] lg:w-[25rem] xl:w-[26rem] min-h-[12rem] md:min-h-[15rem] bg-gray-800 rounded-md">
            <div className="h-[2rem] w-full flex justify-end items-center pr-5 pt-5">
              <div
                className="w-[1.5rem] h-[1.5rem] flex items-center justify-center cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                <InlineSVG
                  src="/icons/clear.svg"
                  className="fill-current text-gray-700 bg-white rounded-md w-[1.5rem] h-[1.5rem]"
                />
              </div>
            </div>
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full pb-5 md:pb-[1.5rem] flex flex-col items-center justify-center gap-4"
            >
              <div className="flex justify-center items-center">
                <img src="images/logo.png" className="h-20 w-20" />
              </div>
              <h2
                className="text-white text-lg md:text-xl font-semibold"
                style={{ fontFamily: "orbitron" }}
              >
                AGENTIFY AGENTS
              </h2>
              <button
                className="mt-2 px-4 py-2 active-filter text-white rounded-md font-semibold cursor-pointer"
                onClick={() => {
                  login(); // Replace with your wallet connection logic
                  setShowModal(false);
                }}
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
