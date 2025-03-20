import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ContextProvider from "@/contexts/ContextProvider";
import { headers } from "next/headers";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { CustomWagmiProvider } from "@/contexts/LifiProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agentify",
  description: "We are providing specialized agents for bridging, swapping, adding, or closing liquidity between the Ethereum chains",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers(); // Await the headers
  const cookies = headersList.get("cookie");
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <ContextProvider cookies={cookies}>
            <CustomWagmiProvider>
              {children}
            </CustomWagmiProvider>
          </ContextProvider>
        </UserProvider>
      </body>

    </html>
  );
}
