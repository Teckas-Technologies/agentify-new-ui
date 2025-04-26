import Playground from '@/Components/NewDesign/playground/Playground';
import { PYTHON_SERVER_URL } from '@/config/constants';
import React from 'react';
// import { PrivyClient } from "@privy-io/server-auth";

async function fetchInitialAgents() {
  const query = new URLSearchParams({
    user_id: "demo_user", // or dynamic address
    skip: "0",
    limit: "10",
    is_favourite: "false",
    search_query: "",
  });

  try {
    const res = await fetch(
      `${PYTHON_SERVER_URL}/api/v1/agents/?${query.toString()}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to fetch agents. Server response:", errorText);
      return [];
    }

    const data = await res.json();
    return data?.data || [];
  } catch (error) {
    console.error("Error while fetching agents:", error);
    return [];
  }
}

export default async function ChatPage() {
  const initialAgentsData = await fetchInitialAgents();

  // const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID || "", process.env.NEXT_PUBLIC_PRIVY_SECRET || "");

  // const getToken = async () => {
  //   if (!privy) return;
  //   const accessToken = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkYxcFVUM1ppMTJLWUhrZDJvOGdEdUZNTEpBWVBnOWIzUTZDNVFGdmtMVEEifQ.eyJzaWQiOiJjbTl3aTByNGcwMHhrbDcwbnZueWxubm50IiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NDU2NDc1ODUsImF1ZCI6ImNtOWs2NWYzNjAycGxsMTBtYThuajJwbzciLCJzdWIiOiJkaWQ6cHJpdnk6Y205azY3cWF3MDEzeGw1MG02NGNyMzlhbiIsImV4cCI6MTc0NTY1MTE4NX0.LUnwt0FlRoenLosWNyFG6lK-hfGi7KLAysPEW10NS4gdIaQTI5LIaWueAHb3PDshwdB14H4kMp0vh-xeUOazDw"
  //   try {
  //     const verifiedClaims = await privy.verifyAuthToken(accessToken);
  //     console.log("Claims:", verifiedClaims)
  //   } catch (error) {
  //     console.log(`Token verification failed with error ${error}.`);
  //   }
  // }

  // getToken()

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] text-white">
      <Playground initialAgentsData={initialAgentsData} />
    </main>
  );
}
