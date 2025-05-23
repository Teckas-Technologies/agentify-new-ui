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

export const useSaveWorkflowOnN8N = () => {
    const saveWorkflowOnN8N = useCallback(async (payload: SaveWorkflowPayload): Promise<Response> => {
        const apiUrl = 'https://light-actually-whippet.ngrok-free.app/api/v1/workflows';
        const apiKey = process.env.NEXT_PUBLIC_N8N_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY5NmY2ZS1iYWNjLTQ2MmUtYWRlYS0yMjhmNzI3NWRkYzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3Mjg2Mzk1LCJleHAiOjE3NDk4NzM2MDB9.M38ufmgvlPYaPH2tB-XRYBJzh7w6L4XPMhslEmzGiDQ";

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': `${apiKey}`,  // maybe needed Bearer 
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Failed to save workflow: ${res.status} ${res.statusText}\n${errorBody}`);
        }

        return res;
    }, []);

    return { saveWorkflowOnN8N };
};
