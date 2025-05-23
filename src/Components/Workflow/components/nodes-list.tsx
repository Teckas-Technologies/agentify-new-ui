"use client"

import { Node } from "@/nodes/node.types";
import NodeName from "./node-name";
import { Button } from "@/Components/ui/button";

interface Props {
    nodes: Node[];
    isWeb3: boolean;
    setIsWeb3: (val: boolean) => void;
    handleNodeClick: (node: Node) => void;
}

export default function NodesList({ nodes, isWeb3, setIsWeb3, handleNodeClick }: Props) {
    return (
        <div className="p-3">
            <h2 className="text-white font-semibold text-lg">Nodes List</h2>

            <div className="change-node-btns w-full flex gap-3 py-2">
                <Button variant="outline" onClick={() => setIsWeb3(true)} className={`w-[50%]  cursor-pointer ${isWeb3 ? "bg-[#7b3aede6] font-semibold" : ""}`}>Web3</Button>
                <Button variant="outline" onClick={() => setIsWeb3(false)} className={`w-[50%] cursor-pointer ${!isWeb3 ? "bg-[#7b3aede6] font-semibold" : ""}`}>Web2</Button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
                {nodes.map((node, index) => (
                    <div
                        key={index}
                        // className="cursor-pointer"
                        className={"cursor-pointer"
                            // `group flex items-start gap-4 p-4 mt-1 cursor-pointer transition-all duration-300 from-violet-500/20 via-fuchsia-500/20 to-violet-500/20 rounded-sm 
                            //     ${selectedAgent?.agentId === agent.agentId
                            //     ? "bg-gradient-to-r border border-primary/20"
                            //     : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10"
                            // }`
                            
                        }
                        onClick={() => handleNodeClick(node)}
                    >
                        <NodeName
                            name={node.displayName}
                            description={node.description || ""}
                            icon={node?.iconUrl?.light || ""}
                            active={index === 0}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}