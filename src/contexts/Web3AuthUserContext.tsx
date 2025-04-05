// context/Web3AuthUserContext.tsx
'use client'
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getWeb3AuthInstance } from "./Web3authContext";


export interface UserInfo {
  appState?: string;
  email?: string;
  aggregateVerifier?: string;
  name?: string;
  profileImage?: string;
  typeOfLogin?: string;
  verifier?: string;
  verifierId?: string;
  dappShare?: string;
  oAuthIdToken?: string;
  oAuthAccessToken?: string;
  isMfaEnabled?: boolean;
  idToken?: string;
}

const Web3AuthUserContext = createContext<UserInfo | null>(null);

export const useWeb3AuthUser = () => useContext(Web3AuthUserContext);

export const Web3AuthUserProvider = ({ children }: { children: React.ReactNode }) => {
  const { isConnected } = useAccount();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const web3auth = getWeb3AuthInstance();
        if (isConnected && web3auth?.status === "connected") {
          const info = await web3auth.getUserInfo();
          setUserInfo(info);
        } else {
          setUserInfo(null);
        }
      } catch (err) {
        console.error("Failed to fetch Web3Auth user info:", err);
        setUserInfo(null);
      }
    };

    fetchUserInfo();
  }, [isConnected]);

  return (
    <Web3AuthUserContext.Provider value={userInfo}>
      {children}
    </Web3AuthUserContext.Provider>
  );
};
