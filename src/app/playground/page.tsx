import Playground from '@/Components/NewDesign/playground/Playground';
import { PYTHON_SERVER_URL } from '@/config/constants';
import React from 'react';

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

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] text-white">
      <Playground initialAgentsData={initialAgentsData} />
    </main>
  );
}
