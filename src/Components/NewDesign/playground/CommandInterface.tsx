
import { Send, Wallet, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/Components/ui/card";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { useState } from "react";
import { agentExampleCommands } from "@/utils/agentCommands";

interface CommandInterfaceProps {
    selectedAgent: string;
    isWalletConnected?: boolean;
    onConnect?: () => void;
}

export const CommandInterface = ({
    selectedAgent,
    isWalletConnected = false,
    onConnect = () => { }
}: CommandInterfaceProps) => {
    const [inputValue, setInputValue] = useState("");

    const handleQuickCommand = (command: string) => {
        setInputValue(command);
    };

    return (
        <Card className="neumorphic border-none h-full flex flex-col bg-gradient-to-b from-background/95 to-background">
            <CardHeader className="border-b border-white/5 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                            <MessageCircle className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                            AI Assistant
                        </h2>
                    </div>
                    {!isWalletConnected ? (
                        <Button
                            onClick={onConnect}
                            variant="outline"
                            className="neumorphic-sm flex items-center gap-2 hover:bg-primary/5"
                        >
                            <Wallet className="h-4 w-4" />
                            Connect Wallet
                        </Button>
                    ) : (
                        <Badge variant="outline" className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                            Wallet Connected
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-[calc(100vh-280px)] w-full">
                    <div className="p-6">
                        {!isWalletConnected ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-primary/5 ring-1 ring-primary/20 mb-2">
                                    <MessageCircle className="h-8 w-8 text-primary/60" />
                                </div>
                                <h3 className="text-lg font-medium bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                                    Welcome to Agentify AI Assistant
                                </h3>
                                <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                                    Connect your wallet to start executing smart transactions with natural language commands across any blockchain.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-medium">Quick Commands</h3>
                                    </div>
                                    <div className="grid gap-2">
                                        {agentExampleCommands[selectedAgent]?.map((command, index) => (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                className="w-full justify-start text-left h-auto py-3 px-4 bg-white/5 hover:bg-primary/10 border-white/10"
                                                onClick={() => handleQuickCommand(command)}
                                            >
                                                {command}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                {/* Message history will be added here */}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="border-t border-white/5 p-4 sticky bottom-0 bg-background z-10">
                <div className="flex w-full gap-3 items-center">
                    <Badge
                        variant="outline"
                        className="bg-primary/10 border-primary/20 text-primary shrink-0"
                    >
                        {selectedAgent.toUpperCase()} AGENT
                    </Badge>
                    <div className="flex-1 flex gap-2">
                        <Input
                            placeholder="Enter your command..."
                            className="flex-1 bg-white/5 border-white/10 focus:ring-primary/20"
                            disabled={!isWalletConnected}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <Button
                            size="icon"
                            className="shrink-0 neumorphic-sm bg-primary/10 hover:bg-primary/20 transition-colors"
                            disabled={!isWalletConnected || !inputValue.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
};
