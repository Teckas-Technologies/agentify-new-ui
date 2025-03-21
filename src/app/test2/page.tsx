"use client";

import React, { useState } from "react";
import { EthereumTransactionTypeExtended, Pool } from "@aave/contract-helpers";
import * as markets from "@bgd-labs/aave-address-book";
import { BigNumber, ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";

// import { useScaffoldContractRead } from "~~/hooks/scaffold-eth/useScaffoldContractRead";

const Test2: NextPage = () => {
    const tokens = Object.keys(markets.AaveV3Sepolia.ASSETS);

    const GHO_SEPOLIA = markets.AaveV3Sepolia.ASSETS.GHO.UNDERLYING;
    const DAI_SEPOLIA = markets.AaveV3Sepolia.ASSETS.DAI.UNDERLYING;
    const USDC_SEPOLIA = markets.AaveV3Sepolia.ASSETS.USDC.UNDERLYING;
    const USDT_SEPOLIA = markets.AaveV3Sepolia.ASSETS.USDT.UNDERLYING;
    const LINK_SEPOLIA = markets.AaveV3Sepolia.ASSETS.LINK.UNDERLYING;
    const WBTC_SEPOLIA = markets.AaveV3Sepolia.ASSETS.WBTC.UNDERLYING;
    const WETH_SEPOLIA = markets.AaveV3Sepolia.ASSETS.WETH.UNDERLYING;
    const EURS_SEPOLIA = markets.AaveV3Sepolia.ASSETS.EURS.UNDERLYING;
    const AAVE_SEPOLIA = markets.AaveV3Sepolia.ASSETS.AAVE.UNDERLYING;

    const USDC_MAINNET = markets.AaveV3Ethereum.ASSETS.USDC.UNDERLYING

    type ReserveType = {
        [key: string]: string;
    };

    const nameToReserve: ReserveType = {
        GHO: GHO_SEPOLIA,
        DAI: DAI_SEPOLIA,
        USDC: USDC_SEPOLIA,
        USDT: USDT_SEPOLIA,
        LINK: LINK_SEPOLIA,
        WBTC: WBTC_SEPOLIA,
        WETH: WETH_SEPOLIA,
        EURS: EURS_SEPOLIA,
        AAVE: AAVE_SEPOLIA,
    };

    const AAVE_POOL_SEPOLIA = markets.AaveV3Sepolia.POOL;
    const WETH_GATEWAY_SEPOLIA = markets.AaveV3Sepolia.WETH_GATEWAY;

    const DEADLINE = Math.floor(Date.now() / 1000 + 86400).toString();

    const { address: connectedAddress } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const { open } = useAppKit();
    const { disconnect } = useDisconnect();

    const handleConnectWallet = () => {
        open({ view: 'Connect' });
    }

    const handleDisconnect = () => {
        disconnect();
    }

    console.log("walletClient", walletClient)

    const handleViewAccount = () => {
        open({ view: 'Account' });
    }
    // const { targetNetwork } = useTargetNetwork();

    const [fromInputValue, setFromInputValue] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [inputSelectedToken, setInputSelectedToken] = useState("USDC");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFromInputValue(e.target.value);
    };

    const handleInputToggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleInputSelectToken = (option: string) => {
        setInputSelectedToken(option);
        setIsDropdownOpen(false);
    };

    // async function submitTransaction({ signer, tx }: { signer: ethers.Signer; tx: EthereumTransactionTypeExtended }) {
    //     console.log(tx);
    //     const extendedTxData = await tx.tx();
    //     console.log(tx, extendedTxData);
    //     const { from, ...txData } = extendedTxData;
    //     // const signer = provider.getSigner(from);
    //     console.log("From: ", from);
    //     console.log("TX:", tx)
    //     const txResponse = await signer.sendTransaction({
    //         ...txData,
    //         value: 0, // txData.value ? ethers.BigNumber.from(txData.value) : undefined
    //         // gasLimit: txData.gasLimit ?  txData.gasLimit.add(ethers.BigNumber.from(100000))  : ethers.BigNumber.from(800000)
    //     });
    //     return txResponse;
    // }
    async function submitTransaction({ provider, tx }: { provider: any; tx: EthereumTransactionTypeExtended }) {
        console.log(tx);
        const extendedTxData = await tx.tx();
        console.log(tx, extendedTxData);
        const { from, ...txData } = extendedTxData;
        // const signer = provider.getSigner(from);
        console.log("From: ", from);
        const txResponse = await provider.sendTransaction({
            ...txData,
            value: 0,
        });
        return txResponse;
    }

    async function approveAndSign({
        pool,
        provider,
        address,
        asset,
        amount,
    }: {
        pool: any;
        provider: ethers.providers.Web3Provider;
        address: string;
        asset: string;
        amount: string;
    }) {
        const dataToSign = await pool.signERC20Approval({
            user: address,
            reserve: asset,
            amount: amount,
            deadline: DEADLINE,
        });

        console.log(dataToSign);

        const signature = await provider.send("eth_signTypedData_v4", [address, dataToSign]);

        console.log(signature);

        return signature;
    }

    const supplyWithPermit = async () => { // address?: string, asset?: string, amount?: string
        // const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        // const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        // const signer = provider.getSigner();
        const provider = new ethers.providers.Web3Provider(
            walletProvider as ethers.providers.ExternalProvider,
        );

        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();

        const pool = new Pool(provider, {
            POOL: AAVE_POOL_SEPOLIA,
            WETH_GATEWAY: WETH_GATEWAY_SEPOLIA,
        });

        console.log(provider);
        console.log(pool);
        console.log(signer);
        if (!signerAddress) {
            console.log("No signer address")
            return;
        }

        const signature = await approveAndSign({
            pool: pool,
            provider: provider,
            address: "0xFf43E33C40276FEEff426C5448cF3AD9df6b5741",
            asset: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            amount: "1",
        });

        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        await wait(5000);
        console.log("done");

        const txs: EthereumTransactionTypeExtended[] = await pool.supplyWithPermit({
            user: "0xFf43E33C40276FEEff426C5448cF3AD9df6b5741",
            reserve: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            amount: "1",
            signature: signature,
            onBehalfOf: "0xFf43E33C40276FEEff426C5448cF3AD9df6b5741",
            deadline: DEADLINE,
        });

        console.log("SUPPLY WITH:", txs)

        const txResponse = await submitTransaction({ provider: provider, tx: txs[0] });
        console.log(txResponse);
    };

    return (
        <>
            <div className="flex items-center flex-col flex-grow">
                <div className="header w-full bg-black h-[6rem] flex items-center justify-between px-[4rem]">
                    <h2 className="text-white">Agentify</h2>
                    <div className="btns flex items-center gap-4">
                        {isConnected && <h4 className="text-white">{connectedAddress}</h4>}
                        {!isConnected && <button className="px-6 py-2 rounded-md bg-green-300 text-white" onClick={handleConnectWallet}>Connect Wallet</button>}
                        {isConnected && <button className="px-6 py-2 rounded-md bg-red-300 text-white" onClick={handleViewAccount}>View Account</button>}
                    </div>
                </div>
                <div className="px-5">
                    <h1 className="text-center">
                        <span className="block text-7xl mb-6 mt-32 font-bold">TinyRaise</span>
                        <p className="mb-20">Bootstrap liquidity from your followers, completely gaslessly!</p>
                    </h1>
                </div>

                <div className="flex items-center mb-1 ">
                    <div className="flex-none w-2/1 mr-4">
                        <input
                            type="text"
                            value={fromInputValue}
                            onChange={handleInputChange}
                            placeholder="Amount"
                            style={{
                                border: "2px solid black",
                                padding: "8px",
                                borderRadius: "10px",
                                width: "100%",
                            }}
                        />
                    </div>
                    <div className="dropdown dropdown-bottom w-2/6 flex-none z-10 relative">
                        <label
                            tabIndex={0}
                            className="btn btn-neutral btn-md dropdown-toggle gap-1"
                            onClick={handleInputToggleDropdown}
                        >
                            <span>{inputSelectedToken}</span>
                        </label>
                        {isDropdownOpen && (
                            <ul
                                tabIndex={0}
                                className="dropdown-content menu p-2 mt-1 shadow-center shadow-accent bg-base-200 rounded-box gap-1 absolute"
                                style={{ maxHeight: "200px", overflowY: "auto", left: 0, right: 0, zIndex: 10 }}
                            >
                                {tokens.map((option: string) => (
                                    <li key={option}>
                                        <button
                                            className="btn-sm !rounded-xl flex py-3 gap-6"
                                            type="button"
                                            onClick={() => handleInputSelectToken(option)}
                                        >
                                            {option}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <button
                    className="btn btn-primary w-1/6 mt-5"
                    onClick={supplyWithPermit}>
                    Contribute
                </button>
                {/* <button
                    className="btn btn-primary w-1/6 mt-5"
                    onClick={() =>
                        supplyWithPermit(
                            connectedAddress || "",
                            nameToReserve[inputSelectedToken],
                            fromInputValue,
                        )
                    }
                >
                    Contribute
                </button> */}
            </div>
        </>
    );
};

export default Test2;