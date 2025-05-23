// File: /pages/api/test-node.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { node, input } = req.body;

    if (!node || !input) return res.status(400).json({ message: "Missing node or input" });

    try {
        if (node.name === "n8n-nodes-base.httpRequest") {
            const { method, url, sendHeaders, headerParameters, sendQuery, queryParameters, sendBody, jsonBody, bodyParameters, contentType } = input;

            const headers: Record<string, string> = {};
            if (sendHeaders && headerParameters?.parameters) {
                for (const { name, value } of headerParameters.parameters) {
                    if (name && value) headers[name] = value;
                }
            }

            const queryParams: Record<string, string> = {};
            if (sendQuery && queryParameters?.parameters) {
                for (const { name, value } of queryParameters.parameters) {
                    if (name && value) queryParams[name] = value;
                }
            }

            const searchParams = new URLSearchParams(queryParams).toString();
            const finalUrl = searchParams ? `${url}?${searchParams}` : url;

            let body: any = undefined;
            if (sendBody) {
                if (jsonBody) {
                    body = typeof jsonBody === "string" ? JSON.parse(jsonBody) : jsonBody;
                } else if (bodyParameters?.parameters) {
                    body = {};
                    for (const { name, value } of bodyParameters.parameters) {
                        if (name && value) body[name] = value;
                    }
                }
            }

            const methodUpper = method?.toUpperCase?.() || "GET";

            const fetchOptions: RequestInit = {
                method: methodUpper,
                headers: {
                    ...headers,
                    "Accept": "application/json"
                },
            };


            console.log({
                method: methodUpper,
                finalUrl,
                headers,
                body,
            });


            if (sendBody && methodUpper !== "GET" && methodUpper !== "HEAD" && body) {
                fetchOptions.body = JSON.stringify(body);
            }

            const response = await fetch(finalUrl, fetchOptions);

            const responseData = await response.json().catch(() => response.text());
            return res.status(200).json({ status: response.status, data: responseData });
        }

        return res.status(400).json({ message: "Unsupported node type" });
    } catch (err: any) {
        return res.status(500).json({ message: err.message || "Execution failed" });
    }
}
