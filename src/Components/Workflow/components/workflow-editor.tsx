"use client"

import { Node } from "@/nodes/node.types";
import { Bookmark, DeleteIcon, DoorOpen, Edit, FlaskConical, MoreHorizontal, Pencil, Play, Trash, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import NodeConfigModal from "./node-config-modal";
import { SaveWorkflowPayload, useSaveWorkflowOnN8N } from "@/hooks/useSaveWorkflowOnN8N";
import { Button } from "@/Components/ui/button";
import ToggleSwitch from "./form-fields/toggle-switch";

interface Props {
    selectedNodes: Node[];
    connections: { from: string; to: string }[];
    setConnections: (val: { from: string; to: string }[]) => void;
    handleNodeDelete: (node: Node) => void;
    handleNodeDrag: (node: Node, dx: number, dy: number) => void;
}

function convertExpression(value: string): string {
    console.log("Value: ", value)
    return value.replace(/\{\{\s*(json\[\s*["'](.+?)["']\s*\]\.data(?:\.[\w\d_]+)*)\s*\}\}/g, (_, expr) => {
        const updated = expr.replace(/json\[\s*["'](.+?)["']\s*\]\.data((?:\.[\w\d_]+)*)/g, (_: any, __: any, path: any) => {
            return `$json${path}`;
        });
        return `{{ ${updated} }}`;
    });
}


export default function WorkFlowEditor({ selectedNodes, handleNodeDelete, handleNodeDrag, connections, setConnections }: Props) {
    const [dragging, setDragging] = useState<any | null>(null);
    const [zoom, setZoom] = useState(1); // Default zoom level
    const [draggingLine, setDraggingLine] = useState<{ from: string; x: number; y: number } | null>(null);
    const [openEditorNode, setOpenEditorNode] = useState<Node | null>(null);
    const [prevNodeOutputs, setPrevNodeOutputs] = useState<Record<string, any>>({});
    const [nodeOutputs, setNodeOutputs] = useState<Record<string, any>>({});
    const [workflowName, setWorkflowName] = useState("My Workflow");
    const [showNameModal, setShowNameModal] = useState(false);
    const [nameInput, setNameInput] = useState(workflowName);
    const [executingNode, setExecutingNode] = useState<string | null>(null);
    const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(false);

    const { saveWorkflowOnN8N, getWorkflowsFromN8N, activateWorkflowOnN8N, deactivateWorkflowOnN8N } = useSaveWorkflowOnN8N();

    const [nodeFormValues, setNodeFormValues] = useState<Record<string, any>>({});

    const updateNodeFormValues = (nodeName: string, formData: any) => {
        setNodeFormValues(prev => ({ ...prev, [nodeName]: formData }));
    };

    const handleSaveWorkflow = async () => {
        const nodesPayload: SaveWorkflowPayload["nodes"] = selectedNodes.map(node => {
            const formData = nodeFormValues[node.displayName] || {};
            const pos: [number, number] = [node.x ?? 0, node.y ?? 0];
            let parameters: Record<string, any> = formData.parameters || {};

            console.log("Form Params:", parameters)

            if (node.name === "n8n-nodes-base.httpRequest") {
                console.log("Entered")
                // Convert header key-value to JSON string
                const headers = (parameters.headerParameters?.parameters || []).reduce((acc: any, cur: any) => {
                    acc[cur.name] = cur.value;
                    return acc;
                }, {});

                // Convert body key-value to JSON string with expression support
                const body = (parameters.bodyParameters?.parameters || []).reduce((acc: any, cur: any) => {
                    let value = cur.value;
                    if (typeof value === 'string' && value.includes('json["')) {
                        value = convertExpression(value);
                    }
                    acc[cur.name] = value;
                    return acc;
                }, {});

                console.log("Body:", body)

                parameters = {
                    authentication: parameters.authentication || "none",
                    method: parameters.method || "GET",
                    url: parameters.url || "",
                    sendHeaders: !!parameters.sendHeaders,
                    specifyHeaders: "json",
                    jsonHeaders: JSON.stringify(headers, null, 2),
                    sendBody: !!parameters.sendBody,
                    contentType: "json",  // parameters.contentType || 
                    specifyBody: "json",
                    jsonBody: `=${JSON.stringify(body, null, 2)}`
                };
            }

            if (node.name === "n8n-nodes-base.scheduleTrigger") {
                const intervalList = parameters?.rule?.interval;

                if (Array.isArray(intervalList)) {
                    intervalList.forEach((interval: any) => {
                        if (Array.isArray(interval.triggerAtDay)) {
                            interval.triggerAtDay = interval.triggerAtDay.map((day: any) => Number(day));
                        }
                        if (interval.triggerAtHour !== undefined) {
                            interval.triggerAtHour = Number(interval.triggerAtHour);
                        }
                        if (interval.triggerAtMinute !== undefined) {
                            interval.triggerAtMinute = Number(interval.triggerAtMinute);
                        }
                        if (interval.weeksInterval !== undefined) {
                            interval.weeksInterval = Number(interval.weeksInterval);
                        }
                        if (interval.daysInterval !== undefined) {
                            interval.daysInterval = Number(interval.daysInterval);
                        }
                        if (interval.monthsInterval !== undefined) {
                            interval.monthsInterval = Number(interval.monthsInterval);
                        }
                    });
                }
            }


            return {
                id: node.displayName,
                name: node.displayName,
                type: node.name,
                typeVersion: node.name === "n8n-nodes-base.scheduleTrigger" ? 1 : 4,
                position: pos,
                parameters,
                credentials: formData.credentials || {}
            };
        });

        const connectionMap: SaveWorkflowPayload["connections"] = connections.reduce((acc: Record<string, any>, conn: { from: string; to: string }) => {
            if (!acc[conn.from]) acc[conn.from] = { main: [[]] };
            acc[conn.from].main[0].push({ node: conn.to, type: "main", index: 0 });
            return acc;
        }, {});

        const settings: SaveWorkflowPayload["settings"] = {
            executionTimeout: 3600,
            saveDataSuccessExecution: "all",
            saveDataErrorExecution: "all",
            saveExecutionProgress: true,
            saveManualExecutions: true,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        const payload: SaveWorkflowPayload = {
            name: `${workflowName}-${new Date().toISOString()}`,
            nodes: nodesPayload,
            connections: connectionMap,
            settings,
            staticData: {}
        };

        console.log("N8N payload: ", payload)

        try {
            const res = await saveWorkflowOnN8N(payload);
            console.log("Save Workflow:", res)
            setSavedWorkflowId(res.id);
            alert("Workflow saved successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to save workflow");
        }
    };

    const activateWorkflow = async () => {
        if (!savedWorkflowId) return;

        const res = await activateWorkflowOnN8N(savedWorkflowId);
        console.log("Res: Ac: ", res)
        setIsActive(res.active);
    }

    const containerRef = useRef<HTMLDivElement>(null);


    const handleLineStart = (e: React.MouseEvent, fromNode: Node) => {
        e.stopPropagation();
        const rect = containerRef.current?.getBoundingClientRect();
        setDraggingLine({
            from: fromNode.displayName,
            x: e.clientX - (rect?.left || 0),
            y: e.clientY - (rect?.top || 0),
        });
    };

    const handleLineMove = (e: React.MouseEvent) => {
        if (!draggingLine) return;
        const rect = containerRef.current?.getBoundingClientRect();
        setDraggingLine({
            ...draggingLine,
            x: e.clientX - (rect?.left || 0),
            y: e.clientY - (rect?.top || 0),
        });
    };

    const handleLineEnd = (e: React.MouseEvent, toNode: Node) => {
        if (!draggingLine || draggingLine.from === toNode.displayName) return;
        setConnections([...connections, { from: draggingLine.from, to: toNode.displayName }]);
        setDraggingLine(null);
    };

    const handleMouseDown = (e: any, node: Node) => {
        if (e.target.closest('.node-actions')) return;
        setDragging({
            node,
            offsetX: e.clientX - e.target.getBoundingClientRect().left,
            offsetY: e.clientY - e.target.getBoundingClientRect().top
        });
        document.body.style.cursor = 'move';
    };

    const handleMouseMove = (e: any) => {
        if (!dragging || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newX = (e.clientX - containerRect.left - dragging.offsetX) / zoom;
        const newY = (e.clientY - containerRect.top - dragging.offsetY) / zoom;

        dragging.node.x = newX;
        dragging.node.y = newY;
        setDragging({ ...dragging });
    };

    const handleMouseUp = () => {
        setDragging(null);
        document.body.style.cursor = 'default';
    };

    const getPrevOutputs = (currentNodeName: string): Record<string, any> => {
        const incoming = connections
            .filter(conn => conn.to === currentNodeName)
            .map(conn => conn.from);

        const outputs: Record<string, any> = {};
        for (const from of incoming) {
            if (nodeOutputs[from]) {
                outputs[from] = nodeOutputs[from]; // no flattening
                // 👇 Recursively include prior outputs if there are multi-level connections
                const grandParents = getPrevOutputs(from);
                Object.entries(grandParents).forEach(([grandParentName, grandOutput]) => {
                    if (!outputs[grandParentName]) {
                        outputs[grandParentName] = grandOutput;
                    }
                });
            }
        }
        return outputs;
    };



    console.log("O/p:", nodeOutputs)

    const executeWorkflow = async () => {
        const results: Record<string, any> = {};

        const interpolate = (value: any, context: Record<string, any>): any => {
            if (typeof value === "string") {
                return value.replace(/{{\s*(.*?)\s*}}/g, (_, path: string) => {
                    try {
                        if (path.startsWith("json")) path = path.replace(/^json/, "");
                        const parts: string[] = [];
                        const regex = /\["([^"]+)"\]|\.?([\w]+)/g;
                        let match;
                        while ((match = regex.exec(path))) {
                            if (match[1]) parts.push(match[1]);
                            else if (match[2]) parts.push(match[2]);
                        }
                        let val = context;
                        for (const part of parts) {
                            if (val && typeof val === "object" && part in val) val = val[part];
                            else return "";
                        }
                        return String(val ?? "");
                    } catch (e) {
                        return "";
                    }
                });
            }
            if (Array.isArray(value)) return value.map(v => interpolate(v, context));
            if (typeof value === "object" && value !== null) {
                const result: Record<string, any> = {};
                for (const k in value) result[k] = interpolate(value[k], context);
                return result;
            }
            return value;
        };

        const resolveInputs = (nodeName: string): Record<string, any> => {
            const incoming = connections.filter(c => c.to === nodeName).map(c => c.from);
            let input: Record<string, any> = {};
            for (const from of incoming) {
                if (results[from]) input[from] = results[from];
                const parentInput = resolveInputs(from);
                Object.assign(input, parentInput);
            }
            return input;
        };

        for (const node of selectedNodes) {
            setExecutingNode(node.displayName);
            const inputCtx = resolveInputs(node.displayName);
            const form = nodeFormValues[node.displayName]?.parameters || {};
            const payload: Record<string, any> = {};
            for (const key in form) {
                if (key.startsWith("__")) continue;
                payload[key] = interpolate(form[key], inputCtx);
            }
            try {
                const res = await fetch("/api/test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ node, input: payload })
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "Unknown error");
                results[node.displayName] = json;
                setNodeOutputs(prev => ({ ...prev, [node.displayName]: json }));
            } catch (err) {
                console.error(`Node ${node.displayName} failed`, err);
                alert(`Execution failed for ${node.displayName}`);
                return;
            }
        }
        setExecutingNode(null);
        alert("Workflow executed successfully");
    };


    return (
        <div
            ref={containerRef}
            className="relative w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                <button
                    onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
                    className="w-9 h-9 rounded-md border border-gray-500 flex items-center justify-center hover:bg-gray-700 cursor-pointer"
                ><ZoomIn className="w-5 h-5 text-gray-400" /> </button>
                <button
                    onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.3))}
                    className="w-9 h-9 rounded-md border border-gray-500 flex items-center justify-center hover:bg-gray-700 cursor-pointer"
                ><ZoomOut className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <h2 className="text-lg text-white font-semibold">{workflowName}</h2>
                <Pencil className="text-white w-4 h-4 cursor-pointer" onClick={() => {
                    setNameInput(workflowName);
                    setShowNameModal(true);
                }} />
            </div>

            <div className="absolute top-0 right-0 z-10 flex items-center gap-2 w-auto h-[3.25rem] bg-gray-800 rounded-md px-1.5">
                <div className="w-auto flex gap-1 items-center">
                    <h2>{isActive ? "  active" : "in active"}</h2>
                    <ToggleSwitch checked={isActive} onChange={setIsActive} />
                </div>
                <Button variant="outline" onClick={executeWorkflow}>
                    <FlaskConical className="w-4 h-4 text-white" /> Execute Workflow
                </Button>
                <Button variant="default" onClick={handleSaveWorkflow} className="">
                    <Bookmark className="w-4 h-4 text-white" /> Save
                </Button>
                <Button variant="default" onClick={activateWorkflow} className="">
                    <Bookmark className="w-4 h-4 text-white" /> Activate
                </Button>
            </div>


            {/* Scalable Editor Canvas */}
            <div
                className="absolute left-0 top-0 w-full h-full origin-top-left"
                style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left"
                }}
            >
                {/* Connection Lines */}
                <svg className="absolute w-full h-full pointer-events-none">
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="10"
                            refY="3.5"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill="gray" />
                        </marker>
                    </defs>

                    {connections.map((conn, index) => {
                        const from = selectedNodes.find(n => n.displayName === conn.from);
                        const to = selectedNodes.find(n => n.displayName === conn.to);
                        if (!from || !to) return null;

                        const startX = from.x + 100;
                        const startY = from.y + 50;
                        const endX = to.x;
                        const endY = to.y + 50;

                        const curve = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;

                        return <path key={index} d={curve} stroke="gray" fill="none" strokeWidth={2} markerEnd="url(#arrowhead)" />;
                    })}
                    {/* {draggingLine && (
                        <line
                            x1={selectedNodes.find(n => n.displayName === draggingLine.from)?.x! + 100}
                            y1={selectedNodes.find(n => n.displayName === draggingLine.from)?.y! + 50}
                            x2={draggingLine.x}
                            y2={draggingLine.y}
                            stroke="gray"
                            strokeWidth={2}
                            strokeDasharray="4"
                            markerEnd="url(#arrowhead)"
                        />
                    )} */}
                </svg>

                {selectedNodes.map((node, index) => (
                    <div
                        key={index}
                        className={`absolute group transition-opacity duration-300 ${executingNode === node.displayName ? 'opacity-70 z-50' : ''}`}
                        style={{
                            top: `${node.y - 5}px`, // Shift up for 5px hover buffer
                            left: `${node.x - 5}px`, // Shift left for 5px hover buffer
                            width: "110px",          // 100px node + 5px buffer on each side
                            height: "110px",
                            padding: "5px",
                        }}
                    >
                        <div
                            className="relative bg-gradient-to-b from-background/95 to-background border-2 border-gray-500"
                            style={{
                                width: "100px",
                                height: "100px",
                                borderRadius: "8px",
                                // border: "2px solid #fff",
                                padding: "10px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                            onMouseDown={(e) => handleMouseDown(e, node)}
                        >
                            {/* Node Actions */}
                            <div
                                className={`absolute node-actions top-[-23px] bg-gray-200 rounded-md left-0 right-0 gap-1 py-1 px-1.5 
                                ${dragging && dragging.node === node ? 'hidden' : 'hidden group-hover:flex'} 
                                flex items-center justify-between transition-opacity`}
                            >
                                <button className="text-red-500" onClick={(e) => {
                                    e.stopPropagation(); handleNodeDelete(node)
                                }}><Trash2 className="h-4 w-4" /></button>
                                <button className="text-gray-700"><Play className="h-4 w-4" /></button>
                                <button className="text-gray-700" onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenEditorNode(node);
                                    // Optionally prefill previous outputs if required
                                    const inputsFromPrev = {}; // build this from previous connected nodes
                                    setPrevNodeOutputs(inputsFromPrev);
                                }}><Edit className="h-4 w-4" /></button>
                                <button className="text-gray-700"><MoreHorizontal className="h-4 w-4" /></button>
                            </div>

                            <img src={node.iconUrl?.light || ""} alt={node.displayName} style={{ width: '40px', height: '40px' }} />
                            <div className="text-xs text-center leading-tight">{node.displayName}</div>

                            {/* Left Point (drop target) */}
                            <div
                                className="absolute w-1 h-3 bg-[#7b3aede6] rounded-xs"
                                style={{ top: "50%", left: "-5px", transform: "translateY(-50%)", cursor: "pointer" }}
                                onMouseUp={(e) => handleLineEnd(e, node)}
                            />

                            {/* Right Point (drag start) */}
                            <div
                                className="absolute w-3 h-3 bg-[#7b3aede6] rounded-full"
                                style={{ top: "50%", right: "-6px", transform: "translateY(-50%)", cursor: "crosshair" }}
                                onMouseDown={(e) => handleLineStart(e, node)}
                            />

                            {executingNode === node.displayName && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {openEditorNode && <NodeConfigModal
                node={openEditorNode}
                prevNodeOutputs={getPrevOutputs(openEditorNode.displayName)}
                onClose={() => setOpenEditorNode(null)}
                initialValues={nodeFormValues[openEditorNode.displayName]?.parameters || {}}
                // onSaveOutput={(nodeName, output) => {
                //     setNodeOutputs(prev => ({ ...prev, [nodeName]: output }));
                // }}
                onSaveOutput={(nodeName, output, rawInputs) => {
                    setNodeOutputs(prev => ({ ...prev, [nodeName]: output }));
                    updateNodeFormValues(nodeName, rawInputs);
                }}
            />}

            {showNameModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center">
                    <div className="p-6 w-80 rounded-md p-4 rounded-xl neumorphic border-none bg-gradient-to-b from-background/95 to-background shadow-[0_0_20px_4px_rgba(255,255,255,0.5)]">
                        <div className="flex items-center gap-2 mb-4">
                            <Pencil className="text-white w-4 h-4 cursor-pointer" />
                            <h3 className="text-lg font-semibold">Edit Workflow Name</h3>
                        </div>
                        <input
                            className="w-full border px-3 py-2 rounded mb-4 bg-black"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowNameModal(false)}>Cancel</Button>
                            <Button onClick={() => {
                                setWorkflowName(nameInput);
                                setShowNameModal(false);
                            }}>Save</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
