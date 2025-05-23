"use client"

import NodesList from "../components/nodes-list"
import WorkFlowEditor from "../components/workflow-editor"
import { nodes } from "../../../nodes/nodes"
import { useState } from "react"
import { Node } from "@/nodes/node.types"
import Navbar from "@/Components/NewDesign/Dashboard/Navbar/Navbar"
import { Button } from "@/Components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function WorkflowContainer() {

    const [isWeb3, setIsWeb3] = useState(false);
    const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
    const [connections, setConnections] = useState<{ from: string; to: string }[]>([]);

    const router = useRouter();

    const availableNodes = isWeb3 ? [] : nodes;

    const handleNodeClick = (node: Node) => {
        const newNode = { ...node };
        const nameExists = selectedNodes.some((n) => n.displayName === node.displayName);

        // Set initial x and y positions if first node, else update them
        if (selectedNodes.length === 0) {
            newNode.x = 100;
            newNode.y = 200;
        } else {
            const lastNode = selectedNodes[selectedNodes.length - 1];
            newNode.x = lastNode.x + 200;  // Increment X by 100px for each new node
            newNode.y = lastNode.y;  // Increment Y by 200px for each new node  we can add + 100
        }

        // Update the displayName to be unique if node already exists
        if (nameExists) {
            const count = selectedNodes.filter(n => n.displayName.startsWith(node.displayName)).length;
            newNode.displayName = `${node.displayName} ${count + 1}`;
        }

        setSelectedNodes([...selectedNodes, newNode]);
    };

    // Handle node drag update
    const handleNodeDrag = (node: Node, dx: number, dy: number) => {
        const updatedNodes = selectedNodes.map((n) => {
            if (n.displayName === node.displayName) {
                return { ...n, x: n.x + dx, y: n.y + dy };  // Update the x and y position
            }
            return n;
        });
        setSelectedNodes(updatedNodes);
    };

    // Remove node from selectedNodes
    const handleNodeDelete = (node: Node) => {
        setSelectedNodes(selectedNodes.filter(n => n.displayName !== node.displayName));
    };

    return (
        <div className="min-h-screen w-full h-full bg-gradient-to-b from-background to-background/95 ">
            <Navbar />

            <main className="container relative mx-auto px-3 pt-6 md:px-4 md:pt-8">
                <div className="mb-8 w-full flex items-center justify-between">

                    <div className="left">
                        <h1 className="text-2xl font-bold bg-gradient-to-br from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                            Workflow Automation
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Create an agentic workflow for web3 operations.
                        </p>

                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="neumorphic-sm flex items-center gap-2 mb-4 hover:bg-primary/20"
                        onClick={() => router.push('/')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>

                <div className="w-full h-[calc(100vh-5rem)] flex justify-between">
                    <div className="w-[71%] h-full overflow-hidden relative p-1 rounded-xl neumorphic border-none bg-[radial-gradient(#9e9e9e_1px,transparent_1px)] [background-size:32px_32px]">
                        <WorkFlowEditor selectedNodes={selectedNodes} handleNodeDelete={handleNodeDelete} handleNodeDrag={handleNodeDrag} setConnections={setConnections} connections={connections} />
                    </div>
                    <div className="w-[27%] h-full overflow-auto p-1 rounded-xl neumorphic border-none bg-gradient-to-b from-background/95 to-background">
                        <NodesList nodes={availableNodes} isWeb3={isWeb3} setIsWeb3={setIsWeb3} handleNodeClick={handleNodeClick} />
                    </div>
                </div>
            </main>
        </div>
    )
}