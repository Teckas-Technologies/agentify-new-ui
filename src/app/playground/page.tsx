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

  const res = await fetch(`${PYTHON_SERVER_URL}/api/v1/agents/?${query.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data?.data || [];
}

export default async function ChatPage() {
  const initialAgentsData = await fetchInitialAgents();

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] text-white">
      <Playground initialAgentsData={initialAgentsData} />
    </main>
  );
}
