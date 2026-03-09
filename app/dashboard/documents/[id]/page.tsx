"use client"

import { use } from "react"
import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"
import { createAuthFetcher } from "@/lib/fetcher"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  ArrowLeft,
  Hash,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import type { DocumentViewData } from "@/lib/types"
import { ROLE_LABELS } from "@/lib/types"

function VerificationPanel({ docId, token }: { docId: number; token: string | null }) {
  const fetcher = createAuthFetcher(token)
  const { data, isLoading, mutate } = useSWR(
    token ? `/api/documents/${docId}/verify` : null,
    fetcher
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          Blockchain Integrity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-20 animate-pulse bg-muted rounded" />
        ) : data?.verified ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Verified on Ethereum</span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-20">TX Hash:</span>
                <code className="font-mono text-card-foreground bg-muted px-2 py-0.5 rounded truncate max-w-[200px]">
                  {data.tx_hash}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-20">Block:</span>
                <code className="font-mono text-card-foreground bg-muted px-2 py-0.5 rounded">
                  #{data.block_number}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-20">SHA-256:</span>
                <code className="font-mono text-card-foreground bg-muted px-2 py-0.5 rounded truncate max-w-[200px]">
                  {data.sha256_hash}
                </code>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-fit mt-1" onClick={() => mutate()}>
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Re-verify
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Not verified on blockchain</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This document has no blockchain record. Deploy the smart contract to enable verification.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DocumentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { token } = useAuth()
  const fetcher = createAuthFetcher(token)
  const { data, isLoading } = useSWR<DocumentViewData>(
    token ? `/api/documents/${id}` : null,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 bg-muted animate-pulse rounded w-64" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <FileText className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Document not found</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link href="/dashboard/documents">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Link>
        </Button>
      </div>
    )
  }

  const { document: doc, columns } = data
  const accessibleColumns = columns.filter((c) => c.accessible)
  const deniedColumns = columns.filter((c) => !c.accessible)
  const maxRows = Math.max(...columns.map((c) => c.data?.length || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">{doc.document_name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {doc.row_count} rows
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(doc.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Document Data
              </CardTitle>
              <CardDescription>
                {accessibleColumns.length} of {columns.length} columns accessible.
                {deniedColumns.length > 0 && (
                  <span className="text-destructive ml-1">
                    {deniedColumns.length} column{deniedColumns.length > 1 ? "s" : ""} restricted.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap mb-4">
                {columns.map((col) => (
                  <TooltipProvider key={col.name}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          variant="outline"
                          className={
                            col.accessible
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-destructive/15 text-destructive border-destructive/30"
                          }
                        >
                          {col.accessible ? (
                            <Unlock className="h-3 w-3 mr-1" />
                          ) : (
                            <Lock className="h-3 w-3 mr-1" />
                          )}
                          {col.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {col.accessible
                            ? "You have access to this column"
                            : "ACCESS DENIED - Your role cannot view this column"}
                        </p>
                        {"allowed_roles" in col && (
                          <p className="text-xs mt-1">
                            Allowed: {((col as { allowed_roles?: string[] }).allowed_roles ?? []).map((r) => ROLE_LABELS[r as keyof typeof ROLE_LABELS] || r).join(", ")}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>

              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground w-12">#</TableHead>
                      {columns.map((col) => (
                        <TableHead key={col.name} className="text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {col.accessible ? (
                              <Unlock className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Lock className="h-3 w-3 text-destructive" />
                            )}
                            {col.name}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: maxRows }, (_, rowIdx) => (
                      <TableRow key={rowIdx} className="border-border">
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {rowIdx + 1}
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col.name}>
                            {col.accessible ? (
                              <span className="text-sm text-card-foreground">
                                {col.data?.[rowIdx]?.val ?? ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2 py-1 text-xs font-mono text-destructive border border-destructive/20">
                                <Lock className="h-3 w-3" />
                                ACCESS_DENIED
                              </span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <VerificationPanel docId={parseInt(id)} token={token} />

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Access Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Accessible</span>
                  <span className="font-medium text-emerald-400">{accessibleColumns.length} columns</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Restricted</span>
                  <span className="font-medium text-destructive">{deniedColumns.length} columns</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total rows</span>
                  <span className="font-medium text-card-foreground">{doc.row_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
