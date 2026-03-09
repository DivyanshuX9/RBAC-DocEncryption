"use client"

import { useRouter } from "next/navigation"
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
import { FileText, ShieldCheck, ShieldAlert, Eye, Upload, Columns } from "lucide-react"
import type { Document } from "@/lib/types"

export default function DocumentsPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const fetcher = createAuthFetcher(token)
  const { data: documents, isLoading } = useSWR<Document[]>(
    token ? "/api/documents" : null,
    fetcher
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse encrypted documents with role-based column access
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "teacher") && (
          <Button onClick={() => router.push("/dashboard/upload")}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">All Documents</CardTitle>
          <CardDescription>
            {documents?.length ?? 0} documents available. Column access depends on your role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Document</TableHead>
                    <TableHead className="text-muted-foreground">Creator</TableHead>
                    <TableHead className="text-muted-foreground">Columns</TableHead>
                    <TableHead className="text-muted-foreground">Rows</TableHead>
                    <TableHead className="text-muted-foreground">Integrity</TableHead>
                    <TableHead className="text-muted-foreground">Created</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => {
                    const schema = typeof doc.column_schema === "string"
                      ? JSON.parse(doc.column_schema)
                      : doc.column_schema
                    return (
                      <TableRow key={doc.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-card-foreground text-sm">{doc.document_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {doc.sha256_hash.slice(0, 16)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-card-foreground text-sm">
                          {doc.creator_username || `User #${doc.creator_id}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Columns className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm text-card-foreground">{schema.length}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-card-foreground text-sm">{doc.row_count}</TableCell>
                        <TableCell>
                          {doc.blockchain_verified ? (
                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No documents found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
