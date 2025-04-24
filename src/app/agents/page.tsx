import AgentsPage from "@/Components/NewDesign/Agents/Agents";
import { PYTHON_SERVER_URL } from "@/config/constants";

export default async function Page() {
  const userId = "demo_user";
  const query = new URLSearchParams({
    user_id: userId,
    skip: "0",
    limit: "6",
    search_query: "",
    is_favourite: "false",
  });
  const url = `${PYTHON_SERVER_URL}/api/v1/agents/?${query.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  console.log("Server Res:", data)

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] text-white">
      <AgentsPage initialAgents={data.data || []} />
    </main>
  );
}
