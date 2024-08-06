// LinechartChart.tsx
import React from 'react';
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart";
import { CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer } from "recharts";

interface LinechartChartProps {
    data: { name: string; value: number | null }[];
}

export function LinechartChart({ data }: LinechartChartProps) {
    const validData = data.filter(item => item.value !== null);

    if (validData.length === 0) {
        return <div>No valid data available</div>;
    }

    const chartConfig = {
        line: { theme: { light: "#8884d8", dark: "#8884d8" } }
    };

    return (
        <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={validData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    {/* <YAxis /> */}
                    <ChartTooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <ChartTooltipContent
                                        title={data.name}
                                        content={`${data.value}`}
                                    />
                                );
                            }
                            return null;
                        }}
                    />
                    <Line type="monotone" dataKey="value" stroke={chartConfig.line.theme.light} />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
