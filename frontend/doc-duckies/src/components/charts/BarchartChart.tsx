// BarchartChart.tsx
import React from 'react';
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart";
import { CartesianGrid, XAxis, YAxis, Bar, BarChart, ResponsiveContainer } from "recharts";



interface BarchartChartProps {
    data: { name: string; value: number }[];
}



export const BarchartChart = ({ data }: { data: { name: string; value: number | null }[] }) => {
    const validData = data.filter(item => item.value !== null);

    if (validData.length === 0) {
        return <div>No valid data available</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <ChartContainer
                config={{
                    desktop: {
                        label: "Financial Data",
                        color: "hsl(var(--chart-1))",
                    },
                }}
            >
                <BarChart data={validData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-desktop)" radius={8} />
                </BarChart>
            </ChartContainer>
        </ResponsiveContainer>
    );
};