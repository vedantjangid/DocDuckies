// LinechartChart.tsx
import React from 'react';
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart"
import { CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer } from "recharts"

interface LinechartChartProps {
    data: { name: string; value: number }[];
}

export function LinechartChart({ data }: LinechartChartProps) {
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
                <LineChart data={data} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Line dataKey="value" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot={true} />
                </LineChart>
            </ChartContainer>
        </ResponsiveContainer>
    );
}