"use client";
import InlineSVG from "react-inlinesvg";
import "./UserDashboard.css"
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useRouter } from 'next/router';
const dummyAnalytics = [
    {
        _id: 1,
        agentName: "Swap Agent",
        description: "Assistant for helping users to swap tokens in the EVM chains.",
        interactions: 39,
        transactions: 3,
        successfulTx: 3,
        failedTx: 0
    },
    {
        _id: 2,
        agentName: "Bridge Agent",
        description: "Assistant for helping users to bridge tokens between the EVM chains.",
        interactions: 53,
        transactions: 2,
        successfulTx: 1,
        failedTx: 1
    },
    {
        _id: 3,
        agentName: "Lending Agent",
        description: "Assistant for helping users to lend & withdraw the tokens in EVM chains.",
        interactions: 25,
        transactions: 1,
        successfulTx: 1,
        failedTx: 0
    },
    {
        _id: 4,
        agentName: "Borrow Agent",
        description: "Assistant for helping users to borrow & repay the tokens in EVM chains.",
        interactions: 41,
        transactions: 3,
        successfulTx: 3,
        failedTx: 0
    }
]

const filters = [
    {
        type: "trade",
        count: 3
    },
    {
        type: "nft",
        count: 3
    },
    {
        type: "defi",
        count: 3
    }
]

export default function UserDashboard({
    onToggle,
    onMobileNavToggle,
}: {
    onToggle: () => void;
    onMobileNavToggle: () => void;
}) {

    const [activeFilter, setActiveFilter] = useState("trade");
    const router = useRouter();
    const handleClick = () => {
        console.log("Clicked");
        router.push('/');
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
                    <div className="analytics-box p-3 bg-[#0c1a27] rounded-lg border border-gray-700 flex flex-col justify-between items-center gap-2 md:gap-0">
                        <h2 className="text-xs xxl:text-lg xl:text-base text-gray-400 font-semibold" style={{ fontFamily: "orbitron" }}>AGENTS</h2>
                        <h2 className="text-white font-medium text-2xl">23</h2>
                        <div className="bottom-anal w-full flex justify-center md:justify-end">
                            <h2 className="text-sm"><span className="text-green-500 text-md">+2</span> /month</h2>
                        </div>
                    </div>

                    <div className="analytics-box p-3 bg-[#0c1a27] rounded-lg border border-gray-700 flex flex-col justify-between items-center">
                        <h2 className="text-xs xxl:text-lg xl:text-base text-gray-400 font-semibold" style={{ fontFamily: "orbitron" }}>TRANSACTIONS</h2>
                        <h2 className="text-white font-medium text-2xl">150K+</h2>
                        <div className="bottom-anal w-full flex justify-end">
                            <h2 className="text-sm"><span className="text-green-500 text-md">+10K</span> /month</h2>
                        </div>
                    </div>

                    <div className="analytics-box p-3 bg-[#0c1a27] rounded-lg border border-gray-700 flex flex-col justify-between items-center">
                        <h2 className="text-xs xxl:text-lg xl:text-base text-gray-400 font-semibold" style={{ fontFamily: "orbitron" }}>USERS</h2>
                        <h2 className="text-white font-medium text-2xl">374</h2>
                        <div className="bottom-anal w-full flex justify-end">
                            <h2 className="text-sm"><span className="text-green-500 text-md">+28</span> /month</h2>
                        </div>
                    </div>
                </div>

                <div className="bottom-dashboard w-[96%]">
                    <div className="top-filters-box w-full flex justify-between gap-4 mb-2">
                        <div className="relative w-full flex items-center">
                            <FaSearch className="absolute left-3 text-gray-400 xxl:text-lg xl:text-base" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full p-2 pl-10 bg-gray-800 text-white rounded placeholder:font-manrope placeholder:text-base placeholder:text-gray-400 focus:outline-none"
                                style={{ fontFamily: "manrope" }}
                            />
                        </div>
                        <div className="filters p-2 rounded-lg flex items-center gap-2">
                            {filters?.map((filter) => (
                                <div
                                    key={filter.type}
                                    className={`filter px-2 py-1 rounded-lg border border-gray-700 cursor-pointer ${activeFilter === filter.type ? "active-filter" : ""
                                        }`}
                                    onClick={() => setActiveFilter(filter.type)}
                                >
                                    <div className={`flex items-center gap-1 ${activeFilter === filter.type ? "text-white" : "text-gray-400"}`}>
                                        {filter.type === "trade"
                                            ? "Trading"
                                            : filter.type === "nft"
                                                ? "NFT"
                                                : "DeFi"}
                                        <div className={"bg-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs"}>{filter.count}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="botom-agent-analytics w-full">
                        <div className="features-boxes grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full md:min-h-[12rem] lg:min-h-[13rem] xl:min-h-[16rem] md:gap-[0.6rem] lg:gap-[0.8rem] xl:gap-[1rem] mt-5">
                            {dummyAnalytics.slice(0, 4).map((anals, index) => (
                                <div key={anals.agentName} className={`relative feature-box-holder p-[1.4rem] ${true ? "active mx-3 w-[91%] mb-6" : ""}`}>
                                    {/* <div className={`top-icon-holder w-full flex justify-end items-center md:h-[3.4rem] lg:h-[3.7rem] xl:h-[4rem] ${(anals._id === 4 || anals._id === 3) && "md:pr-[0.6rem] lg:pr-[0.8rem] xl:pr-[1rem]"}`}>
                                        <div className={`feature-top-icon ${anals._id === 4 ? "md:w-[2.4rem] md:h-[2.4rem] lg:w-[2.7rem] lg:h-[2.7rem] xl:w-[3rem] xl:h-[3rem]" : anals._id === 3 ? "md:w-[2.9rem] md:h-[2.9rem] lg:w-[3.2rem] lg:h-[3.2rem] xl:w-[3.5rem] xl:h-[3.5rem]" : "md:w-[3.4rem] md:h-[3.4rem] lg:w-[3.7rem] lg:h-[3.7rem] xl:w-[4rem] xl:h-[4rem]"} `}>
                                            <img src="images/logo.png" alt={anals.agentName} className="w-full h-full" />
                                        </div>
                                    </div> */}
                                    <h2 className="feature-box-title text-white md:text-[1.2rem] lg:text-[1.5rem] xl:text-[1.8rem] leading-tight font-clash" dangerouslySetInnerHTML={{ __html: anals.agentName }}></h2>

                                    <p className="md:text-xs lg:text-sm xl:text-md text-white mt-2 truncate-2-lines">{anals.description}</p>
                                    {/* <br /> */}
                                    <p className="md:text-xs lg:text-sm xl:text-md text-white mt-2"><span className="md:text-sm lg:text-md xl:text-lg">Interactions:</span> {anals.interactions}</p>
                                    <p className="md:text-xs lg:text-sm xl:text-md text-white"><span className="md:text-sm lg:text-md xl:text-lg">Transactions:</span> {anals.transactions}</p>
                                    <div className="anals-actions grid grid-cols-2 gap-2">
                                        <div className="button-holder active-filter relative border border-gray-700 h-[2.5rem] mt-4 flex items-center justify-center cursor-pointer" onClick={handleClick}>
                                            <h2 className="text-white font-medium text-sm" style={{ fontFamily: "manrope" }}>Chat</h2>
                                        </div>
                                        <div className="button-holder relative border border-gray-700 hover:border-gray-500 transition-colors duration-300 ease-in-out h-[2.5rem] mt-4 flex items-center justify-center cursor-pointer">
                                            <h2 className="text-white font-medium text-sm" style={{ fontFamily: "manrope" }}>Transactions</h2>
                                        </div>
                                    </div>
                                    <div className="box-bg absolute top-0 left-0 right-0 bottom-0 z-[-1]">
                                        <img src="/images/features/feture-box.png" alt="feature-box" className={`w-full h-full bg-layout ${true ? "active -scale-x-100" : ""}`} /> {/** if active  -scale-x-100 */}
                                    </div>
                                    {true && (
                                        <>
                                            {/* <div className="box-bg absolute top-0 left-0 right-0 bottom-0 z-[-1]">
                                                <img src="/images/features/card-left-overlay.png" alt="" className="w-full h-full" />
                                            </div> */}
                                            <div className="box-bg absolute top-0 left-0 right-0 bottom-0 z-[-1]">
                                                <img src="/images/features/card-right-overlay.png" alt="" className="w-full h-full" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>


                    <div className="pagination-block flex justify-center items-center gap-3 my-5 pb-4">
                        <h2>&larr; previous</h2>
                        <div className="numbers flex justify-center items-center gap-2">
                            <div className="number w-8 h-8 rounded-full flex items-center justify-center active" >
                                <h2>1</h2>
                            </div>
                            <div className="number w-8 h-8 rounded-full flex items-center justify-center">
                                <h2>2</h2>
                            </div>
                            <div className="number w-8 h-8 rounded-full flex items-center justify-center">
                                <h2>3</h2>
                            </div>
                        </div>
                        <h2>next &rarr;</h2>
                    </div>
                </div>

            </div>

        </div>
    );
}
