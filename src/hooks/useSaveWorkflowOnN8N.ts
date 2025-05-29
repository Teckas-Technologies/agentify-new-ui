import { useCallback } from 'react';

type Credential = {
    id: string;
    name: string;
};

type Node = {
    id: string;
    name: string;
    type: string;
    typeVersion: number;
    position: [number, number];
    parameters: Record<string, any>;
    credentials?: {
        [key: string]: Credential;
    };
};

type Connection = {
    [nodeName: string]: {
        main: Array<Array<{
            node: string;
            type: string;
            index: number;
        }>>;
    };
};

type Settings = {
    executionTimeout: number;
    saveDataSuccessExecution: string;
    saveDataErrorExecution: string;
    saveExecutionProgress: boolean;
    saveManualExecutions: boolean;
    timezone: string;
};

export interface SaveWorkflowPayload {
    name: string;
    nodes: Node[];
    connections: Connection;
    settings: Settings;
    staticData?: Record<string, any>;
}

type GetWorkflowsQuery = {
    active?: boolean;
    tags?: string;
    name?: string;
    projectId?: string;
    excludePinnedData?: boolean;
    limit?: number;
};

export const useSaveWorkflowOnN8N = () => {
    const apiUrl = 'https://light-actually-whippet.ngrok-free.app/api/v1/workflows';
    const apiKey = process.env.NEXT_PUBLIC_N8N_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY5NmY2ZS1iYWNjLTQ2MmUtYWRlYS0yMjhmNzI3NWRkYzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3Mjg2Mzk1LCJleHAiOjE3NDk4NzM2MDB9.M38ufmgvlPYaPH2tB-XRYBJzh7w6L4XPMhslEmzGiDQ";

    const saveWorkflowOnN8N = useCallback(async (payload: SaveWorkflowPayload) => {
        try {
            const res = await fetch("/api/n8n/workflow", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`Failed to save workflow: ${res.status} ${res.statusText}\n${errorBody}`);
            }

            return res.json();
        } catch (error) {
            console.error("Error saving workflow:", error);
            throw error;
        }
    }, []);

    const getWorkflowsFromN8N = useCallback(async (query?: GetWorkflowsQuery): Promise<any> => {
        try {
            const url = new URL("/api/n8n/workflow", window.location.origin);

            if (query) {
                Object.entries(query).forEach(([key, value]) => {
                    if (value !== undefined) {
                        url.searchParams.append(key, String(value));
                    }
                });
            }

            const res = await fetch(url.toString(), {
                method: "GET",
            });

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(
                    `Failed to fetch workflows: ${res.status} ${res.statusText}\n${errorBody}`
                );
            }

            return res.json();
        } catch (error) {
            console.error("Error fetching workflow:", error);
            throw error;
        }
    }, []);

    const activateWorkflowOnN8N = useCallback(async (workflowId: string): Promise<any> => {
        try {
            const res = await fetch(`/api/n8n/activate?id=${workflowId}`, {
                method: "POST",
            });

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(
                    `Failed to activate workflow: ${res.status} ${res.statusText}\n${errorBody}`
                );
            }

            return res.json();
        } catch (error) {
            console.error("Error activating workflow:", error);
            throw error;
        }
    }, []);

    const deactivateWorkflowOnN8N = useCallback(async (workflowId: string): Promise<any> => {
        try {
            const res = await fetch(`/api/n8n/deactivate?id=${workflowId}`, {
                method: "POST",
            });

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(
                    `Failed to deactivate workflow: ${res.status} ${res.statusText}\n${errorBody}`
                );
            }

            return res.json();
        } catch (error) {
            console.error("Error deactivating workflow:", error);
            throw error;
        }
    }, []);

    return { saveWorkflowOnN8N, getWorkflowsFromN8N, activateWorkflowOnN8N, deactivateWorkflowOnN8N };
};
