"use client"

import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"
import { createAuthFetcher } from "@/lib/fetcher"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ClipboardList, Hash, Shield, Eye, Upload, UserCog, Clock, Lock, Unlock } from "lucide-react"
import type { AuditLog } from "@/lib/types"

function ActionIcon({ action }: { action: string }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    upload: Upload,
    view: Eye,
    verify: Shield,
    role_change: UserCog,
  }
  const Icon = icons[action] || ClipboardList
  return <Icon className="h-3.5 w-3.5" />
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    upload: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    view: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    verify: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    role_change: "bg-red-500/15 text-red-400 border-red-500/30",
  }
  return (
    <Badge variant="outline" className={`${colors[action] || "bg-muted text-muted-foreground"} flex items-center gap-1`}>
      <ActionIcon action={action} />
      {action}
    </Badge>
  )
}

export default function AuditPage() {
  const { token, user } = useAuth()
  const fetcher = createAuthFetcher(token)
  const { data: logs, isLoading } = useSWR<AuditLog[]>(token ? "/api/audit" : null, fetcher)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.role === "admin"
            ? "Complete access audit trail for all users"
            : "Your personal document access history"}
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <ClipboardList className="h-4 w-4 text-primary" />
            Access Log
          </CardTitle>
          <CardDescription>
            {logs?.length ?? 0} entries. Every document view and action is recorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Action</TableHead>
                    {user?.role === "admin" && (
                      <TableHead className="text-muted-foreground">User</TableHead>
                    )}
                    <TableHead className="text-muted-foreground">Document</TableHead>
                    <TableHead className="text-muted-foreground">Accessed</TableHead>
                    <TableHead className="text-muted-foreground">Denied</TableHead>
                    <TableHead className="text-muted-foreground">TX Hash</TableHead>
                    <TableHead className="text-muted-foreground">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-border">
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      {user?.role === "admin" && (
                        <TableCell className="text-card-foreground text-sm font-medium">
                          {log.username || `User #${log.user_id}`}
                        </TableCell>
                      )}
                      <TableCell className="text-card-foreground text-sm">
                        {log.document_name || `Doc #${log.document_id}`}
                      </TableCell>
                      <TableCell>
                        {log.accessed_columns && log.accessed_columns.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {log.accessed_columns.map((col) => (
                              <Badge key={col} variant="outline" className="text-[10px] py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                <Unlock className="h-2.5 w-2.5 mr-0.5" />
                                {col}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.denied_columns && log.denied_columns.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {log.denied_columns.map((col) => (
                              <Badge key={col} variant="outline" className="text-[10px] py-0 bg-destructive/10 text-destructive border-destructive/20">
                                <Lock className="h-2.5 w-2.5 mr-0.5" />
                                {col}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.tx_hash ? (
                          <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            <Hash className="inline h-3 w-3 mr-0.5" />
                            {log.tx_hash.slice(0, 12)}...
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No audit entries found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
