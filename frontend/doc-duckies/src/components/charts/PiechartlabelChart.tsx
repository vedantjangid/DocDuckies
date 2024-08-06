// PiechartlabelChart.tsx
import React from 'react';
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

interface PiechartlabelChartProps {
    data: { name: string; value: number | null }[];
}

const COLORS = ['#0c9b9b', '#ad9374', '#c5613d', '#2bbf9f', '#1bd8ab'];

export function PiechartlabelChart({ data }: PiechartlabelChartProps) {
    const validData = data.filter(item => item.value !== null);

    if (validData.length === 0) {
        return <div>No valid data available</div>;
    }

    const chartConfig = {
        pie: { theme: { light: "#8884d8", dark: "#8884d8" } }
    };

    return (
        <ChartContainer config={chartConfig}>
            <PieChart>
                <Pie
                    data={validData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="var(--color-pie)"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {validData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <ChartTooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <ChartTooltipContent
                                    title={data.name}
                                    content={`$${data.value.toLocaleString()}`}
                                />
                            );
                        }
                        return null;
                    }}
                />
            </PieChart>
        </ChartContainer>
    );
}
