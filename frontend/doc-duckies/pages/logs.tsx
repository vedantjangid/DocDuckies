// logs.tsx
"use client"

import { useState, useMemo, ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import "@/app/globals.css"

type Log = {
    id: number;
    timestamp: string;
    message: string;
    severity: "info" | "warning" | "error";
};

export default function Logs() {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [logs, setLogs] = useState<Log[]>([
        {
            id: 1,
            timestamp: "2023-04-15 10:30:00",
            message: "Server started successfully",
            severity: "info",
        },
        {
            id: 2,
            timestamp: "2023-04-15 11:15:30",
            message: "Database connection established",
            severity: "info",
        },
        {
            id: 3,
            timestamp: "2023-04-15 12:45:20",
            message: "User login failed due to invalid credentials",
            severity: "warning",
        },
        {
            id: 4,
            timestamp: "2023-04-15 14:20:10",
            message: "API endpoint not found",
            severity: "error",
        },
        {
            id: 5,
            timestamp: "2023-04-15 15:35:45",
            message: "File upload completed successfully",
            severity: "info",
        },
    ])

    const severityToVariant: Record<Log['severity'], "default" | "destructive" | "outline" | "secondary"> = {
        info: "default",
        warning: "destructive",
        error: "outline",
    }

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => log.message.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [logs, searchTerm])

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="bg-muted py-6 px-4 md:px-6">
                <div className="container max-w-5xl">
                    <h1 className="text-3xl font-bold">Logs</h1>
                </div>
            </header>
            <main className="flex-1 py-8 px-4 md:px-6">
                <div className="container max-w-5xl">
                    <div className="flex items-center mb-6">
                        <Input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="flex-1 mr-4"
                        />
                        <Button>Search</Button>
                    </div>
                    <div className="grid gap-4">
                        {filteredLogs.map((log) => (
                            <Card key={log.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">{log.timestamp}</div>
                                        <Badge
                                            variant={severityToVariant[log.severity]}
                                        >
                                            {log.severity}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p>{log.message}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}