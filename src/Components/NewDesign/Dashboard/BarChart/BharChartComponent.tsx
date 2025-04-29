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
  day: string;
  gas: number;
}

interface BarChartComponentProps {
  data: BarChartData[];
  title?: string;
  yAxisLabel?: string;
  barColor?: string;
}
// Map long weekday names to short ones
const shortDayMap: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// Desired display order
const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const BarChartComponent = ({
  data,
  title,
  yAxisLabel,
  barColor = "hsl(var(--primary))",
}: BarChartComponentProps) => {
  // Format and sort the data based on day order
  const formattedData = data
    .map((item) => ({
      ...item,
      day: shortDayMap[item.day] || item.day,
    }))
    .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
  return (
    <div className="w-full">
      {title && <h3 className="text-base font-medium mb-2">{title}</h3>}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="day" 
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
              formatter={(value: number) => value.toFixed(4)}
              contentStyle={{ 
                backgroundColor: "hsl(240 10% 3.9%)", 
                borderColor: "hsl(240 3.7% 15.9%)",
                borderRadius: "0.5rem"
              }} 
            />
            <Bar dataKey="gas" fill={barColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
