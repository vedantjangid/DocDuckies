"use client"

import { useState } from "react"
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarchartChart } from "./charts/BarchartChart"
import { LinechartChart } from "./charts/LinechartChart"
import { PiechartlabelChart } from "./charts/PiechartlabelChart"
import { CheckIcon, GithubIcon, MailIcon, MountainIcon, UploadIcon } from "./icons"
import { handleFileUpload } from "@/lib/api"

export function DashBoard() {
  const { user, error, isLoading } = useUser();
  const [invoices, setInvoices] = useState([])
  const [csvData, setCsvData] = useState([])
  const [chartData, setChartData] = useState({})

  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const data = await handleFileUpload(file)
        setInvoices([...invoices, file.name])
        setCsvData(data.csvData)
        setChartData(data.chartData)
      } catch (error) {
        console.error("Error processing invoice:", error)
      }
    }
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="flex flex-col h-screen">
      {!user ? (
        <div className="flex items-center justify-center h-full">
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
        <div className="flex flex-col h-screen">
          <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="#" className="flex" prefetch={false}>
                <MountainIcon className="h-6 w-6" />
                <span className="pl-5">DocDuckies</span>
              </Link>
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="#"
                      className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:bg-primary/90 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/50 data-[state=open]:bg-primary/50"
                    >
                      Invoices
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/api/auth/logout">
                  <span className="font-black">Logout</span>
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="bg-background rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Upload Invoices</h2>
              <div className="flex justify-center items-center h-32 border-2 border-dashed border-muted rounded-lg">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                >
                  <UploadIcon className="h-8 w-8 mb-2" />
                  <span>Drop files here or click to upload</span>
                  <input id="file-upload" type="file" className="hidden" onChange={onFileUpload} />
                </label>
              </div>
              <div className="mt-4">
                {invoices.length > 0 && (
                  <ul className="space-y-2">
                    {invoices.map((invoice, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span>{invoice}</span>
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="bg-background rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Invoice Data</h2>
              {csvData.length > 0 ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.invoice}</TableCell>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>${row.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${row.status === "Paid" ? "bg-green-500 text-green-50" : "bg-yellow-500 text-yellow-50"
                                }`}
                            >
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No invoice data available.</p>
              )}
            </div>
            <div className="bg-background rounded-lg shadow-md p-6 col-span-1 md:col-span-2">
              <h2 className="text-xl font-bold mb-4">Financial Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <CardDescription>Net Sales</CardDescription>
                    <CardTitle>${chartData.netSales?.toFixed(2)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarchartChart className="aspect-[4/3]" data={chartData.netSalesData} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Gross Profit</CardDescription>
                    <CardTitle>${chartData.grossProfit?.toFixed(2)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LinechartChart className="aspect-[4/3]" data={chartData.grossProfitData} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Gross Margin</CardDescription>
                    <CardTitle>{chartData.grossMargin?.toFixed(2)}%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PiechartlabelChart className="aspect-[4/3]" data={chartData.grossMarginData} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  )
}