// PiechartlabelChart.tsx
import React from 'react';
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface PiechartlabelChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#0088FE', '#00C49F'];

export function PiechartlabelChart({ data }: PiechartlabelChartProps) {
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
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
            </ChartContainer>
        </ResponsiveContainer>
    );
}