import type { NextApiRequest, NextApiResponse } from "next";

const baseUrl = "https://light-actually-whippet.ngrok-free.app/api/v1/workflows";
const apiKey = process.env.NEXT_PUBLIC_N8N_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGY5NmY2ZS1iYWNjLTQ2MmUtYWRlYS0yMjhmNzI3NWRkYzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3Mjg2Mzk1LCJleHAiOjE3NDk4NzM2MDB9.M38ufmgvlPYaPH2tB-XRYBJzh7w6L4XPMhslEmzGiDQ";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    if (typeof id !== "string") {
        return res.status(400).json({ message: "Invalid workflow ID" });
    }

    try {
        const apiRes = await fetch(`${baseUrl}/${id}/activate`, {
            method: "POST",
            headers: {
                "X-N8N-API-KEY": apiKey,
            },
        });

        const data = await apiRes.json();
        return res.status(apiRes.status).json(data);
    } catch (error) {
        console.error("Error activating workflow:", error);
        return res.status(500).json({ message: "Internal Server Error", error: (error as Error).message });
    }
}
