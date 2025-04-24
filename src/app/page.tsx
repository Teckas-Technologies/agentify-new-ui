import Dashboard from "@/Components/NewDesign/Dashboard/Dashboard";
import { PYTHON_SERVER_URL } from "@/config/constants";

export default async function Page() {
  const address = "user123";

  let stats = [];
  let chainActivity = [];
  let gasDetails = [];
  let agentUsage = [];

  if (address) {
    const query = new URLSearchParams({ user_id: address });

    const endpoints = {
      stats: `${PYTHON_SERVER_URL}/api/dashboard/stats?${query.toString()}`,
      chainActivity: `${PYTHON_SERVER_URL}/api/dashboard/chainActivity?${query.toString()}`,
      gasDetails: `${PYTHON_SERVER_URL}/api/dashboard/gasDetails?${query.toString()}`,
      agentUsage: `${PYTHON_SERVER_URL}/api/dashboard/agentUsage?${query.toString()}`, // updated endpoint
    };

    try {
      const [statsRes, chainActivityRes, gasDetailsRes, agentUsageRes] = await Promise.all([
        fetch(endpoints.stats, { cache: "no-store" }),
        fetch(endpoints.chainActivity, { cache: "no-store" }),
        fetch(endpoints.gasDetails, { cache: "no-store" }),
        fetch(endpoints.agentUsage, { cache: "no-store" }),
      ]);

      const [statsData, chainActivityData, gasDetailsData, agentUsageData] = await Promise.all([
        statsRes.json(),
        chainActivityRes.json(),
        gasDetailsRes.json(),
        agentUsageRes.json(),
      ]);

      stats = statsData.data || [];
      chainActivity = chainActivityData.data || [];
      gasDetails = gasDetailsData.data || [];
      agentUsage = agentUsageData.data || [];

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] text-white">
      <Dashboard
        stats={stats}
        chainActivity={chainActivity}
        gasDetails={gasDetails}
        agentUsage={agentUsage}
      />
    </main>
  );
}
