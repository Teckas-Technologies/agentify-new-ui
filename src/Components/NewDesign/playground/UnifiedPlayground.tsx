"use client"
import { useEffect, useState } from "react";
import { ArrowLeft, Zap, Layers, MessageCircle } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { UnifiedCommandInterface } from "@/Components/NewDesign/playground/UnifiedCommandInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import Navbar from "../Dashboard/Navbar/Navbar";

const PlaygroundFeatures = [
    {
        icon: Zap,
        title: "Unified DeFi Operations",
        description: "Swap, bridge, and lend - all in one conversation without switching agents."
    },
    {
        icon: Layers,
        title: "Smart Context Preservation",
        description: "Switch between different DeFi operations while maintaining conversation context."
    },
    {
        icon: MessageCircle,
        title: "Natural Language Interface",
        description: "Execute complex blockchain transactions using simple conversational commands."
    }
];

const UnifiedPlayground = () => {
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const router = useRouter();
    const { address } = useAccount();
    const { user } = usePrivy();
    const { handleWalletConnect } = useWalletConnect();

    useEffect(() => {
        if (address && user) {
            setIsWalletConnected(true);
        } else {
            setIsWalletConnected(false);
        }
    }, [address, user])

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/95 ">
            <Navbar />

            <main className="container relative mx-auto px-3 py-6 md:px-4 md:py-8">
                <div className="mb-8">
                    <Button
                        variant="outline"
                        size="sm"
                        className="neumorphic-sm flex items-center gap-2 mb-4 hover:bg-primary/5"
                        onClick={() => router.push('/')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-2xl font-bold bg-gradient-to-br from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                        Unified AI Playground
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        All DeFi operations in one intelligent conversation
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="hidden md:block p-4 rounded-xl neumorphic border-none bg-gradient-to-b from-background/95 to-background">
                            <h3 className="text-sm font-semibold mb-3 text-gray-300">
                                🚀 What's New
                            </h3>
                            <div className="space-y-3">
                                {PlaygroundFeatures.map((feature, index) => (
                                    <div key={index} className="flex gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                                            <feature.icon className="h-4 w-4 text-purple-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-white">{feature.title}</h4>
                                            <p className="text-xs text-gray-400 mt-1">{feature.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Card className="bg-[#030303] border-[#1a1a1a]">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-gray-300">How It Works</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-xs text-gray-400 space-y-2">
                                    <p>✨ Just type what you want to do in natural language</p>
                                    <p>🤖 Our AI understands and routes to the right DeFi protocol</p>
                                    <p>🔄 Continue conversations across different operations</p>
                                    <p>⚡ Execute transactions with a single confirmation</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-purple-300">Example Commands</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-gray-300 space-y-1">
                                    <p>• "Swap 100 USDT for ETH"</p>
                                    <p>• "Bridge my USDC to Polygon"</p>
                                    <p>• "Lend 1000 DAI on Aave"</p>
                                    <p>• "Show my positions"</p>
                                    <p>• "What's the best yield for USDC?"</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-8">
                        <UnifiedCommandInterface
                            isWalletConnected={isWalletConnected}
                            onConnect={handleWalletConnect}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UnifiedPlayground;