
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Zap, Layers, Code, MessageCircle } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { AgentSelector } from "@/Components/NewDesign/playground/AgentSelector";
import { CommandInterface } from "@/Components/NewDesign/playground/CommandInterface";

import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { Agent } from "@/types/types";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import Navbar from "../Dashboard/Navbar/Navbar";

const PlaygroundFeatures = [
    {
        icon: Zap,
        title: "AI-Powered Transactions",
        description: "Execute complex blockchain transactions using natural language commands."
    },
    {
        icon: Layers,
        title: "Multi-Chain Support",
        description: "Seamlessly interact with multiple blockchain networks in one interface."
    },
    {
        icon: Code,
        title: "Smart Agent Assistance",
        description: "Choose from specialized agents tailored to different transaction types."
    }
];

const Playground = () => {
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { user, login, logout, connectWallet } = usePrivy();
    const { handleWalletConnect, disconnectAll } = useWalletConnect();

    useEffect(() => {
        if (address && user) {
            setIsWalletConnected(true);
        }
    }, [address, user])

    // const handleWalletConnect = useCallback(() => {
    //     if (!user) {
    //         login();
    //     } else {
    //         connectWallet();
    //     }
    // }, [user, login, connectWallet]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/95 xl:px-6 xl:py-4">
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
                        AI Playground
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Execute smart transactions with natural language
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="hidden md:flex p-4 rounded-xl neumorphic border-none bg-gradient-to-b from-background/95 to-background">
                            <AgentSelector
                                selectedAgent={selectedAgent}
                                onSelectAgent={setSelectedAgent}
                            />
                        </div>

                        <Card className="neumorphic border-none hidden md:block">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5 text-primary" />
                                    Playground Features
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {PlaygroundFeatures.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-background/50 hover:bg-primary/5 transition-colors">
                                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                                            <feature.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{feature.title}</h3>
                                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-8">
                        <CommandInterface
                            selectedAgent={selectedAgent}
                            isWalletConnected={isWalletConnected}
                            onConnect={handleWalletConnect}
                            onSelectAgent={setSelectedAgent}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Playground;
