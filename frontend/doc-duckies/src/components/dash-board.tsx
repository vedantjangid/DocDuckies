// dash-board.tsx
"use client"

import React, { useState } from "react"
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { BarchartChart } from "./charts/BarchartChart"
import { LinechartChart } from "./charts/LinechartChart"
import { PiechartlabelChart } from "./charts/PiechartlabelChart"
import { CheckIcon, GithubIcon, MountainIcon, UploadIcon } from "./icons"
import { handleFileUpload } from "@/lib/api"
import { FinancialData, initialFinancialData, processFinancialData } from "@/components/charts/data"

export function DashBoard() {
  const { user, error, isLoading } = useUser();
  const [financialData, setFinancialData] = useState<FinancialData>(initialFinancialData);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        setIsUploading(true);
        setUploadError(null);
        const data = await handleFileUpload(file)
        const processedData = processFinancialData(data);
        setFinancialData(processedData);
        setUploadedFiles([...uploadedFiles, file.name]);
      } catch (error) {
        console.error("Error processing file:", error)
        setUploadError("Failed to process file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  const incomeExpenditureData = [
    { name: 'Income', value: financialData['Total-Income'] },
    { name: 'Expenditure', value: financialData['Total-Expenditure'] }
  ].filter(item => item.value !== null);

  const assetsLiabilitiesData = [
    { name: 'Assets', value: financialData['Total-Assets'] },
    { name: 'Liabilities', value: financialData['Total-Liabilities'] }
  ].filter(item => item.value !== null);

  const capitalStructureData = [
    { name: 'Capital', value: financialData['Capital'] },
    { name: 'Liabilities', value: financialData['Total-Liabilities'] }
  ].filter(item => item.value !== null);

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
                      Financial Data
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
              <h2 className="text-xl font-bold mb-4">Upload Financial Documents</h2>
              <div className="flex justify-center items-center h-32 border-2 border-dashed border-muted rounded-lg">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                >
                  {isUploading ? (
                    <span>Uploading...</span>
                  ) : (
                    <>
                      <UploadIcon className="h-8 w-8 mb-2" />
                      <span>Drop files here or click to upload</span>
                    </>
                  )}
                  <input id="file-upload" type="file" className="hidden" onChange={onFileUpload} disabled={isUploading} />
                </label>
              </div>
              {uploadError && <p className="text-red-500 mt-2">{uploadError}</p>}
              <div className="mt-4">
                {uploadedFiles.length > 0 && (
                  <ul className="space-y-2">
                    {uploadedFiles.map((fileName, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span>{fileName}</span>
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="bg-background rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Financial Data</h2>
              {financialData.Year ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(financialData).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell>{key}</TableCell>
                          <TableCell>{value !== null ? (typeof value === 'number' ? value.toFixed(2) : value) : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No financial data available. Please upload a document.</p>
              )}
            </div>
            <div className="bg-background rounded-lg shadow-md p-6 col-span-1 md:col-span-2">
              <h2 className="text-xl font-bold mb-4">Financial Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <CardDescription>Total Income vs Total Expenditure</CardDescription>
                    <CardTitle>{financialData.Year || 'N/A'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarchartChart data={incomeExpenditureData} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Assets and Liabilities</CardDescription>
                    <CardTitle>{financialData.Year || 'N/A'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LinechartChart data={assetsLiabilitiesData} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Capital Structure</CardDescription>
                    <CardTitle>{financialData.Year || 'N/A'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PiechartlabelChart data={capitalStructureData} />
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