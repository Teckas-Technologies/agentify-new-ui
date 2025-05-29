// /pages/api/n8n/workflows.ts
import type { NextApiRequest, NextApiResponse } from "next";

const n8nApiUrl = "https://light-actually-whippet.ngrok-free.app/api/v1/workflows";
const apiKey = process.env.NEXT_PUBLIC_N8N_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY5NmY2ZS1iYWNjLTQ2MmUtYWRlYS0yMjhmNzI3NWRkYzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3Mjg2Mzk1LCJleHAiOjE3NDk4NzM2MDB9.M38ufmgvlPYaPH2tB-XRYBJzh7w6L4XPMhslEmzGiDQ";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === "GET") {
            // Build URL with query params forwarded from client
            const url = new URL(n8nApiUrl);
            Object.entries(req.query).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((v) => url.searchParams.append(key, v));
                } else if (value !== undefined) {
                    url.searchParams.append(key, value as string);
                }
            });

            const apiRes = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "X-N8N-API-KEY": apiKey,
                },
            });

            const data = await apiRes.json();
            return res.status(apiRes.status).json(data);
        } else if (req.method === "POST") {
            // POST payload directly to n8n server
            const apiRes = await fetch(n8nApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-N8N-API-KEY": apiKey,
                },
                body: JSON.stringify(req.body),
            });

            // const contentType = apiRes.headers.get("content-type");
            // if (contentType && contentType.includes("application/json")) {
            //     const data = await apiRes.json();
            //     return res.status(apiRes.status).json(data);
            // } else {
            //     const text = await apiRes.text(); // fallback to text for HTML errors
            //     console.error("Unexpected response:", text);
            //     return res.status(apiRes.status).json({
            //         message: "Unexpected response from n8n API",
            //         status: apiRes.status,
            //         body: text,
            //     });
            // }

            const data = await apiRes.json();
            return res.status(apiRes.status).json(data);
        } else {
            res.setHeader("Allow", ["GET", "POST"]);
            return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        console.error("Error in /api/n8n/workflows:", error);
        return res.status(500).json({ message: "Internal Server Error", error: (error as Error).message });
    }
}
