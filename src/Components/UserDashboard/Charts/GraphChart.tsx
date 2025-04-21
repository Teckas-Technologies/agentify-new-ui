"use client";

import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import useFetchGraphData from "@/hooks/useDashboardGraph";

const transformMonthlyTransactions = (transactions: { month: string; transactions: number }[]): number[] => {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return months.map((month) => {
        const transactionData = transactions.find((m) => m.month === month);
        return transactionData ? transactionData.transactions : 0;
    });
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type LineChartRef = MutableRefObject<ChartJS<"line"> | null>;

interface Props {
    userId: string;
    agentId: string;
    year: number;
}

export const GraphChart: React.FC<Props> = ({ userId, agentId, year }) => {
    const chartRef: LineChartRef = useRef(null);
    const [values, setValues] = useState<number[]>([]);
    const { graphData, loading, error, fetchGraphData } = useFetchGraphData(userId, agentId, year);

    useEffect(() => {
        fetchGraphData();
    }, [fetchGraphData]);

    useEffect(() => {
        const chart = chartRef.current;

        if (chart) {
            const ctx = chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
            gradient.addColorStop(0, "rgba(75, 192, 192, 0.4)");
            gradient.addColorStop(1, "rgba(75, 192, 192, 0)");

            chart.data.datasets[0].backgroundColor = gradient;
            chart.update();
        }
    }, []);

    useEffect(() => {
        if (graphData && graphData.length > 0) {
            const data = transformMonthlyTransactions(graphData);
            setValues(data);
        }
    }, [graphData]);

   
    if (error) return <div>Error: {error}</div>;

    const dataValues = values || Array(12).fill(0);
    const minValue = Math.min(...dataValues);
    const maxValue = Math.max(...dataValues);

    const data = {
        labels: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
        datasets: [
            {
                label: `Total Transactions - ${year}`,
                data: dataValues,
                fill: true,
                backgroundColor: "rgba(0, 123, 255, 0.2)",
                borderColor: "#293B93",
                tension: 0.4,
                pointBackgroundColor: "#91D695",
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        return `${context.dataset.label}: ${context.parsed.y}`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (tickValue: string | number) {
                        return `${Number(tickValue)}`;
                    },
                },
            },
        },
    };

    return <Line ref={chartRef} data={data} options={options} />;
};