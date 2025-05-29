import AgentsPage from "@/Components/NewDesign/Agents/Agents";
import { PYTHON_SERVER_URL } from "@/config/constants";

async function fetchInitialAgents() {
  const query = new URLSearchParams({
    skip: "0",
    limit: "10",
    is_favourite: "false",
    search_query: "",
  });

  try {
    const res = await fetch(
      `${PYTHON_SERVER_URL}/api/v1/agents/list-agents/?${query.toString()}`,
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

export default async function Page() {
  const initialAgentsData = await fetchInitialAgents();

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] text-white">
      <AgentsPage initialAgents={initialAgentsData} />
    </main>
  );
}
