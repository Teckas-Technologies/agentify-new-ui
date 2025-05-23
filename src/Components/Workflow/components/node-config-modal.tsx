import React, { useEffect, useState } from "react";
import { Node, NodeProperty, NodeOptionValue, FixedCollectionEntry } from "@/nodes/node.types";
import ToggleSwitch from "./form-fields/toggle-switch";
import { Button } from "@/Components/ui/button";

interface Props {
    node: Node;
    onClose: () => void;
    prevNodeOutputs: Record<string, any>;
    initialValues: Record<string, any>;
    // onSaveOutput: (nodeName: string, output: any) => void;
    onSaveOutput: (nodeName: string, output: any, rawInputs: any) => void;

}

const ExpandableJson: React.FC<{ data: any; nodeName?: string, depth?: number, path?: string[] }> = ({ data, nodeName, depth = 0, path = [] }) => {
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

    const toggleKey = (key: string) => {
        setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const currentPath = nodeName ? [nodeName, ...path] : path;

    if (typeof data !== "object" || data === null) {
        return <div>{String(data)}</div>;
    }

    if (Array.isArray(data)) {
        return (
            <div className="ml-2">
                {data.map((item, idx) => (
                    <div key={idx} className="text-xs">
                        <div className="flex cursor-pointer mt-1" onClick={() => toggleKey(String(idx))}>
                            <span className="mr-1 text-gray-700">{expandedKeys[idx] ? "▼" : "▶"}</span>
                            <strong>[{idx}]</strong>
                        </div>
                        {expandedKeys[idx] && (
                            <div className="ml-4">
                                <ExpandableJson data={item} depth={depth + 1} path={[...currentPath, String(idx)]} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    const buildJsonPath = (key: string, depth: number, path: string[] = []) => {
        return `json${[...path, key].map(p => `["${p}"]`).join("")}`;
    };

    return (
        <div className="ml-2">
            {Object.entries(data).map(([key, val]) => {
                const isExpandable = typeof val === "object" && val !== null;
                return (
                    <div key={key} className="text-xs">
                        <div
                            className="flex cursor-pointer mt-1"
                            onClick={() => isExpandable && toggleKey(key)}
                        >
                            {isExpandable && (
                                <span className="mr-1 text-gray-700">{expandedKeys[key] ? "▼" : "▶"}</span>
                            )}
                            <strong>{key}:</strong> {!isExpandable && <span draggable
                                onDragStart={(e) => {
                                    const fullPath = ["json", ...currentPath, key]
                                        .map((p, i) =>
                                            i === 0
                                                ? p
                                                : /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p)
                                                    ? `.${p}`
                                                    : `["${p}"]`
                                        )
                                        .join("");

                                    console.log("Drag path:", currentPath, "key:", key);
                                    console.log("Full path:", fullPath);

                                    e.dataTransfer.setData("application/json-key", fullPath);
                                    e.dataTransfer.setData("application/json-value", JSON.stringify(val));
                                }} className="ml-1 text-blue-600 underline cursor-pointer">{String(val)}</span>}
                        </div>
                        {expandedKeys[key] && isExpandable && (
                            <div className="ml-4">
                                <ExpandableJson data={val} depth={depth + 1} path={[...currentPath, key]} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const NodeConfigModal: React.FC<Props> = ({ node, onClose, prevNodeOutputs, onSaveOutput, initialValues }) => {
    const [formValues, setFormValues] = useState<Record<string, any>>(initialValues || {});
    const [activeField, setActiveField] = useState<string | null>(null);
    const [output, setOutput] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(()=>{
        console.log("Form values:", initialValues);
    }, [])

    const handleChange = (name: string, value: any) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleFocus = (name: string) => setActiveField(name);

    const insertJsonReference = (key: string, value: any) => {
        if (!activeField) return;
        setFormValues((prev) => ({ ...prev, [activeField]: value }));
        const input = document.getElementById(`input-${activeField}`) as HTMLInputElement;
        if (input) input.value = `{{ json.${key} }}`;
    };

    const shouldDisplay = (prop: NodeProperty): boolean => {
        const display = prop.displayOptions;
        if (!display) return true;

        const check = (cond: any, show = true) =>
            Object.entries(cond).every(([key, vals]) => {
                const expected = vals as (string | boolean)[];
                const actual = formValues[key];
                return show ? expected.includes(actual) : !expected.includes(actual);
            });

        if (display.show && !check(display.show, true)) return false;
        if (display.hide && !check(display.hide, false)) return false;
        return true;
    };

    const testStep = async () => {
        try {
            setError(null);
            const interpolate = (value: any, outputs: Record<string, any>): any => {
                if (typeof value === "string") {
                    return value.replace(/{{\s*(.*?)\s*}}/g, (_, path: string) => {
                        try {
                            if (path.startsWith("json")) {
                                path = path.replace(/^json/, "");
                            }

                            const parts: string[] = [];
                            const regex = /\["([^"]+)"\]|\.?(\w+)/g;

                            let match;
                            while ((match = regex.exec(path))) {
                                if (match[1]) {
                                    parts.push(match[1]); // bracket notation like ["HTTP Request"]
                                } else if (match[2]) {
                                    parts.push(match[2]); // dot notation like .status or root like status
                                }
                            }

                            // Traverse the path
                            let val: any = outputs;
                            for (const part of parts) {
                                if (val && typeof val === "object" && part in val) {
                                    val = val[part];
                                } else {
                                    return ""; // If part not found, return empty
                                }
                            }

                            return String(val ?? "");
                        } catch (e) {
                            console.error("Interpolation error for path:", path, e);
                            return "";
                        }
                    });
                }

                if (Array.isArray(value)) {
                    return value.map((v) => interpolate(v, outputs));
                }

                if (typeof value === "object" && value !== null) {
                    const result: Record<string, any> = {};
                    for (const k in value) {
                        result[k] = interpolate(value[k], outputs);
                    }
                    return result;
                }

                return value;
            };



            console.log("Resolved fact:", interpolate('Status: {{ ["HTTP Request"].status }}, Fact: {{ ["HTTP Request"].data.fact }}', prevNodeOutputs));


            const buildPayload = () => {
                const payload: Record<string, any> = {};

                console.log("Form values:", formValues);

                for (const key in formValues) {
                    if (key.startsWith("__")) continue;

                    const dynamic = formValues[`__${key}_dynamic_values__`] || {};
                    const raw = formValues[key];
                    payload[key] = interpolate(raw, prevNodeOutputs);  // Use the interpolate function to resolve the values
                }

                console.log("Payload:", payload);

                return payload;
            };



            const response = await fetch("/api/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ node, input: buildPayload() })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Unknown error");
            setOutput(result);
            onSaveOutput(node.displayName, result, { parameters: formValues, credentials: {} });
        } catch (err: any) {
            setOutput(null);
            setError(err.message);
        }
    };

    const renderInput = (prop: NodeProperty) => {
        const name = prop.name;
        const id = `input-${name}`;

        if (prop.type === "string") {
            return (
                <input
                    id={id}
                    className="border px-2 py-1 w-full bg-black"
                    placeholder={prop.placeholder || ""}
                    defaultValue={formValues[name] || ""}
                    onFocus={() => handleFocus(name)}
                    onChange={(e) => handleChange(name, e.target.value)}
                    onDrop={(e) => {
                        e.preventDefault();
                        const key = e.dataTransfer.getData("application/json-key");
                        const val = JSON.parse(e.dataTransfer.getData("application/json-value"));

                        const existing = formValues[name] || "";
                        const updated = existing + `{{ ${key} }}`;
                        handleChange(name, updated);

                        // Store the actual value too
                        setFormValues((prev) => ({
                            ...prev,
                            [`__${name}_dynamic_values__`]: {
                                ...(prev[`__${name}_dynamic_values__`] || {}),
                                [key]: val
                            }
                        }));
                    }}
                    onDragOver={(e) => e.preventDefault()}
                />
            );
        }

        if (prop.type === "boolean") {
            return (
                <ToggleSwitch
                    checked={formValues[name] || false}
                    onChange={(val) => handleChange(name, val)}
                    label={prop.displayName}
                />
            );
        }

        if (prop.type === "options" && prop.options) {
            return (
                <select
                    value={formValues[name] || prop.default}
                    onChange={(e) => handleChange(name, e.target.value)}
                    className="border px-2 py-1 w-full bg-black"
                >
                    {(prop.options as NodeOptionValue[]).map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-black">{opt.name}</option>
                    ))}
                </select>
            );
        }

        if (prop.type === "json") {
            return (
                <textarea
                    className="border px-2 py-1 w-full bg-black"
                    placeholder="JSON input"
                    onChange={(e) => handleChange(name, e.target.value)}
                    onDrop={(e) => {
                        e.preventDefault();
                        const key = e.dataTransfer.getData("application/json-key");
                        const val = JSON.parse(e.dataTransfer.getData("application/json-value"));

                        const existing = formValues[name] || "";
                        const updated = existing + `{{ ${key} }}`;
                        handleChange(name, updated);

                        // Store the actual value too
                        setFormValues((prev) => ({
                            ...prev,
                            [`__${name}_dynamic_values__`]: {
                                ...(prev[`__${name}_dynamic_values__`] || {}),
                                [key]: val
                            }
                        }));
                    }}
                    onDragOver={(e) => e.preventDefault()}
                />
            );
        }

        if (prop.type === "fixedCollection" && prop.options) {
            const values = prop.options as FixedCollectionEntry[];
            return values.map((entry) => {
                const collectionKey = `${prop.name}.${entry.name}`;
                const paramList = formValues[prop.name]?.[entry.name] || [];

                // Show one default row if empty
                const effectiveParamList = paramList.length === 0 ? [{ name: "", value: "" }] : paramList;

                const updateParam = (index: number, field: string, val: string) => {
                    const updated = [...effectiveParamList];
                    updated[index] = { ...updated[index], [field]: val };
                    setFormValues((prev) => ({
                        ...prev,
                        [prop.name]: { ...(prev[prop.name] || {}), [entry.name]: updated }
                    }));
                };

                const addParam = () => {
                    const newList = [...effectiveParamList, { name: "", value: "" }];
                    setFormValues((prev) => ({
                        ...prev,
                        [prop.name]: { ...(prev[prop.name] || {}), [entry.name]: newList }
                    }));
                };

                const removeParam = (index: number) => {
                    const updated = effectiveParamList.filter((_: any, i: any) => i !== index);
                    setFormValues((prev) => ({
                        ...prev,
                        [prop.name]: { ...(prev[prop.name] || {}), [entry.name]: updated }
                    }));
                };

                return (
                    <div key={entry.name} className="mb-3">
                        {/* <label className="block font-semibold text-sm">{entry.displayName}</label> */}
                        {effectiveParamList.map((param: any, index: number) => (
                            <div key={index} className="flex gap-2 items-center mb-2">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className="border px-2 py-1 w-1/2 bg-black"
                                    value={param.name}
                                    onChange={(e) => updateParam(index, "name", e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Value"
                                    className="border px-2 py-1 w-1/2 bg-black"
                                    value={param.value}
                                    onChange={(e) => updateParam(index, "value", e.target.value)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const key = e.dataTransfer.getData("application/json-key");
                                        const val = JSON.parse(e.dataTransfer.getData("application/json-value"));
                                        updateParam(index, "value", `{{ ${key} }}`);
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                />
                                {effectiveParamList.length > 1 && (
                                    <button onClick={() => removeParam(index)} className="text-red-600 text-sm">🗑️</button>
                                )}
                            </div>
                        ))}
                        <Button
                            onClick={addParam}
                            variant="outline"
                            className="bg-primary/50"
                        >
                            + Add Parameter
                        </Button>
                    </div>
                );
            });
        }


        return null;
    };

    console.log("Prev Node Outputs: ", prevNodeOutputs)

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center">
            <div className="w-[90vw] h-[90vh] rounded-md p-4 flex rounded-xl neumorphic border-none bg-gradient-to-b from-background/95 to-background shadow-[0_0_20px_4px_rgba(255,255,255,0.5)]">

                {/* Left: Previous outputs */}
                <div className="w-1/3 p-3 border-r-2 overflow-auto">
                    <h3 className="font-semibold text-sm mb-2">Previous Outputs</h3>
                    {Object.entries(prevNodeOutputs).map(([nodeName, nodeData]) => (
                        <div key={nodeName} className="mb-3">
                            <div className="font-bold text-sm mb-1">{nodeName}</div>
                            <div className="bg-primary/20 p-2 rounded text-xs">
                                <ExpandableJson data={nodeData} nodeName={nodeName} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Center: Dynamic Form */}
                <div className="w-1/3 border-r-2">
                    <div className="header w-full flex items-center justify-between gap-2 px-3 py-3">
                        <div className="left flex items-center gap-2">
                            <img src={node.iconUrl?.light} alt={node.name} className="w-[1.5rem] h-[1.5rem]" />
                            <h3 className="font-semibold text-sm">{node.displayName}</h3>
                        </div>
                        <div className="right">
                            <Button variant={"outline"} className="bg-primary" onClick={testStep}>
                                Test Step
                            </Button>
                        </div>
                    </div>
                    <div className="w-full h-[94%] px-3 pb-3 overflow-auto">
                        {node.properties.map((prop) => (
                            shouldDisplay(prop) && (
                                <div key={prop.name} className="mb-4">
                                    <label className="block text-xs font-medium mb-1">{prop.displayName}</label>
                                    {renderInput(prop)}
                                </div>
                            )
                        ))}
                    </div>
                </div>

                {/* Right: Output */}
                <div className="w-1/3 p-3">
                    <h3 className="font-semibold text-sm mb-2">Output</h3>
                    <div className="text-xs p-2 rounded h-full overflow-auto">
                        {error ? (
                            <div>
                                <h2 className="text-red-600 text-lg font-medium">Error</h2>
                                <p className="text-gray-500">{error}</p>
                            </div>
                        ) : output ? (
                            <ExpandableJson data={output} />
                        ) : (
                            "No output yet."
                        )}
                    </div>
                </div>

            </div>
            <button className="absolute top-4 right-4 text-white text-xl" onClick={onClose}>×</button>
        </div>
    );
};

export default NodeConfigModal;