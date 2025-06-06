import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  TooltipProps
} from "recharts";

import { Props as DefaultLegendProps } from 'recharts/types/component/DefaultLegendContent';
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

interface AgentUsageData {
  agentName: string;
  percentage: number;
}

interface AgentUsageChartProps {
  data: AgentUsageData[];
}

const getColorForAgent = (agentName: string) => {
  const mapping: Record<string, string> = {
    "Swap Agent": "hsl(262, 83.3%, 57.8%)",        // Purple
    "Bridge Agent": "hsl(12, 76.4%, 64.7%)",       // Orange
    "Lend and Borrow agent": "hsl(142, 76.2%, 36.3%)", // Green
    "Berachain Swap Agent": "hsl(48, 100%, 50%)",  // Yellow
  };
  return mapping[agentName] || "#ccc"; // fallback color
};
const formatAgentLabel = (agentName: string) => {
  const mapping: Record<string, string> = {
    "Swap Agent": "Swap",
    "Bridge Agent": "Bridge",
    "Lend and Borrow agent": "Lend",
    "Berachain Swap Agent": "Berachain Swap",
  };
  return mapping[agentName] || agentName;
};

const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const { agentName, percentage } = payload[0].payload;
    return (
      <div className="bg-black text-white text-sm px-3 py-1 rounded shadow border border-[#26262a]">
        {`${formatAgentLabel(agentName)}: ${percentage.toFixed(2)}%`}
      </div>
    );
  }
  return null;
};

const renderLegend = (props: DefaultLegendProps): React.ReactNode => {
  const { payload } = props;
  return (
    <ul className="flex justify-center gap-4 mt-2">
      {payload?.map((entry, index) => {
        const raw = entry.payload as unknown;

        // Safely narrow down the type
        if (
          typeof raw === "object" &&
          raw !== null &&
          "agentName" in raw &&
          "percentage" in raw
        ) {
          const data = raw as AgentUsageData;

          return (
            <li key={`item-${index}`} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getColorForAgent(data.agentName) }}
              />
              <span style={{ color: getColorForAgent(data.agentName) }}>
                {formatAgentLabel(data.agentName)}
              </span>
            </li>
          );
        }

        // Fallback (optional)
        return null;
      })}
    </ul>
  );
};

export const AgentUsageChart = ({ data }: AgentUsageChartProps) => {
  const formattedData = data.map((entry) => ({
    ...entry,
    name: entry.agentName, // used by Legend
  }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={50}
            fill="#8884d8"
            dataKey="percentage"
            paddingAngle={3}
          >
            {formattedData.map((entry, index) => ( // ✅ use formattedData here too
              <Cell key={`cell-${index}`} fill={getColorForAgent(entry.agentName)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />

          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
