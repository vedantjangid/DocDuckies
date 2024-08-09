// /pages/logs.tsx
"use client"

import React, { useState, useEffect } from "react"
import "../src/app/globals.css"
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { GithubIcon } from "@/components/icons"
import { testLogAction } from '@/lib/logging';
import Image from 'next/image';
import duckLogo from '@/Logo/duck-svgrepo-com.svg';

interface Log {
    timestamp: string;
    level: string;
    message: string;
}

export default function Logs() {
    const { user, error, isLoading } = useUser();
    const [currentPage, setCurrentPage] = useState(1)
    const [logsPerPage] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [logs, setLogs] = useState<Log[]>([])

    const fetchLogs = async () => {
        try {
            console.log('Fetching logs...');
            const response = await fetch('/api/log');
            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }
            const data = await response.json();
            console.log('Received logs:', data);
            setLogs(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    useEffect(() => {
        fetchLogs();
        // Set up an interval to fetch logs every 10 seconds
        const intervalId = setInterval(fetchLogs, 10000);

        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, []);

    const filteredLogs = logs.filter((log) =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.level.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastLog = currentPage * logsPerPage
    const indexOfFirstLog = indexOfLastLog - logsPerPage
    const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

    const handlePageChange = (pageNumber: number) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber)
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    const handleTestLog = async () => {
        await testLogAction();
        // Fetch logs immediately after creating a test log
        fetchLogs();
    };

    const getLevelVariant = (level: string) => {
        switch (level.toLowerCase()) {
            case 'info':
                return 'default'
            case 'warning':
                return 'secondary'
            case 'error':
                return 'destructive'
            default:
                return 'outline'
        }
    }

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>{error.message}</div>;

    return (
        <div className="flex flex-col min-h-screen">
            {!user ? (
                <div className="flex items-center justify-center flex-grow">
                    <Card className="w-full max-w-md">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl">Sign in to your account</CardTitle>
                            <CardDescription>Choose a method to sign in to your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Button variant="outline" asChild>
                                <Link href="/api/auth/login">
                                    <GithubIcon className="mr-2 h-4 w-4" />
                                    Sign in with Auth0
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <>
                    <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="#" className="flex" prefetch={false}>
                                <Image src={duckLogo} alt="Logo" width={24} height={24} />
                                <span className="pl-5">DocDuckies</span>
                            </Link>
                            <NavigationMenu>
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <NavigationMenuLink
                                            href="/"
                                            className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:bg-primary/90 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/50 data-[state=open]:bg-primary/50"
                                        >
                                            Dashboard
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="destructive" asChild>
                                <Link href="/api/auth/logout">
                                    <span className="font-black">Logout</span>
                                </Link>
                            </Button>
                        </div>
                    </header>
                    <main className="flex-grow p-8">
                        <div className="flex flex-col gap-6 max-w-6xl mx-auto">
                            <div className="flex items-center gap-4 mb-4">
                                <h1 className="text-2xl font-bold">Logs</h1>
                                <div className="flex-1">
                                    <Input
                                        type="search"
                                        placeholder="Search logs..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                    />
                                </div>
                                <Button onClick={handleTestLog}>
                                    Create Test Log
                                </Button>
                                <Button onClick={fetchLogs}>
                                    Refresh Logs
                                </Button>
                            </div>
                            <div className="overflow-auto max-h-[500px] rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Message</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentLogs.map((log, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{log.timestamp}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={getLevelVariant(log.level)}
                                                        className="font-semibold"
                                                    >
                                                        {log.level.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{log.message}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex justify-center mt-4">
                                <Pagination>
                                    <PaginationContent className="space-x-1">
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <PaginationItem key={page}>
                                                <PaginationLink onClick={() => handlePageChange(page)} isActive={page === currentPage}>
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </div>
                    </main>
                </>
            )}
        </div>
    )
}
