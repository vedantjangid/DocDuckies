// BarchartChart.tsx
import React from 'react';
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart";
import { CartesianGrid, XAxis, YAxis, Bar, BarChart, ResponsiveContainer } from "recharts";

interface BarchartChartProps {
    data: { name: string; value: number | null }[];
}

export const BarchartChart = ({ data }: BarchartChartProps) => {
    const validData = data.filter(item => item.value !== null);

    if (validData.length === 0) {
        return <div>No valid data available</div>;
    }

    const chartConfig = {
        bar: { theme: { light: "#8884d8", dark: "#8884d8" } }
    };

    return (
        <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={validData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
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
                    <Bar dataKey="value" fill={chartConfig.bar.theme.light} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};
