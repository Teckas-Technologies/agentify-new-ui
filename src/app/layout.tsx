import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";

import { CustomWagmiProvider } from "@/contexts/CustomWagmiProvider";
import { ToastProvider } from "@/Components/ui/toast";
import { Toaster } from "@/Components/ui/toaster";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { SidebarProvider } from "@/Components/ui/sidebar";
import { suppressRecoveryErrors } from "@/utils/privyErrorHandler";
import { WalletConnectionWrapper } from "@/Components/WalletConnectionWrapper";
import "@/utils/forceCleanPrivySession"; // Import to execute cleanup

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
  description:
    "We are providing specialized agents for bridging, swapping, adding, or closing liquidity between the Ethereum chains",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Aggressive error suppression and session cleanup
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.message && event.reason.message.includes('Recovery method not supported')) {
                  console.warn('Suppressed Privy recovery error:', event.reason.message);
                  event.preventDefault();
                  
                  // Force cleanup when recovery error occurs
                  setTimeout(() => {
                    try {
                      Object.keys(localStorage).forEach(key => {
                        if (key.includes('privy') || key.includes('recovery') || key.includes('embedded')) {
                          localStorage.removeItem(key);
                        }
                      });
                    } catch (e) {}
                  }, 100);
                }
              });
              
              // Override any Privy recovery methods
              window.addEventListener('error', function(event) {
                if (event.message && event.message.includes('Recovery method not supported')) {
                  event.preventDefault();
                  return true;
                }
              });
            `,
          }}
        />
        <Toaster />
        <CustomWagmiProvider>
          <WalletConnectionWrapper>
            <ConversationProvider>{children}</ConversationProvider>
          </WalletConnectionWrapper>
        </CustomWagmiProvider>
      </body>
    </html>
  );
}
