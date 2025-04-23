
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface AgentUsageData {
  name: string;
  value: number;
  color: string;
}

interface AgentUsageChartProps {
  data: AgentUsageData[];
}

export const AgentUsageChart = ({ data }: AgentUsageChartProps) => {
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
            dataKey="value"
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(240 10% 3.9%)', 
              borderColor: 'hsl(240 3.7% 15.9%)',
              borderRadius: '0.5rem',
              color: 'white'
            }} 
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
