"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BarChartData {
  name: string;
  value: number;
}

interface BarChartComponentProps {
  data: BarChartData[];
  title?: string;
  yAxisLabel?: string;
  barColor?: string;
}

export const BarChartComponent = ({
  data,
  title,
  yAxisLabel,
  barColor = "hsl(var(--primary))",
}: BarChartComponentProps) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-base font-medium mb-2">{title}</h3>}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              label={{ 
                value: yAxisLabel, 
                angle: -90, 
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "hsl(var(--muted-foreground))" },
                dy: 50
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(240 10% 3.9%)", 
                borderColor: "hsl(240 3.7% 15.9%)",
                borderRadius: "0.5rem"
              }} 
            />
            <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
