"use client";

import { ReactNode } from "react";
import { CustomWagmiProvider } from "../contexts/CustomWagmiProvider"

export default function ClientLayout({ children }: { children: ReactNode }) {
    return (
        <CustomWagmiProvider>
            {children}
        </CustomWagmiProvider>
    );
}
