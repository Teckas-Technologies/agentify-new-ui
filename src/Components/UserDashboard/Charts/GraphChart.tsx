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

const transformMonthlyRent = (totalItx: { month: string; totalItx: number }[]): number[] => {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Create an array of 12 elements, filling missing months with 0
    return months.map((month) => {
        const rentData = totalItx.find((m) => m.month === month);
        return rentData ? rentData.totalItx : 0;
    });
};

// Register the required chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type LineChartRef = MutableRefObject<ChartJS<"line"> | null>;

interface Props {
    monthlyItx: { month: string; totalItx: number }[] | undefined;
}

export const GraphChart: React.FC<Props> = ({ monthlyItx }) => {
    const chartRef: LineChartRef = useRef(null);
    const [values, setvalues] = useState<number[]>([]);

    useEffect(() => {
        const chart = chartRef.current;

        if (chart) {
            const ctx = chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
            gradient.addColorStop(0, "rgba(75, 192, 192, 0.4)"); // Light color at the top
            gradient.addColorStop(1, "rgba(75, 192, 192, 0)");   // Fully transparent at the bottom

            chart.data.datasets[0].backgroundColor = gradient;
            chart.update();
        }
    }, []);

    useEffect(() => {
        if (monthlyItx) {
            const data = transformMonthlyRent(monthlyItx);
            setvalues(data)
        }
    }, [monthlyItx])

    const dataValues = values || [32000, 33000, 31000, 34000, 29000, 35000, 37000, 34000, 32000, 31000, 45000, 28000];
    const minValue = Math.min(...dataValues);
    const maxValue = Math.max(...dataValues);

    const year = new Date().getFullYear();

    const data = {
        labels: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
        datasets: [
            {
                label: `Total Revenue - ${year}`,
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
                // min: minValue,
                // max: maxValue,
                ticks: {
                    callback: function (tickValue: string | number) {
                        return `${Number(tickValue)}`;
                    },
                },
            },
        },
    };
    return (
        <Line ref={chartRef} data={data} options={options} />
    )
}